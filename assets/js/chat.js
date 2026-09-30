(function () {
  var log = document.querySelector('[data-chat]');
  if (!log) return;
  // Reduced motion (and no JS at all) keeps the finished conversation already in the HTML.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var speed = Number(window.__CHAT_SPEED__) || 1;
  var items = Array.prototype.slice.call(log.children);
  var texts = items.map(function (li) {
    var t = li.querySelector('.msg-text');
    return t ? t.textContent : '';
  });
  // Screen readers get the whole conversation at once; the animated copy is hidden from them.
  var copy = log.cloneNode(true);
  copy.removeAttribute('data-chat');
  copy.className = 'sr-only';
  log.parentNode.insertBefore(copy, log);
  log.setAttribute('aria-hidden', 'true');

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(log);
  }

  function scripted(ms) { return new Promise(function (r) { setTimeout(r, ms / speed); }); }
  function real(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function whileOffscreen() { while (!visible) await real(250); }
  function toBottom() { log.scrollTop = log.scrollHeight; }

  async function type(el, full) {
    for (var n = 2; n < full.length; n += 2) {
      el.textContent = full.slice(0, n);
      await scripted(18);
    }
    el.textContent = full;
  }

  async function play() {
    for (;;) {
      items.forEach(function (li, i) {
        li.hidden = true;
        var t = li.querySelector('.msg-text');
        if (t) t.textContent = texts[i];
      });
      log.removeAttribute('data-done');
      log.setAttribute('data-playing', '');
      log.scrollTop = 0;
      for (var i = 0; i < items.length; i++) {
        await whileOffscreen();
        var li = items[i];
        await scripted(Number(li.dataset.wait) || 700);
        var el = li.querySelector('.msg-text');
        var typed = li.dataset.kind === 'us' && el;
        if (typed) el.textContent = '';
        li.hidden = false;
        toBottom();
        if (typed) await type(el, texts[i]);
        toBottom();
      }
      log.setAttribute('data-done', '');
      await real(6000);
      await whileOffscreen();
    }
  }

  play();
})();
