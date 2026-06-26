// ================================================================
// pedido-modal.js — Floristería Alameda
// Flujo de pago:
//   · TARJETA → Stripe Checkout (página oficial de Stripe) → pago real
//   · BIZUM   → Instrucciones + número 627 54 63 60 + checkbox
//   · PAYPAL  → Enlace PayPal.me + checkbox
// El botón de WhatsApp solo se activa DESPUÉS de que el pago sea válido.
// ================================================================

(function () {
  // Estilos globales del modal: zoom iOS + feedback táctil + validación visual
  const _s = document.createElement('style');
  _s.textContent = [
    '#pedido-modal input,#pedido-modal textarea{font-size:16px!important;-webkit-text-size-adjust:100%;transition:border-color .2s}',
    '#pedido-modal input.m-ok{border-color:#00C2A8!important}',
    '#pedido-modal input.m-err,#pedido-modal textarea.m-err{border-color:#ba1a1a!important}',
    '#bizum-deeplink:active,#paypal-btn:active{transform:scale(.97);box-shadow:0 2px 8px rgba(0,0,0,.15)!important}',
    '#bizum-deeplink,#paypal-btn{transition:transform .1s,box-shadow .1s}',
    '#btn-whatsapp:not([disabled]):active{transform:scale(.97)}',
    'a,button{-webkit-tap-highlight-color:transparent}',
  ].join('');
  document.head.appendChild(_s);

  const modal = document.createElement('div');
  modal.id = 'pedido-modal';
  modal.style.cssText = [
    'display:none', 'position:fixed', 'inset:0', 'z-index:1000',
    'background:rgba(0,0,0,0.55)', 'backdrop-filter:blur(5px)',
    'align-items:center', 'justify-content:center',
    'padding:16px', 'overflow-y:auto',
  ].join(';');

  modal.innerHTML = `
  <div style="background:#f9f9f7;border-radius:1.25rem;max-width:500px;width:100%;
              padding:28px;position:relative;max-height:92vh;overflow-y:auto;
              margin:auto;box-shadow:0 24px 64px rgba(0,0,0,0.2)">

    <button onclick="cerrarModal()"
            style="position:absolute;top:8px;right:8px;background:none;border:none;
                   cursor:pointer;color:#434842;font-size:22px;line-height:1;
                   width:44px;height:44px;border-radius:50%;transition:background .15s;
                   display:flex;align-items:center;justify-content:center"
            onmouseover="this.style.background='#e8e8e6'"
            onmouseout="this.style.background='none'"
            aria-label="Cerrar">✕</button>

    <!-- Cabecera con imagen del producto -->
    <div style="text-align:center;margin-bottom:20px">
      <!-- Imagen del producto -->
      <div id="modal-img-wrap" style="display:none;margin-bottom:14px">
        <img id="modal-img" src="" alt=""
             style="width:100px;height:100px;border-radius:12px;object-fit:cover;
                    box-shadow:0 6px 20px rgba(0,0,0,.12);margin:0 auto;display:block"/>
      </div>
      <p style="font-family:'Montserrat';font-size:11px;font-weight:600;
                letter-spacing:.08em;color:#7b535c;text-transform:uppercase;margin-bottom:4px">
        Tu pedido
      </p>
      <h2 id="modal-producto"
          style="font-family:'Playfair Display';font-size:22px;font-weight:500;
                 color:#1a1c1b;margin-bottom:2px"></h2>
      <p id="modal-precio"
         style="font-family:'Playfair Display';font-size:32px;font-weight:700;
                color:#506352;margin-bottom:4px"></p>
      <p style="font-family:'Montserrat';font-size:12px;color:#434842">
        🚚 Repartos solo en Cartagena · Portes incluidos
      </p>
      <p style="font-family:'Montserrat';font-size:11px;color:#7b535c;
                background:#ffd9e0;border-radius:.5rem;padding:6px 10px;
                margin-top:8px;line-height:1.5">
        ⚠️ Repartos operativos <strong>solo en Cartagena</strong>.
        Para otras poblaciones consúltenos antes.
      </p>
    </div>

    <div style="display:flex;flex-direction:column;gap:13px">

      <!-- Fecha -->
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;
                      letter-spacing:.05em;color:#434842;display:block;margin-bottom:5px">
          Fecha de entrega <span style="color:#ba1a1a">*</span>
        </label>
        <input id="m-fecha" type="date"
               style="width:100%;border:1.5px solid #c3c8c0;border-radius:.5rem;
                      padding:10px 14px;font-family:'Montserrat';font-size:14px;
                      color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>

      <!-- Nombre -->
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;
                      letter-spacing:.05em;color:#434842;display:block;margin-bottom:5px">
          Nombre del destinatario/a <span style="color:#ba1a1a">*</span>
        </label>
        <input id="m-nombre" type="text" placeholder="Nombre completo"
               style="width:100%;border:1.5px solid #c3c8c0;border-radius:.5rem;
                      padding:10px 14px;font-family:'Montserrat';font-size:14px;
                      color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>

      <!-- Teléfono -->
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;
                      letter-spacing:.05em;color:#434842;display:block;margin-bottom:5px">
          Teléfono de contacto <span style="color:#ba1a1a">*</span>
        </label>
        <input id="m-telefono" type="tel" placeholder="600 000 000"
               style="width:100%;border:1.5px solid #c3c8c0;border-radius:.5rem;
                      padding:10px 14px;font-family:'Montserrat';font-size:14px;
                      color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>

      <!-- Dirección -->
      <div id="m-dir-wrap">
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;
                      letter-spacing:.05em;color:#434842;display:block;margin-bottom:5px">
          Dirección de entrega <span style="color:#ba1a1a">*</span>
        </label>
        <input id="m-direccion" type="text" placeholder="Calle, número, C.P."
               style="width:100%;border:1.5px solid #c3c8c0;border-radius:.5rem;
                      padding:10px 14px;font-family:'Montserrat';font-size:14px;
                      color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>

      <!-- Tipo entrega -->
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;
                      letter-spacing:.05em;color:#434842;display:block;margin-bottom:5px">
          Tipo de entrega
        </label>
        <div style="display:flex;gap:8px">
          <button id="m-btn-dom" onclick="mEntrega('domicilio')"
                  style="flex:1;padding:10px;border-radius:9999px;border:1.5px solid #506352;
                         background:#506352;color:#fff;font-family:'Montserrat';
                         font-size:12px;font-weight:600;cursor:pointer;transition:all .2s">
            🚚 A domicilio
          </button>
          <button id="m-btn-tienda" onclick="mEntrega('tienda')"
                  style="flex:1;padding:10px;border-radius:9999px;border:1.5px solid #506352;
                         background:transparent;color:#506352;font-family:'Montserrat';
                         font-size:12px;font-weight:600;cursor:pointer;transition:all .2s">
            🏪 Recoger en tienda
          </button>
        </div>
      </div>

      <!-- Dedicatoria -->
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;
                      letter-spacing:.05em;color:#434842;display:block;margin-bottom:5px">
          Dedicatoria (opcional)
        </label>
        <textarea id="m-dedicatoria" rows="2" placeholder="Escribe tu mensaje especial..."
                  style="width:100%;border:1.5px solid #c3c8c0;border-radius:.5rem;
                         padding:10px 14px;font-family:'Montserrat';font-size:14px;
                         color:#1a1c1b;background:#f4f4f2;outline:none;
                         resize:none;box-sizing:border-box"></textarea>
      </div>

      <!-- Email opcional -->
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;
                      letter-spacing:.05em;color:#434842;display:block;margin-bottom:5px">
          Email
          <span style="font-size:10px;font-weight:400;color:#888;margin-left:4px">(opcional — recibirás confirmación)</span>
        </label>
        <input id="m-email" type="email" placeholder="tu@email.com" autocomplete="email"
               style="width:100%;border:1.5px solid #c3c8c0;border-radius:.5rem;
                      padding:10px 14px;font-family:'Montserrat';
                      color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>

      <!-- Separador -->
      <div style="border-top:2px solid #e8e8e6;margin:2px 0"></div>

      <!-- Strip de seguridad -->
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;
                  background:#f4f4f2;border-radius:.5rem;padding:8px 12px;flex-wrap:wrap">
        <span style="font-family:'Montserrat';font-size:10px;color:#666;font-weight:600">🔒 Pago 100% seguro</span>
        <span style="font-family:'Montserrat';font-size:10px;color:#666">·</span>
        <span style="font-family:'Montserrat';font-size:10px;color:#666">SSL cifrado</span>
        <span style="font-family:'Montserrat';font-size:10px;color:#666">·</span>
        <span style="font-family:'Montserrat';font-size:10px;color:#666">PCI DSS</span>
        <span style="font-family:'Montserrat';font-size:10px;color:#666">·</span>
        <span style="font-family:'Montserrat';font-size:10px;font-weight:700;
               font-style:italic;color:#1A1F71">VISA</span>
        <div style="display:flex;gap:-4px">
          <div style="width:14px;height:14px;border-radius:50%;background:#EB001B;display:inline-block"></div>
          <div style="width:14px;height:14px;border-radius:50%;background:#F79E1B;opacity:.9;display:inline-block;margin-left:-5px"></div>
        </div>
        <span style="font-weight:900;font-size:10px"><span style="color:#003087">Pay</span><span style="color:#009CDE">Pal</span></span>
        <span style="background:#00C2A8;color:#fff;font-weight:900;font-size:10px;
               padding:1px 6px;border-radius:3px;letter-spacing:-.02em">bizum</span>
      </div>

      <!-- Método de pago -->
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:700;
                      letter-spacing:.05em;color:#1a1c1b;display:block;margin-bottom:8px;
                      text-transform:uppercase">
          💳 Forma de pago <span style="color:#ba1a1a">*</span>
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div style="position:relative">
            <button id="btn-pago-bizum" onclick="mPago('bizum')"
                    style="width:100%;padding:10px;border-radius:.75rem;border:2px solid #00C2A8;
                           background:#f0fdfb;font-family:'Montserrat';font-size:12px;
                           font-weight:700;cursor:pointer;transition:all .2s;color:#005f54">
              📲 Bizum
            </button>
            <span style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);
                         background:#00C2A8;color:#fff;font-family:'Montserrat';
                         font-size:9px;font-weight:700;padding:1px 7px;border-radius:9999px;
                         white-space:nowrap;letter-spacing:.03em">⚡ MÁS USADO</span>
          </div>
          <button id="btn-pago-tarjeta" onclick="mPago('tarjeta')"
                  style="padding:10px;border-radius:.75rem;border:1.5px solid #c3c8c0;
                         background:#fff;font-family:'Montserrat';font-size:12px;
                         font-weight:600;cursor:pointer;transition:all .2s">
            💳 Tarjeta
          </button>
          <button id="btn-pago-paypal" onclick="mPago('paypal')"
                  style="padding:10px;border-radius:.75rem;border:1.5px solid #c3c8c0;
                         background:#fff;font-family:'Montserrat';font-size:12px;
                         font-weight:600;cursor:pointer;transition:all .2s">
            💻 PayPal
          </button>
        </div>
      </div>

      <!-- ═══ TARJETA — redirige a Stripe Checkout ═══ -->
      <div id="bloque-tarjeta" style="display:none;background:#f0f1ff;border:1.5px solid #1A1F71;
                                      border-radius:.75rem;padding:16px">
        <p style="font-family:'Montserrat';font-size:13px;font-weight:700;
                  color:#1A1F71;margin-bottom:6px">💳 Pago seguro con tarjeta</p>
        <p style="font-family:'Montserrat';font-size:12px;color:#434842;
                  line-height:1.6;margin-bottom:14px">
          Serás redirigido a la página de pago oficial de <strong>Stripe</strong>, el sistema
          de cobro usado por Amazon y Airbnb. Tus datos de tarjeta los procesa Stripe
          directamente — nunca pasan por nuestra web.
        </p>
        <button onclick="mPagarStripe()" id="btn-stripe"
                style="width:100%;padding:13px;border:none;border-radius:9999px;
                       background:#1A1F71;color:#fff;font-family:'Montserrat';
                       font-size:14px;font-weight:700;cursor:pointer;
                       display:flex;align-items:center;justify-content:center;gap:8px;
                       transition:opacity .2s">
          🔒 Pagar <span id="stripe-imp"></span> con tarjeta
        </button>
        <p id="stripe-err-modal" style="display:none;font-family:'Montserrat';font-size:11px;
                                        color:#ba1a1a;background:#ffdad6;padding:8px;
                                        border-radius:.5rem;margin-top:8px;line-height:1.5"></p>
        <div style="display:flex;align-items:center;justify-content:center;
                    gap:6px;margin-top:10px;opacity:.55">
          <span style="font-family:'Montserrat';font-size:10px;color:#434842">
            🔒 SSL · PCI DSS · Procesado por Stripe
          </span>
        </div>
      </div>

      <!-- ═══ BIZUM ═══ -->
      <div id="bloque-bizum" style="display:none;background:#d0f5ef;border:1.5px solid #00C2A8;
                                    border-radius:.75rem;padding:16px">
        <p style="font-family:'Montserrat';font-size:13px;font-weight:700;
                  color:#005f54;margin-bottom:6px">📲 Paga ahora por Bizum</p>
        <p style="font-family:'Montserrat';font-size:13px;color:#1a1c1b;margin-bottom:12px">
          Envía <strong id="bizum-imp" style="color:#005f54;font-size:16px"></strong>
          al número <strong style="color:#005f54">627 54 63 60</strong>
        </p>

        <!-- MÓVIL: botón que abre la app de Bizum directamente -->
        <button id="bizum-deeplink" type="button" onclick="abrirBizumApp()"
                style="width:100%;padding:14px;border:none;border-radius:9999px;
                       background:#00C2A8;color:#fff;font-family:'Montserrat';
                       font-size:15px;font-weight:700;cursor:pointer;
                       display:flex;align-items:center;justify-content:center;gap:8px;
                       transition:opacity .2s,transform .1s;margin-bottom:10px;
                       box-shadow:0 4px 14px rgba(0,194,168,.35)">
          📱 Abrir Bizum y pagar ahora
        </button>

        <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;
                      font-family:'Montserrat';font-size:13px;font-weight:600;color:#1a1c1b">
          <input type="checkbox" id="check-bizum" onchange="mCheckPago('bizum')"
                 style="width:18px;height:18px;accent-color:#00C2A8;flex-shrink:0;margin-top:1px"/>
          <span>✅ He enviado <strong id="bizum-imp2" style="color:#005f54"></strong>
                por Bizum al 627 54 63 60</span>
        </label>
        <div id="bizum-ref-wrap" style="display:none;margin-top:10px">
          <label style="font-family:'Montserrat';font-size:12px;font-weight:600;color:#434842;
                        display:block;margin-bottom:4px">
            Localizador del Bizum
            <span style="font-size:10px;font-weight:400;color:#888;margin-left:4px">(opcional)</span>
          </label>
          <input id="bizum-ref" type="text" placeholder="Ej: 4KDTG1748 — déjalo vacío si no lo ves"
                 oninput="mValidarRef()" maxlength="30"
                 style="width:100%;border:1.5px solid #00C2A8;border-radius:.5rem;
                        padding:8px 12px;font-family:'Montserrat';font-size:13px;
                        color:#1a1c1b;background:#fff;outline:none;box-sizing:border-box"/>
          <p style="font-family:'Montserrat';font-size:11px;color:#666;margin-top:4px;line-height:1.5">
            📱 En <strong>CaixaBank, BBVA, Santander</strong>: aparece tras confirmar el pago.<br/>
            ⚠️ <strong>Revolut y N26</strong>: no muestran localizador — puedes dejar este campo vacío.
          </p>
        </div>
      </div>

      <!-- ═══ PAYPAL — redirige a PayPal Checkout ═══ -->
      <div id="bloque-paypal" style="display:none;background:#e3eef9;border:1.5px solid #003087;
                                     border-radius:.75rem;padding:16px">
        <p style="font-family:'Montserrat';font-size:13px;font-weight:700;
                  color:#003087;margin-bottom:6px">💻 Pago seguro con PayPal</p>
        <p style="font-family:'Montserrat';font-size:12px;color:#434842;
                  line-height:1.6;margin-bottom:14px">
          Serás redirigido a la página oficial de <strong>PayPal</strong>.
          Puedes pagar con tu cuenta PayPal o con cualquier tarjeta desde PayPal.
          Tus datos los procesa PayPal directamente — nunca pasan por nuestra web.
        </p>
        <button onclick="mPagarPayPal()" id="btn-paypal"
                style="width:100%;padding:13px;border:none;border-radius:9999px;
                       background:#003087;color:#fff;font-family:'Montserrat';
                       font-size:14px;font-weight:700;cursor:pointer;
                       display:flex;align-items:center;justify-content:center;gap:8px;
                       transition:opacity .2s">
          💻 Pagar <span id="paypal-imp"></span> con PayPal
        </button>
        <p id="paypal-err-modal" style="display:none;font-family:'Montserrat';font-size:11px;
                                        color:#ba1a1a;background:#ffdad6;padding:8px;
                                        border-radius:.5rem;margin-top:8px;line-height:1.5"></p>
        <div style="display:flex;align-items:center;justify-content:center;
                    gap:6px;margin-top:10px;opacity:.55">
          <span style="font-family:'Montserrat';font-size:10px;color:#434842">
            🔒 SSL · PCI DSS · Procesado por PayPal
          </span>
        </div>
      </div>

      <!-- Error -->
      <p id="m-error"
         style="display:none;font-family:'Montserrat';font-size:12px;color:#ba1a1a;
                background:#ffdad6;padding:9px 14px;border-radius:.5rem"></p>

      <!-- Aviso RGPD -->
      <p style="font-family:'Montserrat';font-size:10px;color:#aaa;text-align:center;line-height:1.6;margin-bottom:2px">
        Al continuar aceptas nuestra
        <a href="privacidad.html" target="_blank" style="color:#506352;text-decoration:underline">política de privacidad</a>
        y <a href="aviso-legal.html" target="_blank" style="color:#506352;text-decoration:underline">aviso legal</a>.
      </p>

      <!-- Botón WhatsApp (bloqueado hasta pago) -->
      <button id="btn-whatsapp" disabled onclick="mEnviarWhatsApp()"
              style="width:100%;padding:15px;border:none;border-radius:9999px;
                     background:#9e9e9e;color:#fff;font-family:'Montserrat';
                     font-size:14px;font-weight:700;cursor:not-allowed;
                     display:flex;align-items:center;justify-content:center;gap:8px;
                     margin-top:4px;transition:all .3s;opacity:.65">
        <span id="btn-wa-txt">Completa el pago para continuar</span>
      </button>

    </div>
  </div>`;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });

  // ── Validación visual en tiempo real ──────────────────────────────
  function _setupRT(id, validator) {
    const el = document.getElementById(id);
    if (!el) return;
    const validate = () => {
      const ok = validator(el.value.trim());
      el.classList.toggle('m-ok', ok);
      el.classList.toggle('m-err', !ok && el.value.trim() !== '');
    };
    el.addEventListener('input', validate);
    el.addEventListener('blur', () => {
      if (el.value.trim() === '') { el.classList.add('m-err'); el.classList.remove('m-ok'); }
      else validate();
    });
  }

  // Se engancha tras renderizar el DOM
  setTimeout(() => {
    _setupRT('m-nombre',   v => v.length >= 2);
    _setupRT('m-telefono', v => /^[6789]\d{8}$/.test(v.replace(/[\s\-.]/g,'')));
    _setupRT('m-direccion',v => v.length >= 5);
    _setupRT('m-fecha',    v => v !== '');
    const emailEl = document.getElementById('m-email');
    if (emailEl) emailEl.addEventListener('blur', () => {
      const v = emailEl.value.trim();
      if (!v) { emailEl.classList.remove('m-ok','m-err'); return; }
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      emailEl.classList.toggle('m-ok', ok);
      emailEl.classList.toggle('m-err', !ok);
    });
  }, 100);
})();

// ── Fecha local correcta (evita bug UTC de toISOString en zona horaria española) ──
function _fechaLocalHoy() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

// ── Estado ───────────────────────────────────────────────────────
let _producto = '', _precio = 0, _emoji = '🌸', _tipoEntrega = 'domicilio', _imagen = '';
let _metodo = '', _pagoListo = false, _waEnviando = false;

// ── Abrir modal ──────────────────────────────────────────────────
function abrirPedido(nombre, precio, emoji, imagen) {
  _producto = nombre; _precio = precio; _emoji = emoji || '🌸'; _imagen = imagen || '';
  _tipoEntrega = 'domicilio'; _metodo = ''; _pagoListo = false;

  document.getElementById('modal-producto').textContent = nombre;
  document.getElementById('modal-precio').textContent   = precio + '€';

  // Mostrar imagen del producto si se proporciona
  const imgWrap = document.getElementById('modal-img-wrap');
  const imgEl   = document.getElementById('modal-img');
  if (imgWrap && imgEl && imagen) {
    imgEl.src = imagen;
    imgEl.alt = nombre;
    imgWrap.style.display = 'block';
    imgEl.onerror = () => { imgWrap.style.display = 'none'; };
  } else if (imgWrap) {
    imgWrap.style.display = 'none';
  }

  ['m-fecha','m-nombre','m-telefono','m-direccion','m-dedicatoria','m-email'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const chkBizum = document.getElementById('check-bizum');
  if (chkBizum) chkBizum.checked = false;
  const refBizum = document.getElementById('bizum-ref');
  if (refBizum) refBizum.value = '';
  const refWrap = document.getElementById('bizum-ref-wrap');
  if (refWrap) refWrap.style.display = 'none';

  // Fecha mínima: hoy — usando hora LOCAL (toISOString da UTC y puede dar ayer en España)
  const fechaEl = document.getElementById('m-fecha');
  if (fechaEl) {
    const hoy = _fechaLocalHoy();
    fechaEl.min = hoy;
    // Validación onchange: si el usuario selecciona un día pasado (iOS no lo bloquea visualmente)
    // se reemplaza automáticamente por hoy
    fechaEl.onchange = function () {
      if (this.value && this.value < hoy) this.value = hoy;
    };
  }

  // Ocultar bloques de pago
  ['tarjeta','bizum','paypal'].forEach(t =>
    document.getElementById('bloque-' + t).style.display = 'none'
  );

  // Restablecer botones de método
  ['tarjeta','bizum','paypal'].forEach(t => {
    const b = document.getElementById('btn-pago-' + t);
    if (b) { b.style.background = '#fff'; b.style.color = '#1a1c1b'; b.style.borderColor = '#c3c8c0'; }
  });

  document.getElementById('m-error').style.display = 'none';
  _bloquear();
  mEntrega('domicilio');

  document.getElementById('pedido-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  document.getElementById('pedido-modal').style.display = 'none';
  document.body.style.overflow = '';
}

// ── Tipo de entrega ──────────────────────────────────────────────
function mEntrega(tipo) {
  _tipoEntrega = tipo;
  const d = document.getElementById('m-btn-dom');
  const t = document.getElementById('m-btn-tienda');
  const w = document.getElementById('m-dir-wrap');
  if (tipo === 'domicilio') {
    d.style.background = '#506352'; d.style.color = '#fff';
    t.style.background = 'transparent'; t.style.color = '#506352';
    w.style.display = 'block';
  } else {
    t.style.background = '#506352'; t.style.color = '#fff';
    d.style.background = 'transparent'; d.style.color = '#506352';
    w.style.display = 'none';
  }
}

// ── Método de pago ───────────────────────────────────────────────
const _COLOR = { tarjeta: '#1A1F71', bizum: '#00C2A8', paypal: '#003087' };

function mPago(tipo) {
  _metodo = tipo;
  _pagoListo = false;
  _bloquear();
  document.getElementById('m-error').style.display = 'none';

  // Resaltar botón seleccionado
  ['tarjeta','bizum','paypal'].forEach(t => {
    const b = document.getElementById('btn-pago-' + t);
    if (!b) return;
    if (t === tipo) {
      b.style.background  = _COLOR[t];
      b.style.color       = '#fff';
      b.style.borderColor = _COLOR[t];
    } else {
      b.style.background  = '#fff';
      b.style.color       = '#1a1c1b';
      b.style.borderColor = '#c3c8c0';
    }
  });

  // Mostrar bloque correspondiente
  ['tarjeta','bizum','paypal'].forEach(t =>
    document.getElementById('bloque-' + t).style.display = 'none'
  );
  document.getElementById('bloque-' + tipo).style.display = 'block';

  const imp = _precio + '€';

  if (tipo === 'tarjeta') {
    document.getElementById('stripe-imp').textContent = imp;
    const b = document.getElementById('btn-stripe');
    b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer';
  }
  if (tipo === 'bizum') {
    document.getElementById('bizum-imp').textContent  = imp;
    document.getElementById('bizum-imp2').textContent = imp;
    document.getElementById('check-bizum').checked = false;
    document.getElementById('bizum-ref-wrap').style.display = 'none';
    const bRef = document.getElementById('bizum-ref'); if (bRef) bRef.value = '';
    const bizumPageUrl = `${window.location.origin}/bizum-pago.html?amount=${_precio}&concept=Floristeria+Alameda&return=${encodeURIComponent(window.location.href)}`;
    document.getElementById('bizum-deeplink').dataset.url = bizumPageUrl;
  }
  if (tipo === 'paypal') {
    document.getElementById('paypal-imp').textContent = imp;
    const b = document.getElementById('btn-paypal');
    if (b) { b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer';
             b.innerHTML = `💻 Pagar ${imp} con PayPal`; }
    const errEl = document.getElementById('paypal-err-modal');
    if (errEl) errEl.style.display = 'none';
  }
}

// ── Checkbox Bizum / PayPal ──────────────────────────────────────
function mCheckPago(tipo) {
  const checked = document.getElementById('check-' + tipo)?.checked;
  const refWrap = document.getElementById(tipo + '-ref-wrap');
  if (refWrap) refWrap.style.display = checked ? 'block' : 'none';
  if (!checked) {
    const refEl = document.getElementById(tipo + '-ref');
    if (refEl) refEl.value = '';
    _pagoListo = false;
    _bloquear();
  } else {
    // Localizador opcional: activar botón en cuanto el checkbox está marcado
    _pagoListo = true;
    _activar();
  }
}

function mValidarRef() {
  if (!_metodo || _metodo === 'tarjeta') return;
  const checked = document.getElementById('check-' + _metodo)?.checked;
  // El localizador es opcional — el botón se activa en cuanto el checkbox está marcado
  if (checked) { _pagoListo = true; _activar(); }
  else { _pagoListo = false; _bloquear(); }
}

// ── Pago con Stripe (redirige a Stripe Checkout) ─────────────────
async function mPagarStripe() {
  const err = _validar();
  if (err) { _mostrarError(err); return; }

  const btn = document.getElementById('btn-stripe');
  btn.disabled = true;
  btn.style.opacity = '0.65';
  btn.style.cursor  = 'not-allowed';
  btn.querySelector('span') && (btn.querySelector('span').textContent = 'Preparando pago...');
  btn.innerHTML = '⏳ Preparando pago seguro...';

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:      _precio,
        productName: _producto,
        emoji:       _emoji,
        imagen:      _imagen,
        customerName: document.getElementById('m-nombre').value.trim(),
        telefono:    document.getElementById('m-telefono').value.trim(),
        direccion:   _tipoEntrega === 'domicilio'
                       ? document.getElementById('m-direccion').value.trim()
                       : 'Recogida en tienda',
        fecha:       document.getElementById('m-fecha').value,
        dedicatoria: document.getElementById('m-dedicatoria').value.trim(),
        entrega:     _tipoEntrega,
      }),
    });

    const data = await res.json();

    if (data.error) {
      const errEl = document.getElementById('stripe-err-modal');
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = '⚠️ ' + data.error; }
      else _mostrarError('❌ ' + data.error);
      btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
      btn.innerHTML = `🔒 Pagar ${_precio}€ con tarjeta`;
      return;
    }

    // Guardar datos para email de confirmación tras el pago
    _guardarOrderData('tarjeta');

    // Redirigir a la página de pago de Stripe
    window.location.href = data.url;

  } catch (e) {
    _mostrarError('❌ Error de conexión. Inténtalo de nuevo.');
    btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
    btn.innerHTML = `🔒 Pagar ${_precio}€ con tarjeta`;
  }
}

// ── Guardar datos de pedido en localStorage antes de redirect ────
function _guardarOrderData(tipo) {
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                 'septiembre','octubre','noviembre','diciembre'];
  const fechaRaw = document.getElementById('m-fecha').value;
  let fechaFmt = fechaRaw;
  try { const [y,mo,d] = fechaRaw.split('-'); fechaFmt = `${parseInt(d)} de ${MESES[parseInt(mo)-1]} de ${y}`; } catch {}
  try {
    localStorage.setItem('alameda_order_email', JSON.stringify({
      email:       document.getElementById('m-email')?.value.trim() || '',
      tipo,
      producto:    _producto,
      emoji:       _emoji,
      precio:      String(_precio),
      nombre:      document.getElementById('m-nombre').value.trim(),
      telefono:    document.getElementById('m-telefono').value.trim(),
      fecha:       fechaFmt,
      direccion:   _tipoEntrega === 'domicilio' ? document.getElementById('m-direccion').value.trim() : 'Recogida en tienda',
      dedicatoria: document.getElementById('m-dedicatoria').value.trim(),
    }));
  } catch {}
}

// ── Pago con PayPal (redirige a PayPal Checkout) ─────────────────
async function mPagarPayPal() {
  const err = _validar();
  if (err) { _mostrarError(err); return; }

  const btn = document.getElementById('btn-paypal');
  btn.disabled = true;
  btn.style.opacity = '0.65';
  btn.style.cursor  = 'not-allowed';
  btn.innerHTML     = '⏳ Conectando con PayPal...';

  try {
    const res = await fetch('/api/create-paypal-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:      _precio,
        productName: _producto,
        emoji:       _emoji,
        imagen:      _imagen,
        customerName: document.getElementById('m-nombre').value.trim(),
        telefono:    document.getElementById('m-telefono').value.trim(),
        direccion:   _tipoEntrega === 'domicilio'
                       ? document.getElementById('m-direccion').value.trim()
                       : 'Recogida en tienda',
        fecha:       document.getElementById('m-fecha').value,
        dedicatoria: document.getElementById('m-dedicatoria').value.trim(),
        entrega:     _tipoEntrega,
      }),
    });

    const data = await res.json();

    if (data.error) {
      const errEl = document.getElementById('paypal-err-modal');
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = '⚠️ ' + data.error; }
      else _mostrarError('❌ ' + data.error);
      btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
      btn.innerHTML = `💻 Pagar ${_precio}€ con PayPal`;
      return;
    }

    // Guardar datos para email de confirmación tras el pago
    _guardarOrderData('paypal');

    // Redirigir a PayPal
    window.location.href = data.url;

  } catch (e) {
    _mostrarError('❌ Error de conexión. Inténtalo de nuevo.');
    btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
    btn.innerHTML = `💻 Pagar ${_precio}€ con PayPal`;
  }
}

// ── Botón WhatsApp ───────────────────────────────────────────────
function _bloquear() {
  const b = document.getElementById('btn-whatsapp');
  b.disabled = true;
  b.style.background = '#9e9e9e';
  b.style.opacity    = '0.65';
  b.style.cursor     = 'not-allowed';
  document.getElementById('btn-wa-txt').textContent = 'Completa el pago para continuar';
}

function _activar() {
  const b = document.getElementById('btn-whatsapp');
  b.disabled = false;
  b.style.background = '#25D366';
  b.style.opacity    = '1';
  b.style.cursor     = 'pointer';
  document.getElementById('btn-wa-txt').textContent = '✅ Pago confirmado — Enviar pedido por WhatsApp';
}

// ── Validación formulario ────────────────────────────────────────
function _validar() {
  const fecha     = document.getElementById('m-fecha').value;
  const nombre    = document.getElementById('m-nombre').value.trim();
  const telefono  = document.getElementById('m-telefono').value.trim();
  const direccion = document.getElementById('m-direccion').value.trim();
  if (!fecha)    return '📅 Indica la fecha de entrega.';
  if (!nombre)   return '👤 Indica el nombre del destinatario/a.';
  if (!telefono) return '📱 Indica el teléfono de contacto.';
  if (!/^[6789]\d{8}$/.test(telefono.replace(/[\s\-\.]/g, '')))
    return '📱 El teléfono no es válido (ej: 600 123 456).';
  if (_tipoEntrega === 'domicilio' && !direccion)
    return '📍 Indica la dirección de entrega.';
  return null;
}

function _mostrarError(msg) {
  const el = document.getElementById('m-error');
  el.textContent = msg;
  el.style.display = 'block';
}

// ── Enviar por WhatsApp (solo Bizum/PayPal; Stripe va por su propia página) ──
function mEnviarWhatsApp() {
  if (_waEnviando) return;
  const err = _validar();
  if (err) { _mostrarError(err); return; }
  if (!_pagoListo) { _mostrarError('💳 Confirma que has realizado el pago antes de continuar.'); return; }

  document.getElementById('m-error').style.display = 'none';

  const fecha     = document.getElementById('m-fecha').value;
  const nombre    = document.getElementById('m-nombre').value.trim();
  const telefono  = document.getElementById('m-telefono').value.trim();
  const dedicatoria = document.getElementById('m-dedicatoria').value.trim();
  const direccion   = _tipoEntrega === 'domicilio'
    ? document.getElementById('m-direccion').value.trim()
    : '';

  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                 'septiembre','octubre','noviembre','diciembre'];
  const [y,mo,d] = fecha.split('-');
  const fechaFmt = `${parseInt(d)} de ${MESES[parseInt(mo)-1]} de ${y}`;

  const envioLinea = _tipoEntrega === 'tienda'
    ? '🏪 *Recogida en tienda*'
    : `🚚 *Entrega a domicilio*\n📍 *Dirección:* ${direccion}`;

  const modeloLinea = _imagen
    ? `\n🔗 *Ver modelo:* https://floristeriaalameda.com/${_imagen}`
    : '';

  // Solo Bizum llega aquí — PayPal y Tarjeta van por su propia página de confirmación
  const ref = document.getElementById('bizum-ref')?.value.trim() || '—';
  const infoPago = `📲 Bizum al 627 54 63 60\n   🔖 Localizador: ${ref}`;

  const msg =
`╔══════════════════════╗
   🌸 *FLORISTERÍA ALAMEDA* 🌸
╚══════════════════════╝

✨ _Nuevo pedido_

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🛒 *PRODUCTO:*
   ${_emoji} *${_producto}*
   💶 *${_precio}€* (portes incluidos)${modeloLinea}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

📋 *DATOS DE ENTREGA*

📅 *Fecha:* ${fechaFmt}
👤 *Destinatario/a:* ${nombre}
📱 *Teléfono:* ${telefono}
${envioLinea}${dedicatoria ? `\n✍️ *Dedicatoria:* _"${dedicatoria}"_` : ''}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

💳 *PAGO:* ⏳ PENDIENTE VERIFICACIÓN
   ${infoPago}
   ⚠️ _Verificar referencia antes de preparar_

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
_¡Gracias por confiar en nosotros!_ 🌿`;

  _waEnviando = true;
  window.open(`https://wa.me/34627546360?text=${encodeURIComponent(msg)}`, '_blank');

  // Email de confirmación al cliente Y notificación al florista (no bloqueante)
  const email = document.getElementById('m-email')?.value.trim() || '';
  fetch('/api/send-order-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      tipo:       _metodo,
      producto:   _producto,
      emoji:      _emoji,
      precio:     String(_precio),
      nombre,
      telefono,
      fecha:      fechaFmt,
      direccion,
      dedicatoria,
      ref:        ref !== '—' ? ref : '',
    }),
  }).catch(() => {});

  setTimeout(() => { _waEnviando = false; cerrarModal(); }, 2000);
}

// ── Abrir página Bizum (compatible móvil + escritorio) ───────────
function abrirBizumApp() {
  const btn = document.getElementById('bizum-deeplink');
  const url = btn?.dataset.url;
  if (!url) return;
  btn.style.transform = 'scale(0.97)';
  setTimeout(() => { btn.style.transform = ''; }, 150);
  // Abre la página puente en nueva pestaña → el cliente sigue en el formulario
  window.open(url, '_blank', 'noopener');
}
