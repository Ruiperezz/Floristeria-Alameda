export const config = { runtime: 'edge' };

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

// Stripe session IDs: cs_test_... o cs_live_... con caracteres alfanuméricos
const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{30,}$/;

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId || !SESSION_RE.test(sessionId)) {
    return new Response(JSON.stringify({ paid: false, error: 'Session ID inválido.' }),
      { status: 400, headers: JSON_HEADERS });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return new Response(JSON.stringify({ paid: false, error: 'No configurado.' }),
      { status: 503, headers: JSON_HEADERS });
  }

  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { headers: { 'Authorization': `Bearer ${stripeKey}` } }
  );

  const session = await res.json();

  if (session.error) {
    // No exponer detalles internos de Stripe al cliente
    return new Response(JSON.stringify({ paid: false, error: 'No se pudo verificar el pago.' }),
      { status: 400, headers: JSON_HEADERS });
  }

  const isPaid = session.payment_status === 'paid';

  return new Response(
    JSON.stringify({
      paid:            isPaid,
      paymentIntentId: session.payment_intent || '',
      amountTotal:     session.amount_total   || 0,
      currency:        session.currency       || 'eur',
    }),
    { headers: JSON_HEADERS }
  );
}
