/*! ASD SPP — Modal & enlarge
 *  - Apre documenti/immagini a schermo quasi intero
 *  - Chiudi con X, overlay o tasto ESC
 *  - Aggiungi class="enlargeable" ai link o immagini
 */
(function () {
  const modal = document.getElementById('asd-modal');
  const body  = modal ? modal.querySelector('.asd-modal__body') : null;
  const closeBtn = modal ? modal.querySelector('.asd-modal__close') : null;

  function isImage(url) {
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
  }
  function isPDF(url) {
    return /\.pdf(\?.*)?$/i.test(url);
  }

  function openModalFromHref(href) {
    if (!modal || !body) return;

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
    if (!modal) return;
    modal.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    if (body) body.innerHTML = '';
  }

  // Delegation: click su qualsiasi .enlargeable
  document.addEventListener('click', function (e) {
    const el = e.target.closest('.enlargeable');
    if (!el) return;

    // Se è un link, usa href; se è un img senza link, usa src
    let href = null;
    if (el.tagName === 'A') href = el.getAttribute('href');
    else if (el.tagName === 'IMG') href = el.getAttribute('src');

    if (href) {
      e.preventDefault();
      openModalFromHref(href);
    }
  });

  // Chiudi quando clicchi fuori
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
