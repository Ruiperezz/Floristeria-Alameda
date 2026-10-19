import { kvGetImage } from './_products-kv.js';

export const config = { runtime: 'edge' };

const MISSING = { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' };

export default async function handler(req) {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: MISSING });

  const id = new URL(req.url).searchParams.get('id') || '';
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(id)) return new Response('Not found', { status: 404, headers: MISSING });

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return new Response('Not found', { status: 404, headers: MISSING });

  try {
    const data = await kvGetImage(kvUrl, kvToken, id);
    const m = typeof data === 'string' && /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(data);
    if (!m) return new Response('Not found', { status: 404, headers: MISSING });
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(bytes, {
      headers: {
        'Content-Type': m[1],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch {
    return new Response('Error', { status: 502, headers: MISSING });
  }
}
