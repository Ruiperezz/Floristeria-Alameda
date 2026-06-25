(function() {
  var footer = document.getElementById('site-footer');
  if (!footer) return;

  var year = new Date().getFullYear();

  footer.innerHTML =
  '<div class="py-md border-b border-outline-variant flex flex-col sm:flex-row items-center justify-center gap-sm">' +
    '<span style="font-family:Montserrat,sans-serif;font-size:12px;font-weight:500;letter-spacing:0.03em;text-transform:uppercase;color:#434842">Métodos de pago aceptados</span>' +
    '<div class="flex items-center gap-sm flex-wrap justify-center">' +
      '<div style="background:#fff;border-radius:0.25rem;border:1px solid #c3c8c0;padding:4px 12px;display:flex;align-items:center;justify-content:center;height:36px;width:64px;box-shadow:0 1px 2px rgba(0,0,0,0.05)">' +
        '<span style="font-weight:700;font-style:italic;color:#1A1F71;font-size:16px;letter-spacing:0.05em">VISA</span>' +
      '</div>' +
      '<div style="background:#fff;border-radius:0.25rem;border:1px solid #c3c8c0;padding:4px 12px;display:flex;align-items:center;justify-content:center;height:36px;width:64px;box-shadow:0 1px 2px rgba(0,0,0,0.05)">' +
        '<div style="display:flex;margin-left:-8px"><div style="width:20px;height:20px;border-radius:50%;background:#EB001B"></div><div style="width:20px;height:20px;border-radius:50%;background:#F79E1B;opacity:0.9;margin-left:-8px"></div></div>' +
      '</div>' +
      '<div style="background:#fff;border-radius:0.25rem;border:1px solid #c3c8c0;padding:4px 12px;display:flex;align-items:center;justify-content:center;height:36px;width:64px;box-shadow:0 1px 2px rgba(0,0,0,0.05)">' +
        '<span style="font-weight:800;font-size:14px"><span style="color:#003087">Pay</span><span style="color:#009CDE">Pal</span></span>' +
      '</div>' +
      '<div style="background:#00C2A8;border-radius:0.25rem;padding:4px 12px;display:flex;align-items:center;justify-content:center;height:36px;width:64px;box-shadow:0 1px 2px rgba(0,0,0,0.05)">' +
        '<span style="font-weight:800;color:#fff;font-size:14px;letter-spacing:-0.02em">bizum</span>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="py-lg" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:48px;align-items:start">' +
    '<div style="display:flex;flex-direction:column;gap:12px">' +
      '<span style="font-family:\'Playfair Display\',serif;font-size:24px;font-weight:500;color:#506352">Floristería Alameda</span>' +
      '<p style="font-family:Montserrat,sans-serif;font-size:16px;color:#434842;line-height:1.6;margin:0">Alameda de San Antón, 15<br/>30205 Cartagena, Murcia</p>' +
      '<a href="tel:627546360" style="font-family:Montserrat,sans-serif;font-size:16px;color:#506352;text-decoration:none">627 54 63 60</a>' +
      '<div style="display:flex;align-items:center;gap:12px;margin-top:4px">' +
        '<a href="https://www.facebook.com/alamedafloristeria" target="_blank" rel="noopener noreferrer" title="Facebook" style="width:36px;height:36px;background:#1877F2;border-radius:50%;display:flex;align-items:center;justify-content:center">' +
          '<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
        '</a>' +
        '<a href="https://wa.me/34627546360" target="_blank" rel="noopener noreferrer" title="WhatsApp" style="width:36px;height:36px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center">' +
          '<svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.556 4.11 1.528 5.832L.057 23.786c-.094.317.204.599.517.492l5.82-1.886A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.374l-.36-.213-3.723 1.207 1.19-3.646-.234-.376A9.818 9.818 0 1112 21.818z"/></svg>' +
        '</a>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:4px">' +
      '<p style="font-family:Montserrat,sans-serif;font-size:14px;font-weight:600;color:#1a1c1b;margin:0 0 4px">Horario de atención</p>' +
      '<p style="font-family:Montserrat,sans-serif;font-size:16px;color:#434842;line-height:1.6;margin:0">Lun–Vie: 9:30–13:30 · 17:30–20:00</p>' +
      '<p style="font-family:Montserrat,sans-serif;font-size:16px;color:#434842;line-height:1.6;margin:0">Sábados: 9:30–13:30</p>' +
      '<p style="font-family:Montserrat,sans-serif;font-size:16px;color:#434842;line-height:1.6;margin:4px 0 0">⭐ 4,9/5 · 311 reseñas en Google</p>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:4px">' +
      '<p style="font-family:Montserrat,sans-serif;font-size:14px;font-weight:600;color:#1a1c1b;margin:0 0 4px">Legal</p>' +
      '<a href="privacidad.html" style="font-family:Montserrat,sans-serif;font-size:16px;color:#434842;text-decoration:none;line-height:1.6;transition:color 0.2s" onmouseover="this.style.color=\'#506352\'" onmouseout="this.style.color=\'#434842\'">Política de Privacidad</a>' +
      '<a href="aviso-legal.html" style="font-family:Montserrat,sans-serif;font-size:16px;color:#434842;text-decoration:none;line-height:1.6;transition:color 0.2s" onmouseover="this.style.color=\'#506352\'" onmouseout="this.style.color=\'#434842\'">Aviso Legal</a>' +
      '<a href="envios.html" style="font-family:Montserrat,sans-serif;font-size:16px;color:#434842;text-decoration:none;line-height:1.6;transition:color 0.2s" onmouseover="this.style.color=\'#506352\'" onmouseout="this.style.color=\'#434842\'">Política de Envíos</a>' +
      '<p style="font-family:Montserrat,sans-serif;font-size:12px;color:#434842;margin:12px 0 0">&copy; ' + year + ' Floristería Alameda · Cartagena, España</p>' +
    '</div>' +
  '</div>';
})();
