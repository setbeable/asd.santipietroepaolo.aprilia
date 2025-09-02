(function(){
  document.addEventListener('DOMContentLoaded', () => {
    // ========== Email offuscata ==========
    const emailA = document.getElementById('email-link');
    const u = (emailA?.dataset.user || 'asd.santipietroepaolo').trim();
    const d = (emailA?.dataset.domain || 'gmail.com').trim();
    const email = `${u}@${d}`;
    if (emailA){
      emailA.textContent = email;
      emailA.href = `mailto:${email}`;
    }

    // Copia email
    const copyBtn = document.getElementById('copy-email');
    if (copyBtn){
      copyBtn.addEventListener('click', async () => {
        try{
          await navigator.clipboard.writeText(email);
          toast('Email copiata negli appunti ✅');
        }catch(_){
          toast('Copia non riuscita. Tieni premuto per selezionare e copia manualmente.');
        }
      });
    }

    // ========== Telefono / WhatsApp ==========
    const telA = document.getElementById('tel-link');
    if (telA && telA.dataset.phone){
      telA.href = `tel:${telA.dataset.phone}`;
      telA.textContent = fmtPhone(telA.dataset.phone);
    }

    const waA = document.getElementById('wa-link');
    if (waA && waA.dataset.wa){
      const text = encodeURIComponent('Ciao! Scrivo dal sito ASD Santi Pietro e Paolo.');
      waA.href = `https://wa.me/${waA.dataset.wa}?text=${text}`;
    }

    // ========== Form (mailto) ==========
    const form = document.getElementById('contact-form');
    const toastBox = document.getElementById('form-toast');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();

      // honeypot
      if (form.website && form.website.value) return;

      const name  = form.name?.value?.trim();
      const from  = form.email?.value?.trim();
      const phone = form.phone?.value?.trim();
      const topic = form.topic?.value || 'Info generali';
      const msg   = form.message?.value?.trim();
      const ok    = form.querySelector('#cf-privacy')?.checked;

      if (!name || !from || !msg || !ok){
        toast('Compila i campi obbligatori (*) e accetta la privacy.', true);
        return;
      }

      // Componi subject + body
      const subject = `Richiesta dal sito — ${topic} — ${name}`;
      const bodyLines = [
        `Nome: ${name}`,
        `Email: ${from}`,
        phone ? `Telefono: ${phone}` : null,
        `Argomento: ${topic}`,
        '',
        'Messaggio:',
        msg,
        '',
        '— Inviato dal sito ASD Santi Pietro e Paolo'
      ].filter(Boolean);

      const body = bodyLines.join('\n');
      const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Apri client email
      window.location.href = mailto;

      toast('Se non si apre il client email, scrivici a ' + email);
    });

    function fmtPhone(p){
      // formatta un po’ il numero (+39 333 123 4567)
      const clean = (p||'').replace(/\s+/g,'');
      if (!clean.startsWith('+')) return clean;
      return clean.replace(/^(\+\d{2})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4');
    }

    function toast(text, isError){
      if (!toastBox) return;
      toastBox.textContent = text;
      toastBox.style.display = 'block';
      toastBox.style.color = isError ? '#ffd6d6' : '#d6ffe9';
      toastBox.style.opacity = '0.95';
      clearTimeout(toastBox._t);
      toastBox._t = setTimeout(() => { toastBox.style.display = 'none'; }, 6000);
    }
  });
})();
