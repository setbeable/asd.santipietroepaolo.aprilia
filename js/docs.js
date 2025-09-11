/* Regolamenti - griglia filtrabile con manifest JSON */
(function(){
  document.addEventListener('DOMContentLoaded', init, { once: true });

  async function init(){
    const $grid   = document.getElementById('docs-grid');
    const $q      = document.getElementById('docs-q');
    const $cat    = document.getElementById('docs-cat');
    const $year   = document.getElementById('docs-year');
    const $refresh= document.getElementById('docs-refresh');
    const $count  = document.getElementById('docs-count');
    const $pager  = document.getElementById('docs-pager');
    const $prev   = document.getElementById('docs-prev');
    const $next   = document.getElementById('docs-next');
    const $page   = document.getElementById('docs-page');

    if(!$grid) { console.error('[Docs] #docs-grid non trovato'); return; }

    const MANIFEST    = $grid.getAttribute('data-manifest')   || '../assets/_docs.json';
    const ROOT_PREFIX = $grid.getAttribute('data-root-prefix')|| '../';

    const state = { all: [], filtered: [], page: 1, pageSize: 15 };

    // carica manifest
    try{
      const res = await fetch(MANIFEST + (MANIFEST.includes('?') ? '&' : '?') + 'v=' + Date.now());
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      // il manifest può essere {items:[...]} o direttamente [...]
      const items = Array.isArray(data) ? data : (data.items || []);
      state.all = sanitizeItems(items);
    }catch(e){
      console.error('[Docs] Errore manifest', e);
      $grid.innerHTML = `<p class="docs-empty">Impossibile caricare i documenti.<br><small>${escapeHtml(String(e))}</small></p>`;
      return;
    }

    // popola categorie e anni
    const cats = Array.from(new Set(state.all.map(x => x.category).filter(Boolean))).sort();
    cats.forEach(c => $cat && $cat.insertAdjacentHTML('beforeend', `<option value="${escapeAttr(c)}">${labelCat(c)}</option>`));

    const years = Array.from(new Set(state.all.map(x => (x.date||'').slice(0,4)).filter(Boolean))).sort().reverse();
    years.forEach(y => $year && $year.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`));

    // eventi
    $q      && $q.addEventListener('input', apply);
    $cat    && $cat.addEventListener('change', apply);
    $year   && $year.addEventListener('change', apply);
    $refresh&& $refresh.addEventListener('click', () => apply(true));
    $prev   && $prev.addEventListener('click', () => { if (state.page>1){ state.page--; render(); } });
    $next   && $next.addEventListener('click', () => {
      const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      if (state.page < maxPage) { state.page++; render(); }
    });

    apply();

    function apply(force=false){
      const q   = ($q && $q.value || '').trim().toLowerCase();
      const cat = ($cat && $cat.value) || 'all';
      const yr  = ($year && $year.value) || 'all';

      let list = state.all.slice();

      if (cat !== 'all') list = list.filter(x => (x.category||'').toLowerCase() === cat.toLowerCase());
      if (yr  !== 'all') list = list.filter(x => (x.date||'').startsWith(yr + '-'));
      if (q) {
        list = list.filter(x => {
          const hay = [x.title||'', x.category||'', (x.excerpt||''), (x.tags||[]).join(' ')].join(' ').toLowerCase();
          return hay.includes(q);
        });
      }

      // ordina per data desc poi titolo
      list.sort((a,b) => (b.date || '').localeCompare(a.date || '') || (a.title||'').localeCompare(b.title||''));

      state.filtered = list;
      state.page = 1;
      render();

      if (force) {
        setTimeout(async () => {
          try {
            const res = await fetch(MANIFEST + (MANIFEST.includes('?') ? '&' : '?') + 'v=' + Date.now());
            if (res.ok) {
              const data = await res.json();
              const items = Array.isArray(data) ? data : (data.items || []);
              state.all = sanitizeItems(items);
              apply();
            }
          } catch {}
        }, 150);
      }
    }

    function render(){
      if ($count) $count.textContent = `${state.filtered.length} document${state.filtered.length === 1 ? 'o' : 'i'}`;

      // paginazione
      const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      if ($pager) {
        $pager.hidden = state.filtered.length <= state.pageSize;
        if ($page) $page.textContent = `${state.page} / ${maxPage}`;
        if ($prev) $prev.disabled = state.page <= 1;
        if ($next) $next.disabled = state.page >= maxPage;
      }

      const start = (state.page - 1) * state.pageSize;
      const pageList = state.filtered.slice(start, start + state.pageSize);

      if (!pageList.length) { $grid.innerHTML = `<p class="docs-empty">Nessun documento trovato.</p>`; return; }

      $grid.innerHTML = pageList.map(cardHTML).join('');
    }

    function cardHTML(it){
      const title = escapeHtml(it.title || filenameFromPath(it.attach) || 'Documento');
      const excerpt = it.excerpt ? `<p class="docs-excerpt">${escapeHtml(it.excerpt)}</p>` : '';
      const date = it.date ? `<span>${formatDate(it.date)}</span>` : '';
      const cat = it.category ? `<span class="badge">${labelCat(it.category)}</span>` : '';

      const open = it.link
        ? `<a class="docs-btn" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">Apri</a>`
        : '';

      const attachURL = resolveAsset(it.attach, ROOT_PREFIX);
      const attach = it.attach
        ? `<a class="docs-btn" href="${escapeAttr(attachURL)}" target="_blank" rel="noopener">Scarica</a>`
        : '';

      return `
        <article class="docs-card">
          <div class="docs-body">
            <span class="docs-title">${title}</span>
            ${excerpt}
            <div class="docs-meta">
              ${cat}
              ${date}
              <div class="docs-actions">${open}${attach}</div>
            </div>
          </div>
        </article>
      `;
    }

    // util
    function sanitizeItems(items){
      return items.map(it => ({
        title: it.title || it.name || filenameFromPath(it.attach) || '',
        category: it.category || inferCategory(it),
        date: it.date || inferDateFromName(it) || '',
        excerpt: it.excerpt || '',
        link: it.link || '',
        attach: it.attach || it.path || '',
        tags: it.tags || []
      }));
    }
    function inferCategory(it){
      // prova a leggere dalla path: assets/docs/<categoria>/file.pdf
      const p = it.attach || it.path || '';
      const m = p.match(/^assets\/docs\/([^/]+)\//i);
      return m ? m[1] : '';
    }
    function inferDateFromName(it){
      // se il filename inizia con YYYY o YYYY-MM-DD
      const name = filenameFromPath(it.attach || it.path || '');
      const m1 = name.match(/^(\d{4})/);
      if (m1) return m1[1] + '-01-01';
      const m2 = name.match(/^(\d{4}-\d{2}-\d{2})/);
      return m2 ? m2[1] : '';
    }
    function filenameFromPath(p){ return (p||'').split('/').pop(); }
    function labelCat(s){ return (s||'').replace(/[-_]/g,' ').trim(); }
    function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
    function escapeAttr(s){ return escapeHtml(s); }
    function formatDate(iso){
      const [y,m,d] = (iso||'').split('-').map(Number);
      if(!y||!m||!d) return iso || '';
      const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
      return `${d} ${months[m-1]} ${y}`;
    }
    function resolveAsset(p, rootPrefix){
      if(!p) return p;
      if (/^(https?:)?\/\//.test(p)) return p;
      if (p.startsWith('data:')) return p;
      if (p.startsWith('../')) return p;
      if (p.startsWith('assets/')) return rootPrefix + p;
      return p;
    }
  }
})();
