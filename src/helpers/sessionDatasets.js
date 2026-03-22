import { LocalStorage } from "quasar";

export const SESSION_DATASETS_KEY = "neo_session_datasets";

/**
 * Dataset entries for the current browser tab session (sessionStorage).
 * Used by the sidebar switcher; populated from db_list / central/db_list.
 */
export function getSessionDatasets() {
  try {
    const raw = sessionStorage.getItem(SESSION_DATASETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasSessionDatasets() {
  return getSessionDatasets().length > 0;
}

/**
 * @param {Array<{ db_name?: string, name?: string, access_level?: string }>} rows
 */
export function setSessionDatasetsFromApiRows(rows) {
  if (!Array.isArray(rows)) return;

  const list = rows
    .filter((ds) => ds && ds.db_name)
    .map((ds) => ({
      db_name: ds.db_name,
      name: ds.name || ds.db_name,
      access_level: ds.access_level ?? "",
    }));

  sessionStorage.setItem(SESSION_DATASETS_KEY, JSON.stringify(list));

  const dbNames = list.map((d) => d.db_name).join(",");
  LocalStorage.set("available_db", dbNames);
}

export function clearSessionDatasets() {
  sessionStorage.removeItem(SESSION_DATASETS_KEY);
}

export function initialsFromName(label) {
  if (!label || typeof label !== "string") return "?";
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || "?";
}
