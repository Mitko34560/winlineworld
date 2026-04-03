const loginPanel = document.getElementById("loginPanel");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const errorText = document.getElementById("errorText");
const toastText = document.getElementById("toastText");
const logoutButton = document.getElementById("logoutButton");
const addPrivilegeButton = document.getElementById("addPrivilegeButton");
const saveStoreButton = document.getElementById("saveStoreButton");
const resetStoreButton = document.getElementById("resetStoreButton");
const privilegeEditors = document.getElementById("privilegeEditors");
const summaryList = document.getElementById("summaryList");
const shopNoticeInput = document.getElementById("shopNoticeInput");
const stripeHelpUrlInput = document.getElementById("stripeHelpUrlInput");
const stripeHelpLink = document.getElementById("stripeHelpLink");
const homeLink = document.getElementById("homeLink");
const ADMIN_FILE_SESSION_KEY = "winlineworld_admin_file_session";
const ADMIN_PASSWORD_HASH = "84e3e4d71a7e3696a29ba8052d1ad310700b31e51d09a06b1a3bd5eaa420456a";

const showToast = (message) => {
  if (toastText) {
    toastText.textContent = message;
  }
};

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

const createPrivilege = (index = 0) => ({
  id: `custom-${Date.now()}-${index}`,
  name: `NEW ${index + 1}`,
  priceNumber: 0,
  priceLabel: "0₽",
  description: "Заполните описание привилегии.",
  perks: [],
  stripeUrl: "",
  featured: false
});

const renderSummary = (store) => {
  if (!summaryList || !window.WinlineStore) {
    return;
  }

  const { escapeHtml, formatPrice } = window.WinlineStore;
  summaryList.innerHTML = store.privileges.map((privilege) => {
    const stripeStatus = privilege.stripeUrl ? "Stripe готов" : "Stripe не задан";
    return `<li>${escapeHtml(privilege.name)} — ${escapeHtml(formatPrice(privilege))} • ${escapeHtml(stripeStatus)}</li>`;
  }).join("");
};

const renderPrivilegeEditors = (store) => {
  if (!privilegeEditors || !window.WinlineStore) {
    return;
  }

  const { escapeHtml } = window.WinlineStore;
  privilegeEditors.innerHTML = store.privileges.map((privilege, index) => {
    const perksText = privilege.perks.join("\n");
    return `
      <article class="editor-card${privilege.featured ? " featured" : ""}" data-privilege-editor data-id="${escapeHtml(privilege.id)}">
        <div class="editor-meta">
          <div>
            <span class="chip">Privilege ${index + 1}</span>
            <h3 class="editor-title">${escapeHtml(privilege.name)}</h3>
          </div>
          <button class="small-button danger" type="button" data-remove-privilege>Удалить</button>
        </div>

        <div class="field">
          <label class="label">Название</label>
          <input class="input" type="text" data-field="name" value="${escapeHtml(privilege.name)}" placeholder="Название привилегии">
        </div>

        <div class="field">
          <label class="label">Цена числом</label>
          <input class="input" type="number" min="0" step="1" data-field="priceNumber" value="${escapeHtml(String(privilege.priceNumber))}" placeholder="299">
        </div>

        <div class="field">
          <label class="label">Текст цены</label>
          <input class="input" type="text" data-field="priceLabel" value="${escapeHtml(privilege.priceLabel)}" placeholder="299₽">
        </div>

        <div class="field">
          <label class="label">Описание</label>
          <textarea class="textarea" data-field="description" placeholder="Краткое описание привилегии">${escapeHtml(privilege.description)}</textarea>
        </div>

        <div class="field">
          <label class="label">Плюшки, по одной на строку</label>
          <textarea class="textarea" data-field="perks" placeholder="/kit elite&#10;/fly&#10;Эксклюзивный статус">${escapeHtml(perksText)}</textarea>
        </div>

        <div class="field">
          <label class="label">Stripe ссылка</label>
          <input class="input" type="url" data-field="stripeUrl" value="${escapeHtml(privilege.stripeUrl)}" placeholder="https://buy.stripe.com/...">
        </div>

        <label class="check-row">
          <input type="checkbox" data-field="featured" ${privilege.featured ? "checked" : ""}>
          <span>Выделять как популярную привилегию</span>
        </label>
      </article>
    `;
  }).join("");
};

const renderStore = (store) => {
  if (!store) {
    return;
  }

  if (shopNoticeInput) {
    shopNoticeInput.value = store.shopNotice;
  }

  if (stripeHelpUrlInput) {
    stripeHelpUrlInput.value = store.stripeHelpUrl;
  }

  if (stripeHelpLink) {
    stripeHelpLink.href = store.stripeHelpUrl;
  }

  renderPrivilegeEditors(store);
  renderSummary(store);
};

const collectStoreFromEditor = () => {
  const editors = Array.from(document.querySelectorAll("[data-privilege-editor]"));
  const privileges = editors.map((editor, index) => {
    const name = editor.querySelector('[data-field="name"]')?.value.trim() || `PRIVILEGE ${index + 1}`;
    const priceNumber = Number(editor.querySelector('[data-field="priceNumber"]')?.value || 0);
    const priceLabel = editor.querySelector('[data-field="priceLabel"]')?.value.trim() || `${priceNumber}₽`;
    const description = editor.querySelector('[data-field="description"]')?.value.trim() || "Описание привилегии пока не заполнено.";
    const perks = editor.querySelector('[data-field="perks"]')?.value || "";
    const stripeUrl = editor.querySelector('[data-field="stripeUrl"]')?.value.trim() || "";
    const featured = Boolean(editor.querySelector('[data-field="featured"]')?.checked);

    return {
      id: editor.getAttribute("data-id") || `privilege-${index + 1}`,
      name,
      priceNumber: Number.isFinite(priceNumber) ? priceNumber : 0,
      priceLabel,
      description,
      perks,
      stripeUrl,
      featured
    };
  });

  return {
    shopNotice: shopNoticeInput?.value.trim() || "",
    stripeHelpUrl: stripeHelpUrlInput?.value.trim() || "",
    privileges
  };
};

const saveCurrentStore = () => {
  if (!window.WinlineStore) {
    return;
  }

  const currentStore = collectStoreFromEditor();
  const savedStore = window.WinlineStore.saveStore(currentStore);
  renderStore(savedStore);
  showToast("Изменения сохранены. Главная страница уже может читать новые привилегии.");
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

    sessionStorage.setItem(ADMIN_FILE_SESSION_KEY, "1");
    setAuthenticated(true);
    showToast("Админ-панель открыта");
    renderStore(window.WinlineStore?.getStore());
  } catch (error) {
    if (errorText) {
      errorText.textContent = "Браузер не поддерживает безопасную проверку пароля";
    }
  }
});

logoutButton?.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_FILE_SESSION_KEY);
  setAuthenticated(false);
  loginForm?.reset();
  showToast("");
});

addPrivilegeButton?.addEventListener("click", () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = collectStoreFromEditor();
  store.privileges.push(createPrivilege(store.privileges.length));
  renderStore(window.WinlineStore.normalizeStore(store));
  showToast("Новая привилегия добавлена. Не забудьте сохранить изменения.");
});

saveStoreButton?.addEventListener("click", saveCurrentStore);

resetStoreButton?.addEventListener("click", () => {
  if (!window.WinlineStore) {
    return;
  }

  const reset = window.confirm("Сбросить все привилегии и Stripe-ссылки к значениям по умолчанию?");
  if (!reset) {
    return;
  }

  const store = window.WinlineStore.resetStore();
  renderStore(store);
  showToast("Магазин сброшен к значениям по умолчанию.");
});

stripeHelpUrlInput?.addEventListener("input", () => {
  if (stripeHelpLink) {
    stripeHelpLink.href = stripeHelpUrlInput.value.trim() || "https://dashboard.stripe.com/payment-links";
  }
});

privilegeEditors?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-privilege]");

  if (!removeButton) {
    return;
  }

  const editor = removeButton.closest("[data-privilege-editor]");
  editor?.remove();
  showToast("Привилегия удалена. Сохраните изменения, чтобы применить их.");
});

homeLink?.addEventListener("click", () => {
  saveCurrentStore();
});

if (sessionStorage.getItem(ADMIN_FILE_SESSION_KEY) === "1") {
  setAuthenticated(true);
  renderStore(window.WinlineStore?.getStore());
  showToast("Сессия администратора уже активна");
} else {
  setAuthenticated(false);
}

window.addEventListener("winlineworld:store-updated", (event) => {
  renderStore(event.detail);
});
