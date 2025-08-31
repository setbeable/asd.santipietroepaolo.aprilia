(function(){
const lb=document.getElementById('lightbox'); if(!lb) return;
const img=lb.querySelector('#lb-img'), prev=lb.querySelector('#lb-prev'), next=lb.querySelector('#lb-next'), close=lb.querySelector('#lb-close');
const thumbs=[...document.querySelectorAll('#galleria a')]; let idx=0;
function openAt(i){ idx=(i+thumbs.length)%thumbs.length; img.src=thumbs[idx].href; lb.classList.add('open'); }
thumbs.forEach((a,i)=>a.addEventListener('click',e=>{e.preventDefault();openAt(i);}));
[prev,next].forEach((el,delta)=>el.addEventListener('click',()=>openAt(idx+(delta?1:-1))));
close.addEventListener('click',()=>lb.classList.remove('open'));
lb.addEventListener('click',e=>{ if(e.target===lb) lb.classList.remove('open'); });
window.addEventListener('keydown',e=>{ if(!lb.classList.contains('open')) return; if(e.key==='Escape') lb.classList.remove('open'); if(e.key==='ArrowLeft') openAt(idx-1); if(e.key==='ArrowRight') openAt(idx+1); });
})();