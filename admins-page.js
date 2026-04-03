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
const ADMIN_PAGE_SESSION_KEY = "winlineworld_admin_panel_session";
const ADMIN_PASSWORD_HASH = "84e3e4d71a7e3696a29ba8052d1ad310700b31e51d09a06b1a3bd5eaa420456a";

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
};

const saveMaintenanceState = () => {
  if (!window.WinlineStore) {
    return;
  }

  const store = window.WinlineStore.getStore();
  store.maintenanceEnabled = Boolean(maintenanceEnabledInput?.checked);
  store.maintenanceMessage = maintenanceMessageInput?.value.trim() || "Сайт находится на технической поддержке. Пожалуйста, зайдите позже.";
  const savedStore = window.WinlineStore.saveStore(store);
  renderPanel(savedStore);
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

if (sessionStorage.getItem(ADMIN_PAGE_SESSION_KEY) === "1") {
  setAuthenticated(true);
  renderPanel();
} else {
  setAuthenticated(false);
}

window.addEventListener("winlineworld:store-updated", () => {
  renderPanel();
});
