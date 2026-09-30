(function () {
  var form = document.querySelector('[data-contact]');
  if (!form) return;
  var status = form.querySelector('[data-status]');
  var button = form.querySelector('button[type=submit]');
  var stamp = form.querySelector('[data-stamp]');
  form.noValidate = true; // JS takes over validation; without JS the browser's own checks stay on
  var FALLBACK = 'Try again, or message me on LinkedIn.';

  function show(state, text) { status.dataset.state = state; status.textContent = text; }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (form.elements.botcheck.checked) return;
    if (!form.reportValidity()) return;
    if (form.elements.access_key.value.indexOf('REPLACE_') === 0) {
      show('error', 'NOT SENT · The form is not switched on yet. Message me on LinkedIn.');
      return;
    }
    button.disabled = true;
    show('sending', 'SENDING…');
    try {
      var res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || data.success === false) throw new Error(data.message || 'HTTP ' + res.status);
      form.reset();
      show('ok', "CASE OPENED ✓ Thanks, I'll get back to you.");
      if (stamp) { stamp.hidden = false; stamp.classList.remove('stamp-in'); void stamp.offsetWidth; stamp.classList.add('stamp-in'); }
    } catch (err) {
      show('error', 'NOT SENT · Something went wrong. ' + FALLBACK);
    } finally {
      button.disabled = false;
    }
  });
})();
