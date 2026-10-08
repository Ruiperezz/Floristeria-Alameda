export const config = { runtime: 'edge' };

const VALID_EVENTS = new Set(['view', 'cart_add', 'wa_click', 'order']);
const VALID_METHODS = new Set(['stripe', 'paypal', 'bizum', 'wa']);
const VALID_DELIVERY = new Set(['domicilio', 'tienda']);

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return resp(204, null, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  }
  if (req.method !== 'POST') return resp(405, { error: 'Method not allowed' });

  let body;
  try { body = await req.json(); } catch { return resp(400, { error: 'Invalid JSON' }); }

  const { event, productId, method, delivery, amount } = body;

  if (!VALID_EVENTS.has(event)) return resp(400, { error: 'Invalid event' });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return resp(200, { ok: true });

  const h   = { Authorization: `Bearer ${kvToken}` };
  const day = new Date().toISOString().slice(0, 10);
  const ops = [];

  if (event === 'order') {
    const m = VALID_METHODS.has(method) ? method : 'stripe';
    const d = VALID_DELIVERY.has(delivery) ? delivery : 'domicilio';
    const amt = parseFloat(amount) || 0;

    ops.push(
      post(`${kvUrl}/incr/order:${m}`, h),
      post(`${kvUrl}/incr/order:total`, h),
      post(`${kvUrl}/incr/delivery:${d}`, h),
      post(`${kvUrl}/incr/daily:order:${day}`, h),
    );
    if (amt > 0) {
      // INCRBYFLOAT para acumular importe
      fetch(`${kvUrl}/incrbyfloat/revenue:${m}`, {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify([amt]),
      }).catch(() => {});
      fetch(`${kvUrl}/incrbyfloat/revenue:total`, {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify([amt]),
      }).catch(() => {});
    }
  } else {
    const pid = String(productId ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'global';
    ops.push(
      post(`${kvUrl}/incr/${event}:${pid}`, h),
      post(`${kvUrl}/incr/total:${event}`, h),
      post(`${kvUrl}/incr/daily:${event}:${day}`, h),
    );
    if (pid !== 'global') {
      ops.push(post(`${kvUrl}/zincrby/ranking:${event}/1/${pid}`, h));
    }
  }

  try { await Promise.allSettled(ops); } catch {}
  return resp(200, { ok: true });
}

function post(url, headers) {
  return fetch(url, { method: 'POST', headers });
}

function resp(status, data, extra = {}) {
  return new Response(data ? JSON.stringify(data) : null, {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extra },
  });
}
