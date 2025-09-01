# Patch UI — ASD Santi Pietro e Paolo (Tabs + Modal)

Questa patch:
1) **Ingrandisce** i contenitori dei tab/card e aumenta la leggibilità (sfondo scuro, testo chiaro).
2) **Evidenzia** i link ai file (giallo/azzurro) per maggiore contrasto sullo sfondo.
3) **Aggiunge l'apri/chiudi a schermo**: cliccando su link/immagini con class `enlargeable` si apre una modale a tutto schermo (chiudi con X, click fuori o tasto `ESC`).

## Come integrare

1. Copia i file nelle cartelle del tuo progetto:
```
/css/asd-tabs-override.css
/js/asd-modal.js
/snippets/modal.html  (solo snippet da incollare)
```

2. Import in pagina (o nel layout globale):
```html
<link rel="stylesheet" href="css/asd-tabs-override.css" />
...
<script src="js/asd-modal.js" defer></script>
```

3. Inserisci lo **snippet della modale** prima di `</body>` (vedi `snippets/modal.html`).

4. Aggiungi la classe `enlargeable` ai link/immagini che vuoi aprire:
```html
<!-- PDF/Documenti -->
<a href="docs/Comunicato_1.pdf" class="enlargeable">Comunicato n.1 (PDF)</a>

<!-- Immagini -->
<a href="img/foto01.jpg" class="enlargeable">Foto 01</a>
<!-- oppure direttamente sull'immagine -->
<img src="img/foto01.jpg" class="enlargeable" alt="Foto 01">
```

### Note
- La patch usa selettori generici: `.tab-content, .tab-pane, .card, .panel, .box, .content-block`. Se le tue classi sono diverse, aggiungile nella prima regola del CSS per applicare lo stesso stile.
- Se una card non deve essere ridimensionata, aggiungi una classe tua (es. `.no-resize`) e togli il selettore per quella card dal CSS.
- Non richiede dipendenze: JS vanilla.

Buon lavoro!
