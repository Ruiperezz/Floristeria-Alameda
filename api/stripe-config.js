export const config = { runtime: 'edge' };

// Devuelve la clave PUBLICABLE de Stripe al frontend de forma segura.
// La clave SECRETA NUNCA sale del servidor.
export default function handler() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  return new Response(JSON.stringify({ publishableKey }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
