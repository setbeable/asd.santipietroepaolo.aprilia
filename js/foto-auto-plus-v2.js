/* Galleria Foto — auto manifest + modale (v2 + fix ARIA/inert) */
(function(){
  const el=(t,a={},c=[])=>{const n=document.createElement(t);for(const[k,v]of Object.entries(a)){if(k==='class')n.className=v;else if(k==='html')n.innerHTML=v;else n.setAttribute(k,v)};(Array.isArray(c)?c:[c]).forEach(x=>{if(x==null)return;n.appendChild(typeof x==='string'?document.createTextNode(x):x)});return n};
  const extractYear = s => (String(s).match(/(20\d{2}|19\d{2})/)||[])[1] || null;

  document.addEventListener('DOMContentLoaded', async function(){
    const container = document.getElementById('galleria');
    if (!container) return;

    const ASSETS_BASE = (container.getAttribute('data-assets-base') || 'assets/foto/').replace(/\/+$/, '') + '/';
    const MANIFEST_URL = ASSETS_BASE + '_gallery.json';
    const PAGE_SIZE = 24;
    const state = { flat:[], filtered:[], page:1, pageSize:PAGE_SIZE, event:'all', year:'all', q:'' };

    async function loadManifest() {
      const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }

    function applyFilters() {
      const { flat, event, year, q } = state;
      let rows = flat.slice();
      if (event !== 'all') rows = rows.filter(r=>r.eventSlug===event);
      if (year  !== 'all') rows = rows.filter(r=>String(r.year)===String(year));
      if (q && q.trim())  { const s=q.trim().toLowerCase(); rows = rows.filter(r => (r.title||'').toLowerCase().includes(s) || (r.eventName||'').toLowerCase().includes(s)); }
      state.filtered = rows; state.page = 1;
    }

    function renderFilters(root) {
      const uniq = arr => Array.from(new Set(arr));
      const top = el('div',{class:'cal-toolbar'});
      const selEvent = el('select',{id:'flt-event',class:'btn'}); selEvent.appendChild(el('option',{value:'all'},'Tutti gli eventi'));
      const selYear  = el('select',{id:'flt-year', class:'btn'}); selYear.appendChild(el('option',{value:'all'},'Tutti gli anni'));
      const search   = el('input',{id:'flt-q', type:'search', placeholder:'Cerca…', class:'btn', style:'min-width:200px'});
      const spacer   = el('span',{class:'spacer'});
      const perPage  = el('select',{id:'flt-pp', class:'btn'},[
        el('option',{value:'12'},'12 / pagina'),
        el('option',{value:'24',selected:'selected'},'24 / pagina'),
        el('option',{value:'48'},'48 / pagina'),
        el('option',{value:'96'},'96 / pagina')
      ]);
      top.append(selEvent, selYear, search, spacer, perPage);
      root.appendChild(top);

      const events = uniq(state.flat.map(r=>r.eventSlug));
      events.forEach(slug => {
        const name = (state.flat.find(r=>r.eventSlug===slug)?.eventName) || slug;
        selEvent.appendChild(el('option',{value:slug},name));
      });
      const years = uniq(state.flat.map(r=>String(r.year))).sort();
      years.forEach(y => selYear.appendChild(el('option',{value:y},y)));

      selEvent.addEventListener('change', ()=>{ state.event = selEvent.value; applyFilters(); renderGrid(); });
      selYear .addEventListener('change', ()=>{ state.year  = selYear.value;  applyFilters(); renderGrid(); });
      search  .addEventListener('input',  ()=>{ state.q     = search.value;   applyFilters(); renderGrid(); });
      perPage .addEventListener('change', ()=>{ state.pageSize = parseInt(perPage.value,10)||24; state.page = 1; renderGrid(); });
    }

    let gridRoot, pagerRoot;
    function renderScaffold(root){ gridRoot=el('div',{id:'gallery-grid'}); pagerRoot=el('div',{id:'gallery-pager'}); root.append(gridRoot,pagerRoot); }
    const pageSlice = ()=>{ const s=(state.page-1)*state.pageSize; return state.filtered.slice(s, s+state.pageSize); };

    function renderPager(){
      pagerRoot.innerHTML='';
      const total = state.filtered.length; if (!total) return;
      const pages = Math.ceil(total/state.pageSize);
      const info = el('span',{},`Pagina ${state.page}/${pages} — ${total} foto`);
      const prev = el('button',{class:'btn',type:'button'},'←');
      const next = el('button',{class:'btn',type:'button'},'→');
      prev.disabled = state.page<=1; next.disabled = state.page>=pages;
      prev.addEventListener('click',()=>{ if(state.page>1){ state.page--; renderGrid(); }});
      next.addEventListener('click',()=>{ if(state.page<pages){ state.page++; renderGrid(); }});
      pagerRoot.append(prev, info, next);
    }

    function renderGrid(){
      gridRoot.innerHTML='';
      const rows = pageSlice();
      if (!rows.length) { gridRoot.innerHTML='<div style="opacity:.8">Nessun risultato.</div>'; renderPager(); return; }
      const grid = el('div',{class:'foto-grid'});
      rows.forEach(r=>{
        const base = ASSETS_BASE + r.eventSlug + '/';
        const a = el('a',{href: base + r.file, title:r.title});
        const img = el('img',{src: base + r.thumb, alt:r.title, loading:'lazy'});
        img.onerror = () => { img.src = base + r.file; };
        a.appendChild(img);
        a.addEventListener('click', (e)=>{ e.preventDefault(); openViewer(r.eventSlug, r.file); });
        grid.appendChild(a);
      });
      gridRoot.appendChild(grid);
      renderPager();
    }

    // ===== Modale + navigazione =====
    const modal = document.getElementById('modal');
    const modalBody = modal.querySelector('.modal__body');
    const modalClose= modal.querySelector('.modal__close');
    const modalBack = modal.querySelector('.modal__back');
    const page = document.querySelector('.page');

    let keyHandler=null, outsideHandler=null, closeHandlerX=null, closeHandlerBack=null;

    function closeModal(){
      // cleanup
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
      modal.removeAttribute('aria-modal'); modal.removeAttribute('role');
      if (page) page.removeAttribute('inert');
      document.documentElement.style.overflow='';
      modalBody.innerHTML='';
      // rimuovi handlers
      if (keyHandler) document.removeEventListener('keydown', keyHandler, true);
      if (outsideHandler) modal.removeEventListener('click', outsideHandler, true);
      if (closeHandlerX) modalClose.removeEventListener('click', closeHandlerX, true);
      if (closeHandlerBack && modalBack) modalBack.removeEventListener('click', closeHandlerBack, true);
      keyHandler=outsideHandler=closeHandlerX=closeHandlerBack=null;
    }

    function openViewer(eventSlug, file){
      const list  = state.flat.filter(x=>x.eventSlug===eventSlug);
      let index   = list.findIndex(x=>x.file===file); if(index<0) index=0;

      function renderImage(){
        const item = list[index];
        const base = ASSETS_BASE + item.eventSlug + '/';
        modalBody.innerHTML='';
        const wrap = el('div',{class:'player-wrap'});
        const img  = el('img',{src: base + item.file, alt:item.title||'Foto', style:'max-width:100%; max-height:100%; object-fit:contain;'});
        const left = el('button',{class:'navbtn left'},'←');
        const right= el('button',{class:'navbtn right'},'→');
        left.addEventListener('click',()=>{ index=(index-1+list.length)%list.length; renderImage(); });
        right.addEventListener('click',()=>{ index=(index+1)%list.length; renderImage(); });
        wrap.append(img,left,right);
        modalBody.appendChild(wrap);
      }

      renderImage();
      modal.classList.add('is-open');
      modal.removeAttribute('aria-hidden');
      modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
      if (page) page.setAttribute('inert','');
      document.documentElement.style.overflow='hidden';

      keyHandler = (e)=>{ if(e.key==='Escape') closeModal(); if(e.key==='ArrowLeft'){e.preventDefault(); modal.querySelector('.navbtn.left')?.click();} if(e.key==='ArrowRight'){e.preventDefault(); modal.querySelector('.navbtn.right')?.click();} };
      document.addEventListener('keydown', keyHandler, true);

      outsideHandler = (e)=>{ if(e.target===modal) closeModal(); };
      modal.addEventListener('click', outsideHandler, true);

      closeHandlerX = (e)=>{ e.stopPropagation(); closeModal(); };
      modalClose.addEventListener('click', closeHandlerX, true);

      if (modalBack){
        closeHandlerBack = (e)=>{ e.stopPropagation(); closeModal(); };
        modalBack.addEventListener('click', closeHandlerBack, true);
      }

      // focus sulla X per accessibilità
      setTimeout(()=>{ try{ modalClose.focus(); }catch(_){ } }, 0);
    }

    // Boot
    try{
      const data = await loadManifest();
      state.flat = [];
      (data.events||[]).forEach(evt=>{
        const year = evt.year || extractYear(evt.name) || extractYear(evt.slug) || 's.n.';
        (evt.images||[]).forEach((img,idx)=>{
          const file = img.file || img.src; if(!file) return;
          state.flat.push({
            id:`${evt.slug}__${idx}`, eventSlug:evt.slug, eventName:evt.name||evt.slug,
            year:String(year), file, thumb:img.thumb||('thumbs/'+file), title:img.title||evt.name||'Foto'
          });
        });
      });

      container.innerHTML='';
      renderFilters(container);
      renderScaffold(container);
      applyFilters();
      renderGrid();
    }catch(err){
      console.error('[Galleria] Errore:', err);
      container.innerHTML = '<div style="opacity:.85">Impossibile caricare la galleria.<br>Controlla che esista <code>'+MANIFEST_URL+'</code>.</div>';
    }
  });
})();
