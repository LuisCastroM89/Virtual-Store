// tienda.js — Bugambilia
// Lógica de la tienda: filtros, orden, carga opcional desde JSON y CTA "Agregar".
// - Sin dependencias externas
// - Seguro para CSP (no usa eval/inline)
// - Accesible: comunica resultados en #catalog-status (aria-live)

(() => {
  'use strict';

  // ---- Helpers ----
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Sanitiza texto para evitar inyección accidental (defensa en profundidad)
  const safeText = (s) => String(s ?? '').replace(/[<>]/g, '').trim();

  // Normaliza cadenas para búsquedas insensibles a acentos y mayúsculas
  const norm = (s) =>
    safeText(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim();

  const form = $('#filtros');                  // <form> de filtros
  const grid = $('#grid');                     // contenedor de tarjetas
  const status = $('#catalog-status');         // <p role="status"> (opcional pero recomendado)

  if (!grid) return; // si la página no tiene grid, no ejecutamos nada

  // ---- Carga opcional de productos desde JSON ----
  // Si el div#grid tiene data-src="ruta.json", se intenta cargar y renderizar.
  const dataSrc = grid?.dataset?.src;

  /**
   * Crea una tarjeta de producto a partir de un objeto producto.
   * @param {Object} p - { nombre, precio, imagen, categoria, sku, meta, href, alt }
   * @returns {HTMLElement} article.card
   */
  const createCard = (p) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.cat = safeText(p.categoria || p.cat || '');
    card.dataset.precio = String(p.precio ?? p.price ?? 0);

    card.innerHTML = `
      <div class="card__img">
        <img src="${safeText(p.imagen || p.img || '')}"
             alt="${safeText(p.alt || p.nombre || p.name || 'Producto Bugambilia')}"
             loading="lazy" decoding="async" width="800" height="800">
      </div>
      <div class="card__body">
        <h3 class="card__title">${safeText(p.nombre || p.name || 'Producto')}</h3>
        <p class="card__meta">${safeText(p.meta || p.descripcion || '')}</p>
        <p class="card__price">${fmtCOP(p.precio ?? p.price ?? 0)}</p>
      </div>
      <div class="card__cta">
        <button class="btn btn--primary" data-add data-sku="${safeText(p.sku || p.id || '')}">Agregar</button>
        <a class="btn" href="${safeText(p.href || '#')}" aria-label="Ver detalles de ${safeText(p.nombre || p.name || 'producto')}">Ver</a>
      </div>
    `;
    return card;
  };

  /**
   * Formatea un número a moneda COP. Usa Intl si está disponible.
   */
  const fmtCOP = (n) => {
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
        .format(Number(n) || 0);
    } catch {
      // Fallback manual si Intl no estuviera disponible
      const x = Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return '$' + x;
    }
  };

  /**
   * Carga productos desde dataSrc y los dibuja. Si falla, deja el grid como esté.
   */
  const loadData = async () => {
    if (!dataSrc) return; // nada que cargar
    setBusy(true);
    try {
      const res = await fetch(dataSrc, { method: 'GET', cache: 'no-store', credentials: 'omit' });
      if (!res.ok) throw new Error('No se pudieron cargar los productos.');
      const lista = await res.json();
      if (!Array.isArray(lista)) throw new Error('El JSON de productos debe ser un arreglo.');
      const frag = document.createDocumentFragment();
      lista.forEach((p) => frag.appendChild(createCard(p)));
      grid.innerHTML = '';
      grid.appendChild(frag);
      announce(`${lista.length} productos cargados.`);
    } catch (err) {
      console.error(err);
      announce('No se pudieron cargar los productos. Intenta más tarde.');
    } finally {
      setBusy(false);
      applyFilters(); // aplica filtros iniciales tras cargar
    }
  };

  // ---- Filtros y orden ----
  const applyFilters = () => {
    const q = norm($('#q')?.value || '');
    const cat = $('#cat')?.value || '';
    const orden = $('#orden')?.value || 'relevancia';
    const rango = parseInt($('#rango')?.value || '0', 10);

    const items = $$('.card', grid);
    let visibles = 0;

    items.forEach((card) => {
      const title = norm($('.card__title', card)?.textContent || '');
      const meta = norm($('.card__meta', card)?.textContent || '');
      const matchesText = q ? title.includes(q) || meta.includes(q) : true;
      const matchesCat = cat ? card.dataset.cat === cat : true;
      const price = parseInt(card.dataset.precio || '0', 10);
      const matchesPrice = rango ? price <= rango : true;

      const show = matchesText && matchesCat && matchesPrice;
      card.style.display = show ? '' : 'none';
      if (show) visibles++;
    });

    // Ordenar solo los visibles (si se selecciona un criterio)
    const visible = $$('.card', grid).filter((i) => i.style.display !== 'none');
    const comparators = {
      'precio-asc':  (a, b) => (+a.dataset.precio) - (+b.dataset.precio),
      'precio-desc': (a, b) => (+b.dataset.precio) - (+a.dataset.precio),
      'nombre-asc':  (a, b) => $('.card__title', a).textContent
                                .localeCompare($('.card__title', b).textContent, 'es'),
    };
    const by = comparators[orden];
    if (by) visible.sort(by).forEach((el) => grid.appendChild(el));

    // Comunicar resultado (accesible)
    announce(`${visibles} producto${visibles === 1 ? '' : 's'} visible${visibles === 1 ? '' : 's'}.`);
  };

  // ---- Estado accesible / aria-live ----
  const setBusy = (flag) => {
    if (!grid) return;
    grid.setAttribute('aria-busy', flag ? 'true' : 'false');
  };
  const announce = (msg) => {
    if (!status) return; // si no existe el <p id="catalog-status">, no anunciamos
    status.textContent = msg;
  };

  // ---- CTA "Agregar" (placeholder de carrito) ----
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    e.preventDefault();

    const sku = btn.getAttribute('data-sku') || '';
    btn.setAttribute('disabled', 'true');
    const oldText = btn.textContent;
    btn.textContent = 'Agregado ✓';

    // Persistencia básica en localStorage (se puede reemplazar por carrito real)
    try {
      const key = 'buga-cart';
      const cart = JSON.parse(localStorage.getItem(key) || '[]');
      cart.push({ sku, ts: Date.now() });
      localStorage.setItem(key, JSON.stringify(cart));
    } catch (err) {
      console.warn('No se pudo usar localStorage', err);
    }

    // Restaurar botón
    setTimeout(() => {
      btn.removeAttribute('disabled');
      btn.textContent = oldText;
    }, 1200);
  });

  // ---- Eventos ----
  if (form) form.addEventListener('input', applyFilters);

  // ---- Inicio ----
  document.addEventListener('DOMContentLoaded', () => {
    // Intentamos cargar JSON (si hay data-src) y, si no, filtramos lo que exista
    loadData().catch(() => applyFilters());
  });

  /* Acordeón simple para la tienda (opcional):
   Garantiza que solo un <details> quede abierto a la vez. */
document.addEventListener('click', (ev) => {
  const summary = ev.target.closest('.product__summary');
  if (!summary) return;

  const current = summary.parentElement; // <details>
  if (!(current instanceof HTMLDetailsElement)) return;

  if (!current.open) {
    // Si se va a abrir, cierra otros
    document.querySelectorAll('.shop-grid .product__panel[open]')
      .forEach(det => { if(det !== current) det.removeAttribute('open'); });
  }
});

})();
