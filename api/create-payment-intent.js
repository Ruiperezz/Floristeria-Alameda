export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return new Response(
      JSON.stringify({ error: 'Pasarela de pago no configurada. Contacta con la tienda.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Solicitud inválida.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { amount, description } = body;
  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 2000) {
    return new Response(JSON.stringify({ error: 'Importe fuera de rango (1€–2000€).' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const safeDescription = String(description || 'Pedido Floristería Alameda').slice(0, 100);

  // Crear Payment Intent en Stripe
  // Los datos de tarjeta NUNCA pasan por aquí — Stripe.js los gestiona directamente
  const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: String(Math.round(parsedAmount * 100)), // Stripe trabaja en céntimos
      currency: 'eur',
      description: safeDescription,
      'payment_method_types[]': 'card',
      'metadata[negocio]': 'Floristería Alameda',
    }),
  });

  const data = await stripeRes.json();

  if (data.error) {
    return new Response(JSON.stringify({ error: data.error.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ clientSecret: data.client_secret }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
