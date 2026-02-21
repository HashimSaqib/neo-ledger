<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm mainbg hide-print">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <!-- Loading indicator shown inside params section when fetching -->
        <div v-if="loading" class="q-mt-xs q-py-xs text-center">
          <q-spinner-dots color="primary" size="30px" />
        </div>

        <!-- Search Parameters Section -->
        <div v-if="paymentAccounts.length > 0" class="q-mt-sm">
          <div class="text-subtitle2 q-mb-xs">{{ t("Payment Accounts") }}</div>
          <div class="row q-gutter-sm">
            <q-checkbox
              v-for="account in paymentAccounts"
              :key="account.id"
              v-model="formData.paymentaccounts"
              :val="account.accno"
              :label="`${account.accno} - ${account.description}`"
              color="primary"
            />
          </div>
        </div>
        <div class="row q-mt-xs q-gutter-sm">
          <s-select
            v-model="formData.vc"
            :label="vcLabel"
            input-class="maintext"
            option-label="label"
            option-value="name"
            :options="vcList"
            search="label"
            outlined
            dense
            emit-value
            map-options
          />
          <s-select
            v-if="departments.length > 0"
            v-model="formData.department_id"
            emit-value
            map-options
            class="lightbg col-3"
            :label="t('Department')"
            input-class="maintext"
            option-label="description"
            option-value="id"
            :options="departments"
            search="description"
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

        <!-- Additional Filters -->
        <div class="row q-mt-sm q-gutter-sm">
          <q-input
            v-model="formData.description"
            :label="t('Description')"
            class="lightbg col-3"
            outlined
            dense
          />
          <q-input
            v-model="formData.source"
            :label="t('Source')"
            class="lightbg col-3"
            outlined
            dense
          />
          <q-input
            v-model="formData.memo"
            :label="t('Memo')"
            class="lightbg col-3"
            outlined
            dense
          />
        </div>

        <!-- FX Transaction Toggle -->
        <div class="row q-mt-sm">
          <q-checkbox
            v-model="formData.fx_transaction"
            :label="t('Show FX Transactions')"
            color="primary"
          />
        </div>

        <!-- Column Selection -->
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

        <div class="row q-mt-sm q-gutter-x-sm">
          <q-btn
            type="submit"
            :label="t('Search')"
            color="primary"
            @click="search"
          />
          <q-btn :label="t('Clear')" @click="clearForm" />
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

      <!-- Grouped Results by Account -->
      <div
        v-for="(group, accno, index) in groupedResults"
        :key="accno"
        class="q-mb-md"
      >
        <!-- Account Header -->
        <div class="text-subtitle1 text-weight-bold">
          {{ getAccountDescription(accno) }}
        </div>

        <!-- Table for this account group -->
        <q-table
          class="q-mt-sm"
          :rows="group.rows"
          row-key="trans_id"
          :columns="columns"
          flat
          bordered
          dense
          :rows-per-page-options="[0]"
          virtual-scroll-sticky-end
          hide-bottom
        >
          <!-- Reference Column -->
          <template v-slot:body-cell-reference="props">
            <q-td :props="props">
              <router-link :to="getPath(props.row)" class="text-primary">
                {{ props.row.reference }}
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

          <!-- Name Column -->
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <div class="wrapped-description">
                {{ props.row.name }}
              </div>
            </q-td>
          </template>

          <!-- Amount Column -->
          <template v-slot:body-cell-paid="props">
            <q-td :props="props">{{ formatAmount(props.row.paid) }}</q-td>
          </template>

          <!-- Group Totals Row -->
          <template v-slot:bottom-row>
            <q-tr class="totals-row">
              <q-td v-for="col in columns" :align="col.align" :key="col.name">
                <template v-if="col.name === 'paid'">
                  {{ formatAmount(group.totals.paid) || "" }}
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
                <template v-if="col.name === 'paid'">
                  {{ formatAmount(grandTotals.paid) || "" }}
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
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";
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
const type = ref(route.params.vc || "customer");
const vcLabel = ref(type.value === "customer" ? "Customers" : "Vendors");
// Form data (with defaults)
const formData = ref({
  department_id: "",
  fromdate: "",
  todate: "",
  paymentaccounts: [],
  description: "",
  source: "",
  memo: "",
  fx_transaction: false,
  till: "",
  vc: "",
});

const filtersOpen = route.query.search == 1 ? ref(false) : ref(true);
const results = ref([]);
const loading = ref(false);
const departments = ref([]);
const paymentAccounts = ref([]);
const vcList = ref([]);
const baseColumns = ref([
  {
    name: "transdate",
    label: "Date",
    field: "transdate",
    default: true,
    align: "left",
  },
  {
    name: "reference",
    label: "Reference",
    field: "reference",
    default: true,
    align: "left",
  },
  {
    name: "description",
    label: "Description",
    field: "description",
    default: true,
    align: "left",
  },
  {
    name: "name",
    label: type.value === "customer" ? "Customer" : "Vendor",
    field: "name",
    default: true,
    align: "left",
  },
  {
    name: "source",
    label: "Source",
    field: "source",
    default: true,
    align: "left",
  },
  {
    name: "memo",
    label: "Memo",
    field: "memo",
    default: true,
    align: "left",
  },
  {
    name: "paid",
    label: "Amount",
    field: "paid",
    default: true,
    align: "right",
  },
  {
    name: "curr",
    label: "Currency",
    field: "curr",
    default: true,
    align: "left",
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

// Process filters from LocalStorage
function processFilters() {
  const storageKey = `cash.report.${type.value}`;
  const savedFilters = LocalStorage.getItem(storageKey);

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
        baseColumns.value = parsedFilters.order
          .map((name) => baseColumns.value.find((col) => col.name === name))
          .filter((col) => col !== undefined);
      } else {
        throw new Error("Invalid filter structure in storage.");
      }
    } catch (error) {
      console.error("Error parsing saved filters:", error);
      LocalStorage.remove(storageKey);
    }
  } else {
    const defaultFilters = {
      columns: baseColumns.value.reduce((acc, column) => {
        acc[column.name] = column.default;
        return acc;
      }, {}),
      order: baseColumns.value.map((col) => col.name),
    };

    LocalStorage.set(storageKey, defaultFilters, {
      expires: 30,
    });
    selectedColumns.value = defaultFilters.columns;
  }
}

watch(
  [selectedColumns, baseColumns],
  () => {
    const storageKey = `cash.report.${type.value}`;
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((col) => col.name),
    };
    try {
      LocalStorage.set(storageKey, filters, {
        expires: 30,
      });
    } catch (error) {
      console.error("Error saving filters to storage:", error);
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

const loadParams = () => {
  const query = route.query;

  // Load simple parameters
  const simpleParams = [
    "department_id",
    "fromdate",
    "todate",
    "description",
    "source",
    "memo",
    "till",
  ];

  simpleParams.forEach((key) => {
    if (query[key]) {
      formData.value[key] = query[key];
    }
  });

  // Load payment accounts
  if (query.paymentaccounts) {
    formData.value.paymentaccounts = query.paymentaccounts
      .split(" ")
      .filter((acc) => acc.trim());
  }

  // Load boolean parameters
  if (query.fx_transaction) {
    formData.value.fx_transaction = query.fx_transaction === "true";
  }

  // Auto-trigger search if "search" equals "1"
  if (query.search === "1") {
    search();
  }
};

const search = async () => {
  loading.value = true;
  try {
    const params = {
      department_id: formData.value.department_id,
      fromdate: formData.value.fromdate,
      todate: formData.value.todate,
      description: formData.value.description,
      source: formData.value.source,
      memo: formData.value.memo,
      fx_transaction: formData.value.fx_transaction,
      vc_name: formData.value.vc,
    };

    // Add paymentaccounts as space-separated list if any are selected
    if (formData.value.paymentaccounts.length > 0) {
      params.paymentaccounts = formData.value.paymentaccounts.join(" ");
    }

    const response = await api.get(`/cash/report/${type.value}`, {
      params,
    });
    filtersOpen.value = false;
    results.value = response.data || [];
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || "Error performing search",
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const clearForm = () => {
  formData.value = {
    department_id: "",
    fromdate: "",
    todate: "",
    paymentaccounts: [],
    description: "",
    source: "",
    memo: "",
    fx_transaction: false,
    till: "",
  };
};

const getPath = (row) => {
  const path = createLink(
    row.module === "ar"
      ? "customer.transaction"
      : row.module === "ap"
      ? "vendor.transaction"
      : "gl.transaction"
  );

  return {
    path,
    query: {
      id: row.trans_id,
      callback: createLink("base") + `/cash/report/${type.value}/`,
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
    exportData.push([getAccountDescription(accno)]);

    // Add transactions for this account
    group.rows.forEach((row) => {
      const dataRow = columns.value.map((col) => {
        if (col.name === "paid") {
          return roundAmount(row[col.field]);
        }
        return row[col.field] || "";
      });
      exportData.push(dataRow);
    });

    // Add account totals
    const totalsRow = columns.value.map((col) => {
      if (col.name === "paid") {
        return formatAmount(group.totals.paid);
      }
      if (col.name === "description") {
        return "Account Total";
      }
      return "";
    });
    exportData.push(totalsRow);
    exportData.push([]); // Empty row for spacing
  });

  // Add grand totals
  const grandTotalsRow = columns.value.map((col) => {
    if (col.name === "paid") {
      return formatAmount(grandTotals.value.paid);
    }
    if (col.name === "description") {
      return "Grand Total";
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
  utils.book_append_sheet(workbook, worksheet, "Payments Report");
  writeFile(workbook, "payments_report.xlsx", { compression: true });
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
    doc.text(getAccountDescription(accno), 15, yPosition);
    yPosition += 8;

    // Prepare table data
    const tableData = [];

    // Add header row
    const headerRow = columns.value.map((col) => col.label);

    // Add transactions
    group.rows.forEach((row) => {
      const dataRow = columns.value.map((col) => {
        if (col.name === "paid") {
          return formatAmount(row[col.field]);
        }
        return row[col.field] || "";
      });
      tableData.push(dataRow);
    });

    // Add account totals
    const totalsRow = columns.value.map((col) => {
      if (col.name === "paid") {
        return formatAmount(group.totals.paid);
      }
      if (col.name === "description") {
        return "Account Total";
      }
      return "";
    });
    tableData.push(totalsRow);

    // Generate table: numeric columns right-aligned, no line break
    const columnStyles = Object.fromEntries(
      columns.value.map((col, index) => [
        index,
        col.name === "paid" ? { halign: "right", overflow: "hidden" } : {},
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
    if (col.name === "paid") {
      return formatAmount(grandTotals.value.paid);
    }
    if (col.name === "description") {
      return "Grand Total";
    }
    return "";
  });

  // Generate grand totals table
  createPDFWithCustomStyles(doc, [], [grandTotalsRow], {
    startY: yPosition,
    columnStyles: Object.fromEntries(
      columns.value.map((col, index) => [
        index,
        col.name === "paid" ? { halign: "right", overflow: "hidden" } : {},
      ])
    ),
    styles: { ...PDF_STYLES.transactionTable.styles, ...PDF_STYLES.totals },
  });

  doc.save("payments_report.pdf");
};
const create_links = async () => {
  try {
    const response = await api.get("/create_links/payments_report");
    departments.value = response.data.departments || [];

    // Filter payment accounts based on the appropriate link type
    const linkType = type.value === "customer" ? "AR_paid" : "AP_paid";
    paymentAccounts.value = response.data.accounts.all.filter((account) => {
      const links = account.link.split(":");
      return links.some((link) => link.trim() === linkType);
    });

    // Default all payment accounts to be selected
    formData.value.paymentaccounts = paymentAccounts.value.map(
      (account) => account.accno
    );
    vcList.value =
      type.value === "customer"
        ? response.data.customers
        : response.data.vendors;
  } catch (error) {
    console.error("Error fetching initial data:", error);
    Notify.create({
      message: error.response?.data?.message || "Error fetching initial data",
      type: "negative",
      position: "center",
    });
  }
};

// Method to get account description by account number
const getAccountDescription = (accno) => {
  const account = paymentAccounts.value.find(
    (account) => account.accno === accno
  );
  return account ? account.description : accno;
};

// Group results by account
const groupedResults = computed(() => {
  const grouped = {};

  results.value.forEach((account) => {
    const accno = account.accno;
    if (!grouped[accno]) {
      grouped[accno] = {
        rows: [],
        totals: {
          paid: 0,
        },
      };
    }

    // Add transactions for this account
    if (account.transactions && Array.isArray(account.transactions)) {
      account.transactions.forEach((transaction) => {
        grouped[accno].rows.push(transaction);
        grouped[accno].totals.paid += parseFloat(transaction.paid || 0);
      });
    }
  });

  return grouped;
});

// Calculate overall grand totals
const grandTotals = computed(() => {
  const totals = {
    paid: 0,
  };

  Object.values(groupedResults.value).forEach((group) => {
    totals.paid += group.totals.paid;
  });

  return totals;
});

onMounted(async () => {
  processFilters();
  updateTitle(
    type.value === "customer" ? "Customer Payments" : "Vendor Payments"
  );
  loadParams();
  await create_links();
});
</script>

<style scoped>
/* Condensed/dense layout adjustments */
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

/* Add drag area styles */
.drag-area {
  display: flex;
  flex-wrap: wrap;
}
</style>
