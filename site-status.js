(function () {
  if (location.pathname === '/cerrado.html') return;
  var KEY = 'alameda_site_open_at';
  try {
    var t = parseInt(sessionStorage.getItem(KEY) || '0', 10);
    if (Date.now() - t < 15000) return;
  } catch (e) {}

  function check() {
    fetch('/api/site-status', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (s) {
        if (s && s.closed) {
          location.replace('/cerrado.html');
        } else {
          try { sessionStorage.setItem(KEY, String(Date.now())); } catch (e) {}
        }
      })
      .catch(function () {});
  }

  check();
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      try { sessionStorage.removeItem(KEY); } catch (err) {}
      check();
    }
  });
})();
