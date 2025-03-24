// src/utils.js
import { utils, writeFile } from "xlsx";
import { inject } from "vue";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog } from "quasar";
// Format a number as a string with commas and two decimals
export const formatAmount = (amount) => {
  if (isNaN(amount) || amount === null || amount === undefined) return "";
  return parseFloat(amount)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
  if (title) {
    doc.setFontSize(18);
    doc.text(title, doc.internal.pageSize.width / 2, yPosition, {
      align: "center",
    });
    yPosition += 8;
  }
  if (params && Object.keys(params).length > 0) {
    doc.setFontSize(12);
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
  autoTable(doc, {
    startY: yPosition,
    head: [headerRow],
    body: tableData,
    styles: { fontSize: 10 },
    theme: "striped",
    headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0] },
    columnStyles: Object.fromEntries(
      columns.map((col, index) => [
        index,
        numberColumns.includes(col.name) ? { halign: "right" } : {},
      ])
    ),
  });
  doc.save(`${title}.pdf`);
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
