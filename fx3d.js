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

// --- 7. HERO 3D PETALS BACKGROUND ---
// Pétalos y hojas flotantes con proyección 3D real, iluminación dinámica
// y paralaje con el ratón. Canvas sobre la imagen de fondo, bajo el contenido.
function initHeroParticles() {
  var hero = document.getElementById('inicio');
  if (!hero || hero.querySelector('.hero-petals-canvas')) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'hero-petals-canvas';
  Object.assign(canvas.style, {
    position: 'absolute',
    top: '0', left: '0',
    width: '100%', height: '100%',
    zIndex: '2',
    pointerEvents: 'none'
  });
  // Insertar entre la imagen de fondo (z-0) y el card de contenido (z-10)
  var contentCard = hero.querySelector('.relative.z-10');
  if (contentCard) {
    hero.insertBefore(canvas, contentCard);
  } else {
    hero.appendChild(canvas);
  }

  var ctx = canvas.getContext('2d');
  var W, H, cx, cy;
  var mouse = { x: 0.5, y: 0.5 };
  var animId = null;
  var frame = 0;
  var petals = [];
  var sorted = [];
  var NUM = 68;
  var FOCAL = 520;

  // Paleta de colores de la floristería (rosa, blanco, verde salvia, crema, malva)
  var PALETTE = [
    [350, 52, 82],  // rosa suave
    [342, 44, 72],  // rosa medio
    [358, 32, 91],  // blanco rosado
    [0,   0,  96],  // blanco puro
    [130, 22, 62],  // verde salvia
    [125, 28, 74],  // verde salvia claro
    [32,  28, 86],  // crema
    [318, 28, 76],  // malva suave
  ];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // Dibuja la forma del pétalo a escala 1 (se aplica transform fuera)
  function petalShape(ctx, type) {
    ctx.beginPath();
    if (type === 0) {
      // Pétalo de rosa - gota asimétrica
      ctx.moveTo(0, -1);
      ctx.bezierCurveTo( 0.72, -0.38,  0.82,  0.32, 0,  0.62);
      ctx.bezierCurveTo(-0.82,  0.32, -0.72, -0.38, 0, -1);
    } else if (type === 1) {
      // Hoja - óvalo apuntado
      ctx.moveTo(0, -1);
      ctx.bezierCurveTo( 0.56, -0.28,  0.56, 0.28, 0, 1);
      ctx.bezierCurveTo(-0.56,  0.28, -0.56, -0.28, 0, -1);
    } else {
      // Pétalo redondeado - elipse levemente inclinada
      ctx.ellipse(0, -0.08, 0.42, 0.72, 0, 0, Math.PI * 2);
      return; // la elipse es ya un path cerrado
    }
    ctx.closePath();
  }

  function makePetal(startY) {
    var col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    return {
      x:   rnd(-0.9, 0.9),
      y:   startY !== undefined ? startY : rnd(-1.3, 0.6),
      z:   rnd(-300, 300),
      vx:  rnd(-0.00025, 0.00025),
      vy:  rnd(0.00035, 0.00120),
      vz:  rnd(-0.0018, 0.0018),
      rx:  rnd(0, Math.PI * 2),
      ry:  rnd(0, Math.PI * 2),
      rz:  rnd(0, Math.PI * 2),
      vrx: rnd(-0.013, 0.013),
      vry: rnd(-0.019, 0.019),
      vrz: rnd(-0.007, 0.007),
      sz:  rnd(8, 23),
      type: Math.floor(Math.random() * 3),
      h: col[0] + rnd(-10, 10),
      s: col[1],
      l: col[2],
      wob:    rnd(0, Math.PI * 2),
      wobSpd: rnd(0.010, 0.024),
      wobAmt: rnd(0.0004, 0.0013),
    };
  }

  function resize() {
    W = canvas.width  = hero.clientWidth  || window.innerWidth;
    H = canvas.height = hero.clientHeight || window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }

  function tick() {
    frame++;
    ctx.clearRect(0, 0, W, H);

    if (frame % 3 === 0) {
      sorted = petals.slice().sort(function(a, b) { return a.z - b.z; });
    }

    var parallaxX = (mouse.x - 0.5) * 28;
    var parallaxY = (mouse.y - 0.5) * 18;

    for (var i = 0; i < sorted.length; i++) {
      var p = sorted[i];

      p.wob += p.wobSpd;
      p.x  += p.vx + Math.sin(p.wob) * p.wobAmt;
      p.y  += p.vy;
      p.z  += p.vz;
      p.rx += p.vrx;
      p.ry += p.vry;
      p.rz += p.vrz;

      if (p.z >  330) p.vz = -Math.abs(p.vz);
      if (p.z < -330) p.vz =  Math.abs(p.vz);

      if (p.y > 1.35) {
        Object.assign(p, makePetal(-1.35));
        continue;
      }

      var scale = FOCAL / (FOCAL + p.z);
      var px = cx + (p.x * cx + parallaxX) * scale;
      var py = cy + (p.y * cy + parallaxY) * scale;

      if (px < -80 || px > W + 80 || py < -80 || py > H + 80) continue;

      var displaySz = p.sz * scale;
      if (displaySz < 1.5) continue;

      // Aplanado 3D: simula rotación del pétalo sobre sus ejes
      var flatX = Math.abs(Math.cos(p.ry));
      var flatY = Math.abs(Math.cos(p.rx));

      var alpha = Math.min(0.86, 0.22 + scale * 0.72);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px, py);
      ctx.rotate(p.rz);
      ctx.scale(displaySz * (0.48 + flatX * 0.52), displaySz * (0.22 + flatY * 0.78));

      petalShape(ctx, p.type);

      // Gradiente radial para simular volumen e iluminación
      var light = 0.62 + flatX * 0.22 + flatY * 0.16;
      var lBase = p.l * light;
      var lHi   = Math.min(97, lBase + 15);
      var lLo   = Math.max(36, lBase - 13);

      var grd = ctx.createRadialGradient(-0.18, -0.28, 0.04, 0.05, 0.05, 0.95);
      grd.addColorStop(0, 'hsl(' + p.h + ',' + p.s + '%,' + lHi + '%)');
      grd.addColorStop(1, 'hsl(' + p.h + ',' + p.s + '%,' + lLo + '%)');
      ctx.fillStyle = grd;
      ctx.fill();

      // Nervadura central sutil para hojas y pétalos de rosa
      if (p.type < 2 && flatY > 0.38) {
        ctx.globalAlpha = alpha * 0.22;
        ctx.strokeStyle = 'hsl(' + p.h + ',18%,' + Math.min(97, lBase + 22) + '%)';
        ctx.lineWidth = 0.07;
        ctx.beginPath();
        ctx.moveTo(0, -0.88);
        ctx.lineTo(0, 0.78);
        ctx.stroke();
      }

      ctx.restore();
    }

    animId = requestAnimationFrame(tick);
  }

  // Reducir partículas en móvil (rendimiento) y desactivar con prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 768) NUM = 28;

  // Inicialización
  resize();
  for (var i = 0; i < NUM; i++) petals.push(makePetal());
  sorted = petals.slice();

  window.addEventListener('resize', resize);

  hero.addEventListener('mousemove', function(e) {
    var r = hero.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width;
    mouse.y = (e.clientY - r.top)  / r.height;
  });

  // Pausar cuando el hero no está visible (ahorro de CPU)
  var vis = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        if (!animId) animId = requestAnimationFrame(tick);
      } else {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
      }
    });
  }, { threshold: 0.05 });
  vis.observe(hero);

  animId = requestAnimationFrame(tick);
}

// --- Auto-init ---
function initAll(root) {
  root = root || document;
  initTiltCards(root);
  initMagneticButtons(root);
  initRipple(root);
  initScrollReveal(root);
  initCounters(root);
  initCardImageParallax(root);
  if (root === document) initHeroParticles();
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
  initCardImageParallax: initCardImageParallax,
  initHeroParticles: initHeroParticles
};
