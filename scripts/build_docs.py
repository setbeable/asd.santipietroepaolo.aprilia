#!/usr/bin/env python3
# build_docs.py — genera assets/docs/_docs.json scansionando ricorsivamente assets/docs/**
# Uso base:
#   cd <root del progetto>
#   python scripts/build_docs.py
# Opzioni:
#   --root <path>   (default: cwd)
#   --docs <path>   (default: assets/docs)
#   --out  <path>   (default: assets/docs/_docs.json)
#   --stdout        (emette il JSON su stdout invece di scrivere su file)

import argparse, json, os, re, sys, datetime

DOC_EXT = {'.pdf','.png','.jpg','.jpeg','.webp','.gif','.svg','.doc','.docx','.xls','.xlsx','.csv','.txt'}
EXCLUDE_DIRS = {'.git','__MACOSX'}
DATE_PATTERNS = [
    re.compile(r'(?P<y>\d{4})[-_./](?P<m>\d{2})[-_./](?P<d>\d{2})'),  # 2025-08-20
    re.compile(r'(?P<d>\d{2})[-_./](?P<m>\d{2})[-_./](?P<y>\d{4})'),  # 20-08-2025
    re.compile(r'(?P<y>\d{4})(?P<m>\d{2})(?P<d>\d{2})'),              # 20250820
]

def is_doc(filename): return os.path.splitext(filename)[1].lower() in DOC_EXT

def normalize_title(filename):
    name = os.path.splitext(os.path.basename(filename))[0]
    for pat in DATE_PATTERNS:
        m = pat.match(name)
        if m:
            i = m.end()
            if i < len(name) and name[i] in ('-','_',' ','/','.'): i += 1
            name = name[i:]; break
    name = re.sub(r'[_\-]+', ' ', name).strip()
    name = re.sub(r'\s{2,}', ' ', name)
    return name.title() if name else os.path.basename(filename)

def extract_date(s: str):
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

def scan_docs(docs_dir: str):
    items = []
    base = os.path.abspath(docs_dir)
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        rel_root = os.path.relpath(root, base).replace('\\','/')
        for f in files:
            if not is_doc(f): continue
            rel_path = (rel_root + '/' + f).lstrip('./').lstrip('/').replace('\\','/')
            if os.path.basename(rel_path) == '_docs.json':  # non includere il manifest
                continue
            parts = rel_path.split('/')
            category = parts[0] if len(parts) > 1 else ''
            date_str, year_str = extract_date(rel_path)
            title = normalize_title(f)
            if not (date_str or year_str):
                try:
                    mtime = os.path.getmtime(os.path.join(root, f))
                    year_str = str(datetime.datetime.fromtimestamp(mtime).year)
                except Exception:
                    year_str = None
            items.append({
                "file": rel_path,
                "title": title,
                "category": category or None,
                "year": int(year_str) if year_str else None,
                "date": date_str
            })
    return items

def build_manifest(docs_dir: str):
    docs = scan_docs(docs_dir)
    def sort_key(d):
        dt = d.get('date') or f"{d.get('year', 0)}-01-01"
        return (dt, d.get('title') or '')
    docs.sort(key=sort_key, reverse=True)
    return {"version": 1, "docs": docs}

def main():
    ap = argparse.ArgumentParser(description="Genera assets/docs/_docs.json (ricorsivo)")
    ap.add_argument('--root', default=os.getcwd())
    ap.add_argument('--docs', default='assets/docs')
    ap.add_argument('--out',  default=None, help="Percorso output (default: assets/docs/_docs.json)")
    ap.add_argument('--stdout', action='store_true', help="Stampa il JSON su stdout")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    docs_dir = os.path.join(root, args.docs)
    if not os.path.isdir(docs_dir):
        print(f"[ERRORE] Cartella non trovata: {docs_dir}", file=sys.stderr)
        return 2

    manifest = build_manifest(docs_dir)
    out_path = args.out or os.path.join(docs_dir, '_docs.json')

    if args.stdout:
        print(json.dumps(manifest, ensure_ascii=False, indent=2))
        return 0

    # prova a scrivere su file
    try:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        # se file esiste ed è readonly, prova a sbloccarlo
        if os.path.exists(out_path):
            try:
                os.chmod(out_path, 0o666)
            except Exception:
                pass
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        print(f"[OK] Scritto: {out_path} — documenti: {len(manifest['docs'])}")
    except PermissionError:
        print(f"[WARN] Permission denied su {out_path}. Usa --stdout e reindirizza in un file.", file=sys.stderr)
        print(json.dumps(manifest, ensure_ascii=False, indent=2))
        return 0
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
