
(function(){
  const radial = document.getElementById('radial');
  const container = document.getElementById('radial-nav');
  const menu = document.querySelector('nav.menu');
  if(!radial || !container || !menu) return;

<<<<<<< HEAD
  // ----- Build two rings from menu -----
  const innerHrefs = [
    'pages/hub.html','pages/orari.html','pages/documenti.html','pages/campionati.html',
    'pages/regolamento.html','pages/calendario.html','pages/contatti.html','pages/chi-siamo.html'
  ];
  const all = Array.from(menu.querySelectorAll('a.btn')).filter(a => !a.classList.contains('cta') && !a.classList.contains('alt'));
  const inner = [], outer = [];
  all.forEach(a => (innerHrefs.includes(a.getAttribute('href')) ? inner : outer).push(a));

  function placeRing(links, radiusPercent, startDeg, ringName){
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
      item.dataset.ring = ringName;
      item.dataset.angle = angle.toFixed(2); // store angle for constrained dragging
      item.style.left = x+'%';
      item.style.top = y+'%';
      item.appendChild(node);
      container.appendChild(item);
    });
  }
  const INNER_R = 33, OUTER_R = 46;
  placeRing(inner, INNER_R, -90, 'inner');
  placeRing(outer, OUTER_R, -90, 'outer');

  // ----- Persisted positions (localStorage) -----
  const KEY = 'radial_layout_v2';
  const KEY_LOCK = 'radial_locked';
  function load(k){ try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch(e){ return {}; } }
  function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  const layout = load(KEY);
  const locked = localStorage.getItem(KEY_LOCK)==='1';

  // Apply saved positions
  Array.from(container.children).forEach(el=>{
    const id = el.dataset.id;
    if(layout[id]){
      el.style.left = layout[id].left;
      el.style.top  = layout[id].top;
      el.dataset.angle = layout[id].angle || el.dataset.angle;
      el.classList.remove('appear');
      el.style.opacity = 1;
    }
  });

  // ----- Draggable items constrained to ring -----
  let dragging=null;
  function getCenterRect(){ return wrap.getBoundingClientRect(); }
  function pointerToAngle(e, rect){
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let angle = Math.atan2(dy, dx) * 180/Math.PI; // -180..180 from +X
    // convert to CSS polar where 0deg points right; we want -90 at top, so ok after using cos/sin
    return angle;
  }
  function setByAngle(el, angle){
    const r = (el.dataset.ring==='inner') ? INNER_R : OUTER_R;
    const rad = angle*Math.PI/180;
    const x = 50 + r*Math.cos(rad);
    const y = 50 + r*Math.sin(rad);
    el.style.left = x+'%';
    el.style.top = y+'%';
    el.dataset.angle = angle.toFixed(2);
  }
  function onPointerDown(e){
    if(locked) return;
    dragging = e.currentTarget;
    dragging.style.cursor = 'grabbing';
    dragging.setPointerCapture?.(e.pointerId||0);
  }
  function onPointerMove(e){
    if(!dragging || locked) return;
    const rect = getCenterRect();
    const ang = pointerToAngle(e, rect);
    setByAngle(dragging, ang);
  }
  function onPointerUp(e){
    if(!dragging) return;
    const id = dragging.dataset.id;
    const data = load(KEY);
    data[id] = {left: dragging.style.left, top: dragging.style.top, angle: dragging.dataset.angle};
    save(KEY, data);
    dragging.style.cursor = 'grab';
    dragging.releasePointerCapture?.(e.pointerId||0);
    dragging = null;
  }
  Array.from(container.children).forEach(el=>{
    el.style.cursor = locked ? 'default' : 'grab';
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  });

  // ----- Wheel zoom (CTRL + wheel only) -----
  let scale = 1; const minScale = 0.65, maxScale = 1.5;
  (document.getElementById('radial-zoom')||wrap).addEventListener('wheel', function(e){
    if(!e.ctrlKey) return; // only with CTRL
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.05;
    scale = Math.min(maxScale, Math.max(minScale, scale + delta));
    (document.getElementById('radial-zoom')||wrap).style.transform = 'scale(' + scale.toFixed(2) + ')';
  }, {passive:false});

  // ----- Reset + Lock buttons -----
  const resetBtn = document.getElementById('reset-layout');
  const lockBtn = document.createElement('button');
  lockBtn.className = 'reset-layout'; // reuse style
  lockBtn.id = 'lock-layout';
  lockBtn.textContent = locked ? '🔒 Layout bloccato (clic per sbloccare)' : '🔓 Blocca layout';
  const radialParent = document.getElementById('radial-zoom')?.parentElement || wrap.parentElement;
  radialParent.insertBefore(lockBtn, radialParent.querySelector('nav.menu'));

  if(resetBtn){
    resetBtn.addEventListener('click', function(){
      localStorage.removeItem(KEY);
      window.location.reload();
    });
  }
  lockBtn.addEventListener('click', function(){
    const isLocked = localStorage.getItem(KEY_LOCK)==='1';
    if(isLocked){ localStorage.removeItem(KEY_LOCK); }
    else{ localStorage.setItem(KEY_LOCK, '1'); }
    window.location.reload();
  });
})();
=======
  // Collect links from the fallback menu (skip CTAs at the bottom)
  const links = Array.from(menu.querySelectorAll('a.btn')).filter(a => !a.classList.contains('cta') && !a.classList.contains('alt'));
  // Angles: spread them evenly around the circle (leave a small gap at bottom for CTAs)
  const N = links.length;
  const startDeg = -90; // start at top
  const fullCircle = 360;
  links.forEach((a, i) => {
    const angle = startDeg + (fullCircle / N) * i;
    const rad = angle * Math.PI / 180;
    const R = 46; // radius as % of container
    const x = 50 + R * Math.cos(rad);
    const y = 50 + R * Math.sin(rad);
    // clone as radial item
    const item = document.createElement('div');
    item.className = 'radial-item';
    const node = a.cloneNode(true);
    item.style.left = x + '%';
    item.style.top = y + '%';
    item.appendChild(node);
    container.appendChild(item);
  });
})();
>>>>>>> parent of 68b64fb (radial e scroll test 13)
