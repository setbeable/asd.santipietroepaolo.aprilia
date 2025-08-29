# ASD Santi Pietro e Paolo — Sito statico (GitHub Pages)

Struttura pulita con **HTML/CSS/JS separati** e contenuti dinamici alimentati da liste JS.
Per aggiornare i contenuti, modifica i file in `js/` (es. `torneo.js`, `foto.js`) e aggiungi i documenti nelle cartelle sotto `documenti/`.

## Pubblicazione
1. Carica questa cartella nel repo `setbeable/ASD_Santi_Pietro_e_Paolo` (branch `main`).
2. Abilita **Settings → Pages → Deploy from a branch → main / (root)**.
3. Il sito sarà disponibile in HTTPS su:
   https://setbeable.github.io/ASD_Santi_Pietro_e_Paolo/

## Aggiornamenti contenuti
- Classifiche: metti i PDF in `documenti/classifiche/` e aggiorna la lista in `js/torneo.js`.
- Squadre: metti i PDF in `documenti/squadre/` e aggiorna `js/torneo.js`.
- Foto: carica JPG/PNG in `documenti/foto/` e aggiorna `js/foto.js`.
- Comunicati: PDF in `documenti/comunicati/` e aggiorna `js/comunicati.js`.
- Regolamento: PDF in `documenti/regolamento/` e aggiorna `js/regolamento.js`.
