import { STATUS_KEY, parseStatus, evaluate } from './api/_site-status.js';

export const config = {
  matcher: '/(.*)',
}

const ASSET = /\.(?:js|css|png|jpe?g|webp|svg|ico|gif|woff2?|ttf|txt|xml|json|map|webmanifest|mp4|pdf)$/i;

// Siempre accesibles: el aviso de cierre, los paneles del dueño y el final de un pago ya iniciado
const EXEMPT_PAGES = new Set([
  '/cerrado.html',
  '/panel_floristeriaalameda.html',
  '/admin.html',
  '/vacaciones.html',
  '/pago-completado.html',
  '/pago-cancelado.html',
  '/bizum-pago.html',
]);

// Solo se bloquea la creación de pagos nuevos; capturas, verificación y webhooks siguen activos
const BLOCKED_API = new Set([
  '/api/create-checkout-session',
  '/api/create-payment-intent',
  '/api/create-paypal-order',
]);

const TTL = 5000;
const RETRY = 2000;
let cache = { at: 0, status: null };
let inflight = null;

async function refresh(url, token) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  try {
    const r = await fetch(`${url}/get/${STATUS_KEY}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error('kv');
    const d = await r.json();
    cache = { at: Date.now(), status: parseStatus(d?.result) };
  } catch {
    cache = { at: Date.now() - TTL + RETRY, status: cache.status };
  } finally {
    clearTimeout(timer);
  }
  return cache.status;
}

function loadStatus() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (Date.now() - cache.at < TTL) return cache.status;
  if (!inflight) inflight = refresh(url, token).finally(() => { inflight = null; });
  return inflight;
}

function kind(pathname, method) {
  if (BLOCKED_API.has(pathname)) return 'api';
  if (pathname.startsWith('/api/') || pathname.startsWith('/_vercel/') || pathname.startsWith('/imgs/')) return null;
  if (ASSET.test(pathname) || EXEMPT_PAGES.has(pathname)) return null;
  if (method !== 'GET' && method !== 'HEAD') return null;
  return 'page';
}

const FALLBACK_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Cerrado temporalmente | Floristería Alameda</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1e2a1f;color:#fff;font-family:Georgia,serif;text-align:center;padding:24px"><div><h1>Cerrado temporalmente</h1><p>Floristería Alameda · Cartagena<br><a style="color:#a5c1a7" href="tel:627546360">627 54 63 60</a></p></div></body></html>`;

export default async function middleware(request) {
  try {
    const url = new URL(request.url);
    const what = kind(url.pathname, request.method);
    if (!what) return;

    const now = Date.now();
    const status = await loadStatus();
    if (evaluate(status, now).state !== 'closed') return;

    const until = status?.until ? Date.parse(status.until) : NaN;
    const retryAfter = Number.isNaN(until) ? 3600 : Math.min(86400, Math.max(60, Math.ceil((until - now) / 1000)));

    if (what === 'api') {
      return new Response(JSON.stringify({ error: 'La tienda está cerrada temporalmente.', closed: true }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Retry-After': String(retryAfter) },
      });
    }

    let html = null;
    try {
      const r = await fetch(new URL('/cerrado.html', request.url));
      if (r.ok) html = await r.text();
    } catch {}

    return new Response(request.method === 'HEAD' ? null : (html || FALLBACK_HTML), {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': String(retryAfter),
      },
    });
  } catch {
    return;
  }
}
