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

const LOGO_URL = 'https://floristeriaalameda.com/logo-floristeria.jpg';

// ─── Fila de detalle en el email ──────────────────────────────────
function fila(label, valor) {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #ece9e4;font-size:12px;
               font-weight:600;letter-spacing:.04em;color:#8da18e;
               text-transform:uppercase;width:140px;vertical-align:top">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #ece9e4;font-size:14px;
               color:#1a1c1b;font-weight:500">${valor}</td>
  </tr>`;
}

// ─── Cabecera común con logo ──────────────────────────────────────
function header() {
  return `
  <tr>
    <td style="background:linear-gradient(160deg,#3d4f3f 0%,#506352 60%,#5e7360 100%);
               padding:36px 40px;text-align:center">
      <img src="${LOGO_URL}" alt="Floristería Alameda"
           width="80" height="80"
           style="border-radius:50%;border:3px solid rgba(255,255,255,0.25);
                  object-fit:cover;display:block;margin:0 auto 16px"/>
      <p style="margin:0 0 2px;font-size:11px;letter-spacing:.2em;
                text-transform:uppercase;color:#a5c1a7;font-weight:600">Floristería</p>
      <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#ffffff;
                letter-spacing:.06em;font-family:Georgia,serif">ALAMEDA</p>
      <p style="margin:0;font-size:10px;color:#8da18e;letter-spacing:.18em">
        · CARTAGENA ·
      </p>
    </td>
  </tr>`;
}

// ─── Pie común ────────────────────────────────────────────────────
function footer() {
  return `
  <tr>
    <td style="background:#f9f9f7;border-top:2px solid #ece9e4;padding:24px 40px;text-align:center">
      <p style="margin:0 0 6px">
        <a href="https://floristeriaalameda.com"
           style="font-size:13px;font-weight:700;color:#506352;text-decoration:none;
                  letter-spacing:.04em">floristeriaalameda.com</a>
      </p>
      <p style="margin:0 0 2px;font-size:11px;color:#aaa">
        Alameda de San Antón, 15 · 30205 Cartagena, Murcia
      </p>
      <p style="margin:0;font-size:11px;color:#ccc">
        © ${new Date().getFullYear()} Floristería Alameda — Confirmación automática
      </p>
    </td>
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
<title>Pedido confirmado — Floristería Alameda</title>
</head>
<body style="margin:0;padding:0;background:#ece9e4;font-family:Georgia,'Times New Roman',serif">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding:32px 16px">

  <table width="100%" style="max-width:580px" cellpadding="0" cellspacing="0" role="presentation">

    ${header()}

    <!-- CONFIRMACIÓN -->
    <tr>
      <td style="background:#ffffff;padding:40px 40px 28px;text-align:center;
                 border-left:1px solid #ece9e4;border-right:1px solid #ece9e4">
        <div style="width:56px;height:56px;border-radius:50%;background:#eef3ee;
                    margin:0 auto 18px;display:flex;align-items:center;
                    justify-content:center;font-size:26px;line-height:56px">✅</div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1a1c1b;
                   font-family:Georgia,serif;letter-spacing:-.3px">
          Pedido confirmado
        </h1>
        <p style="margin:0;font-size:14px;color:#737872;line-height:1.8;
                  font-family:'Helvetica Neue',Arial,sans-serif">
          Hola <strong style="color:#1a1c1b">${nombre}</strong>, hemos recibido tu pedido.<br>
          Nos pondremos en contacto contigo por WhatsApp para coordinar la entrega.
        </p>
      </td>
    </tr>

    <!-- SEPARADOR DECORATIVO -->
    <tr>
      <td style="background:#ffffff;padding:0 40px;
                 border-left:1px solid #ece9e4;border-right:1px solid #ece9e4">
        <div style="border-top:1px solid #ece9e4"></div>
      </td>
    </tr>

    <!-- PRODUCTO -->
    <tr>
      <td style="background:#ffffff;padding:28px 40px;
                 border-left:1px solid #ece9e4;border-right:1px solid #ece9e4">
        <div style="background:#f9f9f7;border-radius:16px;padding:24px;text-align:center;
                    border:1px solid #ece9e4">
          <div style="font-size:48px;line-height:1;margin-bottom:12px">${emoji}</div>
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a1c1b;
                    font-family:Georgia,serif">${producto}</p>
          <p style="margin:0;font-size:30px;font-weight:800;color:#506352;
                    font-family:Georgia,serif">${precio}€</p>
          <p style="margin:8px 0 0;font-size:11px;color:#8da18e;letter-spacing:.06em;
                    text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif">
            Portes incluidos · Solo Cartagena
          </p>
        </div>
      </td>
    </tr>

    <!-- DETALLE DEL PEDIDO -->
    <tr>
      <td style="background:#ffffff;padding:4px 40px 32px;
                 border-left:1px solid #ece9e4;border-right:1px solid #ece9e4">
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:.1em;
                  text-transform:uppercase;color:#506352;
                  font-family:'Helvetica Neue',Arial,sans-serif">
          Resumen del pedido
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="font-family:'Helvetica Neue',Arial,sans-serif">
          ${fila('Destinatario', nombre)}
          ${fila('Teléfono', telefono)}
          ${fila('Fecha de entrega', `<span style="color:#7b535c;font-weight:700">${fecha}</span>`)}
          ${direccion ? fila('Dirección', direccion) : fila('Recogida', 'En tienda · Alameda de San Antón, 15')}
          ${dedicatoria ? fila('Dedicatoria', `<em style="color:#7b535c">"${dedicatoria}"</em>`) : ''}
          ${fila('Pago', tipoLabel)}
          ${refSafe ? fila('Referencia', `<span style="font-family:monospace;background:#eef3ee;
            padding:2px 8px;border-radius:4px;color:#3d5c40;font-size:13px">${refSafe}</span>`) : ''}
        </table>
      </td>
    </tr>

    <!-- CTA WHATSAPP -->
    <tr>
      <td style="background:#ffffff;padding:0 40px 40px;text-align:center;
                 border-left:1px solid #ece9e4;border-right:1px solid #ece9e4">
        <a href="${WA_LINK}"
           style="display:inline-block;padding:16px 40px;background:#25D366;
                  color:#ffffff;border-radius:9999px;text-decoration:none;
                  font-size:15px;font-weight:700;letter-spacing:.02em;
                  box-shadow:0 6px 20px rgba(37,211,102,.3);
                  font-family:'Helvetica Neue',Arial,sans-serif">
          Contactar por WhatsApp
        </a>
        <p style="margin:14px 0 0;font-size:12px;color:#aaa;
                  font-family:'Helvetica Neue',Arial,sans-serif">
          ¿Prefieres llamar? <a href="tel:${TEL.replace(/\s/g,'')}"
          style="color:#506352;font-weight:600;text-decoration:none">${TEL}</a>
        </p>
      </td>
    </tr>

    ${footer()}

  </table>

</td></tr>
</table>
</body>
</html>`;
}

// ─── Email para el FLORISTA ───────────────────────────────────────
function floristaHtml({ emailCliente, emoji, producto, precio, nombre, telefono,
                        fecha, direccion, dedicatoria, tipoLabel, refSafe, isManual }) {

  const badgePago = isManual
    ? `<div style="background:#fffbeb;border:1.5px solid #f59e0b;border-radius:10px;
                   padding:14px 18px;margin-bottom:24px;font-family:'Helvetica Neue',Arial,sans-serif">
        <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:#92400e;letter-spacing:.03em">
          ⚠️ VERIFICAR PAGO ANTES DE PREPARAR
        </p>
        <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5">
          Método: <strong>${tipoLabel}</strong> &nbsp;·&nbsp;
          Localizador: <strong style="font-family:monospace;font-size:13px;
            background:#fef3c7;padding:1px 6px;border-radius:3px">
            ${refSafe || 'No indicado'}
          </strong>
        </p>
      </div>`
    : `<div style="background:#f0fdf4;border:1.5px solid #4ade80;border-radius:10px;
                   padding:14px 18px;margin-bottom:24px;font-family:'Helvetica Neue',Arial,sans-serif">
        <p style="margin:0;font-size:13px;font-weight:800;color:#166534">
          ✅ PAGO VERIFICADO POR STRIPE — PUEDES PREPARAR EL PEDIDO
        </p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nuevo pedido — Floristería Alameda</title>
</head>
<body style="margin:0;padding:0;background:#ece9e4;font-family:Georgia,'Times New Roman',serif">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr><td align="center" style="padding:32px 16px">

  <table width="100%" style="max-width:580px" cellpadding="0" cellspacing="0" role="presentation">

    ${header()}

    <!-- BANNER NUEVO PEDIDO -->
    <tr>
      <td style="background:#7b535c;padding:16px 40px;text-align:center;
                 border-left:1px solid #6a4550;border-right:1px solid #6a4550">
        <p style="margin:0;font-size:13px;font-weight:700;color:#f5d6db;letter-spacing:.06em;
                  text-transform:uppercase;font-family:'Helvetica Neue',Arial,sans-serif">
          Nuevo pedido recibido
        </p>
      </td>
    </tr>

    <!-- CUERPO -->
    <tr>
      <td style="background:#ffffff;padding:32px 40px;
                 border-left:1px solid #ece9e4;border-right:1px solid #ece9e4">

        ${badgePago}

        <!-- Producto destacado -->
        <div style="background:#f9f9f7;border-radius:16px;padding:20px;text-align:center;
                    border:1px solid #ece9e4;margin-bottom:24px">
          <div style="font-size:40px;line-height:1;margin-bottom:10px">${emoji}</div>
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a1c1b;
                    font-family:Georgia,serif">${producto}</p>
          <p style="margin:0;font-size:28px;font-weight:800;color:#506352;
                    font-family:Georgia,serif">${precio}€</p>
        </div>

        <!-- Datos del pedido -->
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:.1em;
                  text-transform:uppercase;color:#506352;
                  font-family:'Helvetica Neue',Arial,sans-serif">
          Datos del pedido
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="font-family:'Helvetica Neue',Arial,sans-serif">
          ${fila('Destinatario', nombre)}
          ${fila('Teléfono', `<a href="tel:${telefono.replace(/\s/g,'')}"
            style="color:#506352;font-weight:700;text-decoration:none">${telefono}</a>`)}
          ${emailCliente ? fila('Email cliente', `<a href="mailto:${emailCliente}"
            style="color:#506352;text-decoration:none">${emailCliente}</a>`) : ''}
          ${fila('Fecha entrega', `<span style="color:#7b535c;font-weight:800;
            font-size:15px">${fecha}</span>`)}
          ${direccion ? fila('Dirección', direccion) : fila('Recogida', 'En tienda')}
          ${dedicatoria ? fila('Dedicatoria', `<em style="color:#7b535c">"${dedicatoria}"</em>`) : ''}
          ${fila('Pago', tipoLabel)}
          ${refSafe ? fila('Referencia', `<span style="font-family:monospace;background:#eef3ee;
            padding:2px 8px;border-radius:4px;color:#3d5c40;font-size:13px">${refSafe}</span>`) : ''}
        </table>

      </td>
    </tr>

    ${footer()}

  </table>

</td></tr>
</table>
</body>
</html>`;
}
