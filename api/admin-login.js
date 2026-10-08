export const config = { runtime: 'edge' };

// Credenciales del panel — para cambiarlas edita estas líneas y redespliega
const ACCOUNTS = [
  { name: 'floristeria-lalo',  pass: 'floristeriaalameda_2026', role: 'Floristería' },
  { name: process.env.ADMIN_USER_2 || 'ruiperezz', pass: process.env.ADMIN_PASS_2 || '', role: 'Desarrollador' },
].filter(a => a.name && a.pass);

export default async function handler(req) {
  if (req.method !== 'POST') return resp(405, { error: 'Method not allowed' });

  let user, password;
  try { ({ user, password } = await req.json()); } catch { return resp(400, { error: 'JSON inválido' }); }

  if (!user || !password) return resp(400, { error: 'Faltan campos' });

  const secret = process.env.ADMIN_SECRET;
  if (!secret) return resp(503, { error: 'Panel no configurado. Añade ADMIN_SECRET en Vercel.' });

  const match = ACCOUNTS.find(a => a.name === user && a.pass === password);
  if (!match) return resp(401, { error: 'Usuario o contraseña incorrectos.' });

  return resp(200, { token: secret, displayName: match.role, user: match.name });
}

function resp(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
