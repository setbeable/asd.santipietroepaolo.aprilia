# Patch UI v2 — ASD Santi Pietro e Paolo (globale)
- Override più forte (maggiore specificità, `!important` dove serve)
- Link a PDF/immagini si aprono **in modale automaticamente** (non serve la classe)
- Colori e dimensioni applicati a molte classi comuni

## Integrazione
```html
<link rel="stylesheet" href="css/asd-tabs-override-v2.css?v=2">
...
<script src="js/asd-modal-v2.js?v=2" defer></script>
```
Incolla lo snippet `snippets/modal.html` prima di `</body>`.

### Verifica rapido
Attiva (nel CSS) il blocco "Debug rapido" per mostrare il badge **UI v2** in basso a destra: se lo vedi, il CSS è caricato.

### Escludere un link dalla modale
Aggiungi `data-no-modal` al link:
```html
<a href="docs/file.pdf" data-no-modal>Scarica senza modale</a>
```
