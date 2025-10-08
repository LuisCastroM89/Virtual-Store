/* =========================================================
   NAV, HEADER & REVEAL — Bugambilia
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Helpers ---------- */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Elementos del header / nav ---------- */
  const header      = qs('.site-header');
  const navToggle   = qs('.nav-toggle');
  const menu        = qs('#menu');
  const toggleLabel = navToggle ? qs('.nav-toggle-label', navToggle) : null;

  /* ========= Menú móvil ========= */
  const openMenu = () => {
    if (!menu || !navToggle) return;
    menu.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    if (toggleLabel) toggleLabel.textContent = 'Cerrar';
    const firstLink = qs('a', menu);
    if (firstLink) firstLink.focus({ preventScroll: true });
    document.addEventListener('click', outsideClickHandler);
    document.addEventListener('keydown', escHandler);
  };

  const closeMenu = () => {
    if (!menu || !navToggle) return;
    menu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    if (toggleLabel) toggleLabel.textContent = 'Menú';
    document.removeEventListener('click', outsideClickHandler);
    document.removeEventListener('keydown', escHandler);
  };

  const toggleMenu = () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  };

  const outsideClickHandler = (e) => {
    if (!menu || !navToggle) return;
    const clickInsideToggle = navToggle.contains(e.target);
    const clickInsideMenu   = menu.contains(e.target);
    if (!clickInsideToggle && !clickInsideMenu) closeMenu();
  };

  const escHandler = (e) => {
    if (e.key === 'Escape') closeMenu();
  };

  if (navToggle && menu) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu();
    });

    menu.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link) closeMenu();
    });

    let resizeRAF;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(() => {
        if (window.innerWidth > 600) closeMenu();
      });
    });
  }

  /* ========= Sombra del header al hacer scroll ========= */
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('has-shadow', window.scrollY > 8);
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  });
  onScroll();

  /* ========= Reveal on scroll (opcional) ========= */
  const revealItems = qsa('.reveal');
  if ('IntersectionObserver' in window && revealItems.length) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    revealItems.forEach(el => io.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('in-view'));
  }
});
