const CATS = new Set(['rosas', 'mixtos', 'orquideas', 'primavera', 'tanatorio']);
const MAX_BYTES = 900_000;

function flatten(v, depth = 0) {
  if (depth > 25) return [];
  if (typeof v === 'string') {
    try { return flatten(JSON.parse(v), depth + 1); } catch { return []; }
  }
  if (Array.isArray(v)) return v.flatMap(x => flatten(x, depth + 1));
  if (v && typeof v === 'object' && typeof v.id === 'string') return [v];
  return [];
}

export function normalize(p) {
  const out = { ...p };
  const cat = p.categoria || p.cat;
  delete out.cat;
  if (CATS.has(cat)) out.categoria = cat; else delete out.categoria;
  if (typeof out.img === 'string' && out.img && !out.img.includes('/') && !out.img.startsWith('data:')) {
    out.img = 'imgs/' + out.img;
  }
  if (!out.img) delete out.img;
  for (const k of ['descripcion', 'emoji']) {
    if (typeof out[k] !== 'string' || !out[k].trim()) delete out[k];
    else out[k] = out[k].trim().slice(0, 1000);
  }
  if (out.oculto) out.oculto = true; else delete out.oculto;
  out.precio = Number(p.precio);
  return out;
}

export function isValid(p) {
  return p && /^[A-Za-z0-9_-]{1,20}$/.test(p.id || '')
    && typeof p.nombre === 'string' && p.nombre.trim().length > 0 && p.nombre.length <= 200
    && Number.isFinite(Number(p.precio)) && Number(p.precio) > 0 && Number(p.precio) < 100000;
}

export function sanitizeList(raw) {
  const byId = new Map();
  for (const p of flatten(raw)) {
    const n = normalize(p);
    if (isValid(n)) byId.set(n.id, n);
  }
  return [...byId.values()];
}

export async function kvGetProducts(url, token) {
  const r = await fetch(`${url}/get/productos`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`KV get failed: ${r.status}`);
  const d = await r.json();
  return sanitizeList(d?.result ?? []);
}

export async function kvSetProducts(url, token, products) {
  const value = JSON.stringify(products);
  if (value.length > MAX_BYTES) throw new Error('Catálogo demasiado grande: reduce el tamaño de las imágenes');
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', 'productos', value]),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error || d.result !== 'OK') throw new Error(d.error || `KV set failed: ${r.status}`);
}
