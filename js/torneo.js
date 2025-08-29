const CLASSIFICHE = [
  { nome: "Classifica 2025", file: "../documenti/classifiche/classifica2025.pdf" },
];
const SQUADRE = [
  { nome: "Squadra A", file: "../documenti/squadre/squadraA.pdf" },
  { nome: "Squadra B", file: "../documenti/squadre/squadraB.pdf" },
  { nome: "Squadra C", file: "../documenti/squadre/squadraC.pdf" },
];
function renderLinks(list, containerId, title, icon){
  const cont = document.getElementById(containerId);
  cont.innerHTML = `<h2>${icon} ${title}</h2>`;
  list.forEach(el => {
    const a = document.createElement('a');
    a.href = el.file;
    a.target = '_blank';
    a.textContent = el.nome;
    a.style.display = 'block';
    a.style.margin = '6px 0';
    cont.appendChild(a);
  });
}
renderLinks(CLASSIFICHE, 'classifiche', 'Classifiche', '📊');
renderLinks(SQUADRE, 'squadre', 'Squadre', '⚽');
