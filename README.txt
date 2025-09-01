
# Foto — Bundle pronto

## Cosa c'è dentro
- `foto.html` — pagina Foto già collegata
- `css/asd-tabs-override-v2.css` — patch stile globale (card grandi, contrasto)
- `js/asd-modal-v2.js` — modale full-screen
- `js/foto-auto-plus.js` — galleria con filtri, ricerca, paginazione, navigazione
- `scripts/build_gallery.py` — genera `assets/foto/_gallery.json` scansionando le cartelle evento
- `.github/workflows/gallery.yml` — aggiornamento automatico del manifest su GitHub (opzionale)
- `assets/foto/example-event/` — struttura esempio + `_gallery.json` di esempio

## Come usarlo in 3 passi
1. Copia le cartelle `css/`, `js/`, `scripts/`, `.github/` e la pagina `foto.html` nel tuo progetto.
2. Metti le tue foto in `assets/foto/<evento>/` (+ miniature opzionali in `thumbs/` con stesso nome).
3. Genera il manifest:
   - Locale: `python scripts/build_gallery.py`
   - Oppure via GitHub Actions (attiva le Actions, committa e push).

Apri `foto.html`: vedrai filtri "Evento/Anno/Cerca", griglia e modale con frecce.
