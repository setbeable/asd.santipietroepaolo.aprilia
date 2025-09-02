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
  const modal     = document.getElementById('modal');
  const inner     = modal.querySelector('.modal__inner');
  const body      = modal.querySelector('.modal__body');
  const btnClose  = modal.querySelector('.modal__close');
  const btnBack   = modal.querySelector('.modal__back');

  // pulizia eventuali pulsanti duplicati
  modal.querySelectorAll('.modal__fs').forEach(b=>b.remove());

  // bottone schermo intero
  const btnFS = document.createElement('button');
  btnFS.className = 'modal__fs';
  btnFS.type = 'button';
  btnFS.title = 'Schermo intero';
  btnFS.textContent = '⤢';
  inner.appendChild(btnFS);

  function toggleFS(){
    const target = inner;
    if (!document.fullscreenElement) {
      if (target.requestFullscreen) target.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }
  btnFS.addEventListener('click', (e)=>{ e.stopPropagation(); toggleFS(); });

  // …(il resto della tua renderImage/gestione frecce)…

  // mostra modale
  body.innerHTML = '';
  // wrapper immagine
  const wrap = document.createElement('div');
  wrap.className = 'player-wrap';
  const img  = document.createElement('img');
  img.src    = /* base + item.file */ BASE + eventSlug + '/' + file;
  img.alt    = 'Foto';
  img.style.maxWidth  = '100%';
  img.style.maxHeight = '100%';
  img.style.objectFit = 'contain';
  wrap.appendChild(img);
  body.appendChild(wrap);

  modal.classList.add('is-open');
  modal.removeAttribute('aria-hidden');
  document.documentElement.style.overflow = 'hidden';

  function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
  function close(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    body.innerHTML = '';
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onKey, true);
    modal.querySelectorAll('.modal__fs').forEach(b=>b.remove());
  }

  btnClose.addEventListener('click', (e)=>{ e.stopPropagation(); close(); }, {once:true});
  btnBack .addEventListener('click', (e)=>{ e.stopPropagation(); close(); }, {once:true});
  modal.addEventListener('click', (e)=>{ if(e.target === modal) close(); }, {once:true});
  document.addEventListener('keydown', onKey, true);
}
