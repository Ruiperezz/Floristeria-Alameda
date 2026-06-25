export const config = { runtime: 'edge' };

const ALLOWED_ORIGINS = [
  'https://floristeriaalameda.com',
  'https://www.floristeriaalameda.com',
];

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Validar origen para prevenir peticiones cross-site no autorizadas
  const reqOrigin = request.headers.get('origin') || '';
  const origin = ALLOWED_ORIGINS.includes(reqOrigin)
    ? reqOrigin
    : ALLOWED_ORIGINS[0]; // Usa dominio principal si origen no reconocido

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return new Response(
      JSON.stringify({ error: 'STRIPE_SECRET_KEY no configurada en Vercel.' }),
      { status: 503, headers: JSON_HEADERS }
    );
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Petición inválida.' }),
      { status: 400, headers: JSON_HEADERS });
  }

  const { amount, productName, emoji, imagen, customerName, telefono, direccion,
          fecha, dedicatoria, entrega, source } = body;

  // Validar importe: debe ser número, mínimo 5€, máximo 2000€
  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount < 5 || parsedAmount > 2000) {
    return new Response(JSON.stringify({ error: 'Importe fuera de rango (5€–2000€).' }),
      { status: 400, headers: JSON_HEADERS });
  }

  // Sanitizar campos de texto (longitud máxima)
  const safeName    = String(productName  || '').slice(0, 100);
  const safeCustomer= String(customerName || '').slice(0, 80);
  const safeDedic   = String(dedicatoria  || '').slice(0, 200);
  const safeDireccion = String(direccion  || '').slice(0, 150);
  const safeEmoji   = String(emoji        || '🌸').slice(0, 5);
  const safeImagen  = String(imagen       || '').slice(0, 100);

  // Parámetros del pedido codificados en la success_url
  const params = new URLSearchParams({
    producto: safeName,
    emoji:    safeEmoji,
    precio:   parsedAmount,
    cliente:  safeCustomer,
    telefono: String(telefono || '').slice(0, 15),
    direccion: safeDireccion,
    fecha:    String(fecha    || '').slice(0, 10),
    entrega:  (entrega === 'tienda' || entrega === 'Recogida en tienda') ? 'tienda' : 'domicilio',
    dedicatoria: safeDedic,
    imagen:  safeImagen,
  });

  if (source === 'carrito') params.set('source', 'carrito');
  const successUrl = `${origin}/pago-completado.html?${params.toString()}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = `${origin}/pago-cancelado.html`;

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'payment_method_types[]':              'card',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][product_data][name]': `${safeEmoji} ${safeName}`,
      'line_items[0][price_data][product_data][description]': 'Floristería Alameda — Cartagena',
      'line_items[0][price_data][unit_amount]': String(Math.round(parsedAmount * 100)),
      'line_items[0][quantity]': '1',
      'mode':        'payment',
      'success_url': successUrl,
      'cancel_url':  cancelUrl,
      'locale':      'es',
      'metadata[negocio]': 'Floristería Alameda',
      'metadata[cliente]': safeCustomer,
    }),
  });

  const data = await res.json();
  if (data.error) {
    return new Response(JSON.stringify({ error: data.error.message }),
      { status: 400, headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ url: data.url }),
    { headers: JSON_HEADERS });
}
