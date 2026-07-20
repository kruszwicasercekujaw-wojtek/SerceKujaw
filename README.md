# Serce Kujaw — portfolio wideo

Prosta, statyczna strona (HTML/CSS/JS, bez frameworka) gotowa do wrzucenia na Vercel.

## Jak dodać nowy film

Otwórz plik `script.js` i w tablicy `VIDEOS` na górze pliku dodaj nowy obiekt, np.:

```js
{
  title: "Tytuł filmu",
  url: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  description: "Krótki opis filmu.",
  date: "Lipiec 2026"
}
```

Dla linków YouTube miniaturka wygeneruje się automatycznie. Dla TikToka/Instagrama
karta pokaże ciemne tło z ikonką odtwarzania (serduszko z logo).

Linki kontaktowe (Facebook, YouTube itd.) edytujesz w tablicy `CONTACT_LINKS`
w tym samym pliku.

## Jak wystawić stronę na Vercel

**Opcja A — najszybsza, bez GitHuba:**
1. Wejdź na [vercel.com](https://vercel.com) i załóż konto (może być przez e-mail).
2. Kliknij "Add New… → Project".
3. Wybierz "Deploy" przez przeciągnięcie folderu (drag & drop) — przeciągnij
   cały folder `kruszwica-portfolio` na stronę Vercel.
4. Gotowe — strona dostanie adres w stylu `twoja-nazwa.vercel.app`.

**Opcja B — przez GitHub (łatwiejsze późniejsze aktualizacje):**
1. Wrzuć zawartość tego folderu do nowego repozytorium na GitHubie.
2. Na [vercel.com](https://vercel.com) kliknij "Add New… → Project" i wybierz
   to repozytorium.
3. Framework: "Other" / statyczny — nie trzeba nic konfigurować,
   Vercel sam wykryje `index.html`.
4. Kliknij "Deploy".

Każda zmiana w `script.js` (np. dodanie filmu) i ponowny `git push` automatycznie
zaktualizuje stronę.

## Struktura plików

```
index.html      — treść strony
style.css       — wygląd (czarne tło, złoty/czerwony akcent, wieża jako motyw)
script.js       — lista filmów i linków kontaktowych — TU edytujesz treść
assets/logo.png — Twoje logo fanpage'a
vercel.json     — konfiguracja Vercel (czyste URL-e)
```
