// Elenca qui i PDF caricati in /documenti (no foto)
const PDFS=[ /* "regolamento.pdf","modulo_iscrizione.pdf" */ ];
const ul=document.getElementById('doc-list');
if(ul){ if(PDFS.length===0){ ul.innerHTML='<li>Nessun documento. Aggiungi i PDF in /documenti e inseriscili in js/documenti.js</li>'; } else { PDFS.forEach(n=>{ const li=document.createElement('li'); const a=document.createElement('a'); a.href='../documenti/'+n; a.textContent=n; a.target='_blank'; li.appendChild(a); ul.appendChild(li); }); } }