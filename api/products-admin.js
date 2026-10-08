export const config = { runtime: 'edge' };

function resp(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function kvGet(url, token) {
  const r = await fetch(`${url}/get/productos`, { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json();
  if (!d?.result) return [];
  try { return JSON.parse(d.result); } catch { return []; }
}

async function kvSet(url, token, products) {
  const r = await fetch(`${url}/set/productos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([JSON.stringify(products)]),
  });
  if (!r.ok) throw new Error(`KV set failed: ${r.status}`);
}

export default async function handler(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return resp(503, { error: 'Not configured' });
  if (req.headers.get('Authorization') !== `Bearer ${secret}`) return resp(401, { error: 'Unauthorized' });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return resp(503, { error: 'KV not configured', configured: false });

  if (req.method === 'GET') {
    return resp(200, { products: await kvGet(kvUrl, kvToken), configured: true });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return resp(400, { error: 'Invalid JSON' }); }

    // Bulk sync (initial import of all products)
    if (body.products && Array.isArray(body.products)) {
      await kvSet(kvUrl, kvToken, body.products);
      return resp(200, { ok: true, count: body.products.length });
    }

    // Single product upsert
    const { product } = body;
    if (!product?.id || !product?.nombre || product?.precio === undefined) {
      return resp(400, { error: 'Faltan campos: id, nombre, precio' });
    }
    try {
      const all = await kvGet(kvUrl, kvToken);
      const idx = all.findIndex(p => p.id === product.id);
      if (idx >= 0) all[idx] = product;
      else all.push(product);
      await kvSet(kvUrl, kvToken, all);
    } catch (e) {
      return resp(500, { error: 'Error al guardar en KV: ' + e.message });
    }
    return resp(200, { ok: true, product });
  }

  if (req.method === 'DELETE') {
    let body;
    try { body = await req.json(); } catch { return resp(400, { error: 'Invalid JSON' }); }
    const { id } = body;
    if (!id) return resp(400, { error: 'Missing id' });
    const all = await kvGet(kvUrl, kvToken);
    await kvSet(kvUrl, kvToken, all.filter(p => p.id !== id));
    return resp(200, { ok: true });
  }

  return resp(405, { error: 'Method not allowed' });
}
