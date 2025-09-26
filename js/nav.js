(function () {
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('menu');

    if (!toggle || !menu) {
      console.warn('[nav] No se encontró .nav-toggle o #menu. Revisa el HTML.');
      return;
    }

    if (!toggle.hasAttribute('type')) {
      toggle.setAttribute('type', 'button');
    }

    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();

