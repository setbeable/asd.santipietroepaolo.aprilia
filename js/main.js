document.getElementById('year').textContent = new Date().getFullYear();
// If you want the ISCRIZIONI CTA to go to a Google Form, set it here if not already set in HTML.
(function(){
  var cta = document.getElementById("cta-iscrizioni");
  if(!cta) return;
  // var iscrizioniURL = "https://forms.gle/tuo-modulo";
  // if(cta.getAttribute('href') === '#') cta.href = iscrizioniURL;
})();