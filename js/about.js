/* Chi siamo — renderer data-driven */
document.addEventListener('DOMContentLoaded', async () => {
  const $$ = (sel) => document.querySelector(sel);

  const defaults = {
    mission: "La nostra missione.",
    tags: [],
    contacts: { email: "", phone: "", address: "", mapQuery: "" },
    values: [],
    staff: []
  };

  async function loadData() {
    try {
      const r = await fetch('../assets/data/about.json', { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (_) {
      return defaults;
    }
  }

  const data = await loadData();

  /* HERO */
  const hero = $$('#about-hero');
  hero.innerHTML = `
    <div class="section-title">La nostra missione</div>
    <p class="lead">${data.mission || ''}</p>
    <div class="tags">
      ${ (data.tags || []).map(t => `<span class="tag">${t}</span>`).join('') }
    </div>
  `;

  /* CONTATTI */
  const c = data.contacts || {};
  const contacts = $$('#about-contacts');
  contacts.innerHTML = `
    <div class="section-title">Contatti</div>
    <ul class="list muted">
      ${c.email ? `<li><strong>Email:</strong> <a href="mailto:${c.email}">${c.email}</a></li>` : ''}
      ${c.phone ? `<li><strong>Telefono:</strong> <a href="tel:${c.phone.replace(/\s+/g,'')}">${c.phone}</a></li>` : ''}
      ${c.address ? `<li><strong>Indirizzo:</strong> ${c.address}</li>` : ''}
    </ul>
    <div class="btn-row">
      ${c.email ? `<a class="btn hollow" href="mailto:${c.email}">✉️ Scrivici</a>` : ''}
      ${c.phone ? `<a class="btn hollow" href="tel:${c.phone.replace(/\s+/g,'')}">📞 Chiama</a>` : ''}
      <a class="btn hollow" href="../pages/iscrizioni.html">📝 Iscrizioni</a>
      <a class="btn hollow" href="../pages/sponsor.html">🤝 Diventa sponsor</a>
    </div>
  `;

  /* MAPPA */
  const map = $$('#about-map');
  const q = encodeURIComponent(c.mapQuery || c.address || 'Roma, Italia');
  map.innerHTML = `
    <div class="section-title">Dove siamo</div>
    <div class="map-wrap">
      <iframe class="map" src="https://www.google.com/maps?q=${q}&output=embed"
        loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>
  `;

  /* VALORI */
  const values = $$('#about-values');
  values.innerHTML = `
    <p class="section-title">I nostri valori</p>
    <div class="values">
      ${ (data.values || []).map(v => `
        <div class="value">
          <h3>${v.title || ''}</h3>
          <p>${v.text || ''}</p>
        </div>
      `).join('') }
    </div>
  `;

  /* STAFF */
  const staff = $$('#about-staff');
  const items = (data.staff || []);
  staff.innerHTML = `
    <p class="section-title">Staff tecnico e dirigenti</p>
    <div class="staff-grid">
      ${ items.map(s => `
        <div class="staff">
          <img src="../${s.img || 'assets/staff/placeholder.jpg'}" alt="${s.name || 'Staff'}"
               onerror="this.src='../assets/staff/placeholder.jpg'"/>
          <div>
            <h3>${s.name || ''}</h3>
            <div class="role">${s.role || ''}</div>
            ${ s.bio ? `
              <details class="staff-bio">
                <summary>Bio / Competenze</summary>
                <div>${s.bio}</div>
              </details>` : ''
            }
          </div>
        </div>
      `).join('') }
    </div>
    <div class="muted" style="margin-top:8px">
      Per aggiornare lo staff: carica le foto in <code>assets/staff/</code> e modifica <code>assets/data/about.json</code>.
    </div>
  `;
});
