/**
 * Converts a JSON object to FormData.
 *
 * This helper will loop through object keys and append them to a FormData instance.
 * If a value is a File (or an array of Files), the file(s) are appended directly.
 * For other objects or arrays, JSON.stringify is used.
 *
 * @param {Object} data - The JSON object.
 * @param {FormData} formData - Optional existing FormData (default: new FormData()).
 * @param {string} parentKey - Used internally for nested objects.
 * @returns {FormData} - The resulting FormData instance.
 */
export function jsonToFormData(
  data,
  formData = new FormData(),
  parentKey = ""
) {
  if (data && typeof data === "object" && !(data instanceof File)) {
    for (const key in data) {
      if (
        !data.hasOwnProperty(key) ||
        data[key] === undefined ||
        data[key] === null
      )
        continue;
      const value = data[key];
      const formKey = parentKey ? `${parentKey}[${key}]` : key;

      if (value instanceof File) {
        formData.append(formKey, value);
      } else if (Array.isArray(value)) {
        // If the first element is a File, then assume the whole array is files.
        if (value.length > 0 && value[0] instanceof File) {
          value.forEach((file) => {
            formData.append(`${formKey}`, file);
          });
        } else {
          // For non-File arrays, append the JSON string
          formData.append(formKey, JSON.stringify(value));
        }
      } else if (typeof value === "object") {
        // For plain objects, you can either recursively append or stringify.
        // Here we choose to stringify.
        formData.append(formKey, JSON.stringify(value));
      } else {
        formData.append(formKey, value);
      }
    }
  }
  return formData;
}
