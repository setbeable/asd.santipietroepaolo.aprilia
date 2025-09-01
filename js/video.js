/* Video — griglia + filtri + player in modale (v2 robusta) */
(function(){
  document.addEventListener('DOMContentLoaded', async function(){
    console.log('[Video] script caricato');

    const root = document.getElementById('videos');
    if (!root) { console.error('[Video] #videos non trovato'); return; }

    const BASE = (root.getAttribute('data-assets-base') || 'assets/video/').replace(/\/+$/,'') + '/';
    const MANIFEST = BASE + '_videos.json';

    const state = { all:[], filtered:[], page:1, pageSize:24, category:'all', year:'all', q:'' };

    const el = (t,a={},c=[]) => { const n=document.createElement(t);
      for (const [k,v] of Object.entries(a)) { if(k==='class') n.className=v; else if(k==='html') n.innerHTML=v; else n.setAttribute(k,v); }
      (Array.isArray(c)?c:[c]).forEach(x=>{ if(x==null) return; n.appendChild(typeof x==='string'?document.createTextNode(x):x); });
      return n;
    };

    const isLocal = v => !!v.file;
    const getYear = v => v.year || (String(v.file||v.url||'').match(/(20\d{2}|19\d{2})/)||[])[1] || null;

    function ytId(u){
      try{
        const url = new URL(u);
        if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
        if (url.hostname.includes('youtube.com')){
          if (url.pathname.startsWith('/watch')) return url.searchParams.get('v');
          if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2];
        }
      }catch(e){}
      return null;
    }
    function vimeoId(u){
      try{
        const url = new URL(u);
        if (url.hostname.includes('vimeo.com')){
          const parts = url.pathname.split('/').filter(Boolean);
          const id = parts.find(p=>/^\d+$/.test(p));
          return id || null;
        }
      }catch(e){}
      return null;
    }

    // Thumb corretta:
    // - se v.thumb è relativo, lo attacchiamo a BASE;
    // - se è assoluto (http), lo usiamo così com'è;
    // - se non c'è, e il video è locale: <categoria>/thumbs/<filename>.jpg
    function getThumb(v){
      if (v.thumb){
        if (/^https?:\/\//i.test(v.thumb)) return v.thumb;
        return BASE + v.thumb.replace(/^\/+/, '');
      }
      if (isLocal(v) && v.file){
        const parts = v.file.split('/');     // es. ["Video_gare","video_Gara.mp4"]
        const fileName = parts.pop();        // "video_Gara.mp4"
        const folder   = parts.join('/');    // "Video_gare"
        const jpgName  = fileName.replace(/\.\w+$/i, '.jpg');
        return BASE + (folder ? folder + '/' : '') + 'thumbs/' + jpgName;
      }
      if (v.url){
        const id = ytId(v.url);
        if (id) return 'https://img.youtube.com/vi/'+id+'/hqdefault.jpg';
      }
      return '';
    }

    async function loadData(){
      try{
        const r = await fetch(MANIFEST, { cache:'no-store' });
        if (!r.ok) throw new Error('HTTP '+r.status);
        return await r.json();
      }catch(e){
        console.warn('[Video] Manifest esterno non disponibile, provo inline:', e);
        const inline = document.getElementById('videos-manifest');
        if (inline) { try { return JSON.parse(inline.textContent); } catch(_){ /* noop */ } }
        throw e;
      }
    }

    function applyFilters(){
      let rows = state.all.slice();
      if (state.category !== 'all') rows = rows.filter(v => (v.category||'').toLowerCase() === state.category.toLowerCase());
      if (state.year !== 'all') rows = rows.filter(v => String(v.year) === String(state.year));
      if (state.q && state.q.trim()){
        const s = state.q.trim().toLowerCase();
        rows = rows.filter(v => (v.title||'').toLowerCase().includes(s) || (v.file||v.url||'').toLowerCase().includes(s));
      }
      rows.sort((a,b)=>{
        const da = new Date(a.date || a.year || 0).getTime();
        const db = new Date(b.date || b.year || 0).getTime();
        if (db !== da) return db - da;
        return (a.title||'').localeCompare(b.title||'');
      });
      state.filtered = rows; state.page = 1;
    }

    function renderToolbar(container){
      const bar = el('div', { class:'vid-toolbar' });
      const selCat = el('select', {}, [el('option', { value:'all' }, 'Tutte le categorie')]);
      const selYear= el('select', {}, [el('option', { value:'all' }, 'Tutti gli anni')]);
      const search = el('input', { type:'search', placeholder:'Cerca…' });
      const perPage= el('select', {}, [
        el('option', { value:'12' }, '12 / pagina'),
        el('option', { value:'24', selected:'selected' }, '24 / pagina'),
        el('option', { value:'48' }, '48 / pagina'),
        el('option', { value:'96' }, '96 / pagina')
      ]);
      const spacer = el('span', { class:'spacer' });

      Array.from(new Set(state.all.map(v=>v.category).filter(Boolean))).sort()
        .forEach(c => selCat.appendChild(el('option', { value:c }, c)));
      Array.from(new Set(state.all.map(v=>v.year).filter(Boolean))).sort()
        .forEach(y => selYear.appendChild(el('option', { value:String(y) }, String(y))));

      bar.append(selCat, selYear, search, spacer, perPage);
      container.appendChild(bar);

      selCat.addEventListener('change', ()=>{ state.category = selCat.value; applyFilters(); renderList(); });
      selYear.addEventListener('change', ()=>{ state.year = selYear.value; applyFilters(); renderList(); });
      search.addEventListener('input', ()=>{ state.q = search.value; applyFilters(); renderList(); });
      perPage.addEventListener('change', ()=>{ state.pageSize = parseInt(perPage.value,10)||24; state.page = 1; renderList(); });
    }

    let gridEl, pagerEl;
    function renderScaffold(container){
      gridEl = el('div', { class:'vid-grid' });
      pagerEl = el('div', { class:'pager' });
      container.append(gridEl, pagerEl);
    }

    function pageSlice(){
      const s = (state.page-1)*state.pageSize;
      return state.filtered.slice(s, s+state.pageSize);
    }

    function renderPager(){
      pagerEl.innerHTML = '';
      const total = state.filtered.length; if (!total) return;
      const pages = Math.ceil(total/state.pageSize);
      const prev = el('button', { class:'btn', type:'button' }, '←');
      const info = el('span', {}, `Pagina ${state.page}/${pages} — ${total} video`);
      const next = el('button', { class:'btn', type:'button' }, '→');
      prev.disabled = state.page <= 1; next.disabled = state.page >= pages;
      prev.addEventListener('click', ()=>{ if(state.page>1){ state.page--; renderList(); }});
      next.addEventListener('click', ()=>{ if(state.page<pages){ state.page++; renderList(); }});
      pagerEl.append(prev, info, next);
    }

    function openPlayer(v){
      const modal = document.getElementById('modal');
      const body  = modal.querySelector('.modal__body');
      const btnX  = modal.querySelector('.modal__close');
      const btnB  = modal.querySelector('.modal__back');

      function close(){
        modal.classList.remove('is-open');
        document.documentElement.style.overflow='';
        body.innerHTML='';
        document.removeEventListener('keydown', onKey);
      }
      function onKey(e){ if(e.key==='Escape') close(); }

      body.innerHTML = '';
      const wrap = el('div', { class:'player-wrap' });

      if (isLocal(v)){
        const src = BASE + v.file;
        const video = el('video', { controls:'', playsinline:'', autoplay:'', src });
        wrap.appendChild(video);
      } else if (v.url){
        let iframeSrc = v.url;
        const yid = ytId(v.url);
        const vidVimeo = vimeoId(v.url);
        if (yid) iframeSrc = `https://www.youtube.com/embed/${yid}?autoplay=1&rel=0`;
        else if (vidVimeo) iframeSrc = `https://player.vimeo.com/video/${vidVimeo}?autoplay=1`;
        const iframe = el('iframe', {
          src: iframeSrc, frameborder:'0', allow:'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowfullscreen:''
        });
        wrap.appendChild(iframe);
      }

      body.appendChild(wrap);
      modal.classList.add('is-open');
      document.documentElement.style.overflow='hidden';
      btnX.onclick = close;
      btnB.onclick = close;
      modal.addEventListener('click', (e)=>{ if(e.target===modal) close(); }, { once:true });
      document.addEventListener('keydown', onKey);
    }

    function renderList(){
      gridEl.innerHTML = '';
      const rows = pageSlice();
      if (!rows.length){ gridEl.innerHTML = '<div style="opacity:.8">Nessun video trovato.</div>'; renderPager(); return; }

      rows.forEach(v=>{
        const card = el('div', { class:'vid-card' });
        const t = getThumb(v);
        const thumb = el('img', { class:'vid-thumb', src: t || '', alt: v.title || 'Video', loading:'lazy' });
        if (!t && isLocal(v)) thumb.onerror = ()=>{ thumb.style.background='#000'; thumb.removeAttribute('src'); };

        const title = el('div', { class:'vid-title' }, v.title || (v.file || v.url || '').split('/').pop());
        const play  = el('button', { class:'vid-play', type:'button' }, '▶');

        card.append(thumb, title, play);
        card.addEventListener('click', ()=> openPlayer(v));
        gridEl.appendChild(card);
      });

      renderPager();
    }

    // Boot
    try{
      const data = await loadData();
      state.all = (data.videos||[]).map(v => ({ ...v, year: getYear(v) }));
      console.log('[Video] caricati', state.all.length, 'elementi da', MANIFEST);
      root.innerHTML = '';
      renderToolbar(root);
      renderScaffold(root);
      applyFilters();
      renderList();
    }catch(err){
      console.error('[Video] Errore:', err);
      root.innerHTML = '<div style="opacity:.85">Impossibile caricare i video. Controlla che esista <code>'+MANIFEST+'</code> o usa il manifest inline.</div>';
    }
  });
})();
