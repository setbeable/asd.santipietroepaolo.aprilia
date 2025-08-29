const INTERVISTE = [
  { titolo: "Intervista al Mister", url: "#" },
  { titolo: "Intervista al Capitano", url: "#" }
];
const iv = document.getElementById('interviste-list');
iv.innerHTML = "<h2>🎙️ Interviste</h2>";
INTERVISTE.forEach(i => {
  const a = document.createElement('a');
  a.href = i.url;
  a.target = '_blank';
  a.textContent = i.titolo;
  a.style.display = 'block';
  a.style.margin = '6px 0';
  iv.appendChild(a);
});
