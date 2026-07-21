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

## CONNECT — podstrona do wysyłania zdjęć przez widzów

Na stronie głównej w menu jest czerwony przycisk **CONNECT**, który prowadzi
do `connect.html` — formularza, przez który każdy może wysłać Ci zdjęcie
(razem z podpisem autora) prosto na e-mail `kruszwicasercekujaw@gmail.com`.

Strona jest statyczna, więc do faktycznej wysyłki e-maila (z załącznikami)
używa darmowej usługi **Web3Forms** — to najprostszy sposób, żeby to
zadziałało bez własnego serwera.

**Jednorazowa konfiguracja (2 minuty):**
1. Wejdź na [web3forms.com](https://web3forms.com).
2. Podaj adres `kruszwicasercekujaw@gmail.com` — dostaniesz e-mail z
   "Access Key" (ciąg znaków typu `a1b2c3d4-...`).
3. Otwórz plik `connect.js` i zamień linijkę:
   ```js
   const WEB3FORMS_ACCESS_KEY = "WSTAW-TUTAJ-SWOJ-ACCESS-KEY";
   ```
   wklejając w cudzysłów swój klucz.
4. Zapisz, wgraj (`git push` lub przeciągnij folder na Vercel ponownie) —
   gotowe. Zgłoszenia ze zdjęciami będą przychodzić na Twoją skrzynkę.

Darmowy plan Web3Forms pozwala na ok. 250 wiadomości miesięcznie i pliki
do ok. 5 MB każdy — w formularzu ustawiony jest limit 5 zdjęć na raz,
też po 5 MB. To można później zwiększyć/zmniejszyć w pliku `connect.js`
(stałe `MAX_FILES` i `MAX_FILE_SIZE_MB`).

Dopóki nie wkleisz klucza, formularz pokaże widzowi komunikat, że
wysyłka nie jest jeszcze skonfigurowana — nic się nie wyślie "donikąd".

## Struktura plików

```
index.html      — strona główna
connect.html     — podstrona CONNECT (formularz wysyłki zdjęć)
style.css       — wygląd (czarne tło, złoty/czerwony akcent, wieża jako motyw)
script.js       — lista filmów i linków kontaktowych (tylko strona główna) — TU edytujesz treść
connect.js      — obsługa formularza CONNECT + klucz Web3Forms
assets/logo.png — Twoje logo fanpage'a
vercel.json     — konfiguracja Vercel (czyste URL-e)
```
