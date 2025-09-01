
# Auto-Galleria PLUS (filtri + paginazione + navigazione)

## Novità
- Filtri per **evento**, **anno**, **ricerca testo**
- **Paginazione** (24 per pagina, configurabile)
- Modale con **freccia Avanti/Indietro** per scorrere le foto dell'evento

## Integrazione
Sostituisci in `foto.html`:
```html
<script src="../js/asd-modal-v2.js?v=2" defer></script>
<script src="../js/foto-auto-plus.js" defer></script>
```
Assicurati di avere `assets/foto/_gallery.json` (generato con lo script `build_gallery.py`).

## Suggerimenti
- Per avere il filtro **Anno**, metti l'anno nello **slug** o nel **name** dell'evento (es. `torneo-2025`, `Amichevole 2024`).
- Le miniature vengono cercate automaticamente in `thumbs/` con **stesso nome** dell'immagine grande.
