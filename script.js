(function () {
  var TITLES = {
    mk: 'Живко Коцев — Софтверски инженер',
    en: 'Zhivko Kocev — Software Engineer'
  };

  function setLang(lang) {
    document.documentElement.lang = lang;
    document.title = TITLES[lang] || TITLES.mk;
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.lang === lang);
    });
    var btn = document.getElementById('lang-toggle');
    if (btn) {
      btn.textContent = lang === 'mk' ? 'EN' : 'МК';
      btn.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
    }
  }

  var btn = document.getElementById('lang-toggle');
  if (btn) {
    btn.addEventListener('click', function () {
      setLang(document.documentElement.lang === 'mk' ? 'en' : 'mk');
    });
  }
  setLang('mk');
})();
