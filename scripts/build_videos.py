#!/usr/bin/env python3
# build_videos.py — genera assets/video/_videos.json
# Uso:
#   python scripts/build_videos.py --stdout > assets/video/_videos.json
import argparse, json, os, re, sys, datetime

VIDEO_EXT = {'.mp4', '.webm', '.ogg'}
LINK_EXT  = {'.url', '.txt', '.link'}
EXCLUDE_DIRS = {'.git', '__MACOSX', 'thumbs'}

DATE_PATTERNS = [
    re.compile(r'(?P<y>\d{4})[-_./](?P<m>\d{2})[-_./](?P<d>\d{2})'),
    re.compile(r'(?P<d>\d{2})[-_./](?P<m>\d{2})[-_./](?P<y>\d{4})'),
    re.compile(r'(?P<y>\d{4})(?P<m>\d{2})(?P<d>\d{2})'),
]

def read_first_url(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                line=line.strip()
                if line.startswith('http://') or line.startswith('https://'):
                    return line
    except Exception:
        pass
    return None

def extract_date(s):
    for pat in DATE_PATTERNS:
        m = pat.search(s)
        if m:
            y, mth, d = int(m.group('y')), int(m.group('m')), int(m.group('d'))
            try:
                dt = datetime.date(y, mth, d)
                return dt.isoformat(), str(y)
            except ValueError:
                pass
    m = re.search(r'(20\d{2}|19\d{2})', s)
    return (None, m.group(1)) if m else (None, None)

def nice_title(name):
    import os, re
    name=os.path.splitext(os.path.basename(name))[0]
    name=re.sub(r'[_\-]+', ' ', name)
    name=re.sub(r'\s{2,}', ' ', name).strip()
    return name.title() if name else 'Video'

def scan(base_dir):
    items=[]
    base=os.path.abspath(base_dir)
    for root, dirs, files in os.walk(base):
        dirs[:]=[d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        rel_root=os.path.relpath(root, base).replace('\\','/')
        for f in files:
            ext=os.path.splitext(f)[1].lower()
            if ext not in VIDEO_EXT and ext not in LINK_EXT: 
                continue
            rel=(rel_root + '/' + f).lstrip('./').lstrip('/').replace('\\','/')
            parts=rel.split('/')
            category=parts[0] if len(parts)>1 else None

            date_str, year_str = extract_date(rel)
            title = nice_title(f)

            if ext in VIDEO_EXT:
                # thumb di default: thumbs/<stesso-percorso-senza-ext>.jpg
                subpath = '/'.join(parts[1:]) or f
                thumb = 'thumbs/' + os.path.splitext(subpath)[0] + '.jpg'
                items.append({
                    "file": rel,
                    "title": title,
                    "category": category,
                    "year": int(year_str) if year_str else None,
                    "date": date_str,
                    "thumb": thumb
                })
            else:
                url = read_first_url(os.path.join(root, f))
                if not url: 
                    continue
                items.append({
                    "url": url,
                    "title": title,
                    "category": category,
                    "year": int(year_str) if year_str else None,
                    "date": date_str
                })
    # ordinamento: data desc -> titolo
    def key(v):
        dt=v.get('date') or f"{v.get('year',0)}-01-01"
        return (dt, v.get('title') or '')
    items.sort(key=key, reverse=True)
    return {"version":1, "videos":items}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--root', default=os.getcwd())
    ap.add_argument('--video', default='assets/video')
    ap.add_argument('--stdout', action='store_true')
    args=ap.parse_args()

    base=os.path.join(os.path.abspath(args.root), args.video)
    if not os.path.isdir(base):
        print(f"[ERRORE] Cartella non trovata: {base}", file=sys.stderr); return 2
    manifest=scan(base)
    out_path=os.path.join(base, '_videos.json')
    if args.stdout:
        print(json.dumps(manifest, ensure_ascii=False, indent=2)); 
        return 0
    try:
        with open(out_path,'w',encoding='utf-8') as f:
            json.dump(manifest,f,ensure_ascii=False,indent=2)
        print(f"[OK] Scritto: {out_path} — video: {len(manifest['videos'])}")
    except PermissionError:
        print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
