(function () {
  var KEY = 'theme';
  var root = document.documentElement;
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked: session-only choice */ } }
  // Hide the hero chat until its player starts, so the finished conversation never flashes.
  // If the player never arrives, show it anyway after 3 seconds.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('chat-anim');
    setTimeout(function () {
      if (!document.querySelector('[data-chat][data-playing]')) root.classList.remove('chat-anim');
    }, 3000);
  }
  var saved = read();
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  function current() {
    return root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function label() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      var target = current() === 'dark' ? 'light' : 'dark';
      b.textContent = target.toUpperCase();
      b.setAttribute('aria-label', target.toUpperCase() + ': switch to ' + target + ' theme');
    });
  }
  var mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', label);
  document.addEventListener('DOMContentLoaded', function () {
    label();
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = current() === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        write(next);
        label();
      });
    });
  });
})();
