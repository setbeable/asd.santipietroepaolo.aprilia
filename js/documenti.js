/* Documenti — auto gallery (manifest)
 * - Legge ../assets/docs/_docs.json (base dalla pagina via data-assets-base)
 * - Filtri: categoria, anno, ricerca
 * - Preview in modale: PDF e immagini (usa asd-modal-v2)
 */
(function(){
  const root = document.getElementById('docs');
  if (!root) return;

  const BASE = (root.getAttribute('data-assets-base') || '../assets/docs/').replace(/\/+$/,'') + '/';
  const MANIFEST = BASE + '_docs.json';

  const state = { all: [], filtered: [], page: 1, pageSize: 24, category: 'all', year: 'all', q: '' };

  const el = (t,a={},c=[]) => { const n=document.createElement(t);
    for (const [k,v] of Object.entries(a)){ if(k==='class') n.className=v; else if(k==='html') n.innerHTML=v; else n.setAttribute(k,v); }
    (Array.isArray(c)?c:[c]).forEach(x=>{ if(x==null) return; n.appendChild(typeof x==='string'?document.createTextNode(x):x); });
    return n;
  };
  const ext = f => (f.split('.').pop() || '').toLowerCase();
  const icon = e => ({ pdf:'📄', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', webp:'🖼️', gif:'🖼️', doc:'🧾', docx:'🧾', xls:'📊', xlsx:'📊', csv:'📊' }[e] || '📎');
  const canPreview = e => ['pdf','png','jpg','jpeg','webp','gif','svg'].includes(e);

  async function loadData(){
    try{
      const res = await fetch(MANIFEST, { cache:'no-store' });
      if (!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }catch(e){
      // fallback inline
      const inline = document.getElementById('docs-manifest');
      if (inline) { try { return JSON.parse(inline.textContent); } catch(_){ /* noop */ } }
      throw e;
    }
  }

  function applyFilters(){
    let rows = state.all.slice();
    if (state.category !== 'all') rows = rows.filter(d => (d.category||'').toLowerCase() === state.category.toLowerCase());
    if (state.year !== 'all') rows = rows.filter(d => String(d.year) === String(state.year));
    if (state.q && state.q.trim()){
      const s = state.q.trim().toLowerCase();
      rows = rows.filter(d => (d.title||'').toLowerCase().includes(s) || (d.file||'').toLowerCase().includes(s));
    }
    // sort: date desc -> title
    rows.sort((a,b)=>{
      const da = new Date(a.date || a.year || 0).getTime();
      const db = new Date(b.date || b.year || 0).getTime();
      if (db !== da) return db - da;
      return (a.title||'').localeCompare(b.title||'');
    });
    state.filtered = rows;
    state.page = 1;
  }

  function renderToolbar(container){
    const bar = el('div', { class:'docs-toolbar' });

    const selCat = el('select', {}, [el('option', { value:'all' }, 'Tutte le categorie')]);
    const cats = Array.from(new Set(state.all.map(d => d.category).filter(Boolean))).sort();
    cats.forEach(c => selCat.appendChild(el('option', { value:c }, c)));

    const selYear = el('select', {}, [el('option', { value:'all' }, 'Tutti gli anni')]);
    const years = Array.from(new Set(state.all.map(d => d.year).filter(Boolean))).sort();
    years.forEach(y => selYear.appendChild(el('option', { value:String(y) }, String(y))));

    const search = el('input', { type:'search', placeholder:'Cerca…' });

    const perPage = el('select', {}, [
      el('option', { value:'12' }, '12 / pagina'),
      el('option', { value:'24', selected:'selected' }, '24 / pagina'),
      el('option', { value:'48' }, '48 / pagina'),
      el('option', { value:'96' }, '96 / pagina')
    ]);

    const spacer = el('span', { class:'spacer' });

    bar.append(selCat, selYear, search, spacer, perPage);
    container.appendChild(bar);

    selCat.addEventListener('change', ()=>{ state.category = selCat.value; applyFilters(); renderList(container); });
    selYear.addEventListener('change', ()=>{ state.year = selYear.value; applyFilters(); renderList(container); });
    search.addEventListener('input', ()=>{ state.q = search.value; applyFilters(); renderList(container); });
    perPage.addEventListener('change', ()=>{ state.pageSize = parseInt(perPage.value,10)||24; state.page = 1; renderList(container); });
  }

  let listEl, pagerEl;
  function renderScaffold(container){
    listEl = el('div', { class:'doc-list' });
    pagerEl = el('div', { id:'docs-pager', class:'docs-toolbar', style:'margin-top:12px' });
    container.append(listEl, pagerEl);
  }

  function pageSlice(){
    const s = (state.page-1)*state.pageSize;
    return state.filtered.slice(s, s+state.pageSize);
  }

  function renderPager(){
    pagerEl.innerHTML = '';
    const total = state.filtered.length;
    if (!total) return;
    const pages = Math.ceil(total/state.pageSize);
    const prev = el('button', { class:'btn', type:'button' }, '←');
    const info = el('span', {}, `Pagina ${state.page}/${pages} — ${total} documenti`);
    const next = el('button', { class:'btn', type:'button' }, '→');
    prev.disabled = state.page <= 1;
    next.disabled = state.page >= pages;
    prev.addEventListener('click', ()=>{ if(state.page>1){ state.page--; renderList(root); } });
    next.addEventListener('click', ()=>{ if(state.page<pages){ state.page++; renderList(root); } });
    pagerEl.append(prev, info, next);
  }

  function renderList(){
    listEl.innerHTML = '';
    const rows = pageSlice();
    if (!rows.length){
      listEl.innerHTML = '<div style="opacity:.8">Nessun documento trovato.</div>';
      renderPager();
      return;
    }
    rows.forEach(d=>{
      const e = ext(d.file||'');
      const item = el('div', { class:'doc-item' });
      const ico  = el('div', { class:'doc-ic' }, icon(e));
      const content = el('div', { class:'doc-content' });
      const title = el('div', { class:'doc-title' }, d.title || d.file.split('/').pop());
      const meta  = el('div', { class:'doc-meta' }, [
        (d.category? `${d.category} • `:''),
        (d.year? `${d.year}`:''),
        (d.date? ` • ${d.date}`:'')
      ].filter(Boolean).join(''));

      const actions = el('div', { class:'doc-actions' });
      const href = BASE + d.file;

      // Preview (modale) per PDF/immagini
      const aOpen = el('a', { href }, canPreview(e) ? 'Apri' : 'Scarica');
      if (!canPreview(e)) aOpen.setAttribute('download','');
      // Link diretto
      const aLink = el('a', { href, 'data-no-modal':'', target:'_blank', rel:'noopener' }, 'Apri in nuova scheda');

      actions.append(aOpen, aLink);
      content.append(title, meta, actions);
      item.append(ico, content);
      listEl.appendChild(item);
    });
    renderPager();
  }

  (async function boot(){
    try{
      const data = await loadData();
      // normalizza
      state.all = (data.docs||[]).map(d=>{
        // prova a dedurre year da path o date se mancano
        const year = d.year || (String(d.file).match(/(20\d{2}|19\d{2})/)||[])[1] || null;
        return { ...d, year };
      });
      root.innerHTML = '';
      renderToolbar(root);
      renderScaffold(root);
      applyFilters();
      renderList();
    }catch(err){
      console.error('[Documenti] Errore:', err);
      root.innerHTML = '<div style="opacity:.85">Impossibile caricare l’elenco.<br>Controlla che esista <code>'+MANIFEST+'</code> o usa il manifest inline.</div>';
    }
  })();
})();
