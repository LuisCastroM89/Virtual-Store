// main.js — Bugambilia
// Control de navegación responsive accesible (sin dependencias ni inline scripts).
// - Maneja abrir/cerrar menú en móvil
// - Actualiza aria-expanded para accesibilidad
// - Cierra con ESC, clic fuera y al seleccionar un enlace
// - Mantiene estado consistente en resize

(() => {
  'use strict';

  // ---- Helpers de selección ----
  const q = (s, c = document) => c.querySelector(s);
  const qa = (s, c = document) => Array.from(c.querySelectorAll(s));

  // ---- Referencias de la navegación ----
  const nav = q('.site-nav');                     // Contenedor <nav>
  const btn = q('.nav-toggle', nav || undefined); // Botón de toggle (hamburguesa)
  const menu = q('#menu', nav || undefined);      // Lista <ul id="menu">

  // Si no existe alguno, salimos sin hacer nada (página no tiene nav)
  if (!nav || !btn || !menu) return;

  // ---- Estado inicial ARIA (consistente) ----
  nav.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');

  let lastFocus = null; // Para devolver el foco al botón al cerrar

  // ---- Consulta de breakpoint (coincide con CSS) ----
  const isMobile = () => window.matchMedia('(max-width: 880px)').matches;

  // Enfocar el primer link del menú al abrir (mejora accesibilidad con teclado)
  const focusFirstLink = () => {
    const first = q('a, button', menu);
    if (first) first.focus({ preventScroll: true });
  };

  // ---- Acciones de abrir/cerrar ----
  const openMenu = () => {
    if (!isMobile()) return; // En desktop no es "menu modal"
    lastFocus = document.activeElement;
    nav.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    // NOTE: Si quisieras bloquear scroll del body en móvil, descomenta:
    // document.documentElement.style.overflow = 'hidden';
    setTimeout(focusFirstLink, 0);
  };

  const closeMenu = () => {
    nav.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    // document.documentElement.style.overflow = '';
    // Devuelve el foco al botón para no perder el contexto del teclado
    if (lastFocus && document.contains(lastFocus)) {
      btn.focus({ preventScroll: true });
    }
  };

  const toggleMenu = () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  };

  // ---- Eventos principales ----

  // Click en el botón
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleMenu();
  });

  // Cerrar al hacer click fuera del contenedor nav (solo en móvil)
  document.addEventListener('click', (e) => {
    if (!isMobile()) return;
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    if (!expanded) return;
    const withinNav = nav.contains(e.target);
    if (!withinNav) closeMenu();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      e.preventDefault();
      closeMenu();
    }
  });

  // Cerrar al seleccionar un enlace (solo móvil)
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    if (isMobile()) closeMenu();
  });

  // En resize, normalizamos estado ARIA cuando pasamos a desktop
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isMobile()) {
        nav.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        // document.documentElement.style.overflow = '';
      }
    }, 120);
  });
})();

// --- Footer: año dinámico en #year ---
// Funciona con CSP porque está en archivo externo.
// Se ejecuta tanto si el DOM ya cargó como si no.
(function initFooterYear(){
  function setYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setYear, { once: true });
  } else {
    setYear();
  }
})();
