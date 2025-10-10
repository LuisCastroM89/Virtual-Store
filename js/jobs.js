// jobs.js (ESM compatible) — Bugambilia
// Manejo de formulario 'Trabaja con nosotros' con validación, honeypot y envío seguro.
// Compatible con CSP estricta (sin eval/inline).

(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);

  const form = $('#jobForm');
  const status = $('#status');

  if (!form) return;

  const clean = (s) => String(s ?? '').replace(/[<>]/g, '').trim();

  const setStatus = (msg, ok = true) => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = ok ? 'inherit' : '#b00020';
  };

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    // Honeypot
    const hp = form.querySelector('input[name="empresa"]');
    if (hp && hp.value) {
      setStatus('Error de validación.', false);
      return;
    }

    // Datos limpios
    const data = Object.fromEntries(new FormData(form));
    data.nombre = clean(data.nombre);
    data.email = clean(data.email);
    data.vacante = clean(data.vacante);
    data.telefono = clean(data.telefono || '');
    data.mensaje = clean(data.mensaje || '');

    // Validaciones mínimas
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

    // Preparar envío
    const endpoint = form.getAttribute('action') || '';
    const body = JSON.stringify({
      nombre: data.nombre,
      email: data.email,
      vacante: data.vacante,
      telefono: data.telefono,
      mensaje: data.mensaje,
      // Meta útil
      ua: navigator.userAgent,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Mostrar estado
    form.setAttribute('aria-busy', 'true');

    try {
      if (endpoint) {
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
        // Fallback sin endpoint: simulación local
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
