const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const copyTriggers = document.querySelectorAll("[data-copy]");
const revealItems = document.querySelectorAll(".reveal");
const toast = document.getElementById("toast");
const brandLogos = document.querySelectorAll(".brand-logo");
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

let adminTriggerCount = 0;
let adminTriggerTimer = 0;

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
  showToast("Выход из админ-панели выполнен");
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
      showToast("Скопируйте IP вручную: " + text);
      return false;
    } finally {
      fallbackInput.remove();
    }
  }
};

copyTriggers.forEach((trigger) => {
  trigger.addEventListener("click", async (event) => {
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
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -40px 0px"
  });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
