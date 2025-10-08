export default function initNav() {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('menu');

    if (!toggle || !menu || !header) {
      console.warn('[nav] Falta .site-header, .nav-toggle o #menu');
      return;
    }

    // Asegura type=button
    if (!toggle.hasAttribute('type')) toggle.setAttribute('type', 'button');

    // Toggle open/close
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Cierra con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    // Cierra clicando fuera
    document.addEventListener('click', (e) => {
      const clickedInside = e.target.closest('.site-nav');
      if (!clickedInside && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Sombra al hacer scroll
    const onScroll = () => {
      if (window.scrollY > 4) header.classList.add('has-shadow');
      else header.classList.remove('has-shadow');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
