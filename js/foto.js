/* Galleria Foto — ASD
 * - Genera una griglia responsive con miniature
 * - Al click si apre l’immagine a schermo intero (usa la modale v2 già inclusa)
 * - Per aggiungere foto: modifica l’array PHOTOS qui sotto
 */

document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('galleria');
  if (!container) return;

  // === CONFIGURA QUI LE TUE FOTO ===
  // thumb: miniatura (veloce), src: immagine grande; title opzionale
  const PHOTOS = [
    // Esempi (sostituisci con i tuoi file)
    { thumb: '../assets/foto/thumbs/gara-01.jpg', src: '../assets/foto/gara-01.jpg', title: 'Gara 01' },
    { thumb: '../assets/foto/thumbs/gara-02.jpg', src: '../assets/foto/gara-02.jpg', title: 'Gara 02' },
    { thumb: '../assets/foto/thumbs/allenamento-01.jpg', src: '../assets/foto/allenamento-01.jpg', title: 'Allenamento' },
    // aggiungi altri oggetti...
  ];

  if (!PHOTOS.length) {
    container.innerHTML = '<div style="opacity:.8">Nessuna foto disponibile al momento.</div>';
    return;
  }

  // Crea le card della griglia
  const frag = document.createDocumentFragment();
  PHOTOS.forEach(({ thumb, src, title }) => {
    const a = document.createElement('a');
    a.href = src;                     // la modale v2 intercetta i link a immagini
    a.title = title || '';
    a.setAttribute('aria-label', title || 'Foto');
    // opzionale: se vuoi escluderne alcuni dalla modale, usa a.dataset.noModal = '';

    const img = document.createElement('img');
    img.src = thumb || src;
    img.alt = title || 'Foto';
    img.loading = 'lazy';

    a.appendChild(img);
    frag.appendChild(a);
  });
  container.appendChild(frag);
});
function openViewer(eventSlug, file){
  const modal    = document.getElementById('modal');
  const inner    = modal.querySelector('.modal__inner');
  const body     = modal.querySelector('.modal__body');
  const btnClose = modal.querySelector('.modal__close');
  const btnBack  = modal.querySelector('.modal__back');

  // elenco foto dell'evento
  const list = state.flat.filter(x => x.eventSlug === eventSlug);
  let index  = list.findIndex(x => x.file === file);
  if (index < 0) index = 0;

  function renderImage(){
    const item = list[index];
    const base = ASSETS_BASE + item.eventSlug + '/';

    // pulisci e costruisci il viewer
    body.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'player-wrap';

    const img  = document.createElement('img');
    img.src    = base + item.file;
    img.alt    = item.title || 'Foto';

    wrap.appendChild(img);
    body.appendChild(wrap);

    // frecce
    const left  = document.createElement('button');
    left.className = 'navbtn left';  left.textContent  = '←';
    const right = document.createElement('button');
    right.className = 'navbtn right'; right.textContent = '→';

    left.addEventListener('click',  ()=>{ index = (index - 1 + list.length) % list.length; renderImage(); });
    right.addEventListener('click', ()=>{ index = (index + 1) % list.length; renderImage(); });

    body.appendChild(left);
    body.appendChild(right);

    // reset di ogni scroll (fix “vuoto” in alto su mobile)
    modal.scrollTop = 0;
    inner.scrollTop = 0;
    body.scrollTop  = 0;
    // alcuni browser applicano lo scroll dopo il reflow: forza un reset async
    requestAnimationFrame(()=>{ body.scrollTop = 0; });
  }

  renderImage();

  // apri la modale
  modal.classList.add('is-open');
  modal.removeAttribute('aria-hidden');
  document.documentElement.style.overflow = 'hidden';

  // chiusure & tastiera
  function onKey(e){
    if (e.key === 'Escape'){ e.preventDefault(); close(); }
    if (e.key === 'ArrowLeft'){  e.preventDefault(); body.querySelector('.navbtn.left')?.click(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); body.querySelector('.navbtn.right')?.click(); }
  }
  function close(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    body.innerHTML = '';
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey, true);
  }

  btnClose.addEventListener('click', (e)=>{ e.stopPropagation(); close(); }, { once:true });
  btnBack .addEventListener('click', (e)=>{ e.stopPropagation(); close(); }, { once:true });
  modal   .addEventListener('click', (e)=>{ if (e.target === modal) close(); }, { once:true });
  document.addEventListener('keydown', onKey, true);
}
