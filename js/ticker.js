/* ===== News Ticker – ASD SPP =====
 * Mostra notizie in fondo a tutte le pagine.
 * Ordine sorgenti:
 *   1) assets/news.json (manuale, priorità)
 *   2) assets/_hub.json (fallback automatico)
 *
 * Personalizza con attributi nello <script>:
 *   - data-base="./"   per index.html (root)
 *   - data-base="../"  per pagine in /pages
 *   - data-limit="6"   quante voci mostrare
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
      console.warn('[Ticker] errore caricamento:', e);
      root.remove();
    }
  }

  function renderItem(it) {
    const text = escapeHtml(it.text || it.title || '');
    const url  = it.url || it.link || '';
    return url ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener">${text}</a>` : text;
  }

  async function loadItems(BASE, LIMIT) {
    const combined = [];

    // 1) Manuale (prioritario)
    const newsUrl = resolve(`${BASE}assets/news.json`);
    const manual = await safeJson(newsUrl);
    if (Array.isArray(manual) && manual.length) {
      manual.forEach(x => {
        if (x && x.text) combined.push({ text: x.text, url: x.url || '' });
      });
    }

    // 2) Hub (riempi fino a LIMIT)
    if (combined.length < LIMIT) {
      const hubUrl = resolve(`${BASE}assets/_hub.json`);
      const hub = await safeJson(hubUrl);
      const list = Array.isArray(hub) ? hub : (hub && hub.items) || [];

      const norm = list.map(it => ({
        title: it.title || '',
        date:  it.date  || '',
        link:  it.link  || it.attach || '',
        category: (it.category || '').toLowerCase(),
        pin: !!it.pin
      }));

      // score: pin > comunicati > data recente
      norm.sort((a,b) => {
        const aScore = (a.pin?2:0) + (a.category==='comunicati'?1:0);
        const bScore = (b.pin?2:0) + (b.category==='comunicati'?1:0);
        if (bScore !== aScore) return bScore - aScore;
        return (b.date||'').localeCompare(a.date||'');
      }).reverse();

      // dedup (per testo o url)
      const seenText = new Set(combined.map(i => (i.text||'').trim()));
      const seenUrl  = new Set(combined.map(i => (i.url||'').trim()));

      for (const x of norm) {
        if (!x.title) continue;
        const t = x.title.trim();
        const u = (x.link||'').trim();
        if (seenText.has(t) || (u && seenUrl.has(u))) continue;
        combined.push({ text: t, url: u });
        if (combined.length >= LIMIT) break;
      }
    }

    return combined.slice(0, LIMIT);
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
