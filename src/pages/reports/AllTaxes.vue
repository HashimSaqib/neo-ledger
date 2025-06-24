<template>
  <q-page class="q-pa-sm">
    <!-- Search Form Card -->
    <q-form @submit.prevent class="q-pa-sm mainbg form no-print">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <div class="row q-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="formData.fromdate"
              type="date"
              :label="t('From Date')"
              outlined
              dense
              class="lightbg"
              input-class="maintext"
              label-color="secondary"
              clearable
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="formData.todate"
              type="date"
              :label="t('To Date')"
              outlined
              dense
              class="lightbg"
              input-class="maintext"
              label-color="secondary"
              clearable
            />
          </div>
          <div class="col-12 col-md-4">
            <s-select
              v-if="departments.length > 0"
              :options="departments"
              option-label="description"
              search="description"
              option-value="id"
              v-model="formData.department"
              class="lightbg"
              :label="t('Department')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              clearable
            />
          </div>
        </div>

        <div class="row q-mt-md">
          <q-btn
            :label="t('Search')"
            color="primary"
            @click="search"
            :loading="loading"
            class="q-mr-sm"
          />
        </div>
      </q-expansion-item>
    </q-form>
    <div class="row q-mt-md">
      <q-btn
        :label="t('Export XL')"
        color="accent"
        @click="exportToExcel"
        :disable="!hasResults"
        class="q-mr-sm"
      />
      <q-btn
        :label="t('Export PDF')"
        color="info"
        @click="exportToPDF"
        :disable="!hasResults"
      />
    </div>
    <!-- Summary Table -->
    <div v-if="hasResults" class="q-mt-md">
      <div class="text-h6 q-mb-sm">{{ t("Summary") }}</div>
      <q-table
        :rows="summaryData"
        :columns="summaryColumns"
        row-key="key"
        :rows-per-page-options="[0]"
        dense
        flat
        bordered
        hide-bottom
        class="q-mb-lg"
      >
        <template v-slot:body-cell-amount="props">
          <q-td :props="props" class="text-right">
            {{ formatAmount(props.value) }}
          </q-td>
        </template>

        <template v-slot:body-cell-tax="props">
          <q-td :props="props" class="text-right">
            {{ formatAmount(props.value) }}
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Detailed Results -->
    <div v-if="hasResults" class="q-mt-md">
      <div
        v-for="(moduleData, module) in groupedResults"
        :key="module"
        class="q-mb-none"
      >
        <!-- Module Header -->
        <div class="text-h6 q-mb-none q-pa-sm">
          {{ module.toUpperCase() }}
        </div>

        <div
          v-for="(accountData, account) in moduleData.accounts"
          :key="account"
          class="q-mb-md q-my-none"
        >
          <!-- Account Header -->
          <div class="text-subtitle1 text-weight-medium q-my-none q-pa-sm">
            {{ account }}
          </div>

          <!-- Transactions Table -->
          <q-table
            :rows="accountData.transactionsWithSubtotal"
            :columns="columns"
            row-key="id"
            :rows-per-page-options="[0]"
            dense
            flat
            bordered
            hide-bottom
            class="q-mb-sm"
          >
            <template v-slot:body-cell-invnumber="props">
              <q-td :props="props">
                <router-link
                  v-if="props.value && !props.row.isSubtotal"
                  :to="getPath(props.row)"
                  class="text-primary"
                >
                  {{ props.value }}
                </router-link>
                <span v-else>{{ props.value || "-" }}</span>
              </q-td>
            </template>

            <template v-slot:body-cell-name="props">
              <q-td :props="props">
                <router-link
                  v-if="props.value && !props.row.isSubtotal"
                  :to="getPath(props.row)"
                  class="text-primary"
                >
                  {{ props.value }}
                </router-link>
                <span v-else>{{ props.value || "-" }}</span>
              </q-td>
            </template>

            <template v-slot:body-cell-address="props">
              <q-td :props="props">
                {{ props.value || "-" }}
              </q-td>
            </template>

            <template v-slot:body-cell-amount="props">
              <q-td
                :props="props"
                class="text-right"
                :class="{ 'text-weight-bold': props.row.isSubtotal }"
              >
                {{ formatAmount(props.value) }}
              </q-td>
            </template>

            <template v-slot:body-cell-tax="props">
              <q-td
                :props="props"
                class="text-right"
                :class="{ 'text-weight-bold': props.row.isSubtotal }"
              >
                {{ formatAmount(props.value) }}
              </q-td>
            </template>

            <template v-slot:body-row="props">
              <q-tr
                :props="props"
                :class="{ 'bg-grey-2': props.row.isSubtotal }"
              >
                <q-td
                  v-for="col in props.cols"
                  :key="col.name"
                  :props="props"
                  :class="[
                    col.name === 'amount' || col.name === 'tax'
                      ? 'text-right'
                      : 'text-left',
                    props.row.isSubtotal ? 'text-weight-bold' : '',
                  ]"
                >
                  <router-link
                    v-if="
                      (col.name === 'invnumber' || col.name === 'name') &&
                      col.value &&
                      !props.row.isSubtotal
                    "
                    :to="getPath(props.row)"
                    class="text-primary"
                  >
                    {{ col.value }}
                  </router-link>
                  <span v-else-if="col.name === 'amount' || col.name === 'tax'">
                    {{ formatAmount(col.value) }}
                  </span>
                  <span v-else>
                    {{ col.value || (props.row.isSubtotal ? "" : "-") }}
                  </span>
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>

        <!-- Module Total -->
        <div class="text-right q-mb-md q-mt-sm">
          <div class="text-weight-bold text-h6 q-mb-xs">
            {{ module.toUpperCase() }} {{ t("Total") }}
          </div>
          <div class="text-weight-medium">
            Total Amount: {{ formatAmount(moduleData.total.amount) }}
          </div>
          <div class="text-weight-medium">
            Total Tax: {{ formatAmount(moduleData.total.tax) }}
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center q-mt-lg">
      <q-icon name="info" size="lg" class="text-grey-5" />
      <div class="text-grey-5 q-mt-sm">{{ t("No data available") }}</div>
    </div>
  </q-page>
</template>

<script setup>
// =====================================================
// Imports and Dependency Registration
// =====================================================
import { ref, computed, onMounted, watch, inject } from "vue";
import { date } from "quasar";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { formatAmount, roundAmount } from "src/helpers/utils.js";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// =====================================================
// Injection and Initial Setup
// =====================================================
const updateTitle = inject("updateTitle");
updateTitle("All Taxes Report");
const { t } = useI18n();
const route = useRoute();
const createLink = inject("createLink");
const title = inject("title");

// =====================================================
// Reactive Data and Options
// =====================================================
const formData = ref({
  department: route.query.department || "",
  fromdate: route.query.fromdate || "",
  todate: route.query.todate || "",
});

const departments = ref([]);
const filtersOpen = ref(true);
const loading = ref(false);
const results = ref([]);

// =====================================================
// Table Columns
// =====================================================
const columns = [
  {
    name: "transdate",
    label: "Date",
    field: "transdate",
    align: "left",
    sortable: true,
  },
  {
    name: "invnumber",
    label: "Invoice Number",
    field: "invnumber",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "address",
    label: "Address",
    field: "address",
    align: "left",
    sortable: true,
  },
  {
    name: "amount",
    label: "Amount",
    field: "amount",
    align: "right",
    sortable: true,
  },
  {
    name: "tax",
    label: "Tax",
    field: "tax",
    align: "right",
    sortable: true,
  },
];

const summaryColumns = [
  {
    name: "module",
    label: "Module",
    field: "module",
    align: "left",
    sortable: true,
  },
  {
    name: "account",
    label: "Account",
    field: "account",
    align: "left",
    sortable: true,
  },
  {
    name: "amount",
    label: "Amount",
    field: "amount",
    align: "right",
    sortable: true,
  },
  {
    name: "tax",
    label: "Tax",
    field: "tax",
    align: "right",
    sortable: true,
  },
];

// =====================================================
// Computed Properties
// =====================================================
const hasResults = computed(() => results.value.length > 0);

const groupedResults = computed(() => {
  if (!hasResults.value) return {};

  const grouped = {};

  results.value.forEach((item) => {
    const module = item.module.toLowerCase();
    const account = item.account;

    if (!grouped[module]) {
      grouped[module] = {
        accounts: {},
        total: { amount: 0, tax: 0 },
      };
    }

    if (!grouped[module].accounts[account]) {
      grouped[module].accounts[account] = {
        transactions: [],
        subtotal: { amount: 0, tax: 0 },
      };
    }

    grouped[module].accounts[account].transactions.push(item);
    grouped[module].accounts[account].subtotal.amount += Number(item.amount);
    grouped[module].accounts[account].subtotal.tax += Number(item.tax);

    grouped[module].total.amount += Number(item.amount);
    grouped[module].total.tax += Number(item.tax);
  });

  // Add subtotal rows to each account's transactions
  Object.values(grouped).forEach((moduleData) => {
    Object.values(moduleData.accounts).forEach((accountData) => {
      accountData.transactionsWithSubtotal = [
        ...accountData.transactions,
        {
          id: `subtotal-${Math.random()}`,
          isSubtotal: true,
          transdate: "",
          invnumber: "Account Subtotal",
          name: "",
          amount: accountData.subtotal.amount,
          tax: accountData.subtotal.tax,
          description: "",
        },
      ];
    });
  });

  return grouped;
});

const summaryData = computed(() => {
  if (!hasResults.value) return [];

  const summary = [];

  Object.entries(groupedResults.value).forEach(([module, moduleData]) => {
    Object.entries(moduleData.accounts).forEach(([account, accountData]) => {
      summary.push({
        key: `${module}-${account}`,
        module: module.toUpperCase(),
        account: account,
        amount: accountData.subtotal.amount,
        tax: accountData.subtotal.tax,
      });
    });
  });

  return summary;
});

const grandTotal = computed(() => {
  const total = { amount: 0, tax: 0 };

  Object.values(groupedResults.value).forEach((moduleData) => {
    total.amount += moduleData.total.amount;
    total.tax += moduleData.total.tax;
  });

  return total;
});

// =====================================================
// Methods
// =====================================================
const search = async () => {
  try {
    loading.value = true;
    const response = await api.get("/reports/all_taxes", {
      params: formData.value,
    });
    results.value = response.data;
    console.log(results.value);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const getPath = (row) => {
  let path = "";
  const module = row.module.toLowerCase();

  if (module === "gl") {
    path = createLink("gl.transaction");
  } else if (module === "ar") {
    path =
      row.script === "is.pl"
        ? createLink("customer.invoice")
        : createLink("customer.transaction");
  } else if (module === "ap") {
    path =
      row.script === "ir.pl"
        ? createLink("vendor.invoice")
        : createLink("vendor.transaction");
  }

  return {
    path,
    query: {
      id: row.id,
      callback: createLink("base") + `/reports/all_taxes`,
    },
  };
};

const exportToExcel = () => {
  const exportData = [];

  // Summary section
  exportData.push(["SUMMARY"]);
  exportData.push(["Module", "Account", "Amount", "Tax"]);
  summaryData.value.forEach((row) => {
    exportData.push([
      row.module,
      row.account,
      roundAmount(row.amount),
      roundAmount(row.tax),
    ]);
  });
  exportData.push(["", "", "", ""]); // Empty row

  // Detailed data
  exportData.push(["DETAILED BREAKDOWN"]);
  exportData.push([
    "Module",
    "Account",
    "Date",
    "Invoice Number",
    "Name",
    "Address",
    "Amount",
    "Tax",
    "Description",
  ]);

  Object.entries(groupedResults.value).forEach(([module, moduleData]) => {
    Object.entries(moduleData.accounts).forEach(([account, accountData]) => {
      accountData.transactions.forEach((transaction) => {
        exportData.push([
          module.toUpperCase(),
          account,
          transaction.transdate,
          transaction.invnumber,
          transaction.name,
          transaction.address || "",
          roundAmount(transaction.amount),
          roundAmount(transaction.tax),
          transaction.description,
        ]);
      });

      // Account subtotal
      exportData.push([
        "",
        `${account} Subtotal`,
        "",
        "",
        "",
        "",
        roundAmount(accountData.subtotal.amount),
        roundAmount(accountData.subtotal.tax),
        "",
      ]);
    });

    // Module total
    exportData.push([
      `${module.toUpperCase()} Total`,
      "",
      "",
      "",
      "",
      "",
      roundAmount(moduleData.total.amount),
      roundAmount(moduleData.total.tax),
      "",
    ]);

    // Empty row
    exportData.push(["", "", "", "", "", "", "", "", ""]);
  });

  const worksheet = utils.aoa_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "All Taxes Report");
  writeFile(workbook, "all_taxes_report.xlsx", { compression: true });
};

const exportToPDF = () => {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("All Taxes Report", doc.internal.pageSize.width / 2, 15, {
    align: "center",
  });

  let yPosition = 25;

  // Summary section
  doc.setFontSize(11);
  doc.text("Summary", 15, yPosition);
  yPosition += 8;

  const summaryTableData = summaryData.value.map((row) => [
    row.module,
    row.account,
    formatAmount(row.amount),
    formatAmount(row.tax),
  ]);

  autoTable(doc, {
    head: [["Module", "Account", "Amount", "Tax"]],
    body: summaryTableData,
    startY: yPosition,
    styles: { fontSize: 8, cellPadding: 1 },
    headStyles: { fontStyle: "bold" },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
    },
    theme: "plain",
  });

  yPosition = doc.lastAutoTable.finalY + 12;

  // Detailed section
  doc.setFontSize(11);
  doc.text("Detailed Breakdown", 15, yPosition);
  yPosition += 8;

  const tableData = [];

  Object.entries(groupedResults.value).forEach(([module, moduleData]) => {
    // Module header
    tableData.push([
      {
        content: module.toUpperCase(),
        colSpan: 7,
        styles: { fontStyle: "bold" },
      },
    ]);

    Object.entries(moduleData.accounts).forEach(([account, accountData]) => {
      // Account header
      tableData.push([
        {
          content: account,
          colSpan: 7,
          styles: { fontStyle: "bold" },
        },
      ]);

      // Transactions
      accountData.transactions.forEach((transaction) => {
        tableData.push([
          transaction.transdate,
          transaction.invnumber,
          transaction.name,
          transaction.address || "",
          formatAmount(transaction.amount),
          formatAmount(transaction.tax),
          transaction.description,
        ]);
      });

      // Account subtotal
      tableData.push([
        "",
        "Account Subtotal",
        "",
        "",
        formatAmount(accountData.subtotal.amount),
        formatAmount(accountData.subtotal.tax),
        "",
      ]);
    });

    // Module total
    tableData.push([
      {
        content: `${module.toUpperCase()} Total`,
        colSpan: 4,
        styles: { fontStyle: "bold" },
      },
      {
        content: formatAmount(moduleData.total.amount),
        styles: { fontStyle: "bold" },
      },
      {
        content: formatAmount(moduleData.total.tax),
        styles: { fontStyle: "bold" },
      },
      "",
    ]);
  });

  autoTable(doc, {
    head: [
      [
        "Date",
        "Invoice Number",
        "Name",
        "Address",
        "Amount",
        "Tax",
        "Description",
      ],
    ],
    body: tableData,
    startY: yPosition,
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: "bold" },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
    },
    theme: "plain",
  });

  doc.save("all_taxes_report.pdf");
};

// =====================================================
// Lifecycle Hooks
// =====================================================
onMounted(async () => {
  await fetchLinks();
  await search();
});

const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/alltaxes");
    departments.value = response.data.departments;
  } catch (error) {
    console.error(error);
  }
};
</script>

<style scoped>
.q-table {
  border: 1px solid #e0e0e0;
}

@media print {
  .form,
  .q-btn {
    display: none;
  }
}
</style>
