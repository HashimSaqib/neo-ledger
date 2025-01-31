// src/boot/theme.js
import { setCssVar, Cookies, Dark } from "quasar";
import { boot } from "quasar/wrappers";
import { themes } from "src/css/themes";
import { watch } from "vue";

const THEME_COOKIE = "preferred-theme";

export const isDark = () => Cookies.get(THEME_COOKIE) === "dark";

export const setTheme = (isDark) => {
  // Set cookie with 365 days expiry
  Cookies.set(THEME_COOKIE, isDark ? "dark" : "light", {
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
  // If no theme cookie exists, create one with default 'light' theme
  if (!Cookies.has(THEME_COOKIE)) {
    setTheme(false);
  } else {
    setTheme(isDark());
  }

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
