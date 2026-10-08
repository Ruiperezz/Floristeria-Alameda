export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) {
    return new Response(JSON.stringify({ products: [] }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
    });
  }

  try {
    const r = await fetch(`${kvUrl}/get/productos`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    const d = await r.json();
    const products = d?.result ? JSON.parse(d.result) : [];

    return new Response(JSON.stringify({ products }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch {
    return new Response(JSON.stringify({ products: [] }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
