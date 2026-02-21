<template>
  <q-page class="q-pa-md">
    <!-- Search Form Card -->
    <q-form @submit.prevent class="q-pa-sm mainbg form no-print container">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="container-bg"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <div class="row q-gutter-md q-my-md">
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

        <div class="row q-mt-md justify-end">
          <s-button type="search" @click="search" />
        </div>
      </q-expansion-item>
    </q-form>
    <div class="row q-mt-md">
      <s-button
        type="export-xl"
        @click="exportToExcel"
        v-if="hasResults"
        class="q-mr-sm"
      />
      <s-button type="export-pdf" @click="exportToPDF" v-if="hasResults" />
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
        <template v-slot:body-cell-ar="props">
          <q-td :props="props" class="text-right">
            <div>{{ formatAmount(props.value.amount) }}</div>
            <div class="">
              {{ formatAmount(props.value.tax) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-ap="props">
          <q-td :props="props" class="text-right">
            <div>{{ formatAmount(props.value.amount) }}</div>
            <div class="">
              {{ formatAmount(props.value.tax) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-gl_debit="props">
          <q-td :props="props" class="text-right">
            <div>{{ formatAmount(props.value.amount) }}</div>
            <div class="">
              {{ formatAmount(props.value.tax) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-gl_credit="props">
          <q-td :props="props" class="text-right">
            <div>{{ formatAmount(props.value.amount) }}</div>
            <div class="">
              {{ formatAmount(props.value.tax) }}
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-total="props">
          <q-td :props="props" class="text-right text-weight-bold">
            <div>{{ formatAmount(props.value.amount) }}</div>
            <div class="">
              {{ formatAmount(props.value.tax) }}
            </div>
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
          v-for="(taxGroupData, taxKey) in moduleData.taxGroups"
          :key="taxKey"
          class="q-mb-md q-my-none"
        >
          <!-- Tax Group Header -->
          <div class="text-subtitle1 text-weight-medium q-my-none q-pa-sm">
            {{ taxGroupData.account }} - {{ taxGroupData.taxRate }}%
          </div>

          <!-- Transactions Table -->
          <q-table
            :rows="taxGroupData.transactionsWithSubtotal"
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

            <template v-slot:body-cell-calculated_tax="props">
              <q-td
                :props="props"
                class="text-right"
                :class="{ 'text-weight-bold': props.row.isSubtotal }"
              >
                {{ props.row.isSubtotal ? "" : props.value.toFixed(2) + "%" }}
              </q-td>
            </template>

            <template v-slot:body-cell-files="props">
              <q-td :props="props">
                <FileList :files="props.row.files" :report="true" />
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
                  <span v-else-if="col.name === 'calculated_tax'">
                    {{ props.row.isSubtotal ? "" : col.value.toFixed(2) + "%" }}
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
import { PDF_STYLES, createPDFWithCustomStyles } from "src/helpers/utils.js";
import FileList from "src/components/FileList.vue";

// =====================================================
// Injection and Initial Setup
// =====================================================
const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("All Taxes Report"));
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
    label: t("Invoice Number"),
    field: "invnumber",
    align: "left",
    sortable: true,
  },
  {
    name: "files",
    label: "Documents",
    field: "files",
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
  {
    name: "calculated_tax",
    label: "Tax %",
    field: "calculated_tax",
    align: "right",
    sortable: true,
  },
];

const summaryColumns = [
  {
    name: "account",
    label: "Account",
    field: "account",
    align: "left",
    sortable: true,
  },
  {
    name: "ar",
    label: "AR",
    field: "ar",
    align: "right",
    sortable: true,
  },
  {
    name: "ap",
    label: "AP",
    field: "ap",
    align: "right",
    sortable: true,
  },
  {
    name: "gl_debit",
    label: "GL-Debit",
    field: "gl_debit",
    align: "right",
    sortable: true,
  },
  {
    name: "gl_credit",
    label: "GL-Credit",
    field: "gl_credit",
    align: "right",
    sortable: true,
  },
  {
    name: "total",
    label: "Total",
    field: "total",
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
    const taxId = item.tax_id;
    const account = item.account;
    const taxRate = item.tax_rate;

    // Calculate tax percentage based on taxincluded flag
    const amount = Number(item.amount);
    const tax = Number(item.tax);
    const taxIncluded = Boolean(item.taxincluded);

    let calculatedTax = 0;
    if (taxIncluded) {
      // If tax is included, calculate rate as: tax / (amount - tax)
      calculatedTax = amount - tax > 0 ? (tax / (amount - tax)) * 100 : 0;
    } else {
      // If tax is not included, calculate rate as: tax / amount
      calculatedTax = amount > 0 ? (tax / amount) * 100 : 0;
    }

    // Add calculated tax to the item
    const itemWithCalculatedTax = {
      ...item,
      calculated_tax: calculatedTax,
    };

    if (!grouped[module]) {
      grouped[module] = {
        taxGroups: {},
        total: { amount: 0, tax: 0 },
      };
    }

    const taxKey = `${taxId}`;
    if (!grouped[module].taxGroups[taxKey]) {
      grouped[module].taxGroups[taxKey] = {
        account: account,
        taxRate: taxRate,
        transactions: [],
        subtotal: { amount: 0, tax: 0 },
      };
    }

    grouped[module].taxGroups[taxKey].transactions.push(itemWithCalculatedTax);
    grouped[module].taxGroups[taxKey].subtotal.amount += amount;
    grouped[module].taxGroups[taxKey].subtotal.tax += tax;

    grouped[module].total.amount += amount;
    grouped[module].total.tax += tax;
  });

  // Add subtotal rows to each tax group's transactions
  Object.values(grouped).forEach((moduleData) => {
    Object.values(moduleData.taxGroups).forEach((taxGroupData) => {
      taxGroupData.transactionsWithSubtotal = [
        ...taxGroupData.transactions,
        {
          id: `subtotal-${Math.random()}`,
          isSubtotal: true,
          transdate: "",
          invnumber: t("Tax Group Subtotal"),
          name: "",
          amount: taxGroupData.subtotal.amount,
          tax: taxGroupData.subtotal.tax,
          description: "",
        },
      ];
    });
  });

  return grouped;
});

const summaryData = computed(() => {
  if (!hasResults.value) return [];

  // Group by account/tax
  const accountGroups = {};

  Object.entries(groupedResults.value).forEach(([module, moduleData]) => {
    Object.entries(moduleData.taxGroups).forEach(([taxKey, taxGroupData]) => {
      const accountKey = `${taxGroupData.account} - ${taxGroupData.taxRate}%`;

      if (!accountGroups[accountKey]) {
        accountGroups[accountKey] = {
          account: accountKey,
          ar: { amount: 0, tax: 0 },
          ap: { amount: 0, tax: 0 },
          gl_debit: { amount: 0, tax: 0 },
          gl_credit: { amount: 0, tax: 0 },
          total: { amount: 0, tax: 0 },
        };
      }

      // Add module data to account group
      if (module === "ar") {
        accountGroups[accountKey].ar.amount += taxGroupData.subtotal.amount;
        accountGroups[accountKey].ar.tax += taxGroupData.subtotal.tax;
      } else if (module === "ap") {
        accountGroups[accountKey].ap.amount += taxGroupData.subtotal.amount;
        accountGroups[accountKey].ap.tax += taxGroupData.subtotal.tax;
      } else if (module === "gl-debit") {
        accountGroups[accountKey].gl_debit.amount +=
          taxGroupData.subtotal.amount;
        accountGroups[accountKey].gl_debit.tax += taxGroupData.subtotal.tax;
      } else if (module === "gl-credit") {
        accountGroups[accountKey].gl_credit.amount +=
          taxGroupData.subtotal.amount;
        accountGroups[accountKey].gl_credit.tax += taxGroupData.subtotal.tax;
      }

      // Update total using the formula: AR - AP + GL Credit - GL Debit
      if (module === "ar") {
        accountGroups[accountKey].total.amount += taxGroupData.subtotal.amount;
        accountGroups[accountKey].total.tax += taxGroupData.subtotal.tax;
      } else if (module === "ap") {
        accountGroups[accountKey].total.amount -= taxGroupData.subtotal.amount;
        accountGroups[accountKey].total.tax -= taxGroupData.subtotal.tax;
      } else if (module === "gl-credit") {
        accountGroups[accountKey].total.amount += taxGroupData.subtotal.amount;
        accountGroups[accountKey].total.tax += taxGroupData.subtotal.tax;
      } else if (module === "gl-debit") {
        accountGroups[accountKey].total.amount -= taxGroupData.subtotal.amount;
        accountGroups[accountKey].total.tax -= taxGroupData.subtotal.tax;
      }
    });
  });

  // Convert to array format for table
  const summary = Object.values(accountGroups).map((group, index) => ({
    key: `account-${index}`,
    account: group.account,
    ar: group.ar,
    ap: group.ap,
    gl_debit: group.gl_debit,
    gl_credit: group.gl_credit,
    total: group.total,
  }));

  return summary;
});

const grandTotal = computed(() => {
  const total = { amount: 0, tax: 0 };

  Object.entries(groupedResults.value).forEach(([module, moduleData]) => {
    // Calculate grand total using the formula: AR - AP + GL Credit - GL Debit
    if (module === "ar") {
      total.amount += moduleData.total.amount;
      total.tax += moduleData.total.tax;
    } else if (module === "ap") {
      total.amount -= moduleData.total.amount;
      total.tax -= moduleData.total.tax;
    } else if (module === "gl-credit") {
      total.amount += moduleData.total.amount;
      total.tax += moduleData.total.tax;
    } else if (module === "gl-debit") {
      total.amount -= moduleData.total.amount;
      total.tax -= moduleData.total.tax;
    }
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
    results.value = results.value.map((row) => {
      if (row.module === "AP") {
        return { ...row, amount: row.amount * -1 };
      } else {
        return row;
      }
    });
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

  if (module === "gl-debit" || module === "gl-credit") {
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
  exportData.push([
    "Account/Tax",
    "AR Amount",
    "AR Tax",
    "AP Amount",
    "AP Tax",
    "GL-Debit Amount",
    "GL-Debit Tax",
    "GL-Credit Amount",
    "GL-Credit Tax",
    "Total Amount",
    "Total Tax",
  ]);
  summaryData.value.forEach((row) => {
    exportData.push([
      row.account,
      roundAmount(row.ar.amount),
      roundAmount(row.ar.tax),
      roundAmount(row.ap.amount),
      roundAmount(row.ap.tax),
      roundAmount(row.gl_debit.amount),
      roundAmount(row.gl_debit.tax),
      roundAmount(row.gl_credit.amount),
      roundAmount(row.gl_credit.tax),
      roundAmount(row.total.amount),
      roundAmount(row.total.tax),
    ]);
  });
  exportData.push(["", "", "", "", "", "", "", "", "", "", ""]); // Empty row

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
    "Tax %",
    "Description",
  ]);

  Object.entries(groupedResults.value).forEach(([module, moduleData]) => {
    Object.entries(moduleData.taxGroups).forEach(([taxKey, taxGroupData]) => {
      taxGroupData.transactions.forEach((transaction) => {
        exportData.push([
          module.toUpperCase(),
          `${taxGroupData.account} - ${taxGroupData.taxRate}%`,
          transaction.transdate,
          transaction.invnumber,
          transaction.name,
          transaction.address || "",
          roundAmount(transaction.amount),
          roundAmount(transaction.tax),
          transaction.calculated_tax.toFixed(2) + "%",
          transaction.description,
        ]);
      });

      // Tax group subtotal
      exportData.push([
        "",
        `${taxGroupData.account} - ${taxGroupData.taxRate}% Subtotal`,
        "",
        "",
        "",
        "",
        roundAmount(taxGroupData.subtotal.amount),
        roundAmount(taxGroupData.subtotal.tax),
        "",
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
      "",
    ]);

    // Empty row
    exportData.push(["", "", "", "", "", "", "", "", "", ""]);
  });

  const worksheet = utils.aoa_to_sheet(exportData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "All Taxes Report");
  writeFile(workbook, "all_taxes_report.xlsx", { compression: true });
};

const exportToPDF = () => {
  const doc = new jsPDF({ orientation: "landscape" });

  // Add title using centralized styles
  doc.setFontSize(PDF_STYLES.title.fontSize);
  doc.text("All Taxes Report", doc.internal.pageSize.width / 2, 15, {
    align: PDF_STYLES.title.alignment,
  });

  let yPosition = 25;

  // Summary section
  doc.setFontSize(PDF_STYLES.subtitle.fontSize);
  doc.text("Summary", 15, yPosition);
  yPosition += 8;

  const summaryTableData = summaryData.value.map((row) => [
    row.account,
    formatAmount(row.ar.amount),
    formatAmount(row.ar.tax),
    formatAmount(row.ap.amount),
    formatAmount(row.ap.tax),
    formatAmount(row.gl_debit.amount),
    formatAmount(row.gl_debit.tax),
    formatAmount(row.gl_credit.amount),
    formatAmount(row.gl_credit.tax),
    formatAmount(row.total.amount),
    formatAmount(row.total.tax),
  ]);

  // Generate summary table (condensed layout, horizontal lines only)
  createPDFWithCustomStyles(
    doc,
    [
      [
        "Account/Tax",
        "AR Amount",
        "AR Tax",
        "AP Amount",
        "AP Tax",
        "GL-Debit Amount",
        "GL-Debit Tax",
        "GL-Credit Amount",
        "GL-Credit Tax",
        "Total Amount",
        "Total Tax",
      ],
    ],
    summaryTableData,
    {
      startY: yPosition,
      styles: {
        ...PDF_STYLES.transactionTable.styles,
        fontSize: 7,
        cellPadding: 1,
      },
      columnStyles: {
        1: { halign: "right", overflow: "hidden" },
        2: { halign: "right", overflow: "hidden" },
        3: { halign: "right", overflow: "hidden" },
        4: { halign: "right", overflow: "hidden" },
        5: { halign: "right", overflow: "hidden" },
        6: { halign: "right", overflow: "hidden" },
        7: { halign: "right", overflow: "hidden" },
        8: { halign: "right", overflow: "hidden" },
        9: { halign: "right", overflow: "hidden" },
        10: { halign: "right", overflow: "hidden" },
      },
    }
  );

  yPosition = doc.lastAutoTable.finalY + 12;

  // Detailed section
  doc.setFontSize(PDF_STYLES.subtitle.fontSize);
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

    Object.entries(moduleData.taxGroups).forEach(([taxKey, taxGroupData]) => {
      // Tax group header
      tableData.push([
        {
          content: `${taxGroupData.account} - ${taxGroupData.taxRate}%`,
          colSpan: 8,
          styles: { fontStyle: "bold" },
        },
      ]);

      // Transactions
      taxGroupData.transactions.forEach((transaction) => {
        tableData.push([
          transaction.transdate,
          transaction.invnumber,
          transaction.name,
          transaction.address || "",
          formatAmount(transaction.amount),
          formatAmount(transaction.tax),
          transaction.calculated_tax.toFixed(2) + "%",
          transaction.description,
        ]);
      });

      // Tax group subtotal
      tableData.push([
        "",
        "Tax Group Subtotal",
        "",
        "",
        formatAmount(taxGroupData.subtotal.amount),
        formatAmount(taxGroupData.subtotal.tax),
        "",
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
      "",
    ]);
  });

  // Generate detailed table (condensed layout, horizontal lines only)
  createPDFWithCustomStyles(
    doc,
    [
      [
        "Date",
        "Invoice Number",
        "Name",
        "Address",
        "Amount",
        "Tax",
        "Tax %",
        "Description",
      ],
    ],
    tableData,
    {
      startY: yPosition,
      styles: {
        ...PDF_STYLES.transactionTable.styles,
        fontSize: 7,
        cellPadding: 1,
      },
      columnStyles: {
        4: { halign: "right", overflow: "hidden" },
        5: { halign: "right", overflow: "hidden" },
        6: { halign: "right", overflow: "hidden" },
      },
    }
  );

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
