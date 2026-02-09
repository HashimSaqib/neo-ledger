// src/utils.js
import { utils, writeFile } from "xlsx";
import { inject } from "vue";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog, LocalStorage } from "quasar";

// Centralized PDF styling configuration
export const PDF_STYLES = {
  // Default table styles for tabular layout with grey lines
  table: {
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [200, 200, 200], // Light grey table lines
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [211, 211, 211], // Light grey header background
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineColor: [200, 200, 200], // Light grey header lines
      lineWidth: 0.1,
    },
    bodyStyles: {
      lineColor: [200, 200, 200], // Light grey body lines
      lineWidth: 0.1,
    },
    // Remove theme to avoid alternating colors
    theme: "plain",
  },

  // Title styles
  title: {
    fontSize: 15,
    alignment: "center",
  },

  // Subtitle styles
  subtitle: {
    fontSize: 14,
  },

  // Parameter styles
  params: {
    fontSize: 12,
  },

  // Totals row styles
  totals: {
    fontStyle: "bold",
    lineColor: [200, 200, 200],
    lineWidth: 0.1,
  },

  // Compact table styles for reports with many columns
  compact: {
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [211, 211, 211],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    bodyStyles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    theme: "plain",
  },

  // Group header styles
  groupHeader: {
    fontStyle: "bold",
    fillColor: [240, 240, 240], // Very light grey for group headers
    textColor: [0, 0, 0],
    lineColor: [200, 200, 200],
    lineWidth: 0.1,
  },
};

// Format a number as a string with commas and two decimals
export const formatAmount = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) return "";

  const numberFormat = LocalStorage.getItem("numberFormat") || "1,000.00";
  const numericValue = parseFloat(amount).toFixed(2);

  switch (numberFormat) {
    case "1,000.00":
      // Comma thousands, dot decimal (default)
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    case "1'000.00":
      // Apostrophe thousands, dot decimal
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "'");

    case "1.000,00":
      // Dot thousands, comma decimal
      // Split the number into integer and decimal parts
      const parts = numericValue.split(".");
      const integerPart = parts[0];
      const decimalPart = parts[1];

      // Add dots as thousand separators to the integer part
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        "."
      );

      // Combine with comma as decimal separator
      return formattedInteger + "," + decimalPart;

    case "1000,00":
      // No thousands separator, comma decimal
      return numericValue.replace(".", ",");

    case "1000.00":
      // No thousands separator, dot decimal
      return numericValue;

    default:
      // Fallback to comma thousands, dot decimal
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
};

// Format a date string from yyyy-mm-dd to dd.mm.yyyy
export const formatDate = (dateStr) => {
  if (dateStr === null || dateStr === undefined) return "";
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  return `${match[3]}.${match[2]}.${match[1]}`;
};

// Parse a formatted amount string back to a number based on the current number format
export const parseAmount = (amountString) => {
  if (!amountString || typeof amountString !== "string") return 0;

  const numberFormat = LocalStorage.getItem("numberFormat") || "1,000.00";
  let parsed;

  switch (numberFormat) {
    case "1,000.00":
      // Comma thousands, dot decimal (default)
      parsed = parseFloat(amountString.replace(/,/g, ""));
      break;

    case "1'000.00":
      // Apostrophe thousands, dot decimal
      parsed = parseFloat(amountString.replace(/'/g, ""));
      break;

    case "1.000,00":
      // Dot thousands, comma decimal
      parsed = parseFloat(amountString.replace(/\./g, "").replace(/,/g, "."));
      break;

    case "1000,00":
      // No thousands separator, comma decimal
      parsed = parseFloat(amountString.replace(/,/g, "."));
      break;

    case "1000.00":
      // No thousands separator, dot decimal
      parsed = parseFloat(amountString);
      break;

    default:
      // Fallback to comma thousands, dot decimal
      parsed = parseFloat(amountString.replace(/,/g, ""));
      break;
  }

  // Round to two decimal places and handle NaN
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

// Round the given amount to two decimals
export const roundAmount = (amount) => {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return NaN;
  return Math.round(parsed * 100) / 100;
};

// Format a date string from "yyyy-mm-dd" to "dd-mm-yyyy"
export const displayDate = (datestring) => {
  const [year, month, day] = datestring.split("-");
  return `${day}-${month}-${year}`;
};

// Format a PostgreSQL timestamp to "yyyy-mm-dd HH:mm" format
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    return "";
  }
};
export const formatUpdatedTimestamp = (row) => {
  if (row.created === row.updated) {
    return "Never";
  }
  return formatTimestamp(row.updated);
};
// Filter an array of options based on a search value
export const filter = (val, options) => {
  if (val === "") return options;
  const needle = val.toLowerCase();
  return options.filter((v) => v.toLowerCase().includes(needle));
};

// Download a report as an Excel file
export const downloadReport = (filteredResults, columns, totals = null) => {
  const headerRow = columns.map((col) => col.label);
  const dataRows = filteredResults.map((row) =>
    columns.map((col) => {
      let value = row[col.field] || "";
      if (
        ["amount", "netamount", "paid", "tax", "paymentdiff", "due"].includes(
          col.name
        ) &&
        value !== ""
      ) {
        value = roundAmount(value);
      }
      return value;
    })
  );
  const totalsRow = totals
    ? columns.map((col) => {
        if (
          ["amount", "netamount", "paid", "tax", "paymentdiff", "due"].includes(
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
  const exportData = [headerRow, ...dataRows];
  if (totalsRow) exportData.push(totalsRow);
  const worksheet = utils.aoa_to_sheet(exportData);
  worksheet["!cols"] = headerRow.map((header, index) => {
    let maxLength = header.length;
    dataRows.forEach((row) => {
      const cellValue = row[index];
      maxLength = Math.max(maxLength, cellValue?.toString().length || 0);
    });
    return { wch: maxLength + 2 };
  });
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "AR Transactions");
  writeFile(workbook, "ARreport.xlsx", { compression: true });
};

// Create a PDF report from the provided data
export const createPDF = (
  filteredResults,
  columns,
  totals = null,
  title = "",
  params = {}
) => {
  const doc = new jsPDF({ orientation: "landscape" });
  let yPosition = 10;
  const leftPadding = 15;

  // Add title using centralized styles
  if (title) {
    doc.setFontSize(PDF_STYLES.title.fontSize);
    doc.text(title, doc.internal.pageSize.width / 2, yPosition, {
      align: PDF_STYLES.title.alignment,
    });
    yPosition += 8;
  }

  // Add parameters using centralized styles
  if (params && Object.keys(params).length > 0) {
    doc.setFontSize(PDF_STYLES.params.fontSize);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        doc.text(`${key}: ${value}`, leftPadding, yPosition);
        yPosition += 6;
      }
    });
    yPosition += 4;
  }

  const headerRow = columns.map((col) => col.label);
  const numberColumns = [
    "amount",
    "netamount",
    "paid",
    "tax",
    "paymentdiff",
    "debit",
    "credit",
    "balance",
  ];

  const dataRows = filteredResults.map((row) =>
    columns.map((col) => {
      let value = row[col.field] || "";
      if (numberColumns.includes(col.name) && value !== "") {
        value = formatAmount(value);
      }
      return value;
    })
  );

  let hasTotals = totals && numberColumns.some((col) => totals[col]);
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

  const tableData = [...dataRows];
  if (totalsRow) tableData.push(totalsRow);

  // Use centralized PDF styles for tabular layout with grey lines
  autoTable(doc, {
    startY: yPosition,
    head: [headerRow],
    body: tableData,
    ...PDF_STYLES.table,
    columnStyles: Object.fromEntries(
      columns.map((col, index) => [
        index,
        numberColumns.includes(col.name) ? { halign: "right" } : {},
      ])
    ),
  });

  doc.save(`${title}.pdf`);
};

// Helper function to create PDF with custom styling options
export const createPDFWithCustomStyles = (
  doc,
  headerRow,
  bodyData,
  options = {}
) => {
  const defaultStyles = {
    startY: 20,
    ...PDF_STYLES.table,
    columnStyles: {},
  };

  // Merge custom options with default styles
  const finalOptions = {
    ...defaultStyles,
    ...options,
    head: [headerRow],
    body: bodyData,
  };

  autoTable(doc, finalOptions);
  return doc.lastAutoTable.finalY;
};

// Display a delete confirmation dialog using Quasar's Dialog component
export const confirmDelete = ({
  title,
  message,
  cancel = true,
  persistent = true,
}) =>
  new Promise((resolve) => {
    Dialog.create({
      title,
      message,
      cancel,
      persistent,
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false));
  });

// Convert files to base64 format for API upload
export const convertFilesToBase64 = async (files) => {
  const base64Files = [];
  for (const file of files) {
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      base64Files.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
      });
    } catch (error) {
      console.error("Error converting file to base64:", error);
    }
  }
  return base64Files;
};
