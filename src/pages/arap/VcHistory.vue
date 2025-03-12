<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <!-- Page title based on customer/vendor mode -->
    <q-form @submit.prevent="search" class="q-px-md q-py-md mainbg hide-print">
      <q-expansion-item
        label="Search Params"
        v-model="filtersOpen"
        expand-separator
        header-class="lightbg maintext"
        expand-icon-class="maintext"
      >
        <!-- Basic Info -->
        <div class="row q-gutter-md q-mt-md">
          <q-input
            v-model="formData.name"
            :label="t('Name')"
            class="col-3 lightbg"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.contact"
            :label="t('Contact')"
            class="col-3 lightbg"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
        </div>

        <!-- Period Selection -->
        <div class="row q-gutter-md q-mt-md">
          <s-select
            v-model="formData.month"
            :options="monthOptions"
            :label="t('Month')"
            class="col-3 lightbg"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            search="label"
          />
          <s-select
            v-model="formData.year"
            :options="yearOptions"
            :label="t('Year')"
            class="col-3 lightbg"
            outlined
            dense
            search="label"
          />

          <q-radio :label="t('Current')" val="0" v-model="formData.interval" />
          <q-radio :label="t('Month')" val="1" v-model="formData.interval" />
          <q-radio :label="t('Quarter')" val="3" v-model="formData.interval" />
          <q-radio :label="t('Year')" val="12" v-model="formData.interval" />
        </div>

        <!-- Open/Closed checkboxes -->
        <div class="row q-mt-md">
          <q-checkbox
            v-model="formData.open"
            :label="t('Open')"
            class="q-mr-md"
          />
          <q-checkbox v-model="formData.closed" :label="t('Closed')" />
        </div>

        <!-- Report Mode: Summary or Detail -->
        <div class="row q-mt-md">
          <q-radio
            :label="t('Summary')"
            val="summary"
            v-model="formData.historyMode"
          />
          <q-radio
            :label="t('Detail')"
            val="detail"
            v-model="formData.historyMode"
          />
        </div>

        <!-- Column Selection -->
        <div class="q-mt-md">
          <div class="row q-col-gutter-sm">
            <q-checkbox
              v-model="formData.l_partnumber"
              :label="t('Part Number')"
              class="col-auto"
            />
            <q-checkbox
              v-model="formData.l_description"
              :label="t('Description')"
              class="col-auto"
            />
            <q-checkbox
              v-model="formData.l_sellprice"
              :label="t('Sell Price')"
              class="col-auto"
            />
            <q-checkbox
              v-model="formData.l_curr"
              :label="t('Currency')"
              class="col-auto"
            />
          </div>
          <div class="row q-col-gutter-sm q-mt-xs">
            <q-checkbox
              v-model="formData.l_qty"
              :label="t('Qty')"
              class="col-auto"
            />
            <q-checkbox
              v-model="formData.l_unit"
              :label="t('Unit')"
              class="col-auto"
            />
            <q-checkbox
              v-model="formData.l_discount"
              :label="t('Discount')"
              class="col-auto"
            />
            <q-checkbox
              v-model="formData.l_deliverydate"
              :label="t('Delivery Date')"
              class="col-auto"
            />
            <q-checkbox
              v-model="formData.l_projectnumber"
              :label="t('Project Number')"
              class="col-auto"
            />
            <q-checkbox
              v-model="formData.l_serialnumber"
              :label="t('Serial Number')"
              class="col-auto"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="row q-mt-md">
          <q-btn
            type="submit"
            :label="t('Search')"
            color="primary"
            class="q-mr-sm"
          />
          <q-btn :label="t('Clear')" @click="clearForm" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Results Table -->
    <div v-if="processedResults.length" class="q-mt-lg">
      <div class="row q-mb-sm hide-print">
        <q-btn
          :label="t('Export')"
          @click="downloadExcel"
          class="q-mr-sm"
          color="accent"
        />
        <q-btn
          :label="t('Print')"
          @click="createPDF"
          class="q-mr-sm"
          color="info"
        />
      </div>
      <q-table
        :rows="processedResults"
        :columns="finalColumns"
        row-key="uid"
        flat
        bordered
        dense
        hide-bottom
        :rows-per-page-options="[0]"
        virtual-scroll
        virtual-scroll-sticky-end
      >
        <!-- Custom rendering for group headers and data rows -->
        <template v-slot:body="props">
          <!-- Group header with a router link -->
          <template v-if="props.row.type === 'groupHeader'">
            <q-tr class="header-row">
              <q-td :colspan="finalColumns.length" class="text-center">
                <router-link
                  :to="getGroupLink(props.row.id)"
                  class="text-primary"
                >
                  {{ props.row.name }} {{ props.row.address }}
                </router-link>
              </q-td>
            </q-tr>
          </template>
          <!-- Data rows -->
          <template v-else>
            <q-tr>
              <q-td
                v-for="col in finalColumns"
                :key="col.name"
                :class="'text-' + (col.align || 'left')"
              >
                <span
                  v-if="['sellprice', 'discount', 'total'].includes(col.field)"
                >
                  {{ formatAmount(props.row[col.field]) }}
                </span>
                <span v-else>
                  {{ props.row[col.field] }}
                </span>
              </q-td>
            </q-tr>
          </template>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, inject } from "vue";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";
import { formatAmount, roundAmount } from "src/helpers/utils";
import { utils, writeFile } from "xlsx";
const triggerPrint = inject("triggerPrint");
const updateTitle = inject("updateTitle");

const { t } = useI18n();
const route = useRoute();

const defaultFormData = {
  name: "",
  contact: "",
  month: "",
  year: "",
  interval: "0",
  type: "invoice", // already exists for selecting transaction type
  open: true,
  closed: true,
  historyMode: "summary",
  l_partnumber: true,
  l_description: true,
  l_sellprice: true,
  l_curr: false,
  l_qty: true,
  l_unit: false,
  l_discount: true,
  l_deliverydate: false,
  l_projectnumber: false,
  l_serialnumber: false,

  l_invnumber: false,
  l_ordnumber: false,
  l_quonumber: false,
};

const formData = ref({ ...defaultFormData });
const vcType = ref(route.params.type || "customer");

const historyTitle = computed(() =>
  vcType.value === "vendor" ? t("Vendor History") : t("Customer History")
);
updateTitle(historyTitle.value);

const transactionOptions = computed(() => {
  return vcType.value === "vendor"
    ? [
        { label: t("Vendor Invoices"), value: "invoice" },
        { label: t("Purchase Orders"), value: "order" },
        { label: t("Request for Quotations"), value: "quotation" },
      ]
    : [
        { label: t("Sales Invoices"), value: "invoice" },
        { label: t("Sales Orders"), value: "order" },
        { label: t("Quotations"), value: "quotation" },
      ];
});

const monthOptions = [
  { label: t("January"), value: "01" },
  { label: t("February"), value: "02" },
  { label: t("March"), value: "03" },
  { label: t("April"), value: "04" },
  { label: t("May"), value: "05" },
  { label: t("June"), value: "06" },
  { label: t("July"), value: "07" },
  { label: t("August"), value: "08" },
  { label: t("September"), value: "09" },
  { label: t("October"), value: "10" },
  { label: t("November"), value: "11" },
  { label: t("December"), value: "12" },
];

const currentYear = new Date().getFullYear();
const yearOptions = [];
for (let i = currentYear; i >= currentYear - 10; i--) {
  yearOptions.push({ label: i.toString(), value: i.toString() });
}

const filtersOpen = ref(true);
const results = ref([]);

const allColumns = [
  {
    name: "partnumber",
    label: t("Part Number"),
    field: "partnumber",
    align: "left",
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  { name: "qty", label: t("Qty"), field: "qty", align: "right" },
  {
    name: "sellprice",
    label: t("Sell Price"),
    field: "sellprice",
    align: "right",
  },
  { name: "curr", label: t("Currency"), field: "curr", align: "left" },
  { name: "unit", label: t("Unit"), field: "unit", align: "left" },
  {
    name: "discount",
    label: t("Discount"),
    field: "discount",
    align: "left",
  },
  {
    name: "deliverydate",
    label: t("Delivery Date"),
    field: "deliverydate",
    align: "left",
  },
  {
    name: "projectnumber",
    label: t("Project Number"),
    field: "projectnumber",
    align: "left",
  },
  {
    name: "serialnumber",
    label: t("Serial Number"),
    field: "serialnumber",
    align: "left",
  },
];

const finalColumns = computed(() => {
  const cols = allColumns.filter((col) => formData.value[`l_${col.name}`]);
  if (formData.value.l_sellprice) {
    const index = cols.findIndex((c) => c.name === "sellprice");
    if (index >= 0) {
      cols.splice(index + 1, 0, {
        name: "total",
        label: t("Total"),
        field: "total",
        align: "right",
      });
    }
  }
  return cols;
});

let uidCounter = 0;
function getUid() {
  return ++uidCounter;
}

// Returns the proper router link for a group header.
function getGroupLink(id) {
  return vcType.value === "vendor"
    ? `/arap/vendor/?id=${id}`
    : `/arap/customer/?id=${id}`;
}

/*
  Process API results for display.
  In summary mode transactions are grouped by vendor and then by product,
  while detail mode lists each transaction. In detail mode the partnumber field
  is modified based on the selected transaction type.
*/
const processedResults = computed(() => {
  if (!results.value?.length) return [];
  const processed = [];
  const assignUid = (row) => ({ ...row, uid: getUid() });
  const multiplier = vcType.value === "vendor" ? -1 : 1;

  // Group transactions by customer/vendor id.
  const vendorGroups = {};
  results.value.forEach((item) => {
    const key = item.id;
    if (!vendorGroups[key]) {
      vendorGroups[key] = [];
    }
    vendorGroups[key].push(item);
  });

  if (formData.value.historyMode === "summary") {
    Object.values(vendorGroups).forEach((vendorGroup) => {
      // Insert header row with a router link.
      processed.push(
        assignUid({
          ...vendorGroup[0],
          type: "groupHeader",
          name: vendorGroup[0].name || "",
          address: vendorGroup[0].address || "",
        })
      );

      let vendorTotalExtended = 0;
      // Group by product id.
      const productGroups = {};
      vendorGroup.forEach((item) => {
        const pidKey = item.pid;
        if (!productGroups[pidKey]) {
          productGroups[pidKey] = [];
        }
        productGroups[pidKey].push(item);
      });

      Object.values(productGroups).forEach((prodGroup) => {
        let totalExtendedPrice = 0;
        let totalQty = 0;
        let totalDiscount = 0;

        prodGroup.forEach((item) => {
          const discountedPrice =
            item.sellprice * (1 - item.discount) * (item.exchangerate || 1);
          const extendedPrice = discountedPrice * item.qty * multiplier;
          totalExtendedPrice += extendedPrice;
          totalQty += item.qty * multiplier;
          totalDiscount += item.discount * item.qty;
        });

        const avgPrice = totalQty !== 0 ? totalExtendedPrice / totalQty : 0;
        const avgDiscount = totalQty !== 0 ? totalDiscount / totalQty : 0;

        const detailRow = {
          ...prodGroup[0],
          sellprice: avgPrice,
          discount: avgDiscount,
          qty: totalQty,
          type: "summaryDetail",
        };
        if (formData.value.l_sellprice) {
          detailRow.total = detailRow.qty * detailRow.sellprice;
        }
        processed.push(assignUid(detailRow));
        vendorTotalExtended += totalExtendedPrice;
      });

      // Subtotal row showing only the total column.
      if (formData.value.l_sellprice) {
        processed.push(
          assignUid({
            type: "groupSubtotal",
            label: "Subtotal",
            total: vendorTotalExtended,
          })
        );
      }
    });
  } else if (formData.value.historyMode === "detail") {
    Object.values(vendorGroups).forEach((vendorGroup) => {
      processed.push(
        assignUid({
          ...vendorGroup[0],
          type: "groupHeader",
          name: vendorGroup[0].name || "",
          address: vendorGroup[0].address || "",
        })
      );

      let vendorTotal = 0;
      vendorGroup.forEach((item) => {
        const discountedPrice =
          item.sellprice * (1 - item.discount) * (item.exchangerate || 1);
        const extendedPrice = discountedPrice * item.qty * multiplier;
        const detailRow = {
          ...item,
          sellprice: discountedPrice,
          qty: item.qty * multiplier,
          type: "detail",
        };
        // Update partnumber based on the selected transaction type.
        if (formData.value.type === "invoice") {
          detailRow.partnumber = `${item.invnumber} / ${item.partnumber}`;
        } else if (formData.value.type === "order") {
          detailRow.partnumber = `${item.ordnumber} / ${item.partnumber}`;
        } else if (formData.value.type === "quotation") {
          detailRow.partnumber = `${item.quonumber} / ${item.partnumber}`;
        }
        if (formData.value.l_sellprice) {
          detailRow.total = detailRow.qty * detailRow.sellprice;
        }
        processed.push(assignUid(detailRow));
        vendorTotal += extendedPrice;
      });

      // Subtotal row for total column only.
      if (formData.value.l_sellprice) {
        processed.push(
          assignUid({
            type: "groupSubtotal",
            label: "Subtotal",
            total: vendorTotal,
          })
        );
      }
    });
  } else {
    results.value.forEach((item) => processed.push(assignUid(item)));
  }
  return processed;
});

// Reset form fields to their default values.
function clearForm() {
  Object.keys(formData.value).forEach((key) => {
    formData.value[key] = typeof formData.value[key] === "boolean" ? false : "";
  });
  formData.value.open = true;
  formData.value.closed = true;
  formData.value.historyMode = "summary";
}

// Omit empty or false values from the parameters.
function flattenParams(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      v === null ||
      v === undefined ||
      (typeof v === "string" && v.trim() === "")
    )
      continue;
    out[k] = v;
  }
  return out;
}

// Call the history API with the current filters.
async function search() {
  try {
    const params = flattenParams(formData.value);
    params.db = vcType.value;
    const { data } = await api.get(`/${vcType.value}/history`, { params });
    console.log(data);
    results.value = data;
    filtersOpen.value = false;
  } catch (err) {
    console.error(err);
    Notify.create({
      message: err.response?.data?.message || t("Error fetching history"),
      type: "negative",
    });
  }
}
const downloadExcel = () => {
  // Use the computed columns and processed results as displayed on screen.
  const columns = finalColumns.value;
  const rows = processedResults.value;

  // Build the export data array and track group header row indices.
  const exportData = [];
  const groupHeaderIndices = [];
  const headerRow = columns.map((col) => col.label);
  exportData.push(headerRow);

  // Build the rows.
  rows.forEach((row) => {
    if (row.type === "groupHeader") {
      // For group header rows, combine name and address.
      const groupText = `${row.name} ${row.address}`.trim();
      // Create a row with the group text in the first cell and blanks for the rest.
      const newRow = [groupText, ...new Array(columns.length - 1).fill("")];
      // Save the row index so we can merge and center later.
      groupHeaderIndices.push(exportData.length);
      exportData.push(newRow);
    } else if (row.type === "groupSubtotal") {
      // For subtotal rows, fill only the necessary columns.
      const newRow = columns.map((col) => {
        if (col.field === "total") {
          return roundAmount(row.total);
        } else if (col.field === "description") {
          return row.label || "";
        }
        return "";
      });
      exportData.push(newRow);
    } else {
      // For regular data rows, output the values.
      const newRow = columns.map((col) => {
        if (["sellprice", "discount", "total"].includes(col.field)) {
          return roundAmount(row[col.field]);
        }
        return row[col.field] != null ? row[col.field] : "";
      });
      exportData.push(newRow);
    }
  });

  // Create worksheet from the 2D array.
  const worksheet = utils.aoa_to_sheet(exportData);

  // Merge cells for group header rows and set center alignment.
  worksheet["!merges"] = worksheet["!merges"] || [];
  groupHeaderIndices.forEach((rowIdx) => {
    worksheet["!merges"].push({
      s: { r: rowIdx, c: 0 },
      e: { r: rowIdx, c: headerRow.length - 1 },
    });
    // Set the style for the merged cell to be centered.
    const cellRef = utils.encode_cell({ r: rowIdx, c: 0 });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  });

  // Auto-adjust column widths based on content.
  worksheet["!cols"] = headerRow.map((header, index) => {
    let maxLength = header.length;
    exportData.forEach((row) => {
      const cellValue = row[index];
      maxLength = Math.max(
        maxLength,
        cellValue ? cellValue.toString().length : 0
      );
    });
    return { wch: maxLength + 2 };
  });

  // Create a new workbook, append the worksheet, and export the file.
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "AR Transactions");
  writeFile(workbook, `${vcType.value}_history.xlsx`, { compression: true });
};

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
const title = inject("title");
const createPDF = () => {
  const doc = new jsPDF({ orientation: "landscape" });
  let yPosition = 10; // Track vertical position
  doc.setFontSize(18);
  // Center the title on the page
  doc.text(title.value, doc.internal.pageSize.width / 2, yPosition, {
    align: "center",
  });
  doc.setFontSize(16);

  // Extract headers from the finalColumns computed property
  const headerRow = finalColumns.value.map((col) => col.label);
  const exportData = [];

  // Define numeric columns to apply right alignment in PDF cells
  const numericColumns = ["sellprice", "discount", "total"];
  const columnStyles = {};
  finalColumns.value.forEach((col, index) => {
    columnStyles[index] = numericColumns.includes(col.name)
      ? { halign: "right" }
      : { halign: "left" };
  });

  // Process table rows to build the export data
  processedResults.value.forEach((row) => {
    if (row.type === "groupHeader") {
      exportData.push([
        {
          content: `${row.name} ${row.address}`.trim(),
          colSpan: headerRow.length,
          styles: { fontStyle: "bold" },
        },
      ]);
    } else if (row.type === "groupSubtotal") {
      exportData.push(
        finalColumns.value.map((col) => {
          if (numericColumns.includes(col.name))
            return formatAmount(row[col.name]);
          if (col.name === "description") return row.label;
          return "";
        })
      );
    } else {
      exportData.push(
        finalColumns.value.map((col) => {
          if (col.name === "reference") return row.reference;
          if (col.name === "accno") return row.accno;
          if (numericColumns.includes(col.name)) {
            return formatAmount(
              typeof col.field === "function" ? col.field(row) : row[col.field]
            );
          }
          return typeof col.field === "function"
            ? col.field(row)
            : row[col.field];
        })
      );
    }
  });

  // Use autoTable to generate a table in the PDF with the correct styles
  autoTable(doc, {
    head: [headerRow],
    body: exportData,
    startY: 20,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0] },
    columnStyles: columnStyles,
    theme: "striped",
  });

  // Trigger the download of the PDF file
  doc.save("transactions_report.pdf");
};
</script>

<style scoped>
:deep(.q-table__container) {
  height: calc(100vh - 180px);
  position: relative;
}
:deep(.q-table thead tr th) {
  position: sticky;
  top: 0;
  z-index: 2;
  font-weight: bold;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}
.header-row {
  font-weight: bold;
  color: var(--q-lightbg);
  background-color: var(--q-maintext);
}
</style>
