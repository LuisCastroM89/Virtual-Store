// blog.js — Bugambilia
// Listado del blog desde /data/posts.json con:
// - Búsqueda + filtro por etiqueta + orden
// - Paginación numerada (1..N) + Anterior/Siguiente
// - Mensajes accesibles en #blog-status
// - Pequeñas defensas (tags opcionales, campos faltantes)

(() => {
  'use strict';

  /* ===== Helpers ===== */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const safe = (s) => String(s ?? '').replace(/[<>]/g, '').trim();
  const norm = (s) => safe(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  /* ===== Refs UI ===== */
  const filtros = $('#blog-filtros');
  const qInput  = $('#q');
  const tagSel  = $('#tag');
  const orden   = $('#orden');
  const grid    = $('#blog-grid');
  const status  = $('#blog-status');
  const prevBtn = $('#prev');
  const nextBtn = $('#next');
  const pageInfo= $('#pageInfo');
  const pagerNum= $('#pagerNumbers');

  /* ===== Estado ===== */
  const PAGE_SIZE = 6;     // posts por página
  let posts = [];          // todos los posts
  let view = [];           // posts filtrados/ordenados
  let page = 1;            // página actual
  let totalPages = 1;

  /* ===== Carga de datos ===== */
  async function load() {
    grid.setAttribute('aria-busy', 'true');
    try {
      // NOTA: ajusta si cambias la ruta; ahora ya validamos que sea plural "posts.json"
      const res = await fetch('../data/posts.json', { cache:'no-store', credentials:'omit' });
      if (!res.ok) throw new Error('No se pudo cargar posts.json');
      posts = await res.json();
      fillTags(posts);
      apply();
    } catch (e) {
      console.error(e);
      announce('No se pudieron cargar los artículos.');
      grid.innerHTML = `<p style="padding:.75rem; background:#fff; border:1px solid #eee; border-radius:12px;">
        No se pudo cargar la base de artículos. Verifica <code>/data/posts.json</code>.
      </p>`;
    } finally {
      grid.setAttribute('aria-busy', 'false');
    }
  }

  /* ===== Filtros + orden + paginación ===== */
  function apply() {
    const q = norm(qInput?.value || '');
    const t = tagSel?.value || '';
    const o = orden?.value || 'fecha-desc';

    // Filtrado (defensivo: tags opcionales)
    view = posts.filter(p => {
      const tags = Array.isArray(p.tags) ? p.tags : [];
      const hitQ = q ? (norm(p.titulo||'').includes(q) || norm(p.extracto||'').includes(q) || tags.some(tag => norm(tag).includes(q))) : true;
      const hitT = t ? tags.includes(t) : true;
      return hitQ && hitT;
    });

    // Orden
    const cmp = {
      'fecha-desc': (a,b) => new Date(b.fecha) - new Date(a.fecha),
      'fecha-asc':  (a,b) => new Date(a.fecha) - new Date(b.fecha),
      'titulo-asc': (a,b) => (a.titulo||'').localeCompare(b.titulo||'', 'es')
    }[o];
    if (cmp) view.sort(cmp);

    // Paginación
    totalPages = Math.max(1, Math.ceil(view.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page), totalPages);
    render();
  }

  /* ===== Render del grid ===== */
  function render() {
    grid.innerHTML = '';

    if (view.length === 0) {
      // Mensaje visible y amable cuando no hay resultados
      grid.innerHTML = `
        <div style="padding:1rem; background:#fff; border:1px solid #eee; border-radius:12px;">
          <strong>Sin resultados.</strong>
          <p style="margin:.35rem 0 0;">Prueba con otras palabras clave o limpia los filtros.</p>
        </div>`;
      announce('0 artículos.');
      updatePager();
      return;
    }

    const start = (page - 1) * PAGE_SIZE;
    const slice = view.slice(start, start + PAGE_SIZE);

    const frag = document.createDocumentFragment();
    for (const p of slice) {
      const art = document.createElement('article');
      art.className = 'post';
      // NOTE: .post__img ya tiene aspect-ratio 16/9 en principal.css (evita CLS)
      // Añadimos width/height por performance cuando sea posible (valores razonables).
      art.innerHTML = `
        <div class="post__img">
          <img src="${safe(p.portada||'')}" alt="${safe(p.titulo||'Artículo')}" loading="lazy" decoding="async" width="1200" height="675">
        </div>
        <div class="post__body">
          <h3 class="post__title"><a href="./post.html?slug=${encodeURIComponent(p.slug)}">${safe(p.titulo||'Artículo')}</a></h3>
          <p class="post__meta">${fmtDate(p.fecha)} · ${Number(p.lecturaMin)||3} min · ${(Array.isArray(p.tags)?p.tags:[]).map(safe).join(', ')}</p>
          <p>${safe(p.extracto||'')}</p>
        </div>
      `;
      frag.appendChild(art);
    }

    grid.appendChild(frag);
    announce(`${view.length} artículo${view.length===1?'':'s'} en total. Mostrando ${slice.length}.`);
    updatePager();
  }

  /* ===== Rellena el select de etiquetas ===== */
  function fillTags(list) {
    const set = new Set();
    list.forEach(p => (Array.isArray(p.tags)?p.tags:[]).forEach(t => set.add(t)));
    const tags = Array.from(set).sort((a,b)=>a.localeCompare(b,'es'));
    for (const t of tags) {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      tagSel.appendChild(opt);
    }
  }

  /* ===== Paginador (Anterior/Siguiente + números) ===== */
  function updatePager() {
    // Estado prev/next
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;

    // Info textual (útil para SR)
    pageInfo.textContent = `Página ${page} de ${totalPages}`;

    // Botones numerados 1..N (colapsables si hay muchas páginas)
    pagerNum.innerHTML = '';
    const MAX = 5; // cantidad máxima de botones visibles (ej: 1 … 4 5 [6] 7 … 20)
    const pages = buildPageList(page, totalPages, MAX);

    for (const item of pages) {
      if (item === '…') {
        const span = document.createElement('span');
        span.textContent = '…';
        span.style.margin = '0 .25rem';
        pagerNum.appendChild(span);
        continue;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.textContent = String(item);
      // Marca la página actual con clase (se estiliza desde CSS)
      if (item === page) {
        btn.classList.add('is-current');
        btn.setAttribute('aria-current', 'page');
      }
      pagerNum.appendChild(btn);
    }
  }

  // Construye una lista de páginas con puntos suspensivos si son muchas
  function buildPageList(current, total, maxVisible) {
    if (total <= maxVisible) return Array.from({length: total}, (_,i)=>i+1);
    const pages = new Set([1, total, current]);
    // Vecinos alrededor de la página actual
    for (let i = 1; pages.size < Math.min(maxVisible-2, total); i++) {
      if (current - i > 1) pages.add(current - i);
      if (current + i < total) pages.add(current + i);
    }
    const arr = Array.from(pages).sort((a,b)=>a-b);
    // Insertar "…" donde hay saltos
    const out = [];
    for (let i=0; i<arr.length; i++){
      out.push(arr[i]);
      if (i < arr.length-1 && arr[i+1] !== arr[i]+1) out.push('…');
    }
    return out;
  }

  /* ===== Utilidades ===== */
  function announce(msg){ if (status) status.textContent = msg; }
  function fmtDate(iso){
    try { return new Date(iso).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'numeric' }); }
    catch { return iso || ''; }
  }

  /* ===== Eventos ===== */
  filtros?.addEventListener('input', () => { page = 1; apply(); });
  prevBtn?.addEventListener('click', () => { if (page>1){ page--; render(); } });
  nextBtn?.addEventListener('click', () => { if (page<totalPages){ page++; render(); } });

  /* ===== Inicio ===== */
  document.addEventListener('DOMContentLoaded', load);
})();

