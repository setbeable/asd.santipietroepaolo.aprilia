(function(){
  function initTabGroup(rootId){
    var root = document.getElementById(rootId);
    if(!root) return;
    var buttons = root.querySelectorAll('[role="tab"]');
    var panels  = root.querySelectorAll('[role="tabpanel"]');

    function activate(id){
      buttons.forEach(btn => {
        var sel = btn.getAttribute('data-target') === id;
        btn.setAttribute('aria-selected', sel ? 'true' : 'false');
      });
      panels.forEach(p => {
        var active = p.id === id;
        p.classList.toggle('active', active);
        if(active){
          var frame = p.querySelector('iframe[data-src]');
          if(frame && !frame.src){
            frame.src = frame.getAttribute('data-src');
          }
        }
      });
    }

    buttons.forEach(btn => btn.addEventListener('click', function(){ activate(btn.getAttribute('data-target')); }));
    if(buttons.length){ activate(buttons[0].getAttribute('data-target')); }
  }
  initTabGroup('tabs-media'); initTabGroup('tabs-calcio');
})();