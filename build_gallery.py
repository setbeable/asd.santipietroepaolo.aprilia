#!/usr/bin/env python3
import argparse, json, os, sys

IMG_EXT = {
    '.jpg','.jpeg','.png','.webp','.gif',
    '.JPG','.JPEG','.PNG','.WEBP','.GIF'
}
EXCLUDE_DIRS = {'thumbs', '.git', '__MACOSX'}

def is_img(name: str) -> bool:
    return os.path.splitext(name)[1] in IMG_EXT

def collect_images_recursive(event_dir: str):
    """Raccoglie TUTTE le immagini dentro event_dir (sottocartelle incluse),
    saltando directories in EXCLUDE_DIRS. Restituisce percorsi *relativi all'evento*
    con separatore '/' (utile per il front-end: 'thumbs/<relpath>')."""
    images = []
    for root, dirs, files in os.walk(event_dir):
        # escludi cartelle inutili (e non scenderci)
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        for f in files:
            if not is_img(f):
                continue
            rel = os.path.relpath(os.path.join(root, f), event_dir)
            rel = rel.replace('\\', '/')  # Windows → URL friendly
            images.append({"file": rel})
    return images

def build_manifest(foto_dir: str):
    events = []
    for entry in sorted(os.listdir(foto_dir)):
        if entry.startswith('_'):
            # es.: _gallery.json
            continue
        ev_path = os.path.join(foto_dir, entry)
        if not os.path.isdir(ev_path):
            continue

        images = collect_images_recursive(ev_path)
        if not images:
            # cartella evento senza immagini → salta
            continue

        events.append({
            "slug": entry,                                # nome cartella evento
            "name": entry.replace('-', ' ').title(),      # nome “carino”
            "images": images                              # può contenere 'sub/dir/foto.jpg'
        })

    return {"version": 2, "events": events}

def main():
    ap = argparse.ArgumentParser(description="Genera assets/foto/_gallery.json (ricorsivo)")
    ap.add_argument('--root', default=os.getcwd())
    ap.add_argument('--foto', default='assets/foto')
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    foto_dir = os.path.join(root, args.foto)
    if not os.path.isdir(foto_dir):
        print(f"Cartella non trovata: {foto_dir}", file=sys.stderr)
        return 2

    manifest = build_manifest(foto_dir)
    out_path = os.path.join(foto_dir, "_gallery.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"OK: {out_path} — eventi: {len(manifest['events'])}")
    # debug: stampa quanti file per evento
    for ev in manifest["events"]:
        print(f"  - {ev['slug']}: {len(ev['images'])} foto")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
