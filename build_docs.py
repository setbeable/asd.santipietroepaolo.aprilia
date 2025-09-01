#!/usr/bin/env python3
# build_docs.py — genera assets/docs/_docs.json scansionando ricorsivamente assets/docs/**
# Uso:
#   cd <root del progetto>
#   python scripts/build_docs.py
# Opzioni:
#   --root <path>   (default: cwd)
#   --docs <path>   (default: assets/docs)

import argparse, json, os, re, sys, datetime

DOC_EXT = {
    # preview in modale: pdf + immagini
    '.pdf','.png','.jpg','.jpeg','.webp','.gif','.svg',
    # download diretto: office / testo / csv
    '.doc','.docx','.xls','.xlsx','.csv','.txt'
}
EXCLUDE_DIRS = {'.git','__MACOSX'}
MANIFEST_NAME = '_docs.json'

DATE_PATTERNS = [
    re.compile(r'(?P<y>\d{4})[-_./](?P<m>\d{2})[-_./](?P<d>\d{2})'),  # 2025-08-20 / 2025_08_20
    re.compile(r'(?P<d>\d{2})[-_./](?P<m>\d{2})[-_./](?P<y>\d{4})'),  # 20-08-2025
    re.compile(r'(?P<y>\d{4})(?P<m>\d{2})(?P<d>\d{2})'),              # 20250820
]

def is_doc(filename: str) -> bool:
    return os.path.splitext(filename)[1].lower() in DOC_EXT

def normalize_title(filename: str) -> str:
    name = os.path.splitext(os.path.basename(filename))[0]
    # rimuovi eventuale data iniziale (2025-08-20_ / 20-08-2025_ / 20250820-)
    for pat in DATE_PATTERNS:
        m = pat.match(name)
        if m:
            # taglia l'eventuale separatore successivo
            i = m.end()
            if i < len(name) and name[i] in ('-','_',' ','/','.'):
                i += 1
            name = name[i:]
            break
    # pulizia
    name = re.sub(r'[_\-]+', ' ', name).strip()
    # compatta spazi
    name = re.sub(r'\s{2,}', ' ', name)
    return name.title() if name else os.path.basename(filename)

def extract_date(s: str):
    # cerca la data in stringa; restituisce ('YYYY-MM-DD', 'YYYY') o (None, None)
    for pat in DATE_PATTERNS:
        m = pat.search(s)
        if m:
            y = int(m.group('y'))
            mth = int(m.group('m'))
            d = int(m.group('d'))
            try:
                dt = datetime.date(y, mth, d)
                return dt.isoformat(), str(y)
            except ValueError:
                continue
    # se non c'è una data completa, prova almeno l'anno a 4 cifre
    m = re.search(r'(20\d{2}|19\d{2})', s)
    if m:
        return None, m.group(1)
    return None, None

def scan_docs(docs_dir: str):
    items = []
    base = os.path.abspath(docs_dir)
    for root, dirs, files in os.walk(base):
        # escludi cartelle di sistema
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        rel_root = os.path.relpath(root, base).replace('\\', '/')
        for f in files:
            if f == MANIFEST_NAME:  # non includere il manifest
                continue
            if not is_doc(f):
                continue
            rel_path = (rel_root + '/' + f).lstrip('./').lstrip('/')
            rel_path = rel_path.replace('\\', '/')
            # categoria = prima parte del percorso (es. "comunicati/file.pdf")
            parts = rel_path.split('/')
            category = parts[0] if len(parts) > 1 else ''

            # deduzioni da path/nome
            date_str, year_str = extract_date(rel_path)
            title = normalize_title(f)

            # fallback su mtime se manca tutto
            if not (date_str or year_str):
                try:
                    mtime = os.path.getmtime(os.path.join(root, f))
                    dt = datetime.datetime.fromtimestamp(mtime)
                    year_str = str(dt.year)
                except Exception:
                    year_str = None

            items.append({
                "file": rel_path,               # es. "comunicati/2025-08-campionati.pdf"
                "title": title,                 # es. "Campionati"
                "category": category or None,   # es. "comunicati"
                "year": int(year_str) if year_str else None,
                "date": date_str                # "YYYY-MM-DD" oppure None
            })
    return items

def build_manifest(docs_dir: str):
    docs = scan_docs(docs_dir)
    # ordina: data (desc) -> titolo
    def sort_key(d):
        # date None va in fondo
        dt = d.get('date') or f"{d.get('year', 0)}-01-01"
        return (dt, d.get('title') or '')
    docs.sort(key=sort_key, reverse=True)
    return {"version": 1, "docs": docs}

def main():
    ap = argparse.ArgumentParser(description="Genera assets/docs/_docs.json (ricorsivo)")
    ap.add_argument('--root', default=os.getcwd())
    ap.add_argument('--docs', default='assets/docs')
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    docs_dir = os.path.join(root, args.docs)
    if not os.path.isdir(docs_dir):
        print(f"[ERRORE] Cartella non trovata: {docs_dir}", file=sys.stderr)
        return 2

    manifest = build_manifest(docs_dir)
    out_path = os.path.join(docs_dir, MANIFEST_NAME)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # output riepilogo
    cats = {}
    for d in manifest['docs']:
        c = (d.get('category') or '—')
        cats[c] = cats.get(c, 0) + 1
    print(f"[OK] Scritto: {out_path} — documenti: {len(manifest['docs'])}")
    for c, n in sorted(cats.items()):
        print(f"  - {c}: {n}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
