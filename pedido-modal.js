// Inyecta el modal en el DOM al cargar
(function() {
  const modal = document.createElement('div');
  modal.id = 'pedido-modal';
  modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px;overflow-y:auto';
  modal.innerHTML = `
  <div style="background:#f9f9f7;border-radius:1rem;max-width:520px;width:100%;padding:32px;position:relative;max-height:90vh;overflow-y:auto;margin:auto">
    <button onclick="cerrarModal()" style="position:absolute;top:12px;right:12px;background:none;border:none;cursor:pointer;color:#434842;font-size:24px;">✕</button>
    <div style="text-align:center;margin-bottom:24px">
      <p style="font-family:'Montserrat';font-size:12px;font-weight:600;letter-spacing:0.05em;color:#7b535c;text-transform:uppercase;margin-bottom:4px">Tu pedido</p>
      <h2 id="modal-producto" style="font-family:'Playfair Display';font-size:24px;font-weight:500;color:#1a1c1b;margin-bottom:4px"></h2>
      <p id="modal-precio" style="font-family:'Playfair Display';font-size:32px;font-weight:700;color:#506352"></p>
      <p style="font-family:'Montserrat';font-size:13px;color:#434842;margin-top:4px">🚚 Repartos solo en Cartagena · Portes incluidos</p>
    </div>

    <div style="display:flex;flex-direction:column;gap:12px">
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;letter-spacing:0.05em;color:#434842;display:block;margin-bottom:4px">Fecha de entrega <span style="color:#ba1a1a">*</span></label>
        <input id="m-fecha" type="date" style="width:100%;border:1px solid #c3c8c0;border-radius:0.5rem;padding:8px 12px;font-family:'Montserrat';font-size:14px;color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;letter-spacing:0.05em;color:#434842;display:block;margin-bottom:4px">Nombre del destinatario/a <span style="color:#ba1a1a">*</span></label>
        <input id="m-nombre" type="text" placeholder="Nombre completo" style="width:100%;border:1px solid #c3c8c0;border-radius:0.5rem;padding:8px 12px;font-family:'Montserrat';font-size:14px;color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;letter-spacing:0.05em;color:#434842;display:block;margin-bottom:4px">Teléfono del destinatario/a <span style="color:#ba1a1a">*</span></label>
        <input id="m-telefono" type="tel" placeholder="600 000 000" style="width:100%;border:1px solid #c3c8c0;border-radius:0.5rem;padding:8px 12px;font-family:'Montserrat';font-size:14px;color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>
      <div id="m-dir-wrap">
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;letter-spacing:0.05em;color:#434842;display:block;margin-bottom:4px">Dirección de entrega <span style="color:#ba1a1a">*</span></label>
        <input id="m-direccion" type="text" placeholder="Calle, número, piso... (solo Cartagena)" style="width:100%;border:1px solid #c3c8c0;border-radius:0.5rem;padding:8px 12px;font-family:'Montserrat';font-size:14px;color:#1a1c1b;background:#f4f4f2;outline:none;box-sizing:border-box"/>
      </div>
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;letter-spacing:0.05em;color:#434842;display:block;margin-bottom:4px">Tipo de entrega</label>
        <div style="display:flex;gap:8px">
          <button id="m-btn-domicilio" onclick="mSelectEntrega('domicilio')" style="flex:1;padding:8px;border-radius:9999px;border:1px solid #506352;background:#506352;color:#fff;font-family:'Montserrat';font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s">🚚 A domicilio</button>
          <button id="m-btn-tienda" onclick="mSelectEntrega('tienda')" style="flex:1;padding:8px;border-radius:9999px;border:1px solid #506352;background:transparent;color:#506352;font-family:'Montserrat';font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s">🏪 Recoger en tienda</button>
        </div>
      </div>
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;letter-spacing:0.05em;color:#434842;display:block;margin-bottom:4px">Dedicatoria (opcional)</label>
        <textarea id="m-dedicatoria" rows="2" placeholder="Escribe tu mensaje especial..." style="width:100%;border:1px solid #c3c8c0;border-radius:0.5rem;padding:8px 12px;font-family:'Montserrat';font-size:14px;color:#1a1c1b;background:#f4f4f2;outline:none;resize:none;box-sizing:border-box"></textarea>
      </div>
      <div>
        <label style="font-family:'Montserrat';font-size:12px;font-weight:600;letter-spacing:0.05em;color:#434842;display:block;margin-bottom:4px">Forma de pago <span style="color:#ba1a1a">*</span></label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <button id="m-pago-bizum" onclick="mSelectPago('Bizum')" style="padding:8px;border-radius:0.5rem;border:1px solid #c3c8c0;background:#fff;font-family:'Montserrat';font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s">bizum</button>
          <button id="m-pago-tarjeta" onclick="mSelectPago('Tarjeta')" style="padding:8px;border-radius:0.5rem;border:1px solid #c3c8c0;background:#fff;font-family:'Montserrat';font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s">💳 Tarjeta</button>
          <button id="m-pago-paypal" onclick="mSelectPago('PayPal')" style="padding:8px;border-radius:0.5rem;border:1px solid #c3c8c0;background:#fff;font-family:'Montserrat';font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s">PayPal</button>
        </div>
      </div>
      <p id="m-error" style="display:none;font-family:'Montserrat';font-size:12px;color:#ba1a1a;background:#ffdad6;padding:8px 12px;border-radius:0.5rem">Por favor, rellena todos los campos obligatorios.</p>
      <button onclick="mEnviarWhatsApp()" style="background:#506352;color:#fff;border:none;border-radius:9999px;padding:14px;font-family:'Montserrat';font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;transition:background 0.2s;width:100%" onmouseover="this.style.background='#8da18e'" onmouseout="this.style.background='#506352'">
        <svg style="width:20px;height:20px;fill:#fff" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.556 4.11 1.528 5.832L.057 23.786c-.094.317.204.599.517.492l5.82-1.886A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.213-3.723 1.207 1.19-3.646-.234-.376A9.818 9.818 0 1112 21.818z"/></svg>
        Confirmar pedido por WhatsApp
      </button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  // Cerrar al hacer clic fuera
  modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });
})();

let _mProducto = '', _mPrecio = 0, _mEmoji = '🌸', _mEntrega = 'domicilio', _mPago = 'Bizum';

function abrirPedido(nombre, precio, emoji) {
  _mProducto = nombre; _mPrecio = precio; _mEmoji = emoji || '🌸';
  _mEntrega = 'domicilio'; _mPago = 'Bizum';
  document.getElementById('modal-producto').textContent = nombre;
  document.getElementById('modal-precio').textContent = precio + '€';
  ['m-fecha','m-nombre','m-telefono','m-direccion','m-dedicatoria'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('m-error').style.display = 'none';
  mSelectEntrega('domicilio');
  mSelectPago('Bizum');
  const modal = document.getElementById('pedido-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  document.getElementById('pedido-modal').style.display = 'none';
  document.body.style.overflow = '';
}

function mSelectEntrega(tipo) {
  _mEntrega = tipo;
  const domBtn = document.getElementById('m-btn-domicilio');
  const tiendaBtn = document.getElementById('m-btn-tienda');
  const dirWrap = document.getElementById('m-dir-wrap');
  if (tipo === 'domicilio') {
    domBtn.style.background = '#506352'; domBtn.style.color = '#fff';
    tiendaBtn.style.background = 'transparent'; tiendaBtn.style.color = '#506352';
    dirWrap.style.display = 'block';
  } else {
    tiendaBtn.style.background = '#506352'; tiendaBtn.style.color = '#fff';
    domBtn.style.background = 'transparent'; domBtn.style.color = '#506352';
    dirWrap.style.display = 'none';
  }
}

const M_PAGO_COLORES = { 'Bizum': '#00C2A8', 'Tarjeta': '#1A1F71', 'PayPal': '#003087' };
function mSelectPago(tipo) {
  _mPago = tipo;
  ['Bizum','Tarjeta','PayPal'].forEach(t => {
    const btn = document.getElementById('m-pago-' + t.toLowerCase());
    if (btn) { btn.style.background = (t === tipo) ? M_PAGO_COLORES[t] : '#fff'; btn.style.color = (t === tipo) ? '#fff' : '#1a1c1b'; btn.style.borderColor = (t === tipo) ? M_PAGO_COLORES[t] : '#c3c8c0'; }
  });
}

function mFmtFecha(str) {
  if (!str) return '—';
  const m = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const [y,mo,d] = str.split('-');
  return `${parseInt(d)} de ${m[parseInt(mo)-1]} de ${y}`;
}

function mEnviarWhatsApp() {
  const fecha = document.getElementById('m-fecha').value;
  const nombre = document.getElementById('m-nombre').value.trim();
  const telefono = document.getElementById('m-telefono').value.trim();
  const direccion = _mEntrega === 'domicilio' ? document.getElementById('m-direccion').value.trim() : 'Recogida en tienda';
  const dedicatoria = document.getElementById('m-dedicatoria').value.trim();

  const obligatorios = [fecha, nombre, telefono];
  if (_mEntrega === 'domicilio') obligatorios.push(direccion);
  if (obligatorios.some(v => !v)) {
    document.getElementById('m-error').style.display = 'block';
    return;
  }
  document.getElementById('m-error').style.display = 'none';

  const pagoIcono = _mPago === 'Bizum' ? '📲' : _mPago === 'PayPal' ? '💻' : '💳';
  const envioLinea = _mEntrega === 'domicilio'
    ? '🚚 Entrega a domicilio en Cartagena (portes incluidos)'
    : '🏪 Recogida en tienda';

  const msg =
`╔══════════════════════╗
   🌸 *FLORISTERÍA ALAMEDA* 🌸
╚══════════════════════╝

✨ _Nuevo pedido_

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🛒 *PRODUCTO:*
   ${_mEmoji} *${_mProducto}*
   💶 *${_mPrecio}€* (portes incluidos)

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

📋 *DATOS DE ENTREGA*

📅 *Fecha:* ${mFmtFecha(fecha)}
👤 *Destinatario/a:* ${nombre}
📱 *Teléfono:* ${telefono}
📍 *Dirección:* ${direccion}${dedicatoria ? `\n✍️ *Dedicatoria:* _"${dedicatoria}"_` : ''}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

${envioLinea}
${pagoIcono} *Pago:* ${_mPago}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
_¡Gracias por confiar en nosotros!_ 🌿`;

  cerrarModal();
  window.open(`https://wa.me/34627546360?text=${encodeURIComponent(msg)}`, '_blank');
}
