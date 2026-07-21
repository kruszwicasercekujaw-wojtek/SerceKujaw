/* ============================================================
   CONNECT — wysyłka zdjęć na e-mail
   ------------------------------------------------------------
   Formularz wysyła się PRAWDZIWYM zgłoszeniem przeglądarki
   (nie przez fetch/AJAX) prosto do FormSubmit.co — dokładnie
   tak, jak to opisuje ich dokumentacja. To gwarantuje poprawną
   obsługę załączników (AJAX bywał zawodny dla plików).

   Zdjęcia są najpierw kompresowane w przeglądarce (mniejsze
   wymiary + jakość), a dopiero skompresowane pliki trafiają
   do prawdziwego pola <input type="file"> i są wysyłane.

   Po wysłaniu FormSubmit przekierowuje z powrotem na tę samą
   podstronę (parametr _next), gdzie pokazujemy komunikat
   "Wysłano!".

   WAŻNE — jednorazowa aktywacja:
   Przy PIERWSZYM zgłoszeniu z tej strony FormSubmit wyśle na
   kruszwicasercekujaw@gmail.com e-mail z linkiem aktywacyjnym.
   Trzeba go kliknąć — dopiero wtedy zgłoszenia (także kolejne)
   zaczną naprawdę docierać.

   WAŻNE — limit wielkości załączników:
   FormSubmit przyjmuje maks. 10 MB załączników łącznie na jedno
   zgłoszenie — dlatego zdjęcia są kompresowane automatycznie.
   ============================================================ */

const MAX_FILES = 10;
const MAX_ORIGINAL_FILE_SIZE_MB = 25;   // limit na oryginalny plik przed kompresją
const SAFE_TOTAL_ATTACHMENT_MB = 9;     // margines bezpieczeństwa poniżej limitu 10 MB FormSubmit
const COMPRESS_MAX_DIMENSION = 1600;    // px, dłuższy bok zdjęcia po kompresji
const COMPRESS_TARGET_KB = 700;         // docelowy rozmiar pojedynczego zdjęcia po kompresji

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  // Menu mobilne (identyczne jak na stronie głównej)
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => navLinks.classList.toggle("active"));
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => navLinks.classList.remove("active"));
    });
  }

  // Ustaw adres powrotny (_next) na tę samą stronę z ?sent=1
  const nextField = document.getElementById("nextRedirect");
  if (nextField) {
    nextField.value = window.location.origin + window.location.pathname + "?sent=1";
  }

  // Jeśli wróciliśmy tu po wysłaniu (przekierowanie z FormSubmit) - pokaż sukces
  if (new URLSearchParams(window.location.search).get("sent") === "1") {
    const form = document.getElementById("photoForm");
    const successBox = document.getElementById("formSuccess");
    if (form) form.hidden = true;
    if (successBox) successBox.hidden = false;
  }

  setupPhotoForm();
});

/* Kompresuje jeden plik obrazu do File (JPEG), zmniejszając wymiary
   i jakość, aż zmieści się w docelowym rozmiarze (albo po kilku
   próbach zwraca najlepszy uzyskany wynik). */
function compressImage(file, maxDimension, targetKB) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDimension) {
        height = Math.round(height * (maxDimension / width));
        width = maxDimension;
      } else if (height >= width && height > maxDimension) {
        width = Math.round(width * (maxDimension / height));
        height = maxDimension;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const qualities = [0.8, 0.6, 0.45, 0.3];
      let attempt = 0;

      function tryQuality() {
        canvas.toBlob((blob) => {
          if (!blob) {
            URL.revokeObjectURL(url);
            reject(new Error("Nie udało się przetworzyć zdjęcia."));
            return;
          }
          const sizeKB = blob.size / 1024;
          if (sizeKB <= targetKB || attempt >= qualities.length - 1) {
            URL.revokeObjectURL(url);
            const baseName = file.name.replace(/\.[^.]+$/, "") || "zdjecie";
            resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
          } else {
            attempt++;
            tryQuality();
          }
        }, "image/jpeg", qualities[attempt]);
      }

      tryQuality();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nie udało się wczytać zdjęcia."));
    };

    img.src = url;
  });
}

function setupPhotoForm() {
  const form = document.getElementById("photoForm");
  const fileInput = document.getElementById("photoFiles");
  const previewGrid = document.getElementById("filePreviewGrid");
  const errorBox = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");

  if (!form) return;

  let selectedFiles = [];

  fileInput.addEventListener("change", () => {
    selectedFiles = Array.from(fileInput.files || []);
    renderPreviews();
  });

  function renderPreviews() {
    previewGrid.innerHTML = "";
    selectedFiles.slice(0, MAX_FILES).forEach((file, i) => {
      const url = URL.createObjectURL(file);
      const item = document.createElement("div");
      item.className = "file-preview-item";
      item.innerHTML = `<img src="${url}" alt="Podgląd zdjęcia ${i + 1}">`;
      previewGrid.appendChild(item);
    });
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  function clearError() {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  function resetButton() {
    submitBtn.disabled = false;
    submitBtn.textContent = "Wyślij";
  }

  form.addEventListener("submit", async (e) => {
    // Zatrzymujemy tylko na czas walidacji + kompresji.
    // Realne wysłanie (form.submit()) nastąpi na końcu, jako
    // prawdziwa nawigacja przeglądarki do FormSubmit.
    e.preventDefault();
    clearError();

    const authorName = document.getElementById("authorName").value.trim();

    if (!authorName) {
      showError("Podaj proszę autora zdjęcia.");
      return;
    }
    if (!selectedFiles.length) {
      showError("Dodaj przynajmniej jedno zdjęcie.");
      return;
    }
    if (selectedFiles.length > MAX_FILES) {
      showError(`Możesz wysłać maksymalnie ${MAX_FILES} zdjęć naraz.`);
      return;
    }
    const tooBig = selectedFiles.find(f => f.size > MAX_ORIGINAL_FILE_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      showError(`Plik "${tooBig.name}" jest za duży (max ${MAX_ORIGINAL_FILE_SIZE_MB} MB).`);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Przygotowywanie zdjęć...";

    try {
      const compressedFiles = await Promise.all(
        selectedFiles.map(file => compressImage(file, COMPRESS_MAX_DIMENSION, COMPRESS_TARGET_KB))
      );

      const totalSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > SAFE_TOTAL_ATTACHMENT_MB * 1024 * 1024) {
        showError("Nawet po kompresji zdjęcia są za duże łącznie. Spróbuj wysłać mniej zdjęć naraz (np. w dwóch turach).");
        resetButton();
        return;
      }

      // Podmieniamy prawdziwe pole pliku na skompresowane wersje
      const dataTransfer = new DataTransfer();
      compressedFiles.forEach(f => dataTransfer.items.add(f));
      fileInput.files = dataTransfer.files;

      submitBtn.textContent = "Wysyłanie...";

      // Prawdziwe wysłanie formularza (nawigacja przeglądarki,
      // dokładnie tak jak w dokumentacji FormSubmit)
      form.submit();
    } catch (err) {
      showError("Nie udało się przygotować zdjęć do wysyłki. Spróbuj ponownie.");
      resetButton();
    }
  });
}
