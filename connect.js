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

   Limity: FormSubmit jest darmowy i bez ustalonego "planu", ale
   pamiętaj, że skrzynki pocztowe (Gmail itp.) zwykle odrzucają
   e-maile powyżej ok. 20-25 MB łącznie ze wszystkimi załącznikami
   — dlatego poniżej pilnujemy rozsądnego limitu wielkości.
   ============================================================ */

const TARGET_EMAIL = "kruszwicasercekujaw@gmail.com";
const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 4;
const MAX_TOTAL_SIZE_MB = 15;

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
    const tooBig = selectedFiles.find(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      showError(`Plik "${tooBig.name}" jest za duży (max ${MAX_FILE_SIZE_MB} MB na zdjęcie).`);
      return;
    }
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      showError(`Łączny rozmiar zdjęć jest za duży (max ${MAX_TOTAL_SIZE_MB} MB na zgłoszenie). Wyślij mniej zdjęć naraz.`);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Wysyłanie...";

    try {
      const formData = new FormData();
      formData.append("_subject", `Nowe zdjęcie od: ${authorName} — Serce Kujaw`);
      formData.append("_template", "table");
      formData.append("_captcha", "false");
      formData.append("Autor zdjęcia", authorName);

      const authorEmail = document.getElementById("authorEmail").value.trim();
      if (authorEmail) formData.append("E-mail autora", authorEmail);

      const message = document.getElementById("photoMessage").value.trim();
      if (message) formData.append("Opis", message);

      // Każde zdjęcie pod osobną, unikalną nazwą pola - tak
      // FormSubmit dołącza wiele plików naraz jako załączniki.
      selectedFiles.forEach((file, i) => {
        formData.append(`Zdjecie_${i + 1}`, file);
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
