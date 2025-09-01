/*! ASD SPP — Modal v2
 * - Auto-enlarge per tutti i link a PDF/immagini (no classe richiesta)
 * - Mantiene supporto anche per elementi con .enlargeable
 */
(function () {
  const modal = document.getElementById('asd-modal');
  if (!modal) return;
  const body  = modal.querySelector('.asd-modal__body');
  const closeBtn = modal.querySelector('.asd-modal__close');

  const isImage = (u) => /\.(png|jpe?g|gif|webp|svg)$/i.test(u);
  const isPDF   = (u) => /\.pdf(\?.*)?$/i.test(u);

  function openModalFromHref(href) {
    if (!href) return;
    body.innerHTML = '';
    if (isImage(href)) {
      const img = document.createElement('img');
      img.src = href;
      img.alt = 'preview';
      body.appendChild(img);
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = href;
      iframe.width = "100%";
      iframe.height = "100%";
      iframe.setAttribute('frameborder', '0');
      body.appendChild(iframe);
    }
    modal.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    body.innerHTML = '';
  }

  // 1) Click su .enlargeable (compatibilità)
  document.addEventListener('click', function (e) {
    const el = e.target.closest('.enlargeable');
    if (!el) return;
    let href = (el.tagName === 'A') ? el.getAttribute('href') :
               (el.tagName === 'IMG') ? el.getAttribute('src') : null;
    if (href && (isImage(href) || isPDF(href))) {
      e.preventDefault();
      openModalFromHref(href);
    }
  });

  // 2) Auto-hook per tutti i link PDF/immagini (senza classe)
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (isImage(href) || isPDF(href)) {
      // escludi link con data-no-modal
      if (a.hasAttribute('data-no-modal')) return;
      e.preventDefault();
      openModalFromHref(href);
    }
  });

  // Chiudi con click overlay / X / ESC
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();
