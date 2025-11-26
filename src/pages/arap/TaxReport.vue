<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm hide-print container">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="container-bg"
        v-model="filtersOpen"
      >
        <!-- Loading indicator shown inside params section when fetching -->
        <div v-if="loading" class="q-mt-xs q-py-xs text-center">
          <q-spinner-dots color="primary" size="30px" />
        </div>

        <!-- Search Parameters Section -->
        <div class="row q-mt-xs q-gutter-sm">
          <q-select
            v-if="departments.length > 0"
            v-model="formData.department"
            emit-value
            map-options
            class="lightbg col-3"
            :label="t('Department')"
            input-class="maintext"
            option-label="description"
            option-value="value"
            :options="departments"
            outlined
            dense
          />
          <q-input
            v-model="formData.fromdate"
            type="date"
            :label="t('From Date')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-3"
            outlined
            dense
          />
          <q-input
            v-model="formData.todate"
            type="date"
            :label="t('To Date')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-3"
            outlined
            dense
          />
        </div>

        <!-- Radio Options Section -->
        <div class="row q-mt-sm q-gutter-sm">
          <div class="col-6">
            <q-radio
              v-model="formData.summary"
              val="1"
              :label="t('Summary')"
              color="primary"
            />
            <q-radio
              v-model="formData.summary"
              val="0"
              :label="t('Detail')"
              color="primary"
              class="q-ml-sm"
            />
          </div>
          <div class="col-6">
            <q-radio
              v-model="formData.method"
              val="accrual"
              :label="t('Accrual')"
              color="primary"
            />
            <q-radio
              v-model="formData.method"
              val="cash"
              :label="t('Cash')"
              color="primary"
              class="q-ml-sm"
            />
          </div>
        </div>

        <!-- Tax Accounts Section -->
        <div v-if="taxAccounts.length > 0" class="q-mt-sm">
          <div class="text-subtitle2 q-mb-xs">{{ t("Tax Accounts") }}</div>
          <div class="row">
            <q-checkbox
              v-for="taxAccount in taxAccounts"
              :key="taxAccount.id"
              v-model="formData.selectedTaxAccounts"
              :val="taxAccount.accno"
              :label="taxAccount.label"
              color="primary"
            />
          </div>
        </div>

        <div class="q-py-sm">
          <draggable v-model="baseColumns" item-key="name" class="drag-area">
            <template #item="{ element }">
              <q-checkbox
                size="2rem"
                v-model="selectedColumns[element.name]"
                :label="t(element.label)"
                color="primary"
                class="q-mr-sm maintext"
              />
            </template>
          </draggable>
        </div>

        <div class="row q-mt-sm q-gutter-x-sm justify-end">
          <s-button type="clear" @click="clearForm" />
          <s-button type="search" @click="search" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Results Table -->
    <div v-if="results.length > 0">
      <div class="row q-mb-sm hide-print">
        <q-btn
          :label="t('Export XL')"
          @click="downloadExcel"
          class="q-mr-sm"
          color="accent"
        />
        <q-btn
          :label="t('Export PDF')"
          @click="downloadPDF"
          class="q-mr-sm"
          color="info"
        />
      </div>

      <!-- Grouped Results by Account Number -->
      <div
        v-for="(group, accno, index) in groupedResults"
        :key="accno"
        class="q-mb-md"
      >
        <!-- Account Number Header -->
        <div class="text-subtitle1 text-weight-bold">
          {{ getTaxAccountLabel(accno) }}
        </div>

        <!-- Table for this account group -->
        <q-table
          class="q-mt-sm"
          :rows="group.rows"
          row-key="id"
          :columns="columns"
          flat
          bordered
          dense
          :rows-per-page-options="[0]"
          virtual-scroll-sticky-end
          hide-bottom
        >
          <!-- Invoice Number Column -->
          <template v-slot:body-cell-invnumber="props">
            <q-td :props="props">
              <router-link :to="getPath(props.row)" class="text-primary">
                {{ props.row.invnumber }}
              </router-link>
            </q-td>
          </template>

          <!-- Description Column -->
          <template v-slot:body-cell-description="props">
            <q-td :props="props">
              <div class="wrapped-description">
                {{ props.row.description }}
              </div>
            </q-td>
          </template>

          <!-- Party Name Column -->
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div class="wrapped-description">
                {{ props.row.name }}
              </div>
            </q-td>
          </template>

          <!-- Amount Column -->
          <template v-slot:body-cell-netamount="props">
            <q-td :props="props">{{ formatAmount(props.row.netamount) }}</q-td>
          </template>

          <!-- Tax Column -->
          <template v-slot:body-cell-tax="props">
            <q-td :props="props">{{ formatAmount(props.row.tax) }}</q-td>
          </template>

          <!-- Total Column -->
          <template v-slot:body-cell-total="props">
            <q-td :props="props">{{ formatAmount(props.row.total) }}</q-td>
          </template>

          <!-- Group Totals Row -->
          <template v-slot:bottom-row>
            <q-tr class="totals-row">
              <q-td v-for="col in columns" :align="col.align" :key="col.name">
                <template
                  v-if="
                    ['netamount', 'amount', 'tax', 'total'].includes(col.name)
                  "
                >
                  {{ formatAmount(group.totals[col.name]) || "" }}
                </template>
                <template v-else-if="col.name === 'description'">
                  {{ t("Account Total") }}
                </template>
              </q-td>
            </q-tr>
            <!-- Grand Totals Row (only in last group) -->
            <q-tr
              v-if="index === Object.keys(groupedResults).length - 1"
              class="grand-totals-row"
            >
              <q-td v-for="col in columns" :align="col.align" :key="col.name">
                <template
                  v-if="
                    ['netamount', 'amount', 'tax', 'total'].includes(col.name)
                  "
                >
                  {{ formatAmount(grandTotals[col.name]) || "" }}
                </template>
                <template v-else-if="col.name === 'description'">
                  {{ t("Grand Total") }}
                </template>
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from "vue";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { LocalStorage, Notify } from "quasar";
import draggable from "vuedraggable";
import { useI18n } from "vue-i18n";
import {
  formatAmount,
  roundAmount,
  downloadReport,
  createPDF,
} from "src/helpers/utils";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import { PDF_STYLES, createPDFWithCustomStyles } from "src/helpers/utils.js";

const createLink = inject("createLink");
const { t } = useI18n();
const updateTitle = inject("updateTitle");
const route = useRoute();

// Initialize the type based on route param ("customer" or "vendor")
const type = ref(route.params.type || "customer");

// Computed labels for party selection and number
const partyListLabel = computed(() =>
  type.value === "customer" ? t("Customer") : t("Vendor")
);
const partyNumberLabel = computed(() =>
  type.value === "customer" ? t("Customer Number") : t("Vendor Number")
);

// Form data (with defaults)
const formData = ref({
  department: "",
  fromdate: "",
  todate: "",
  summary: "1", // Default to Summary
  method: "accrual", // Default to Accrual
  selectedTaxAccounts: [],
});

const filtersOpen = route.query.search == 1 ? ref(false) : ref(true);
const results = ref([]);
const totals = ref({});
const loading = ref(false);
const departments = ref([]);
const taxAccounts = ref([]);

const baseColumns = ref([
  { name: "id", label: t("ID"), field: "id", default: false, align: "left" },
  {
    name: "invnumber",
    label: t("Invoice Number"),
    field: "invnumber",
    default: true,
    align: "left",
  },
  {
    name: "transdate",
    label: t("Date"),
    field: "transdate",
    default: true,
    align: "left",
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    default: true,
    sortable: true,
    align: "left",
  },
  {
    name: "name",
    label: partyListLabel.value,
    field: "name",
    default: true,
    align: "left",
  },
  {
    name: "customernumber",
    label: partyNumberLabel.value,
    field: "customernumber",
    default: true,
    align: "left",
  },
  {
    name: "address",
    label: t("Address"),
    field: "address",
    default: false,
    align: "left",
  },
  {
    name: "country",
    label: t("Country"),
    field: "country",
    default: false,
    align: "left",
  },
  {
    name: "taxnumber",
    label: t("Tax Number"),
    field: "taxnumber",
    default: false,
    align: "left",
  },
  {
    name: "netamount",
    label: t("Amount"),
    field: "netamount",
    default: true,
    align: "right",
  },
  { name: "tax", label: t("Tax"), field: "tax", default: true, align: "right" },
  {
    name: "total",
    label: t("Total"),
    field: "total",
    default: true,
    align: "right",
  },
]);

// Set all columns to be sortable
baseColumns.value = baseColumns.value.map((column) => ({
  ...column,
  sortable: true,
}));

const selectedColumns = ref(
  baseColumns.value.reduce((acc, column) => {
    acc[column.name] = column.default;
    return acc;
  }, {})
);

// Process filters from cookies
function processFilters() {
  const savedFilters = LocalStorage.getItem(`${type.value}_tax_report_filters`);

  if (savedFilters) {
    try {
      const parsedFilters =
        typeof savedFilters === "string"
          ? JSON.parse(savedFilters)
          : savedFilters;
      if (
        parsedFilters &&
        typeof parsedFilters === "object" &&
        parsedFilters.columns &&
        parsedFilters.order
      ) {
        selectedColumns.value = {
          ...selectedColumns.value,
          ...parsedFilters.columns,
        };
      } else {
        throw new Error("Invalid filter structure in cookie.");
      }
    } catch (error) {
      console.error("Error parsing saved filters:", error);
      LocalStorage.remove(`${type.value}_tax_report_filters`);
    }
  } else {
    const defaultFilters = {
      columns: baseColumns.value.reduce((acc, column) => {
        acc[column.name] = column.default;
        return acc;
      }, {}),
      order: baseColumns.value.map((col) => col.name),
    };

    LocalStorage.set(`${type.value}_tax_report_filters`, defaultFilters, {
      expires: 30,
    });
    selectedColumns.value = defaultFilters.columns;
    baseColumns.value = defaultFilters.order
      .map((name) => baseColumns.value.find((col) => col.name === name))
      .filter((col) => col !== undefined);
  }
}

watch(
  [selectedColumns, baseColumns],
  () => {
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((col) => col.name),
    };
    try {
      LocalStorage.set(`${type.value}_tax_report_filters`, filters, {
        expires: 30,
      });
    } catch (error) {
      console.error("Error saving filters to cookies:", error);
    }
  },
  { deep: true }
);

const columns = computed(() => {
  return baseColumns.value
    .filter((column) => selectedColumns.value[column.name])
    .map((column) => ({
      ...column,
      label: t(column.label),
    }));
});

const filteredResults = computed(() => {
  return results.value.map((result) => {
    const filtered = {};
    const requiredKeys = ["id", "accno"]; // Always include accno for grouping
    requiredKeys.forEach((key) => {
      filtered[key] = result[key];
    });
    Object.keys(selectedColumns.value).forEach((key) => {
      if (selectedColumns.value[key]) {
        filtered[key] = result[key];
      }
    });
    return filtered;
  });
});

// Group results by accno
const groupedResults = computed(() => {
  const grouped = {};

  filteredResults.value.forEach((result) => {
    const accno = result.accno;

    if (!grouped[accno]) {
      grouped[accno] = {
        rows: [],
        totals: {
          netamount: 0,
          tax: 0,
          total: 0,
          subtotal: 0,
        },
      };
    }

    grouped[accno].rows.push(result);

    // Calculate group totals
    grouped[accno].totals.netamount += parseFloat(result.netamount || 0);
    grouped[accno].totals.tax += parseFloat(result.tax || 0);
    grouped[accno].totals.total += parseFloat(result.total || 0);
    grouped[accno].totals.subtotal += parseFloat(result.subtotal || 0);
  });

  return grouped;
});

// Calculate overall grand totals
const grandTotals = computed(() => {
  const totals = {
    netamount: 0,
    tax: 0,
    total: 0,
    subtotal: 0,
  };

  Object.values(groupedResults.value).forEach((group) => {
    totals.netamount += group.totals.netamount;
    totals.tax += group.totals.tax;
    totals.total += group.totals.total;
    totals.subtotal += group.totals.subtotal;
  });

  return totals;
});

const flattenParams = (obj, prefix = "") => {
  const flattened = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenParams(value, prefix ? `${prefix}[${key}]` : key)
      );
    } else {
      const paramKey = prefix ? `${prefix}[${key}]` : key;
      flattened[paramKey] = value;
    }
  });
  return flattened;
};

const loadParams = () => {
  const query = route.query;

  // Load simple parameters
  const simpleParams = [
    "department",
    "fromdate",
    "todate",
    "summary",
    "method",
  ];

  simpleParams.forEach((key) => {
    if (query[key]) {
      formData.value[key] = query[key];
    }
  });

  // Load selectedTaxAccounts from taxaccounts query parameter
  if (query.taxaccounts) {
    formData.value.selectedTaxAccounts = query.taxaccounts
      .split(" ")
      .filter((acc) => acc.trim());
  }

  // Auto-trigger search if "search" equals "1"
  if (query.search === "1") {
    search();
  }
};

const search = async () => {
  loading.value = true;
  try {
    const params = flattenParams(formData.value);

    // Add taxaccounts as space-separated list if any are selected
    if (formData.value.selectedTaxAccounts.length > 0) {
      params.taxaccounts = formData.value.selectedTaxAccounts.join(" ");
    }

    // Dynamic endpoint: /arap/taxreport/customer or /arap/taxreport/vendor
    const response = await api.get(`/taxreport/${type.value}`, {
      params,
    });
    filtersOpen.value = false;
    results.value = response.data || [];
    // Calculate totals from results if not provided by API
    totals.value = calculateTotals(results.value);
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || t("Error performing search"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const calculateTotals = (data) => {
  const totals = {
    amount: 0,
    tax: 0,
    total: 0,
    subtotal: 0,
  };

  data.forEach((row) => {
    totals.amount += parseFloat(row.netamount || 0);
    totals.tax += parseFloat(row.tax || 0);
    totals.total += parseFloat(row.total || 0);
    totals.subtotal += parseFloat(row.subtotal || 0);
  });

  return totals;
};

const clearForm = () => {
  formData.value = {
    department: "",
    fromdate: "",
    todate: "",
    summary: "1",
    method: "accrual",
    selectedTaxAccounts: [],
  };
};

const getPath = (row) => {
  // This can be customized based on your routing needs
  const path =
    type.value === "customer"
      ? createLink(
          row.invoice === 1 ? "customer.invoice" : "customer.transaction"
        )
      : createLink(row.invoice === 1 ? "vendor.invoice" : "vendor.transaction");

  const flatParams = flattenParams(formData.value);
  return {
    path,
    query: {
      id: row.id,
      ...flatParams,
      callback: createLink("base") + `/arap/taxreport/${type.value}/`,
    },
  };
};

const downloadExcel = () => {
  const exportData = [];

  // Add title
  exportData.push([title.value]);
  exportData.push([]); // Empty row for spacing

  // Add header row
  const headerRow = columns.value.map((col) => col.label);
  exportData.push(headerRow);

  // Process each account group
  Object.entries(groupedResults.value).forEach(([accno, group]) => {
    // Add account header
    exportData.push([getTaxAccountLabel(accno)]);

    // Add transactions for this account
    group.rows.forEach((row) => {
      const dataRow = columns.value.map((col) => {
        if (["netamount", "tax", "total"].includes(col.name)) {
          return roundAmount(row[col.field]);
        }
        return row[col.field] || "";
      });
      exportData.push(dataRow);
    });

    // Add account totals
    const totalsRow = columns.value.map((col) => {
      if (["netamount", "tax", "total"].includes(col.name)) {
        return formatAmount(group.totals[col.name]);
      }
      if (col.name === "description") {
        return t("Account Total");
      }
      return "";
    });
    exportData.push(totalsRow);
    exportData.push([]); // Empty row for spacing
  });

  // Add grand totals
  const grandTotalsRow = columns.value.map((col) => {
    if (["netamount", "tax", "total"].includes(col.name)) {
      return formatAmount(grandTotals.value[col.name]);
    }
    if (col.name === "description") {
      return t("Grand Total");
    }
    return "";
  });
  exportData.push(grandTotalsRow);

  // Create worksheet
  const worksheet = utils.aoa_to_sheet(exportData);

  // Auto-adjust column widths
  worksheet["!cols"] = headerRow.map((header, index) => {
    let maxLength = header.length;
    exportData.forEach((row) => {
      const cellValue = row[index];
      maxLength = Math.max(maxLength, cellValue?.toString().length || 0);
    });
    return { wch: maxLength + 2 };
  });

  // Create workbook and save
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Tax Report");
  writeFile(workbook, "tax_report.xlsx", { compression: true });
};

const title = inject("title");
const downloadPDF = () => {
  const doc = new jsPDF({ orientation: "landscape" });
  let yPosition = 10;

  // Add title using centralized styles
  doc.setFontSize(PDF_STYLES.title.fontSize);
  doc.text(title.value, doc.internal.pageSize.width / 2, yPosition, {
    align: PDF_STYLES.title.alignment,
  });
  yPosition += 10;

  // Process each account group
  Object.entries(groupedResults.value).forEach(([accno, group]) => {
    // Add account header using centralized styles
    doc.setFontSize(PDF_STYLES.subtitle.fontSize);
    doc.text(getTaxAccountLabel(accno), 15, yPosition);
    yPosition += 8;

    // Prepare table data
    const tableData = [];

    // Add header row
    const headerRow = columns.value.map((col) => col.label);

    // Add transactions
    group.rows.forEach((row) => {
      const dataRow = columns.value.map((col) => {
        if (["netamount", "tax", "total"].includes(col.name)) {
          return formatAmount(row[col.field]);
        }
        return row[col.field] || "";
      });
      tableData.push(dataRow);
    });

    // Add account totals
    const totalsRow = columns.value.map((col) => {
      if (["netamount", "tax", "total"].includes(col.name)) {
        return formatAmount(group.totals[col.name]);
      }
      if (col.name === "description") {
        return t("Account Total");
      }
      return "";
    });
    tableData.push(totalsRow);

    // Generate table using centralized styles for tabular layout with grey lines
    const columnStyles = Object.fromEntries(
      columns.value.map((col, index) => [
        index,
        ["netamount", "tax", "total"].includes(col.name)
          ? { halign: "right" }
          : {},
      ])
    );

    createPDFWithCustomStyles(doc, headerRow, tableData, {
      startY: yPosition,
      columnStyles: columnStyles,
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  });

  // Add grand totals
  const grandTotalsRow = columns.value.map((col) => {
    if (["netamount", "tax", "total"].includes(col.name)) {
      return formatAmount(grandTotals.value[col.name]);
    }
    if (col.name === "description") {
      return t("Grand Total");
    }
    return "";
  });

  // Generate grand totals table with centralized styles
  createPDFWithCustomStyles(doc, [], [grandTotalsRow], {
    startY: yPosition,
    columnStyles: Object.fromEntries(
      columns.value.map((col, index) => [
        index,
        ["netamount", "tax", "total"].includes(col.name)
          ? { halign: "right" }
          : {},
      ])
    ),
    styles: { ...PDF_STYLES.table.styles, ...PDF_STYLES.totals },
  });

  doc.save("tax_report.pdf");
};

const create_links = async () => {
  try {
    const response = await api.get("/create_links/tax_report");
    departments.value = response.data.departments || [];
    taxAccounts.value = response.data.tax_accounts || [];

    // Default all tax accounts to be selected
    formData.value.selectedTaxAccounts = taxAccounts.value.map(
      (account) => account.accno
    );
  } catch (error) {
    console.error("Error fetching initial data:", error);
    Notify.create({
      message:
        error.response?.data?.message || t("Error fetching initial data"),
      type: "negative",
      position: "center",
    });
  }
};

// Method to get tax account label by account number
const getTaxAccountLabel = (accno) => {
  const taxAccount = taxAccounts.value.find(
    (account) => account.accno === accno
  );
  return taxAccount ? taxAccount.label : accno;
};

onMounted(async () => {
  processFilters();
  updateTitle(type.value === "customer" ? "Tax Collected" : "Tax Paid");
  loadParams();
  await create_links();
});
</script>

<style scoped>
/* Condensed/dense layout adjustments */
.drag-area {
  display: flex;
  flex-wrap: wrap;
}

:deep(.q-table thead) {
  position: sticky;
  z-index: 2;
  top: 0;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

:deep(.q-table thead tr) {
  position: sticky;
  top: 0;
  z-index: 2;
}

:deep(.q-table thead tr th) {
  position: sticky;
  top: 0;
  z-index: 2;
  font-weight: var(--q-font-weight-bolder);
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}

.q-table--loading {
  opacity: 0.7;
  transition: opacity 0.3s ease-in-out;
}

:deep(.totals-row) {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 2;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.12);
}

:deep(.totals-row td) {
  position: sticky !important;
  bottom: 0 !important;
  font-weight: var(--q-font-weight-bolder);
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}

:deep(.grand-totals-row) {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 2;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.12);
}

:deep(.grand-totals-row td) {
  position: sticky !important;
  bottom: 0 !important;
  font-weight: var(--q-font-weight-bolder);
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}

:deep(.q-virtual-scroll__content) {
  margin-bottom: 0 !important;
}

:deep(.q-table td) {
  padding: 4px 8px;
}

.wrapped-description {
  white-space: pre-wrap;
  min-width: 10vw;
}

.account-header {
  background-color: var(--q-secondary);
  color: var(--q-mainbg);
  border-radius: 4px;
}
</style>
