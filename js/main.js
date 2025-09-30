// Arranque del sitio: carga nav y hace lazy-load de efectos cuando haga falta.
import initNav from './nav.js';
initNav();

// Lazy-load de efectos solo si existen elementos .reveal
if (document.querySelector('.reveal')) {
  import('./effects.js').then(({ default: initReveal }) => initReveal());
}
