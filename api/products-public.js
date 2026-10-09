import { kvGetProducts } from './_products-kv.js';

export const config = { runtime: 'edge' };

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: HEADERS });
  }

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return new Response(JSON.stringify({ products: [] }), { headers: HEADERS });

  try {
    return new Response(JSON.stringify({ products: await kvGetProducts(kvUrl, kvToken) }), { headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ products: [] }), { headers: HEADERS });
  }
}
