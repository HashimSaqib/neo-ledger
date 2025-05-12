<template>
  <q-page class="flex flex-col mainbg q-pa-md">
    <div class="column q-gutter-y-md full-width q-mb-md">
      <div class="row q-gutter-sm q-mt-md">
        <q-btn
          color="primary"
          :label="t('Validate Data')"
          @click="validateData"
        />
        <q-btn color="primary" :label="t('Import Data')" @click="importData" />
        <q-input
          v-model.number="linesToAdd"
          type="number"
          :label="t('Lines to add')"
          dense
          min="1"
          outlined
        />
        <q-btn color="secondary" :label="t('Insert Rows')" @click="addLines" />
      </div>

      <div class="column q-gutter-y-md">
        <q-expansion-item
          group="columns"
          icon="tune"
          :label="t('Select Columns')"
          header-class="text-h6"
          :default-opened="true"
        >
          <q-card class="q-pa-md">
            <div class="row justify-between q-mb-md">
              <q-btn
                dense
                color="primary"
                :label="t('Select All')"
                @click="selectAllColumns"
              />
              <q-btn
                dense
                color="primary"
                :label="t('Default Columns')"
                @click="resetToDefaultColumns"
              />
              <q-btn
                dense
                color="primary"
                :label="t('Required Only')"
                @click="selectOnlyRequiredColumns"
              />
            </div>

            <div
              v-for="(group, index) in columnGroups"
              :key="index"
              class="column q-mb-sm"
            >
              <div class="text-subtitle2 q-mb-xs">{{ group.title }}</div>
              <div class="row q-gutter-x-md wrap q-gutter-y-xs">
                <q-checkbox
                  v-for="col in group.columns"
                  :key="col.key"
                  v-model="col.checked"
                  :label="col.title"
                  :disable="col.required"
                  dense
                  class="col-auto"
                  @update:model-value="handleColumnToggle"
                />
              </div>
              <q-separator
                class="q-my-sm"
                v-if="index < columnGroups.length - 1"
              />
            </div>
          </q-card>
        </q-expansion-item>
      </div>
    </div>
    <div v-if="loading" class="full-width flex justify-center">
      <q-spinner color="primary" size="3em" />
    </div>
    <Spreadsheet ref="spreadsheet" v-else>
      <Worksheet :data="spreadsheetData" :columns="visibleColumns" />
    </Spreadsheet>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed, watch } from "vue";
import { Spreadsheet, Worksheet } from "@jspreadsheet-ce/vue";
import "jsuites/dist/jsuites.css";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
import { date } from "quasar";

const { t } = useI18n();
const route = useRoute();
const updateTitle = inject("updateTitle");
const spreadsheet = ref(null);

const pageTitles = {
  gl: "Import General Ledger",
  customer: "Import Customers",
  vendor: "Import Vendors",
  ar_invoice: "Import AR Invoices",
  ap_invoice: "Import AP Invoices",
  default: "Import",
};

updateTitle(pageTitles[route.params.type] || pageTitles.default);

const loading = ref(true);
const importType = ref(route.params.type);
const linesToAdd = ref(10);

const repositories = {
  currencies: ref([]),
  accounts: ref([]),
  customers: ref([]),
  vendors: ref([]),
  departments: ref([]),
  parts: ref([]),
  projects: ref([]),
  closedto: ref(""),
};

// Define column configurations first before any function uses them
const entityColumns = [
  { title: t("Name"), key: "name", required: true, default: true },
  { title: t("Contact"), key: "contact", required: false, default: true },
  { title: t("Address 1"), key: "address1", required: false, default: true },
  { title: t("Address 2"), key: "address2", required: false, default: false },
  { title: t("City"), key: "city", required: false, default: true },
  { title: t("State"), key: "state", required: false, default: true },
  { title: t("Zipcode"), key: "zipcode", required: false, default: true },
  { title: t("Country"), key: "country", required: false, default: true },
  { title: t("Phone"), key: "phone", required: false, default: true },
  { title: t("Fax"), key: "fax", required: false, default: false },
  { title: t("Email"), key: "email", required: false, default: true },
  { title: t("CC"), key: "cc", required: false, default: false },
  { title: t("BCC"), key: "bcc", required: false, default: false },
  { title: t("Notes"), key: "notes", required: false, default: false },
  { title: t("Terms"), key: "terms", required: false, default: true },
  {
    title: t("Discount"),
    type: "numeric",
    key: "discount",
    required: false,
    default: true,
  },
  {
    title: t("Credit Limit"),
    type: "numeric",
    key: "creditlimit",
    required: false,
    default: true,
  },
  {
    title: t("Tax Included"),
    key: "taxincluded",
    required: false,
    default: true,
  },
  { title: t("Tax Number"), key: "taxnumber", required: false, default: true },
  { title: t("SIC Code"), key: "sic_code", required: false, default: false },
  { title: t("Currency"), key: "curr", required: true, default: true },
  {
    title: t("Start Date (yyyy-mm-dd)"),
    key: "startdate",
    required: true,
    default: false,
  },
  {
    title: t("End Date (yyyy-mm-dd)"),
    key: "enddate",
    required: false,
    default: false,
  },
  {
    title: t("Cash Discount"),
    type: "numeric",
    key: "cashdiscount",
    required: false,
    default: false,
  },
  {
    title: t("Threshold"),
    type: "numeric",
    key: "threshold",
    required: false,
    default: false,
  },
  {
    title: t("Discount Terms"),
    key: "discountterms",
    required: false,
    default: false,
  },
  {
    title: t("Remittance Voucher"),
    key: "remittancevoucher",
    required: false,
    default: false,
  },
  { title: t("Bank Name"), key: "bankname", required: false, default: false },
  { title: t("IBAN"), key: "iban", required: false, default: false },
  { title: t("BIC"), key: "bic", required: false, default: false },
  {
    title: t("Member Number"),
    key: "membernumber",
    required: false,
    default: false,
  },
  {
    title: t("Clearing Number"),
    key: "clearingnumber",
    required: false,
    default: false,
  },
  {
    title: t("Bank Address 1"),
    key: "bankaddress1",
    required: false,
    default: false,
  },
  {
    title: t("Bank Address 2"),
    key: "bankaddress2",
    required: false,
    default: false,
  },
  { title: t("Bank City"), key: "bankcity", required: false, default: false },
  { title: t("Bank State"), key: "bankstate", required: false, default: false },
  {
    title: t("Bank Zipcode"),
    key: "bankzipcode",
    required: false,
    default: false,
  },
  {
    title: t("Bank Country"),
    key: "bankcountry",
    required: false,
    default: false,
  },
  { title: t("First Name"), key: "firstname", required: false, default: false },
  { title: t("Last Name"), key: "lastname", required: false, default: false },
  {
    title: t("Salutation"),
    key: "salutation",
    required: false,
    default: false,
  },
  {
    title: t("Contact Title"),
    key: "contacttitle",
    required: false,
    default: false,
  },
  {
    title: t("Occupation"),
    key: "occupation",
    required: false,
    default: false,
  },
  { title: t("Mobile"), key: "mobile", required: false, default: false },
  {
    title: t("Type of Contact"),
    key: "typeofcontact",
    required: false,
    default: false,
  },
  { title: t("Gender"), key: "gender", required: false, default: false },
];

const invoiceColumns = [
  {
    title: t("Invoice Number"),
    key: "invnumber",
    required: true,
    default: true,
  },
  {
    title: t("Description"),
    key: "description",
    required: false,
    default: true,
  },
  {
    title: t("Invoice Date (yyyy-mm-dd)"),
    key: "invdate",
    required: true,
    default: true,
  },
  {
    title: t("Due Date (yyyy-mm-dd)"),
    key: "duedate",
    required: true,
    default: true,
  },
  { title: t("Currency"), key: "curr", required: true, default: true },
  {
    title: t("Exchange Rate"),
    type: "numeric",
    key: "exchangerate",
    required: false,
    default: true,
  },
  { title: t("Notes"), key: "notes", required: false, default: false },
  {
    title: t("Internal Notes"),
    key: "intnotes",
    required: false,
    default: false,
  },
  {
    title: t("Department"),
    key: "department",
    required: false,
    default: false,
  },
  { title: t("Account"), key: "recordaccount", required: true, default: true },
  {
    title: t("Order Number"),
    key: "ordnumber",
    required: false,
    default: false,
  },
  { title: t("PO Number"), key: "ponumber", required: false, default: false },
  {
    title: t("Shipping Point"),
    key: "shippingpoint",
    required: false,
    default: false,
  },
  { title: t("Ship Via"), key: "shipvia", required: false, default: false },
  { title: t("Waybill"), key: "waybill", required: false, default: false },
  {
    title: t("Item Number"),
    key: "line_number",
    required: true,
    default: true,
  },
  {
    title: t("Item Description"),
    key: "line_description",
    required: true,
    default: true,
  },
  {
    title: t("Quantity"),
    type: "numeric",
    key: "qty",
    required: true,
    default: true,
  },
  {
    title: t("Price"),
    type: "numeric",
    key: "price",
    required: true,
    default: true,
  },
  {
    title: t("Discount"),
    type: "numeric",
    key: "discount",
    required: false,
    default: true,
  },
  { title: t("Unit"), key: "unit", required: false, default: true },
];

const importConfigs = {
  gl: {
    columns: [
      {
        title: t("Reference"),
        key: "reference",
        required: true,
        default: true,
      },
      {
        title: t("Department"),
        key: "department",
        required: false,
        default: true,
      },
      {
        title: t("Description"),
        key: "description",
        required: false,
        default: true,
      },
      {
        title: t("Trans Date (yyyy-mm-dd)"),
        key: "transdate",
        required: true,
        default: true,
      },
      { title: t("Notes"), key: "notes", required: false, default: false },
      { title: t("Currency"), key: "curr", required: true, default: true },
      {
        title: t("Exchange Rate"),
        type: "numeric",
        key: "exchangerate",
        required: false,
        default: true,
      },
      { title: t("Account No"), key: "accno", required: true, default: true },
      {
        title: t("Debit"),
        type: "numeric",
        key: "debit",
        required: false,
        default: true,
      },
      {
        title: t("Credit"),
        type: "numeric",
        key: "credit",
        required: false,
        default: true,
      },
      { title: t("Source"), key: "source", required: false, default: false },
      { title: t("Memo"), key: "memo", required: false, default: true },
      {
        title: t("Project Number"),
        key: "projectnumber",
        required: false,
        default: false,
      },
    ],
  },
  customer: {
    columns: [
      {
        title: t("Customer Number"),
        key: "customernumber",
        required: true,
        default: true,
      },
      ...entityColumns,
    ],
  },
  vendor: {
    columns: [
      {
        title: t("Vendor Number"),
        key: "vendornumber",
        required: true,
        default: true,
      },
      ...entityColumns,
    ],
  },
  ar_invoice: {
    columns: [
      {
        title: t("Customer Number"),
        key: "customernumber",
        required: true,
        default: true,
      },
      ...invoiceColumns,
    ],
  },
  ap_invoice: {
    columns: [
      {
        title: t("Vendor Number"),
        key: "vendornumber",
        required: true,
        default: true,
      },
      ...invoiceColumns,
    ],
  },
  default: {
    columns: [
      { title: t("Column 1"), key: "COL1", required: true, default: true },
      { title: t("Column 2"), key: "COL2", required: false, default: true },
    ],
  },
};

// Define column utils
const getColumnsConfig = (type) => {
  const config = importConfigs[type] || importConfigs.default;
  return config.columns;
};

const columns = computed(() => getColumnsConfig(importType.value));

// Define available columns and visible columns
const availableColumns = ref([]);
const visibleColumns = computed(() => {
  return availableColumns.value.filter((col) => col.checked);
});

// Define createEmptyRows before it's used
const createEmptyRows = (count, colCount = null) => {
  const config = importConfigs[importType.value] || importConfigs.default;
  const columnsToUse =
    visibleColumns.value?.length > 0 ? visibleColumns.value : config.columns;
  const colCountToUse = colCount || columnsToUse.length;

  return Array(count)
    .fill()
    .map(() => Array(colCountToUse).fill(""));
};

// Now we can initialize spreadsheetData
const spreadsheetData = ref(createEmptyRows(50));

const getColumnIndexes = (type) => {
  const indexes = {};

  visibleColumns.value.forEach((col, index) => {
    if (col.key) {
      indexes[col.key] = index;
    }
  });

  return indexes;
};

const rowToObject = (row, type) => {
  const obj = {};

  visibleColumns.value.forEach((col, index) => {
    if (col.key && index < row.length) {
      obj[col.key] = row[index];
    }
  });

  // Add missing required columns with null values
  const allRequiredColumns =
    importConfigs[type]?.columns.filter((col) => col.required) || [];
  allRequiredColumns.forEach((reqCol) => {
    if (obj[reqCol.key] === undefined) {
      obj[reqCol.key] = null;
    }
  });

  return obj;
};

const updateVisibleColumns = () => {
  const sheet = spreadsheet.value?.current?.[0];
  if (!sheet) return;

  // We need to rebuild the spreadsheet data when columns change
  const data = sheet.getData?.() || [];
  const oldColumnCount = sheet.colgroup?.length || 0;
  const newColumnCount = visibleColumns.value.length;

  if (oldColumnCount !== newColumnCount) {
    const updatedData = data.map((row) => {
      if (!row) return Array(newColumnCount).fill("");

      const newRow = Array(newColumnCount).fill("");
      visibleColumns.value.forEach((col, newIndex) => {
        const oldIndex = availableColumns.value.findIndex(
          (oldCol) => oldCol.key === col.key
        );
        if (oldIndex >= 0 && oldIndex < row.length) {
          newRow[newIndex] = row[oldIndex];
        }
      });
      return newRow;
    });

    spreadsheetData.value = updatedData;

    // Force a complete refresh of the spreadsheet component
    setTimeout(() => {
      refreshSpreadsheet();
    }, 10);
  }
};

// Add a new handler for checkbox toggle
const handleColumnToggle = () => {
  updateVisibleColumns();
};

const initializeColumns = () => {
  const currentConfig = columns.value;
  availableColumns.value = currentConfig.map((col) => ({
    ...col,
    checked: col.required || col.default || false,
  }));

  // Reset spreadsheet data with the new column count
  const visibleColCount = visibleColumns.value.length;
  spreadsheetData.value = createEmptyRows(50, visibleColCount);
};

// Add watcher for importType
watch(
  importType,
  () => {
    initializeColumns();
  },
  { immediate: true }
);

const addLines = () => {
  if (spreadsheet.value && linesToAdd.value > 0) {
    const sheet = spreadsheet.value.current?.[0];
    if (sheet && sheet.insertRow) {
      const newRows = createEmptyRows(linesToAdd.value);
      newRows.forEach((row) => {
        sheet.insertRow(row, sheet.rows.length);
      });
    }
  }
};

const fetchModules = async () => {
  try {
    const endpoint = `/create_links/import`;
    const response = await api.get(endpoint);

    if (response.data.currencies)
      repositories.currencies.value = response.data.currencies;
    if (response.data.accounts)
      repositories.accounts.value = response.data.accounts.all || [];
    if (response.data.customers)
      repositories.customers.value = response.data.customers;
    if (response.data.vendors)
      repositories.vendors.value = response.data.vendors;
    if (response.data.departments)
      repositories.departments.value = response.data.departments;
    if (response.data.projects)
      repositories.projects.value = response.data.projects;
    repositories.closedto.value = response.data.closedto;
    if (response.data.parts) repositories.parts.value = response.data.parts;
  } catch (error) {
    console.error("Failed to fetch modules:", error);
    Notify.create({
      color: "negative",
      message: t("Failed to load required data"),
      icon: "error",
      position: "center",
    });
  }
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const normalized = value
      .replace(/\s/g, "")
      .replace(/[^\d.,\-]/g, "")
      .replace(/,/g, ".");

    const parts = normalized.split(".");
    if (parts.length > 2) {
      const lastPart = parts.pop();
      return parseFloat(parts.join("") + "." + lastPart);
    }

    return parseFloat(normalized) || 0;
  }

  return 0;
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  try {
    // Try to validate if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split("-");
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      // Basic date validation
      if (
        year >= 1000 &&
        year <= 9999 &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        // Additional validation for days in month
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        if (day <= lastDayOfMonth) {
          return dateString; // Already in correct format and valid
        }
      }
      return ""; // Invalid date in YYYY-MM-DD format
    }

    let parsedDate;
    const formatsToTry = [
      "DD.MM.YYYY",
      "DD/MM/YYYY",
      "MM/DD/YYYY",
      "YYYY-MM-DD",
      "DD-MM-YYYY",
      "MM-DD-YYYY",
      "DD.MM.YY",
      "X",
      "x",
      "YYYY/MM/DD",
      "DD-MMM-YYYY",
      "MMM DD, YYYY",
      "YYYY.MM.DD",
    ];

    for (const format of formatsToTry) {
      parsedDate = date.extractDate(dateString, format);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        break;
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      const nativeParsedDate = new Date(dateString);
      if (nativeParsedDate && !isNaN(nativeParsedDate.getTime())) {
        parsedDate = nativeParsedDate;
      }
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      return date.formatDate(parsedDate, "YYYY-MM-DD");
    } else {
      return "";
    }
  } catch (error) {
    console.error(`Error formatting date: ${dateString}`, error);
    return "";
  }
};

const coreValidationRules = {
  accountExists: (value) => {
    if (!value) return { valid: false, message: "Account number is required" };
    const valid = repositories.accounts.value.some(
      (account) => account.accno === value
    );
    return {
      valid,
      message: valid ? "" : `Invalid account number: ${value}`,
    };
  },

  partExists: (value) => {
    if (!value) return { valid: false, message: "Part number is required" };
    const valid = repositories.parts.value.some(
      (part) => part.partnumber === value
    );
    return {
      valid,
      message: valid ? "" : `Invalid part number: ${value}`,
    };
  },

  customerExists: (value) => {
    if (!value) return { valid: false, message: "Customer number is required" };
    const valid = repositories.customers.value.some(
      (customer) => customer.customernumber === value
    );
    return {
      valid,
      message: valid ? "" : `Invalid customer number: ${value}`,
    };
  },

  vendorExists: (value) => {
    if (!value) return { valid: false, message: "Vendor number is required" };
    const valid = repositories.vendors.value.some(
      (vendor) => vendor.vendornumber === value
    );
    return {
      valid,
      message: valid ? "" : `Invalid vendor number: ${value}`,
    };
  },

  projectExists: (value) => {
    if (!value) return { valid: true, message: "" };
    const valid = repositories.projects.value.some(
      (project) => project.projectnumber === value
    );
    return {
      valid,
      message: valid ? "" : `Invalid project number: ${value}`,
    };
  },

  currencyExists: (value) => {
    if (!value) return { valid: false, message: "Currency is required" };
    const valid = repositories.currencies.value.some(
      (curr) => curr.curr === value
    );
    return {
      valid,
      message: valid ? "" : `Invalid currency: ${value}`,
    };
  },

  validExchangeRate: (currency, rate) => {
    if (!currency)
      return { valid: false, message: "Currency must be provided first" };

    const currencyObj = repositories.currencies.value.find(
      (curr) => curr.curr === currency
    );
    if (!currencyObj) return { valid: false, message: "Currency not found" };

    if (currencyObj.rn === 1) return { valid: true, message: "" };

    const numericRate = parseNumber(rate);
    const validRate = numericRate > 0;
    return {
      valid: validRate,
      message: validRate
        ? ""
        : `Exchange rate required for currency ${currency}`,
    };
  },

  requiredField: (value, fieldName) => {
    const valid = value !== undefined && value !== null && value.trim() !== "";
    return {
      valid,
      message: valid ? "" : `${fieldName} is required`,
    };
  },

  validEmail: (value) => {
    if (!value) return { valid: true, message: "" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(value);
    return {
      valid,
      message: valid ? "" : `Invalid email format: ${value}`,
    };
  },
};

const entityValidationRules = [
  {
    field: "name",
    rule: (value) => coreValidationRules.requiredField(value, "Name"),
  },
  {
    field: "email",
    rule: coreValidationRules.validEmail,
  },
  {
    field: "cc",
    rule: coreValidationRules.validEmail,
  },
  {
    field: "bcc",
    rule: coreValidationRules.validEmail,
  },
  {
    field: "curr",
    rule: coreValidationRules.currencyExists,
  },
  {
    field: "startdate",
    rule: (value) => {
      if (!value) return { valid: true, message: "" };
      const formattedDate = formatDate(value);
      return {
        valid: formattedDate !== "",
        message:
          formattedDate === ""
            ? "Invalid date format. Use yyyy-mm-dd format."
            : "",
      };
    },
  },
  {
    field: "enddate",
    rule: (value) => {
      if (!value) return { valid: true, message: "" };
      const formattedDate = formatDate(value);
      return {
        valid: formattedDate !== "",
        message:
          formattedDate === ""
            ? "Invalid date format. Use yyyy-mm-dd format."
            : "",
      };
    },
  },
];

const validationConfigs = {
  gl: {
    fieldValidations: [
      {
        field: "accno",
        rule: coreValidationRules.accountExists,
      },
      {
        field: "projectnumber",
        rule: coreValidationRules.projectExists,
      },
      {
        field: "curr",
        rule: coreValidationRules.currencyExists,
      },
      {
        field: "exchangerate",
        rule: (value, row) =>
          coreValidationRules.validExchangeRate(row.curr, value),
      },
      {
        field: "transdate",
        rule: (value) => {
          const formattedDate = formatDate(value);
          return {
            valid: formattedDate !== "",
            message:
              formattedDate === ""
                ? "Invalid date format. Use yyyy-mm-dd format."
                : "",
          };
        },
      },
    ],
    transactionValidations: [
      {
        validate: (rows) => {
          const transactionsByRef = {};

          rows.forEach((row) => {
            const reference = row.reference;
            if (!reference) return;

            if (!transactionsByRef[reference]) {
              transactionsByRef[reference] = [];
            }
            transactionsByRef[reference].push(row);
          });

          const unbalancedRefs = [];
          const transactionDetails = {};

          Object.entries(transactionsByRef).forEach(
            ([reference, transRows]) => {
              let totalDebit = 0;
              let totalCredit = 0;

              transRows.forEach((row) => {
                const debit = parseNumber(row.debit);
                const credit = parseNumber(row.credit);

                totalDebit += debit;
                totalCredit += credit;
              });

              const difference = Math.abs(totalDebit - totalCredit);
              if (difference > 0.001) {
                unbalancedRefs.push(reference);
                transactionDetails[reference] = {
                  debit: totalDebit,
                  credit: totalCredit,
                  difference: difference,
                };
              }
            }
          );

          let message = "";
          if (unbalancedRefs.length > 0) {
            message = "Unbalanced transactions: ";
            unbalancedRefs.forEach((ref) => {
              const details = transactionDetails[ref];
              message += `Ref: ${ref} (Debit: ${details.debit.toFixed(
                2
              )}, Credit: ${details.credit.toFixed(
                2
              )}, Difference: ${details.difference.toFixed(2)}), `;
            });
            message = message.slice(0, -2);
          }

          return {
            valid: unbalancedRefs.length === 0,
            unbalancedRefs,
            affectedFields: ["reference", "debit", "credit"],
            message,
          };
        },
      },
    ],
  },
  customer: {
    fieldValidations: [
      {
        field: "customernumber",
        rule: coreValidationRules.customerExists,
      },
      ...entityValidationRules,
    ],
  },
  vendor: {
    fieldValidations: [
      {
        field: "vendornumber",
        rule: coreValidationRules.vendorExists,
      },
      ...entityValidationRules,
    ],
  },
  ar_invoice: {
    fieldValidations: [
      {
        field: "customernumber",
        rule: coreValidationRules.customerExists,
      },
      {
        field: "invnumber",
        rule: (value) =>
          coreValidationRules.requiredField(value, "Invoice Number"),
      },
      {
        field: "line_number",
        rule: coreValidationRules.partExists,
      },
      {
        field: "invdate",
        rule: (value) => {
          const formattedDate = formatDate(value);
          return {
            valid: formattedDate !== "",
            message:
              formattedDate === ""
                ? "Invalid date format. Use yyyy-mm-dd format."
                : "",
          };
        },
      },
      {
        field: "duedate",
        rule: (value) => {
          const formattedDate = formatDate(value);
          return {
            valid: formattedDate !== "",
            message:
              formattedDate === ""
                ? "Invalid date format. Use yyyy-mm-dd format."
                : "",
          };
        },
      },
      {
        field: "curr",
        rule: coreValidationRules.currencyExists,
      },
      {
        field: "qty",
        rule: (value) => {
          const num = parseNumber(value);
          return {
            valid: num > 0,
            message: num <= 0 ? "Quantity must be greater than 0" : "",
          };
        },
      },
      {
        field: "sellprice",
        rule: (value) => {
          const num = parseNumber(value);
          return {
            valid: num >= 0,
            message: num < 0 ? "Sell price cannot be negative" : "",
          };
        },
      },
    ],
  },
  ap_invoice: {
    fieldValidations: [
      {
        field: "vendornumber",
        rule: coreValidationRules.vendorExists,
      },
      {
        field: "invnumber",
        rule: (value) =>
          coreValidationRules.requiredField(value, "Invoice Number"),
      },
      {
        field: "line_number",
        rule: coreValidationRules.partExists,
      },
      {
        field: "invdate",
        rule: (value) => {
          const formattedDate = formatDate(value);
          return {
            valid: formattedDate !== "",
            message:
              formattedDate === ""
                ? "Invalid date format. Use yyyy-mm-dd format."
                : "",
          };
        },
      },
      {
        field: "duedate",
        rule: (value) => {
          const formattedDate = formatDate(value);
          return {
            valid: formattedDate !== "",
            message:
              formattedDate === ""
                ? "Invalid date format. Use yyyy-mm-dd format."
                : "",
          };
        },
      },
      {
        field: "curr",
        rule: coreValidationRules.currencyExists,
      },
      {
        field: "qty",
        rule: (value) => {
          const num = parseNumber(value);
          return {
            valid: num > 0,
            message: num <= 0 ? "Quantity must be greater than 0" : "",
          };
        },
      },
      {
        field: "sellprice",
        rule: (value) => {
          const num = parseNumber(value);
          return {
            valid: num >= 0,
            message: num < 0 ? "Sell price cannot be negative" : "",
          };
        },
      },
    ],
  },
};

const getColumnLetter = (index) => {
  let letter = "";
  if (index >= 26) {
    letter += String.fromCharCode(64 + Math.floor(index / 26));
    letter += String.fromCharCode(65 + (index % 26));
  } else {
    letter = String.fromCharCode(65 + index);
  }
  return letter;
};

const highlightCell = (sheet, colIndex, rowIndex, color = "#ffcccc") => {
  try {
    if (!sheet) return;

    const colLetter = getColumnLetter(colIndex);
    const cellRef = `${colLetter}${rowIndex + 1}`;

    sheet.setStyle(cellRef, "background-color", color, true);
  } catch (error) {
    console.error(`Error highlighting cell (${colIndex}, ${rowIndex}):`, error);
  }
};

const clearStyles = (sheet) => {
  try {
    if (!sheet) return;

    const allStyles = sheet.getStyle();

    if (allStyles && typeof allStyles === "object") {
      const cellsWithStyles = Object.keys(allStyles);

      if (cellsWithStyles.length) {
        const cellsObject = {};
        cellsWithStyles.forEach((cellName) => {
          cellsObject[cellName] = true;
        });
        sheet.resetStyle(cellsObject);
      }
    }
  } catch (error) {
    console.error("Error clearing styles:", error);
  }
};

const validateData = () => {
  if (!spreadsheet.value) {
    Notify.create({
      color: "negative",
      message: t("Spreadsheet not available"),
      icon: "error",
      position: "center",
    });
    return false;
  }

  try {
    const sheet = spreadsheet.value.current?.[0];
    if (!sheet) {
      Notify.create({
        color: "negative",
        message: t("Spreadsheet not properly initialized"),
        icon: "error",
        position: "center",
      });
      return false;
    }

    clearStyles(sheet);

    const data = sheet.getData?.() || [];
    const indexes = getColumnIndexes(importType.value);

    const nonEmptyRows = data.filter(
      (row) => row && row.some((cell) => cell && cell.toString().trim() !== "")
    );

    if (nonEmptyRows.length === 0) {
      Notify.create({
        color: "warning",
        message: t("No data to validate"),
        icon: "warning",
        position: "center",
      });
      return false;
    }

    const errors = [];
    const config = validationConfigs[importType.value];

    if (!config) {
      Notify.create({
        color: "warning",
        message: t("No validation rules defined for this import type"),
        icon: "warning",
        position: "center",
      });
      return false;
    }

    nonEmptyRows.forEach((row, idx) => {
      if (!row || !row.some((cell) => cell && cell.toString().trim() !== ""))
        return;

      const realRowIndex = data.findIndex((r) => r === row);
      const rowObj = rowToObject(row, importType.value);

      if (config.fieldValidations) {
        config.fieldValidations.forEach((validation) => {
          const fieldIndex = indexes[validation.field];
          if (fieldIndex === undefined) return;

          const value = rowObj[validation.field];

          const result =
            typeof validation.rule === "function"
              ? validation.rule(value, rowObj)
              : { valid: true, message: "" };

          if (!result.valid) {
            highlightCell(sheet, fieldIndex, realRowIndex);
            errors.push(`${result.message} at row ${realRowIndex + 1}`);
          }
        });
      }
    });

    if (config.transactionValidations) {
      const objRows = nonEmptyRows.map((row) =>
        rowToObject(row, importType.value)
      );

      config.transactionValidations.forEach((validation) => {
        const result = validation.validate(objRows);

        if (!result.valid && result.unbalancedRefs) {
          nonEmptyRows.forEach((row, idx) => {
            const realRowIndex = data.findIndex((r) => r === row);
            const rowObj = rowToObject(row, importType.value);
            const reference = rowObj.reference;

            if (result.unbalancedRefs.includes(reference)) {
              if (result.affectedFields) {
                result.affectedFields.forEach((field) => {
                  if (indexes[field] !== undefined) {
                    highlightCell(sheet, indexes[field], realRowIndex);
                  }
                });
              }
            }
          });

          if (result.message) {
            errors.push(result.message);
          }
        }
      });
    }

    if (errors.length > 0) {
      Notify.create({
        title: t("Validation Errors"),
        message: `<ul>${errors.map((e) => `<li>${e}</li>`).join("")}</ul>`,
        html: true,
        position: "center",
        color: "negative",
      });
      return false;
    } else {
      Notify.create({
        color: "positive",
        message: t("Validation successful"),
        icon: "check_circle",
        position: "center",
      });
      return true;
    }
  } catch (error) {
    console.error("Validation error:", error);
    Notify.create({
      color: "negative",
      message: t("An error occurred during validation"),
      icon: "error",
      position: "center",
    });
    return false;
  }
};

const formatEntityData = (row) => {
  const rowObj = rowToObject(row, importType.value);
  const entity = {};

  Object.keys(rowObj).forEach((key) => {
    const value = rowObj[key];
    if (value !== undefined && value !== null && value !== "") {
      if (key === "taxincluded" || key === "remittancevoucher") {
        entity[key] =
          value === "1" || value === "true" || value === true ? 1 : 0;
      } else if (
        key === "discount" ||
        key === "creditlimit" ||
        key === "cashdiscount" ||
        key === "threshold" ||
        key === "qty" ||
        key === "sellprice"
      ) {
        entity[key] = parseNumber(value);
      } else if (
        key === "startdate" ||
        key === "enddate" ||
        key === "duedate"
      ) {
        entity[key] = formatDate(value);
      } else {
        entity[key] = value;
      }
    }
  });

  if (importType.value === "customer") {
    const customer = repositories.customers.value.find(
      (c) => c.customernumber === entity.customernumber
    );
    if (customer) {
      entity.customer_id = customer.id;
    }
  } else if (importType.value === "vendor") {
    const vendor = repositories.vendors.value.find(
      (v) => v.vendornumber === entity.vendornumber
    );
    if (vendor) {
      entity.vendor_id = vendor.id;
    }
  }

  return entity;
};

const importData = async () => {
  if (!spreadsheet.value) {
    Notify.create({
      color: "negative",
      message: t("Spreadsheet not available"),
      icon: "error",
      position: "center",
    });
    return;
  }

  const isValid = validateData();
  if (!isValid) {
    return;
  }

  const sheet = spreadsheet.value.current?.[0];
  if (!sheet) {
    Notify.create({
      color: "negative",
      message: t("Spreadsheet not properly initialized"),
      icon: "error",
      position: "center",
    });
    return;
  }

  try {
    const data = sheet.getData?.() || [];

    const nonEmptyRows = data.filter(
      (row) => row && row.some((cell) => cell && cell.toString().trim() !== "")
    );

    if (nonEmptyRows.length === 0) {
      Notify.create({
        color: "warning",
        message: t("No data to import"),
        icon: "warning",
        position: "center",
      });
      return;
    }

    let formattedData;

    if (
      importType.value === "ar_invoice" ||
      importType.value === "ap_invoice"
    ) {
      const invoicesByNumber = {};

      nonEmptyRows.forEach((row) => {
        const rowObj = rowToObject(row, importType.value);
        const invNumber = rowObj.invnumber || "";
        const entityKey =
          importType.value === "ar_invoice" ? "customernumber" : "vendornumber";
        const entityNumber = rowObj[entityKey] || "";

        let entityId = null;
        if (importType.value === "ar_invoice") {
          const customer = repositories.customers.value.find(
            (c) => c.customernumber === entityNumber
          );
          if (customer) entityId = customer.id;
        } else {
          const vendor = repositories.vendors.value.find(
            (v) => v.vendornumber === entityNumber
          );
          if (vendor) entityId = vendor.id;
        }

        if (!invoicesByNumber[invNumber]) {
          invoicesByNumber[invNumber] = {
            invNumber: invNumber,
            description: rowObj.description || "",
            type: "invoice",
            invDate: formatDate(rowObj.invdate || ""),
            dueDate: formatDate(rowObj.duedate || ""),
            currency: rowObj.curr || "",
            exchangerate: parseNumber(rowObj.exchangerate) || 1.0,
            notes: rowObj.notes || "",
            intnotes: rowObj.intnotes || "",
            till: rowObj.till || "",
            department: rowObj.department || "",
            recordAccount: rowObj.recordaccount || "",
            [importType.value === "ar_invoice" ? "customer_id" : "vendor_id"]:
              entityId,
            ordNumber: rowObj.ordnumber || "",
            poNumber: rowObj.ponumber || "",
            shippingPoint: rowObj.shippingpoint || "",
            shipVia: rowObj.shipvia || "",
            wayBill: rowObj.waybill || "",
            shipto: {
              name: rowObj.shipto_name || "",
              address1: rowObj.shipto_address1 || "",
              address2: rowObj.shipto_address2 || "",
              city: rowObj.shipto_city || "",
              state: rowObj.shipto_state || "",
              zipcode: rowObj.shipto_zipcode || "",
              country: rowObj.shipto_country || "",
              contact: rowObj.shipto_contact || "",
              phone: rowObj.shipto_phone || "",
              fax: rowObj.shipto_fax || "",
              email: rowObj.shipto_email || "",
            },
            lines: [],
          };
        }

        const part = repositories.parts.value.find(
          (p) => p.partnumber === rowObj.line_number
        );
        invoicesByNumber[invNumber].lines.push({
          number: part ? part.id : "",
          description: rowObj.line_description || "",
          qty: parseNumber(rowObj.qty) || 0,
          price: parseNumber(rowObj.price) || 0,
          discount: parseNumber(rowObj.discount) || 0,
          unit: rowObj.unit || "",
        });
      });

      formattedData = Object.values(invoicesByNumber);
    } else if (importType.value === "gl") {
      const transactionsByRef = {};

      nonEmptyRows.forEach((row) => {
        const rowObj = rowToObject(row, importType.value);
        const reference = rowObj.reference || "";

        if (!transactionsByRef[reference]) {
          transactionsByRef[reference] = [];
        }
        transactionsByRef[reference].push(rowObj);
      });

      formattedData = [];

      Object.entries(transactionsByRef).forEach(([reference, rows]) => {
        const firstRow = rows[0];

        const transaction = {
          reference: reference,
          transdate: formatDate(firstRow.transdate || ""),
          department: firstRow.department || 0,
          description: firstRow.description || "",
          notes: firstRow.notes || "",
          curr: firstRow.curr || "",
          exchangeRate: parseNumber(firstRow.exchangerate) || 1.0,
          lines: [],
        };

        rows.forEach((row) => {
          transaction.lines.push({
            accno: row.accno || "",
            debit: parseNumber(row.debit) || 0,
            credit: parseNumber(row.credit) || 0,
            memo: row.memo || "",
            source: row.source || "",
            project: row.projectnumber || "",
          });
        });

        formattedData.push(transaction);
      });
    } else if (
      importType.value === "customer" ||
      importType.value === "vendor"
    ) {
      formattedData = nonEmptyRows.map((row) => formatEntityData(row));
    }

    try {
      const endpoint =
        importType.value === "gl"
          ? `/import/${importType.value}`
          : importType.value === "ar_invoice"
          ? `/import/invoice/customer`
          : importType.value === "ap_invoice"
          ? `/import/invoice/vendor`
          : `/import/arap/${importType.value}`;
      const response = await api.post(endpoint, formattedData);

      if (response.data.success) {
        Notify.create({
          color: "positive",
          message: t("Data imported successfully"),
          icon: "check_circle",
          position: "center",
        });
      } else {
        Notify.create({
          color: "negative",
          message: t(response.data.message || "Import failed"),
          icon: "error",
          position: "center",
        });
      }
    } catch (error) {
      console.error("API import error:", error);
      Notify.create({
        color: "negative",
        message: t("Failed to send data to server"),
        icon: "error",
        position: "center",
      });
    }
  } catch (error) {
    console.error("Import error:", error);
    Notify.create({
      color: "negative",
      message: t("An error occurred during import"),
      icon: "error",
      position: "center",
    });
  }
};

// Update onMounted to initialize columns
onMounted(async () => {
  await fetchModules();
  initializeColumns();
  setTimeout(() => {
    loading.value = false;
  }, 500);
});

// Update refreshSpreadsheet function to be more robust
const refreshSpreadsheet = () => {
  if (!spreadsheet.value) return;

  // Force re-rendering of the spreadsheet with updated data and columns
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    // Allow time for the component to re-render before trying to refresh
    setTimeout(() => {
      if (spreadsheet.value?.current?.[0]?.refresh) {
        spreadsheet.value.current[0].refresh();
      }
    }, 100);
  }, 50);
};

// Add columnGroups computed property and button action methods
const columnGroups = computed(() => {
  const currentType = importType.value;
  const groups = [];

  if (currentType === "gl") {
    groups.push({
      title: t("Header "),
      columns: availableColumns.value.filter((col) =>
        [
          "reference",
          "department",
          "description",
          "transdate",
          "notes",
          "curr",
          "exchangerate",
        ].includes(col.key)
      ),
    });
    groups.push({
      title: t("Line Items"),
      columns: availableColumns.value.filter((col) =>
        [
          "accno",
          "debit",
          "credit",
          "source",
          "memo",
          "projectnumber",
        ].includes(col.key)
      ),
    });
  } else if (currentType === "customer" || currentType === "vendor") {
    // First column is always customer/vendor number
    const firstCol = availableColumns.value.find(
      (col) => col.key === "customernumber" || col.key === "vendornumber"
    );

    groups.push({
      title: t("Number"),
      columns: firstCol ? [firstCol] : [],
    });

    groups.push({
      title: t("Basic Information"),
      columns: availableColumns.value.filter((col) =>
        [
          "name",
          "contact",
          "firstname",
          "lastname",
          "salutation",
          "contacttitle",
          "occupation",
          "mobile",
          "typeofcontact",
          "gender",
          "notes",
        ].includes(col.key)
      ),
    });

    groups.push({
      title: t("Contact Information"),
      columns: availableColumns.value.filter((col) =>
        [
          "address1",
          "address2",
          "city",
          "state",
          "zipcode",
          "country",
          "phone",
          "fax",
          "email",
          "cc",
          "bcc",
        ].includes(col.key)
      ),
    });

    groups.push({
      title: t("Financial Information"),
      columns: availableColumns.value.filter((col) =>
        [
          "terms",
          "discount",
          "creditlimit",
          "taxincluded",
          "taxnumber",
          "sic_code",
          "curr",
          "startdate",
          "enddate",
          "cashdiscount",
          "threshold",
          "discountterms",
          "remittancevoucher",
        ].includes(col.key)
      ),
    });

    groups.push({
      title: t("Banking Information"),
      columns: availableColumns.value.filter((col) =>
        [
          "bankname",
          "iban",
          "bic",
          "membernumber",
          "clearingnumber",
          "bankaddress1",
          "bankaddress2",
          "bankcity",
          "bankstate",
          "bankzipcode",
          "bankcountry",
        ].includes(col.key)
      ),
    });
  } else if (currentType === "ar_invoice" || currentType === "ap_invoice") {
    // First column is always customer/vendor number
    const firstCol = availableColumns.value.find(
      (col) => col.key === "customernumber" || col.key === "vendornumber"
    );

    groups.push({
      title: t("Number"),
      columns: firstCol ? [firstCol] : [],
    });

    groups.push({
      title: t("Invoice Header"),
      columns: availableColumns.value.filter((col) =>
        [
          "invnumber",
          "description",
          "invdate",
          "duedate",
          "curr",
          "exchangerate",
          "notes",
          "intnotes",
          "department",
          "recordaccount",
        ].includes(col.key)
      ),
    });

    groups.push({
      title: t("Order Information"),
      columns: availableColumns.value.filter((col) =>
        [
          "ordnumber",
          "ponumber",
          "shippingpoint",
          "shipvia",
          "waybill",
        ].includes(col.key)
      ),
    });

    groups.push({
      title: t("Line Items"),
      columns: availableColumns.value.filter((col) =>
        [
          "line_number",
          "line_description",
          "qty",
          "price",
          "discount",
          "unit",
        ].includes(col.key)
      ),
    });
  } else {
    // Default case - put all columns in one group
    groups.push({
      title: t("All Columns"),
      columns: availableColumns.value,
    });
  }

  // Filter out empty groups
  return groups.filter((group) => group.columns.length > 0);
});

// Methods to handle column selection
const selectAllColumns = () => {
  availableColumns.value.forEach((col) => {
    col.checked = true;
  });
  updateVisibleColumns();
};

const resetToDefaultColumns = () => {
  availableColumns.value.forEach((col) => {
    col.checked = col.required || col.default;
  });
  updateVisibleColumns();
};

const selectOnlyRequiredColumns = () => {
  availableColumns.value.forEach((col) => {
    col.checked = col.required;
  });
  updateVisibleColumns();
};
</script>

<style>
.jss-wrapper {
  width: 100%;
  overflow-x: auto;
}
</style>
