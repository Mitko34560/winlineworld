(function () {
  const STORAGE_KEY = "winlineworld_store_v1";
  let memoryStore = null;

  const LEGACY_SHOP_NOTICE = "Оплата проходит через Stripe. Для каждой привилегии можно указать свою ссылку Stripe Checkout или Payment Link.";
  const LEGACY_PRIVILEGE_NAMES = ["VIP", "PREMIUM", "ELITE", "LEGEND", "ADMIN"];

  const DEFAULT_STORE = {
    version: 3,
    shopNotice: "В этом разделе собраны игровые префиксы сервера. Для каждого можно указать свою Stripe-ссылку в редакторе.",
    stripeHelpUrl: "https://dashboard.stripe.com/payment-links",
    maintenanceEnabled: false,
    maintenanceMessage: "Сайт закрыт на технические работы. Пожалуйста, зайдите позже.",
    news: [
      {
        id: "news-shop",
        tag: "Обновление",
        date: "03.04.2026",
        title: "Новый магазин привилегий уже на сайте",
        text: "Мы запустили обновленную витрину префиксов с удобными карточками, плавной анимацией и быстрым переходом к оплате.",
        linkLabel: "Открыть магазин",
        linkUrl: "#donate",
        featured: true
      },
      {
        id: "news-events",
        tag: "Событие",
        date: "01.04.2026",
        title: "Еженедельные ивенты и бонусы за активность",
        text: "На сервере стартовали новые активности, а за участие в событиях игроки получают награды, ресурсы и редкие бонусы.",
        linkLabel: "Смотреть в Discord",
        linkUrl: "https://discord.gg/x6GWKRKdkc",
        featured: false
      },
      {
        id: "news-info",
        tag: "Информация",
        date: "29.03.2026",
        title: "Все анонсы проекта теперь в одном разделе",
        text: "Следи за новостями сервера, изменениями в правилах и будущими обновлениями здесь, а также на форуме проекта.",
        linkLabel: "Открыть форум",
        linkUrl: "https://f-winlineworld.hgweb.ru/index.php",
        featured: false
      }
    ],
    privileges: [
      {
        id: "nova",
        name: "NOVA",
        priceNumber: 39,
        priceLabel: "39₽",
        description: "Стартовый префикс для быстрого входа в игру и приятного старта на сервере.",
        perks: ["/kit nova", "Цветной ник", "1 дом"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "orbit",
        name: "ORBIT",
        priceNumber: 79,
        priceLabel: "79₽",
        description: "Больше удобства, полезные команды и уверенный прогресс с первых минут.",
        perks: ["Всё из NOVA", "/feed", "2 дома"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "pulse",
        name: "PULSE",
        priceNumber: 119,
        priceLabel: "119₽",
        description: "Боевой префикс для активной игры, PvP и более сильного набора возможностей.",
        perks: ["Всё из ORBIT", "/heal", "3 дома"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "aether",
        name: "AETHER",
        priceNumber: 159,
        priceLabel: "159₽",
        description: "Усиленный комплект с полезными командами и ускоренным развитием на сервере.",
        perks: ["Всё из PULSE", "/workbench", "4 дома"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "vortex",
        name: "VORTEX",
        priceNumber: 199,
        priceLabel: "199₽",
        description: "Популярный префикс с сильными бонусами для уверенной игры и заметного статуса.",
        perks: ["Всё из AETHER", "/enderchest", "5 домов"],
        stripeUrl: "",
        featured: true
      },
      {
        id: "nebula",
        name: "NEBULA",
        priceNumber: 249,
        priceLabel: "249₽",
        description: "Расширенный уровень для тех, кто хочет больше свободы и контроля на сервере.",
        perks: ["Всё из VORTEX", "/fly (ограниченно)", "6 домов"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "titan",
        name: "TITAN",
        priceNumber: 299,
        priceLabel: "299₽",
        description: "Мощный префикс с серьёзными командами для доминирования и удобной игры.",
        perks: ["Всё из NEBULA", "/fly почти везде", "/nick"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "eclipse",
        name: "ECLIPSE",
        priceNumber: 349,
        priceLabel: "349₽",
        description: "Премиальный комплект с эффектами, префиксом и большим набором игровых возможностей.",
        perks: ["Всё из TITAN", "Эффекты", "Уникальный префикс"],
        stripeUrl: "",
        featured: false
      },
      {
        id: "cosmos",
        name: "COSMOS",
        priceNumber: 399,
        priceLabel: "399₽",
        description: "Максимальный уровень доступа для игроков, которым нужен почти полный контроль.",
        perks: ["Всё из ECLIPSE", "Полный доступ", "Максимальные возможности"],
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
    const normalized = String(name || `item-${index + 1}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return normalized || `item-${index + 1}`;
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

  const normalizeNewsItem = (newsItem, index) => {
    const source = newsItem && typeof newsItem === "object" ? newsItem : {};
    const title = safeString(source.title, `Новость ${index + 1}`);

    return {
      id: safeString(source.id, createId(title, index)),
      tag: safeString(source.tag, "Новость"),
      date: safeString(source.date, ""),
      title,
      text: safeString(source.text, "Описание новости пока не заполнено."),
      linkLabel: safeString(source.linkLabel, "Подробнее"),
      linkUrl: safeString(source.linkUrl, "#news"),
      featured: Boolean(source.featured)
    };
  };

  const shouldUpgradePrivileges = (privileges) => {
    if (!Array.isArray(privileges) || !privileges.length) {
      return false;
    }

    const names = privileges
      .map((privilege) => safeString(privilege && privilege.name).toUpperCase())
      .filter(Boolean);

    return names.length === LEGACY_PRIVILEGE_NAMES.length
      && LEGACY_PRIVILEGE_NAMES.every((name, index) => names[index] === name);
  };

  const migrateLegacyPrivileges = (privileges) => DEFAULT_STORE.privileges.map((privilege, index) => {
    const current = Array.isArray(privileges) ? privileges[index] : null;

    return normalizePrivilege({
      ...privilege,
      stripeUrl: safeString(current && current.stripeUrl, privilege.stripeUrl)
    }, index);
  });

  const normalizeStore = (store) => {
    const source = store && typeof store === "object" ? store : {};
    const privilegeSource = Array.isArray(source.privileges) && source.privileges.length
      ? source.privileges
      : DEFAULT_STORE.privileges;
    const newsSource = Array.isArray(source.news)
      ? source.news
      : DEFAULT_STORE.news;

    const normalizedShopNotice = safeString(source.shopNotice, DEFAULT_STORE.shopNotice);
    const shopNotice = normalizedShopNotice === LEGACY_SHOP_NOTICE
      ? DEFAULT_STORE.shopNotice
      : normalizedShopNotice;

    return {
      version: DEFAULT_STORE.version,
      shopNotice,
      stripeHelpUrl: safeString(source.stripeHelpUrl, DEFAULT_STORE.stripeHelpUrl),
      maintenanceEnabled: Boolean(source.maintenanceEnabled),
      maintenanceMessage: safeString(source.maintenanceMessage, DEFAULT_STORE.maintenanceMessage),
      news: newsSource.map((newsItem, index) => normalizeNewsItem(newsItem, index)),
      privileges: shouldUpgradePrivileges(privilegeSource)
        ? migrateLegacyPrivileges(privilegeSource)
        : privilegeSource.map((privilege, index) => normalizePrivilege(privilege, index))
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
