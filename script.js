const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const toast = document.getElementById("toast");
const brandLogos = document.querySelectorAll(".brand-logo");
const donateGrid = document.getElementById("donateGrid");
const newsGrid = document.querySelector(".news-layout");
const galleryGrid = document.getElementById("galleryGrid");
const galleryCount = document.getElementById("galleryCount");
const shopNotice = document.getElementById("shopNotice");
const maintenanceBanner = document.getElementById("maintenanceBanner");
const maintenanceText = document.getElementById("maintenanceText");
const maintenanceScreen = document.getElementById("maintenanceScreen");
const maintenanceScreenText = document.getElementById("maintenanceScreenText");
const siteShell = document.querySelectorAll("[data-site-shell]");
const adminPrivilegeSummary = document.getElementById("adminPrivilegeSummary");
const adminAuth = document.getElementById("adminAuth");
const adminPanel = document.getElementById("adminPanel");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPasswordInput = document.getElementById("adminPassword");
const adminError = document.getElementById("adminError");
const adminCloseButtons = document.querySelectorAll("[data-admin-close]");
const adminLogoutButtons = document.querySelectorAll("[data-admin-logout]");
const adminClosePanelButtons = document.querySelectorAll("[data-admin-close-panel]");

const ADMIN_SESSION_KEY = "winlineworld_admin_session";
const ADMIN_PASSWORD_HASH = "d3171829b03043f80e6b1ebcced54c866f86f1a78b173da1f718a18810d5549b";
const MAINTENANCE_LABEL = "Сайт временно закрыт на технические работы.";

let adminTriggerCount = 0;
let adminTriggerTimer = 0;
let revealObserver = null;

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const showToast = (message) => {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
};

const setAdminVisibility = (element, isOpen) => {
  if (!element) {
    return;
  }

  element.classList.toggle("is-open", isOpen);
  element.setAttribute("aria-hidden", String(!isOpen));
};

const openAdminAuth = () => {
  setAdminVisibility(adminAuth, true);
  if (adminError) {
    adminError.textContent = "";
  }
  window.setTimeout(() => adminPasswordInput?.focus(), 80);
};

const closeAdminAuth = () => {
  setAdminVisibility(adminAuth, false);
  adminLoginForm?.reset();
  if (adminError) {
    adminError.textContent = "";
  }
};

const openAdminPanel = () => {
  setAdminVisibility(adminPanel, true);
};

const closeAdminPanel = () => {
  setAdminVisibility(adminPanel, false);
};

const logoutAdmin = () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  closeAdminPanel();
  closeAdminAuth();
  showToast("Выход из панели выполнен");
};

const isAdminSessionActive = () => sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";

const sha256 = async (value) => {
  const encoded = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const requestAdminAccess = () => {
  if (isAdminSessionActive()) {
    openAdminPanel();
    return;
  }

  openAdminAuth();
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast("IP сервера скопирован");
    return true;
  } catch (error) {
    const fallbackInput = document.createElement("input");
    fallbackInput.value = text;
    document.body.appendChild(fallbackInput);
    fallbackInput.select();

    try {
      document.execCommand("copy");
      showToast("IP сервера скопирован");
      return true;
    } catch (fallbackError) {
      showToast(`Скопируйте вручную: ${text}`);
      return false;
    } finally {
      fallbackInput.remove();
    }
  }
};

const observeRevealItems = (scope = document) => {
  const items = scope.querySelectorAll(".reveal");

  items.forEach((item) => {
    if (item.dataset.revealBound === "1") {
      return;
    }

    item.dataset.revealBound = "1";

    if (revealObserver) {
      revealObserver.observe(item);
    } else {
      item.classList.add("is-visible");
    }
  });
};

const renderDonateCards = (store) => {
  if (!donateGrid || !window.WinlineStore) {
    return;
  }

  const { escapeHtml, formatPrice } = window.WinlineStore;
  const maintenanceMode = Boolean(store.maintenanceEnabled);
  const themes = [
    "theme-nova",
    "theme-orbit",
    "theme-pulse",
    "theme-aether",
    "theme-vortex",
    "theme-nebula",
    "theme-titan",
    "theme-eclipse",
    "theme-cosmos"
  ];

  const cards = store.privileges.map((privilege, index) => {
    const title = escapeHtml(privilege.name);
    const description = escapeHtml(privilege.description);
    const price = escapeHtml(formatPrice(privilege));
    const perks = privilege.perks.length
      ? privilege.perks.map((perk) => `<li>${escapeHtml(perk)}</li>`).join("")
      : "<li>Список бонусов скоро появится</li>";
    const buyUrl = privilege.stripeUrl.trim();
    const hasStripe = /^https?:\/\//i.test(buyUrl);
    const canOpen = hasStripe && !maintenanceMode;
    const note = maintenanceMode
      ? MAINTENANCE_LABEL
      : hasStripe
      ? "Переход на защищенную страницу оплаты Stripe."
      : "Stripe-ссылка пока не настроена.";
    const buttonAttrs = canOpen
      ? `href="${escapeHtml(buyUrl)}" target="_blank" rel="noopener noreferrer"`
      : 'href="admins.html"';
    const buttonLabel = canOpen ? "Купить" : "Недоступно";
    const cardClass = `donate-card reveal ${themes[index % themes.length]}${privilege.featured ? " featured-card" : ""}${maintenanceMode ? " is-maintenance" : ""}`;

    return `
      <article class="${cardClass}">
        <div class="card-stripe" aria-hidden="true"></div>
        <div class="donate-card-top">
          <span class="donate-badge">${String(index + 1).padStart(2, "0")}</span>
          <div class="donate-price-wrap">
            <span class="donate-price-label">Store tier</span>
            <strong class="donate-price">${price}</strong>
          </div>
        </div>

        <div class="donate-card-body">
          <div class="donate-card-head">
            <h3 class="donate-title">${title}</h3>
            ${privilege.featured ? '<span class="donate-chip">Выбор сезона</span>' : ""}
          </div>
          <p class="donate-description">${description}</p>
          <ul class="donate-perks">${perks}</ul>
        </div>

        <div class="donate-card-footer">
          <span class="buy-note">${escapeHtml(note)}</span>
          <a class="donate-card-action${canOpen ? "" : " is-disabled"}" ${buttonAttrs} aria-label="${canOpen ? `Открыть ${title}` : `Недоступно: ${title}`}">${buttonLabel}</a>
        </div>
      </article>
    `;
  }).join("");

  donateGrid.innerHTML = cards;
  observeRevealItems(donateGrid);
};

const renderAdminSummary = (store) => {
  if (!adminPrivilegeSummary || !window.WinlineStore) {
    return;
  }

  const { escapeHtml, formatPrice } = window.WinlineStore;
  const privileges = Array.isArray(store.privileges) ? store.privileges : [];

  adminPrivilegeSummary.innerHTML = privileges.length
    ? privileges.map((privilege) => {
      const stripeState = privilege.stripeUrl ? "Stripe готов" : "Stripe не задан";
      return `<li>${escapeHtml(privilege.name)} — ${escapeHtml(formatPrice(privilege))} • ${escapeHtml(stripeState)}</li>`;
    }).join("")
    : "<li>Привилегии пока не добавлены.</li>";
};

const renderNewsCards = (store) => {
  if (!newsGrid || !window.WinlineStore) {
    return;
  }

  const { escapeHtml } = window.WinlineStore;
  const items = Array.isArray(store.news) ? store.news : [];

  newsGrid.innerHTML = items.length
    ? items.map((item) => {
      const href = item.linkUrl && item.linkUrl.trim() ? item.linkUrl.trim() : "#news";
      const external = /^https?:\/\//i.test(href);
      const attrs = external
        ? `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"`
        : `href="${escapeHtml(href)}"`;

      return `
        <article class="news-card reveal${item.featured ? " news-card-featured" : ""}">
          <div class="news-meta">
            <span class="news-tag">${escapeHtml(item.tag)}</span>
            <span class="news-date">${escapeHtml(item.date)}</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
          <a class="news-link" ${attrs}>${escapeHtml(item.linkLabel)}</a>
        </article>
      `;
    }).join("")
    : `
      <article class="news-card reveal">
        <div class="news-meta">
          <span class="news-tag">Новости</span>
          <span class="news-date">Скоро</span>
        </div>
        <h3>Раздел новостей пока пуст</h3>
        <p>Добавьте первую новость через админ-панель, и она сразу появится на сайте.</p>
        <a class="news-link" href="admins.html">Открыть админ-панель</a>
      </article>
    `;

  observeRevealItems(newsGrid);
};

const formatGalleryCount = (count) => {
  const absoluteCount = Math.abs(Number(count) || 0);
  const mod100 = absoluteCount % 100;
  const mod10 = absoluteCount % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return `${absoluteCount} кадров`;
  }

  if (mod10 === 1) {
    return `${absoluteCount} кадр`;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return `${absoluteCount} кадра`;
  }

  return `${absoluteCount} кадров`;
};

const renderGalleryCards = (store) => {
  if (!galleryGrid || !window.WinlineStore) {
    return;
  }

  const { escapeHtml } = window.WinlineStore;
  const items = Array.isArray(store.gallery) ? store.gallery : [];

  if (galleryCount) {
    galleryCount.textContent = formatGalleryCount(items.length);
  }

  galleryGrid.innerHTML = items.length
    ? items.map((item) => {
      const hasImage = Boolean(item.imageUrl && item.imageUrl.trim());
      const href = item.linkUrl && item.linkUrl.trim();
      const external = href && /^https?:\/\//i.test(href);
      const media = hasImage
        ? `<img class="gallery-image" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.alt || item.title)}" loading="lazy">`
        : `
          <div class="gallery-placeholder" aria-hidden="true">
            <img src="logo.avif" alt="">
            <span>${escapeHtml(item.label || "WinlineWorld")}</span>
          </div>
        `;
      const link = href
        ? `<a class="gallery-card-link" href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>Открыть</a>`
        : "";

      return `
        <article class="gallery-card reveal${item.featured ? " gallery-card-featured" : ""}">
          <div class="gallery-media">
            ${media}
          </div>
          <div class="gallery-copy">
            <span class="gallery-chip">${escapeHtml(item.label)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
            ${link}
          </div>
        </article>
      `;
    }).join("")
    : `
      <article class="gallery-card gallery-empty reveal">
        <div class="gallery-media">
          <div class="gallery-placeholder" aria-hidden="true">
            <img src="logo.avif" alt="">
            <span>WinlineWorld</span>
          </div>
        </div>
        <div class="gallery-copy">
          <span class="gallery-chip">Галерея</span>
          <h3>Раздел пока пуст</h3>
          <p>Добавьте первый кадр через админ-панель, и он сразу появится на этой странице.</p>
          <a class="gallery-card-link" href="admins.html">Открыть админ-панель</a>
        </div>
      </article>
    `;

  observeRevealItems(galleryGrid);
};

const renderStore = (store) => {
  if (!store) {
    return;
  }

  const maintenanceMode = Boolean(store.maintenanceEnabled);
  const maintenanceMessage = store.maintenanceMessage || MAINTENANCE_LABEL;

  siteShell.forEach((element) => {
    element.hidden = maintenanceMode;
  });

  if (maintenanceBanner) {
    maintenanceBanner.hidden = !maintenanceMode;
  }

  if (maintenanceText) {
    maintenanceText.textContent = maintenanceMessage;
  }

  if (maintenanceScreen) {
    maintenanceScreen.hidden = !maintenanceMode;
  }

  if (maintenanceScreenText) {
    maintenanceScreenText.textContent = maintenanceMessage;
  }

  if (shopNotice) {
    shopNotice.textContent = maintenanceMode ? MAINTENANCE_LABEL : store.shopNotice;
  }

  renderDonateCards(store);
  renderNewsCards(store);
  renderGalleryCards(store);
  renderAdminSummary(store);
};

document.addEventListener("click", async (event) => {
  const trigger = event.target.closest("[data-copy]");

  if (!trigger) {
    return;
  }

  const text = trigger.getAttribute("data-copy");

  if (!text) {
    return;
  }

  event.preventDefault();
  await copyText(text);

  const targetHref = trigger.getAttribute("href");
  if (targetHref && targetHref.startsWith("#")) {
    document.querySelector(targetHref)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
});

brandLogos.forEach((logo) => {
  logo.addEventListener("click", () => {
    adminTriggerCount += 1;
    clearTimeout(adminTriggerTimer);

    if (adminTriggerCount >= 7) {
      adminTriggerCount = 0;
      requestAdminAccess();
      return;
    }

    adminTriggerTimer = window.setTimeout(() => {
      adminTriggerCount = 0;
    }, 2600);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "w") {
    event.preventDefault();
    requestAdminAccess();
  }

  if (event.key === "Escape") {
    closeAdminAuth();
    closeAdminPanel();
  }
});

adminCloseButtons.forEach((button) => {
  button.addEventListener("click", closeAdminAuth);
});

adminClosePanelButtons.forEach((button) => {
  button.addEventListener("click", closeAdminPanel);
});

adminLogoutButtons.forEach((button) => {
  button.addEventListener("click", logoutAdmin);
});

adminLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = adminPasswordInput?.value ?? "";
  let hashedPassword = "";

  try {
    hashedPassword = await sha256(password);
  } catch (error) {
    if (adminError) {
      adminError.textContent = "Браузер не поддерживает безопасную проверку пароля";
    }
    return;
  }

  if (hashedPassword !== ADMIN_PASSWORD_HASH) {
    if (adminError) {
      adminError.textContent = "Неверный пароль";
    }
    adminPasswordInput?.select();
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  closeAdminAuth();
  openAdminPanel();
  showToast("Админ-панель открыта");
});

if ("IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.14,
    rootMargin: "0px 0px -40px 0px"
  });
}

observeRevealItems();

if (window.WinlineStore) {
  renderStore(window.WinlineStore.getStore());

  window.addEventListener("winlineworld:store-updated", (event) => {
    renderStore(event.detail);
  });
}
