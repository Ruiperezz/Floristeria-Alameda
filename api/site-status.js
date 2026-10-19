import { kvGetStatus, publicView } from './_site-status.js';

export const config = { runtime: 'edge' };

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

export default async function handler(req) {
  if (req.method !== 'GET') return reply({ error: 'Method not allowed' }, 405);

  const now = Date.now();
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return reply(publicView(null, now));

  try {
    return reply(publicView(await kvGetStatus(kvUrl, kvToken), now));
  } catch {
    return reply(publicView(null, now));
  }
}
