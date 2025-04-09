<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <!-- Search form -->
    <q-form @submit.prevent class="q-pa-sm mainbg form no-print">
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
          v-model="formData.name"
          class="lightbg q-my-md"
          :label="t('Company Name')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <s-select
          v-if="departments.length > 0"
          :options="departments"
          option-label="description"
          search="description"
          optionvalue="id"
          v-model="formData.selectedDepartment"
          class="lightbg q-my-md"
          :label="t('Department')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
          clearable
        />
        <s-select
          v-if="projects.length > 0"
          :options="projects"
          option-label="description"
          search="description"
          optionvalue="id"
          v-model="formData.selectedProject"
          class="lightbg q-my-md"
          :label="t('Project')"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
          clearable
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
          <s-select
            :options="accounts"
            option-label="label"
            option-value="accno"
            v-model="formData.accnofrom"
            class="lightbg col-5"
            :label="t('Account Number From')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            account
          />
          <s-select
            :options="accounts"
            option-label="label"
            option-value="accno"
            v-model="formData.accnoto"
            :label="t('Account Number To')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-5"
            outlined
            dense
            account
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
    <div class="row items-center q-mt-md no-print">
      <q-btn
        label="Export"
        color="accent"
        @click="downloadTransactions"
        class="q-mx-sm"
        v-if="results.length > 0"
      />
      <q-btn
        label="Print"
        color="primary"
        @click="createPDF"
        class="q-mx-sm"
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
import { Notify, LocalStorage } from "quasar";
import draggable from "vuedraggable";
import { useI18n } from "vue-i18n";
import { formatAmount, roundAmount } from "src/helpers/utils";
import { utils, writeFile } from "xlsx";
import { useRoute } from "vue-router";

const route = useRoute();
const updateTitle = inject("updateTitle");
const triggerPrint = inject("triggerPrint");
updateTitle("General Ledger");
const { t } = useI18n();

// Form data and UI flags
const formData = ref({});
const filtersOpen = route.query.search == 1 ? ref(false) : ref(true);
const results = ref([]);

// Flag for split ledger mode (user selectable)
const splitLedger = ref(false);
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
    name: "name",
    align: "left",
    label: "Company Name",
    field: "name",
    sortable: true,
    default: false,
  },
  {
    name: "vcnumber",
    align: "left",
    label: "Company Number",
    field: "vcnumber",
    sortable: true,
    default: false,
  },
  {
    name: "address",
    align: "left",
    label: "Address",
    field: "address",
    sortable: true,
    default: false,
  },
  {
    name: "department",
    align: "left",
    label: "Department",
    field: "department",
    sortable: true,
    default: false,
  },
  {
    name: "project",
    align: "left",
    label: "Project",
    field: "project_description",
    sortable: true,
    default: false,
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
  const savedFilters = LocalStorage.getItem("gl_list_filters");
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
      LocalStorage.remove("gl_list_filters");
    }
  } else {
    const defaultFilters = {
      columns: baseColumns.value.reduce((acc, column) => {
        acc[column.name] = column.default;
        return acc;
      }, {}),
      order: baseColumns.value.map((col) => col.name),
    };
    LocalStorage.set("gl_list_filters", defaultFilters, { expires: 30 });
    selectedColumns.value = defaultFilters.columns;
    baseColumns.value = defaultFilters.order
      .map((name) => baseColumns.value.find((col) => col.name === name))
      .filter((col) => col !== undefined);
  }
}

onMounted(() => {
  processFilters();
  fetchLinks();
  loadParams();
});

watch(
  [selectedColumns, baseColumns],
  () => {
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((col) => col.name),
    };
    try {
      LocalStorage.set("gl_list_filters", filters, { expires: 30 });
      tableKey.value++;
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
const accounts = ref([]);
const departments = ref([]);
const projects = ref([]);
const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/gl_report");
    departments.value = response.data.departments;
    accounts.value = response.data.accounts.all;
    projects.value = response.data.projects;
  } catch (error) {
    console.log(error);
  }
};
const flattenParams = (obj) => {
  const result = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    // Special handling for selectedDepartment: map to department.
    if (key === "selectedDepartment" && value && typeof value === "object") {
      result["department"] = `${value.description}--${value.id}`;
      return;
    }

    // Special handling for selectedProject: map to project_id.
    if (key === "selectedProject" && value && typeof value === "object") {
      result["project_id"] = `${value.id}`;
      return;
    }

    // Special handling for accnofrom and accnoto.
    if (
      (key === "accnofrom" || key === "accnoto") &&
      value &&
      typeof value === "object"
    ) {
      result[key] = value.accno ? value.accno : "";
      return;
    }

    // If the value is an object (but not an array), flatten it recursively.
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const flatChild = flattenParams(value);
      Object.keys(flatChild).forEach((childKey) => {
        result[`${key}.${childKey}`] = flatChild[childKey];
      });
    } else {
      // For primitives or arrays, assign directly.
      result[key] = value;
    }
  });
  return result;
};

const loadParams = () => {
  const query = route.query;

  // Load selectedDepartment from flattened "department" query (format: "description--id")
  if (query.department) {
    const [desc, id] = query.department.split("--");
    const dept = departments.find(
      (d) => d.id.toString() === id && d.description === desc
    );
    formData.value.selectedDepartment = dept || { description: desc, id };
  }

  // Load selectedProject from "project_id" query
  if (query.project_id) {
    const proj = projects.find((p) => p.id.toString() === query.project_id);
    formData.value.selectedProject = proj || { id: query.project_id };
  }

  // Load account numbers for "accnofrom" and "accnoto"
  if (query.accnofrom) {
    const accountFrom = accounts.value.find(
      (acc) => acc.accno === query.accnofrom
    );
    formData.value.accnofrom = accountFrom || query.accnofrom;
  }
  if (query.accnoto) {
    const accountTo = accounts.value.find((acc) => acc.accno === query.accnoto);
    formData.value.accnoto = accountTo || query.accnoto;
  }

  // Load simple parameters available on this page.
  // Adjust the keys in this array based on your formData fields.
  const simpleParams = [
    "reference",
    "description",
    "name",
    "lineitem",
    "source",
    "memo",
    "datefrom",
    "dateto",
    "amountfrom",
    "amountto",
  ];
  simpleParams.forEach((key) => {
    if (query[key]) {
      formData.value[key] = query[key];
    }
  });

  // Auto-trigger search if "search" equals "1"
  if (query.search === "1") {
    search();
  }
};

const loading = ref(false);
// API search function: fetch data and apply grouping based on the current split ledger setting.
// The appliedSplitLedger flag is "frozen" at search time.
const tableKey = ref(0); // needed to fix virtual scroll by forcing rerender on search
const search = async () => {
  try {
    loading.value = true;
    // Flatten formData using the arrow function.
    const params = flattenParams(formData.value);

    // Use the flattened parameters in your API call.
    const response = await api.get("/gl/transactions/lines", { params });
    filtersOpen.value = false;
    const data = response.data;
    appliedSplitLedger.value = splitLedger.value;
    results.value = appliedSplitLedger.value ? groupData(data) : data;
    tableKey.value++;
  } catch (error) {
    // Handle errors as needed.
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else {
      console.error("Network or unexpected error:", error);
    }
  } finally {
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
const createLink = inject("createLink");

// Return router path based on row type
const getPath = (row) => {
  let path = "";
  if (row.type === "gl") {
    path = createLink("gl.transaction");
  } else if (row.type === "ar") {
    path = row.till
      ? createLink("customer.pos")
      : row.invoice
      ? createLink("customer.invoice")
      : createLink("transaction.customer");
  } else if (row.type === "ap") {
    path = row.invoice
      ? createLink("vendor.invoice")
      : createLink("vendor.transaction");
  }
  const flatParams = flattenParams(formData.value);
  return {
    path,
    query: {
      id: row.id,
      ...flatParams,
      callback: createLink("base") + `/gl/reports`,
    },
  };
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
        if (col.name === "credit") return roundAmount(row.credit);
        if (col.name === "taxAmount") return roundAmount(row.taxAmount);
        if (col.name === "balance") return roundAmount(row.balance);
        if (col.name === "accno") return row.accno;
        return "";
      });
      exportData.push(newRow);
    } else {
      const newRow = displayColumns.value.map((col) => {
        if (col.name === "reference") return row.reference;
        if (col.name === "accno") return row.accno;
        if (["debit", "credit", "taxAmount", "balance"].includes(col.name)) {
          return roundAmount(
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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
const title = inject("title");

const createPDF = () => {
  const doc = new jsPDF({ orientation: "landscape" });
  let yPosition = 10; // Track vertical position
  const leftPadding = 15; // Align params with the table start
  doc.setFontSize(18);
  doc.text(title.value, doc.internal.pageSize.width / 2, yPosition, {
    align: "center",
  });
  doc.setFontSize(16);

  // Extract headers
  const headerRow = displayColumns.value.map((col) => col.label);
  const exportData = [];

  // Prepare columnStyles: numeric columns right aligned, others left aligned.
  const numericColumns = ["debit", "credit", "taxAmount", "balance"];
  const columnStyles = {};
  displayColumns.value.forEach((col, index) => {
    columnStyles[index] = numericColumns.includes(col.name)
      ? { halign: "right" }
      : { halign: "left" };
  });

  // Extract rows
  tableRows.value.forEach((row) => {
    if (row.isGroupHeader) {
      exportData.push([
        {
          content: row.groupLabel,
          colSpan: headerRow.length,
          styles: { fontStyle: "bold" },
        },
      ]);
    } else if (row.isSubtotal) {
      exportData.push(
        displayColumns.value.map((col) => {
          if (numericColumns.includes(col.name))
            return formatAmount(row[col.name]);
          if (col.name === "accno") return row.accno;
          return "";
        })
      );
    } else {
      exportData.push(
        displayColumns.value.map((col) => {
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

  // Generate table with updated columnStyles
  autoTable(doc, {
    head: [headerRow],
    body: exportData,
    startY: 20,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0] },
    columnStyles: columnStyles,
    theme: "striped",
  });

  // Save the PDF
  doc.save("transactions_report.pdf");
};
</script>

<style scoped>
.drag-area {
  display: flex;
  flex-wrap: wrap;
}
@media print {
  .form,
  .q-btn {
    display: none;
  }
  :deep(.q-table__container) {
    height: auto !important;
    overflow: visible !important;
    position: static !important;
  }
  :deep(.q-virtual-scroll__content) {
    transform: none !important;
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
