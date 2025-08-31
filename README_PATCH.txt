FEATURE PACK — ASD Santi Pietro e Paolo
======================================
Contenuto:
- /assets/icons/*.svg  -> icone per sostituire le emoji nei pulsanti
- /styles/additions.css -> CSS per icone, lightbox e griglia sponsor
- /js/lightbox.js       -> lightbox per la pagina Foto
- /js/foto.js           -> builder galleria (modifica i nomi file in cima)
- /js/radial-export-import.js -> export/import layout del menu radiale
- /pages/sponsor.html   -> nuova pagina Sponsor (griglia loghi + CTA)

INTEGRAZIONE (passi rapidi):
1) Copia TUTTI i file nelle stesse cartelle del tuo progetto.
   (Se non hai /styles/additions.css, basta copiarla; non sostituisce styles.css)

2) Aggiungi in TUTTE le pagine il CSS aggiuntivo dopo styles.css:
   <link rel="stylesheet" href="styles/additions.css">
   (nelle pagine interne usa ../styles/additions.css)

3) Nella HOME (index.html):
   - Aggiungi i pulsanti per export/import vicino a "Ripristina/Blocca layout":
     <button class="reset-layout" id="export-layout">⬇️ Esporta layout</button>
     <label class="reset-layout" for="import-layout" style="cursor:pointer;">⬆️ Importa layout</label>
     <input type="file" id="import-layout" accept="application/json" style="display:none">
   - Aggiungi lo script subito dopo radial.js:
     <script src="js/radial-export-import.js"></script>
   - (Opzionale) sostituisci le emoji nelle label con:
     <img class="icon" src="assets/icons/NOME.svg" alt=""><span>Testo</span>

4) Pagina Foto (pages/foto.html):
   - Inserisci il blocco lightbox appena sotto la galleria:
     <div class="lightbox" id="lightbox"><span class="close" id="lb-close">×</span><span class="nav prev" id="lb-prev">‹</span><img id="lb-img" alt=""/><span class="nav next" id="lb-next">›</span></div>
   - carica le immagini in /documenti/foto/
   - aggiorna l'array IMMAGINI dentro js/foto.js
   - includi lo script alla fine della pagina:
     <script src="../js/lightbox.js"></script>

5) Sponsor:
   - Aggiungi pages/sponsor.html e collegalo dal menu.
   - Sostituisci le immagini demo con i loghi reali.
   - Modifica l'email della CTA.

6) Commit & Push su GitHub Pages.

Se vuoi, posso fornirti un pacchetto COMPLETO con i file già modificati
(index, foto, sponsor) in base al tuo repo corrente.
