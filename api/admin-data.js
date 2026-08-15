export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method !== 'GET') {
    return respond({ error: 'Method not allowed' }, 405);
  }

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return respond({
      error: 'ADMIN_SECRET no está configurado. Añádelo en Vercel → Settings → Environment Variables → ADMIN_SECRET.'
    }, 503);
  }

  const auth = (request.headers.get('authorization') || '').trim();
  if (auth !== `Bearer ${adminSecret}`) {
    return respond({ error: 'Contraseña incorrecta' }, 401);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return respond({
      stats: zeroStats(),
      recentOrders: [],
      hasMore: false,
      warning: 'STRIPE_SECRET_KEY no configurado — sin datos de pedidos Stripe.'
    }, 200);
  }

  let stripeData;
  try {
    const res = await fetch(
      'https://api.stripe.com/v1/checkout/sessions?' +
        new URLSearchParams({ limit: '100', status: 'complete' }),
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );
    if (!res.ok) {
      const txt = await res.text();
      return respond({ error: `Error Stripe ${res.status}: ${txt.slice(0, 200)}` }, 502);
    }
    stripeData = await res.json();
  } catch (err) {
    return respond({ error: `Error de red al conectar con Stripe: ${err.message}` }, 502);
  }

  const sessions = stripeData.data || [];
  const now = Math.floor(Date.now() / 1000);
  const MONTH = 30 * 24 * 3600;
  const WEEK  = 7 * 24 * 3600;

  let total = 0, month = 0, week = 0;

  const recentOrders = sessions.map(s => {
    const amount = (s.amount_total || 0) / 100;
    total += amount;
    if (now - s.created < MONTH) month += amount;
    if (now - s.created < WEEK)  week  += amount;
    return {
      date: new Date(s.created * 1000).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }),
      ts: s.created,
      customer: s.metadata?.cliente || s.customer_details?.name || '—',
      email: s.customer_details?.email || '—',
      amount: amount.toFixed(2),
      paid: s.payment_status === 'paid',
    };
  });

  const n = sessions.length;

  return respond({
    stats: {
      totalOrders:  n,
      totalRevenue: total.toFixed(2),
      monthRevenue: month.toFixed(2),
      weekRevenue:  week.toFixed(2),
      avgTicket:    n > 0 ? (total / n).toFixed(2) : '0.00',
    },
    recentOrders,
    hasMore: stripeData.has_more || false,
  });
}

function zeroStats() {
  return { totalOrders: 0, totalRevenue: '0.00', monthRevenue: '0.00', weekRevenue: '0.00', avgTicket: '0.00' };
}

function respond(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
