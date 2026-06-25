export const config = { runtime: 'edge' };

const FROM_PEDIDOS = 'Floristería Alameda <noreply@floristeriaalameda.com>';
const WA_LINK      = 'https://wa.me/34627546360';
const TEL          = '627 54 63 60';
const JSON_H       = { 'Content-Type': 'application/json' };

// ─── Punto de entrada ─────────────────────────────────────────────
export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Leer body como texto ANTES de parsear (necesario para verificar firma)
  const rawBody  = await request.text();
  const sigHeader = request.headers.get('stripe-signature') || '';
  const secret    = process.env.STRIPE_WEBHOOK_SECRET;

  // Verificar firma criptográfica de Stripe — rechazar si no hay secret configurado
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Webhook no configurado' }), { status: 500, headers: JSON_H });
  }
  const valid = await verifyStripeSignature(rawBody, sigHeader, secret);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Firma inválida' }), { status: 400, headers: JSON_H });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400, headers: JSON_H });
  }

  // Solo procesamos el evento de sesión completada
  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object;
    if (session?.payment_status === 'paid') {
      // No bloqueamos la respuesta a Stripe — usamos waitUntil equivalente
      handleSession(session).catch(() => {});
    }
  }

  // Responder a Stripe rápidamente (< 5s) para evitar reintentos
  return new Response(JSON.stringify({ received: true }), { headers: JSON_H });
}

// ─── Procesar sesión pagada ───────────────────────────────────────
async function handleSession(session) {
  const resendKey   = process.env.RESEND_API_KEY;
  const floristMail = process.env.FLORIST_EMAIL;
  if (!resendKey) return;

  const customerEmail = session.customer_details?.email;
  const nombre        = session.metadata?.cliente  || 'Cliente';
  const precio        = ((session.amount_total || 0) / 100).toFixed(2);
  const sessionId     = session.id;

  const envios = [];

  // Notificar al cliente si Stripe tiene su email
  if (customerEmail) {
    envios.push(sendEmail(resendKey, {
      from:    FROM_PEDIDOS,
      to:      customerEmail,
      subject: '✅ Pago confirmado — Floristería Alameda',
      html:    stripeClienteHtml({ nombre, precio, sessionId }),
    }));
  }

  // Notificar al florista
  if (floristMail) {
    envios.push(sendEmail(resendKey, {
      from:    FROM_PEDIDOS,
      to:      floristMail,
      subject: `✅ Pago Stripe — ${nombre} — ${precio}€`,
      html:    stripeFloristaHtml({ nombre, precio, sessionId, customerEmail: customerEmail || '—' }),
    }));
  }

  await Promise.allSettled(envios);
}

// ─── Envío a Resend ───────────────────────────────────────────────
async function sendEmail(apiKey, payload) {
  return fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
}

// ─── Verificación HMAC-SHA256 de Stripe (Web Crypto API) ─────────
async function verifyStripeSignature(body, signature, secret) {
  try {
    // Parsear cabecera "t=...,v1=..."
    const parts = {};
    signature.split(',').forEach(seg => {
      const i = seg.indexOf('=');
      if (i > 0) parts[seg.slice(0, i)] = seg.slice(i + 1);
    });

    const { t, v1 } = parts;
    if (!t || !v1) return false;

    // Rechazar si el timestamp tiene más de 5 minutos de antigüedad (replay attack)
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - parseInt(t, 10)) > 300) return false;

    // Calcular HMAC-SHA256(secret, "<timestamp>.<body>")
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signedPayload = `${t}.${body}`;
    const macBuffer     = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const computed      = Array.from(new Uint8Array(macBuffer))
                            .map(b => b.toString(16).padStart(2, '0')).join('');

    // Comparación en tiempo constante (previene timing attacks)
    if (computed.length !== v1.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
    }
    return diff === 0;

  } catch {
    return false;
  }
}

// ─── Template email CLIENTE (pago Stripe) ────────────────────────
function stripeClienteHtml({ nombre, precio, sessionId }) {
  const h = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago confirmado</title></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:540px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.1)">

  <tr><td style="background:linear-gradient(135deg,#506352 0%,#3d4f3f 100%);padding:30px;text-align:center">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#a5c1a7">Floristería</p>
    <h1 style="margin:0 0 6px;font-size:28px;font-weight:700;color:#fff;letter-spacing:-.5px">ALAMEDA</h1>
    <p style="margin:0;font-size:11px;color:#89aa8c;letter-spacing:.1em">· CARTAGENA ·</p>
  </td></tr>

  <tr><td style="padding:36px;text-align:center">
    <div style="width:64px;height:64px;background:#e8f5e9;border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:30px">✅</div>
    <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#2e7d32">¡Pago confirmado!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.75">
      Hola <strong style="color:#1a1c1b">${h(nombre)}</strong>, hemos recibido tu pago de
      <strong style="color:#506352;font-size:16px">${h(precio)}€</strong> correctamente
      a través de Stripe.<br><br>
      Por favor, confirma los detalles de tu pedido por WhatsApp y
      lo prepararemos con todo el cariño.
    </p>

    <div style="background:#f9f9f7;border-radius:12px;padding:16px;margin-bottom:28px;text-align:left">
      <p style="margin:0 0 6px;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.06em">
        Referencia de pago
      </p>
      <p style="margin:0;font-size:11px;color:#aaa;font-family:monospace;word-break:break-all">
        ${h(sessionId)}
      </p>
    </div>

    <a href="${WA_LINK}" style="display:inline-block;padding:16px 40px;
       background:#25D366;color:#fff;border-radius:9999px;text-decoration:none;
       font-size:15px;font-weight:700;box-shadow:0 6px 20px rgba(37,211,102,.4)">
      💬 Confirmar pedido por WhatsApp
    </a>
    <p style="margin:14px 0 0;font-size:12px;color:#aaa">
      También puedes llamarnos al
      <a href="tel:${TEL.replace(/\s/g,'')}" style="color:#506352;font-weight:600">${TEL}</a>
    </p>
  </td></tr>

  <tr><td style="background:#f4f4f2;border-top:1px solid #e8e8e6;padding:20px;text-align:center">
    <p style="margin:0 0 4px;font-size:11px;color:#bbb">© 2026 Floristería Alameda · Cartagena, España</p>
    <p style="margin:0;font-size:11px;color:#ddd">Confirmación automática — No respondas a este mensaje.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Template email FLORISTA (pago Stripe verificado) ────────────
function stripeFloristaHtml({ nombre, precio, sessionId, customerEmail }) {
  const h = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago Stripe confirmado</title></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:540px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.1)">

  <tr><td style="background:#2e7d32;padding:20px 32px;text-align:center">
    <h2 style="margin:0;font-size:20px;font-weight:700;color:#fff">✅ Pago STRIPE verificado</h2>
    <p style="margin:4px 0 0;font-size:12px;color:#a5d6a7">${h(nombre)} · ${h(precio)}€</p>
  </td></tr>

  <tr><td style="padding:28px 32px">
    <div style="background:#e8f5e9;border:2px solid #66bb6a;border-radius:10px;padding:14px 18px;margin-bottom:20px">
      <p style="margin:0;font-size:14px;font-weight:700;color:#1b5e20">
        💳 PAGO VERIFICADO — PUEDES PREPARAR EL PEDIDO
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;border-radius:12px;padding:18px">
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#888;width:120px">Cliente</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:14px;font-weight:700;color:#1a1c1b">${h(nombre)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#888">Email</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#506352">
          <a href="mailto:${h(customerEmail)}" style="color:#506352">${h(customerEmail)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#888">Importe</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:20px;font-weight:700;color:#2e7d32">${h(precio)}€</td>
      </tr>
      <tr>
        <td style="padding:8px 0 0;font-size:11px;color:#aaa" colspan="2">
          Ref: <span style="font-family:monospace;word-break:break-all">${h(sessionId)}</span>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0;font-size:13px;color:#666;text-align:center;line-height:1.6">
      El cliente recibirá un email de confirmación y te contactará<br>
      por WhatsApp con los detalles del pedido.
    </p>
  </td></tr>

  <tr><td style="background:#f4f4f2;border-top:1px solid #e8e8e6;padding:16px;text-align:center">
    <p style="margin:0;font-size:11px;color:#bbb">Sistema de pedidos automático — Floristería Alameda</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}
