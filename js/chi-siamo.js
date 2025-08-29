// Configura i dati qui:
const INFO = {
  descrizione: "ASD Santi Pietro e Paolo promuove sport e corsi per bambini e ragazzi. Progetti sociali e tornei amatoriali tutto l'anno.",
  email: "info@esempio.it",
  telefono: "+39 000 0000000",
  indirizzo: "Via Esempio 123, 00100 Roma (RM)",
  // Mappa: incolla un link Google Maps Embed (senza API key) oppure modifica la query
  mapsEmbed: "https://www.google.com/maps?q=Roma&output=embed"
};

// Render sezioni
document.getElementById("about").innerHTML = `
  <h2>La nostra missione</h2>
  <p>${INFO.descrizione}</p>
`;

document.getElementById("contatti").innerHTML = `
  <h2>Contatti</h2>
  <p><strong>Email:</strong> <a href="mailto:${INFO.email}">${INFO.email}</a></p>
  <p><strong>Telefono:</strong> <a href="tel:${INFO.telefono.replace(/\s/g,'')}">${INFO.telefono}</a></p>
  <p><strong>Indirizzo:</strong> ${INFO.indirizzo}</p>
`;

document.getElementById("mappa").innerHTML = `
  <h2>Dove siamo</h2>
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px">
    <iframe
      src="${INFO.mapsEmbed}"
      width="600" height="450" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%"
      allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>
`;
