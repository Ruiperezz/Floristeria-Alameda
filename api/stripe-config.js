export const config = { runtime: 'edge' };

// Devuelve la clave PUBLICABLE de Stripe al frontend de forma segura.
// La clave SECRETA NUNCA sale del servidor.
export default function handler(request) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  return new Response(JSON.stringify({ publishableKey }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
