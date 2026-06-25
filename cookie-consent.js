(function() {
  var CONSENT_KEY = 'cookie_consent';
  var consent = localStorage.getItem(CONSENT_KEY);

  if (consent === 'rejected') {
    var analytics = document.querySelector('script[src*="/_vercel/insights"]');
    if (analytics) analytics.remove();
    return;
  }

  if (consent === 'accepted') return;

  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#506352;color:#fff;padding:16px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;font-family:Montserrat,sans-serif;font-size:13px;line-height:1.5;box-shadow:0 -4px 20px rgba(0,0,0,0.15);';

  banner.innerHTML =
    '<p style="margin:0;max-width:600px;text-align:center">Utilizamos Vercel Analytics para mejorar tu experiencia. No usamos cookies de publicidad. ' +
    '<a href="privacidad.html" style="color:#d3e8d3;text-decoration:underline">Mas info</a></p>' +
    '<div style="display:flex;gap:8px;flex-shrink:0">' +
    '<button id="cookie-accept" style="background:#fff;color:#506352;border:none;border-radius:9999px;padding:8px 20px;font-family:Montserrat,sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.2s">Aceptar</button>' +
    '<button id="cookie-reject" style="background:transparent;color:#fff;border:1px solid #fff;border-radius:9999px;padding:8px 20px;font-family:Montserrat,sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.2s">Rechazar</button>' +
    '</div>';

  document.body.appendChild(banner);

  document.getElementById('cookie-accept').addEventListener('click', function() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    banner.remove();
  });

  document.getElementById('cookie-reject').addEventListener('click', function() {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    var analytics = document.querySelector('script[src*="/_vercel/insights"]');
    if (analytics) analytics.remove();
    banner.remove();
  });
})();
