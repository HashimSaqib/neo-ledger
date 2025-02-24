// src/helpers/xlx.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Export data to an XLSX file.
 *
 * @param {Array<Object>|Array<Array>} data - The data to export. If an array of objects,
 *    headers will be inferred unless provided in options.
 * @param {Object} [options] - Options for the export.
 * @param {string} [options.sheetName='Sheet1'] - Name of the worksheet.
 * @param {string} [options.fileName='export.xlsx'] - The filename for the downloaded file.
 * @param {Array<string>} [options.headers] - An optional array of headers to control the column order.
 */
export function exportToXlsx(data, options = {}) {
  const { sheetName = "Sheet1", fileName = "export.xlsx", headers } = options;

  let ws;
  // Check if data is an array of objects
  if (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    !Array.isArray(data[0])
  ) {
    // If headers are provided, use them to enforce column order
    ws = headers
      ? XLSX.utils.json_to_sheet(data, { header: headers })
      : XLSX.utils.json_to_sheet(data);
  } else {
    // Otherwise, assume data is an array of arrays (AOA)
    ws = XLSX.utils.aoa_to_sheet(data);
  }

  // Create a new workbook and append the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate the XLSX file as an array buffer
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  // Trigger the file download using FileSaver.js
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), fileName);
}
