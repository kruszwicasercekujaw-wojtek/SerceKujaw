/* ============================================================
   CONNECT — wysyłka zdjęć na e-mail
   ------------------------------------------------------------
   Ta strona wysyła zgłoszenia (razem ze zdjęciami) przez darmową
   usługę FormSubmit.co — bez rejestracji, bez klucza API i bez
   płacenia. Wystarczy że w stałej TARGET_EMAIL poniżej jest Twój
   adres e-mail (już jest ustawiony).

   WAŻNE — jednorazowa aktywacja:
   Przy PIERWSZYM zgłoszeniu z tej strony FormSubmit wyśle na
   kruszwicasercekujaw@gmail.com e-mail z linkiem aktywacyjnym
   ("Please confirm your email"). Trzeba go kliknąć — dopiero
   wtedy zgłoszenia (także kolejne) zaczną naprawdę docierać.
   To jednorazowe, zajmuje kilka sekund.

   WAŻNE — limit wielkości załączników:
   FormSubmit przyjmuje maks. 10 MB załączników ŁĄCZNIE na jedno
   zgłoszenie. Jeśli ten limit zostanie przekroczony, FormSubmit
   i tak wysyła e-mail, ale BEZ zdjęć (bez błędu!). Dlatego każde
   zdjęcie jest automatycznie kompresowane w przeglądarce przed
   wysyłką (zmniejszony rozmiar/jakość), żeby całość bezpiecznie
   zmieściła się w limicie nawet przy 10 zdjęciach z telefonu.
   ============================================================ */

const TARGET_EMAIL = "kruszwicasercekujaw@gmail.com";
const MAX_FILES = 10;
const MAX_ORIGINAL_FILE_SIZE_MB = 25;   // limit na oryginalny plik przed kompresją
const SAFE_TOTAL_ATTACHMENT_MB = 9;     // margines bezpieczeństwa poniżej limitu 10 MB FormSubmit
const COMPRESS_MAX_DIMENSION = 1600;    // px, dłuższy bok zdjęcia po kompresji
const COMPRESS_TARGET_KB = 700;         // docelowy rozmiar pojedynczego zdjęcia po kompresji

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => navLinks.classList.toggle("active"));
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => navLinks.classList.remove("active"));
    });
  }

  setupPhotoForm();
});

/* Kompresuje jeden plik obrazu do Blob (JPEG), zmniejszając wymiary
   i jakość, aż zmieści się w docelowym rozmiarze (albo po 4 próbach
   zwraca najlepszy uzyskany wynik). */
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
            resolve(blob);
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
  const successBox = document.getElementById("formSuccess");

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

  form.addEventListener("submit", async (e) => {
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
      // Kompresja wszystkich zdjęć równolegle
      const compressed = await Promise.all(
        selectedFiles.map(file => compressImage(file, COMPRESS_MAX_DIMENSION, COMPRESS_TARGET_KB))
      );

      const totalSize = compressed.reduce((sum, blob) => sum + blob.size, 0);
      if (totalSize > SAFE_TOTAL_ATTACHMENT_MB * 1024 * 1024) {
        showError(`Nawet po kompresji zdjęcia są za duże łącznie. Spróbuj wysłać mniej zdjęć naraz (np. w dwóch turach).`);
        submitBtn.disabled = false;
        submitBtn.textContent = "Wyślij";
        return;
      }

      submitBtn.textContent = "Wysyłanie...";

      const formData = new FormData();
      formData.append("_subject", `Nowe zdjęcie od: ${authorName} — Serce Kujaw`);
      formData.append("_template", "table");
      formData.append("_captcha", "false");
      formData.append("Autor zdjęcia", authorName);

      const authorEmail = document.getElementById("authorEmail").value.trim();
      if (authorEmail) formData.append("E-mail autora", authorEmail);

      const message = document.getElementById("photoMessage").value.trim();
      if (message) formData.append("Opis", message);

      compressed.forEach((blob, i) => {
        const originalName = selectedFiles[i].name.replace(/\.[^.]+$/, "") || `zdjecie_${i + 1}`;
        formData.append(`Zdjecie_${i + 1}`, blob, `${originalName}.jpg`);
      });

      const response = await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result && (result.success === "true" || result.success === true || !("success" in result))) {
        form.hidden = true;
        successBox.hidden = false;
        successBox.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        showError("Coś poszło nie tak podczas wysyłki. Spróbuj ponownie za chwilę.");
      }
    } catch (err) {
      showError(`Nie udało się wysłać. Sprawdź połączenie i spróbuj ponownie, albo napisz bezpośrednio na ${TARGET_EMAIL}.`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Wyślij";
    }
  });
}
