/* ===== News Ticker – ASD SPP =====
 * Include questo file e ticker.css. Lo script inietta da solo l'HTML.
 * Ordine sorgenti:
 *   1) assets/news.json (se esiste)  -> priorità
 *   2) assets/_hub.json              -> fallback automatico
 *
 * Personalizza:
 *   <script src="js/ticker.js" defer data-base="./" data-limit="6"></script>
 *   - data-base:  "./" da root (index.html), "../" dalle pagine in /pages
 *   - data-limit: quante voci mostrare (default 5)
 */
(function () {
  document.addEventListener('DOMContentLoaded', init, { once: true });

  async function init() {
    const script = document.currentScript || document.querySelector('script[src*="ticker.js"]');
    const BASE   = (script && script.getAttribute('data-base'))  || './';
    const LIMIT  = parseInt((script && script.getAttribute('data-limit')) || '5', 10);

    // Crea container
    const root = document.createElement('div');
    root.className = 'news-ticker';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Ultime novità');
    root.innerHTML = `<div class="news-ticker__track" aria-live="polite" aria-atomic="false"></div>`;
    document.body.appendChild(root);

    const track = root.querySelector('.news-ticker__track');

    try {
      const items = await loadItems(BASE, LIMIT);
      if (!items.length) {
        root.remove(); // niente da mostrare
        return;
      }
      track.innerHTML = items
        .map(it => `<span class="news-ticker__item">${renderItem(it)}</span>`)
        .join('');
    } catch (e) {
      // in caso di errore… meglio non mostrare nulla
      console.warn('[Ticker] nessuna news:', e);
      root.remove();
    }
  }

  function renderItem(it) {
    const text = escapeHtml(it.text || it.title || '');
    const url  = it.url || it.link || '';
    return url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${text}</a>` : text;
  }

  async function loadItems(BASE, LIMIT) {
    // 1) prova assets/news.json (gestione manuale)
    const newsUrl = resolve(`${BASE}assets/news.json`);
    const manual = await safeJson(newsUrl);
    if (Array.isArray(manual) && manual.length) {
      return manual.slice(0, LIMIT).map(x => ({
        text: x.text || '',
        url:  x.url  || ''
      })).filter(x => x.text);
    }

    // 2) fallback: leggi gli ultimi contenuti dall'Hub
    const hubUrl = resolve(`${BASE}assets/_hub.json`);
    const hub = await safeJson(hubUrl);
    const list = Array.isArray(hub) ? hub : (hub && hub.items) || [];

    // tieni prima quelli "pinnati" (pin: true) o categoria "comunicati", poi i più recenti
    const norm = list.map(it => ({
      title: it.title || '',
      date:  it.date  || '',
      link:  it.link  || it.attach || '',
      category: (it.category || '').toLowerCase(),
      pin: !!it.pin
    }));

    norm.sort((a,b) => {
      const aScore = (a.pin?2:0) + (a.category==='comunicati'?1:0);
      const bScore = (b.pin?2:0) + (b.category==='comunicati'?1:0);
      if (bScore !== aScore) return bScore - aScore;
      return (b.date||'').localeCompare(a.date||''); // date desc
    }).reverse();

    return norm.slice(0, LIMIT).map(x => ({
      text: x.title,
      url:  x.link
    })).filter(x => x.text);
  }

  async function safeJson(url) {
    try {
      const res = await fetch(cacheBust(url));
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch {
      return null;
    }
  }

  function cacheBust(u) { return u + (u.includes('?') ? '&' : '?') + 'v=' + Date.now(); }
  function resolve(p){ return p; }
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function escapeAttr(s){ return escapeHtml(s); }
})();
