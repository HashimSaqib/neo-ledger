<template>
  <q-page class="flex flex-col lightbg q-pa-md">
    <div class="column q-gutter-y-md">
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
      <div v-if="loading" class="full-width flex justify-center">
        <q-spinner color="primary" size="3em" />
      </div>
      <Spreadsheet ref="spreadsheet" v-else>
        <Worksheet :data="spreadsheetData" :columns="columns" />
      </Spreadsheet>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed } from "vue";
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

const entityColumns = [
  { title: t("Name"), key: "name" },
  { title: t("Contact"), key: "contact" },
  { title: t("Address 1"), key: "address1" },
  { title: t("Address 2"), key: "address2" },
  { title: t("City"), key: "city" },
  { title: t("State"), key: "state" },
  { title: t("Zipcode"), key: "zipcode" },
  { title: t("Country"), key: "country" },
  { title: t("Phone"), key: "phone" },
  { title: t("Fax"), key: "fax" },
  { title: t("Email"), key: "email" },
  { title: t("CC"), key: "cc" },
  { title: t("BCC"), key: "bcc" },
  { title: t("Notes"), key: "notes" },
  { title: t("Terms"), key: "terms" },
  { title: t("Discount"), type: "numeric", key: "discount" },
  { title: t("Credit Limit"), type: "numeric", key: "creditlimit" },
  { title: t("Tax Included"), key: "taxincluded" },
  { title: t("Tax Number"), key: "taxnumber" },
  { title: t("SIC Code"), key: "sic_code" },
  { title: t("Currency"), key: "curr" },
  { title: t("Start Date"), key: "startdate" },
  { title: t("End Date"), key: "enddate" },
  { title: t("Cash Discount"), type: "numeric", key: "cashdiscount" },
  { title: t("Threshold"), type: "numeric", key: "threshold" },
  { title: t("Discount Terms"), key: "discountterms" },
  { title: t("Remittance Voucher"), key: "remittancevoucher" },
  { title: t("Bank Name"), key: "bankname" },
  { title: t("IBAN"), key: "iban" },
  { title: t("BIC"), key: "bic" },
  { title: t("Member Number"), key: "membernumber" },
  { title: t("Clearing Number"), key: "clearingnumber" },
  { title: t("Bank Address 1"), key: "bankaddress1" },
  { title: t("Bank Address 2"), key: "bankaddress2" },
  { title: t("Bank City"), key: "bankcity" },
  { title: t("Bank State"), key: "bankstate" },
  { title: t("Bank Zipcode"), key: "bankzipcode" },
  { title: t("Bank Country"), key: "bankcountry" },
  { title: t("First Name"), key: "firstname" },
  { title: t("Last Name"), key: "lastname" },
  { title: t("Salutation"), key: "salutation" },
  { title: t("Contact Title"), key: "contacttitle" },
  { title: t("Occupation"), key: "occupation" },
  { title: t("Mobile"), key: "mobile" },
  { title: t("Type of Contact"), key: "typeofcontact" },
  { title: t("Gender"), key: "gender" },
];

const invoiceColumns = [
  { title: t("Invoice Number"), key: "invnumber" },
  { title: t("Description"), key: "description" },
  { title: t("Invoice Date"), key: "invdate" },
  { title: t("Due Date"), key: "duedate" },
  { title: t("Currency"), key: "curr" },
  { title: t("Exchange Rate"), type: "numeric", key: "exchangerate" },
  { title: t("Notes"), key: "notes" },
  { title: t("Internal Notes"), key: "intnotes" },
  { title: t("Department"), key: "department" },
  { title: t("Account"), key: "recordaccount" },
  { title: t("Order Number"), key: "ordnumber" },
  { title: t("PO Number"), key: "ponumber" },
  { title: t("Shipping Point"), key: "shippingpoint" },
  { title: t("Ship Via"), key: "shipvia" },
  { title: t("Waybill"), key: "waybill" },
  { title: t("Line Number"), key: "line_number" },
  { title: t("Line Description"), key: "line_description" },
  { title: t("Quantity"), type: "numeric", key: "qty" },
  { title: t("Price"), type: "numeric", key: "price" },
  { title: t("Discount"), type: "numeric", key: "discount" },
  { title: t("Unit"), key: "unit" },
];

const importConfigs = {
  gl: {
    columns: [
      { title: t("Reference"), key: "reference" },
      { title: t("Department"), key: "department" },
      { title: t("Description"), key: "description" },
      { title: t("Trans Date"), key: "transdate" },
      { title: t("Notes"), key: "notes" },
      { title: t("Currency"), key: "curr" },
      { title: t("Exchange Rate"), type: "numeric", key: "exchangerate" },
      { title: t("Account No"), key: "accno" },
      { title: t("Debit"), type: "numeric", key: "debit" },
      { title: t("Credit"), type: "numeric", key: "credit" },
      { title: t("Source"), key: "source" },
      { title: t("Memo"), key: "memo" },
      { title: t("Project Number"), key: "projectnumber" },
    ],
  },
  customer: {
    columns: [
      { title: t("Customer Number"), key: "customernumber" },
      ...entityColumns,
    ],
  },
  vendor: {
    columns: [
      { title: t("Vendor Number"), key: "vendornumber" },
      ...entityColumns,
    ],
  },
  ar_invoice: {
    columns: [
      { title: t("Customer Number"), key: "customernumber" },
      ...invoiceColumns,
    ],
  },
  ap_invoice: {
    columns: [
      { title: t("Vendor Number"), key: "vendornumber" },
      ...invoiceColumns,
    ],
  },
  default: {
    columns: [
      { title: t("Column 1"), key: "COL1" },
      { title: t("Column 2"), key: "COL2" },
    ],
  },
};

const getColumnIndexes = (type) => {
  const config = importConfigs[type] || importConfigs.default;
  const indexes = {};

  config.columns.forEach((col, index) => {
    if (col.key) {
      indexes[col.key] = index;
    }
  });

  return indexes;
};

const rowToObject = (row, type) => {
  const config = importConfigs[type] || importConfigs.default;
  const obj = {};

  config.columns.forEach((col, index) => {
    if (col.key) {
      obj[col.key] = row[index];
    }
  });

  return obj;
};

const createEmptyRows = (count) => {
  const config = importConfigs[importType.value] || importConfigs.default;
  const colCount = config.columns.length;
  return Array(count)
    .fill()
    .map(() => Array(colCount).fill(""));
};

const spreadsheetData = ref(createEmptyRows(50));

const getColumnsConfig = (type) => {
  const config = importConfigs[type] || importConfigs.default;
  return config.columns;
};

const columns = computed(() => getColumnsConfig(importType.value));

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
        field: "duedate",
        rule: (value) => {
          const formattedDate = formatDate(value);
          return {
            valid: formattedDate !== "",
            message: formattedDate === "" ? "Invalid due date format" : "",
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
        field: "duedate",
        rule: (value) => {
          const formattedDate = formatDate(value);
          return {
            valid: formattedDate !== "",
            message: formattedDate === "" ? "Invalid due date format" : "",
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

onMounted(async () => {
  await fetchModules();
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<style>
.jss-wrapper {
  width: 100%;
  overflow-x: auto;
}
</style>
