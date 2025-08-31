
(function(){
  const zoomWrap=document.getElementById('radial-zoom');
  const wrap=document.getElementById('radial');
  const container=document.getElementById('radial-nav');
  const resetBtn=document.getElementById('reset');
  const lockBtn=document.getElementById('lock');
  const sourceMenu=document.getElementById('mobile'); // we clone buttons from here
  if(!zoomWrap||!wrap||!container||!sourceMenu) return;

  const INNER_R=33, OUTER_R=46;
  const STORAGE_KEY='radial_layout_upgrade';
  const LOCK_KEY='radial_locked_upgrade';

  const order=[
    {href:'pages/newsletter.html', ring:'outer', angle:-90},
    {href:'pages/hub.html', ring:'inner', angle:-90},
    {href:'pages/regolamento.html', ring:'inner', angle:-140},
    {href:'pages/orari.html', ring:'inner', angle:-40},
    {href:'pages/interviste.html', ring:'outer', angle:-165},
    {href:'pages/sponsor.html', ring:'outer', angle:-15},
    {href:'pages/campionati.html', ring:'outer', angle:170},
    {href:'pages/documenti.html', ring:'outer', angle:10},
    {href:'pages/video.html', ring:'outer', angle:215},
    {href:'pages/comunicati.html', ring:'outer', angle:145},
    {href:'pages/chi-siamo.html', ring:'inner', angle:210},
    {href:'pages/calendario.html', ring:'inner', angle:150},
    {href:'pages/contatti.html', ring:'inner', angle:260},
    {href:'pages/foto.html', ring:'inner', angle:290}
  ];

  function polar(ring, angle){
    const r = ring==='inner'?INNER_R:OUTER_R; const rad = angle*Math.PI/180;
    return { left:(50+r*Math.cos(rad))+'%', top:(50+r*Math.sin(rad))+'%' };
  }

  function findBtn(href){
    return Array.from(sourceMenu.querySelectorAll('a.btn')).find(a=>a.getAttribute('href')===href);
  }

  function add(item, idx){
    const src = findBtn(item.href);
    const node = src ? src.cloneNode(true) : (function(){ const a=document.createElement('a'); a.className='btn'; a.href=item.href; a.textContent=item.href; return a; })();
    const div = document.createElement('div');
    div.className='radial-item appear d'+(1+idx%10);
    const id=(item.href).replace(/\W+/g,'_');
    div.dataset.id=id; div.dataset.ring=item.ring; div.dataset.angle=item.angle;
    const pos=polar(item.ring,item.angle); div.style.left=pos.left; div.style.top=pos.top;
    div.appendChild(node); container.appendChild(div); return div;
  }

  order.forEach((it,i)=>add(it,i));

  // Apply saved
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
  Array.from(container.children).forEach(el=>{
    const s = saved[el.dataset.id];
    if(s){ el.style.left=s.left; el.style.top=s.top; el.dataset.angle=s.angle; el.style.opacity=1; el.classList.remove('appear'); }
  });

  // Drag to move along ring
  let dragging=null; const locked=localStorage.getItem(LOCK_KEY)==='1';
  function center(){ const r=wrap.getBoundingClientRect(); return {cx:r.left+r.width/2, cy:r.top+r.height/2}; }
  function setAngle(el, angle){ const pos=polar(el.dataset.ring, angle); el.style.left=pos.left; el.style.top=pos.top; el.dataset.angle=angle; }
  function onDown(e){ if(locked) return; dragging=e.currentTarget; dragging.style.cursor='grabbing'; dragging.setPointerCapture?.(e.pointerId||0); }
  function onMove(e){ if(!dragging||locked) return; const {cx,cy}=center(); const angle=Math.atan2(e.clientY-cy, e.clientX-cx)*180/Math.PI; setAngle(dragging, angle); }
  function onUp(e){ if(!dragging) return; const id=dragging.dataset.id; const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); data[id]={left:dragging.style.left, top:dragging.style.top, angle:dragging.dataset.angle}; localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); dragging.style.cursor='grab'; dragging.releasePointerCapture?.(e.pointerId||0); dragging=null; }
  Array.from(container.children).forEach(el=>{ el.style.cursor=locked?'default':'grab'; el.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); });

  // Zoom
  let scale=1; const min=.65, max=1.5;
  zoomWrap.addEventListener('wheel', function(e){ if(!e.ctrlKey) return; e.preventDefault(); const delta=-Math.sign(e.deltaY)*0.05; scale=Math.min(max, Math.max(min, scale+delta)); zoomWrap.style.transform='scale('+scale.toFixed(2)+')'; }, {passive:false});

  // Controls
  if(resetBtn) resetBtn.addEventListener('click', ()=>{ localStorage.removeItem(STORAGE_KEY); location.reload(); });
  if(lockBtn){ lockBtn.textContent=locked?'🔒 Layout bloccato (clic per sbloccare)':'🔓 Blocca layout'; lockBtn.addEventListener('click', ()=>{ if(localStorage.getItem(LOCK_KEY)==='1') localStorage.removeItem(LOCK_KEY); else localStorage.setItem(LOCK_KEY,'1'); location.reload(); }); }
})();