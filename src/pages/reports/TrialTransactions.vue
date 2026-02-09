<template>
  <q-page class="lightbg q-px-md q-py-md relative-position">
    <!-- Actions: Print PDF & Export -->

    <h6 class="q-my-none q-py-none">
      {{ `Account ${accno} - ${description}` }}
    </h6>
    <!-- Transactions Table -->
    <div v-if="results.length > 0" class="q-mt-md">
      <div class="row q-mb-sm hide-print">
        <q-btn
          :label="t('Export')"
          @click="downloadExcel"
          class="q-mr-sm"
          color="accent"
        />
        <q-btn
          :label="t('Print')"
          @click="downloadPDF"
          class="q-mr-sm"
          color="info"
        />
      </div>
      <q-table
        :key="tableKey"
        table-class="mainbg maintext"
        flat
        bordered
        dense
        hide-bottom
        virtual-scroll
        :virtual-scroll-slice-size="30"
        :virtual-scroll-item-size="48"
        :rows-per-page-options="[0]"
        virtual-scroll-sticky-end
        :rows="tableRows"
        :columns="columns"
        row-key="id"
      >
        <template v-slot:body="props">
          <q-tr
            :props="props"
            :class="props.rowIndex % 2 === 0 ? 'lightbg' : 'mainbg'"
          >
            <q-td
              v-for="col in columns"
              :key="col.name"
              :props="props"
              :class="
                ['reference', 'description', 'source'].includes(col.name)
                  ? 'description-cell'
                  : ''
              "
            >
              <template v-if="col.name === 'reference'">
                <span class="wrapped-description">
                  <router-link :to="getPath(props.row)" class="text-primary">
                    {{ props.row.reference }}
                  </router-link>
                </span>
              </template>
              <template
                v-else-if="col.name === 'description' || col.name === 'source'"
              >
                <span class="wrapped-description">{{
                  props.row[col.field]
                }}</span>
              </template>
              <template v-else-if="col.name === 'files'">
                <file-list :files="props.row.files" :report="true" />
              </template>
              <template v-else>
                <template
                  v-if="
                    col.name === 'debit' ||
                    col.name === 'credit' ||
                    col.name === 'balance'
                  "
                >
                  {{ formatAmount(props.row[col.field]) }}
                </template>
                <template v-else>
                  {{ props.row[col.field] }}
                </template>
              </template>
            </q-td>
          </q-tr>
        </template>
        <!-- Totals row (sticky at bottom with virtual-scroll-sticky-end) -->
        <template v-slot:bottom-row v-if="totals">
          <q-tr class="totals-row">
            <q-td
              v-for="col in columns"
              :key="col.name"
              :style="{ textAlign: col.align || 'left' }"
            >
              <template v-if="col.name === 'description'">
                <strong>{{ totals.description }}</strong>
              </template>
              <template
                v-else-if="
                  col.name === 'debit' ||
                  col.name === 'credit' ||
                  col.name === 'balance'
                "
              >
                {{ formatAmount(totals[col.name]) || "" }}
              </template>
              <template v-else>&nbsp;</template>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
/* Imports & Dependencies */
import { ref, computed, onMounted, inject } from "vue";
import { api } from "src/boot/axios";
import { formatAmount, createPDF } from "src/helpers/utils";
import { useRoute } from "vue-router";
import { utils, writeFile } from "xlsx";
import { useI18n } from "vue-i18n";
import FileList from "src/components/FileList.vue";
const { t } = useI18n();
/* Update Page Title & Inject Print Function */
const updateTitle = inject("updateTitle");
updateTitle(t("Transactions"));
const triggerPrint = inject("triggerPrint");

/* Reactive State & Form Data */
const route = useRoute();
const formData = ref({
  accno: route.query.accno,
  fromdate: route.query.fromdate,
  todate: route.query.todate,
  project: route.query.project,
  department: route.query.department,
});
const filtersOpen = ref(true);
const results = ref([]);
const accno = ref("");
const description = ref("");
const tableKey = ref(0);

/* Base Columns & Column Selection */
const baseColumns = ref([
  {
    name: "transdate",
    align: "left",
    label: "Date",
    field: "transdate",
    sortable: true,
    slot: true,
    default: true,
  },
  {
    name: "reference",
    align: "left",
    label: "Reference",
    field: "reference",
    default: true,
    style: "max-width: 300px",
  },
  {
    name: "description",
    align: "left",
    label: "Description",
    field: "description",
    default: true,
    style: "max-width: 300px",
  },
  {
    name: "files",
    align: "left",
    label: "Files",
    field: "files",
    default: true,
  },
  {
    name: "source",
    align: "left",
    label: "Source",
    field: "source",
    default: true,
    style: "max-width: 300px",
  },
  {
    name: "cleared",
    align: "left",
    label: "R",
    field: "cleared",
    default: true,
  },
  {
    name: "debit",
    align: "left",
    label: "Debit",
    field: "debit",
    default: true,
  },
  {
    name: "credit",
    align: "left",
    label: "Credit",
    field: "credit",
    default: true,
  },
  {
    name: "balance",
    align: "left",
    label: "Balance",
    field: "balance",
    default: true,
  },
]);

const selectedColumns = ref(
  baseColumns.value.reduce((acc, column) => {
    acc[column.name] = column.default;
    return acc;
  }, {}),
);

const columns = computed(() => {
  return baseColumns.value.filter(
    (column) => selectedColumns.value[column.name],
  );
});

/* Helper: Format Each Row */
function formatRow(result) {
  const formatted = {};
  Object.keys(selectedColumns.value).forEach((key) => {
    if (selectedColumns.value[key]) {
      formatted[key] = result[key];
    }
  });
  // Additional fields for linking and identification
  formatted.charttype = result.charttype;
  formatted.type = result.module;
  formatted.module = result.module;
  formatted.id = result.id;
  formatted.till = result.till;
  formatted.accno = result.accno;
  formatted.rowKey = result.id;
  return formatted;
}

/* Table rows only (no total) - for virtual scroll, same as GlTransactions */
const tableRows = computed(() => {
  let balance = 0;
  const requiredKeys = ["module", "invoice", "till", "db"];
  return results.value.map((result) => {
    const formatted = formatRow(result);
    requiredKeys.forEach((key) => {
      formatted[key] = result[key];
    });
    const debit = parseFloat(formatted.debit) || 0;
    const credit = parseFloat(formatted.credit) || 0;
    balance += debit - credit;
    formatted.balance = balance;
    formatted.module = result.module;
    return formatted;
  });
});

/* Totals for footer slot - same pattern as GlTransactions */
const totals = computed(() => {
  if (tableRows.value.length === 0) return null;
  let totalDebits = 0;
  let totalCredits = 0;
  let balance = 0;
  tableRows.value.forEach((row) => {
    const debit = parseFloat(row.debit) || 0;
    const credit = parseFloat(row.credit) || 0;
    totalDebits += debit;
    totalCredits += credit;
    balance += debit - credit;
  });
  return {
    description: "Total",
    debit: totalDebits,
    credit: totalCredits,
    balance,
  };
});
const createLink = inject("createLink");

/* Helper: Get Navigation Path for a Transaction Row */
const getPath = (row) => {
  if (!row || !row.module) return null;

  let path = "";

  if (row.module === "gl") {
    path = createLink("gl.transaction");
  } else if (row.module === "ar" || row.module === "is") {
    if (row.till) {
      path = createLink("customer.pos");
    } else if (row.invoice === 1) {
      path = createLink("customer.invoice");
    } else {
      path = createLink("customer.transaction");
    }
  } else if (row.module === "ir" || row.module === "ap") {
    if (row.invoice === 1) {
      path = createLink("vendor.invoice");
    } else {
      path = createLink("vendor.transaction");
    }
  }

  if (!path) return null;

  return {
    path,
    query: {
      id: row.id,
      ...formData.value,
      search: 1,
      callback: createLink("base") + `/gl/reports`,
    },
  };
};

/* Fetch Transactions from API */
const search = async () => {
  try {
    const response = await api.get("/reports/transactions", {
      params: formData.value,
    });
    filtersOpen.value = false;
    results.value = response.data.transactions;
    accno.value = response.data.accno;
    description.value = response.data.description;
    tableKey.value += 1;
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  search();
});

/* Export Transactions as Excel */
const downloadExcel = () => {
  // Create header row from baseColumns labels
  const headerRow = baseColumns.value.map((col) => col.label);
  const exportData = [];
  exportData.push(["Trial Transactions"]);
  exportData.push([]);
  exportData.push(headerRow);

  // Add transaction rows
  tableRows.value.forEach((row) => {
    const dataRow = baseColumns.value.map((col) => {
      if (["debit", "credit", "balance"].includes(col.name)) {
        return row[col.field] ? parseFloat(row[col.field]) : 0;
      }
      return row[col.field] || "";
    });
    exportData.push(dataRow);
  });

  // Append total row
  if (totals.value) {
    const totalDataRow = baseColumns.value.map((col) => {
      if (col.name === "description") return totals.value.description;
      if (["debit", "credit", "balance"].includes(col.name)) {
        return totals.value[col.name] ?? 0;
      }
      return "";
    });
    exportData.push([]);
    exportData.push(totalDataRow);
  }

  // Create worksheet from exportData
  const worksheet = utils.aoa_to_sheet(exportData);
  worksheet["!merges"] = worksheet["!merges"] || [];
  // Merge the first row (title) across all header columns
  worksheet["!merges"].push({
    s: { r: 0, c: 0 },
    e: { r: 0, c: headerRow.length - 1 },
  });
  // Auto-adjust column widths
  worksheet["!cols"] = headerRow.map((header, colIdx) => {
    let maxLength = header.length;
    exportData.forEach((row) => {
      const cellValue = row[colIdx];
      if (cellValue != null) {
        maxLength = Math.max(maxLength, cellValue.toString().length);
      }
    });
    return { wch: maxLength + 2 };
  });

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Trial Transactions");
  writeFile(workbook, "trial_transactions.xlsx", { compression: true });
};
const title = inject("title");
const downloadPDF = () => {
  const rowsWithTotal = totals.value
    ? [...tableRows.value, { ...totals.value, isTotalRow: true }]
    : tableRows.value;
  createPDF(rowsWithTotal, columns.value, [], title.value);
};
</script>

<style scoped>
@media print {
  :deep(.q-table__container) {
    height: auto !important;
    overflow: visible !important;
    position: static !important;
  }
  :deep(.q-virtual-scroll__content) {
    transform: none !important;
  }
  :deep(.totals-row) {
    position: static !important;
  }
}

:deep(.q-table__container) {
  height: calc(100vh - 180px);
  position: relative;
}
:deep(.q-table thead) {
  position: sticky;
  z-index: 2;
  top: 0;
  background-color: var(--q-maintext);
  color: var(--q-maindark);
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
:deep(.q-table td) {
  padding: 8px 16px;
}
:deep(.q-virtual-scroll__content) {
  margin-bottom: 0 !important;
}
.description-cell {
  max-width: 300px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.wrapped-description {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: block;
}
</style>
