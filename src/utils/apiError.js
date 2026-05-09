/**
 * Extract human-readable API error text from a response body shape.
 *
 * Supports:
 * - `{ message: "..." }` (common client API)
 * - `{ error: "..." }` or `{ error: { message: "..." } }` (some endpoints)
 * - JSON-encoded string bodies containing the above
 *
 * @param {unknown} payload
 * @returns {string}
 */
function extractApiMessage(payload) {
  if (payload == null) return "";
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("{")) {
      try {
        return extractApiMessage(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  if (
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload instanceof Error
  ) {
    return "";
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  const err = payload.error;
  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }
  if (
    err &&
    typeof err === "object" &&
    typeof err.message === "string" &&
    err.message.trim()
  ) {
    return err.message.trim();
  }
  return "";
}

/**
 * Message from axios error or raw `{ message }` / `{ error }` body (e.g. `response.data`).
 *
 * @param {unknown} from - Axios-like `{ response?: { data } }` or a response body object
 * @param {string} [fallback]
 * @returns {string}
 */
export function getApiErrorMessage(from, fallback = "") {
  const payload =
    from?.response?.data !== undefined ? from.response.data : from;

  const fromBody = extractApiMessage(payload);
  if (fromBody) return fromBody;

  if (typeof from?.message === "string" && from.message.trim()) {
    return from.message.trim();
  }

  return typeof fallback === "string" ? fallback : "";
}
