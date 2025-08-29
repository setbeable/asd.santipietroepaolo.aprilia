(function(){
  const form = document.getElementById('contact-form');
  const msg = document.getElementById('form-msg');
  if(!form) return;
  form.addEventListener('submit', function(e){
    // basic check
    const nome = form.querySelector('[name=nome]').value.trim();
    const email = form.querySelector('[name=_replyto]').value.trim();
    const body = form.querySelector('[name=messaggio]').value.trim();
    if(!nome || !email || !body){
      e.preventDefault();
      msg.textContent = 'Compila tutti i campi.';
      return;
    }
    msg.textContent = 'Invio in corso...';
  });
})();