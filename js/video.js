const VIDEO = [
  { titolo: "Highlights 1", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { titolo: "Highlights 2", url: "#" }
];
const list = document.getElementById('video-list');
list.innerHTML = "<h2>🎬 Video</h2>";
VIDEO.forEach(v => {
  const a = document.createElement('a');
  a.href = v.url;
  a.target = '_blank';
  a.textContent = v.titolo;
  a.style.display = 'block';
  a.style.margin = '6px 0';
  list.appendChild(a);
});
