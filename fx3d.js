// ================================================================
// fx3d.js — Sistema de interacciones 3D · Floristería Alameda
// ================================================================

// --- 1. TILT CARD ---
// Perspectiva 3D + brillo dinámico + sombra que se desplaza
function initTiltCards(root) {
  root = root || document;
  root.querySelectorAll('.tilt-card').forEach(card => {
    if (card._tiltInit) return;
    card._tiltInit = true;
    card.style.position = 'relative';

    let glare = card.querySelector('.tilt-glare');
    if (!glare) {
      glare = document.createElement('div');
      glare.className = 'tilt-glare';
      Object.assign(glare.style, {
        position:'absolute', inset:'0', pointerEvents:'none',
        zIndex:'10', borderRadius:'inherit', opacity:'0',
        background:'transparent', transition:'opacity 0.2s'
      });
      card.appendChild(glare);
    }

    card.addEventListener('mousemove', function(e) {
      var r = card.getBoundingClientRect();
      var xPct = (e.clientX - r.left) / r.width;
      var yPct = (e.clientY - r.top)  / r.height;
      var rotX = (yPct - 0.5) * -14;
      var rotY = (xPct - 0.5) *  14;
      var shadowX = rotY * 2;
      var shadowY = -rotX * 2;
      card.style.transition = 'transform 0.08s ease-out, box-shadow 0.08s ease-out';
      card.style.transform = 'perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.03)';
      card.style.boxShadow = shadowX + 'px ' + shadowY + 'px 28px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.08)';
      glare.style.opacity = '1';
      glare.style.background = 'radial-gradient(ellipse at ' + (xPct*100) + '% ' + (yPct*100) + '%, rgba(255,255,255,0.26) 0%, transparent 60%)';
    });

    card.addEventListener('mouseleave', function() {
      card.style.transition = 'transform 0.35s ease, box-shadow 0.35s ease';
      card.style.transform = '';
      card.style.boxShadow = '';
      glare.style.opacity = '0';
    });
  });
}

// --- 2. BOTONES MAGNÉTICOS ---
// Los botones atraen ligeramente el cursor hacia su centro
function initMagneticButtons(root) {
  root = root || document;
  root.querySelectorAll('.mag-btn').forEach(function(btn) {
    if (btn._magInit) return;
    btn._magInit = true;
    btn.addEventListener('mousemove', function(e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width  / 2) * 0.22;
      var y = (e.clientY - r.top  - r.height / 2) * 0.22;
      btn.style.transition = 'transform 0.1s ease';
      btn.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(1.06)';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
      btn.style.transform = '';
    });
  });
}

// --- 3. RIPPLE AL CLIC ---
// Onda de agua al pulsar botones
function initRipple(root) {
  root = root || document;
  root.querySelectorAll('.ripple').forEach(function(btn) {
    if (btn._rippleInit) return;
    btn._rippleInit = true;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function(e) {
      var r = btn.getBoundingClientRect();
      var d = Math.max(r.width, r.height) * 2;
      var span = document.createElement('span');
      Object.assign(span.style, {
        position:'absolute',
        width: d + 'px', height: d + 'px',
        left: (e.clientX - r.left - d/2) + 'px',
        top:  (e.clientY - r.top  - d/2) + 'px',
        background: 'rgba(255,255,255,0.30)',
        borderRadius: '50%',
        transform: 'scale(0)',
        animation: 'fx3d-ripple 0.6s linear',
        pointerEvents: 'none'
      });
      btn.appendChild(span);
      setTimeout(function() { span.remove(); }, 650);
    });
  });
}

// --- 4. PARALLAX EN IMAGEN DE TARJETA ---
// La imagen se desplaza ligeramente con el cursor, dando profundidad
function initCardImageParallax(root) {
  root = root || document;
  root.querySelectorAll('.card-img-par').forEach(function(wrap) {
    if (wrap._parInit) return;
    var img = wrap.querySelector('img');
    if (!img) return;
    wrap._parInit = true;
    img.style.transition = 'transform 0.25s ease';
    wrap.addEventListener('mousemove', function(e) {
      var r = wrap.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width  - 0.5) * 9;
      var y = ((e.clientY - r.top)  / r.height - 0.5) * 9;
      img.style.transform = 'scale(1.06) translate(' + x + 'px, ' + y + 'px)';
    });
    wrap.addEventListener('mouseleave', function() {
      img.style.transform = 'scale(1) translate(0,0)';
    });
  });
}

// --- 5. SCROLL REVEAL ---
// Elementos aparecen con fade+slide al hacer scroll
function initScrollReveal(root) {
  root = root || document;
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('fx-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  root.querySelectorAll('.fx-reveal').forEach(function(el) {
    io.observe(el);
    // Seguridad: si ya está en el viewport, hacerlo visible directamente
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      el.classList.add('fx-visible');
    }
  });
}

// --- 6. CONTADOR ANIMADO ---
// Los números cuentan hacia arriba cuando entran en pantalla
function initCounters(root) {
  root = root || document;
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      var target = parseInt(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var dur = 1400;
      var t0 = performance.now();
      var tick = function(now) {
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  root.querySelectorAll('[data-count]').forEach(function(el) { io.observe(el); });
}

// --- Inyectar CSS ---
(function injectStyles() {
  if (document.getElementById('fx3d-styles')) return;
  var style = document.createElement('style');
  style.id = 'fx3d-styles';
  style.textContent = [
    /* Tilt — sin preserve-3d para evitar conflictos con overflow:hidden */
    '.tilt-card { will-change: transform; transition: transform 0.35s ease, box-shadow 0.35s ease; }',

    /* Scroll reveal */
    '.fx-reveal { opacity:0; transform:translateY(28px); transition: opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1); }',
    '.fx-reveal.fx-visible { opacity:1; transform:translateY(0); }',

    /* Floating badges */
    '@keyframes fx3d-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }',
    '.float-anim      { animation: fx3d-float 3.6s ease-in-out infinite; }',
    '.float-anim-slow { animation: fx3d-float 5s   ease-in-out infinite; }',
    '.float-anim-2    { animation: fx3d-float 4s   ease-in-out infinite 0.8s; }',

    /* Pulse ring en botón CTA principal */
    '@keyframes fx3d-pulse { 0%{box-shadow:0 0 0 0 rgba(80,99,82,0.45)} 70%{box-shadow:0 0 0 14px rgba(80,99,82,0)} 100%{box-shadow:0 0 0 0 rgba(80,99,82,0)} }',
    '.pulse-ring { animation: fx3d-pulse 2.4s ease-out infinite; }',

    /* Ripple click */
    '@keyframes fx3d-ripple { to { transform:scale(4); opacity:0; } }',

    /* Parallax imagen */
    '.card-img-par { overflow:hidden; }',
    '.card-img-par img { transition:transform 0.25s ease; }',

    /* Entrada de cards en grids (CSS puro, sin JS) */
    '@keyframes fx3d-cardin { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }',
    '.card-enter   { animation: fx3d-cardin 0.55s cubic-bezier(0.4,0,0.2,1) both; }',
    '.card-enter-1 { animation-delay:0.05s }',
    '.card-enter-2 { animation-delay:0.12s }',
    '.card-enter-3 { animation-delay:0.19s }',
    '.card-enter-4 { animation-delay:0.26s }',
    '.card-enter-5 { animation-delay:0.33s }',
    '.card-enter-6 { animation-delay:0.40s }',
  ].join('\n');
  document.head.appendChild(style);
})();

// --- Auto-init ---
function initAll(root) {
  root = root || document;
  initTiltCards(root);
  initMagneticButtons(root);
  initRipple(root);
  initScrollReveal(root);
  initCounters(root);
  initCardImageParallax(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { initAll(); });
} else {
  initAll();
}

window.fx3d = {
  initAll: initAll,
  initTiltCards: initTiltCards,
  initMagneticButtons: initMagneticButtons,
  initRipple: initRipple,
  initScrollReveal: initScrollReveal,
  initCounters: initCounters,
  initCardImageParallax: initCardImageParallax
};
