
(function(){
  const zoomWrap=document.getElementById('radial-zoom');
  const wrap=document.getElementById('radial');
  const container=document.getElementById('radial-nav');
  const INNER_R=33, OUTER_R=46;
  const links=[
    {href:'pages/documenti.html',label:'Documenti'},
    {href:'pages/orari.html',label:'Orari'},
    {href:'pages/iscrizioni.html',label:'Iscrizioni'}
  ];
  function create(angle,ring,item){
    const rad=angle*Math.PI/180;const r=ring==='inner'?INNER_R:OUTER_R;
    const x=50+r*Math.cos(rad), y=50+r*Math.sin(rad);
    const div=document.createElement('div');div.className='radial-item';
    div.style.left=x+'%';div.style.top=y+'%';
    const a=document.createElement('a');a.textContent=item.label;a.href=item.href;a.className='reset-layout';
    div.appendChild(a);container.appendChild(div);
  }
  links.forEach((it,i)=>create(-90+i*120,'outer',it));

  // zoom ctrl+wheel
  let scale=1;zoomWrap.addEventListener('wheel',e=>{
    if(!e.ctrlKey) return; e.preventDefault();
    scale=Math.max(.6,Math.min(1.6,scale-(Math.sign(e.deltaY))*0.05));
    var _oy=parseInt(localStorage.getItem('radial_offset_y')||'0',10);
    zoomWrap.style.transform='scale('+scale.toFixed(2)+') translateY('+_oy+'px)';
  },{passive:false});

  // offset slider
  const range=document.getElementById('offsetY-range');const out=document.getElementById('offsetY-val');
  function apply(v){zoomWrap.style.transform='scale('+scale+') translateY('+v+'px)';}
  let val=parseInt(localStorage.getItem('radial_offset_y')||'0',10);apply(val);
  if(range){range.value=val;out.textContent=val;
    range.addEventListener('input',()=>{val=parseInt(range.value,10);apply(val);out.textContent=val;});
    range.addEventListener('change',()=>{localStorage.setItem('radial_offset_y',val);});
  }
})();
