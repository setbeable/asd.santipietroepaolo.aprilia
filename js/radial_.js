(function () {
  const zoomWrap  = document.getElementById('radial-zoom');
  const wrap      = document.getElementById('radial');
  const container = document.getElementById('radial-nav');
  const menu      = document.querySelector('nav.menu');

  if (!zoomWrap || !wrap || !container || !menu) return;

  const INNER_R     = 33;
  const OUTER_R     = 46;
  const STORAGE_KEY = 'radial_layout_v3';
  const LOCK_KEY    = 'radial_locked';

  // Pages considered “primary” go on the inner ring
  const primary = [
    'pages/hub.html',       'pages/orari.html',   'pages/documenti.html',
    'pages/campionati.html','pages/regolamento.html','pages/calendario.html',
    'pages/contatti.html',  'pages/chi-siamo.html'
  ];

  // Collect all links from the nav (skip CTAs)
  const all   = Array.from(menu.querySelectorAll('a.btn'))
                    .filter(a => !a.classList.contains('cta') && !a.classList.contains('alt'));
  const inner = [], outer = [];
  all.forEach(a => (primary.includes(a.getAttribute('href')) ? inner : outer).push(a));

  /* ----------------------------------------------------------------
   * Default positions: define an angle (0‑360) for each item ID.
   * The ID is derived from the href or text (non‑word chars replaced by underscores).
   * Angles use degrees: 0° points to the right; –90° points up.
   */
  const defaultPositions = {
    'pages/hub_html':        -90,  // top
    'pages/orari_html':      30,   // upper right
    'pages/documenti_html':  75,   // upper right
    'pages/campionati_html': 150,  // lower right
    'pages/regolamento_html':190,  // bottom right
    'pages/calendario_html': 230,  // bottom left
    'pages/contatti_html':   270,  // left
    'pages/chi-siamo_html':  310,  // upper left

    'pages/interviste_html':    180,
    'pages/sponsor_html':       0,
    'pages/foto_html':          270,
    'pages/video_html':         210,
    'pages/comunicati_html':    120,
    'pages/newsletter_html':    90,
    'pages/regolamento_html':   180,
    // add more if you have extra menu items…
  };

  function createItem (a, angle, ring) {
    const rad = (angle * Math.PI) / 180;
    const r   = ring === 'inner' ? INNER_R : OUTER_R;
    const x   = 50 + r * Math.cos(rad);
    const y   = 50 + r * Math.sin(rad);

    const div  = document.createElement('div');
    const node = a.cloneNode(true);
    const id   = (node.getAttribute('href') || node.textContent).replace(/\W+/g, '_');

    div.className      = 'radial-item appear';
    div.dataset.id     = id;
    div.dataset.ring   = ring;
    div.dataset.angle  = angle.toFixed(2);
    div.style.left     = x + '%';
    div.style.top      = y + '%';
    div.appendChild(node);
    container.appendChild(div);
    return div;
  }

  // initial distribution uses default angles if defined
  function distribute (links, ring) {
    links.forEach((a) => {
      const id    = (a.getAttribute('href') || a.textContent).replace(/\W+/g, '_');
      const angle = defaultPositions.hasOwnProperty(id)
        ? defaultPositions[id]
        : -90; // fallback: place at top if no default
      createItem(a, angle, ring);
    });
  }

  // place inner and outer items
  distribute(inner, 'inner');
  distribute(outer, 'outer');

  // apply saved positions
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  Array.from(container.children).forEach(el => {
    const s = saved[el.dataset.id];
    if (s) {
      el.style.left  = s.left;
      el.style.top   = s.top;
      el.dataset.angle = s.angle || el.dataset.angle;
      el.classList.remove('appear');
      el.style.opacity = 1;
    }
  });

  // dragging logic (unchanged from your original)
  let dragging = null;
  const locked = localStorage.getItem(LOCK_KEY) === '1';
  function getRect() {
    return wrap.getBoundingClientRect();
  }
  function pointerAngle(e, rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI;
  }
  function setByAngle(el, angle) {
    const r  = el.dataset.ring === 'inner' ? INNER_R : OUTER_R;
    const rad= angle * Math.PI / 180;
    const x  = 50 + r * Math.cos(rad);
    const y  = 50 + r * Math.sin(rad);
    el.style.left  = x + '%';
    el.style.top   = y + '%';
    el.dataset.angle = angle.toFixed(2);
  }
  function onDown (e) {
    if (locked) return;
    dragging = e.currentTarget;
    dragging.style.cursor = 'grabbing';
    dragging.setPointerCapture?.(e.pointerId || 0);
  }
  function onMove (e) {
    if (!dragging || locked) return;
    const a = pointerAngle(e, getRect());
    setByAngle(dragging, a);
  }
  function onUp (e) {
    if (!dragging) return;
    const id    = dragging.dataset.id;
    const data  = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    data[id]    = {
      left:  dragging.style.left,
      top:   dragging.style.top,
      angle: dragging.dataset.angle
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    dragging.style.cursor = 'grab';
    dragging.releasePointerCapture?.(e.pointerId || 0);
    dragging = null;
  }
  Array.from(container.children).forEach(el => {
    el.style.cursor = locked ? 'default' : 'grab';
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // zoom handling (unchanged)
  let scale = 1;
  const minScale = 0.65, maxScale = 1.5;
  zoomWrap.addEventListener('wheel', function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.05;
    scale = Math.min(maxScale, Math.max(minScale, scale + delta));
    zoomWrap.style.transform = 'scale(' + scale.toFixed(2) + ')';
  }, { passive: false });

  // reset & lock
  const resetBtn = document.getElementById('reset-layout');
  const lockBtn  = document.getElementById('lock-layout');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
  }
  if (lockBtn) {
    lockBtn.textContent = locked
      ? '🔒 Layout bloccato (clic per sbloccare)'
      : '🔓 Blocca layout';
    lockBtn.addEventListener('click', function () {
      const val = localStorage.getItem(LOCK_KEY) === '1';
      if (val) localStorage.removeItem(LOCK_KEY);
      else     localStorage.setItem(LOCK_KEY, '1');
      window.location.reload();
    });
  }
})();
