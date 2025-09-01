
/* Foto auto-gallery PLUS
 * - Legge assets/foto/_gallery.json
 * - Filtri: per evento, per anno (se trovato nello slug o nel name), ricerca testuale
 * - Paginazione (default 24 per pagina)
 * - Modale con Navigazione Avanti/Indietro (sostituisce l'autoload di asd-modal-v2 per le nostre immagini)
 */

(function() {
  const MANIFEST_URL = '../assets/foto/_gallery.json';
  const PAGE_SIZE = 24;

  const state = {
    manifest: null,
    flat: [],          // tutte le foto con metadati arricchiti
    filtered: [],
    page: 1,
    pageSize: PAGE_SIZE,
    event: 'all',
    year: 'all',
    q: ''
  };

  const el = (t, a={}, c=[]) => {
    const n = document.createElement(t);
    for (const [k,v] of Object.entries(a||{})) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else n.setAttribute(k, v);
    }
    (Array.isArray(c)?c:[c]).forEach(ch => {
      if (ch == null) return;
      n.appendChild(typeof ch === 'string' ? document.createTextNode(ch) : ch);
    });
    return n;
  };

  function extractYear(str='') {
    const m = String(str).match(/(20\d{2}|19\d{2})/);
    return m ? m[1] : null;
  }

  function slugify(s){ return String(s||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'').replace(/\-+/g,'-').replace(/^\-|\-$/g,''); }

  async function loadManifest() {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('manifest HTTP ' + res.status);
    const data = await res.json();
    state.manifest = data;

    // flat array
    const flat = [];
    (data.events || []).forEach(evt => {
      const year = evt.year || extractYear(evt.name) || extractYear(evt.slug);
      (evt.images || []).forEach((img, idx) => {
        const file = img.file || img.src;
        if (!file) return;
        flat.push({
          id: `${evt.slug}__${idx}`,
          eventSlug: evt.slug,
          eventName: evt.name || evt.slug,
          year: year || 's.n.',
          file,
          thumb: img.thumb || (`thumbs/${file}`),
          title: img.title || evt.name || 'Foto'
        });
      });
    });
    state.flat = flat;
  }

  function uniq(arr){ return Array.from(new Set(arr)); }

  function applyFilters() {
    const { flat, event, year, q } = state;
    let rows = flat.slice();
    if (event !== 'all') rows = rows.filter(r => r.eventSlug === event);
    if (year !== 'all') rows = rows.filter(r => String(r.year) === String(year));
    if (q && q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter(r => (r.title||'').toLowerCase().includes(s) || (r.eventName||'').toLowerCase().includes(s));
    }
    state.filtered = rows;
    state.page = 1;
  }

  function pageSlice() {
    const start = (state.page-1) * state.pageSize;
    const end = start + state.pageSize;
    return state.filtered.slice(start, end);
  }

  function renderFilters(root) {
    const top = el('div', { class: 'cal-toolbar', style: 'gap:8px; margin:0 0 12px 0; flex-wrap:wrap; display:flex; align-items:center;' });

    const selEvent = el('select', { id: 'flt-event', class: 'btn', style: 'padding:8px 12px; border-radius:10px;' });
    selEvent.appendChild(el('option', { value: 'all' }, 'Tutti gli eventi'));
    uniq(state.flat.map(r => r.eventSlug)).forEach(slug => {
      const name = (state.flat.find(r => r.eventSlug===slug)?.eventName) || slug;
      selEvent.appendChild(el('option', { value: slug }, name));
    });

    const selYear = el('select', { id: 'flt-year', class: 'btn', style: 'padding:8px 12px; border-radius:10px;' });
    selYear.appendChild(el('option', { value: 'all' }, 'Tutti gli anni'));
    uniq(state.flat.map(r => String(r.year))).sort().forEach(y => {
      selYear.appendChild(el('option', { value: y }, y));
    });

    const search = el('input', { id: 'flt-q', type: 'search', placeholder: 'Cerca…', style: 'padding:9px 12px; border-radius:10px; border:0; min-width:200px;' });

    const spacer = el('span', { class: 'spacer', style: 'flex:1 1 auto;' });

    const perPage = el('select', { id: 'flt-pp', class: 'btn', style: 'padding:8px 12px; border-radius:10px;' }, [
      el('option', { value: '12' }, '12 / pagina'),
      el('option', { value: '24', selected: 'selected' }, '24 / pagina'),
      el('option', { value: '48' }, '48 / pagina'),
      el('option', { value: '96' }, '96 / pagina')
    ]);

    top.append(selEvent, selYear, search, spacer, perPage);
    root.appendChild(top);

    selEvent.addEventListener('change', () => { state.event = selEvent.value; applyFilters(); renderGrid(); });
    selYear.addEventListener('change',  () => { state.year  = selYear.value;  applyFilters(); renderGrid(); });
    search.addEventListener('input',    () => { state.q     = search.value;   applyFilters(); renderGrid(); });
    perPage.addEventListener('change',  () => { state.pageSize = parseInt(perPage.value,10)||24; state.page=1; renderGrid(); });
  }

  let gridRoot, pagerRoot;
  function renderScaffold(root) {
    gridRoot  = el('div', { id: 'gallery-grid' });
    pagerRoot = el('div', { id: 'gallery-pager', style: 'margin-top:14px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;' });
    root.append(gridRoot, pagerRoot);
  }

  function renderPager() {
    pagerRoot.innerHTML = '';
    const total = state.filtered.length;
    if (!total) return;

    const pages = Math.ceil(total / state.pageSize);
    const info = el('span', {}, `Pagina ${state.page}/${pages} — ${total} foto`);

    const prev = el('button', { class: 'btn', type: 'button' }, '←');
    const next = el('button', { class: 'btn', type: 'button' }, '→');
    prev.disabled = state.page <= 1;
    next.disabled = state.page >= pages;
    prev.addEventListener('click', () => { if (state.page>1) { state.page--; renderGrid(); } });
    next.addEventListener('click', () => { if (state.page<pages) { state.page++; renderGrid(); } });

    pagerRoot.append(prev, info, next);
  }

  function renderGrid() {
    gridRoot.innerHTML = '';
    const rows = pageSlice();
    if (!rows.length) {
      gridRoot.innerHTML = '<div style="opacity:.8">Nessun risultato.</div>';
      renderPager();
      return;
    }

    const grid = el('div', { class: 'foto-grid' });
    rows.forEach((r, idx) => {
      const base = `../assets/foto/${r.eventSlug}/`;
      const a = el('a', { href: base + r.file, 'data-group': r.eventSlug, 'data-file': r.file, 'data-index': String(idx), title: r.title });
      const img = el('img', { src: base + r.thumb, alt: r.title, loading: 'lazy' });
      a.appendChild(img);
      // Intercetta il click e usa la nostra modale con navigazione
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openViewer(r.eventSlug, r.file);
      });
      grid.appendChild(a);
    });
    gridRoot.appendChild(grid);
    renderPager();
  }

  // === Modale con navigazione ===
  function openViewer(eventSlug, file) {
    const modal = document.getElementById('asd-modal');
    const body  = modal.querySelector('.asd-modal__body');
    const list  = state.flat.filter(x => x.eventSlug === eventSlug);
    let index   = list.findIndex(x => x.file === file);
    if (index < 0) index = 0;

    function renderImage() {
      const item = list[index];
      const base = `../assets/foto/${item.eventSlug}/`;
      body.innerHTML = '';
      const wrap = el('div', { style: 'position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#0f0f10;' });
      const img  = el('img', { src: base + item.file, alt: item.title || 'Foto', style: 'max-width:100%; max-height:100%; object-fit:contain;' });
      const left = el('button', { class: 'btn', style: 'position:absolute; left:10px; top:50%; transform:translateY(-50%);' }, '←');
      const right= el('button', { class: 'btn', style: 'position:absolute; right:10px; top:50%; transform:translateY(-50%);' }, '→');
      const cap  = el('div', { style: 'position:absolute; bottom:10px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,.45); color:#fff; padding:6px 10px; border-radius:8px;' }, `${item.eventName} — ${item.title || ''}`);

      left.addEventListener('click', () => { index = (index - 1 + list.length) % list.length; renderImage(); });
      right.addEventListener('click',()=> { index = (index + 1) % list.length; renderImage(); });

      wrap.append(img, left, right, cap);
      body.appendChild(wrap);
    }

    renderImage();
    modal.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';

    // key navigation
    function onKey(e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); document.querySelector('#asd-modal .btn:nth-child(2)')?.click(); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); document.querySelector('#asd-modal .btn:nth-child(3)')?.click(); }
    }
    document.addEventListener('keydown', onKey, { once: false });

    // cleanup when modal closes
    const closeBtn = modal.querySelector('.asd-modal__close');
    const cleanup = () => document.removeEventListener('keydown', onKey);
    closeBtn.addEventListener('click', cleanup, { once: true });
    modal.addEventListener('click', (e)=>{ if (e.target === modal) cleanup(); }, { once: true });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('galleria');
    if (!container) return;
    try {
      await loadManifest();
      container.innerHTML = '';
      // scaffolding
      renderFilters(container);
      renderScaffold(container);
      applyFilters();
      renderGrid();
    } catch (e) {
      console.error(e);
      container.innerHTML = '<div style="opacity:.8">Impossibile caricare la galleria. Verifica il file <code>assets/foto/_gallery.json</code>.</div>';
    }
  });
})();
