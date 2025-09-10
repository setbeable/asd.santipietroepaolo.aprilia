/* Hub - compat con HTML esistente (toolbar/hero/griglia/pager) */
(function () {
  document.addEventListener('DOMContentLoaded', init, { once: true });

  async function init () {
    const $grid = document.getElementById('hub-grid');
    if (!$grid) return console.error('[Hub] #hub-grid non trovato');

    // data-* dal container griglia
    const BASE = (($grid.getAttribute('data-assets-base')) || '../assets/hub/').replace(/\/+$/, '') + '/';
    const MANIFEST = $grid.getAttribute('data-manifest') || '../assets/_hub.json';

    // UI già presenti nell’HTML
    const $q = document.getElementById('hub-q');
    const $cat = document.getElementById('hub-cat');
    const $refresh = document.getElementById('hub-refresh');
    const $count = document.getElementById('hub-count');
    const $hero = document.getElementById('hub-hero');
    const $heroTrack = document.getElementById('hub-hero-track');
    const $pager = document.getElementById('hub-pager');
    const $prev = document.getElementById('hub-prev');
    const $next = document.getElementById('hub-next');
    const $page = document.getElementById('hub-page');

    const state = {
      all: [],
      filtered: [],
      page: 1,
      pageSize: 12
    };

    // Carica manifest
    try {
      const res = await fetch(MANIFEST + (MANIFEST.includes('?') ? '&' : '?') + 'v=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      state.all = Array.isArray(data.items) ? data.items : [];
    } catch (e) {
      console.error('[Hub] Errore nel caricamento manifest', e);
      $grid.innerHTML = `<p class="hub-empty">Impossibile caricare i contenuti dell’Hub.<br><small>${escapeHtml(String(e))}</small></p>`;
      return;
    }

    // Popola categorie
    const cats = Array.from(new Set(state.all.map(x => x.category).filter(Boolean))).sort();
    cats.forEach(c => $cat && $cat.insertAdjacentHTML('beforeend', `<option value="${escapeAttr(c)}">${labelCat(c)}</option>`));

    // Eventi UI
    $q && $q.addEventListener('input', apply);
    $cat && $cat.addEventListener('change', apply);
    $refresh && $refresh.addEventListener('click', apply);
    $prev && $prev.addEventListener('click', () => { if (state.page > 1) { state.page--; render(); } });
    $next && $next.addEventListener('click', () => {
      const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      if (state.page < maxPage) { state.page++; render(); }
    });

    // Prima applicazione
    apply();

    // --- funzioni ---
    function apply () {
      const q = ($q && $q.value || '').trim().toLowerCase();
      const cat = ($cat && $cat.value) || 'all';

      let list = state.all.slice();

      if (cat !== 'all') {
        list = list.filter(x => (x.category || '').toLowerCase() === cat.toLowerCase());
      }
      if (q) {
        list = list.filter(x => {
          const hay = [
            x.title || '',
            x.category || '',
            (x.excerpt || ''),
            (x.tags || []).join(' ')
          ].join(' ').toLowerCase();
          return hay.includes(q);
        });
      }

      // ordina per data desc
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      state.filtered = list;
      state.page = 1;
      render();
    }

    function render () {
      // count
      if ($count) $count.textContent = `${state.filtered.length} contenut${state.filtered.length === 1 ? 'o' : 'i'}`;

      // hero (prime 3 con cover)
      const heroItems = state.filtered.filter(x => x.cover).slice(0, 3);
      if ($hero && $heroTrack) {
        if (heroItems.length) {
          $hero.hidden = false;
          $heroTrack.innerHTML = heroItems.map(h => `
            <figure class="hub-hero__slide">
              <img src="${escapeAttr(h.cover)}" alt="">
              <figcaption>
                <a href="${escapeAttr(h.link || '#')}" ${h.link ? 'target="_blank" rel="noopener"' : ''}>${escapeHtml(h.title || '')}</a>
                ${h.date ? `<small>${formatDate(h.date)}</small>` : ''}
              </figcaption>
            </figure>
          `).join('');
        } else {
          $hero.hidden = true;
        }
      }

      // paginazione
      const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      if ($pager) {
        $pager.hidden = state.filtered.length <= state.pageSize;
        if ($page) $page.textContent = `${state.page} / ${maxPage}`;
        if ($prev) $prev.disabled = state.page <= 1;
        if ($next) $next.disabled = state.page >= maxPage;
      }

      // slice pagina corrente
      const start = (state.page - 1) * state.pageSize;
      const pageList = state.filtered.slice(start, start + state.pageSize);

      // griglia
      if (!pageList.length) {
        $grid.innerHTML = `<p class="hub-empty">Nessun contenuto trovato.</p>`;
        return;
      }
      $grid.innerHTML = pageList.map(cardHTML).join('');
    }

    function cardHTML (it) {
      const cover = it.cover ? `<img class="hub-cover" loading="lazy" src="${escapeAttr(it.cover)}" alt="">` : `<div class="hub-cover"></div>`;
      const title = escapeHtml(it.title || 'Senza titolo');
      const excerpt = it.excerpt ? `<p class="hub-excerpt">${escapeHtml(it.excerpt)}</p>` : '';
      const date = it.date ? `<span>${formatDate(it.date)}</span>` : '';
      const cat = it.category ? `<span class="badge ${cssSafe(it.category)}">${labelCat(it.category)}</span>` : '';
      const open = it.link ? `<a class="hub-btn" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">Apri</a>` : '';
      const attach = it.attach ? `<a class="hub-btn" href="${escapeAttr(it.attach)}" target="_blank" rel="noopener">Allegato</a>` : '';

      const titleWrapped = it.link
        ? `<a class="hub-title" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">${title}</a>`
        : `<span class="hub-title">${title}</span>`;

      return `
        <article class="hub-card">
          ${cover}
          <div class="hub-body">
            ${titleWrapped}
            ${excerpt}
            <div class="hub-meta">
              ${cat}
              ${date}
              <div class="hub-actions">${open}${attach}</div>
            </div>
          </div>
        </article>
      `;
    }

    // util
    function labelCat(s){ return (s||'').replace(/[-_]/g, ' ').trim(); }
    function cssSafe(s){ return (s||'').toLowerCase().replace(/[^a-z0-9_-]+/g, '-'); }
    function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
    function escapeAttr(s){ return escapeHtml(s); }
    function formatDate(iso){
      const [y,m,d] = (iso||'').split('-').map(Number);
      if(!y||!m||!d) return iso || '';
      const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
      return `${d} ${months[m-1]} ${y}`;
    }
  }
})();
