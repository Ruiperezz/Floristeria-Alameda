export const config = { runtime: 'edge' };

const VALID = new Set(['view', 'cart_add', 'wa_click']);

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }});
  }
  if (req.method !== 'POST') return resp(405, { error: 'Method not allowed' });

  let event, productId;
  try { ({ event, productId } = await req.json()); } catch { return resp(400, { error: 'Invalid JSON' }); }

  if (!VALID.has(event)) return resp(400, { error: 'Invalid event' });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return resp(200, { ok: true });

  const h   = { Authorization: `Bearer ${kvToken}` };
  const pid = String(productId ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'global';
  const day = new Date().toISOString().slice(0, 10);

  const ops = [
    post(`${kvUrl}/incr/${event}:${pid}`, h),
    post(`${kvUrl}/incr/total:${event}`, h),
    post(`${kvUrl}/incr/daily:${event}:${day}`, h),
  ];
  if (pid !== 'global') ops.push(post(`${kvUrl}/zincrby/ranking:${event}/1/${pid}`, h));

  try { await Promise.allSettled(ops); } catch { /* silent */ }
  return resp(200, { ok: true });
}

function post(url, headers) {
  return fetch(url, { method: 'POST', headers });
}

function resp(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
