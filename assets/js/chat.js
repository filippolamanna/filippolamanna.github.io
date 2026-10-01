(function () {
  var demos = Array.prototype.slice.call(document.querySelectorAll('[data-demo]'));
  if (!demos.length) return;
  var nav = document.querySelector('[data-demo-nav]');
  var buttons = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-goto]')) : [];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed = Number(window.__CHAT_SPEED__) || 1;

  // Per demo: its log, the original texts, and a screen-reader copy of the whole conversation.
  var logs = demos.map(function (demo) {
    var log = demo.querySelector('[data-chat]');
    var items = Array.prototype.slice.call(log.children);
    var texts = items.map(function (li) {
      var t = li.querySelector('.msg-text');
      return t ? t.textContent : '';
    });
    if (!reduce) {
      var copy = log.cloneNode(true);
      copy.removeAttribute('data-chat');
      copy.className = 'sr-only';
      log.parentNode.insertBefore(copy, log);
      log.setAttribute('aria-hidden', 'true');
    }
    return { log: log, items: items, texts: texts };
  });

  var current = 0;
  function show(i) {
    current = i;
    demos.forEach(function (d, j) { d.hidden = j !== i; });
    buttons.forEach(function (b, j) {
      if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }
  if (nav) nav.hidden = false;

  if (reduce) {
    // Finished conversations, switched by hand.
    buttons.forEach(function (b, j) { b.addEventListener('click', function () { show(j); }); });
    return;
  }

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; })
      .observe(demos[0].parentNode);
  }

  var run = 0; // bumps whenever playback restarts, so a stale loop stops itself
  function scripted(ms) { return new Promise(function (r) { setTimeout(r, ms / speed); }); }
  function real(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function whileOffscreen() { while (!visible) await real(250); }

  // Messages type fast, two characters a tick; a person filling a field types one at a time.
  async function type(el, full, token, human) {
    var step = human ? 1 : 2, tick = human ? 55 : 18;
    for (var n = step; n < full.length; n += step) {
      if (token !== run) return;
      el.textContent = full.slice(0, n);
      await scripted(tick);
    }
    el.textContent = full;
  }

  async function press(li, token) {
    var btn = li.querySelector('[data-target]');
    if (!btn) return;
    await scripted(900);
    if (token !== run) return;
    btn.classList.add('pressing');
    await scripted(220);
    btn.classList.remove('pressing');
    btn.classList.add('pressed');
    btn.textContent = btn.dataset.after;
    li.classList.add('clicked');
  }

  async function play(i, token) {
    var d = logs[i], log = d.log;
    d.items.forEach(function (li, k) {
      li.hidden = true;
      li.classList.remove('typing', 'pop', 'clicked');
      var t = li.querySelector('.msg-text');
      if (t) t.textContent = d.texts[k];
      var btn = li.querySelector('[data-target]');
      if (btn) { btn.classList.remove('pressed', 'pressing'); btn.textContent = btn.dataset.before; }
    });
    log.removeAttribute('data-done');
    log.setAttribute('data-playing', '');
    log.scrollTop = 0;
    for (var k = 0; k < d.items.length; k++) {
      await whileOffscreen();
      if (token !== run) return false;
      var li = d.items[k];
      await scripted(Number(li.dataset.wait) || 700);
      if (token !== run) return false;
      var el = li.querySelector('.msg-text');
      var typed = el && (li.dataset.type ? li.dataset.type === '1' : li.dataset.kind === 'us');
      if (typed) { el.textContent = ''; li.classList.add('typing'); }
      else if (li.dataset.type === '0') li.classList.add('pop');
      li.hidden = false;
      log.scrollTop = log.scrollHeight;
      if (typed) { await type(el, d.texts[k], token, li.dataset.type === '1'); li.classList.remove('typing'); }
      if (li.dataset.kind === 'click') await press(li, token);
      log.scrollTop = log.scrollHeight;
    }
    log.setAttribute('data-done', '');
    return true;
  }

  async function loop(start) {
    var token = ++run;
    var i = start;
    for (;;) {
      show(i);
      var finished = await play(i, token);
      if (!finished || token !== run) return;
      await real(4000);
      await whileOffscreen();
      if (token !== run) return;
      i = (i + 1) % demos.length;
    }
  }

  buttons.forEach(function (b, j) { b.addEventListener('click', function () { loop(j); }); });
  loop(0);
})();
