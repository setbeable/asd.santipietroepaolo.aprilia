(function(){

  // Non attivare il radiale su mobile/tablet
  if (window.matchMedia('(max-width: 900px)').matches) {
    const rz = document.getElementById('radial-zoom');
    const rt = document.querySelector('.radial-tools');
    if (rz) rz.style.display = 'none';
    if (rt) rt.style.display = 'none';
    return; // stop qui su mobile
  }

  const zoomWrap = document.getElementById('radial-zoom');
  const wrap = document.getElementById('radial');
  const container = document.getElementById('radial-nav');
  const menu = document.querySelector('nav.menu');
  if(!zoomWrap || !wrap || !container || !menu) return;

  const INNER_R = 33, OUTER_R = 46;
  const STORAGE_KEY = 'radial_layout_v3';
  const LOCK_KEY = 'radial_locked';

  const primary = [
    'pages/hub.html','pages/orari.html','pages/documenti.html','pages/campionati.html',
    'pages/regolamento.html','pages/calendario.html','pages/contatti.html','pages/chi-siamo.html'
  ];

  // Collect links (exclude CTAs)
  const all = Array.from(menu.querySelectorAll('a.btn')).filter(a => !a.classList.contains('cta') && !a.classList.contains('alt'));
  const inner = [], outer = [];
  all.forEach(a => (primary.includes(a.getAttribute('href')) ? inner : outer).push(a));

  function createItem(a, angle, ring){
    const rad = angle*Math.PI/180;
    const r = ring === 'inner' ? INNER_R : OUTER_R;
    const x = 50 + r*Math.cos(rad);
    const y = 50 + r*Math.sin(rad);
    const div = document.createElement('div');
    div.className = 'radial-item appear';
    const node = a.cloneNode(true);
    const id = (node.getAttribute('href')||node.textContent).replace(/\W+/g,'_');
    div.dataset.id = id; div.dataset.ring = ring; div.dataset.angle = angle.toFixed(2);
    div.style.left = x+'%'; div.style.top = y+'%';
    div.appendChild(node);
    container.appendChild(div);
    return div;
  }

  function distribute(links, ring, startDeg){
    const N = links.length; if(!N) return;
    const full=360;
    links.forEach((a,i)=>{ createItem(a, startDeg + (full/N)*i, ring).classList.add('delay-'+(i%10)); });
  }

  distribute(inner, 'inner', -90);
  distribute(outer, 'outer', -90);

  // Apply saved positions
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  Array.from(container.children).forEach(el=>{
    const s = saved[el.dataset.id];
    if(s){
      el.style.left = s.left; el.style.top = s.top; el.dataset.angle = s.angle || el.dataset.angle;
      el.classList.remove('appear'); el.style.opacity = 1;
    }
  });

  // Drag constrained to ring (angle only)
  let dragging = null;
  const locked = localStorage.getItem(LOCK_KEY) === '1';
  function getRect(){ return wrap.getBoundingClientRect(); }
  function pointerAngle(e, rect){
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    return Math.atan2(e.clientY - cy, e.clientX - cx) * 180/Math.PI;
  }
  function setByAngle(el, angle){
    const r = el.dataset.ring === 'inner' ? INNER_R : OUTER_R;
    const rad = angle*Math.PI/180;
    const x = 50 + r*Math.cos(rad), y = 50 + r*Math.sin(rad);
    el.style.left = x+'%'; el.style.top = y+'%'; el.dataset.angle = angle.toFixed(2);
  }
  function onDown(e){ if(locked) return; dragging = e.currentTarget; dragging.style.cursor='grabbing'; dragging.setPointerCapture?.(e.pointerId||0); }
  function onMove(e){ if(!dragging || locked) return; const a = pointerAngle(e, getRect()); setByAngle(dragging, a); }
  function onUp(e){
    if(!dragging) return;
    const id = dragging.dataset.id;
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    data[id] = {left: dragging.style.left, top: dragging.style.top, angle: dragging.dataset.angle};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    dragging.style.cursor='grab'; dragging.releasePointerCapture?.(e.pointerId||0); dragging=null;
  }
  Array.from(container.children).forEach(el=>{
    el.style.cursor = locked ? 'default' : 'grab';
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });

  // CTRL + wheel zoom
  let scale = 1; const minScale=.65, maxScale=1.5;
  zoomWrap.addEventListener('wheel', function(e){
    if(!e.ctrlKey) return;
    e.preventDefault();
    const delta = -Math.sign(e.deltaY)*0.05;
    scale = Math.min(maxScale, Math.max(minScale, scale + delta));
    zoomWrap.style.transform = 'scale(' + scale.toFixed(2) + ')';
  }, {passive:false});

  // Reset & Lock controls
  const resetBtn = document.getElementById('reset-layout');
  const lockBtn  = document.getElementById('lock-layout');
  if(resetBtn){
    resetBtn.addEventListener('click', function(){ localStorage.removeItem(STORAGE_KEY); window.location.reload(); });
  }
  if(lockBtn){
    const isLocked = locked;
    lockBtn.textContent = isLocked ? '🔒 Layout bloccato (clic per sbloccare)' : '🔓 Blocca layout';
    lockBtn.addEventListener('click', function(){
      const val = localStorage.getItem(LOCK_KEY)==='1';
      if(val) localStorage.removeItem(LOCK_KEY); else localStorage.setItem(LOCK_KEY,'1');
      window.location.reload();
    });
  }
})();
