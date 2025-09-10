import json, os, re, datetime, hashlib

BASE = os.path.join('assets', 'hub')
OUT = os.path.join('assets', '_hub.json')

def first_file(folder, exts):
    for name in sorted(os.listdir(folder)):
        if name.lower().split('.')[-1] in exts:
            return os.path.join(folder, name)
    return None

def load_text(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except:
        return None

def load_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None

def iso_date_from_slug(slug):
    # atteso: YYYY-MM-DD-qualcosa
    m = re.match(r'^(\d{4}-\d{2}-\d{2})-(.+)$', slug)
    if not m: 
        return None, slug
    return m.group(1), m.group(2).replace('-', ' ').strip().capitalize()

def file_sha1(path):
    h = hashlib.sha1()
    with open(path, 'rb') as f:
        while True:
            b = f.read(8192)
            if not b: break
            h.update(b)
    return h.hexdigest()[:12]

items = []
for cat in sorted(d for d in os.listdir(BASE) if os.path.isdir(os.path.join(BASE, d))):
    cat_dir = os.path.join(BASE, cat)
    for slug in sorted(d for d in os.listdir(cat_dir) if os.path.isdir(os.path.join(cat_dir, d))):
        folder = os.path.join(cat_dir, slug)
        date_str, guess_title = iso_date_from_slug(slug)
        meta = load_json(os.path.join(folder, 'meta.json')) or {}
        title = meta.get('title') or guess_title or slug.replace('-', ' ').capitalize()
        date = meta.get('date') or date_str
        tags = meta.get('tags') or []
        excerpt = meta.get('excerpt') or load_text(os.path.join(folder, 'descrizione.md'))
        link = meta.get('link') or load_text(os.path.join(folder, 'link.txt'))
        attach = meta.get('attach')  # opzionale percorso relativo
        if not attach:
            # primo file allegato “non cover/immagine/md/json/txt”
            for name in sorted(os.listdir(folder)):
                low = name.lower()
                if any(low.endswith(ext) for ext in ['.jpg','.jpeg','.png','.webp','.gif','.md','.json','.txt']):
                    continue
                attach = os.path.join('assets','hub',cat,slug,name)
                break

        cover_path = first_file(folder, {'jpg','jpeg','png','webp','gif'})
        cover = None
        if cover_path:
            rel = os.path.normpath(cover_path).replace('\\','/')
            # cache-busting con sha
            cover = f"{rel}?v={file_sha1(cover_path)}"

        item = {
            "title": title,
            "category": cat,
            "date": date,             # ISO YYYY-MM-DD
            "slug": slug,
            "cover": cover,           # relativo al sito
            "excerpt": (excerpt[:400] + '…') if excerpt and len(excerpt) > 400 else excerpt,
            "link": link,             # URL esterno (se presente)
            "attach": attach,         # file locale (se presente)
            "tags": tags
        }
        items.append(item)

# ordina per data desc
def keydate(i):
    try:
        return datetime.datetime.strptime(i.get('date','1970-01-01'), '%Y-%m-%d')
    except:
        return datetime.datetime(1970,1,1)

items.sort(key=keydate, reverse=True)

manifest = {
    "generated": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
    "count": len(items),
    "items": items
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Hub manifest scritto: {OUT} ({len(items)} elementi)")
