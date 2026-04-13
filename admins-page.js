const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const errorText = document.getElementById("errorText");
const summaryList = document.getElementById("summaryList");
const shopNote = document.getElementById("shopNote");
const maintenanceStatusText = document.getElementById("maintenanceStatusText");
const maintenanceEnabledInput = document.getElementById("maintenanceEnabledInput");
const maintenanceMessageInput = document.getElementById("maintenanceMessageInput");
const saveMaintenanceButton = document.getElementById("saveMaintenanceButton");
const copyIpButton = document.getElementById("copyIpButton");
const logoutButton = document.getElementById("logoutButton");
const newsEditors = document.getElementById("newsEditors");
const addNewsButton = document.getElementById("addNewsButton");
const saveNewsButton = document.getElementById("saveNewsButton");
const newsHelperText = document.getElementById("newsHelperText");
const galleryEditors = document.getElementById("galleryEditors");
const addGalleryButton = document.getElementById("addGalleryButton");
const saveGalleryButton = document.getElementById("saveGalleryButton");
const galleryImportInput = document.getElementById("galleryImportInput");
const galleryHelperText = document.getElementById("galleryHelperText");
const ADMIN_PAGE_SESSION_KEY = "winlineworld_admin_panel_session";
const ADMIN_PASSWORD_HASH = "d3171829b03043f80e6b1ebcced54c866f86f1a78b173da1f718a18810d5549b";
const MAX_GALLERY_IMAGE_SIDE = 1600;
const GALLERY_IMAGE_QUALITY = 0.82;

const setAuthenticated = (authenticated) => {
  if (!loginPanel || !dashboard) {
    return;
  }

  loginPanel.hidden = authenticated;
  dashboard.classList.toggle("is-open", authenticated);
};

const setHelperText = (element, message, state = "info") => {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("is-error", state === "error");
  element.classList.toggle("is-success", state === "success");
};

const getStorageWarning = (prefix) => {
  const baseMessage = prefix || "Изменения не удалось надежно сохранить.";
  const details = window.WinlineStore?.getLastSaveErrorMessage?.() || "";
  const quotaHint = " Локальное хранилище браузера переполнено или недоступно. Уменьшите размер или количество локальных изображений и попробуйте снова.";

  return `${baseMessage}${details ? ` (${details})` : ""}${quotaHint}`;
};

const sha256 = async (value) => {
  const encoded = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const createNews = (index = 0) => {
  const defaults = window.WinlineStore?.DEFAULT_STORE?.news || [];
  const template = defaults[index] || defaults[defaults.length - 1] || {};
  const uniqueId = `news-${Date.now()}-${index + 1}`;

  return {
    id: uniqueId,
    tag: template.tag || "Новость",
    date: template.date || "",
    title: template.title || "Новая новость",
    text: template.text || "Краткое описание новости.",
    linkLabel: template.linkLabel || "Подробнее",
    linkUrl: template.linkUrl || "#news",
    featured: Boolean(template.featured && index === 0)
  };
};

const createGalleryItem = (index = 0) => {
  const defaults = window.WinlineStore?.DEFAULT_STORE?.gallery || [];
  const template = defaults[index] || defaults[defaults.length - 1] || {};
  const uniqueId = `gallery-${Date.now()}-${index + 1}`;

  return {
    id: uniqueId,
    label: template.label || "Галерея",
    title: template.title || "Новый кадр",
    text: template.text || "Короткое описание кадра.",
    imageUrl: template.imageUrl || "",
    alt: template.alt || template.title || "Скриншот сервера",
    linkUrl: template.linkUrl || "",
    featured: Boolean(template.featured && index === 0)
  };
};

const buildTitleFromFilename = (fileName, fallbackIndex = 0) => {
  const baseName = String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!baseName) {
    return `Кадр ${fallbackIndex + 1}`;
  }

  return baseName.charAt(0).toUpperCase() + baseName.slice(1);
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => resolve(String(reader.result || ""));
  reader.onerror = () => reject(new Error(`Не удалось прочитать файл ${file?.name || ""}`.trim()));
  reader.readAsDataURL(file);
});

const loadImageFromFile = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error(`Не удалось открыть изображение ${file?.name || ""}`.trim()));
  };

  image.src = objectUrl;
});

const convertImageFileToDataUrl = async (file) => {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Можно загружать только изображения.");
  }

  try {
    const image = await loadImageFromFile(file);
    const naturalWidth = image.naturalWidth || image.width || 1;
    const naturalHeight = image.naturalHeight || image.height || 1;
    const scale = Math.min(1, MAX_GALLERY_IMAGE_SIDE / Math.max(naturalWidth, naturalHeight));
    const canvas = document.createElement("canvas");
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Не удалось подготовить изображение к загрузке.");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const webpDataUrl = canvas.toDataURL("image/webp", GALLERY_IMAGE_QUALITY);
    if (webpDataUrl && webpDataUrl !== "data:,") {
      return webpDataUrl;
    }

    const jpegDataUrl = canvas.toDataURL("image/jpeg", GALLERY_IMAGE_QUALITY);
    if (jpegDataUrl && jpegDataUrl !== "data:,") {
      return jpegDataUrl;
    }
  } catch (error) {
    return readFileAsDataUrl(file);
  }

  return readFileAsDataUrl(file);
};

const getDraftNewsItems = () => {
  const editors = document.querySelectorAll("[data-news-editor]");

  if (!editors.length) {
    return Array.isArray(window.WinlineStore?.getStore()?.news)
      ? window.WinlineStore.getStore().news
      : [];
  }

  return collectNewsFromEditors();
};

const getDraftGalleryItems = () => {
  const editors = document.querySelectorAll("[data-gallery-editor]");

  if (!editors.length) {
    return Array.isArray(window.WinlineStore?.getStore()?.gallery)
      ? window.WinlineStore.getStore().gallery
      : [];
  }

  return collectGalleryFromEditors();
};

const renderNewsEditors = (store) => {
  if (!newsEditors || !window.WinlineStore) {
    return;
  }

  const { escapeHtml } = window.WinlineStore;
  const items = Array.isArray(store.news) ? store.news : [];

  newsEditors.innerHTML = items.map((item, index) => `
    <article class="editor-card${item.featured ? " featured" : ""}" data-news-editor data-id="${escapeHtml(item.id)}">
      <div class="editor-meta">
        <div>
          <span class="chip">News ${index + 1}</span>
          <h3 class="editor-title">${escapeHtml(item.title || `Новость ${index + 1}`)}</h3>
        </div>
        <button class="small-button danger" type="button" data-remove-news>Удалить</button>
      </div>

      <div class="field">
        <label class="label">Тег</label>
        <input class="input" type="text" data-field="tag" value="${escapeHtml(item.tag)}" placeholder="Обновление">
      </div>

      <div class="field">
        <label class="label">Дата</label>
        <input class="input" type="text" data-field="date" value="${escapeHtml(item.date)}" placeholder="03.04.2026">
      </div>

      <div class="field">
        <label class="label">Заголовок</label>
        <input class="input" type="text" data-field="title" value="${escapeHtml(item.title)}" placeholder="Заголовок новости">
      </div>

      <div class="field">
        <label class="label">Текст</label>
        <textarea class="textarea" data-field="text" placeholder="Текст новости">${escapeHtml(item.text)}</textarea>
      </div>

      <div class="field">
        <label class="label">Текст кнопки</label>
        <input class="input" type="text" data-field="linkLabel" value="${escapeHtml(item.linkLabel)}" placeholder="Подробнее">
      </div>

      <div class="field">
        <label class="label">Ссылка</label>
        <input class="input" type="text" data-field="linkUrl" value="${escapeHtml(item.linkUrl)}" placeholder="https://... или #donate">
      </div>

      <label class="check-row">
        <input type="checkbox" data-field="featured" ${item.featured ? "checked" : ""}>
        <span>Сделать большой карточкой</span>
      </label>
    </article>
  `).join("");

  setHelperText(
    newsHelperText,
    items.length ? `Новостей в блоке: ${items.length}` : "Новостей пока нет. Добавь первую запись."
  );
};

const renderGalleryEditors = (store) => {
  if (!galleryEditors || !window.WinlineStore) {
    return;
  }

  const { escapeHtml } = window.WinlineStore;
  const items = Array.isArray(store.gallery) ? store.gallery : [];

  galleryEditors.innerHTML = items.map((item, index) => {
    const hasImage = Boolean(item.imageUrl);
    const isEmbedded = hasImage && item.imageUrl.startsWith("data:");
    const sourceDescription = isEmbedded
      ? "Локальный файл встроен в галерею."
      : hasImage
      ? "Используется ссылка или путь к изображению."
      : "Изображение пока не выбрано.";

    return `
      <article class="editor-card${item.featured ? " featured" : ""}" data-gallery-editor data-id="${escapeHtml(item.id)}">
        <div class="editor-meta">
          <div>
            <span class="chip">Gallery ${index + 1}</span>
            <h3 class="editor-title">${escapeHtml(item.title || `Кадр ${index + 1}`)}</h3>
          </div>
          <button class="small-button danger" type="button" data-remove-gallery>Удалить</button>
        </div>

        <div class="field">
          <label class="label">Превью</label>
          <div class="image-preview${hasImage ? "" : " is-empty"}">
            ${hasImage
              ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.alt || item.title)}">`
              : "<span>Превью появится после выбора картинки или ссылки</span>"}
          </div>
          <div class="editor-note">${escapeHtml(sourceDescription)}</div>
        </div>

        <div class="field">
          <label class="label">Метка</label>
          <input class="input" type="text" data-field="label" value="${escapeHtml(item.label)}" placeholder="СПАВН">
        </div>

        <div class="field">
          <label class="label">Заголовок</label>
          <input class="input" type="text" data-field="title" value="${escapeHtml(item.title)}" placeholder="Центральная площадь сервера">
        </div>

        <div class="field">
          <label class="label">Описание</label>
          <textarea class="textarea" data-field="text" placeholder="Короткое описание кадра">${escapeHtml(item.text)}</textarea>
        </div>

        <div class="field">
          <label class="label">Ссылка или путь к изображению</label>
          <input class="input" type="hidden" data-field="imageUrl" value="${escapeHtml(item.imageUrl)}">
          <input class="input" type="text" data-field="imageUrlDisplay" value="${escapeHtml(isEmbedded ? "" : item.imageUrl)}" placeholder="https://... или images/spawn.webp">
          <div class="editor-note">Если загружен локальный файл, здесь можно оставить поле пустым.</div>
        </div>

        <div class="field">
          <label class="label">Локальный файл с компьютера</label>
          <input class="input file-input" type="file" data-field="localImageFile" accept="image/*">
          <div class="editor-note">Можно выбрать новый файл для этой карточки. Изображение будет автоматически сжато перед сохранением.</div>
        </div>

        <div class="field">
          <label class="label">Alt текст</label>
          <input class="input" type="text" data-field="alt" value="${escapeHtml(item.alt)}" placeholder="Скриншот сервера">
        </div>

        <div class="field">
          <label class="label">Кнопка / ссылка</label>
          <input class="input" type="text" data-field="linkUrl" value="${escapeHtml(item.linkUrl)}" placeholder="https://... или #news">
        </div>

        <label class="check-row">
          <input type="checkbox" data-field="featured" ${item.featured ? "checked" : ""}>
          <span>Выделить карточку крупнее</span>
        </label>
      </article>
    `;
  }).join("");

  setHelperText(
    galleryHelperText,
    items.length ? `Кадров в галерее: ${items.length}` : "Галерея пока пуста. Добавь первый кадр."
  );
};

const renderPanel = () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = window.WinlineStore.getStore();
  const { escapeHtml, formatPrice } = window.WinlineStore;

  if (summaryList) {
    summaryList.innerHTML = store.privileges.map((privilege) => {
      const state = privilege.stripeUrl ? "Stripe подключен" : "Stripe не настроен";
      return `<li>${escapeHtml(privilege.name)} — ${escapeHtml(formatPrice(privilege))} • ${escapeHtml(state)}</li>`;
    }).join("");
  }

  if (shopNote) {
    shopNote.textContent = store.maintenanceEnabled
      ? "Техническая поддержка"
      : store.shopNotice;
  }

  if (maintenanceEnabledInput) {
    maintenanceEnabledInput.checked = Boolean(store.maintenanceEnabled);
  }

  if (maintenanceMessageInput) {
    maintenanceMessageInput.value = store.maintenanceMessage;
  }

  if (maintenanceStatusText) {
    maintenanceStatusText.textContent = store.maintenanceEnabled
      ? "Техническая поддержка включена"
      : "Техническая поддержка выключена";
  }

  renderNewsEditors(store);
  renderGalleryEditors(store);
};

function collectNewsFromEditors() {
  const editors = Array.from(document.querySelectorAll("[data-news-editor]"));

  return editors.map((editor, index) => ({
    id: editor.getAttribute("data-id") || `news-${index + 1}`,
    tag: editor.querySelector('[data-field="tag"]')?.value.trim() || "Новость",
    date: editor.querySelector('[data-field="date"]')?.value.trim() || "",
    title: editor.querySelector('[data-field="title"]')?.value.trim() || `Новость ${index + 1}`,
    text: editor.querySelector('[data-field="text"]')?.value.trim() || "Описание новости пока не заполнено.",
    linkLabel: editor.querySelector('[data-field="linkLabel"]')?.value.trim() || "Подробнее",
    linkUrl: editor.querySelector('[data-field="linkUrl"]')?.value.trim() || "#news",
    featured: Boolean(editor.querySelector('[data-field="featured"]')?.checked)
  }));
}

function collectGalleryFromEditors() {
  const editors = Array.from(document.querySelectorAll("[data-gallery-editor]"));

  return editors.map((editor, index) => ({
    id: editor.getAttribute("data-id") || `gallery-${index + 1}`,
    label: editor.querySelector('[data-field="label"]')?.value.trim() || "Галерея",
    title: editor.querySelector('[data-field="title"]')?.value.trim() || `Кадр ${index + 1}`,
    text: editor.querySelector('[data-field="text"]')?.value.trim() || "Описание кадра пока не заполнено.",
    imageUrl: editor.querySelector('[data-field="imageUrl"]')?.value.trim() || "",
    alt: editor.querySelector('[data-field="alt"]')?.value.trim() || `Кадр ${index + 1}`,
    linkUrl: editor.querySelector('[data-field="linkUrl"]')?.value.trim() || "",
    featured: Boolean(editor.querySelector('[data-field="featured"]')?.checked)
  }));
}

const saveMaintenanceState = () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = window.WinlineStore.getStore();
  store.maintenanceEnabled = Boolean(maintenanceEnabledInput?.checked);
  store.maintenanceMessage = maintenanceMessageInput?.value.trim() || "Сайт закрыт на технические работы. Пожалуйста, зайдите позже.";
  window.WinlineStore.saveStore(store);

  let statusMessage = "";

  if (!window.WinlineStore.didLastSavePersist()) {
    statusMessage = getStorageWarning("Настройки техработ применены только в текущей вкладке.");
  }

  renderPanel();

  if (statusMessage && maintenanceStatusText) {
    maintenanceStatusText.textContent = statusMessage;
  }
};

const saveNewsState = () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = window.WinlineStore.getStore();
  store.news = collectNewsFromEditors();
  window.WinlineStore.saveStore(store);

  let message = "Новости сохранены и уже отображаются на сайте.";
  let state = "success";

  if (window.WinlineStore.didLastSavePersist()) {
    message = "Новости сохранены и уже отображаются на сайте.";
    state = "success";
  } else {
    message = getStorageWarning("Новости обновлены только в текущей вкладке.");
    state = "error";
  }

  renderPanel();
  setHelperText(newsHelperText, message, state);
};

const saveGalleryItems = (items, successMessage) => {
  if (!window.WinlineStore) {
    return false;
  }

  const store = window.WinlineStore.getStore();
  store.gallery = items;
  window.WinlineStore.saveStore(store);

  let message = successMessage;
  let state = "success";

  if (window.WinlineStore.didLastSavePersist()) {
    message = successMessage;
    state = "success";
  } else {
    message = getStorageWarning("Галерея обновлена только в текущей вкладке.");
    state = "error";
  }

  renderPanel();
  setHelperText(galleryHelperText, message, state);
  return window.WinlineStore.didLastSavePersist();
};

const saveGalleryState = () => {
  saveGalleryItems(
    collectGalleryFromEditors(),
    "Галерея сохранена и уже доступна на отдельной странице."
  );
};

const importGalleryFiles = async (fileList) => {
  const files = Array.from(fileList || []).filter((file) => String(file.type || "").startsWith("image/"));

  if (!files.length) {
    setHelperText(galleryHelperText, "Выбери хотя бы одно изображение с компьютера.", "error");
    return;
  }

  setHelperText(galleryHelperText, `Обрабатываю файлов: ${files.length}. Это может занять несколько секунд.`, "success");

  const currentItems = getDraftGalleryItems();
  const nextItems = [...currentItems];
  let addedCount = 0;

  for (const file of files) {
    try {
      const imageUrl = await convertImageFileToDataUrl(file);
      const newIndex = nextItems.length;
      const title = buildTitleFromFilename(file.name, newIndex);
      const galleryItem = createGalleryItem(newIndex);

      nextItems.push({
        ...galleryItem,
        label: "ЛОКАЛЬНО",
        title,
        text: `Загружено с компьютера: ${file.name}`,
        imageUrl,
        alt: title,
        linkUrl: "",
        featured: nextItems.length === 0
      });
      addedCount += 1;
    } catch (error) {
      setHelperText(galleryHelperText, `Не удалось обработать файл ${file.name}. Попробуй другое изображение.`, "error");
    }
  }

  if (!addedCount) {
    return;
  }

  saveGalleryItems(
    nextItems,
    `Добавлено файлов: ${addedCount}. Галерея уже обновлена.`
  );
};

const replaceGalleryImageFromFile = async (editor, file) => {
  if (!editor || !file) {
    return;
  }

  const editorId = editor.getAttribute("data-id");
  const galleryItems = getDraftGalleryItems();
  const itemIndex = galleryItems.findIndex((item) => item.id === editorId);

  if (itemIndex === -1) {
    return;
  }

  setHelperText(galleryHelperText, `Подготавливаю изображение ${file.name}...`, "success");

  try {
    const imageUrl = await convertImageFileToDataUrl(file);
    const currentItem = galleryItems[itemIndex];
    const generatedTitle = buildTitleFromFilename(file.name, itemIndex);

    galleryItems[itemIndex] = {
      ...currentItem,
      imageUrl,
      title: !currentItem.title || /^Кадр \d+$/i.test(currentItem.title) ? generatedTitle : currentItem.title,
      alt: !currentItem.alt || /^Кадр \d+$/i.test(currentItem.alt) ? generatedTitle : currentItem.alt,
      text: !currentItem.text || currentItem.text === "Описание кадра пока не заполнено."
        ? `Загружено с компьютера: ${file.name}`
        : currentItem.text
    };

    saveGalleryItems(
      galleryItems,
      `Изображение для карточки «${galleryItems[itemIndex].title}» обновлено.`
    );
  } catch (error) {
    setHelperText(galleryHelperText, `Не удалось загрузить файл ${file.name}. Попробуй другое изображение.`, "error");
  }
};

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (errorText) {
    errorText.textContent = "";
  }

  try {
    const hash = await sha256(passwordInput?.value ?? "");

    if (hash !== ADMIN_PASSWORD_HASH) {
      if (errorText) {
        errorText.textContent = "Неверный пароль";
      }
      passwordInput?.select();
      return;
    }

    sessionStorage.setItem(ADMIN_PAGE_SESSION_KEY, "1");
    setAuthenticated(true);
    renderPanel();
  } catch (error) {
    if (errorText) {
      errorText.textContent = "Браузер не поддерживает безопасную проверку пароля";
    }
  }
});

copyIpButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("winlineworld.veroid.fun");
    copyIpButton.textContent = "IP скопирован";
    window.setTimeout(() => {
      copyIpButton.textContent = "Скопировать IP";
    }, 1800);
  } catch (error) {
    copyIpButton.textContent = "Скопируйте вручную";
  }
});

logoutButton?.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_PAGE_SESSION_KEY);
  setAuthenticated(false);
  loginForm?.reset();
});

saveMaintenanceButton?.addEventListener("click", saveMaintenanceState);
saveNewsButton?.addEventListener("click", saveNewsState);
saveGalleryButton?.addEventListener("click", saveGalleryState);

addNewsButton?.addEventListener("click", () => {
  if (!window.WinlineStore) {
    return;
  }

  const draftNews = getDraftNewsItems();
  const store = window.WinlineStore.getStore();
  const nextNews = createNews(draftNews.length);
  store.news = [...draftNews, nextNews];
  renderNewsEditors(window.WinlineStore.normalizeStore(store));
  setHelperText(newsHelperText, "Новая новость добавлена. Не забудь сохранить изменения.", "success");
});

addGalleryButton?.addEventListener("click", () => {
  if (!window.WinlineStore) {
    return;
  }

  const draftGallery = getDraftGalleryItems();
  const store = window.WinlineStore.getStore();
  const nextGalleryItem = createGalleryItem(draftGallery.length);
  store.gallery = [...draftGallery, nextGalleryItem];
  renderGalleryEditors(window.WinlineStore.normalizeStore(store));
  setHelperText(galleryHelperText, "Новый кадр добавлен. Можно выбрать ссылку или локальный файл.", "success");
});

galleryImportInput?.addEventListener("change", async (event) => {
  const input = event.currentTarget;
  const files = input?.files;

  try {
    await importGalleryFiles(files);
  } finally {
    if (input) {
      input.value = "";
    }
  }
});

newsEditors?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-news]");

  if (!removeButton) {
    return;
  }

  const editor = removeButton.closest("[data-news-editor]");
  editor?.remove();
  setHelperText(newsHelperText, "Новость удалена из списка. Нажми «Сохранить новости», чтобы применить изменения.", "success");
});

galleryEditors?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-gallery]");

  if (!removeButton) {
    return;
  }

  const editor = removeButton.closest("[data-gallery-editor]");
  editor?.remove();
  setHelperText(galleryHelperText, "Кадр удален из списка. Нажми «Сохранить галерею», чтобы применить изменения.", "success");
});

galleryEditors?.addEventListener("input", (event) => {
  const displayInput = event.target.closest('[data-field="imageUrlDisplay"]');

  if (!displayInput) {
    return;
  }

  const editor = displayInput.closest("[data-gallery-editor]");
  const hiddenInput = editor?.querySelector('[data-field="imageUrl"]');

  if (!hiddenInput) {
    return;
  }

  hiddenInput.value = displayInput.value.trim();
});

galleryEditors?.addEventListener("change", async (event) => {
  const fileInput = event.target.closest('[data-field="localImageFile"]');

  if (!fileInput) {
    return;
  }

  const editor = fileInput.closest("[data-gallery-editor]");
  const file = fileInput.files?.[0];

  try {
    await replaceGalleryImageFromFile(editor, file);
  } finally {
    fileInput.value = "";
  }
});

if (sessionStorage.getItem(ADMIN_PAGE_SESSION_KEY) === "1") {
  setAuthenticated(true);
  renderPanel();
} else {
  setAuthenticated(false);
}

window.addEventListener("winlineworld:store-updated", () => {
  renderPanel();
});
