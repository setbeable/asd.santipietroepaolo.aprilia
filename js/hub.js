/* ============================================================================
 * Hub (auto) — legge assets/_hub.json e genera card ordinate e filtrabili
 * ========================================================================= */
(function () {
  document.addEventListener('DOMContentLoaded', init, { once: true });

  async function init () {
    const root = document.getElementById('hub');
    if (!root) { console.error('[Hub] #hub non trovato'); return; }

    const BASE = (root.getAttribute('data-assets-base') || 'assets/hub/').replace(/\/+$/, '') + '/';
    const MANIFEST = (root.getAttribute('data-manifest') || 'assets/_hub.json');

    const state = {
      all: [],
      filtered: [],
      q: '',
      category: 'all',
      year: 'all',
      sort: 'date_desc'
    };

    // toolbar
    root.innerHTML = `
      <div class="hub-toolbar">
        <input type="search" id="hub-q" placeholder="Cerca… (titolo, categoria, tag)" />
        <select id="hub-cat"><option value="all">Tutte le categorie</option></select>
        <select id="hub-year"><option value="all">Tutti gli anni</option></select>
        <select id="hub-sort">
          <option value="date_desc">Più recenti</option>
          <option value="date_asc">Meno recenti</option>
          <option value="title_asc">Titolo A→Z</option>
          <option value="title_desc">Titolo Z→A</option>
        </select>
        <button id="hub-refresh">Aggiorna</button>
        <div class="hub-count" id="hub-count"></div>
      </div>
      <div class="hub-grid" id="hub-grid" aria-live="polite"></div>
    `;

    const $q = root.querySelector('#hub-q');
    const $cat = root.querySelector('#hub-cat');
    const $year = root.querySelector('#hub-year');
    const $sort = root.querySelector('#hub-sort');
    const $refresh = root.querySelector('#hub-refresh');
    const $grid = root.querySelector('#hub-grid');
    const $count = root.querySelector('#hub-count');

    // carica manifest
    try {
      const res = await fetch(MANIFEST + (MANIFEST.includes('?') ? '&' : '?') + 'v=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      state.all = Array.isArray(data.items) ? data.items : [];
    } catch (e) {
      console.error('[Hub] Errore nel caricamento manifest', e);
      $grid.innerHTML = `<p class="hub-empty">Impossibile caricare i contenuti dell’Hub.</p>`;
      return;
    }

    // popola filtri
    const cats = Array.from(new Set(state.all.map(x => x.category))).sort();
    cats.forEach(c => $cat.insertAdjacentHTML('beforeend', `<option value="${c}">${labelCat(c)}</option>`));
    const years = Array.from(new Set(state.all.map(x => (x.date||'').slice(0,4)).filter(Boolean))).sort().reverse();
    years.forEach(y => $year.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`));

    // eventi filtri
    $q.addEventListener('input', apply);
    $cat.addEventListener('change', e => { state.category = e.target.value; apply(); });
    $year.addEventListener('change', e => { state.year = e.target.value; apply(); });
    $sort.addEventListener('change', e => { state.sort = e.target.value; apply(); });
    $refresh.addEventListener('click', () => { apply(true); });

    // avvio
    apply();

    function apply(force = false) {
      state.q = $q.value.trim().toLowerCase();

      let list = state.all.slice();

      if (state.category !== 'all') {
        list = list.filter(x => (x.category || '').toLowerCase() === state.category.toLowerCase());
      }
      if (state.year !== 'all') {
        list = list.filter(x => (x.date || '').startsWith(state.year + '-'));
      }
      if (state.q) {
        list = list.filter(x => {
          const txt = [
            x.title || '',
            x.category || '',
            (x.excerpt || ''),
            (x.tags || []).join(' ')
          ].join(' ').toLowerCase();
          return txt.includes(state.q);
        });
      }

      // ordinamento
      list.sort((a,b) => {
        const tA = (a.title||'').toLocaleLowerCase();
        const tB = (b.title||'').toLocaleLowerCase();
        const dA = a.date || '1970-01-01';
        const dB = b.date || '1970-01-01';
        switch (state.sort) {
          case 'title_asc': return tA.localeCompare(tB);
          case 'title_desc': return tB.localeCompare(tA);
          case 'date_asc': return dA.localeCompare(dB);
          case 'date_desc':
          default: return dB.localeCompare(dA);
        }
      });

      state.filtered = list;
      render();
      if (force) {
        // ricontrollo manifest a caldo
        setTimeout(async () => {
          try {
            const res = await fetch(MANIFEST + (MANIFEST.includes('?') ? '&' : '?') + 'v=' + Date.now());
            if (res.ok) {
              const data = await res.json();
              state.all = Array.isArray(data.items) ? data.items : state.all;
              apply();
            }
          } catch {}
        }, 150);
      }
    }

    function render() {
      $count.textContent = `${state.filtered.length} contenut${state.filtered.length === 1 ? 'o' : 'i'}`;
      if (!state.filtered.length) {
        $grid.innerHTML = `<p class="hub-empty">Nessun contenuto trovato con i filtri attuali.</p>`;
        return;
      }
      $grid.innerHTML = state.filtered.map(cardHTML).join('');
    }

    function cardHTML(it) {
      const cover = it.cover ? `<img class="hub-cover" loading="lazy" src="${escapeHtml(it.cover)}" alt="">` : `<div class="hub-cover"></div>`;
      const title = escapeHtml(it.title || 'Senza titolo');
      const excerpt = it.excerpt ? `<p class="hub-excerpt">${escapeHtml(it.excerpt)}</p>` : '';
      const date = it.date ? formatDate(it.date) : '';
      const cat = it.category ? `<span class="badge ${cssSafe(it.category)}">${labelCat(it.category)}</span>` : '';
      const openLink = it.link ? `<a class="hub-btn" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">Apri</a>` : '';
      const attach = it.attach ? `<a class="hub-btn" href="${escapeAttr(it.attach)}" target="_blank" rel="noopener">Allegato</a>` : '';
      const titleLinkStart = it.link ? `<a class="hub-title" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">` : `<span class="hub-title">`;
      const titleLinkEnd = it.link ? `</a>` : `</span>`;

      return `
        <article class="hub-card">
          ${cover}
          <div class="hub-body">
            ${titleLinkStart}${title}${titleLinkEnd}
            ${excerpt}
            <div class="hub-meta">
              ${cat}
              <span>${date}</span>
              <div class="hub-actions">${openLink}${attach}</div>
            </div>
          </div>
        </article>
      `;
    }

    // util
    function labelCat(c){ return (c||'').replace(/[-_]/g,' ').trim(); }
    function cssSafe(s){ return (s||'').toLowerCase().replace(/[^a-z0-9_-]+/g,'-'); }
    function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
    function escapeAttr(s){ return escapeHtml(s); }
    function formatDate(iso){
      // ISO YYYY-MM-DD -> 14 settembre 2025
      const [y,m,d] = iso.split('-').map(x=>parseInt(x,10));
      if(!y||!m||!d) return iso||'';
      const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
      return `${d} ${months[m-1]} ${y}`;
    }
  }
})();
