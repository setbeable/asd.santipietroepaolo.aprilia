// Hub page loader: fetches items from JSON, populates filter and grid
(function(){
  document.addEventListener('DOMContentLoaded', init);

  async function init(){
    const grid   = document.getElementById('hub-grid');
    const filter = document.getElementById('hub-filter');
    const search = document.getElementById('hub-search');
    const empty  = document.getElementById('hub-empty');
    const refresh= document.getElementById('hub-refresh');

    if(!grid || !filter || !search) return;

    // Load JSON with news/posts
    const dataURL = '../assets/hub/_hub.json';
    let items     = [];
    try{
      const res  = await fetch(dataURL, {cache:'no-store'});
      if(!res.ok) throw new Error(res.status);
      const json = await res.json();
      items = Array.isArray(json.items) ? json.items : [];
    }catch(err){
      console.error('[Hub] errore caricamento hub:', err);
      empty.textContent = 'Impossibile caricare i contenuti.';
      empty.style.display = 'block';
      return;
    }

    // populate categories
    const categories = Array.from(new Set(items.map(it => it.category).filter(Boolean)));
    categories.sort((a,b)=> a.localeCompare(b,'it'));
    categories.forEach(cat => filter.appendChild(new Option(cat, cat)));
    filter.addEventListener('change', update);
    search.addEventListener('input', update);
    refresh.addEventListener('click', update);

    function update(){
      let list = items.slice();
      const q     = search.value.trim().toLowerCase();
      const cat   = filter.value;
      if(cat !== 'all') list = list.filter(it => (it.category || '') === cat);
      if(q) list = list.filter(it => (it.title || '').toLowerCase().includes(q));
      // render
      grid.innerHTML = '';
      empty.style.display = 'none';
      if(!list.length){
        empty.textContent = 'Nessun contenuto trovato.';
        empty.style.display = 'block';
        return;
      }
      list.forEach(renderCard);
    }

    function renderCard(item){
      const card = document.createElement('a');
      card.href  = item.url || '#';
      card.className = 'hub-item';
      card.target = item.url ? '_blank' : '';
      card.rel    = 'noopener';

      // immagine
      const img   = document.createElement('img');
      img.src     = '../' + (item.thumb || '');
      img.alt     = item.title || '';
      img.loading = 'lazy';
      card.appendChild(img);

      const body  = document.createElement('div');
      body.className = 'hub-body';
      const title = document.createElement('h3');
      title.textContent = item.title || '';
      const meta  = document.createElement('span');
      meta.className = 'hub-meta';
      meta.textContent = item.date ? new Date(item.date).toLocaleDateString('it-IT') + ' • ' + (item.category||'') : (item.category||'');
      const desc  = document.createElement('p');
      desc.textContent = item.description || '';
      body.append(title, meta, desc);
      card.appendChild(body);

      grid.appendChild(card);
    }

    // initial render
    update();
  }
})();
