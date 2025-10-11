// post.js — Bugambilia
// - Carga un artículo desde /data/posts.json usando ?slug=...
// - Actualiza <title> y metas (OG/Twitter) dinámicamente
// - Inyecta JSON-LD "Article" para SEO
// - Maneja 404 de post con sugeridos y botón "Volver al blog"

(() => {
  'use strict';

  /* ===== Helpers ===== */
  const $ = (s, c = document) => c.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();

  const container = $('#post');       // donde va el contenido del artículo
  const status = $('#post-status');   // mensajes accesibles
  const suggested = $('#suggested');  // sugerencias para 404

  if (!container) return;

  function getSlug() {
    const url = new URL(location.href);
    return url.searchParams.get('slug') || '';
  }

  async function loadAll() {
    const res = await fetch('../data/posts.json', { cache:'no-store', credentials:'omit' });
    if (!res.ok) throw new Error('No se pudo cargar posts.json');
    return res.json();
  }

  // Render del artículo (se asume contenido HTML "limpio" de origen)
  function renderPost(p) {
    container.innerHTML = `
      <header style="margin-bottom: .75rem;">
        <h1>${esc(p.titulo)}</h1>
        <p style="color:#64748b; margin:.25rem 0;">
          ${fmtDate(p.fecha)} &middot; ${Number(p.lecturaMin)||3} min &middot; ${(p.tags||[]).map(esc).join(', ')}
        </p>
        ${p.portada ? `
          <figure style="margin:1rem 0;">
            <img src="${p.portada}" alt="${esc(p.titulo)}" loading="lazy" decoding="async" width="1600" height="900" style="max-width:100%; height:auto;">
          </figure>
        ` : ''}
      </header>
      ${p.contenido}
    `;
    if (status) status.textContent = 'Artículo cargado.';
  }

  // Vista 404 con sugeridos por coincidencia de tags
  function render404(all) {
    container.innerHTML = `
      <div style="padding:1rem; background:#fff; border:1px solid #eee; border-radius:12px;">
        <h1 style="margin:0;">No encontramos este artículo</h1>
        <p style="margin:.5rem 0 0;">Es posible que el enlace haya cambiado o el artículo haya sido movido.</p>
        <p><a class="btn" href="./blog.html">← Volver al blog</a></p>
      </div>
    `;
    if (status) status.textContent = 'Artículo no disponible.';

    // Sugeridos: los 3 más recientes
    const top = (all || []).slice().sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,3);
    if (!top.length) return;

    const frag = document.createDocumentFragment();
    const wrap = document.createElement('div');
    wrap.innerHTML = `<h2 style="margin-top:1rem;">Quizás te interese</h2>`;
    const list = document.createElement('div');
    list.className = 'blog-grid'; // reutilizamos el mismo layout de tarjetas
    top.forEach(p => {
      const card = document.createElement('article');
      card.className = 'post';
      card.innerHTML = `
        <div class="post__img">
          <img src="${p.portada||''}" alt="${esc(p.titulo||'Artículo')}" loading="lazy" decoding="async" width="1200" height="675">
        </div>
        <div class="post__body">
          <h3 class="post__title"><a href="./post.html?slug=${encodeURIComponent(p.slug)}">${esc(p.titulo||'Artículo')}</a></h3>
          <p class="post__meta">${fmtDate(p.fecha)} · ${Number(p.lecturaMin)||3} min · ${(p.tags||[]).map(esc).join(', ')}</p>
          <p>${esc(p.extracto||'')}</p>
        </div>
      `;
      list.appendChild(card);
    });
    wrap.appendChild(list);
    frag.appendChild(wrap);
    suggested.innerHTML = '';
    suggested.appendChild(frag);
  }

  // Inserta/actualiza SEO: <title>, description, OG, Twitter y JSON-LD Article
  function applySEO(p) {
    const title = p?.seo?.title || `${p.titulo} | Bugambilia`;
    const desc  = p?.seo?.description || p?.extracto || '';
    const img   = p?.seo?.ogImage || p?.portada || '';

    // <title> y <meta name="description">
    document.title = title;
    setMeta('name', 'description', desc);

    // Open Graph
    setMeta('property', 'og:type', 'article');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    if (img) setMeta('property', 'og:image', new URL(img, document.baseURI).href);

    // Twitter Cards (summary_large_image)
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    if (img) setMeta('name', 'twitter:image', new URL(img, document.baseURI).href);

    // JSON-LD (Article)
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': p.titulo,
      'datePublished': p.fecha,
      'author': { '@type': 'Organization', 'name': p.autor || 'Bugambilia' },
      'image': img ? [new URL(img, document.baseURI).href] : undefined,
      'description': desc
    };
    setJSONLD(ld);
  }

  // Crea/actualiza <meta ...> con (attrKey=property|name, attrVal, content)
  function setMeta(attrKey, attrVal, content) {
    let el = [...document.head.querySelectorAll(`meta[${attrKey}="${attrVal}"]`)].shift();
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrKey, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  // Inserta/actualiza un bloque <script type="application/ld+json">
  function setJSONLD(obj) {
    let tag = document.getElementById('ld-article');
    if (!tag) {
      tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.id = 'ld-article';
      document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify(obj);
  }

  function fmtDate(iso){
    try {
      return new Date(iso).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' });
    } catch { return iso || ''; }
  }

  /* ===== Inicio ===== */
  document.addEventListener('DOMContentLoaded', async () => {
    container.setAttribute('aria-busy', 'true');
    try {
      const slug = getSlug();
      const all = await loadAll();
      const post = all.find(p => p.slug === slug);
      if (!post) {
        render404(all);
        return;
      }
      renderPost(post);
      applySEO(post);
    } catch (e) {
      console.error(e);
      render404([]);
    } finally {
      container.setAttribute('aria-busy', 'false');
    }
  });
})();
