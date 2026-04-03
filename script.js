const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const copyTriggers = document.querySelectorAll("[data-copy]");
const revealItems = document.querySelectorAll(".reveal");
const toast = document.getElementById("toast");

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
