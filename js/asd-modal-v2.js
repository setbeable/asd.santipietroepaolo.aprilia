
/*! ASD SPP — Modal v2 (auto per immagini/pdf + API basica) */
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
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
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

  // Click su immagini/pdf senza richiedere classi
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (isImage(href) || isPDF(href)) {
      if (a.hasAttribute('data-no-modal')) return; // opt-out
      e.preventDefault();
      openModalFromHref(href);
    }
  });

  // Chiudi con overlay / X / ESC
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();
