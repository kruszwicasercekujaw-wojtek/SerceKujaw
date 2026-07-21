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

   WAŻNE — wysyłka w tle (bez przeładowania strony):
   Formularz jest wysyłany do ukrytego <iframe>, więc strona
   NIE nawiguje nigdzie indziej. Dzięki temu podgląd zdjęć
   zostaje widoczny, a komunikat "Wysłano!" pokazujemy od razu
   po wysłaniu — nie czekamy na żadne przekierowanie z powrotem
   z FormSubmit (parametr _next nie jest już do tego potrzebny).

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
const HIDDEN_IFRAME_NAME = "formSubmitHiddenFrame";

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

/* Tworzy (jeśli jeszcze nie istnieje) ukryty <iframe>, do którego
   formularz będzie się wysyłał, żeby strona się nie przeładowywała. */
function ensureHiddenIframe() {
  let iframe = document.getElementById(HIDDEN_IFRAME_NAME);
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = HIDDEN_IFRAME_NAME;
    iframe.name = HIDDEN_IFRAME_NAME;
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    document.body.appendChild(iframe);
  }
  return iframe;
}

function setupPhotoForm() {
  const form = document.getElementById("photoForm");
  const fileInput = document.getElementById("photoFiles");
  const previewGrid = document.getElementById("filePreviewGrid");
  const errorBox = document.getElementById("formError");
  const successBox = document.getElementById("formSuccess");
  const submitBtn = document.getElementById("submitBtn");

  if (!form) return;

  // Formularz ma się wysyłać do ukrytego iframe, a nie nawigować całą stronę.
  ensureHiddenIframe();
  form.setAttribute("target", HIDDEN_IFRAME_NAME);

  // Pole _next nie jest już potrzebne (nie polegamy na przekierowaniu
  // z powrotem), ale jeśli istnieje w HTML-u, po prostu je czyścimy,
  // żeby FormSubmit nie próbował nigdzie przekierowywać ukrytego iframe.
  const nextField = document.getElementById("nextRedirect");
  if (nextField) {
    nextField.value = "";
  }

  let selectedFiles = [];
  let submissionInProgress = false;

  // Synchronizuje prawdziwe pole <input type="file"> z aktualną listą
  // selectedFiles, żeby oba źródła (nasza tablica i input) były spójne.
  function syncFileInput() {
    const dt = new DataTransfer();
    selectedFiles.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
  }

  fileInput.addEventListener("change", () => {
    // Doklejamy nowo wybrane pliki do już wcześniej wybranych,
    // zamiast je nadpisywać (input[type=file] przy każdym wyborze
    // podaje tylko nowo zaznaczone pliki, nie starą listę).
    const newFiles = Array.from(fileInput.files || []);
    selectedFiles = selectedFiles.concat(newFiles);

    if (selectedFiles.length > MAX_FILES) {
      showError(`Możesz wysłać maksymalnie ${MAX_FILES} zdjęć naraz — dodano tylko pierwsze ${MAX_FILES}.`);
      selectedFiles = selectedFiles.slice(0, MAX_FILES);
    } else {
      clearError();
    }

    syncFileInput();
    renderPreviews();
  });

  function renderPreviews() {
    previewGrid.innerHTML = "";
    selectedFiles.forEach((file, i) => {
      const url = URL.createObjectURL(file);
      const item = document.createElement("div");
      item.className = "file-preview-item";
      item.innerHTML = `
        <img src="${url}" alt="Podgląd zdjęcia ${i + 1}">
        <button type="button" class="file-preview-remove" aria-label="Usuń zdjęcie ${i + 1}">&times;</button>
      `;
      item.querySelector(".file-preview-remove").addEventListener("click", () => {
        selectedFiles.splice(i, 1);
        syncFileInput();
        renderPreviews();
      });
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

  function showSuccess() {
    form.hidden = true;
    if (successBox) {
      successBox.hidden = false;
      setTimeout(() => {
        successBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }

  function resetButton() {
    submitBtn.disabled = false;
    submitBtn.textContent = "Wyślij";
  }

  form.addEventListener("submit", async (e) => {
    // Zatrzymujemy tylko na czas walidacji + kompresji.
    // Realne wysłanie (form.submit()) nastąpi na końcu — pójdzie
    // do ukrytego iframe, więc strona się nie przeładuje.
    e.preventDefault();
    if (submissionInProgress) return;
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

    submissionInProgress = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Przygotowywanie zdjęć...";

    try {
      const compressedFiles = await Promise.all(
        selectedFiles.map(file => compressImage(file, COMPRESS_MAX_DIMENSION, COMPRESS_TARGET_KB))
      );

      const totalSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > SAFE_TOTAL_ATTACHMENT_MB * 1024 * 1024) {
        showError("Nawet po kompresji zdjęcia są za duże łącznie. Spróbuj wysłać mniej zdjęć naraz (np. w dwóch turach).");
        submissionInProgress = false;
        resetButton();
        return;
      }

      // Podmieniamy prawdziwe pole pliku na skompresowane wersje.
      // WAŻNE: FormSubmit wydaje się przyjmować tylko PIERWSZY plik,
      // gdy wiele plików trafia pod tym samym polem "attachment".
      // Dlatego każde zdjęcie dostaje własne, unikalne pole
      // ("attachment_1", "attachment_2", ...) jako osobny, ukryty
      // <input type="file">, a oryginalne pole widoczne w formularzu
      // jest wyłączane, żeby nie wysłać go podwójnie.
      fileInput.disabled = true;

      // Usuń ewentualne wcześniej dodane ukryte pola (np. po ponownej wysyłce)
      form.querySelectorAll("input[data-generated-attachment]").forEach(el => el.remove());

      compressedFiles.forEach((file, i) => {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "file";
        hiddenInput.name = `attachment_${i + 1}`;
        hiddenInput.style.display = "none";
        hiddenInput.setAttribute("data-generated-attachment", "true");

        const dt = new DataTransfer();
        dt.items.add(file);
        hiddenInput.files = dt.files;

        form.appendChild(hiddenInput);
      });

      submitBtn.textContent = "Wysyłanie...";

      // Wysyłamy formularz do ukrytego iframe — to prawdziwa nawigacja
      // przeglądarki (tak jak wymaga FormSubmit), ale ograniczona tylko
      // do iframe, więc widoczna strona się nie zmienia.
      // Ponieważ FormSubmit jest inną domeną, nie możemy odczytać treści
      // odpowiedzi w iframe (polityka CORS) — pokazujemy więc komunikat
      // o sukcesie od razu po wysłaniu formularza, zamiast czekać na
      // zdarzenie "load" iframe (które między domenami bywa zawodne).
      form.submit();

      showSuccess();
    } catch (err) {
      submissionInProgress = false;
      showError("Nie udało się przygotować zdjęć do wysyłki. Spróbuj ponownie.");
      resetButton();
    }
  });
}/* ============================================================
   CONNECT — wysyłka zdjęć na e-mail
   ------------------------------------------------------------
   Formularz wysyła się PRAWDZIWYM zgłoszeniem przeglądarki
   (nie przez fetch/AJAX) prosto do FormSubmit.co — dokładnie
   tak, jak to opisuje ich dokumentacja. To gwarantuje poprawną
   obsługę załączników (AJAX bywał zawodny dla plików).

   Zdjęcia są najpierw kompresowane w przeglądarce (mniejsze
   wymiary + jakość), a dopiero skompresowane pliki trafiają
   do prawdziwego pola <input type="file"> i są wysyłane.

   WAŻNE — wysyłka w tle (bez przeładowania strony):
   Formularz jest wysyłany do ukrytego <iframe>, więc strona
   NIE nawiguje nigdzie indziej. Dzięki temu podgląd zdjęć
   zostaje widoczny, a komunikat "Wysłano!" pokazujemy od razu
   po wysłaniu — nie czekamy na żadne przekierowanie z powrotem
   z FormSubmit (parametr _next nie jest już do tego potrzebny).

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
const HIDDEN_IFRAME_NAME = "formSubmitHiddenFrame";

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

/* Tworzy (jeśli jeszcze nie istnieje) ukryty <iframe>, do którego
   formularz będzie się wysyłał, żeby strona się nie przeładowywała. */
function ensureHiddenIframe() {
  let iframe = document.getElementById(HIDDEN_IFRAME_NAME);
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = HIDDEN_IFRAME_NAME;
    iframe.name = HIDDEN_IFRAME_NAME;
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    document.body.appendChild(iframe);
  }
  return iframe;
}

function setupPhotoForm() {
  const form = document.getElementById("photoForm");
  const fileInput = document.getElementById("photoFiles");
  const previewGrid = document.getElementById("filePreviewGrid");
  const errorBox = document.getElementById("formError");
  const successBox = document.getElementById("formSuccess");
  const submitBtn = document.getElementById("submitBtn");

  if (!form) return;

  // Formularz ma się wysyłać do ukrytego iframe, a nie nawigować całą stronę.
  ensureHiddenIframe();
  form.setAttribute("target", HIDDEN_IFRAME_NAME);

  // Pole _next nie jest już potrzebne (nie polegamy na przekierowaniu
  // z powrotem), ale jeśli istnieje w HTML-u, po prostu je czyścimy,
  // żeby FormSubmit nie próbował nigdzie przekierowywać ukrytego iframe.
  const nextField = document.getElementById("nextRedirect");
  if (nextField) {
    nextField.value = "";
  }

  let selectedFiles = [];
  let submissionInProgress = false;

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

  function showSuccess() {
    form.hidden = true;
    if (successBox) {
      successBox.hidden = false;
      setTimeout(() => {
        successBox.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }

  function resetButton() {
    submitBtn.disabled = false;
    submitBtn.textContent = "Wyślij";
  }

  form.addEventListener("submit", async (e) => {
    // Zatrzymujemy tylko na czas walidacji + kompresji.
    // Realne wysłanie (form.submit()) nastąpi na końcu — pójdzie
    // do ukrytego iframe, więc strona się nie przeładuje.
    e.preventDefault();
    if (submissionInProgress) return;
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

    submissionInProgress = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Przygotowywanie zdjęć...";

    try {
      const compressedFiles = await Promise.all(
        selectedFiles.map(file => compressImage(file, COMPRESS_MAX_DIMENSION, COMPRESS_TARGET_KB))
      );

      const totalSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > SAFE_TOTAL_ATTACHMENT_MB * 1024 * 1024) {
        showError("Nawet po kompresji zdjęcia są za duże łącznie. Spróbuj wysłać mniej zdjęć naraz (np. w dwóch turach).");
        submissionInProgress = false;
        resetButton();
        return;
      }

      // Podmieniamy prawdziwe pole pliku na skompresowane wersje.
      // WAŻNE: FormSubmit wydaje się przyjmować tylko PIERWSZY plik,
      // gdy wiele plików trafia pod tym samym polem "attachment".
      // Dlatego każde zdjęcie dostaje własne, unikalne pole
      // ("attachment_1", "attachment_2", ...) jako osobny, ukryty
      // <input type="file">, a oryginalne pole widoczne w formularzu
      // jest wyłączane, żeby nie wysłać go podwójnie.
      fileInput.disabled = true;

      // Usuń ewentualne wcześniej dodane ukryte pola (np. po ponownej wysyłce)
      form.querySelectorAll("input[data-generated-attachment]").forEach(el => el.remove());

      compressedFiles.forEach((file, i) => {
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "file";
        hiddenInput.name = `attachment_${i + 1}`;
        hiddenInput.style.display = "none";
        hiddenInput.setAttribute("data-generated-attachment", "true");

        const dt = new DataTransfer();
        dt.items.add(file);
        hiddenInput.files = dt.files;

        form.appendChild(hiddenInput);
      });

      submitBtn.textContent = "Wysyłanie...";

      // Wysyłamy formularz do ukrytego iframe — to prawdziwa nawigacja
      // przeglądarki (tak jak wymaga FormSubmit), ale ograniczona tylko
      // do iframe, więc widoczna strona się nie zmienia.
      // Ponieważ FormSubmit jest inną domeną, nie możemy odczytać treści
      // odpowiedzi w iframe (polityka CORS) — pokazujemy więc komunikat
      // o sukcesie od razu po wysłaniu formularza, zamiast czekać na
      // zdarzenie "load" iframe (które między domenami bywa zawodne).
      form.submit();

      showSuccess();
    } catch (err) {
      submissionInProgress = false;
      showError("Nie udało się przygotować zdjęć do wysyłki. Spróbuj ponownie.");
      resetButton();
    }
  });
}
