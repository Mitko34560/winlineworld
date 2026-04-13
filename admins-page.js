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
const galleryHelperText = document.getElementById("galleryHelperText");
const ADMIN_PAGE_SESSION_KEY = "winlineworld_admin_panel_session";
const ADMIN_PASSWORD_HASH = "d3171829b03043f80e6b1ebcced54c866f86f1a78b173da1f718a18810d5549b";

const setAuthenticated = (authenticated) => {
  if (!loginPanel || !dashboard) {
    return;
  }

  loginPanel.hidden = authenticated;
  dashboard.classList.toggle("is-open", authenticated);
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

  if (newsHelperText) {
    newsHelperText.textContent = items.length
      ? `Новостей в блоке: ${items.length}`
      : "Новостей пока нет. Добавь первую запись.";
  }
};

const renderGalleryEditors = (store) => {
  if (!galleryEditors || !window.WinlineStore) {
    return;
  }

  const { escapeHtml } = window.WinlineStore;
  const items = Array.isArray(store.gallery) ? store.gallery : [];

  galleryEditors.innerHTML = items.map((item, index) => `
    <article class="editor-card${item.featured ? " featured" : ""}" data-gallery-editor data-id="${escapeHtml(item.id)}">
      <div class="editor-meta">
        <div>
          <span class="chip">Gallery ${index + 1}</span>
          <h3 class="editor-title">${escapeHtml(item.title || `Кадр ${index + 1}`)}</h3>
        </div>
        <button class="small-button danger" type="button" data-remove-gallery>Удалить</button>
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
        <label class="label">Ссылка на изображение</label>
        <input class="input" type="text" data-field="imageUrl" value="${escapeHtml(item.imageUrl)}" placeholder="https://... или images/spawn.webp">
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
  `).join("");

  if (galleryHelperText) {
    galleryHelperText.textContent = items.length
      ? `Кадров в галерее: ${items.length}`
      : "Галерея пока пуста. Добавь первый кадр.";
  }
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

const collectNewsFromEditors = () => {
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
};

const collectGalleryFromEditors = () => {
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
};

const saveMaintenanceState = () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = window.WinlineStore.getStore();
  store.maintenanceEnabled = Boolean(maintenanceEnabledInput?.checked);
  store.maintenanceMessage = maintenanceMessageInput?.value.trim() || "Сайт закрыт на технические работы. Пожалуйста, зайдите позже.";
  window.WinlineStore.saveStore(store);
  renderPanel();
};

const saveNewsState = () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = window.WinlineStore.getStore();
  store.news = collectNewsFromEditors();
  window.WinlineStore.saveStore(store);

  if (newsHelperText) {
    newsHelperText.textContent = "Новости сохранены и уже отображаются на сайте.";
  }

  renderPanel();
};

const saveGalleryState = () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = window.WinlineStore.getStore();
  store.gallery = collectGalleryFromEditors();
  window.WinlineStore.saveStore(store);

  if (galleryHelperText) {
    galleryHelperText.textContent = "Галерея сохранена и уже доступна на отдельной странице.";
  }

  renderPanel();
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

  const store = window.WinlineStore.getStore();
  const nextNews = createNews(Array.isArray(store.news) ? store.news.length : 0);
  store.news = Array.isArray(store.news) ? [...store.news, nextNews] : [nextNews];
  renderNewsEditors(window.WinlineStore.normalizeStore(store));

  if (newsHelperText) {
    newsHelperText.textContent = "Новая новость добавлена. Не забудь сохранить изменения.";
  }
});

addGalleryButton?.addEventListener("click", () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = window.WinlineStore.getStore();
  const nextGalleryItem = createGalleryItem(Array.isArray(store.gallery) ? store.gallery.length : 0);
  store.gallery = Array.isArray(store.gallery) ? [...store.gallery, nextGalleryItem] : [nextGalleryItem];
  renderGalleryEditors(window.WinlineStore.normalizeStore(store));

  if (galleryHelperText) {
    galleryHelperText.textContent = "Новый кадр добавлен. Не забудь сохранить галерею.";
  }
});

newsEditors?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-news]");

  if (!removeButton) {
    return;
  }

  const editor = removeButton.closest("[data-news-editor]");
  editor?.remove();

  if (newsHelperText) {
    newsHelperText.textContent = "Новость удалена из списка. Нажми «Сохранить новости», чтобы применить изменения.";
  }
});

galleryEditors?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-gallery]");

  if (!removeButton) {
    return;
  }

  const editor = removeButton.closest("[data-gallery-editor]");
  editor?.remove();

  if (galleryHelperText) {
    galleryHelperText.textContent = "Кадр удален из списка. Нажми «Сохранить галерею», чтобы применить изменения.";
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
