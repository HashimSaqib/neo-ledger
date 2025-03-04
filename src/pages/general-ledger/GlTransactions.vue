<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <!-- Search form -->
    <q-form @submit.prevent class="q-pa-sm mainbg">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <q-input
          v-model="formData.reference"
          class="lightbg q-my-md"
          :label="t('Reference')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="formData.description"
          class="lightbg q-my-md"
          :label="t('Description')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="formData.companyName"
          class="lightbg q-my-md"
          :label="t('Company Name')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="formData.department"
          class="lightbg q-my-md"
          :label="t('Department')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="formData.lineitem"
          class="lightbg q-my-md"
          :label="t('Line Item')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="formData.source"
          class="lightbg q-my-md"
          :label="t('Source')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="formData.memo"
          class="lightbg q-my-md"
          :label="t('Memo')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <div class="row justify-between q-my-md">
          <q-input
            v-model="formData.accnofrom"
            class="lightbg col-5"
            :label="t('Account Number From')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.accnoto"
            :label="t('Account Number To')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-5"
            outlined
            dense
          />
        </div>

        <div class="row justify-between q-my-md">
          <q-input
            v-model="formData.datefrom"
            type="date"
            :label="t('Date From')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-5"
            outlined
            dense
          />
          <q-input
            v-model="formData.dateto"
            type="date"
            :label="t('Date To')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-5"
            outlined
            dense
          />
        </div>
        <div class="row justify-between">
          <q-input
            v-model="formData.amountfrom"
            type="number"
            :label="t('Amount From')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-5"
            outlined
            dense
          />
          <q-input
            v-model="formData.amountto"
            type="number"
            :label="t('Amount To')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-5"
            outlined
            dense
          />
        </div>
        <div class="q-py-md justify-center align-items-center">
          <q-checkbox
            v-model="splitLedger"
            :label="t('Split Ledger')"
            size="2rem"
          />
          <draggable v-model="baseColumns" item-key="name" class="drag-area">
            <template #item="{ element }">
              <q-checkbox
                size="2rem"
                v-model="selectedColumns[element.name]"
                :label="t(element.label)"
                color="primary"
                class="q-mr-md maintext"
              />
            </template>
          </draggable>

          <q-btn
            type="submit"
            :label="t('Search')"
            color="primary"
            class="q-mt-md"
            @click="search"
          />
        </div>
        <q-inner-loading :showing="loading">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
      </q-expansion-item>
    </q-form>

    <!-- New action buttons: Export and clear accno filter -->
    <div class="row items-center q-mt-md">
      <q-btn
        label="Export"
        color="accent"
        @click="downloadTransactions"
        class="q-mx-md"
        v-if="results.length > 0"
      />
      <q-btn
        v-if="formData.accno"
        label="View All Transactions"
        color="secondary"
        @click="clearAccnoFilter"
      />
    </div>

    <!-- Results table -->
    <div v-if="results.length > 0" class="q-mt-md">
      <q-table
        :key="tableKey"
        flat
        bordered
        dense
        virtual-scroll
        :rows="tableRows"
        :columns="displayColumns"
        row-key="id"
        :rows-per-page-options="[0]"
      >
        <!-- Custom body slot: group header, subtotal and normal rows -->
        <template v-slot:body="props">
          <!-- Group Header Row -->
          <q-tr v-if="props.row.isGroupHeader" class="group-header">
            <q-td :colspan="displayColumns.length" class="text-left">
              <router-link
                to="#"
                @click.prevent="filterByAccno(props.row.accno)"
                class="text-primary"
              >
                <strong>{{ props.row.groupLabel }}</strong>
              </router-link>
            </q-td>
          </q-tr>
          <!-- Subtotal Row -->
          <q-tr v-else-if="props.row.isSubtotal" class="subtotal-row">
            <q-td
              v-for="col in displayColumns"
              :key="col.name"
              :class="getCellClass(col)"
            >
              <span v-if="col.name === 'debit'">{{
                formatAmount(props.row.debit)
              }}</span>
              <span v-else-if="col.name === 'credit'">{{
                formatAmount(props.row.credit)
              }}</span>
              <span v-else-if="col.name === 'taxAmount'">{{
                formatAmount(props.row.taxAmount)
              }}</span>
              <span v-else-if="col.name === 'balance'">{{
                formatAmount(props.row.balance)
              }}</span>
              <span v-else-if="col.name === 'accno'">
                <router-link
                  to="#"
                  @click.prevent="filterByAccno(props.row.accno)"
                  class="text-primary"
                >
                  {{ props.row.accno }}
                </router-link>
              </span>
            </q-td>
          </q-tr>
          <!-- Normal Data Row -->
          <q-tr v-else>
            <q-td
              v-for="col in displayColumns"
              :key="col.name"
              :class="getCellClass(col)"
            >
              <span v-if="col.name === 'reference'">
                <router-link :to="getPath(props.row)" class="text-primary">
                  {{ props.row.reference }}
                </router-link>
              </span>
              <span v-else-if="col.name === 'accno'">
                <router-link
                  to="#"
                  @click.prevent="filterByAccno(props.row.accno)"
                  class="text-primary"
                >
                  {{ props.row.accno }}
                </router-link>
              </span>
              <span
                v-else-if="
                  ['debit', 'credit', 'taxAmount', 'balance'].includes(col.name)
                "
              >
                {{
                  formatAmount(
                    typeof col.field === "function"
                      ? col.field(props.row)
                      : props.row[col.field]
                  )
                }}
              </span>
              <span v-else>
                {{
                  typeof col.field === "function"
                    ? col.field(props.row)
                    : props.row[col.field]
                }}
              </span>
            </q-td>
          </q-tr>
        </template>
        <!-- Footer slot for overall totals when in split ledger mode -->
        <template v-slot:footer v-if="splitLedger && overallTotals">
          <q-tr class="totals-row">
            <q-td
              v-for="col in displayColumns"
              :key="col.name"
              :class="getCellClass(col)"
            >
              <span v-if="col.name === 'debit'">{{
                formatAmount(overallTotals.totalDebit)
              }}</span>
              <span v-else-if="col.name === 'credit'">{{
                formatAmount(overallTotals.totalCredit)
              }}</span>
              <span v-else-if="col.name === 'taxAmount'">{{
                formatAmount(overallTotals.totalTax)
              }}</span>
              <span v-else-if="col.name === 'balance'">{{
                formatAmount(overallTotals.totalBalance)
              }}</span>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from "vue";
import { api } from "src/boot/axios";
import { Cookies } from "quasar";
import draggable from "vuedraggable";
import { useI18n } from "vue-i18n";
import { formatAmount } from "src/helpers/utils";
import { utils, writeFile } from "xlsx";
const updateTitle = inject("updateTitle");
updateTitle("General Ledger");
const { t } = useI18n();

// Form data and UI flags
const formData = ref({});
const filtersOpen = ref(true);
const results = ref([]);

// Flag for split ledger mode (user selectable)
const splitLedger = ref(true);
// New variable to "freeze" the grouping mode at search time
const appliedSplitLedger = ref(splitLedger.value);

// Define base columns
const baseColumns = ref([
  {
    name: "id",
    align: "left",
    label: "ID",
    field: "id",
    sortable: true,
    slot: true,
    default: false,
  },
  {
    name: "transdate",
    align: "left",
    label: "Date",
    field: "transdate",
    sortable: true,
    default: true,
  },
  {
    name: "reference",
    align: "left",
    label: "Reference",
    field: "reference",
    sortable: true,
    default: true,
  },
  {
    name: "description",
    align: "left",
    label: "Description",
    field: "description",
    sortable: true,
    default: true,
  },
  {
    name: "debit",
    align: "right",
    label: "Debit",
    field: "debit",
    sortable: true,
    default: true,
  },
  {
    name: "credit",
    align: "right",
    label: "Credit",
    field: "credit",
    sortable: true,
    default: true,
  },
  {
    name: "taxAcc",
    align: "left",
    label: "Tax Acc",
    field: (row) =>
      row.linetax_accno && row.linetax_description
        ? `${row.linetax_accno}--${row.linetax_description}`
        : "",
    sortable: false,
    default: true,
  },
  {
    name: "taxAmount",
    align: "right",
    label: "Tax Amount",
    field: (row) => Number(row.linetaxamount) || 0,
    sortable: true,
    default: true,
  },
  {
    name: "source",
    align: "left",
    label: "Source",
    field: "source",
    sortable: true,
    default: false,
  },
  {
    name: "memo",
    align: "left",
    label: "Memo",
    field: "memo",
    sortable: true,
    default: false,
  },
  {
    name: "accno",
    align: "left",
    label: "Account",
    field: "accno",
    sortable: true,
    default: false,
  },
  {
    name: "gifi_accno",
    align: "left",
    label: "GIFI",
    field: "gifi_accno",
    sortable: true,
    default: false,
  },
  {
    name: "contra",
    align: "left",
    label: "Contra",
    field: "contra",
    sortable: true,
    default: false,
  },
]);

// Initialize selected columns based on defaults
const selectedColumns = ref(
  baseColumns.value.reduce((acc, column) => {
    acc[column.name] = column.default;
    return acc;
  }, {})
);

function processFilters() {
  const savedFilters = Cookies.get("gl_list_filters");
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
      Cookies.remove("ar_transactions_filters");
    }
  } else {
    const defaultFilters = {
      columns: baseColumns.value.reduce((acc, column) => {
        acc[column.name] = column.default;
        return acc;
      }, {}),
      order: baseColumns.value.map((col) => col.name),
    };
    Cookies.set("gl_list_filters", defaultFilters, { expires: 30 });
    selectedColumns.value = defaultFilters.columns;
    baseColumns.value = defaultFilters.order
      .map((name) => baseColumns.value.find((col) => col.name === name))
      .filter((col) => col !== undefined);
  }
}

onMounted(() => {
  processFilters();
});

watch(
  [selectedColumns, baseColumns],
  () => {
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((col) => col.name),
    };
    try {
      Cookies.set("gl_list_filters", filters, { expires: 30 });
    } catch (error) {
      console.error("Error saving filters to cookies:", error);
    }
  },
  { deep: true }
);

// Compute display columns based on selected columns and add a "Balance" column if needed.
// Now we use appliedSplitLedger so that changes to splitLedger don't affect the table until a new search.
const displayColumns = computed(() => {
  let cols = baseColumns.value.filter((col) => selectedColumns.value[col.name]);
  if (appliedSplitLedger.value && !cols.find((c) => c.name === "balance")) {
    cols.push({
      name: "balance",
      align: "right",
      label: "Balance",
      field: "balance",
      sortable: false,
      default: true,
    });
  }
  return cols.map((col) => ({ ...col, label: t(col.label) }));
});

// Helper function that groups the data if grouping is desired at search time
function groupData(data) {
  const groups = {};
  data.forEach((row) => {
    if (!groups[row.accno]) groups[row.accno] = [];
    groups[row.accno].push(row);
  });
  const sortedGroups = Object.values(groups).sort(
    (groupA, groupB) =>
      new Date(groupA[0].transdate) - new Date(groupB[0].transdate)
  );
  const finalRows = [];
  sortedGroups.forEach((group) => {
    const acc = group[0].accno;
    finalRows.push({
      isGroupHeader: true,
      accno: acc,
      account_description: group[0].account_description,
      groupLabel: `${acc} -- ${group[0].account_description}`,
    });
    let runningBalance = 0;
    const sortedGroup = group.sort(
      (a, b) => new Date(a.transdate) - new Date(b.transdate)
    );
    sortedGroup.forEach((row) => {
      runningBalance += -Number(row.amount);
      finalRows.push({ ...row, balance: runningBalance });
    });
    finalRows.push({
      isSubtotal: true,
      accno: acc,
      account_description: group[0].account_description,
      debit: group.reduce((sum, r) => sum + Number(r.debit), 0),
      credit: group.reduce((sum, r) => sum + Number(r.credit), 0),
      taxAmount: group.reduce(
        (sum, r) => sum + (Number(r.linetaxamount) || 0),
        0
      ),
      balance: runningBalance,
    });
  });
  return finalRows;
}
const loading = ref(false);
// API search function: fetch data and apply grouping based on the current split ledger setting.
// The appliedSplitLedger flag is "frozen" at search time.
const tableKey = ref(0); // needed to fix virtual scroll by forcing rerender on search
const search = async () => {
  try {
    loading.value = true;
    console.log("Searching with parameters:", formData.value);
    const response = await api.get("/gl/transactions/lines", {
      params: { ...formData.value },
    });
    filtersOpen.value = false;
    const data = response.data;
    appliedSplitLedger.value = splitLedger.value;
    results.value = appliedSplitLedger.value ? groupData(data) : data;
    tableKey.value++;
    loading.value = false;
  } catch (error) {
    console.error(error);
    loading.value = false;
  }
};

// Use results directly for your table rows
const tableRows = computed(() => results.value);

// Compute overall totals (this example computes totals on ungrouped data; adjust as needed)
// Now using appliedSplitLedger so totals reflect the state at search time.
const overallTotals = computed(() => {
  if (!appliedSplitLedger.value) return null;
  const data = results.value.filter(
    (row) => !row.isGroupHeader && !row.isSubtotal
  );
  let totalDebit = data.reduce((sum, r) => sum + Number(r.debit), 0);
  let totalCredit = data.reduce((sum, r) => sum + Number(r.credit), 0);
  let totalTax = data.reduce(
    (sum, r) => sum + (Number(r.linetaxamount) || 0),
    0
  );
  let totalBalance = -data.reduce((sum, r) => sum + Number(r.amount), 0);
  return { totalDebit, totalCredit, totalTax, totalBalance };
});

// When clicking an account number, set filter and trigger a search
const filterByAccno = (accno) => {
  formData.value.accnofrom = accno;
  formData.value.accnoto = accno;
  search();
};

// Clear account filters and trigger a search
const clearAccnoFilter = () => {
  formData.value.accnofrom = "";
  ``;
  formData.value.accnoto = "";
  search();
};

// Return router path based on row type
const getPath = (row) => {
  let path = "";
  if (row.type === "gl") {
    path = "/gl/add-gl";
  } else if (row.type === "ar") {
    if (row.till) {
      path = "/pos/sale";
    } else if (row.invoice) {
      path = "/ar/sales-invoice";
    } else {
      path = "/arap/transaction/customer";
    }
  } else if (row.type === "ap") {
    if (row.invoice) {
      path = "/ap/vendor-invoice";
    } else {
      path = "/arap/transaction/vendor";
    }
  }
  return { path, query: { id: row.id } };
};

// Utility to set text alignment classes.
// Here we explicitly set numeric columns (debit, credit, taxAmount, balance) to be right aligned
// and all other columns to be left aligned.
const getCellClass = (col) => {
  const numericColumns = ["debit", "credit", "taxAmount", "balance"];
  return numericColumns.includes(col.name) ? "text-right" : "text-left";
};

// Export function that builds an Excel workbook from the table data
const downloadTransactions = () => {
  // Build header row from displayed columns
  const headerRow = displayColumns.value.map((col) => col.label);
  const exportData = [headerRow];

  // Build export data row by row
  tableRows.value.forEach((row) => {
    if (row.isGroupHeader) {
      const newRow = [
        row.groupLabel,
        ...new Array(headerRow.length - 1).fill(""),
      ];
      exportData.push(newRow);
    } else if (row.isSubtotal) {
      const newRow = displayColumns.value.map((col) => {
        if (col.name === "debit") return formatAmount(row.debit);
        if (col.name === "credit") return formatAmount(row.credit);
        if (col.name === "taxAmount") return formatAmount(row.taxAmount);
        if (col.name === "balance") return formatAmount(row.balance);
        if (col.name === "accno") return row.accno;
        return "";
      });
      exportData.push(newRow);
    } else {
      const newRow = displayColumns.value.map((col) => {
        if (col.name === "reference") return row.reference;
        if (col.name === "accno") return row.accno;
        if (["debit", "credit", "taxAmount", "balance"].includes(col.name)) {
          return formatAmount(
            typeof col.field === "function" ? col.field(row) : row[col.field]
          );
        }
        return typeof col.field === "function"
          ? col.field(row)
          : row[col.field];
      });
      exportData.push(newRow);
    }
  });

  // Create worksheet and auto-adjust column widths
  const worksheet = utils.aoa_to_sheet(exportData);
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

  // Build workbook and trigger download
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Transactions");
  writeFile(workbook, "transactions_export.xlsx", { compression: true });
};
</script>

<style scoped>
.drag-area {
  display: flex;
  flex-wrap: wrap;
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
.q-table--loading {
  opacity: 0.7;
  transition: opacity 0.3s ease-in-out;
}
:deep(.totals-row),
:deep(.subtotal-row) {
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
  font-weight: var(--q-font-weight-bolder);
}
.group-header {
  background-color: var(--q-secondary);
  color: var(--q-mainbg);
  font-weight: bold;
}
:deep(.q-table td) {
  padding: 8px 16px;
}
:deep(.q-virtual-scroll__content) {
  margin-bottom: 0 !important;
}
.text-left {
  text-align: left;
}
.text-right {
  text-align: right;
}
.wrapped-description {
  white-space: pre-wrap;
  min-width: 10vw;
}
</style>
