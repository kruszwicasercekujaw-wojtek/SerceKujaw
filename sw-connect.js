/* ============================================================
   SERVICE WORKER — tylko dla podstrony /connect.html
   ------------------------------------------------------------
   Cel: pozwolić zainstalować connect.html jako apkę (PWA) i dać
   podstawowe działanie offline dla samej powłoki strony
   (HTML/CSS/JS/ikony). NIE cache'uje i NIE przechwytuje wysyłki
   formularza (POST do FormSubmit) — ta zawsze idzie normalnie
   przez sieć, żeby zdjęcia na pewno dotarły.
   ============================================================ */

const CACHE_NAME = "connect-shell-v1";

// Statyczne pliki potrzebne, żeby strona w ogóle się wyrenderowała offline.
const SHELL_FILES = [
  "/connect.html",
  "/style.css",
  "/connect.js",
  "/assets/logo.png",
  "/assets/icon-192.png",
  "/assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Nigdy nie ruszamy: zapytań innych niż GET (np. POST formularza do
  // FormSubmit) i zapytań spoza naszej domeny (np. FormSubmit, fonty
  // Google, obce iframe'y). Idą normalnie przez sieć, bez cache'a.
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Strategia: najpierw sieć (żeby zawsze mieć świeżą wersję, gdy jest
  // internet), a dopiero gdy sieć zawiedzie — cache jako zapasowa,
  // offline'owa wersja powłoki strony.
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return networkResponse;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match("/connect.html")))
  );
});
