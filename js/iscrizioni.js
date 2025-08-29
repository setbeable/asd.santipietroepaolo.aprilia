// Configura qui l'URL del Google Form (se disponibile).
// Se lasci vuoto, usiamo il PDF locale come fallback.
const GOOGLE_FORM_URL = "https://forms.gle/example"; // <- sostituisci con il tuo
const FALLBACK_PDF = "../documenti/iscrizioni/modulo.pdf";

const box = document.getElementById("iscrizioni-box");

if (GOOGLE_FORM_URL && GOOGLE_FORM_URL.startsWith("http")) {
  box.innerHTML = `
    <p>Compila il modulo di iscrizione online:</p>
    <div style="position:relative;padding-bottom:100%;height:0;overflow:hidden;border-radius:12px">
      <iframe src="${GOOGLE_FORM_URL}" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
    </div>
    <p style="margin-top:12px">Se preferisci, puoi anche scaricare il modulo PDF: <a href="${FALLBACK_PDF}" target="_blank">Scarica modulo</a></p>
  `;
} else {
  box.innerHTML = `
    <p>Iscrizione tramite modulo PDF. Scarica, compila e invia:</p>
    <a class="btn" href="${FALLBACK_PDF}" target="_blank">Scarica modulo PDF</a>
  `;
}
