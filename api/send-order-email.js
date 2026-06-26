export const config = { runtime: 'edge' };

const FROM_PEDIDOS = 'Floristería Alameda <noreply@floristeriaalameda.com>';
const WA_LINK      = 'https://wa.me/34627546360';
const TEL          = '627 54 63 60';
const JSON_H       = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const resendKey   = process.env.RESEND_API_KEY;
  const floristMail = process.env.FLORIST_EMAIL;

  // Si Resend no está configurado respondemos OK para no romper el flujo del pedido
  if (!resendKey) {
    return new Response(JSON.stringify({ ok: true, note: 'RESEND_API_KEY no configurada' }), { headers: JSON_H });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Cuerpo inválido' }), { status: 400, headers: JSON_H });
  }

  const { email, tipo, producto, emoji, precio, nombre, telefono,
          fecha, direccion, dedicatoria, ref } = body;

  const clienteEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;

  // Sanitizar todos los campos contra XSS en el HTML del email
  const h = s => String(s || '').slice(0, 400)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const tipoLabel  = tipo === 'bizum' ? 'Bizum' : tipo === 'paypal' ? 'PayPal' : 'Tarjeta';
  const hasRef     = ref && ref.trim().length >= 5;
  const refSafe    = hasRef ? h(ref) : null;
  const isManual   = tipoLabel !== 'Tarjeta';

  const envios = [];

  // ─── Email al cliente (solo si proporcionó email) ──────────────
  if (clienteEmail) {
    envios.push(sendEmail(resendKey, {
      from:    FROM_PEDIDOS,
      to:      clienteEmail,
      subject: '✅ Pedido recibido — Floristería Alameda',
      html:    clienteHtml({
        emoji: h(emoji), producto: h(producto), precio: h(precio),
        nombre: h(nombre), telefono: h(telefono), fecha: h(fecha),
        direccion: h(direccion), dedicatoria: h(dedicatoria),
        tipoLabel, refSafe,
      }),
    }));
  }

  // ─── Notificación al florista (SIEMPRE) ──────────────────────────
  if (floristMail) {
    envios.push(
      sendEmail(resendKey, {
        from:    FROM_PEDIDOS,
        to:      floristMail,
        subject: `🌸 Nuevo pedido ${tipoLabel} — ${h(nombre)} — ${h(precio)}`,
        html:    floristaHtml({
          emailCliente: h(clienteEmail || ''),
          emoji: h(emoji), producto: h(producto), precio: h(precio),
          nombre: h(nombre), telefono: h(telefono), fecha: h(fecha),
          direccion: h(direccion), dedicatoria: h(dedicatoria),
          tipoLabel, refSafe, isManual,
        }),
      })
    );
  }

  const results = await Promise.allSettled(envios);
  const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value && !r.value.ok));
  if (failures.length > 0) {
    console.error('Email send failures:', failures.length, '/', results.length);
  }

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_H });
}

// ─── Envío genérico a Resend ──────────────────────────────────────
async function sendEmail(apiKey, payload) {
  return fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
}

// ─── Fila de detalle en el email ──────────────────────────────────
function fila(label, valor) {
  return `<tr>
    <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#666;width:130px;vertical-align:top">${label}</td>
    <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;color:#1a1c1b;font-weight:600">${valor}</td>
  </tr>`;
}

// ─── Email para el CLIENTE ────────────────────────────────────────
function clienteHtml({ emoji, producto, precio, nombre, telefono, fecha,
                       direccion, dedicatoria, tipoLabel, refSafe }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pedido recibido</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px">

  <table width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;
         overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.10)">

    <!-- CABECERA -->
    <tr>
      <td style="background:linear-gradient(135deg,#506352 0%,#3d4f3f 100%);
                 padding:32px;text-align:center">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;
                  text-transform:uppercase;color:#a5c1a7">Floristería</p>
        <h1 style="margin:0 0 6px;font-size:30px;font-weight:700;
                   color:#ffffff;letter-spacing:-.5px">ALAMEDA</h1>
        <p style="margin:0;font-size:11px;color:#89aa8c;letter-spacing:.12em">· CARTAGENA ·</p>
      </td>
    </tr>

    <!-- CONFIRMACIÓN -->
    <tr>
      <td style="padding:36px 36px 0;text-align:center">
        <div style="width:64px;height:64px;background:#e8f5e9;border-radius:50%;
                    margin:0 auto 16px;line-height:64px;font-size:32px">✅</div>
        <h2 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#2e7d32">
          ¡Pedido recibido!
        </h2>
        <p style="margin:0;font-size:14px;color:#666;line-height:1.75">
          Hola <strong style="color:#1a1c1b">${nombre}</strong>,<br>
          hemos registrado tu pedido correctamente.<br>
          Te contactaremos por WhatsApp para confirmar los detalles.
        </p>
      </td>
    </tr>

    <!-- PRODUCTO -->
    <tr>
      <td style="padding:28px 36px 0">
        <div style="background:#f9f9f7;border-radius:14px;padding:20px;text-align:center">
          <div style="font-size:42px;margin-bottom:8px">${emoji}</div>
          <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#1a1c1b">${producto}</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#506352">${precio}€</p>
        </div>
      </td>
    </tr>

    <!-- DETALLE DEL PEDIDO -->
    <tr>
      <td style="padding:24px 36px 0">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.08em;
                  text-transform:uppercase;color:#506352">Datos del pedido</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${fila('Destinatario/a', nombre)}
          ${fila('Teléfono', telefono)}
          ${fila('Fecha de entrega', `<span style="color:#ba1a1a">${fecha}</span>`)}
          ${direccion ? fila('Dirección', direccion) : fila('Entrega', 'Recogida en tienda')}
          ${dedicatoria ? fila('Dedicatoria', `<em style="color:#7b535c">"${dedicatoria}"</em>`) : ''}
          ${fila('Forma de pago', tipoLabel)}
          ${refSafe ? fila('Referencia', `<code style="background:#e8f5e9;padding:2px 8px;border-radius:4px;color:#2e7d32;font-size:12px">${refSafe}</code>`) : ''}
        </table>
      </td>
    </tr>

    <!-- BOTÓN WHATSAPP -->
    <tr>
      <td style="padding:28px 36px">
        <div style="text-align:center">
          <a href="${WA_LINK}" style="display:inline-block;padding:15px 36px;
             background:#25D366;color:#ffffff;border-radius:9999px;
             text-decoration:none;font-size:15px;font-weight:700;
             box-shadow:0 4px 16px rgba(37,211,102,.35)">
            💬 Confirmar pedido por WhatsApp
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:#999">
            También puedes llamarnos: <a href="tel:${TEL.replace(/\s/g,'')}"
            style="color:#506352;font-weight:600">${TEL}</a>
          </p>
        </div>
      </td>
    </tr>

    <!-- PIE -->
    <tr>
      <td style="background:#f4f4f2;border-top:1px solid #e8e8e6;
                 padding:20px 36px;text-align:center">
        <p style="margin:0 0 4px;font-size:11px;color:#aaa">
          © 2026 Floristería Alameda · Cartagena, España
        </p>
        <p style="margin:0;font-size:11px;color:#ccc">
          Este email es una confirmación automática. Por favor no respondas a este mensaje.
        </p>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}

// ─── Email para el FLORISTA ───────────────────────────────────────
function floristaHtml({ emailCliente, emoji, producto, precio, nombre, telefono,
                        fecha, direccion, dedicatoria, tipoLabel, refSafe, isManual }) {
  const estadoPago = isManual
    ? `<tr><td colspan="2">
        <div style="background:#fff8e1;border:2px solid #ffc107;border-radius:8px;
                    padding:12px 16px;margin-bottom:8px">
          <p style="margin:0;font-size:13px;font-weight:700;color:#856404">
            ⚠️ VERIFICAR PAGO ANTES DE PREPARAR
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:#856404">
            Pago por ${tipoLabel} · Localizador:
            <strong style="font-size:14px;letter-spacing:.05em">${refSafe || 'No indicado'}</strong>
          </p>
        </div>
      </td></tr>`
    : `<tr><td colspan="2">
        <div style="background:#e8f5e9;border:2px solid #4caf50;border-radius:8px;
                    padding:12px 16px;margin-bottom:8px">
          <p style="margin:0;font-size:13px;font-weight:700;color:#2e7d32">
            ✅ PAGO VERIFICADO POR STRIPE — PUEDES PREPARAR EL PEDIDO
          </p>
        </div>
      </td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nuevo pedido</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:32px 16px">

  <table width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;
         overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.10)">

    <!-- CABECERA -->
    <tr>
      <td style="background:#506352;padding:20px 32px;text-align:center">
        <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#ffffff">
          🌸 Nuevo pedido recibido
        </h2>
        <p style="margin:0;font-size:12px;color:#b0c9b2">
          ${tipoLabel} · ${precio}€ · ${nombre}
        </p>
      </td>
    </tr>

    <!-- CUERPO -->
    <tr>
      <td style="padding:28px 32px">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${estadoPago}
          <tr>
            <td style="padding:16px;background:#f9f9f7;border-radius:12px" colspan="2">
              <div style="text-align:center;margin-bottom:16px">
                <span style="font-size:32px">${emoji}</span>
                <p style="margin:6px 0 4px;font-size:16px;font-weight:700;color:#1a1c1b">
                  ${producto}
                </p>
                <p style="margin:0;font-size:22px;font-weight:700;color:#506352">${precio}€</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${fila('Destinatario/a', nombre)}
                ${fila('Teléfono', `<a href="tel:${telefono.replace(/\s/g,'')}" style="color:#506352">${telefono}</a>`)}
                ${emailCliente ? fila('Email cliente', `<a href="mailto:${emailCliente}" style="color:#506352">${emailCliente}</a>`) : ''}
                ${fila('Fecha entrega', `<strong style="color:#ba1a1a;font-size:15px">${fecha}</strong>`)}
                ${direccion ? fila('Dirección', direccion) : fila('Entrega', 'Recogida en tienda')}
                ${dedicatoria ? fila('Dedicatoria', `<em style="color:#7b535c">"${dedicatoria}"</em>`) : ''}
                ${fila('Pago', tipoLabel)}
                ${refSafe ? fila('Referencia', `<code style="background:#e3f2fd;padding:2px 8px;border-radius:4px;color:#1976d2;font-size:13px;letter-spacing:.04em">${refSafe}</code>`) : ''}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- PIE -->
    <tr>
      <td style="background:#f4f4f2;border-top:1px solid #e8e8e6;
                 padding:16px 32px;text-align:center">
        <p style="margin:0;font-size:11px;color:#aaa">
          Sistema de pedidos automático — Floristería Alameda
        </p>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}
