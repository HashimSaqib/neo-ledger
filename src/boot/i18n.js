// src/boot/i18n.js
import { boot } from "quasar/wrappers";
import { createI18n } from "vue-i18n";
import axios from "axios";
function getStoredLanguage() {
  const storedLang = localStorage.getItem("appLanguage") || "en";
  console.log("Stored language:", storedLang);
  return storedLang;
}

const langList = import.meta.glob("../../node_modules/quasar/lang/*.js");
let i18n;

// Initialize i18n without Quasar language pack loading
export async function loadLanguagePack(locale, q = null) {
  try {
    console.log(`Loading language pack for ${locale}...`);
    const response = await axios.get(
      `https://api.neo-ledger.com/client/neoledger/languages/${locale}`
    );
    const data = response.data;

    i18n.global.setLocaleMessage(locale, data);
    i18n.global.locale.value = locale;

    // Only try to load Quasar language pack if q is provided
    if (q) {
      const quasarLangKey = `../../node_modules/quasar/lang/${locale}.js`;
      if (langList[quasarLangKey]) {
        const langModule = await langList[quasarLangKey]();
        q.lang.set(langModule.default);
      } else {
        console.warn(
          `No Quasar lang file found for "${locale}", using default.`
        );
      }
    }

    localStorage.setItem("appLanguage", locale);
    console.log(`Successfully loaded language pack for ${locale}`);
  } catch (error) {
    console.error(`Failed to load language pack for ${locale}`, error);
    i18n.global.locale.value = "en";
  }
}

export default boot(async ({ app, store }) => {
  // Initialize i18n first
  i18n = createI18n({
    legacy: false,
    locale: getStoredLanguage(),
    fallbackLocale: "en",
    messages: { en: {} },
  });

  app.use(i18n);

  const currentLocale = i18n.global.locale.value;
  console.log("Current locale at boot:", currentLocale);

  // First load the language pack without Quasar integration
  if (currentLocale !== "en") {
    await loadLanguagePack(currentLocale);
  }

  // Wait for app to be mounted before trying to access $q
  app.mixin({
    mounted() {
      // Only run this once when the root component is mounted
      if (this === this.$root) {
        const q = this.$q;
        if (q) {
          // Now that we have access to $q, load the Quasar language pack
          loadLanguagePack(currentLocale, q);
        }
      }
    },
  });
});

export { i18n };
