function toggleMobNav() {
  var menu = document.getElementById('mob-menu');
  var h1 = document.getElementById('ham1');
  var h2 = document.getElementById('ham2');
  var h3 = document.getElementById('ham3');
  if (!menu) return;
  var open = menu.classList.toggle('hidden');
  menu.classList.toggle('flex', !open);
  if (h1) h1.style.transform = open ? '' : 'translateY(8px) rotate(45deg)';
  if (h2) h2.style.opacity = open ? '1' : '0';
  if (h3) h3.style.transform = open ? '' : 'translateY(-8px) rotate(-45deg)';
}

document.addEventListener('click', function(e) {
  var nav = document.getElementById('main-nav');
  var menu = document.getElementById('mob-menu');
  if (nav && menu && !nav.contains(e.target) && !menu.classList.contains('hidden')) {
    toggleMobNav();
  }
});
