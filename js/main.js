document.getElementById("year").textContent = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".nav-menu");
    const links = document.querySelectorAll(".nav-menu a");

    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        menu.classList.toggle("active");
        toggle.classList.toggle("active");
      });

      links.forEach(link => {
        link.addEventListener("click", () => {
          menu.classList.remove("active");
          toggle.classList.remove("active");
        });
      });
    }

    initGrainCommands();
    window.addEventListener("resize", debounce(() => {
      initGrainCommands();
    }, 150));
    initThemeToggle();
    initLanguageToggle();
  });

function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

function parseNumberAttr(value) {
  if (value === null || value === undefined) {
    return NaN;
  }
  return Number.parseFloat(String(value).trim());
}

const GRAIN_FIELD_SIZE = 750;

function clearGrainInstances() {
  const stage = document.querySelector(".manual-grain-stage");
  if (stage) {
    stage.remove();
  }
}

function createGrainInstance(stage, left, top, size) {
  const docWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const maxLeft = Math.max(0, docWidth - size);
  const maxTop = Math.max(0, docHeight - size);
  const clampedLeft = Math.max(0, Math.min(left, maxLeft));
  const clampedTop = Math.max(0, Math.min(top, maxTop));

  const layer = document.createElement("span");
  layer.className = "grain-instance manual-grain-instance";
  layer.style.left = Math.round(clampedLeft) + "px";
  layer.style.top = Math.round(clampedTop) + "px";
  layer.style.width = size + "px";
  layer.style.height = size + "px";
  stage.appendChild(layer);
}

function initGrainCommands() {
  clearGrainInstances();

  const commands = document.querySelectorAll("[data-grain-command]");
  if (!commands.length) {
    return;
  }

  const stage = document.createElement("div");
  stage.className = "manual-grain-stage";

  commands.forEach((node) => {
    if (node.closest("[hidden]")) {
      return;
    }

    const command = (node.getAttribute("data-grain-command") || "").trim().toLowerCase();
    if (command !== "highlight") {
      return;
    }

    const rect = node.getBoundingClientRect();
    const size = parseNumberAttr(node.getAttribute("data-grain-size"));
    const fieldSize = Number.isNaN(size) ? GRAIN_FIELD_SIZE : Math.max(1, size);
    const left = window.scrollX + rect.left - fieldSize / 2;
    const top = window.scrollY + rect.top - fieldSize / 2;

    createGrainInstance(stage, left, top, fieldSize);
  });

  document.body.appendChild(stage);
}

function initThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleIcon = document.getElementById("theme-toggle-icon");

  if (!themeToggle || !themeToggleIcon) {
    return;
  }

  const storageKey = "theme";
  const themes = ["light", "dark"];
  const storedTheme = localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const activeTheme = themes.includes(storedTheme) ? storedTheme : prefersDark ? "dark" : "light";

  function applyTheme(theme) {
    const resolvedTheme = themes.includes(theme) ? theme : "light";
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    localStorage.setItem(storageKey, resolvedTheme);

    const switchToDark = resolvedTheme === "light";
    themeToggleIcon.classList.remove("fa-sun", "fa-moon");
    themeToggleIcon.classList.add(switchToDark ? "fa-moon" : "fa-sun");
    themeToggle.setAttribute("title", switchToDark ? "Switch to dark mode" : "Switch to light mode");
    themeToggle.setAttribute("aria-label", switchToDark ? "Switch to dark mode" : "Switch to light mode");
  }

  applyTheme(activeTheme);

  themeToggle.addEventListener("click", function (event) {
    event.preventDefault();
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

function initLanguageToggle() {
  const languageToggle = document.getElementById("language-toggle");
  const dictionaryElement = document.getElementById("i18n-dictionary");

  if (!languageToggle || !dictionaryElement) {
    return;
  }

  let dictionary;
  try {
    dictionary = JSON.parse(dictionaryElement.textContent || "{}");
  } catch (error) {
    return;
  }

  const defaultLanguage = "de";
  const storageKey = "language";
  const supportedLanguages = Object.keys(dictionary);
  const queryLanguage = new URLSearchParams(window.location.search).get("lang");
  const isQueryLanguageSupported = supportedLanguages.includes(queryLanguage);
  if (isQueryLanguageSupported) {
    localStorage.setItem(storageKey, queryLanguage);
  }
  const storedLanguage = localStorage.getItem(storageKey);
  const activeLanguage = isQueryLanguageSupported
    ? queryLanguage
    : supportedLanguages.includes(storedLanguage)
      ? storedLanguage
      : defaultLanguage;

  function translateKey(translations, key) {
    if (!key || !Object.prototype.hasOwnProperty.call(translations, key)) {
      return null;
    }

    return translations[key];
  }

  function applyTextTranslations(translations) {
    const translatableElements = document.querySelectorAll("[data-i18n]");

    translatableElements.forEach(function (element) {
      const key = element.getAttribute("data-i18n");
      const translation = translateKey(translations, key);

      if (translation !== null) {
        element.innerHTML = translation;
      }
    });
  }

  function applyAttributeTranslations(translations) {
    const attributeElements = document.querySelectorAll("[data-i18n-attr]");

    attributeElements.forEach(function (element) {
      const mapping = element.getAttribute("data-i18n-attr");
      if (!mapping) {
        return;
      }

      mapping.split(",").forEach(function (entry) {
        const pair = entry.split(":");
        if (pair.length !== 2) {
          return;
        }

        const attributeName = pair[0].trim();
        const key = pair[1].trim();
        const translation = translateKey(translations, key);

        if (attributeName && translation !== null) {
          element.setAttribute(attributeName, translation);
        }
      });
    });
  }

  function applyLanguageSections(language) {
    const languageSections = document.querySelectorAll("[data-i18n-lang]");

    languageSections.forEach(function (section) {
      const sectionLanguage = section.getAttribute("data-i18n-lang");
      section.hidden = sectionLanguage !== language;
    });
  }

  function applyLanguage(language) {
    const translations = dictionary[language] || {};

    applyTextTranslations(translations);
    applyAttributeTranslations(translations);
    applyLanguageSections(language);

    document.documentElement.setAttribute("lang", language);
    localStorage.setItem(storageKey, language);
    languageToggle.textContent = language === "de" ? "EN" : "DE";
    languageToggle.setAttribute("aria-label", language === "de" ? "Switch to English" : "Auf Deutsch wechseln");
    languageToggle.setAttribute("title", language === "de" ? "Switch to English" : "Auf Deutsch wechseln");
    initGrainCommands();
  }

  applyLanguage(activeLanguage);

  languageToggle.addEventListener("click", function (event) {
    event.preventDefault();
    const currentLanguage = localStorage.getItem(storageKey) || defaultLanguage;
    const nextLanguage = currentLanguage === "de" ? "en" : "de";
    applyLanguage(nextLanguage);
  });
}

(function () {
  "use strict";

  function clearActive(links) {
    links.forEach(function (link) {
      link.classList.remove("active");
    });
  }

  function setActiveByHash(hash, links) {
    clearActive(links);
    var activeLink = document.querySelector('nav a[href="' + hash + '"]');
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }

  function initOnePageNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll("nav ul li a"));
    var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));

    if (!links.length || !sections.length) {
      return;
    }

    if (window.location.hash) {
      setActiveByHash(window.location.hash, links);
    } else {
      setActiveByHash("#home", links);
    }

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        var hash = link.getAttribute("href");
        if (hash && hash.charAt(0) === "#") {
          setActiveByHash(hash, links);
        }
      });
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveByHash("#" + entry.target.id, links);
          }
        });
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  document.addEventListener("DOMContentLoaded", initOnePageNav);
})();
