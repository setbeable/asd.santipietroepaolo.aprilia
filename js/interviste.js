/* ==== Interviste – griglia dinamica con manifest JSON ==== */
(function(){
  document.addEventListener('DOMContentLoaded', init, { once: true });

  async function init(){
    const $grid   = document.getElementById('intv-grid');
    const $q      = document.getElementById('intv-q');
    const $refresh= document.getElementById('intv-refresh');
    const $count  = document.getElementById('intv-count');
    const $pager  = document.getElementById('intv-pager');
    const $prev   = document.getElementById('intv-prev');
    const $next   = document.getElementById('intv-next');
    const $page   = document.getElementById('intv-page');

    if(!$grid){ console.error('[Interviste] #intv-grid non trovato'); return; }

    const MANIFEST    = $grid.getAttribute('data-manifest')   || '../assets/_interviste.json';
    const ROOT_PREFIX = $grid.getAttribute('data-assets-base')|| '../assets/interviste/';
    const BASE_PREFIX = $grid.getAttribute('data-root-prefix')|| '../';

    const state = { all: [], filtered: [], page: 1, pageSize: 12 };

    // Carica manifest
    try{
      const res = await fetch(MANIFEST + (MANIFEST.includes('?')?'&':'?') + 'v=' + Date.now());
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.items||[]);
      state.all = sanitizeItems(items);
    }catch(e){
      console.error('[Interviste] Errore manifest', e);
      $grid.innerHTML = `<p class="docs-empty">Impossibile caricare le interviste.<br><small>${escapeHtml(String(e))}</small></p>`;
      return;
    }

    // Eventi UI
    $q       && $q.addEventListener('input', apply);
    $refresh && $refresh.addEventListener('click', () => apply(true));
    $prev    && $prev.addEventListener('click', () => { if (state.page>1){ state.page--; render(); } });
    $next    && $next.addEventListener('click', () => {
      const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      if (state.page < maxPage) { state.page++; render(); }
    });

    // Prima render
    apply();

    function apply(force=false){
      const q = ($q && $q.value || '').trim().toLowerCase();
      let list = state.all.slice();

      if (q){
        list = list.filter(x => {
          const hay = [
            x.title||'',
            x.author||'',
            x.excerpt||'',
            (x.tags||[]).join(' ')
          ].join(' ').toLowerCase();
          return hay.includes(q);
        });
      }

      // Ordina: data desc poi titolo
      list.sort((a,b) => (b.date||'').localeCompare(a.date||'') || (a.title||'').localeCompare(b.title||''));
      state.filtered = list;
      state.page = 1;
      render();

      if (force){
        setTimeout(async () => {
          try{
            const res = await fetch(MANIFEST + (MANIFEST.includes('?')?'&':'?') + 'v=' + Date.now());
            if (res.ok){
              const data = await res.json();
              const items = Array.isArray(data) ? data : (data.items||[]);
              state.all = sanitizeItems(items);
              apply();
            }
          }catch{}
        }, 150);
      }
    }

    function render(){
      if ($count) $count.textContent = `${state.filtered.length} intervist${state.filtered.length===1?'a':'e'}`;

      // Paginazione
      const maxPage = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
      if ($pager){
        $pager.hidden = state.filtered.length <= state.pageSize;
        if ($page) $page.textContent = `${state.page} / ${maxPage}`;
        if ($prev) $prev.disabled = state.page <= 1;
        if ($next) $next.disabled = state.page >= maxPage;
      }

      const start = (state.page - 1) * state.pageSize;
      const pageList = state.filtered.slice(start, start + state.pageSize);
      if (!pageList.length){ $grid.innerHTML = `<p class="docs-empty">Nessuna intervista trovata.</p>`; return; }

      $grid.innerHTML = pageList.map(cardHTML).join('');
    }

    function cardHTML(it){
      const title = escapeHtml(it.title || 'Intervista');
      const author = it.author ? ` · <em>${escapeHtml(it.author)}</em>` : '';
      const date = it.date ? `<span>${formatDate(it.date)}</span>` : '';
      const excerpt = it.excerpt ? `<p class="intv-excerpt">${escapeHtml(it.excerpt)}</p>` : '';

      // Media block: preferenza a YouTube/Vimeo (iframe), poi MP4, poi cover
      let media = '';
      if (it.link && isVideoPlatform(it.link)){
        media = `<iframe src="${escapeAttr(embedURL(it.link))}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
      } else if (it.video && /\.mp4(\?|$)/i.test(it.video)){
        const src = resolveAsset(it.video, BASE_PREFIX, ROOT_PREFIX);
        media = `<video src="${escapeAttr(src)}" controls preload="metadata"></video>`;
      } else if (it.cover){
        const img = resolveAsset(it.cover, BASE_PREFIX, ROOT_PREFIX);
        media = `<img src="${escapeAttr(img)}" alt="${title}" loading="lazy" style="width:100%;height:180px;object-fit:cover;border:0;display:block;">`;
      }

      // Azioni: link a sorgente esterna / pagina dedicata
      const actions = [];
      if (it.link && !isVideoPlatform(it.link)){
        actions.push(`<a class="docs-btn" href="${escapeAttr(it.link)}" target="_blank" rel="noopener">Apri</a>`);
      }
      if (it.article){
        const art = resolveAsset(it.article, BASE_PREFIX, ROOT_PREFIX);
        actions.push(`<a class="docs-btn" href="${escapeAttr(art)}" target="_blank" rel="noopener">Leggi</a>`);
      }

      return `
        <article class="intv-card">
          ${media || ''}
          <div class="intv-body">
            <h3 class="intv-title">${title}</h3>
            <div class="intv-meta">${date}${author}</div>
            ${excerpt}
            ${actions.length ? `<div class="docs-actions" style="display:flex;gap:8px;">${actions.join('')}</div>` : ''}
          </div>
        </article>
      `;
    }

    // Utils
    function sanitizeItems(items){
      return items.map(it => ({
        title: it.title || '',
        date: it.date || '',
        author: it.author || '',
        excerpt: it.excerpt || '',
        link: it.link || '',
        video: it.video || '',
        cover: it.cover || '',
        article: it.article || '',
        tags: it.tags || []
      }));
    }
		function isVideoPlatform(url){
	  return /youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com/i.test(url||'');
	}

	function embedURL(url){
	  const u = url || '';
	  // YouTube
	  let m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
	  if (m) return `https://www.youtube.com/embed/${m[1]}`;
	  // Vimeo
	  m = u.match(/vimeo\.com\/(\d+)/i);
	  if (m) return `https://player.vimeo.com/video/${m[1]}`;
	  // Google Drive
	  m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
	  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
	  return u;
	}

    function resolveAsset(p, basePrefix, folderPrefix){
      if(!p) return p;
      if (/^(https?:)?\/\//.test(p)) return p;
      if (p.startsWith('data:')) return p;
      if (p.startsWith('../')) return p;
      if (p.startsWith('assets/')) return basePrefix + p;
      if (!p.startsWith('/')) return folderPrefix + p; // relativo alla cartella interviste
      return p;
    }
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
