#!/usr/bin/env python3
import os, json, re, datetime
from datetime import datetime, UTC   # ✅ import aggiornato

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
  name = re.sub(r'^\d{4}(-\d{2}-\d{2})?-', '', name)  # rimuovi prefisso data
  return name.replace('-', ' ').replace('_',' ').strip().capitalize()

# Raggruppa per basename
entries = {}

if os.path.isdir(BASE):
  for root, _, files in os.walk(BASE):
    relroot = os.path.normpath(root).replace('\\','/')
    files_set = set(files)

    for f in files:
      base, ext = os.path.splitext(f)
      key = f"{relroot}/{base}"

      if key not in entries:
        entries[key] = {"meta": None, "video": None, "cover": None}

      low = f.lower()

      # JSON meta
      if low.endswith('.json'):
        meta = load_json(os.path.join(root, f)) or {}
        def rel_or_abs(v):
          if not v: return v
          if re.match(r'^(https?:)?//', v) or v.startswith('data:'): return v
          return f"{relroot}/{v}"
        meta["video"]   = rel_or_abs(meta.get("video",""))
        meta["cover"]   = rel_or_abs(meta.get("cover",""))
        meta["article"] = rel_or_abs(meta.get("article",""))
        entries[key]["meta"] = meta

      elif low.endswith(VIDEO_EXT):
        entries[key]["video"] = f"{relroot}/{f}"

      elif low.endswith(COVER_EXT):
        entries[key]["cover"] = f"{relroot}/{f}"

# Costruisci lista finale
items = []
for key, e in entries.items():
  meta = e["meta"]
  if meta:
    items.append({
      "title":   meta.get("title") or safe_title(key),
      "date":    meta.get("date",""),
      "excerpt": meta.get("excerpt",""),
      "author":  meta.get("author",""),
      "link":    meta.get("link",""),
      "video":   meta.get("video",""),
      "cover":   meta.get("cover","") or e["cover"] or "",
      "article": meta.get("article",""),
      "tags":    meta.get("tags",[])
    })
  elif e["video"]:
    items.append({
      "title": safe_title(key),
      "date": "",
      "excerpt": "",
      "author": "",
      "link": "",
      "video": e["video"],
      "cover": e["cover"] or "",
      "article": "",
      "tags": []
    })

# Ordina per data desc poi titolo
def datekey(it):
  try:
    return datetime.strptime(it.get('date','1970-01-01'), '%Y-%m-%d')
  except:
    return datetime(1970,1,1)

items.sort(key=lambda x: (datekey(x), x.get('title','').lower()), reverse=True)

# ✅ Manifest corretto con campo "generated"
manifest = {
  "generated": datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ'),
  "count": len(items),
  "items": items
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
  json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Interviste manifest scritto: {OUT} ({len(items)} elementi)")
