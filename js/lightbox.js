(function(){
  const lb=document.getElementById('lightbox'); if(!lb) return;
  const img=lb.querySelector('#lb-img');
  const close=lb.querySelector('#lb-close');
  const prev=lb.querySelector('#lb-prev');
  const next=lb.querySelector('#lb-next');
  const thumbs=Array.from(document.querySelectorAll('#galleria a'));
  let idx=0;
  function openAt(i){ idx=(i+thumbs.length)%thumbs.length; img.src=thumbs[idx].href; lb.classList.add('open'); }
  function closeLb(){ lb.classList.remove('open'); }
  thumbs.forEach(a=>a.addEventListener('click', e=>{ e.preventDefault(); openAt(parseInt(a.dataset.index||0,10)); }));
  close.addEventListener('click', closeLb);
  lb.addEventListener('click', e=>{ if(e.target===lb) closeLb(); });
  prev.addEventListener('click', ()=>openAt(idx-1));
  next.addEventListener('click', ()=>openAt(idx+1));
  window.addEventListener('keydown', e=>{ if(!lb.classList.contains('open')) return; if(e.key==='Escape') closeLb(); if(e.key==='ArrowLeft') openAt(idx-1); if(e.key==='ArrowRight') openAt(idx+1); });
})();