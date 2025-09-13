#!/usr/bin/env python3
import os, json, re, datetime

BASE = os.path.join('assets', 'interviste')
OUT  = os.path.join('assets', '_interviste.json')

VIDEO_EXT = ('.mp4', '.webm', '.ogv')
COVER_EXT = ('.jpg', '.jpeg', '.png', '.webp')

def load_json(path):
  try:
    with open(path, 'r', encoding='utf-8') as f:
      return json.load(f)
  except:
    return None

def safe_title(name):
  name = os.path.splitext(os.path.basename(name))[0]
  name = re.sub(r'^\d{4}(-\d{2}-\d{2})?-', '', name)  # rimuovi prefissi data
  return name.replace('-', ' ').replace('_',' ').strip().capitalize()

items = []

if os.path.isdir(BASE):
  for root, _, files in os.walk(BASE):
    relroot = os.path.normpath(root).replace('\\','/')
    # indicizza file della cartella
    files_set = set(files)
    for f in files:
      low = f.lower()
      # considera la presenza di un JSON di metadati collo stesso "nome base"
      base_noext = os.path.splitext(f)[0]
      meta_path = os.path.join(root, base_noext + '.json')
      meta = load_json(meta_path) if os.path.exists(meta_path) else {}

      # raccogli solo una volta per "base", preferendo il JSON se presente
      # se stai analizzando un .json lo tratti qui, altrimenti se è video senza json costruisci minima scheda
      if low.endswith('.json'):
        # l'item viene dal JSON – costruisci percorso relativi
        title   = meta.get('title') or safe_title(base_noext)
        date    = meta.get('date','')
        excerpt = meta.get('excerpt','')
        author  = meta.get('author','')
        link    = meta.get('link','')
        video   = meta.get('video','')   # es: 2025-03-mister-rossi.mp4
        cover   = meta.get('cover','')   # es: 2025-03-mister-rossi.jpg
        article = meta.get('article','') # es: 2025-03-mister-rossi.pdf/html
        tags    = meta.get('tags',[])

        # risolvi cover/video se sono file locali nella stessa cartella
        if video and not re.match(r'^(https?:)?//', video):
          vid_path = f"{relroot}/{video}"
        else:
          vid_path = video

        if cover and not re.match(r'^(https?:)?//', cover):
          cov_path = f"{relroot}/{cover}"
        else:
          cov_path = cover

        if article and not re.match(r'^(https?:)?//', article):
          art_path = f"{relroot}/{article}"
        else:
          art_path = article

        items.append({
          "title": title, "date": date, "excerpt": excerpt, "author": author,
          "link": link, "video": vid_path, "cover": cov_path, "article": art_path,
          "tags": tags
        })

      elif low.endswith(VIDEO_EXT):
        # video senza json al seguito → scheda minima
        title = safe_title(f)
        video_path = f"{relroot}/{f}"
        # cerca cover con stesso base
        cov = ''
        for ext in COVER_EXT:
          cf = base_noext + ext
          if cf in files_set:
            cov = f"{relroot}/{cf}"
            break

        items.append({
          "title": title, "date": "", "excerpt": "", "author": "",
          "link": "", "video": video_path, "cover": cov, "article": "",
          "tags": []
        })

# ordina per data desc poi titolo
def datekey(it):
  try: return datetime.datetime.strptime(it.get('date','1970-01-01'), '%Y-%m-%d')
  except: return datetime.datetime(1970,1,1)

items.sort(key=lambda x: (datekey(x), x.get('title','').lower()), reverse=True)

manifest = {
  "generated": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
  "count": len(items),
  "items": items
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
  json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Interviste manifest scritto: {OUT} ({len(items)} elementi)")
