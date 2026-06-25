const CART_KEY = 'floristeria_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [] }; }
  catch { return { items: [] }; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateAllBadges();
  updateFloatingBar();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.items.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.items.push({ ...item, quantity: item.quantity || 1 });
  }
  saveCart(cart);
  showToast(item.name || item.id);
  animateCartIcon();
}

function animateCartIcon() {
  document.querySelectorAll('.cart-count').forEach(el => {
    el.style.transform = 'scale(1.7)';
    el.style.transition = 'transform .2s cubic-bezier(.34,1.56,.64,1)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 250);
  });
}

function removeFromCart(id) {
  const cart = getCart();
  cart.items = cart.items.filter(i => i.id !== id);
  saveCart(cart);
}

function setQuantity(id, qty) {
  const cart = getCart();
  const item = cart.items.find(i => i.id === id);
  if (item) { item.quantity = Math.max(1, qty); saveCart(cart); }
}

function getItemCount() {
  return getCart().items.reduce((s, i) => s + i.quantity, 0);
}

function getTotal() {
  return getCart().items.reduce((s, i) => s + i.price * i.quantity, 0);
}

function clearCart() {
  saveCart({ items: [] });
}

// ── Actualizar todos los badges del carrito ───────────────────────
function updateAllBadges() {
  const count = getItemCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  });
}

// ── Toast "Añadido al carrito" ────────────────────────────────────
function showToast(name) {
  const toast = document.getElementById('cart-toast');
  if (!toast) return;
  document.getElementById('toast-msg').textContent = `"${name}" añadido al carrito`;
  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 2800);
}

// ── Barra flotante del carrito (aparece cuando hay productos) ─────
function updateFloatingBar() {
  let bar = document.getElementById('cart-float-bar');
  const count = getItemCount();
  const total = getTotal();

  // No mostrar en la página del carrito (ya está en la misma)
  if (window.location.pathname.includes('carrito')) {
    if (bar) bar.style.display = 'none';
    return;
  }

  if (count === 0) {
    if (bar) bar.style.display = 'none';
    document.body.style.paddingBottom = '';
    return;
  }

  // Crear la barra si no existe
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'cart-float-bar';
    bar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:49',
      'background:#506352', 'color:#fff',
      'display:flex', 'align-items:center', 'justify-content:space-between',
      'padding:12px 20px', 'gap:12px',
      'box-shadow:0 -4px 20px rgba(0,0,0,0.15)',
      'font-family:Montserrat,sans-serif',
      'transform:translateY(100%)',
      'transition:transform .35s cubic-bezier(.22,1,.36,1)',
    ].join(';');

    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
        <span style="font-size:22px">🛒</span>
        <div style="min-width:0">
          <p id="cfb-items" style="font-size:13px;font-weight:700;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></p>
          <p id="cfb-total" style="font-size:11px;margin:0;opacity:.8"></p>
        </div>
      </div>
      <a href="carrito.html"
         style="background:#fff;color:#506352;border-radius:9999px;
                padding:10px 20px;font-size:13px;font-weight:700;
                text-decoration:none;white-space:nowrap;flex-shrink:0;
                transition:opacity .15s">
        Ver carrito →
      </a>`;
    document.body.appendChild(bar);
    // Asegurar que body no quede tapado por la barra
    bar._bodyPaddingAdded = false;
  }

  // Actualizar contenido
  const itemLabel = count === 1 ? '1 producto' : `${count} productos`;
  document.getElementById('cfb-items').textContent = `${itemLabel} en tu carrito`;
  document.getElementById('cfb-total').textContent = `Total: ${total.toFixed(2)}€ · Portes incluidos`;

  bar.style.display = 'flex';
  setTimeout(() => { bar.style.transform = 'translateY(0)'; }, 50);

  // Añadir padding al body para que el contenido no quede tapado
  if (!bar._bodyPaddingAdded) {
    document.body.style.paddingBottom = '66px';
    bar._bodyPaddingAdded = true;
  }
}

// ── Animación botón "Añadir al carrito" → "✅ Añadido" ───────────
function animateAddBtn(btn) {
  if (!btn) return;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.style.background = '#00C2A8';
  btn.innerHTML = '✅ Añadido';
  setTimeout(() => {
    btn.disabled = false;
    btn.style.background = '';
    btn.innerHTML = original;
  }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  updateAllBadges();
  updateFloatingBar();
});
