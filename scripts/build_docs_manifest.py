#!/usr/bin/env python3
import json, os, re, datetime

DOCS_BASE = os.path.join('assets', 'docs')
OUT = os.path.join('assets', '_docs.json')

def load_json(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None

def title_from_filename(fn):
    name = os.path.splitext(os.path.basename(fn))[0]
    # rimuove prefissi tipo YYYY-... o YYYY
    name = re.sub(r'^\d{4}(-\d{2}-\d{2})?-', '', name)
    return name.replace('-', ' ').replace('_',' ').strip().capitalize()

items = []

if os.path.isdir(DOCS_BASE):
    for root, _, files in os.walk(DOCS_BASE):
        relroot = os.path.normpath(root).replace('\\','/')
        for f in files:
            low = f.lower()
            if not any(low.endswith(ext) for ext in ('.pdf','.doc','.docx','.odt','.xls','.xlsx','.ppt','.pptx')):
                continue

            path = f"{relroot}/{f}"
            # category = prima sottocartella dopo assets/docs/
            m = re.match(r'^assets/docs/([^/]+)/', path)
            category = m.group(1) if m else ''

            # metadati facoltativi accanto al file (stesso nome .json)
            meta = load_json(os.path.join(root, os.path.splitext(f)[0] + '.json')) or {}

            title = meta.get('title') or title_from_filename(f)
            date  = meta.get('date')  or ''   # opzionale: YYYY-MM-DD
            excerpt = meta.get('excerpt') or ''
            link = meta.get('link') or ''     # opzionale: link esterno
            tags = meta.get('tags') or []

            items.append({
                "title": title,
                "category": meta.get('category') or category,
                "date": date,
                "excerpt": excerpt,
                "link": link,
                "attach": path,
                "tags": tags
            })

# ordina: data desc poi titolo
def keydate(i):
    try: return datetime.datetime.strptime(i.get('date','1970-01-01'), '%Y-%m-%d')
    except: return datetime.datetime(1970,1,1)

items.sort(key=lambda i: (keydate(i), i.get('title','').lower()))
items.reverse()

manifest = { "generated": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
             "count": len(items),
             "items": items }

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Docs manifest scritto: {OUT} ({len(items)} documenti)")
