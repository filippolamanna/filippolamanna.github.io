(function () {
  var clock = document.querySelector('[data-clock]');
  var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });
  function tick() { if (clock) clock.textContent = 'MILAN ' + fmt.format(new Date()); }
  tick();
  setInterval(tick, 10000);

  var root = document.documentElement;
  var menu = document.querySelector('[data-menu]');
  function setMenu(open) {
    if (open) root.setAttribute('data-menu-open', ''); else root.removeAttribute('data-menu-open');
    if (menu) menu.setAttribute('aria-expanded', String(open));
  }
  if (menu) menu.addEventListener('click', function () { setMenu(!root.hasAttribute('data-menu-open')); });
  document.querySelectorAll('#nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  var nav = document.getElementById('nav');
  document.addEventListener('click', function (e) {
    if (!root.hasAttribute('data-menu-open')) return;
    if (nav && nav.contains(e.target)) return;
    if (menu && menu.contains(e.target)) return;
    setMenu(false);
  });
})();
