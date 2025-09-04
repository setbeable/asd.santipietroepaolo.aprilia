// Sponsor – carica loghi da JSON e genera la griglia
(function(){
  document.addEventListener('DOMContentLoaded', init);

  async function init(){
    const grid = document.getElementById('sponsor-grid');
    if(!grid) return;

    const manifest = '../assets/sponsor/_sponsor.json';
    try{
      const r = await fetch(manifest, {cache:'no-store'});
      if(!r.ok) throw new Error(r.status+' '+r.statusText);
      const data = await r.json();
      const items = Array.isArray(data.sponsors) ? data.sponsors : [];

      if(!items.length){
        grid.innerHTML = '<div style="opacity:.8">Nessuno sponsor pubblicato al momento.</div>';
        return;
      }

      // Ordina per tier (Gold > Silver > Bronze > altri)
      const order = {'gold':0,'silver':1,'bronze':2};
      items.sort((a,b)=>(order[(a.tier||'').toLowerCase()] ?? 9) - (order[(b.tier||'').toLowerCase()] ?? 9));

      const frag = document.createDocumentFragment();
      for(const s of items){
        const card = document.createElement('a');
        card.className = 'spon-logo';
        card.href = s.url || '#';
        if(s.url) { card.target = '_blank'; card.rel = 'noopener'; }
        card.title = s.name || 'Sponsor';

        const img = document.createElement('img');
        img.src = '../' + (s.logo || '');
        img.alt = s.name || 'Logo sponsor';
        img.loading = 'lazy';

        const badge = document.createElement('span');
        const tier = (s.tier||'').toLowerCase();
        badge.className = 'badge-tier ' + (tier || 'other');
        badge.textContent = tier ? tier.charAt(0).toUpperCase()+tier.slice(1) : 'Partner';

        card.append(img, badge);
        frag.appendChild(card);
      }
      grid.appendChild(frag);
    }catch(err){
      console.error('[Sponsor] errore caricamento', err);
      grid.innerHTML = `<div style="opacity:.8">Impossibile caricare gli sponsor.<br><code>${manifest}</code></div>`;
    }
  }
})();
