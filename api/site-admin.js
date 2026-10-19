import { kvGetStatus, kvSetStatus, buildStatus, publicView } from './_site-status.js';

export const config = { runtime: 'edge' };

function reply(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export default async function handler(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return reply(503, { error: 'Not configured' });
  if (req.headers.get('Authorization') !== `Bearer ${secret}`) return reply(401, { error: 'Unauthorized' });

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return reply(503, { error: 'KV not configured', configured: false });

  try {
    if (req.method === 'GET') {
      const status = await kvGetStatus(kvUrl, kvToken);
      return reply(200, { configured: true, status, view: publicView(status) });
    }

    if (req.method === 'POST') {
      let body;
      try { body = await req.json(); } catch { return reply(400, { error: 'Invalid JSON' }); }
      const now = Date.now();
      const { value, error } = buildStatus(body, now);
      if (error) return reply(400, { error });
      await kvSetStatus(kvUrl, kvToken, value);
      return reply(200, { configured: true, status: value, view: publicView(value, now) });
    }

    return reply(405, { error: 'Method not allowed' });
  } catch (e) {
    return reply(500, { error: 'Error en KV: ' + e.message });
  }
}
