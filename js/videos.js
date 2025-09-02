/* ============================================================================
 * videos.js (v5)
 * Galleria video con filtri, paginazione e player in modale
 * ========================================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', async function () {
    console.log('[Video] script caricato');

    const root = document.getElementById('videos');
    if (!root) { console.error('[Video] #videos non trovato'); return; }

    const BASE = (root.getAttribute('data-assets-base') || 'assets/video/').replace(/\/+$/, '') + '/';
    const MANIFEST = BASE + '_videos.json';

    const state = { all: [], filtered: [], page: 1, pageSize: 24, category: 'all', year: 'all', q: '' };

    // ---------- utils ----------
    const el = (t, a = {}, c = []) => {
      const n = document.createElement(t);
      for (const [k, v] of Object.entries(a)) {
        if (k === 'class') n.className = v;
        else if (k === 'html') n.innerHTML = v;
        else n.setAttribute(k, v);
      }
      (Array.isArray(c) ? c : [c]).forEach(x => { if (x != null) n.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      return n;
    };
    const isLocal = v => !!v.file;
    const getYear = v => v.year || (String(v.file || v.url || '').match(/(20\d{2}|19\d{2})/) || [])[1] || null;

    function ytId(u){ try{ const url = new URL(u);
      if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
      if (url.hostname.includes('youtube.com')){
        if (url.pathname.startsWith('/watch')) return url.searchParams.get('v');
        if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2];
      } }catch(_){} return null; }
    function vimeoId(u){ try{ const url=new URL(u);
      if (url.hostname.includes('vimeo.com')){
        const parts=url.pathname.split('/').filter(Boolean);
        const id=parts.find(p=>/^\d+$/.test(p));
        return id||null;
      } }catch(_){} return null; }

    function getThumb(v){
      if (v.thumb){
        if (/^https?:\/\//i.test(v.thumb)) return v.thumb;
        if (/^thumbs\//i.test(v.thumb) && v.file && v.file.includes('/')){
          const cat = v.file.split('/')[0];
          return BASE + cat + '/' + v.thumb.replace(/^\/+/, '');
        }
        return BASE + v.thumb.replace(/^\/+/, '');
      }
      if (isLocal(v) && v.file){
        const parts = v.file.split('/'); const fileName = parts.pop(); const folder = parts.join('/');
        const jpgName = fileName.replace(/\.\w+$/i, '.jpg');
        return BASE + (folder ? folder + '/' : '') + 'thumbs/' + jpgName;
      }
      if (v.url){
        const id = ytId(v.url);
        if (id) return 'https://img.youtube.com/vi/'+id+'/hqdefault.jpg';
      }
      return '';
    }

    async function loadData(){
      const r = await fetch(MANIFEST, { cache:'no-store' });
      if (!r.ok) throw new Error('Manifest HTTP '+r.status+' @ '+MANIFEST);
      return await r.json();
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
      const bar = el('div',{class:'vid-toolbar'});
      const selCat = el('select',{},[el('option',{value:'all'},'Tutte le categorie')]);
      const selYear= el('select',{},[el('option',{value:'all'},'Tutti gli anni')]);
      const search = el('input',{type:'search',placeholder:'Cerca…'});
      const perPage= el('select',{},[
        el('option',{value:'12'},'12 / pagina'),
        el('option',{value:'24',selected:'selected'},'24 / pagina'),
        el('option',{value:'48'},'48 / pagina'),
        el('option',{value:'96'},'96 / pagina')
      ]);
      const spacer = el('span',{class:'spacer'});

      Array.from(new Set(state.all.map(v=>v.category).filter(Boolean))).sort()
        .forEach(c=>selCat.appendChild(el('option',{value:c},c)));
      Array.from(new Set(state.all.map(v=>v.year).filter(Boolean))).sort()
        .forEach(y=>selYear.appendChild(el('option',{value:String(y)},String(y))));

      bar.append(selCat, selYear, search, spacer, perPage);
      container.appendChild(bar);

      selCat.addEventListener('change', ()=>{ state.category = selCat.value; applyFilters(); renderList(); });
      selYear.addEventListener('change', ()=>{ state.year = selYear.value; applyFilters(); renderList(); });
      search .addEventListener('input',  ()=>{ state.q     = search.value; applyFilters(); renderList(); });
      perPage.addEventListener('change', ()=>{ state.pageSize = parseInt(perPage.value,10)||24; state.page = 1; renderList(); });
    }

    let gridEl, pagerEl;
    function renderScaffold(container){ gridEl=el('div',{class:'vid-grid'}); pagerEl=el('div',{class:'pager'}); container.append(gridEl,pagerEl); }
    const pageSlice = ()=>{ const s=(state.page-1)*state.pageSize; return state.filtered.slice(s,s+state.pageSize); };

    function renderPager(){
      pagerEl.innerHTML=''; const total=state.filtered.length; if(!total) return;
      const pages=Math.ceil(total/state.pageSize);
      const prev=el('button',{class:'btn',type:'button'},'←');
      const info=el('span',{},`Pagina ${state.page}/${pages} — ${total} video`);
      const next=el('button',{class:'btn',type:'button'},'→');
      prev.disabled=state.page<=1; next.disabled=state.page>=pages;
      prev.addEventListener('click',()=>{ if(state.page>1){ state.page--; renderList(); }});
      next.addEventListener('click',()=>{ if(state.page<pages){ state.page++; renderList(); }});
      pagerEl.append(prev,info,next);
    }

    // ---------- MODALE ----------
    function openPlayer(v){
      const modal = document.getElementById('modal');
      const body  = modal.querySelector('.modal__body');
      const btnX  = modal.querySelector('.modal__close');
      const btnB  = modal.querySelector('.modal__back');
      const page  = document.querySelector('.page');

      function stopAndCleanup(){
        // stop video o iframe
        const vid = body.querySelector('video');
        if (vid){ try{ vid.pause(); }catch(_){} }
        body.innerHTML = '';
      }

      function close(){
        // ripristina stato pagina
        stopAndCleanup();
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden','true');
        modal.removeAttribute('aria-modal');
        modal.removeAttribute('role');
        if (page) page.removeAttribute('inert');
        document.documentElement.style.overflow='';
        document.removeEventListener('keydown', onKey, true);
      }

      function onKey(e){ if(e.key==='Escape'){ e.preventDefault(); close(); } }

      // prepara contenuto player
      body.innerHTML = '';
      const wrap = el('div',{class:'player-wrap'});

      if (isLocal(v)){
        const src = BASE + v.file;
        const video = el('video',{controls:'',playsinline:'',autoplay:'',src});
        wrap.appendChild(video);
      } else if (v.url){
        let iframeSrc = v.url;
        const yid = ytId(v.url); const vidVimeo = vimeoId(v.url);
        if (yid) iframeSrc = `https://www.youtube.com/embed/${yid}?autoplay=1&rel=0`;
        else if (vidVimeo) iframeSrc = `https://player.vimeo.com/video/${vidVimeo}?autoplay=1`;
        const iframe = el('iframe',{
          src: iframeSrc, frameborder:'0',
          allow:'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowfullscreen:''
        });
        wrap.appendChild(iframe);
      }

      // mostra modale accessibile
      body.appendChild(wrap);
      modal.classList.add('is-open');
      modal.removeAttribute('aria-hidden');      // <— importante
      modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      if (page) page.setAttribute('inert','');
      document.documentElement.style.overflow='hidden';

      // chiusure
      btnX.addEventListener('click',(e)=>{ e.stopPropagation(); close(); }, { once:true });
      btnB.addEventListener('click',(e)=>{ e.stopPropagation(); close(); }, { once:true });
      modal.addEventListener('click',(e)=>{ if(e.target===modal) close(); }, { once:true });
      document.addEventListener('keydown', onKey, true);

      // porta focus alla X (evita warning aria)
      setTimeout(()=>{ try{ btnX.focus(); }catch(_){} }, 0);
    }

    function renderList(){
      gridEl.innerHTML='';
      const rows = pageSlice();
      if(!rows.length){ gridEl.innerHTML='<div style="opacity:.8">Nessun video trovato.</div>'; renderPager(); return; }

      rows.forEach(v=>{
        const card = el('div',{class:'vid-card',tabindex:'0'});
        const t = getThumb(v);
        const thumb = el('img',{class:'vid-thumb',src:t||'',alt:v.title||'Video',loading:'lazy'});
        if(!t && isLocal(v)) thumb.onerror = ()=>{ thumb.style.background='#000'; thumb.removeAttribute('src'); };

        const title = el('div',{class:'vid-title'}, v.title || (v.file||v.url||'').split('/').pop());
        const play  = el('button',{class:'vid-play',type:'button'},'▶');

        const open = ()=> openPlayer(v);
        card.addEventListener('click', open);
        card.addEventListener('keydown',(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); }});

        card.append(thumb,title,play);
        gridEl.appendChild(card);
      });

      renderPager();
    }

    // ---------- boot ----------
    try{
      const data = await loadData();
      state.all = (data.videos||[]).map(v => ({ ...v, year: getYear(v) }));
      console.log('[Video] caricati', state.all.length, 'elementi da', MANIFEST);
      root.innerHTML=''; renderToolbar(root); renderScaffold(root); applyFilters(); renderList();
    }catch(err){
      console.error('[Video] Errore:', err);
      root.innerHTML = '<div style="opacity:.85">Impossibile caricare i video. Controlla <code>'+MANIFEST+'</code>.</div>';
    }
  });
})();
function openPlayer(v){
  const modal     = document.getElementById('modal');
  const inner     = modal.querySelector('.modal__inner');
  const body      = modal.querySelector('.modal__body');
  const btnClose  = modal.querySelector('.modal__close');
  const btnBack   = modal.querySelector('.modal__back');

  // niente duplicati
  modal.querySelectorAll('.modal__fs').forEach(b=>b.remove());

  const btnFS = document.createElement('button');
  btnFS.className = 'modal__fs';
  btnFS.type = 'button';
  btnFS.title = 'Schermo intero';
  btnFS.textContent = '⤢';
  inner.appendChild(btnFS);

  body.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'player-wrap';

  let videoEl = null;

  if (isLocal(v)) {
    const src = BASE + v.file;
    videoEl = document.createElement('video');
    videoEl.setAttribute('controls','');
    videoEl.setAttribute('playsinline','');
    videoEl.setAttribute('webkit-playsinline','');
    videoEl.src = src;
    wrap.appendChild(videoEl);
  } else if (v.url) {
    let iframeSrc = v.url;
    const yid = ytId(v.url), vid = vimeoId(v.url);
    if (yid) iframeSrc = `https://www.youtube.com/embed/${yid}?autoplay=1&rel=0`;
    else if (vid) iframeSrc = `https://player.vimeo.com/video/${vid}?autoplay=1`;
    const iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.setAttribute('allowfullscreen','');
    wrap.appendChild(iframe);
  }

  body.appendChild(wrap);

  // fullscreen: preferisci il video (iOS), altrimenti il contenitore
  btnFS.addEventListener('click', (e)=>{
    e.stopPropagation();
    if (videoEl && (videoEl.webkitEnterFullscreen || videoEl.webkitEnterFullScreen)) {
      (videoEl.webkitEnterFullscreen || videoEl.webkitEnterFullScreen).call(videoEl);
      return;
    }
    const target = inner;
    if (!document.fullscreenElement) {
      target.requestFullscreen && target.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  });

  modal.classList.add('is-open');
  modal.removeAttribute('aria-hidden');
  document.documentElement.style.overflow = 'hidden';

  function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
  function close(){
    // stop video
    try{ if (videoEl) videoEl.pause(); }catch(_){}
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    body.innerHTML = '';
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey, true);
    modal.querySelectorAll('.modal__fs').forEach(b=>b.remove());
  }

  btnClose.addEventListener('click', (e)=>{ e.stopPropagation(); close(); }, {once:true});
  btnBack .addEventListener('click', (e)=>{ e.stopPropagation(); close(); }, {once:true});
  modal.addEventListener('click', (e)=>{ if(e.target === modal) close(); }, {once:true});
  document.addEventListener('keydown', onKey, true);
}
