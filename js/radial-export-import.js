(function(){
  const STORAGE_KEY='radial_layout_v3';
  const exp=document.getElementById('export-layout');
  const imp=document.getElementById('import-layout');
  if(exp){ exp.addEventListener('click', function(){ const data=localStorage.getItem(STORAGE_KEY)||"{}"; const blob=new Blob([data],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='layout-radiale.json'; document.body.appendChild(a); a.click(); a.remove(); });}
  if(imp){ imp.addEventListener('change', function(){ const f=imp.files[0]; if(!f) return; const r=new FileReader(); r.onload=function(){ try{ JSON.parse(r.result); localStorage.setItem(STORAGE_KEY, r.result); location.reload(); }catch(e){ alert('File non valido'); } }; r.readAsText(f); });}
})();