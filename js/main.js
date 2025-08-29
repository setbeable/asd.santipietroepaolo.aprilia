document.getElementById('year').textContent = new Date().getFullYear();
// Imposta link Iscrizioni (Google Forms o PDF nel repo)
(function(){
  var iscrizioniURL = "https://forms.gle/tuo-modulo"; // <-- cambia questo
  var cta = document.getElementById("cta-iscrizioni");
  if(cta && iscrizioniURL) cta.href = iscrizioniURL;
})();

// Se l'anchor delle iscrizioni punta a una pagina locale, non sovrascriverla.
(function(){
  var cta = document.getElementById("cta-iscrizioni");
  if(!cta) return;
  // Se l'href e' ancora placeholder, puoi impostarlo a un Google Form:
  // var iscrizioniURL = "https://forms.gle/tuo-modulo";
  // if(cta.getAttribute('href') === '#' && iscrizioniURL) cta.href = iscrizioniURL;
})();