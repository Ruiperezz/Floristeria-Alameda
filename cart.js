const CART_KEY = 'floristeria_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [] }; }
  catch { return { items: [] }; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateAllBadges();
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

function updateAllBadges() {
  const count = getItemCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  });
}

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

document.addEventListener('DOMContentLoaded', updateAllBadges);
