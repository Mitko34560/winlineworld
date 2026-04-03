(function () {
  const STORAGE_KEY = "winlineworld_store_v1";
  let memoryStore = null;

  const DEFAULT_STORE = {
    version: 1,
    shopNotice: "Оплата проходит через Stripe. Для каждой привилегии можно указать свою ссылку Stripe Checkout или Payment Link.",
    stripeHelpUrl: "https://dashboard.stripe.com/payment-links",
    maintenanceEnabled: false,
    maintenanceMessage: "Сайт находится на технической поддержке. Пожалуйста, зайдите позже.",
    privileges: [
      {
        id: "vip",
        name: "VIP",
        priceNumber: 99,
        priceLabel: "99₽",
        description: "Стартовый набор привилегий, цветной ник, быстрые команды и приятные бонусы.",
        perks: ["/kit vip", "/hat и /feed", "Ускоренный старт"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "premium",
        name: "PREMIUM",
        priceNumber: 199,
        priceLabel: "199₽",
        description: "Расширенные команды для комфортной игры и уверенного преимущества на сервере.",
        perks: ["/kit premium", "/workbench и /heal", "Больше слотов дома"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "elite",
        name: "ELITE",
        priceNumber: 299,
        priceLabel: "299₽",
        description: "Баланс мощности и удобства: усиленные возможности, эффекты и заметный статус.",
        perks: ["/kit elite", "/fly в безопасных зонах", "Эксклюзивные эффекты"],
        stripeUrl: "",
        featured: true
      },
      {
        id: "legend",
        name: "LEGEND",
        priceNumber: 499,
        priceLabel: "499₽",
        description: "Для тех, кто хочет максимум возможностей, быстрый прогресс и яркий статус.",
        perks: ["/kit legend", "/near и /repair", "Расширенные варпы"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "admin",
        name: "ADMIN",
        priceNumber: 999,
        priceLabel: "999₽",
        description: "Максимальная привилегия с топовым набором команд, эффектов и персональным стилем.",
        perks: ["/kit admin", "Уникальные префиксы", "Премиальный пакет бонусов"],
        stripeUrl: "",
        featured: false
      }
    ]
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const safeString = (value, fallback = "") => {
    if (typeof value !== "string") {
      return fallback;
    }

    const trimmed = value.trim();
    return trimmed || fallback;
  };

  const createId = (name, index) => {
    const normalized = String(name || `privilege-${index + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return normalized || `privilege-${index + 1}`;
  };

  const normalizePerks = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => safeString(item))
        .filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  const normalizePrivilege = (privilege, index) => {
    const source = privilege && typeof privilege === "object" ? privilege : {};
    const name = safeString(source.name, `PRIVILEGE ${index + 1}`);
    const priceNumber = Number(source.priceNumber);
    const normalizedPriceNumber = Number.isFinite(priceNumber) ? priceNumber : 0;

    return {
      id: safeString(source.id, createId(name, index)),
      name,
      priceNumber: normalizedPriceNumber,
      priceLabel: safeString(source.priceLabel, `${normalizedPriceNumber}₽`),
      description: safeString(source.description, "Описание привилегии пока не заполнено."),
      perks: normalizePerks(source.perks),
      stripeUrl: safeString(source.stripeUrl),
      featured: Boolean(source.featured)
    };
  };

  const normalizeStore = (store) => {
    const source = store && typeof store === "object" ? store : {};
    const privilegeSource = Array.isArray(source.privileges) && source.privileges.length
      ? source.privileges
      : DEFAULT_STORE.privileges;

    return {
      version: 1,
      shopNotice: safeString(source.shopNotice, DEFAULT_STORE.shopNotice),
      stripeHelpUrl: safeString(source.stripeHelpUrl, DEFAULT_STORE.stripeHelpUrl),
      maintenanceEnabled: Boolean(source.maintenanceEnabled),
      maintenanceMessage: safeString(source.maintenanceMessage, DEFAULT_STORE.maintenanceMessage),
      privileges: privilegeSource.map((privilege, index) => normalizePrivilege(privilege, index))
    };
  };

  const readStoredValue = () => {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  };

  const writeStoredValue = (value) => {
    memoryStore = clone(value);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  };

  const dispatchUpdate = (store) => {
    window.dispatchEvent(new CustomEvent("winlineworld:store-updated", {
      detail: clone(store)
    }));
  };

  const getStore = () => {
    const rawValue = readStoredValue();

    if (!rawValue) {
      return memoryStore ? clone(memoryStore) : clone(DEFAULT_STORE);
    }

    try {
      return normalizeStore(JSON.parse(rawValue));
    } catch (error) {
      return clone(DEFAULT_STORE);
    }
  };

  const saveStore = (store) => {
    const normalizedStore = normalizeStore(store);
    writeStoredValue(normalizedStore);
    dispatchUpdate(normalizedStore);
    return clone(normalizedStore);
  };

  const resetStore = () => saveStore(DEFAULT_STORE);

  const formatPrice = (privilege) => {
    if (privilege && typeof privilege.priceLabel === "string" && privilege.priceLabel.trim()) {
      return privilege.priceLabel.trim();
    }

    const priceNumber = Number(privilege && privilege.priceNumber);
    return Number.isFinite(priceNumber) ? `${priceNumber}₽` : "0₽";
  };

  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  if (!readStoredValue()) {
    writeStoredValue(DEFAULT_STORE);
  }

  window.WinlineStore = {
    STORAGE_KEY,
    DEFAULT_STORE: clone(DEFAULT_STORE),
    getStore,
    saveStore,
    resetStore,
    normalizeStore,
    formatPrice,
    escapeHtml
  };
})();
