#!/usr/bin/env python3
import argparse, json, os, sys

IMG_EXT = {'.jpg','.jpeg','.png','.webp','.gif','.JPG','.JPEG','.PNG','.WEBP','.GIF'}

def is_img(name: str) -> bool:
    _, ext = os.path.splitext(name)
    return ext in IMG_EXT

def build_manifest(foto_dir: str):
    events = []
    for entry in sorted(os.listdir(foto_dir)):
        ev_path = os.path.join(foto_dir, entry)
        if not os.path.isdir(ev_path) or entry.startswith('_'):
            continue
        images = []
        for name in sorted(os.listdir(ev_path)):
            full = os.path.join(ev_path, name)
            if os.path.isdir(full):  # es. thumbs
                continue
            if is_img(name):
                images.append({ "file": name })
        if images:
            events.append({
                "slug": entry,
                "name": entry.replace('-', ' ').title(),
                "images": images
            })
    return {"version": 1, "events": events}

def main():
    ap = argparse.ArgumentParser(description="Genera assets/foto/_gallery.json")
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
    print(f"Manifest scritto: {out_path} ({len(manifest['events'])} eventi)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
