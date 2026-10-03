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
    const [rv, rc, rw, tv, tc, tw, ...daily] = await Promise.all([
      kv(`${kvUrl}/zrange/ranking:view/0/9?rev=true&withscores=true`, h),
      kv(`${kvUrl}/zrange/ranking:cart_add/0/9?rev=true&withscores=true`, h),
      kv(`${kvUrl}/zrange/ranking:wa_click/0/9?rev=true&withscores=true`, h),
      kv(`${kvUrl}/get/total:view`, h),
      kv(`${kvUrl}/get/total:cart_add`, h),
      kv(`${kvUrl}/get/total:wa_click`, h),
      ...days.flatMap(d => ['view', 'cart_add', 'wa_click'].map(ev =>
        kv(`${kvUrl}/get/daily:${ev}:${d}`, h)
      )),
    ]);

    return resp(200, {
      configured: true,
      totals: {
        views:    parseInt(tv?.result  || 0),
        cartAdds: parseInt(tc?.result  || 0),
        waClicks: parseInt(tw?.result  || 0),
      },
      topViews:    ranking(rv),
      topCartAdds: ranking(rc),
      topWAClicks: ranking(rw),
      trends: days.map((date, i) => ({
        date,
        views:    parseInt(daily[i * 3]?.result     || 0),
        cartAdds: parseInt(daily[i * 3 + 1]?.result || 0),
        waClicks: parseInt(daily[i * 3 + 2]?.result || 0),
      })),
    });
  } catch {
    return resp(500, { error: 'KV error' });
  }
}

function kv(url, headers) {
  return fetch(url, { headers }).then(r => r.json());
}

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
