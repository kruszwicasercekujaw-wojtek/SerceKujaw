/* ============================================================
   CONNECT — wysyłka zdjęć na e-mail
   ------------------------------------------------------------
   Ta strona wysyła zgłoszenia przez darmową usługę Web3Forms
   (https://web3forms.com). Usługa odbiera dane z formularza
   (razem ze zdjęciami) i przesyła je e-mailem na adres, który
   skonfigurujesz przy zakładaniu darmowego konta.

   JAK TO PODPIĄĆ (jednorazowo, 2 minuty):
   1. Wejdź na https://web3forms.com
   2. Podaj adres kruszwicasercekujaw@gmail.com — dostaniesz
      w mailu "Access Key" (ciąg znaków typu
      a1b2c3d4-e5f6-... ).
   3. Wklej ten klucz poniżej, zamiast napisu
      "WSTAW-TUTAJ-SWOJ-ACCESS-KEY".
   4. Gotowe — zgłoszenia będą trafiać na Twoją skrzynkę.

   Limity darmowego planu Web3Forms: 250 wiadomości/mies.,
   pliki do ok. 5 MB każdy. To więcej niż wystarczy na start.
   ============================================================ */

const WEB3FORMS_ACCESS_KEY = "5f29bd5f-cab6-427d-9730-431182740d94";
const TARGET_EMAIL = "kruszwicasercekujaw@gmail.com";
const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;

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
      showError(`Plik "${tooBig.name}" jest za duży (max ${MAX_FILE_SIZE_MB} MB).`);
      return;
    }
    if (WEB3FORMS_ACCESS_KEY === "5f29bd5f-cab6-427d-9730-431182740d94") {
      showError("Formularz nie jest jeszcze skonfigurowany — zobacz instrukcję na górze pliku connect.js.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Wysyłanie...";

    try {
      const formData = new FormData();
      formData.append("access_key", WEB3FORMS_ACCESS_KEY);
      formData.append("subject", `Nowe zdjęcie od: ${authorName} — Serce Kujaw`);
      formData.append("from_name", "Serce Kujaw — formularz CONNECT");
      formData.append("Autor zdjęcia", authorName);

      const authorEmail = document.getElementById("authorEmail").value.trim();
      if (authorEmail) formData.append("E-mail autora", authorEmail);

      const message = document.getElementById("photoMessage").value.trim();
      if (message) formData.append("Opis", message);

      selectedFiles.forEach((file) => {
        formData.append("attachment", file);
      });

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
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
