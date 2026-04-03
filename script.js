const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const toast = document.getElementById("toast");
const brandLogos = document.querySelectorAll(".brand-logo");
const donateGrid = document.getElementById("donateGrid");
const newsGrid = document.querySelector(".news-layout");
const shopNotice = document.getElementById("shopNotice");
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
const ADMIN_PASSWORD_HASH = "84e3e4d71a7e3696a29ba8052d1ad310700b31e51d09a06b1a3bd5eaa420456a";
const MAINTENANCE_LABEL = "РЎР°Р№С‚ Р·Р°РєСЂС‹С‚ РЅР° С‚РµС…РЅРёС‡РµСЃРєРёРµ СЂР°Р±РѕС‚С‹";

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
  showToast("Р’С‹С…РѕРґ РёР· Р°РґРјРёРЅ-РїР°РЅРµР»Рё РІС‹РїРѕР»РЅРµРЅ");
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
    showToast("IP СЃРµСЂРІРµСЂР° СЃРєРѕРїРёСЂРѕРІР°РЅ");
    return true;
  } catch (error) {
    const fallbackInput = document.createElement("input");
    fallbackInput.value = text;
    document.body.appendChild(fallbackInput);
    fallbackInput.select();

    try {
      document.execCommand("copy");
      showToast("IP СЃРµСЂРІРµСЂР° СЃРєРѕРїРёСЂРѕРІР°РЅ");
      return true;
    } catch (fallbackError) {
      showToast("РЎРєРѕРїРёСЂСѓР№С‚Рµ РІСЂСѓС‡РЅСѓСЋ: " + text);
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
  const themes = [
    { className: "theme-nova", symbol: "N" },
    { className: "theme-orbit", symbol: "O" },
    { className: "theme-pulse", symbol: "P" },
    { className: "theme-aether", symbol: "A" },
    { className: "theme-vortex", symbol: "V" },
    { className: "theme-nebula", symbol: "N" },
    { className: "theme-titan", symbol: "T" },
    { className: "theme-eclipse", symbol: "E" },
    { className: "theme-cosmos", symbol: "C" }
  ];

  const cards = store.privileges.map((privilege, index) => {
    const theme = themes[index % themes.length];
    const perks = privilege.perks.length
      ? privilege.perks.map((perk) => `<li>${escapeHtml(perk)}</li>`).join("")
      : "<li>Список бонусов скоро появится</li>";
    const buyUrl = privilege.stripeUrl.trim();
    const hasStripe = /^https?:\/\//i.test(buyUrl);
    const maintenanceMode = Boolean(store.maintenanceEnabled);
    const cardClasses = `donate-card reveal ${theme.className}${privilege.featured ? " featured-card" : ""}${maintenanceMode ? " is-maintenance" : ""}`;
    const canOpen = hasStripe && !maintenanceMode;
    const buttonClasses = `donate-card-action${canOpen ? "" : " is-disabled"}`;
    const buttonAttrs = canOpen
      ? `href="${escapeHtml(buyUrl)}" target="_blank" rel="noopener noreferrer"`
      : `href="admins.html"`;
    const note = maintenanceMode
      ? MAINTENANCE_LABEL
      : hasStripe
      ? "Переход на защищенную страницу Stripe."
      : "Stripe-ссылка пока не настроена в админ-панели.";
    const title = escapeHtml(privilege.name);
    const price = escapeHtml(formatPrice(privilege));
    const description = escapeHtml(privilege.description);

    return `
      <article class="${cardClasses}">
        <div class="card-glow"></div>
        <div class="donate-card-media">
          <span class="donate-price">${price}</span>
          <span class="donate-ribbon">-30%</span>
          <div class="donate-art">
            <div class="donate-art-core">
              <img class="donate-art-logo" src="logo.avif" alt="" aria-hidden="true">
              <span class="donate-art-letter">${escapeHtml(theme.symbol)}</span>
            </div>
          </div>
        </div>
        <div class="donate-card-body">
          <div class="donate-card-head">
            <div class="donate-card-copy">
              <h3 class="donate-title">${title}</h3>
              <p class="donate-description">${description}</p>
            </div>
            <a class="${buttonClasses}" ${buttonAttrs} aria-label="${canOpen ? `Открыть ${title}` : `Недоступно: ${title}`}">
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <ul class="donate-perks">${perks}</ul>
          <span class="buy-note">${escapeHtml(note)}</span>
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
  adminPrivilegeSummary.innerHTML = store.privileges.map((privilege) => {
    const stripeState = privilege.stripeUrl ? "Stripe РїРѕРґРєР»СЋС‡РµРЅ" : "Stripe РЅРµ РЅР°СЃС‚СЂРѕРµРЅ";
    return `<li>${escapeHtml(privilege.name)} вЂ” ${escapeHtml(formatPrice(privilege))} вЂў ${escapeHtml(stripeState)}</li>`;
  }).join("");
};

const renderNewsCards = (store) => {
  if (!newsGrid || !window.WinlineStore) {
    return;
  }

  const { escapeHtml } = window.WinlineStore;
  const cards = store.news.map((item) => {
    const cardClass = `news-card reveal${item.featured ? " news-card-featured" : ""}`;
    const href = item.linkUrl && item.linkUrl.trim() ? item.linkUrl.trim() : "#news";
    const external = /^https?:\/\//i.test(href);
    const attrs = external
      ? `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"`
      : `href="${escapeHtml(href)}"`;

    return `
      <article class="${cardClass}">
        <span class="news-tag">${escapeHtml(item.tag)}</span>
        <span class="news-date">${escapeHtml(item.date)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
        <a class="news-link" ${attrs}>${escapeHtml(item.linkLabel)}</a>
      </article>
    `;
  }).join("");

  newsGrid.innerHTML = cards || `
    <article class="news-card reveal">
      <span class="news-tag">Новости</span>
      <span class="news-date">Скоро</span>
      <h3>Раздел новостей пока пуст</h3>
      <p>Добавьте первую новость через админ-панель, и она сразу появится на сайте.</p>
      <a class="news-link" href="admins.html">Открыть админ-панель</a>
    </article>
  `;

  observeRevealItems(newsGrid);
};

const renderStore = (store) => {
  if (!store) {
    return;
  }

  const maintenanceMode = Boolean(store.maintenanceEnabled);

  siteShell.forEach((element) => {
    element.hidden = maintenanceMode;
  });

  if (maintenanceScreen) {
    maintenanceScreen.hidden = !maintenanceMode;
  }

  if (maintenanceScreenText) {
    maintenanceScreenText.textContent = store.maintenanceMessage || MAINTENANCE_LABEL;
  }

  if (shopNotice) {
    shopNotice.textContent = maintenanceMode
      ? MAINTENANCE_LABEL
      : store.shopNotice;
  }

  renderDonateCards(store);
  renderNewsCards(store);
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
      adminError.textContent = "Р‘СЂР°СѓР·РµСЂ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ Р±РµР·РѕРїР°СЃРЅСѓСЋ РїСЂРѕРІРµСЂРєСѓ РїР°СЂРѕР»СЏ";
    }
    return;
  }

  if (hashedPassword !== ADMIN_PASSWORD_HASH) {
    if (adminError) {
      adminError.textContent = "РќРµРІРµСЂРЅС‹Р№ РїР°СЂРѕР»СЊ";
    }
    adminPasswordInput?.select();
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  closeAdminAuth();
  openAdminPanel();
  showToast("РђРґРјРёРЅ-РїР°РЅРµР»СЊ РѕС‚РєСЂС‹С‚Р°");
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
    threshold: 0.16,
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

