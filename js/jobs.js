// jobs.js — Bugambilia
// Manejo del formulario "Trabaja con nosotros":
// - Validación básica (nombre/email/vacante, patrón de teléfono)
// - Honeypot anti-bots
// - Envío via fetch al endpoint del atributo action del form (si existe)
// - Fallback: log local si no hay endpoint
// - Accesible: estado en #status (aria-live)

(() => {
  'use strict';

  // ---- Helper de selección ----
  const $ = (s, c = document) => c.querySelector(s);

  const form = $('#jobForm');  // <form id="jobForm">
  const status = $('#status'); // <p id="status" role="status" aria-live="polite">

  if (!form) return;

  // Sanitiza campos de entrada para evitar HTML injection accidental
  const clean = (s) => String(s ?? '').replace(/[<>]/g, '').trim();

  // Actualiza feedback de estado (ok=false para errores)
  const setStatus = (msg, ok = true) => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = ok ? 'inherit' : '#b00020';
  };

  // Valida formato de email simple
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(''); // limpia estado

    // ---- Honeypot ----
    // Campo "empresa" escondido visualmente para atrapar bots que llenan todo.
    const hp = form.querySelector('input[name="empresa"]');
    if (hp && hp.value) {
      setStatus('Error de validación.', false);
      return;
    }

    // ---- Recolección y limpieza ----
    const data = Object.fromEntries(new FormData(form));
    data.nombre   = clean(data.nombre);
    data.email    = clean(data.email);
    data.vacante  = clean(data.vacante);
    data.telefono = clean(data.telefono || '');
    data.mensaje  = clean(data.mensaje || '');

    // ---- Validaciones mínimas ----
    if (!data.nombre || !data.email || !data.vacante) {
      setStatus('Por favor completa los campos obligatorios.', false);
      return;
    }
    if (!isEmail(data.email)) {
      setStatus('Ingresa un correo válido.', false);
      return;
    }
    if (data.telefono && !/^[0-9]{7,12}$/.test(data.telefono)) {
      setStatus('El teléfono debe tener entre 7 y 12 dígitos.', false);
      return;
    }

    // ---- Preparar envío ----
    const endpoint = form.getAttribute('action') || ''; // e.g., /api/postular
    const body = JSON.stringify({
      nombre: data.nombre,
      email: data.email,
      vacante: data.vacante,
      telefono: data.telefono,
      mensaje: data.mensaje,
      // Meta útil para diagnóstico (no sensible)
      ua: navigator.userAgent,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Indicador de "ocupado" para lectores de pantalla
    form.setAttribute('aria-busy', 'true');

    try {
      if (endpoint) {
        // Envío real al backend configurado en el atributo action
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          cache: 'no-store',
          credentials: 'omit',
          mode: 'cors'
        });
        if (!res.ok) throw new Error('Respuesta no OK');
      } else {
        // Fallback: sin endpoint, hacemos un log local (simulación)
        console.info('Postulación (simulada):', JSON.parse(body));
      }

      setStatus('¡Gracias! Hemos recibido tu postulación.');
      form.reset();
    } catch (err) {
      console.error(err);
      setStatus('No se pudo enviar. Intenta más tarde.', false);
    } finally {
      form.removeAttribute('aria-busy');
    }
  });
})();
