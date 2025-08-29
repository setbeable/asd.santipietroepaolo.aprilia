// Elenco documenti pubblici
const DOCUMENTI = [
  { titolo: "Statuto ASD", file: "../documenti/statuto.pdf" },
  { titolo: "Modulo Iscrizione", file: "../documenti/iscrizione.pdf" },
  { titolo: "Verbale Assemblea", file: "../documenti/verbale.pdf" }
];

const list = document.getElementById("documenti-list");
DOCUMENTI.forEach(d => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = d.file;
  a.target = "_blank";
  a.textContent = "📄 " + d.titolo;
  li.appendChild(a);
  list.appendChild(li);
});
