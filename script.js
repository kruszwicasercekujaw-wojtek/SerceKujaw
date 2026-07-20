/* ============================================================
   DODAWANIE FILMÓW
   Skopiuj obiekt poniżej i wklej nowy wiersz do tablicy VIDEOS.
   - title: tytuł filmu
   - url: pełny link (YouTube, TikTok, Instagram...)
   - description: krótki opis
   - date: np. "Lipiec 2026" (opcjonalne, może być puste "")
   ============================================================ */
const VIDEOS = [
  {
    title: "Mysia Wieża o świcie",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Kruszwica zanim obudzi się miasto — mgła nad Gopłem i widok z wieży Popiela.",
    date: "Czerwiec 2026"
  },
  {
    title: "Legenda o Popielu i myszach",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Skąd wzięła się nazwa Mysiej Wieży? Opowiadam legendę, która trzyma się miasta od wieków.",
    date: "Maj 2026"
  },
  {
    title: "Spacer nabrzeżem Gopła",
    url: "https://www.tiktok.com/@example/video/1234567890",
    description: "Kruszwica z innej strony — nabrzeże, rybacy i wieczorne światło nad jeziorem.",
    date: "Kwiecień 2026"
  }
];

/* ============================================================
   DANE KONTAKTOWE — edytuj linki poniżej
   ============================================================ */
const CONTACT_LINKS = [
  { label: "Facebook", url: "https://facebook.com" },
  { label: "YouTube", url: "https://youtube.com" },
  { label: "TikTok", url: "https://tiktok.com" },
  { label: "E-mail", url: "mailto:kontakt@sercekujaw.pl" }
];

/* ---------- pomocnicze ---------- */
function getYouTubeId(url){
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function heartPlayIcon(){
  return `<svg viewBox="0 0 64 64" fill="none">
    <path d="M32 55 C10 40 2 27 2 16 C2 6 9 0 17 0 C23 0 28 3 32 9 C36 3 41 0 47 0 C55 0 62 6 62 16 C62 27 54 40 32 55 Z" fill="currentColor" opacity="0.92"/>
    <path d="M26 22 L26 42 L44 32 Z" fill="#0a0a09"/>
  </svg>`;
}

function buildCard(video){
  const ytId = getYouTubeId(video.url);
  const thumbSrc = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  const thumbHTML = thumbSrc
    ? `<img src="${thumbSrc}" alt="${escapeHtml(video.title)}" loading="lazy">`
    : "";

  return `
  <a class="film-card" href="${video.url}" target="_blank" rel="noopener noreferrer">
    <div class="film-thumb">
      ${thumbHTML}
      <div class="play-heart">${heartPlayIcon()}</div>
    </div>
    <div class="film-body">
      ${video.date ? `<span class="film-date">${escapeHtml(video.date)}</span>` : ""}
      <h3 class="film-title">${escapeHtml(video.title)}</h3>
      <p class="film-desc">${escapeHtml(video.description)}</p>
      <span class="film-link">Obejrzyj</span>
    </div>
  </a>`;
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function render(){
  const grid = document.getElementById("filmGrid");
  const empty = document.getElementById("emptyState");

  if (!VIDEOS.length){
    grid.style.display = "none";
    empty.hidden = false;
    return;
  }

  grid.innerHTML = VIDEOS.map(buildCard).join("");

  const contactWrap = document.getElementById("contactLinks");
  contactWrap.innerHTML = CONTACT_LINKS.map(
    l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)}</a>`
  ).join("");

  document.getElementById("year").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", render);
