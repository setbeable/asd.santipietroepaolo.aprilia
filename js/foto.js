// Aggiungi i file reali in /documenti/foto e lista qui i nomi:
const IMMAGINI=["partita1.jpg","premiazione.jpg"];
const gal=document.getElementById('galleria'); if(gal){ IMMAGINI.forEach((n,i)=>{ const a=document.createElement('a'); a.href='../documenti/foto/'+n; const img=document.createElement('img'); img.src='../documenti/foto/'+n; img.alt=n; a.appendChild(img); gal.appendChild(a); }); }