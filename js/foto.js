const IMMAGINI = ["partita1.jpg","partita2.jpg","premiazione.jpg"];
const gal = document.getElementById('galleria');
gal.classList.add('gallery');
IMMAGINI.forEach(name => {
  const img = document.createElement('img');
  img.src = "../documenti/foto/" + name;
  img.alt = name;
  gal.appendChild(img);
});
