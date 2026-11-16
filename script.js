// Loaded as a classic script in <head>, after <title>: sets the language before first paint.
// Language order: ?lang= in the URL, then the saved choice, then the page default (<html lang="mk">).
(() => {
  const LANGS = ['mk', 'en'];
  const root = document.documentElement;
  const valid = (value) => (LANGS.includes(value) ? value : null);
  const read = () => { try { return localStorage.getItem('lang'); } catch { return null; } };
  const save = (value) => { try { localStorage.setItem('lang', value); } catch { /* storage disabled */ } };

  function setLang(lang) {
    root.lang = lang;
    const title = document.querySelector('title');
    if (title?.dataset[lang]) document.title = title.dataset[lang];
    if (document.readyState !== 'loading') translateAttributes(lang);
  }

  // Attributes cannot be hidden with CSS: the HTML holds the Macedonian value,
  // data-alt-en / data-label-en hold the English one, and the original is kept in data-*-mk.
  const ATTRIBUTES = [
    { attr: 'alt', selector: '[data-alt-en]', en: 'altEn', mk: 'altMk' },
    { attr: 'aria-label', selector: '[data-label-en]', en: 'labelEn', mk: 'labelMk' },
  ];
  function translateAttributes(lang) {
    for (const { attr, selector, en, mk } of ATTRIBUTES) {
      for (const el of document.querySelectorAll(selector)) {
        el.dataset[mk] ??= el.getAttribute(attr) ?? '';
        el.setAttribute(attr, el.dataset[lang === 'en' ? en : mk]);
      }
    }
  }

  const fromUrl = valid(new URLSearchParams(location.search).get('lang'));
  if (fromUrl) save(fromUrl);
  setLang(fromUrl ?? valid(read()) ?? root.lang);

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[data-set-lang]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const lang = valid(link.dataset.setLang);
    if (!lang) return;
    event.preventDefault();
    save(lang);
    setLang(lang);
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(history.state, '', url);
    // The clicked link is now hidden; keep keyboard focus on the visible switch.
    document.querySelector(`a[data-set-lang="${lang === 'en' ? 'mk' : 'en'}"]`)?.focus();
  });

  // Copy buttons for code blocks (progressive enhancement: no JS, no button).
  const MESSAGES = {
    mk: { ok: 'Копирано', fail: 'Копирањето не успеа' },
    en: { ok: 'Copied', fail: 'Copy failed' },
  };
  const timers = new WeakMap();
  let lastMessage = '';

  function addCopyButtons() {
    let n = 0;
    for (const pre of document.querySelectorAll('pre')) {
      const code = pre.querySelector('code');
      if (!code) continue;
      code.id ||= `code-${++n}`;

      const wrap = document.createElement('div');
      wrap.className = 'copyable';
      pre.before(wrap);
      wrap.append(pre);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-button';
      button.setAttribute('command', '--copy');
      button.setAttribute('commandfor', code.id);
      // Several "Copy" buttons must not share one name: append the block's caption ("Copy restore.sh").
      const caption = pre.getAttribute('aria-labelledby');
      if (caption) {
        button.id = `${code.id}-copy`;
        button.setAttribute('aria-labelledby', `${button.id} ${caption}`);
      }
      for (const [lang, text] of [['mk', 'Копирај'], ['en', 'Copy']]) {
        const span = document.createElement('span');
        span.dataset.lang = lang;
        span.textContent = text;
        button.append(span);
      }

      const tip = document.createElement('span');
      tip.className = 'tip';
      tip.setAttribute('role', 'status');

      const holder = document.createElement('span');
      holder.className = 'copy';
      holder.append(button, tip);
      wrap.append(holder);
    }
  }

  async function copy(button, target) {
    const text = target.innerText.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      report(button, true);
    } catch {
      report(button, false);
    }
  }

  function report(button, ok) {
    const tip = button.nextElementSibling;
    clearTimeout(timers.get(button));
    button.removeAttribute('data-copied');
    button.removeAttribute('data-failed');
    let message = MESSAGES[root.lang === 'en' ? 'en' : 'mk'][ok ? 'ok' : 'fail'];
    if (message === lastMessage) message += '\u00A0'; // VoiceOver skips identical repeats
    lastMessage = message;
    tip.textContent = '';
    button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
    requestAnimationFrame(() => (tip.textContent = message));
    timers.set(button, setTimeout(() => {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      tip.textContent = '';
    }, 2000));
  }

  if ('CommandEvent' in window) {
    // command events do not bubble: listen in the capture phase.
    document.addEventListener('command', (event) => {
      if (event.command === '--copy') copy(event.source, event.target);
    }, true);
  } else {
    document.addEventListener('click', (event) => {
      const button = event.target.closest?.('button[command="--copy"]');
      const target = button && document.getElementById(button.getAttribute('commandfor'));
      if (target) copy(button, target);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    translateAttributes(root.lang);
    addCopyButtons();
  });
})();
