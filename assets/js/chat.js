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
    }); // .msg-text holds only the value; dropdown options live in a sibling
    if (!reduce) {
      var copy = log.cloneNode(true);
      copy.removeAttribute('data-chat');
      copy.className = 'sr-only';
      log.parentNode.insertBefore(copy, log);
      log.setAttribute('aria-hidden', 'true');
    }
    return { log: log, items: items, texts: texts };
  });

  // Rounds: one Hound scenario, then each of the other demos. Hound scenarios are drawn at random,
  // all three before any repeats, and a visit starts with a different one from the last visit.
  var HOUND = [], OTHER = [];
  demos.forEach(function (d, i) { (d.dataset.demo.indexOf('hound') === 0 ? HOUND : OTHER).push(i); });
  var random = window.__DEMO_RANDOM__ !== false;
  var hold = Number(window.__DEMO_HOLD__) || 4000;
  var KEY = 'lastHoundDemo';
  var lastHound = -1;
  if (random) { try { lastHound = Number(localStorage.getItem(KEY)); } catch (e) { /* storage blocked */ } }
  var houndQueue = [];
  function shuffled(a) {
    a = a.slice();
    if (!random) return a;
    for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[k]; a[k] = t; }
    return a;
  }
  function nextHound() {
    if (!houndQueue.length) {
      houndQueue = shuffled(HOUND);
      if (houndQueue.length > 1 && houndQueue[0] === lastHound) houndQueue.push(houndQueue.shift());
    }
    var h = houndQueue.shift();
    remember(h);
    return h;
  }
  function remember(h) {
    lastHound = h;
    if (random) { try { localStorage.setItem(KEY, String(h)); } catch (e) { /* storage blocked */ } }
  }
  function after(i) {
    var o = OTHER.indexOf(i);
    if (o === -1) return OTHER.length ? OTHER[0] : nextHound();
    return o + 1 < OTHER.length ? OTHER[o + 1] : nextHound();
  }

  function indexOf(key) {
    for (var i = 0; i < demos.length; i++) if (demos[i].dataset.demo === key) return i;
    return 0;
  }

  var current = 0;
  function show(i) {
    current = i;
    demos.forEach(function (d, j) { d.hidden = j !== i; });
    var key = demos[i].dataset.demo.indexOf('hound') === 0 ? 'hound' : demos[i].dataset.demo;
    buttons.forEach(function (b) {
      if (b.dataset.goto === key) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }
  if (nav) nav.hidden = false;

  if (reduce) {
    // Finished conversations, switched by hand.
    var staticHound = 0;
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.goto === 'hound') { show(HOUND[staticHound % HOUND.length]); staticHound++; }
        else show(indexOf(b.dataset.goto));
      });
    });
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

  async function press(li, token, d) {
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
    if (li.hasAttribute('data-fills')) {
      // One click fills every waiting field at once.
      d.items.forEach(function (f, k) {
        if (!f.hasAttribute('data-fill')) return;
        f.querySelector('.msg-text').textContent = d.texts[k];
        f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop');
      });
    }
  }

  function setTab(log, name) {
    var tabs = log.closest('figure').querySelectorAll('.tab');
    Array.prototype.forEach.call(tabs, function (t) { t.classList.toggle('active', t.dataset.tab === name); });
  }

  // A dropdown pick: open the list, walk the highlight to the choice, click it, close.
  async function pick(li, el, value, token) {
    var dd = li.querySelector('.dd');
    if (!dd) { el.textContent = value; return; }
    var opts = Array.prototype.slice.call(dd.querySelectorAll('[data-option]'));
    var choice = Number(li.dataset.choice) || 0;
    el.textContent = 'Select…';
    li.classList.add('choosing');
    await scripted(450);
    if (token !== run) return;
    dd.hidden = false;
    for (var o = 0; o <= choice; o++) {
      opts.forEach(function (x, n) { x.classList.toggle('hl', n === o); });
      await scripted(o === 0 ? 450 : 320);
      if (token !== run) return;
    }
    opts[choice].classList.add('pressing');
    await scripted(220);
    if (token !== run) return;
    opts[choice].classList.remove('pressing');
    dd.hidden = true;
    opts.forEach(function (x) { x.classList.remove('hl'); });
    li.classList.remove('choosing');
    el.textContent = value;
  }

  async function play(i, token) {
    var d = logs[i], log = d.log;
    d.items.forEach(function (li, k) {
      li.hidden = true;
      li.classList.remove('typing', 'pop', 'clicked', 'choosing');
      var dd = li.querySelector('.dd');
      if (dd) dd.hidden = true;
      var t = li.querySelector('.msg-text');
      if (t) t.textContent = d.texts[k];
      var btn = li.querySelector('[data-target]');
      if (btn) { btn.classList.remove('pressed', 'pressing'); btn.textContent = btn.dataset.before; }
    });
    log.removeAttribute('data-done');
    log.setAttribute('data-playing', '');
    log.scrollTop = 0;
    var firstTab = log.closest('figure').querySelector('.tab');
    if (firstTab) setTab(log, firstTab.dataset.tab);
    for (var k = 0; k < d.items.length; k++) {
      await whileOffscreen();
      if (token !== run) return false;
      var li = d.items[k];
      await scripted(Number(li.dataset.wait) || 700);
      if (token !== run) return false;
      if (li.dataset.kind === 'tab') {
        // Switching tabs is a navigation: the previous page goes away.
        for (var p = 0; p < k; p++) d.items[p].hidden = true;
        setTab(log, li.dataset.tab);
        log.scrollTop = 0;
        continue;
      }
      var el = li.querySelector('.msg-text');
      var picking = el && li.dataset.type === 'pick';
      var typed = el && !picking && (li.dataset.type ? li.dataset.type === '1' : li.dataset.kind === 'us');
      if (typed) { el.textContent = ''; li.classList.add('typing'); }
      else if (picking) el.textContent = 'Select…';
      if (li.hasAttribute('data-fill')) el.textContent = '';
      else if (li.dataset.type === '0') li.classList.add('pop');
      li.hidden = false;
      log.scrollTop = log.scrollHeight;
      if (typed) { await type(el, d.texts[k], token, li.dataset.type === '1'); li.classList.remove('typing'); }
      if (picking) await pick(li, el, d.texts[k], token);
      if (li.dataset.kind === 'click') await press(li, token, d);
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
      await real(hold);
      await whileOffscreen();
      if (token !== run) return;
      i = after(i);
    }
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      loop(b.dataset.goto === 'hound' ? nextHound() : indexOf(b.dataset.goto));
    });
  });
  loop(nextHound());
})();
