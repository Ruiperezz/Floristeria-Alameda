export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') return resp(405, { error: 'Method not allowed' });

  const secret = process.env.ADMIN_SECRET;
  if (!secret) return resp(503, { error: 'ADMIN_SECRET not configured' });
  if (req.headers.get('Authorization') !== `Bearer ${secret}`) return resp(401, { error: 'Unauthorized' });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return resp(200, { configured: false });

  const h = { Authorization: `Bearer ${kvToken}` };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  try {
    const results = await Promise.all([
      // rankings
      kv(`${kvUrl}/zrange/ranking:view/0/9?rev=true&withscores=true`, h),
      kv(`${kvUrl}/zrange/ranking:cart_add/0/9?rev=true&withscores=true`, h),
      kv(`${kvUrl}/zrange/ranking:wa_click/0/9?rev=true&withscores=true`, h),
      // totals eventos
      kv(`${kvUrl}/get/total:view`, h),
      kv(`${kvUrl}/get/total:cart_add`, h),
      kv(`${kvUrl}/get/total:wa_click`, h),
      // pedidos por método
      kv(`${kvUrl}/get/order:stripe`, h),
      kv(`${kvUrl}/get/order:paypal`, h),
      kv(`${kvUrl}/get/order:bizum`, h),
      kv(`${kvUrl}/get/order:wa`, h),
      kv(`${kvUrl}/get/order:total`, h),
      // tipo de entrega
      kv(`${kvUrl}/get/delivery:domicilio`, h),
      kv(`${kvUrl}/get/delivery:tienda`, h),
      // ingresos por método
      kv(`${kvUrl}/get/revenue:stripe`, h),
      kv(`${kvUrl}/get/revenue:paypal`, h),
      kv(`${kvUrl}/get/revenue:bizum`, h),
      kv(`${kvUrl}/get/revenue:total`, h),
      // daily: visitas + carrito + wa + pedidos (7 días × 4 eventos)
      ...days.flatMap(d => [
        kv(`${kvUrl}/get/daily:view:${d}`, h),
        kv(`${kvUrl}/get/daily:cart_add:${d}`, h),
        kv(`${kvUrl}/get/daily:wa_click:${d}`, h),
        kv(`${kvUrl}/get/daily:order:${d}`, h),
      ]),
    ]);

    const [rv, rc, rw, tv, tc, tw,
           oStripe, oPaypal, oBizum, oWa, oTotal,
           dDomicilio, dTienda,
           revStripe, revPaypal, revBizum, revTotal,
           ...daily] = results;

    return resp(200, {
      configured: true,
      totals: {
        views:    num(tv),
        cartAdds: num(tc),
        waClicks: num(tw),
      },
      orders: {
        total:   num(oTotal),
        stripe:  num(oStripe),
        paypal:  num(oPaypal),
        bizum:   num(oBizum),
        wa:      num(oWa),
      },
      delivery: {
        domicilio: num(dDomicilio),
        tienda:    num(dTienda),
      },
      revenue: {
        total:  flt(revTotal),
        stripe: flt(revStripe),
        paypal: flt(revPaypal),
        bizum:  flt(revBizum),
      },
      topViews:    ranking(rv),
      topCartAdds: ranking(rc),
      topWAClicks: ranking(rw),
      trends: days.map((date, i) => ({
        date,
        views:    num(daily[i * 4]),
        cartAdds: num(daily[i * 4 + 1]),
        waClicks: num(daily[i * 4 + 2]),
        orders:   num(daily[i * 4 + 3]),
      })),
    });
  } catch {
    return resp(500, { error: 'KV error' });
  }
}

function kv(url, headers) {
  return fetch(url, { headers }).then(r => r.json());
}
function num(d) { return parseInt(d?.result || 0) || 0; }
function flt(d) { return parseFloat(d?.result || 0) || 0; }

function ranking(raw) {
  const arr = raw?.result || [];
  const out = [];
  for (let i = 0; i < arr.length; i += 2) {
    out.push({ id: arr[i], count: parseInt(arr[i + 1]) || 0 });
  }
  return out;
}

function resp(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
