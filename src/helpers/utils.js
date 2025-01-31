// src/utils.js

export const formatAmount = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) return ""; // return empty string for invalid values

  // Convert amount to string and format it
  return parseFloat(amount)
    .toFixed(2) // Ensure it's a two-decimal float (optional)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas every three digits
};

export const displayDate = (datestring) => {
  // Split the input date by hyphen
  const [year, month, day] = datestring.split("-");

  // Return the date in the desired format dd-mm-yyyy
  return `${day}-${month}-${year}`;
};

export function filter(val, options) {
  if (val === "") return options;
  const needle = val.toLowerCase();
  return options.filter((v) => v.toLowerCase().includes(needle));
}
