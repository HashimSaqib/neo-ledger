<template>
  <q-btn
    :label="label"
    :color="color"
    @click="downloadReport"
    v-if="rows && rows.length"
  />
</template>

<script setup>
import { utils, writeFile } from "xlsx";

const props = defineProps({
  headerRow: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
  totalsRow: {
    type: Array,
    default: null,
  },
  fileName: {
    type: String,
    default: "Report.xlsx",
  },
  label: {
    type: String,
    default: "Download XLSX",
  },
  color: {
    type: String,
    default: "accent",
  },
});

function downloadReport() {
  // Combine the header, data rows, and totals row (if available)
  const exportData = [props.headerRow, ...props.rows];
  if (props.totalsRow) {
    exportData.push(props.totalsRow);
  }

  // Create the worksheet from the 2D array
  const worksheet = XLSX.utils.aoa_to_sheet(exportData);

  // Auto-adjust column widths based on header and cell content
  const colWidths = props.headerRow.map((header, colIndex) => {
    let maxLength = header.toString().length;
    props.rows.forEach((row) => {
      const cellValue = row[colIndex] || "";
      maxLength = Math.max(maxLength, cellValue.toString().length);
    });
    return { wch: maxLength + 2 };
  });
  worksheet["!cols"] = colWidths;

  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  // Export the workbook to a file with the given file name
  XLSX.writeFile(workbook, props.fileName, { compression: true });
}
</script>
