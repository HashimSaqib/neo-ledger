import { computed } from "vue";
import { Dark } from "quasar";

// Default logo fallback
import defaultLogo from "assets/images/logo.png";

// Try to import custom assets - these will be empty objects if folders don't exist
const customDarkLogos = import.meta.glob(
  "/src/assets/custom/dark/logo.{png,svg,jpg,jpeg}",
  {
    eager: true,
    import: "default",
  }
);
const customLightLogos = import.meta.glob(
  "/src/assets/custom/light/logo.{png,svg,jpg,jpeg}",
  {
    eager: true,
    import: "default",
  }
);
const customFavicons = import.meta.glob(
  "/src/assets/custom/favicon.{ico,png,svg}",
  {
    eager: true,
    import: "default",
  }
);

// Get the first matching asset from glob results (there should only be one)
const getFirstAsset = (assets) => {
  const keys = Object.keys(assets);
  return keys.length > 0 ? assets[keys[0]] : null;
};

const customDark = getFirstAsset(customDarkLogos);
const customLight = getFirstAsset(customLightLogos);
const customFavicon = getFirstAsset(customFavicons);
const hasCustomLogos = customDark || customLight;

export const resolveLogo = (options = {}) => {
  const { forceDark = false } = options;

  return computed(() => {
    if (hasCustomLogos) {
      if (forceDark) {
        // Always prefer dark logo, fall back to light if dark doesn't exist
        return customDark || customLight;
      }
      // Use custom logos based on current theme
      return Dark.isActive
        ? customDark || customLight
        : customLight || customDark;
    }
    return defaultLogo;
  });
};

// Sets the favicon if a custom one exists in /src/assets/custom/favicon.{ico,png,svg}
export const initFavicon = () => {
  if (!customFavicon) return;

  const link =
    document.querySelector("link[rel='icon']") ||
    document.createElement("link");
  link.rel = "icon";
  link.href = customFavicon;

  // Set type based on extension
  if (customFavicon.includes(".svg")) {
    link.type = "image/svg+xml";
  } else if (customFavicon.includes(".png")) {
    link.type = "image/png";
  } else {
    link.type = "image/x-icon";
  }

  if (!document.querySelector("link[rel='icon']")) {
    document.head.appendChild(link);
  }
};
