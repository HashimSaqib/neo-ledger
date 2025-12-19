// src/boot/theme.js
import { setCssVar, Cookies, LocalStorage, Dark } from "quasar";
import { boot } from "quasar/wrappers";
import { themes } from "src/css/themes";
import { watch } from "vue";
import { initFavicon } from "src/helpers/resolveLogo";
import config from "../../neoledger.json";

const THEME_COOKIE = "preferred-theme";

export const isDark = () => LocalStorage.getItem(THEME_COOKIE) === "dark";

export const setTheme = (isDark) => {
  // Set cookie with 365 days expiry
  LocalStorage.set(THEME_COOKIE, isDark ? "dark" : "light", {
    expires: 365,
    path: "/",
  });

  // Set Quasar's dark mode
  Dark.set(isDark);

  const selectedTheme = isDark ? themes.dark : themes.light;

  // Apply theme variables
  Object.keys(selectedTheme).forEach((key) => {
    setCssVar(key, selectedTheme[key]);
    document.documentElement.style.setProperty(
      `--q-${key}`,
      selectedTheme[key]
    );
  });
};

export default boot(() => {
  // Set product name from config if available
  if (config.productName) {
    document.title = config.productName;
  }

  // If no theme cookie exists, create one with default 'light' theme
  if (!LocalStorage.has(THEME_COOKIE)) {
    setTheme(false);
  } else {
    setTheme(isDark());
  }

  // Apply custom favicon if available
  initFavicon();

  // Watch for dark mode changes using Vue's watch
  watch(
    () => Dark.isActive,
    (isDarkMode) => {
      if (isDarkMode !== isDark()) {
        setTheme(isDarkMode);
      }
    }
  );
});
