// ================================================================
// fx3d.js — Sistema de interacciones 3D · Floristería Alameda
// ================================================================

// --- 1. TILT CARD ---
// Efecto perspectiva 3D + brillo dinámico + sombra que se mueve
function initTiltCards(root = document) {
  root.querySelectorAll('.tilt-card').forEach(card => {
    card.style.position = 'relative';
    card.style.willChange = 'transform';
    let glare = card.querySelector('.tilt-glare');
    if (!glare) {
      glare = document.createElement('div');
      glare.className = 'tilt-glare';
      Object.assign(glare.style, {
        position:'absolute', inset:'0', pointerEvents:'none',
        zIndex:'10', borderRadius:'inherit', opacity:'0',
        transition:'opacity 0.2s'
      });
      card.appendChild(glare);
    }

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const xPct = (e.clientX - r.left) / r.width;
      const yPct = (e.clientY - r.top)  / r.height;
      const rotX = (yPct - 0.5) * -16;
      const rotY = (xPct - 0.5) *  16;
      const shadowX = rotY * 2.5;
      const shadowY = -rotX * 2.5;
      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.038,1.038,1.038)`;
      card.style.boxShadow = `${shadowX}px ${shadowY}px 36px rgba(0,0,0,0.20), 0 8px 20px rgba(0,0,0,0.08)`;
      glare.style.opacity = '1';
      glare.style.background = `radial-gradient(ellipse at ${xPct*100}% ${yPct*100}%, rgba(255,255,255,0.28) 0%, transparent 62%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
      glare.style.opacity = '0';
    });
  });
}

// --- 2. MAGNETIC BUTTONS ---
// Los botones atraen ligeramente el cursor hacia su centro
function initMagneticButtons(root = document) {
  root.querySelectorAll('.mag-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.28;
      const y = (e.clientY - r.top  - r.height / 2) * 0.28;
      btn.style.transform = `translate(${x}px, ${y}px) scale(1.06)`;
      btn.style.transition = 'transform 0.1s ease';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
    });
  });
}

// --- 3. RIPPLE EN CLICK ---
// Onda de agua al hacer clic en botones
function initRipple(root = document) {
  root.querySelectorAll('.ripple').forEach(btn => {
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const d = Math.max(r.width, r.height) * 2;
      const span = document.createElement('span');
      Object.assign(span.style, {
        position:'absolute', width:d+'px', height:d+'px',
        left:(e.clientX - r.left - d/2)+'px', top:(e.clientY - r.top - d/2)+'px',
        background:'rgba(255,255,255,0.32)', borderRadius:'50%',
        transform:'scale(0)', animation:'fx3d-ripple 0.6s linear',
        pointerEvents:'none'
      });
      btn.appendChild(span);
      setTimeout(() => span.remove(), 620);
    });
  });
}

// --- 4. SCROLL REVEAL ---
// Los elementos entran con fade + deslizamiento al hacer scroll
function initScrollReveal(root = document) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('fx-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  root.querySelectorAll('.fx-reveal').forEach(el => io.observe(el));
}

// --- 5. CONTADOR ANIMADO ---
// Los números cuentan hacia arriba cuando entran en pantalla
function initCounters(root = document) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  root.querySelectorAll('[data-count]').forEach(el => io.observe(el));
}

// --- 6. PARALLAX EN IMÁGENES DE TARJETA ---
// La imagen dentro de la tarjeta se mueve con el ratón dando profundidad
function initCardImageParallax(root = document) {
  root.querySelectorAll('.card-img-par').forEach(wrap => {
    const img = wrap.querySelector('img');
    if (!img) return;
    img.style.transition = 'transform 0.25s ease';
    wrap.addEventListener('mousemove', e => {
      const r = wrap.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 10;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 10;
      img.style.transform = `scale(1.07) translate(${x}px, ${y}px)`;
    });
    wrap.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1) translate(0,0)';
    });
  });
}

// --- 7. STAGGER EN GRIDS ---
// Los elementos de un grid aparecen uno tras otro
function initGridStagger(selector = '.stagger-grid') {
  document.querySelectorAll(selector).forEach(grid => {
    const children = [...grid.children];
    children.forEach((child, i) => {
      child.classList.add('fx-reveal');
      child.style.transitionDelay = (i * 0.07) + 's';
    });
  });
}

// --- Inyectar estilos CSS ---
(function injectStyles() {
  if (document.getElementById('fx3d-styles')) return;
  const style = document.createElement('style');
  style.id = 'fx3d-styles';
  style.textContent = `
    /* Tilt card */
    .tilt-card { transform-style: preserve-3d; transition: transform 0.12s ease-out, box-shadow 0.12s ease-out; }

    /* Scroll reveal */
    .fx-reveal { opacity:0; transform:translateY(30px); transition: opacity 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1); }
    .fx-reveal.fx-visible { opacity:1; transform:translateY(0); }

    /* Floating animation */
    @keyframes fx3d-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
    .float-anim { animation: fx3d-float 3.6s ease-in-out infinite; }
    .float-anim-slow { animation: fx3d-float 5s ease-in-out infinite; }
    .float-anim-2 { animation: fx3d-float 4s ease-in-out infinite 0.8s; }

    /* Pulse ring (para badge/CTA) */
    @keyframes fx3d-pulse { 0%{box-shadow:0 0 0 0 rgba(80,99,82,0.4)} 70%{box-shadow:0 0 0 14px rgba(80,99,82,0)} 100%{box-shadow:0 0 0 0 rgba(80,99,82,0)} }
    .pulse-ring { animation: fx3d-pulse 2.2s ease-out infinite; }

    /* Ripple on click */
    @keyframes fx3d-ripple { to { transform:scale(4); opacity:0; } }

    /* Magnetic btn smooth */
    .mag-btn { transition: transform 0.12s ease, box-shadow 0.12s ease; }

    /* Image parallax container */
    .card-img-par { overflow: hidden; }
    .card-img-par img { transition: transform 0.25s ease; }

    /* Shimmer on load */
    @keyframes fx3d-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .shimmer { background: linear-gradient(90deg, #f4f4f2 25%, #e8e8e6 50%, #f4f4f2 75%); background-size:200% 100%; animation: fx3d-shimmer 1.4s infinite; }
  `;
  document.head.appendChild(style);
})();

// --- Auto-init ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

function initAll(root = document) {
  initTiltCards(root);
  initMagneticButtons(root);
  initRipple(root);
  initScrollReveal(root);
  initCounters(root);
  initCardImageParallax(root);
}

// Exportar para llamadas manuales (ej: tras renderizar cards dinámicas)
window.fx3d = { initAll, initTiltCards, initMagneticButtons, initRipple, initScrollReveal, initCounters, initCardImageParallax, initGridStagger };
