// src/utils.js
import { utils, writeFile } from "xlsx";
import { inject } from "vue";
export const formatAmount = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) return ""; // return empty string for invalid values

  // Convert amount to string and format it
  return parseFloat(amount)
    .toFixed(2) // Ensure it's a two-decimal float (optional)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas every three digits
};
export const roundAmount = (amount) => {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return NaN; // or you could choose another fallback value

  return Math.round(parsed * 100) / 100;
};

export const displayDate = (datestring) => {
  // Split the input date by hyphen
  const [year, month, day] = datestring.split("-");

  // Return the date in the desired format dd-mm-yyyy
  return `${day}-${month}-${year}`;
};

export const filter = (val, options) => {
  if (val === "") return options;
  const needle = val.toLowerCase();
  return options.filter((v) => v.toLowerCase().includes(needle));
};
export const downloadReport = (filteredResults, columns, totals = null) => {
  // Build the header row from the computed columns (ensuring the order is correct)
  const headerRow = columns.map((col) => col.label);

  // Map filteredResults into rows where cell order matches the header order,
  // applying roundAmount for totals columns if a value is present
  const dataRows = filteredResults.map((row) =>
    columns.map((col) => {
      let value = row[col.field] || "";
      if (
        ["amount", "netamount", "paid", "tax", "paymentdiff"].includes(
          col.name
        ) &&
        value !== ""
      ) {
        value = roundAmount(value);
      }
      return value;
    })
  );

  // Prepare the totals row if totals are provided
  const totalsRow = totals
    ? columns.map((col) => {
        if (
          ["amount", "netamount", "paid", "tax", "paymentdiff"].includes(
            col.name
          )
        ) {
          return totals[col.name] ? roundAmount(totals[col.name]) : "";
        } else if (col.name === "description") {
          return "Totals";
        }
        return "";
      })
    : null;

  // Combine header, data rows, and totals row (if available)
  const exportData = [headerRow, ...dataRows];
  if (totalsRow) exportData.push(totalsRow);

  // Create worksheet from the 2D array
  const worksheet = utils.aoa_to_sheet(exportData);

  // Auto-adjust column widths
  worksheet["!cols"] = headerRow.map((header, index) => {
    let maxLength = header.length;
    dataRows.forEach((row) => {
      const cellValue = row[index];
      maxLength = Math.max(maxLength, cellValue?.toString().length || 0);
    });
    return { wch: maxLength + 2 };
  });

  // Create a new workbook and append the worksheet
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "AR Transactions");

  // Export the workbook to a file with compression enabled
  writeFile(workbook, "ARreport.xlsx", { compression: true });
};

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
export const createPDF = (
  filteredResults,
  columns,
  totals = null,
  title = "",
  params = {}
) => {
  const doc = new jsPDF({ orientation: "landscape" });

  let yPosition = 10; // Track vertical position
  const leftPadding = 15; // Align params with the table start

  // Add Title if provided
  if (title) {
    doc.setFontSize(18);
    doc.text(title, doc.internal.pageSize.width / 2, yPosition, {
      align: "center",
    });
    yPosition += 8; // Slightly reduced spacing
  }

  // Add Params if provided
  if (params && Object.keys(params).length > 0) {
    doc.setFontSize(12); // Reduce font size
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        doc.text(`${key}: ${value}`, leftPadding, yPosition);
        yPosition += 6; // Reduce line spacing
      }
    });
    yPosition += 4; // Small gap before the table
  }

  // Define table headers
  const headerRow = columns.map((col) => col.label);

  // Identify number columns for right alignment
  const numberColumns = ["amount", "netamount", "paid", "tax", "paymentdiff"];

  // Map filteredResults into rows where cell order matches the header order
  const dataRows = filteredResults.map((row) =>
    columns.map((col) => {
      let value = row[col.field] || "";
      if (numberColumns.includes(col.name) && value !== "") {
        value = formatAmount(value);
      }
      return value;
    })
  );

  // Check if any total column has a value
  let hasTotals = totals && numberColumns.some((col) => totals[col]);

  // Prepare totals row only if there's a valid total value
  let totalsRow = null;
  if (hasTotals) {
    totalsRow = columns.map((col) => {
      if (numberColumns.includes(col.name) || col.name === "description") {
        return totals[col.name] ? formatAmount(totals[col.name]) : "";
      } else if (col.name === "description") {
        return "Totals";
      }
      return "";
    });
  }

  // Construct table data
  const tableData = [...dataRows];
  if (totalsRow) tableData.push(totalsRow);

  // Add table to PDF
  autoTable(doc, {
    startY: yPosition,
    head: [headerRow],
    body: tableData,
    styles: { fontSize: 10 },
    theme: "striped",
    headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0] }, // Light grey header with black text
    columnStyles: Object.fromEntries(
      columns.map((col, index) => [
        index,
        numberColumns.includes(col.name) || col.name === "description"
          ? { halign: "right" }
          : {},
      ])
    ),
  });

  // Save the PDF
  doc.save(`${title}.pdf`);
};

// Delete Confirmation
import { Dialog } from "quasar";
export const confirmDelete = ({
  title,
  message,
  cancel = true,
  persistent = true,
}) => {
  return new Promise((resolve, reject) => {
    Dialog.create({
      title,
      message,
      cancel,
      persistent,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });
};
