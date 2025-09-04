/* Orari (allenamenti) — renderer con filtri e CSV export */
(function(){
  document.addEventListener('DOMContentLoaded', init);

  const DAYS_ORDER = ['lun','mar','mer','gio','ven','sab','dom'];
  const DAYS_LABEL = { lun:'Lunedì', mar:'Martedì', mer:'Mercoledì', gio:'Giovedì', ven:'Venerdì', sab:'Sabato', dom:'Domenica' };

  const state = {
    all: [],
    filtered: [],
    page: 1,
    pageSize: 50,    // di solito ci stanno tutti in una pagina
    team: 'all',
    day: 'all',
    q: ''
  };

  async function init(){
    const root = document.getElementById('sched');
    if(!root) return;

    const base = '../assets/orari/';
    const manifest = base + '_orari.json';

    try{
      const r = await fetch(manifest, {cache:'no-store'});
      if(!r.ok) throw new Error(r.status+' '+r.statusText);
      const data = await r.json();
      state.all = (data.trainings || []).map(n => ([
        // supporta anche liste tipo "lun, gio"
        ...(String(n.day||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean).length
            ? String(n.day).toLowerCase().split(',').map(s=>s.trim())
            : [String(n.day||'').toLowerCase()])
      ].map(d => ({
        team: n.team || '',
        day: d || '',
        start: n.start || '',
        end: n.end || '',
        location: n.location || '',
        coach: n.coach || '',
        notes: n.notes || ''
      })))).flat();
    }catch(e){
      root.innerHTML = `<div style="opacity:.85">Impossibile caricare gli orari.<br><code>${manifest}</code></div>`;
      console.error('[Orari] errore:', e);
      return;
    }

    buildFilters();
    applyFilters();
    render();

    // azioni
    const btnPrint = document.getElementById('btn-print');
    if (btnPrint) btnPrint.addEventListener('click', ()=> window.print());
    const btnCsv = document.getElementById('btn-csv');
    if (btnCsv) btnCsv.addEventListener('click', downloadCSV);
  }

  function buildFilters(){
    const teams = Array.from(new Set(state.all.map(x => x.team).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'it'));
    const selTeam = document.getElementById('filter-team');
    if (selTeam){
      teams.forEach(t => selTeam.appendChild(new Option(t, t)));
      selTeam.addEventListener('change', ()=>{ state.team = selTeam.value; applyFilters(); render(); });
    }

    const selDay = document.getElementById('filter-day');
    if (selDay){
      selDay.addEventListener('change', ()=>{ state.day = selDay.value; applyFilters(); render(); });
    }

    const q = document.getElementById('filter-q');
    if (q){
      q.addEventListener('input', ()=>{ state.q = q.value; applyFilters(); render(); });
    }
  }

  function applyFilters(){
    let rows = state.all.slice();

    if(state.team !== 'all') rows = rows.filter(x => x.team === state.team);
    if(state.day  !== 'all') rows = rows.filter(x => x.day === state.day);

    if(state.q && state.q.trim()){
      const s = state.q.trim().toLowerCase();
      rows = rows.filter(x =>
        (x.location||'').toLowerCase().includes(s) ||
        (x.coach||'').toLowerCase().includes(s)   ||
        (x.notes||'').toLowerCase().includes(s)
      );
    }

    // ordinamento: giorno della settimana, poi orario
    rows.sort((a,b)=>{
      const d = DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
      if(d !== 0) return d;
      return (a.start||'').localeCompare(b.start||'');
    });

    state.filtered = rows;
    state.page = 1;
  }

  function render(){
    const grid = document.getElementById('sched');
    grid.innerHTML = '';

    if(!state.filtered.length){
      grid.innerHTML = '<div style="opacity:.8">Nessun risultato con i filtri attivi.</div>';
      return;
    }

    // raggruppa per giorno
    const byDay = new Map();
    for(const row of state.filtered){
      if(!byDay.has(row.day)) byDay.set(row.day, []);
      byDay.get(row.day).push(row);
    }

    // crea sezioni per giorno
    for(const dayKey of DAYS_ORDER){
      if(!byDay.has(dayKey)) continue;
      const dayBox = el('div', {class:'sched-day'});
      dayBox.appendChild(el('h3', {class:'sched-day__title'}, DAYS_LABEL[dayKey]));

      for(const r of byDay.get(dayKey)){
        dayBox.appendChild(renderCard(r));
      }

      grid.appendChild(dayBox);
    }
  }

  // --- NUOVO layout riga: sinistra (ora + team sotto), destra (meta + note)
  function renderCard(r){
    const card = el('div',{class:'sched-item'});

    const row  = el('div', {class:'sch-row'});

    // sinistra — orario e squadra sotto
    const left = el('div', {class:'left'}, [
      el('div',{class:'sched-item__time time-badge'}, `${fmt(r.start)}–${fmt(r.end)}`),
      el('div',{class:'sched-item__team team'}, r.team || '')
    ]);

    // destra — sede/coach e note
    const right = el('div', {class:'right'});
    const meta = el('div',{class:'sched-item__meta'},[
      icon('📍'), el('span',{class:'loc'}, r.location || '—'), ' ',
      icon('👤'), el('span',{class:'coach'}, r.coach || '—')
    ]);
    right.appendChild(meta);

    if(r.notes){
      right.appendChild(el('div',{class:'sched-item__notes'}, r.notes));
    }

    row.append(left, right);
    card.append(row);
    return card;
  }

  function fmt(hhmm){
    if(!/^\d{2}:\d{2}$/.test(hhmm||'')) return hhmm||'';
    return hhmm.replace(':','.');
  }

  function downloadCSV(){
    const rows = [
      ['Giorno','Orario','Squadra','Sede','Coach','Note'],
      ...state.filtered.map(r => [
        DAYS_LABEL[r.day] || r.day,
        `${r.start}-${r.end}`,
        r.team || '',
        r.location || '',
        r.coach || '',
        (r.notes || '').replace(/\r?\n/g,' ')
      ])
    ];
    const csv = rows.map(r => r.map(s => `"${String(s).replace(/"/g,'""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'orari-allenamenti.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // mini helper
  function el(tag, attrs = {}, content){
    const n = document.createElement(tag);
    for(const [k,v] of Object.entries(attrs)){
      if(k === 'class') n.className = v;
      else if(k === 'html') n.innerHTML = v;
      else n.setAttribute(k, v);
    }
    if(content != null){
      const kids = Array.isArray(content) ? content : [content];
      for(const c of kids){
        n.appendChild(c instanceof Node ? c : document.createTextNode(c));
      }
    }
    return n;
  }
  function icon(txt){ return el('span',{class:'i'},txt); }
})();
