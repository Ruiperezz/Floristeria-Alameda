// Node.js serverless — PayPal bloquea las IPs del Edge Runtime (Cloudflare)
const PAYPAL_BASE = process.env.PAYPAL_ENV === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

const ALLOWED_ORIGINS = [
  'https://floristeriaalameda.com',
  'https://www.floristeriaalameda.com',
];

// ── Base64 con Buffer nativo de Node.js ───────────────────────────
function toBase64(str) {
  return Buffer.from(str).toString('base64');
}

// ── Obtener access token OAuth2 ───────────────────────────────────
async function getAccessToken(clientId, secret) {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${toBase64(`${clientId}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => String(res.status));
    throw new Error(`Auth PayPal ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token vacio: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Handler Node.js serverless ────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    return res.status(503).json({ error: 'PayPal no está configurado aún. Usa Bizum o Tarjeta.' });
  }

  const body = req.body || {};
  const { amount, productName, emoji, imagen, customerName, telefono,
          direccion, fecha, dedicatoria, entrega, source } = body;

  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount < 5 || parsedAmount > 2000) {
    return res.status(400).json({ error: 'Importe fuera de rango (5€–2000€).' });
  }

  const reqOrigin = req.headers['origin'] || '';
  const origin = ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0];

  const safeName     = String(productName  || '').slice(0, 100);
  const safeCustomer = String(customerName || '').slice(0, 80);
  const safeDedic    = String(dedicatoria  || '').slice(0, 200);
  const safeDir      = String(direccion    || '').slice(0, 150);
  const safeEmoji    = String(emoji        || '🌸').slice(0, 5);
  const safeImagen   = String(imagen       || '').slice(0, 100);
  const safeTel      = String(telefono     || '').slice(0, 15);
  const safeFecha    = String(fecha        || '').slice(0, 10);
  const safeEntrega  = (entrega === 'tienda' || entrega === 'Recogida en tienda') ? 'tienda' : 'domicilio';

  const params = new URLSearchParams({
    producto:    safeName,
    emoji:       safeEmoji,
    precio:      parsedAmount,
    cliente:     safeCustomer,
    telefono:    safeTel,
    direccion:   safeDir,
    fecha:       safeFecha,
    entrega:     safeEntrega,
    dedicatoria: safeDedic,
    imagen:      safeImagen,
    method:      'paypal',
  });
  if (source === 'carrito') params.set('source', 'carrito');

  const returnUrl = `${origin}/pago-completado.html?${params.toString()}`;
  const cancelUrl = `${origin}/pago-cancelado.html`;

  try {
    const accessToken = await getAccessToken(clientId, secret);

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization':     `Bearer ${accessToken}`,
        'Content-Type':      'application/json',
        'PayPal-Request-Id': `alameda-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        'Prefer':            'return=minimal',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: parsedAmount.toFixed(2) },
          description: `${safeEmoji} ${safeName} — Floristería Alameda`,
          custom_id:   safeCustomer,
          soft_descriptor: 'FLORISTERIA ALAMEDA',
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name:          'Floristería Alameda',
              locale:              'es-ES',
              landing_page:        'LOGIN',
              shipping_preference: 'NO_SHIPPING',
              user_action:         'PAY_NOW',
              return_url:          returnUrl,
              cancel_url:          cancelUrl,
            },
          },
        },
      }),
    });

    const order = await orderRes.json();
    const approvalLink = order.links?.find(l => l.rel === 'payer-action')?.href;

    if (!approvalLink) {
      const errMsg = order.details?.[0]?.description || order.message || 'No se obtuvo enlace de pago';
      return res.status(400).json({ error: errMsg });
    }

    return res.status(200).json({ url: approvalLink });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: `PayPal: ${msg}` });
  }
}
