/* Hub — feed locale con ricerca, filtri, slider e paginazione */
(function () {
  const PATH = '../assets/hub/_hub.json';       // manifest locale
  const grid = byId('hub-grid');
  const hero = byId('hub-hero');
  const heroTrack = byId('hub-hero-track');
  const q = byId('hub-q');
  const cat = byId('hub-cat');
  const count = byId('hub-count');
  const refreshBtn = byId('hub-refresh');
  const prevBtn = byId('hub-prev');
  const nextBtn = byId('hub-next');
  const pageLbl = byId('hub-page');
  const pager = byId('hub-pager');

  const state = {
    all: [],
    filtered: [],
    page: 1,
    pageSize: 6,
    heroIndex: 0,
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    await load();
    buildCategories();
    applyFilters();
    render();

    q.addEventListener('input', onFilterChange);
    cat.addEventListener('change', onFilterChange);
    refreshBtn.addEventListener('click', reload);

    prevBtn.addEventListener('click', () => gotoPage(state.page - 1));
    nextBtn.addEventListener('click', () => gotoPage(state.page + 1));

    // slider nav
    hero.querySelector('.prev')?.addEventListener('click', () => heroGo(state.heroIndex - 1));
    hero.querySelector('.next')?.addEventListener('click', () => heroGo(state.heroIndex + 1));

    // auto-advance hero
    setInterval(() => {
      if (!hero.hasAttribute('hidden') && state.filtered.some(p => p.featured)) {
        heroGo(state.heroIndex + 1, true);
      }
    }, 6000);
  }

  async function load() {
    try {
      const r = await fetch(PATH, { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      const data = await r.json();
      state.all = normalize(data.posts || []);
    } catch (e) {
      console.warn('[Hub] manifest non trovato, uso contenuti demo.', e);
      state.all = demoPosts();
    }
    // ordina per data desc
    state.all.sort((a,b) => (b.date||'').localeCompare(a.date||''));
  }

  function reload() {
    // forza ricarica “manuale”
    load().then(() => {
      buildCategories();
      applyFilters();
      render();
    });
  }

  function normalize(arr) {
    return arr.map(p => ({
      id: p.id || slug(p.title),
      title: p.title || 'Senza titolo',
      date: p.date || new Date().toISOString().slice(0,10),
      category: p.category || 'Aggiornamenti',
      excerpt: p.excerpt || '',
      cover: p.cover || '',
      url: p.url || '#',
      featured: !!p.featured
    }));
  }

  function buildCategories() {
    const cats = Array.from(new Set(state.all.map(p => p.category))).sort((a,b)=>a.localeCompare(b,'it'));
    cat.innerHTML = '<option value="all">Tutte le categorie</option>' + cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }

  function onFilterChange() {
    state.page = 1;
    applyFilters();
    render();
  }

  function applyFilters() {
    const s = (q.value || '').trim().toLowerCase();
    const c = cat.value || 'all';
    let rows = state.all.slice();

    if (c !== 'all') rows = rows.filter(p => p.category === c);
    if (s) rows = rows.filter(p =>
      p.title.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s) ||
      p.excerpt.toLowerCase().includes(s)
    );

    state.filtered = rows;
  }

  function render() {
    // COUNTER
    count.textContent = state.filtered.length ? `${state.filtered.length} contenuti` : 'Nessun contenuto';

    // HERO (in evidenza)
    const featured = state.filtered.filter(p => p.featured);
    if (featured.length) {
      hero.removeAttribute('hidden');
      heroTrack.innerHTML = featured.map(cardHero).join('');
      state.heroIndex = Math.min(state.heroIndex, featured.length-1);
      heroGo(state.heroIndex, true);
    } else {
      hero.setAttribute('hidden','');
      heroTrack.innerHTML = '';
    }

    // GRID + PAGINAZIONE
    const total = state.filtered.length;
    const pages = Math.max(1, Math.ceil(total / state.pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * state.pageSize;
    const rows = state.filtered.slice(start, start + state.pageSize);

    grid.innerHTML = rows.map(cardGrid).join('') || `<div class="card" style="opacity:.85">Nessun contenuto con i filtri attivi.</div>`;

    if (pages > 1) {
      pager.removeAttribute('hidden');
      pageLbl.textContent = `Pagina ${state.page} / ${pages}`;
      prevBtn.disabled = state.page <= 1;
      nextBtn.disabled = state.page >= pages;
    } else {
      pager.setAttribute('hidden','');
    }
  }

  function gotoPage(n) {
    state.page = Math.max(1, n);
    render();
    window.scrollTo({top: 0, behavior: 'smooth'});
  }

  // ----- HERO slider helpers -----
  function heroGo(i, silent) {
    const slides = Array.from(heroTrack.children);
    if (!slides.length) return;
    const max = slides.length - 1;
    state.heroIndex = (i < 0) ? max : (i > max ? 0 : i);
    const offset = -state.heroIndex * 100;
    heroTrack.style.transform = `translateX(${offset}%)`;
    if (!silent) heroTrack.style.transition = 'transform .35s ease';
    // focus handling optional
  }

  // ----- TEMPLATES -----
  function cardHero(p) {
    const cover = p.cover ? `style="background-image:url('${esc(p.cover)}')"` : '';
    return `
      <article class="hub-hero__slide" ${cover} role="group" aria-roledescription="slide">
        <a class="hub-hero__overlay" href="${esc(p.url)}" target="${p.url.startsWith('http')?'_blank':'_self'}" rel="noopener">
          <span class="chip">${esc(p.category)}</span>
          <h3>${esc(p.title)}</h3>
          <p class="muted">${fmtDate(p.date)}</p>
        </a>
      </article>
    `;
  }

  function cardGrid(p) {
    const cover = p.cover ? `style="--bg:url('${esc(p.cover)}')"` : '';
    return `
      <article class="hub-card" ${cover}>
        <a href="${esc(p.url)}" target="${p.url.startsWith('http')?'_blank':'_self'}" rel="noopener" class="hub-card__link">
          <div class="hub-card__cover"></div>
          <div class="hub-card__body">
            <span class="chip">${esc(p.category)}</span>
            <h3 class="hub-card__title">${esc(p.title)}</h3>
            <p class="hub-card__excerpt">${esc(p.excerpt || '')}</p>
            <div class="hub-card__meta">${fmtDate(p.date)}</div>
          </div>
        </a>
      </article>
    `;
  }

  // ----- UTIL -----
  function byId(id){ return document.getElementById(id); }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function fmtDate(iso){
    if(!iso) return '';
    try{
      const d = new Date(iso);
      return d.toLocaleDateString('it-IT', { year:'numeric', month:'long', day:'numeric' });
    }catch{ return iso; }
  }

  function demoPosts(){
    const base = '../assets/hub/covers/';
    return [
      {
        id:'open-day-2025',
        title:'Open Day al campetto — prova gratuita',
        date:'2025-09-14',
        category:'Eventi',
        excerpt:'Una giornata aperta a tutti per conoscere la nostra realtà di futsal.',
        cover: base+'open-day.jpg',
        url:'#',
        featured:true
      },
      {
        id:'iscrizioni-aperte',
        title:'Iscrizioni 2025/26 aperte!',
        date:'2025-09-05',
        category:'Comunicazioni',
        excerpt:'Tutte le info su orari, quote e modulistica per il nuovo anno sportivo.',
        cover: base+'iscrizioni.jpg',
        url:'../pages/iscrizioni.html',
        featured:true
      },
      {
        id:'torneo-oratorio',
        title:'Torneo dell’Oratorio: calendario e regolamento',
        date:'2025-08-28',
        category:'Tornei',
        excerpt:'Scarica il calendario completo e il regolamento del torneo interno.',
        cover: base+'torneo.jpg',
        url:'../pages/documenti.html'
      },
      {
        id:'sponsor-2025',
        title:'Benvenuti ai nuovi sponsor!',
        date:'2025-08-20',
        category:'Sponsor',
        excerpt:'Grazie alle realtà del territorio che sostengono i nostri ragazzi.',
        cover: base+'sponsor.jpg',
        url:'../pages/sponsor.html'
      },
      {
        id:'intervista-mister',
        title:'Intervista al Mister: obiettivi della stagione',
        date:'2025-08-18',
        category:'Interviste',
        excerpt:'“Crescita, inclusione, divertimento”: le parole chiave del nostro progetto.',
        cover: base+'intervista.jpg',
        url:'../pages/interviste.html'
      },
      {
        id:'foto-stage',
        title:'Foto dallo stage estivo',
        date:'2025-07-30',
        category:'Foto',
        excerpt:'Una selezione di scatti dai giorni di stage e amichevoli.',
        cover: base+'stage.jpg',
        url:'../pages/foto.html'
      }
    ];
  }
})();
