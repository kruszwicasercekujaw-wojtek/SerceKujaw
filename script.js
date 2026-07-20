/* ============================================================
   DODAWANIE FILMÓW
   Skopiuj obiekt poniżej i wklej nowy wiersz do tablicy VIDEOS.
   - title: tytuł filmu
   - url: pełny link (YouTube, Facebook, TikTok, Instagram...)
   - description: krótki opis
   - date: np. "Lipiec 2026" (opcjonalne, może być puste "")
   ============================================================ */
const VIDEOS = [
  {
    title: "GOPLANA 2026 - Kruszwica",
    url: "https://www.youtube.com/watch?v=wr0AVF9Cnzo",
    description: "🎥 Goplana 2026 już za nami, ale wspomnienia wciąż pozostają żywe. ✨",
    date: "Lipiec 2026"
  },
  {
    title: "Zapowiedź Festynu Dla Nadii",
    url: "https://www.tiktok.com/@.younior/video/7654885805390892321",
    description: "❤️ 𝗗𝗟𝗔 NADII. 𝗗𝗟𝗔 NADZIEI. 𝗗𝗟𝗔 PRZYSZŁOŚCI. ❤️",
    date: "Czerwiec 2026"
  },
  {
    title: "Średniowieczna „Agnes” zwodowana na Gople",
    url: "https://www.youtube.com/watch?v=Wn0EIC-MuXc",
    description: "Kruszwica z innej strony! Zabieram Was w wyjątkową podróż w czasie.",
    date: "Maj 2026"
  },
  {
    title: "Kujawskie Nowalijki 2026",
    url: "https://www.facebook.com/reel/3074858836040893",
    description: "🌿 Smaki, tradycja, muzyka i wyjątkowa atmosfera.",
    date: "Czerwiec 2026"
  }
];

/* ============================================================
   DANE KONTAKTOWE
   ============================================================ */
const CONTACT_LINKS = [
  { label: "Facebook", url: "https://www.facebook.com/KruszwicaSerceKujaw" },
  { label: "YouTube", url: "https://www.youtube.com/@Kruszwica-SerceKujaw" },
  { label: "TikTok", url: "https://www.tiktok.com/@.younior" },
  { label: "E-mail", url: "mailto:kruszwicasercekujaw@gmail.com" }
];

/* ---------- pomocnicze ---------- */
function getYouTubeId(url){
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getFacebookUrl(url) {
  const isFb = url.includes("facebook.com") || url.includes("fb.watch") || url.includes("fb.com");
  return isFb ? encodeURIComponent(url) : null;
}

function heartPlayIcon(){
  return `<svg viewBox="0 0 64 64" fill="none">
    <path d="M32 55 C10 40 2 27 2 16 C2 6 9 0 17 0 C23 0 28 3 32 9 C36 3 41 0 47 0 C55 0 62 6 62 16 C62 27 54 40 32 55 Z" fill="currentColor" opacity="0.92"/>
    <path d="M26 22 L26 42 L44 32 Z" fill="#0a0a09"/>
  </svg>`;
}

function buildCard(video, index){
  const ytId = getYouTubeId(video.url);
  const thumbSrc = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

  const thumbHTML = thumbSrc
    ? `<img src="${thumbSrc}" alt="${escapeHtml(video.title)}" loading="lazy">`
    : "";

  return `
  <div class="film-card" data-index="${index}" style="cursor: pointer;">
    <div class="film-thumb">
      ${thumbHTML}
      <div class="play-heart">${heartPlayIcon()}</div>
    </div>
    <div class="film-body">
      ${video.date ? `<span class="film-date">${escapeHtml(video.date)}</span>` : ""}
      <h3 class="film-title">${escapeHtml(video.title)}</h3>
      <p class="film-desc">${escapeHtml(video.description)}</p>
      <span class="film-link">Odtwórz na stronie</span>
    </div>
  </div>`;
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- ODTWARZACZ MODALNY (POP-UP) ---------- */
function setupModal() {
  const modalHTML = `
    <div class="video-modal" id="videoModal" aria-hidden="true">
      <div class="video-modal-overlay" id="modalOverlay"></div>
      <div class="video-modal-content">
        <button class="video-modal-close" id="modalClose" aria-label="Zamknij">&times;</button>
        <div class="video-modal-body" id="modalBody"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("videoModal");
  const modalBody = document.getElementById("modalBody");
  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.getElementById("modalClose");

  function openModal(videoIndex) {
    const video = VIDEOS[videoIndex];
    if (!video) return;

    const ytId = getYouTubeId(video.url);
    const fbUrl = getFacebookUrl(video.url);

    if (ytId) {
      // YouTube Embed
      modalBody.innerHTML = `
        <div class="video-responsive">
          <iframe 
            src="https://www.youtube.com/embed/${ytId}?autoplay=1" 
            title="${escapeHtml(video.title)}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
        <h3 class="modal-title">${escapeHtml(video.title)}</h3>
        <p class="modal-desc">${escapeHtml(video.description)}</p>
      `;
    } else if (fbUrl) {
      // Wykrywamy czy to Rolka (Facebook Reel)
      const isReel = video.url.includes("/reel/");
      const pluginType = isReel ? "post.php" : "video.php";

      // Facebook Embed
      modalBody.innerHTML = `
        <div class="video-responsive">
          <iframe 
            src="https://www.facebook.com/plugins/${pluginType}?href=${fbUrl}&show_text=false&autoplay=true" 
            width="100%" 
            height="100%" 
            style="border:none;overflow:hidden" 
            scrolling="no" 
            frameborder="0" 
            allowfullscreen="true" 
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share">
          </iframe>
        </div>
        <h3 class="modal-title">${escapeHtml(video.title)}</h3>
        <p class="modal-desc">${escapeHtml(video.description)}</p>
        <p style="text-align: center; margin-top: 10px; font-size: 0.85rem; color: var(--dim);">
          Nie ładuje się? 
          <a href="${video.url}" target="_blank" rel="noopener noreferrer" style="color: var(--gold); text-decoration: underline;">
            Otwórz bezpośrednio na Facebooku ↗
          </a>
        </p>
      `;
    } else {
      // Dla TikTok / Instagram / Inne
      modalBody.innerHTML = `
        <div class="modal-external-notice">
          <h3 class="modal-title">${escapeHtml(video.title)}</h3>
          <p class="modal-desc">${escapeHtml(video.description)}</p>
          <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="margin-top: 15px;">
            Otwórz materiał na TikToku / Instagramie ↗
          </a>
        </div>
      `;
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalBody.innerHTML = ""; // Czyszczenie iframe zatrzymuje dźwięk
    document.body.style.overflow = "";
  }

  overlay.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });

  document.getElementById("filmGrid").addEventListener("click", (e) => {
    const card = e.target.closest(".film-card");
    if (card) {
      const index = card.getAttribute("data-index");
      openModal(index);
    }
  });
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

  // Obsługa menu mobilnego
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
      });
    });
  }

  // Inicjalizacja odtwarzacza modalnego
  setupModal();
}

document.addEventListener("DOMContentLoaded", render);
