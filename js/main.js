document.getElementById('year').textContent = new Date().getFullYear();
// Imposta link Iscrizioni (Google Forms o PDF nel repo)
(function(){
  var iscrizioniURL = "https://forms.gle/tuo-modulo"; // <-- cambia questo
  var cta = document.getElementById("cta-iscrizioni");
  if(cta && iscrizioniURL) cta.href = iscrizioniURL;
})();
