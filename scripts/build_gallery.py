#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Genera assets/foto/_gallery.json scansionando le cartelle dentro assets/foto/
- Ogni sotto-cartella = un evento (slug = nome cartella)
- Raccoglie immagini (esclude la cartella 'thumbs')
- Se esiste una miniatura in thumbs/, la indica come 'thumb', altrimenti lascia comunque 'thumbs/<file>'
  (il JS ha già il fallback sull'originale)
"""

from pathlib import Path
import json, re, datetime

ROOT = Path(__file__).resolve().parent.parent
FOTO_DIR = ROOT / 'assets' / 'foto'
OUT_PATH = FOTO_DIR / '_gallery.json'

IMG_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.heic'}

def humanize(name: str) -> str:
    s = name.replace('-', ' ').replace('_', ' ').strip()
    return re.sub(r'\s+', ' ', s).title()

def guess_year(*strings):
    for s in strings:
        m = re.search(r'(20\d{2}|19\d{2})', s or '')
        if m:
            return int(m.group(1))
    return None

def collect_event(folder: Path):
    slug = folder.name
    name = humanize(slug)
    year = guess_year(slug)

    thumbs_dir = folder / 'thumbs'
    thumbs_set = {p.name.lower() for p in thumbs_dir.glob('*')} if thumbs_dir.is_dir() else set()

    images = []
    for p in sorted(folder.iterdir()):
        if p.is_dir() or p.name == 'thumbs':
            continue
        if p.suffix.lower() not in IMG_EXT:
            continue
        file_rel = f'{slug}/{p.name}'
        # se esiste la miniatura con lo stesso nome in thumbs/, usala:
        thumb_name = p.name
        thumb_rel = f'{slug}/thumbs/{thumb_name}'

        # titolo: prova a derivarlo dal nome file
        title = humanize(p.stem)
        img_year = guess_year(p.stem) or year

        images.append({
            'file': p.name,
            'thumb': f'thumbs/{p.name}',  # il JS sa fare fallback se non esiste
            'title': title,
            'year': img_year
        })

    if not images:
        return None

    # se non c'è anno nei file né nella cartella, lascia None; il frontend gestisce
    evt = {
        'slug': slug,
        'name': name,
        'year': year,
        'images': images
    }
    return evt

def main():
    if not FOTO_DIR.is_dir():
        raise SystemExit(f'Cartella non trovata: {FOTO_DIR}')

    events = []
    for item in sorted(FOTO_DIR.iterdir()):
        if not item.is_dir():
            continue
        if item.name.startswith(('_', '.')) or item.name.lower() == 'thumbs':
            continue
        evt = collect_event(item)
        if evt:
            events.append(evt)

    # ordina per anno (desc), poi per nome
    def sort_key(e):
        y = e.get('year') or 0
        return (-int(y), e.get('name', '').lower()) if isinstance(y, int) else (0, e.get('name', '').lower())

    events.sort(key=sort_key)

    data = {
        'version': 1,
        'generated_at': datetime.datetime.utcnow().isoformat() + 'Z',
        'events': events
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'OK: scritto {OUT_PATH} con {sum(len(e["images"]) for e in events)} foto in {len(events)} eventi.')

if __name__ == '__main__':
    main()
