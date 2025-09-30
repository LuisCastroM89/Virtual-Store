export default function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('menu');
  if (!toggle || !menu) return;

  if (!toggle.hasAttribute('type')) toggle.setAttribute('type', 'button');

  const close = () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', (e) => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    e.stopPropagation();
  });

  // Cerrar al hacer click en un enlace del menú
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') close();
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) close();
  });

  // Evitar menú abierto al redimensionar
  window.addEventListener('resize', () => {
    if (window.innerWidth > 600) close();
  });
}
