
(function(){
  const zoomWrap = document.getElementById('radial-zoom');
  const wrap = document.getElementById('radial');
  const container = document.getElementById('radial-nav');
  const menu = document.querySelector('nav.menu');
  const resetBtn = document.getElementById('reset-layout');
  if(!wrap || !container || !menu) return;

  // ----- Build two rings from menu (same as before) -----
  const innerHrefs = [
    'pages/hub.html','pages/orari.html','pages/documenti.html','pages/campionati.html',
    'pages/regolamento.html','pages/calendario.html','pages/contatti.html','pages/chi-siamo.html'
  ];
  const all = Array.from(menu.querySelectorAll('a.btn')).filter(a => !a.classList.contains('cta') && !a.classList.contains('alt'));
  const inner = [], outer = [];
  all.forEach(a => (innerHrefs.includes(a.getAttribute('href')) ? inner : outer).push(a));

  function placeRing(links, radiusPercent, startDeg){
    const N = links.length, full=360;
    links.forEach((a,i)=>{
      const angle = startDeg + (full/N)*i;
      const rad = angle*Math.PI/180;
      const x = 50 + radiusPercent*Math.cos(rad);
      const y = 50 + radiusPercent*Math.sin(rad);
      const item = document.createElement('div');
      item.className = 'radial-item appear delay-'+(i%10);
      const node = a.cloneNode(true);
      const id = (node.getAttribute('href')||node.textContent).replace(/\W+/g,'_');
      item.dataset.id = id;
      item.style.left = x+'%';
      item.style.top = y+'%';
      item.appendChild(node);
      container.appendChild(item);
    });
  }
  placeRing(inner, 33, -90);
  placeRing(outer, 46, -90);

  // ----- Persisted positions (localStorage) -----
  const KEY = 'radial_layout_v1';
  function loadLayout(){
    try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; }
  }
  function saveLayout(data){
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  const layout = loadLayout();
  // Apply saved positions
  Array.from(container.children).forEach(el=>{
    const id = el.dataset.id;
    if(layout[id]){
      el.style.left = layout[id].left;
      el.style.top  = layout[id].top;
      el.classList.remove('appear');
      el.style.opacity = 1;
    }
  });

  // ----- Draggable items -----
  let dragging=null, startX=0, startY=0;
  function onPointerDown(e){
    const item = e.currentTarget;
    dragging = item;
    startX = e.clientX; startY = e.clientY;
    item.setPointerCapture?.(e.pointerId||0);
  }
  function onPointerMove(e){
    if(!dragging) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // Clamp a bit inside the container
    const cx = Math.max(4, Math.min(96, x));
    const cy = Math.max(4, Math.min(96, y));
    dragging.style.left = cx + '%';
    dragging.style.top  = cy + '%';
  }
  function onPointerUp(e){
    if(!dragging) return;
    const id = dragging.dataset.id;
    const left = dragging.style.left, top = dragging.style.top;
    const data = loadLayout(); data[id] = {left, top}; saveLayout(data);
    dragging.releasePointerCapture?.(e.pointerId||0);
    dragging = null;
  }
  Array.from(container.children).forEach(el=>{
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  });

  // ----- Wheel zoom -----
  let scale = 1;
  const minScale = 0.65, maxScale = 1.5;
  (zoomWrap||wrap).addEventListener('wheel', function(e){
    if(!e.ctrlKey){ // plain scroll = zoom; if you prefer require Ctrl, change this condition
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 0.05;
      scale = Math.min(maxScale, Math.max(minScale, scale + delta));
      (zoomWrap||wrap).style.transform = 'scale(' + scale.toFixed(2) + ')';
    }
  }, {passive:false});

  // ----- Reset layout button -----
  if(resetBtn){
    resetBtn.addEventListener('click', function(){
      localStorage.removeItem(KEY);
      window.location.reload();
    });
  }
})();