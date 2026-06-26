// Node.js serverless — PayPal bloquea las IPs del Edge Runtime (Cloudflare)
const PAYPAL_BASE = process.env.PAYPAL_ENV === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

function toBase64(str) {
  return Buffer.from(str).toString('base64');
}

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

  if (req.method !== 'GET') {
    return res.status(405).json({ paid: false, error: 'Method not allowed' });
  }

  const token = req.query?.token || new URL(req.url, 'http://x').searchParams.get('token');

  // PayPal order IDs: alfanuméricos mayúsculas/minúsculas y guiones, 6-30 chars
  if (!token || !/^[A-Za-z0-9\-]{6,30}$/.test(token)) {
    return res.status(400).json({ paid: false, error: 'Token de orden inválido.' });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    return res.status(503).json({ paid: false, error: 'PayPal no configurado.' });
  }

  try {
    const accessToken = await getAccessToken(clientId, secret);

    const captureRes = await fetch(
      `${PAYPAL_BASE}/v2/checkout/orders/${encodeURIComponent(token)}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization':     `Bearer ${accessToken}`,
          'Content-Type':      'application/json',
          'PayPal-Request-Id': `capture-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        },
        body: '{}',
      }
    );

    const capture = await captureRes.json();

    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const isPaid      = capture.status === 'COMPLETED' && captureUnit?.status === 'COMPLETED';

    if (!isPaid) {
      const errDetail = capture.details?.[0]?.description || capture.message || 'Pago no completado';
      return res.status(400).json({ paid: false, error: errDetail });
    }

    return res.status(200).json({
      paid:      true,
      orderId:   capture.id   || token,
      captureId: captureUnit?.id || '',
      amount:    captureUnit?.amount?.value || '0',
      currency:  captureUnit?.amount?.currency_code || 'EUR',
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ paid: false, error: `PayPal: ${msg}` });
  }
}
