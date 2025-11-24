// src/boot/i18n.js
import { boot } from "quasar/wrappers";
import { createI18n } from "vue-i18n";

// Import locale messages
import enMessages from "../i18n/locales/en/messages.json";
import deChMessages from "../i18n/locales/de-CH/messages.json";

function getStoredLanguage() {
  const storedLang = localStorage.getItem("appLanguage") || "en";
  console.log("Stored language:", storedLang);
  return storedLang;
}

const langList = import.meta.glob("../../node_modules/quasar/lang/*.js");

// Create i18n instance with local messages
const i18n = createI18n({
  legacy: false,
  locale: getStoredLanguage(),
  fallbackLocale: "en",
  messages: {
    en: enMessages,
    "de-CH": deChMessages,
  },
  // Enable missing handler for development
  missing: (locale, key) => {
    if (import.meta.env.DEV) {
      console.warn(`Missing translation for "${key}" in locale "${locale}"`);
    }
    return key;
  },
});

// Load Quasar language pack for UI components
export async function loadQuasarLanguagePack(locale, q) {
  if (!q) return;

  try {
    console.log(`Loading Quasar language pack for ${locale}...`);

    // Map locale codes to Quasar language pack names
    const quasarLocaleMap = {
      en: "en-US",
      "de-CH": "de",
    };

    const quasarLocale = quasarLocaleMap[locale] || locale;
    const quasarLangKey = `../../node_modules/quasar/lang/${quasarLocale}.js`;

    if (langList[quasarLangKey]) {
      const langModule = await langList[quasarLangKey]();
      q.lang.set(langModule.default);
      console.log(
        `Successfully loaded Quasar language pack for ${quasarLocale}`
      );
    } else {
      console.warn(
        `No Quasar lang file found for "${quasarLocale}", using default.`
      );
    }
  } catch (error) {
    console.error(`Failed to load Quasar language pack for ${locale}`, error);
  }
}

// Change application language
export async function setLanguage(locale, q = null) {
  if (!i18n.global.availableLocales.includes(locale)) {
    console.error(`Locale "${locale}" is not available`);
    return false;
  }

  try {
    console.log(`Switching to language: ${locale}`);
    i18n.global.locale.value = locale;
    localStorage.setItem("appLanguage", locale);

    // Load corresponding Quasar language pack
    if (q) {
      await loadQuasarLanguagePack(locale, q);
    }

    return true;
  } catch (error) {
    console.error(`Failed to switch language to ${locale}`, error);
    return false;
  }
}

export async function loadLanguagePack(locale, q = null) {
  const localeMap = {
    de: "de-CH",
  };

  const mappedLocale = localeMap[locale] || locale;
  return await setLanguage(mappedLocale, q);
}

export default boot(async ({ app }) => {
  app.use(i18n);

  const currentLocale = i18n.global.locale.value;
  console.log("Current locale at boot:", currentLocale);

  // Wait for app to be mounted before trying to access $q
  app.mixin({
    mounted() {
      // Only run this once when the root component is mounted
      if (this === this.$root) {
        const q = this.$q;
        if (q && currentLocale !== "en") {
          loadQuasarLanguagePack(currentLocale, q);
        }
      }
    },
  });
});

export { i18n };
