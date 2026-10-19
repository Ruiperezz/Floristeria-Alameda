import {
  kvGetProducts, kvSetProducts, sanitizeList, normalize, isValid,
  isImageData, kvSetImage, kvDelImage,
} from './_products-kv.js';

export const config = { runtime: 'edge' };

const now = () => Date.now();

function resp(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export default async function handler(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return resp(503, { error: 'Not configured' });
  if (req.headers.get('Authorization') !== `Bearer ${secret}`) return resp(401, { error: 'Unauthorized' });

  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return resp(503, { error: 'KV not configured', configured: false });

  try {
    if (req.method === 'GET') {
      return resp(200, { products: await kvGetProducts(kvUrl, kvToken), configured: true });
    }

    if (req.method === 'POST') {
      let body;
      try { body = await req.json(); } catch { return resp(400, { error: 'Invalid JSON' }); }

      if (Array.isArray(body.products)) {
        const list = sanitizeList(body.products);
        await kvSetProducts(kvUrl, kvToken, list);
        return resp(200, { ok: true, count: list.length });
      }

      const raw = body.product;
      const newImage = raw && raw.imgData;
      if (newImage !== undefined && newImage !== null && !isImageData(newImage)) {
        return resp(400, { error: 'La foto no es válida o pesa demasiado. Prueba con otra imagen.' });
      }
      const product = raw && normalize(raw);
      if (!isValid(product)) return resp(400, { error: 'Producto no válido: revisa ID, nombre y precio' });
      if (newImage) {
        await kvSetImage(kvUrl, kvToken, product.id, newImage);
        product.img = `/api/product-image?id=${product.id}&v=${now()}`;
      }
      const all = await kvGetProducts(kvUrl, kvToken);
      const idx = all.findIndex(p => p.id === product.id);
      if (idx >= 0) all[idx] = product; else all.push(product);
      await kvSetProducts(kvUrl, kvToken, all);
      return resp(200, { ok: true, product });
    }

    if (req.method === 'DELETE') {
      let body;
      try { body = await req.json(); } catch { return resp(400, { error: 'Invalid JSON' }); }
      if (!body.id) return resp(400, { error: 'Missing id' });
      const all = await kvGetProducts(kvUrl, kvToken);
      await kvSetProducts(kvUrl, kvToken, all.filter(p => p.id !== body.id));
      await kvDelImage(kvUrl, kvToken, String(body.id).replace(/[^A-Za-z0-9_-]/g, '')).catch(() => {});
      return resp(200, { ok: true });
    }

    return resp(405, { error: 'Method not allowed' });
  } catch (e) {
    return resp(500, { error: 'Error en KV: ' + e.message });
  }
}
