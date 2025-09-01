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
