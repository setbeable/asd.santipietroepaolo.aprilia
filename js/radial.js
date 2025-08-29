
(function(){
  const radial = document.getElementById('radial');
  const container = document.getElementById('radial-nav');
  const menu = document.querySelector('nav.menu');
  if(!radial || !container || !menu) return;

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
