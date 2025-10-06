<template>
  <q-page class="lightbg q-pa-md q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm mainbg container">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="container-bg"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <!-- Basic Info Section -->
        <div class="row q-mt-md q-gutter-md">
          <s-select
            class="lightbg col-6 col-md-3"
            v-model="formData.dropdown"
            :label="nameLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            :options="vCList"
            option-label="label"
            option-value="name"
            search="label"
            map-options
            emit-value
          />
          <q-input
            v-model="formData.name"
            class="lightbg col-6 col-md-3"
            :label="nameLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.contact"
            class="lightbg col-6 col-md-3"
            :label="t('Contact')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.email"
            class="lightbg col-6 col-md-3"
            :label="t('E-mail')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.phone"
            class="lightbg col-6 col-md-3"
            :label="t('Phone')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
        </div>

        <!-- Additional Info Section -->
        <div class="row q-mt-xs q-gutter-md">
          <q-input
            v-model="formData[vcNumberProperty]"
            class="lightbg col-6 col-md-3"
            :label="numberLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.address"
            class="lightbg col-6 col-md-3"
            :label="t('Address')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.city"
            class="lightbg col-6 col-md-3"
            :label="t('City')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.state"
            class="lightbg col-6 col-md-3"
            :label="t('State/Province')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.zipcode"
            class="lightbg col-6 col-md-3"
            :label="t('Zip/Postal Code')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-select
            v-model="formData.country"
            class="lightbg col-6 col-md-3"
            :label="t('Country')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            :options="countryOptions"
          />
        </div>

        <div class="row q-mt-md q-gutter-x-md">
          <q-input
            v-model="formData.transdatefrom"
            type="date"
            :label="t('Transaction Date From')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-6 col-md-3"
            outlined
            dense
          />
          <q-input
            v-model="formData.transdateto"
            type="date"
            :label="t('Transaction Date To')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-6 col-md-3"
            outlined
            dense
          />
        </div>

        <!-- Transaction Type Section -->
        <div class="row q-mt-xs q-gutter-md">
          <div class="col-12">
            <q-toggle
              v-model="formData.l_transnumber"
              :label="transactionLabel.transNumber"
              class="q-mr-md"
            />
            <q-toggle
              v-model="formData.l_invnumber"
              :label="transactionLabel.invNumber"
              class="q-mr-md"
            />
            <q-toggle
              v-model="formData.l_ordnumber"
              :label="transactionLabel.ordNumber"
              class="q-mr-md"
            />
            <q-toggle
              v-model="formData.l_quonumber"
              label="Quotations"
              class="q-mr-md"
            />
          </div>
        </div>

        <div class="row q-gutter-x-md" v-if="isAnyTransactionTypeSelected">
          <q-checkbox
            v-model="formData.open"
            label="Open"
            val="Y"
            class="q-mr-md"
          />
          <q-checkbox
            v-model="formData.closed"
            label="Closed"
            val="Y"
            class="q-mr-md"
          />

          <div class="col-12">
            <q-checkbox
              v-model="formData.l_amount"
              label="Amount"
              class="q-mr-md"
            />
            <q-checkbox v-model="formData.l_tax" label="Tax" class="q-mr-md" />
            <q-checkbox
              v-model="formData.l_total"
              label="Total"
              class="q-mr-md"
            />
            <q-checkbox
              v-model="formData.l_subtotal"
              label="Subtotal"
              class="q-mr-md"
            />
          </div>
        </div>

        <!-- Column Selection Section -->
        <div class="q-py-md">
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
        </div>

        <!-- Action Buttons -->
        <div class="row q-mt-md justify-end">
          <s-button type="clear" @click="clearForm" class="q-mr-sm" />

          <s-button type="search" @click="search" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Results Table -->
    <div v-if="results.length > 0">
      <q-table
        class="q-mt-md"
        :rows="filteredResults"
        row-key="uniqueRowId"
        :columns="finalColumns"
        flat
        bordered
        dense
        :rows-per-page-options="[0]"
        virtual-scroll
        virtual-scroll-sticky-end
      >
        <!-- Example slot for "id" column linking -->
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.name }}
            </router-link>
          </q-td>
        </template>
        <template v-slot:body-cell-invnumber="props">
          <q-td :props="props">
            <router-link :to="getinvPath(props.row)" class="text-primary">
              {{ props.row.invnumber }}
            </router-link>
          </q-td>
        </template>
        <template v-slot:body-cell="props">
          <q-td :props="props">
            <span v-if="['amount', 'tax', 'total'].includes(props.col.name)">
              {{ formatAmount(props.row[props.col.name]) }}
            </span>
            <span v-else>
              {{ props.row[props.col.name] }}
            </span>
          </q-td>
        </template>
      </q-table>
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
import { formatAmount } from "src/helpers/utils";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
const route = useRoute();

const allColumns = [
  { name: "id", label: "ID", field: "id", default: false },
  { name: "type", label: "Type", field: "type", default: false },
  {
    name: "customernumber",
    label: "Customer Number",
    field: "customernumber",
    default: false,
  },
  {
    name: "vendornumber",
    label: "Vendor Number",
    field: "vendornumber",
    default: true,
  },
  { name: "name", label: "Name", field: "name", default: true },
  { name: "address", label: "Address", field: "address", default: true },
  {
    name: "salutation",
    label: "Salutation",
    field: "salutation",
    default: false,
  },
  { name: "contact", label: "Contact", field: "contact", default: false },
  { name: "title", label: "Title", field: "title", default: false },
  { name: "gender", label: "Gender", field: "gender", default: false },
  {
    name: "occupation",
    label: "Occupation",
    field: "occupation",
    default: false,
  },
  { name: "email", label: "E-mail", field: "email", default: true },
  { name: "cc", label: "Cc", field: "cc", default: false },
  { name: "bcc", label: "Bcc", field: "bcc", default: false },
  { name: "city", label: "City", field: "city", default: false },
  { name: "state", label: "State/Province", field: "state", default: false },
  {
    name: "zipcode",
    label: "Zip/Postal Code",
    field: "zipcode",
    default: false,
  },
  { name: "country", label: "Country", field: "country", default: false },
  { name: "phone", label: "Phone", field: "phone", default: true },
  { name: "fax", label: "Fax", field: "fax", default: false },
  { name: "notes", label: "Notes", field: "notes", default: false },
  { name: "discount", label: "Discount", field: "discount", default: false },
  { name: "threshold", label: "Threshold", field: "threshold", default: false },
  { name: "accounts", label: "Accounts", field: "accounts", default: false },
  {
    name: "paymentmethod",
    label: "Payment Method",
    field: "paymentmethod",
    default: false,
  },
  {
    name: "taxnumber",
    label: "Tax Number",
    field: "taxnumber",
    default: false,
  },
  {
    name: "salesperson",
    label: "Salesperson",
    field: "salesperson",
    default: false,
  },
  {
    name: "pricegroup",
    label: "Pricegroup",
    field: "pricegroup",
    default: false,
  },
  { name: "sic", label: "SIC", field: "sic", default: false },
  { name: "bank", label: "Bank", field: "bank", default: false },
  { name: "iban", label: "IBAN", field: "iban", default: false },
  { name: "bic", label: "BIC", field: "bic", default: false },
  {
    name: "membernumber",
    label: "Member Number",
    field: "membernumber",
    default: false,
  },
  { name: "bcnumber", label: "BC Number", field: "bcnumber", default: false },
  {
    name: "typeofbusiness",
    label: "Type of Business",
    field: "typeofbusiness",
    default: false,
  },
  {
    name: "creditlimit",
    label: "Credit Limit",
    field: "creditlimit",
    default: false,
  },
  {
    name: "outstanding",
    label: "Outstanding",
    field: "outstanding",
    default: false,
  },
  {
    name: "availablecredit",
    label: "Available Credit",
    field: "availablecredit",
    default: false,
  },
  { name: "terms", label: "Terms", field: "terms", default: false },
  { name: "language", label: "Language", field: "language", default: false },
  {
    name: "remittancevoucher",
    label: "Remittance Voucher",
    field: "remittancevoucher",
    default: false,
  },
  { name: "startdate", label: "Startdate", field: "startdate", default: false },
  { name: "enddate", label: "Enddate", field: "enddate", default: false },
];

// Ensure alignment & sortability for all columns
allColumns.forEach((col) => {
  col.align = col.align || "left";
  col.sortable = true;
});

// This ref will contain only the relevant columns for the current vcType (customer/vendor).
const baseColumns = ref([]);

// "invnumber" column is added if l_transnumber or l_invnumber toggles are on.
const invnumberColumn = {
  name: "invnumber",
  label: "Invoice",
  field: "invnumber",
  align: "left",
  sortable: true,
};

// Amount columns appear if toggled & any transaction is selected
const fixedColumns = [
  {
    name: "amount",
    label: "Amount",
    field: "netamount",
    align: "left",
    sortable: true,
  },
  { name: "tax", label: "Tax", field: "tax", align: "left", sortable: true },
  {
    name: "total",
    label: "Total",
    field: "amount",
    align: "left",
    sortable: true,
  },
  {
    name: "subtotal",
    label: "Subtotal",
    field: "subtotal",
    align: "left",
    sortable: true,
  },
];

// ----------------------------------------------------
//  Tracking form data & toggles
// ----------------------------------------------------
const vcType = ref(route.params.type || "customer");

const formData = ref({
  name: "",
  contact: "",
  email: "",
  phone: "",
  customernumber: "",
  vendornumber: "",
  address: "",
  city: "",
  state: "",
  zipcode: "",
  country: "",
  // Transaction toggles
  l_transnumber: false, // AR/AP Transactions
  l_invnumber: false, // Sales/Vendor Invoices
  l_ordnumber: false, // Sales/Purchase Orders
  l_quonumber: false, // Quotations
  transdatefrom: "",
  transdateto: "",
  open: false,
  closed: false,
  // Amount toggles
  l_amount: false,
  l_tax: false,
  l_total: false,
  l_subtotal: false,
});

// Dynamic labels
const nameLabel = ref("Customer");
const numberLabel = ref("Customer Number");
const transactionLabel = ref({
  transNumber: "AR Transactions",
  invNumber: "Sales Invoices",
  ordNumber: "Sales Orders",
});

// If we’re in vendor mode, we use vendornumber; otherwise customernumber
const vcNumberProperty = computed(() => {
  return vcType.value === "vendor" ? "vendornumber" : "customernumber";
});

const filtersOpen = ref(true);
const results = ref([]);
const countryOptions = ref([]);

// This tracks user toggles for each column
const selectedColumns = ref({});

// Are any transaction toggles on?
const isAnyTransactionTypeSelected = computed(() => {
  return (
    formData.value.l_transnumber ||
    formData.value.l_invnumber ||
    formData.value.l_ordnumber ||
    formData.value.l_quonumber
  );
});

const vCList = ref([]);
const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/${vcType.value}/`);
    vcType.value === "customer"
      ? (vCList.value = response.data.customers)
      : (vCList.value = response.data.vendors);
  } catch (error) {
    console.error("Failed to fetch links:", error);
    Notify.create({
      message: t("Failed to fetch links"),
      type: "negative",
      position: "center",
    });
  }
};

// ----------------------------------------------------
//  finalColumns
//    1) Start with baseColumns that survived updateVCSettings() (only relevant columns).
//    2) Filter by user toggles in selectedColumns.
//    3) Add invnumber if l_transnumber or l_invnumber.
//    4) Add amount/tax/total/subtotal if toggled & any transaction is selected.
// ----------------------------------------------------
const finalColumns = computed(() => {
  let cols = baseColumns.value.filter(
    (col) => selectedColumns.value[col.name] === true
  );

  // If AR/AP or Invoice toggles are on => add invnumber column (if not already there).
  if (formData.value.l_transnumber || formData.value.l_invnumber) {
    if (!cols.find((c) => c.name === invnumberColumn.name)) {
      cols.push(invnumberColumn);
    }
  }

  // If any transaction toggles are on, we add the amount columns if toggled
  if (isAnyTransactionTypeSelected.value) {
    fixedColumns.forEach((fc) => {
      if (formData.value[`l_${fc.name}`]) {
        // Only push if not present
        if (!cols.find((c) => c.name === fc.name)) {
          cols.push(fc);
        }
      }
    });
  }

  return cols;
});

// ----------------------------------------------------
//  Cookie name for storing user column preferences
// ----------------------------------------------------
const filterCookieName = computed(() => {
  return vcType.value === "vendor"
    ? "vendor_search_filters"
    : "customer_search_filters";
});

// Whenever columns or selection changes, save to cookie
watch(
  [selectedColumns, baseColumns, filterCookieName],
  () => {
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((c) => c.name),
    };
    try {
      LocalStorage.set(filterCookieName.value, filters, { expires: 30 });
    } catch (error) {
      console.error("Error saving filters to cookies:", error);
    }
  },
  { deep: true }
);

// ----------------------------------------------------
//  flattenParams - for the search
// ----------------------------------------------------
function flattenParams(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      v === null ||
      v === undefined ||
      (typeof v === "string" && v.trim() === "") ||
      (typeof v === "boolean" && !v)
    ) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

// ----------------------------------------------------
//  search
// ----------------------------------------------------
async function search() {
  try {
    const endpoint =
      vcType.value === "vendor" ? "/arap/vendor/" : "/arap/customer/";
    const params = flattenParams(formData.value);
    params.name = formData.value.dropdown;
    const resp = await api.get(endpoint, { params });
    if (resp.data) {
      results.value = resp.data;
    } else {
      results.value = [];
      Notify.create({
        message: t("No Results Found"),
        type: "negative",
        position: "center",
      });
    }
    filtersOpen.value = false;
  } catch (err) {
    console.error(err);
    Notify.create({
      message: err.response?.data?.message || "Error performing search",
      type: "negative",
      position: "center",
    });
  }
}

// ----------------------------------------------------
//  clearForm
// ----------------------------------------------------
function clearForm() {
  Object.keys(formData.value).forEach((key) => {
    if (
      key === "open" ||
      key === "closed" ||
      key === "l_amount" ||
      key === "l_tax" ||
      key === "l_total" ||
      key === "l_subtotal" ||
      key === "l_transnumber" ||
      key === "l_invnumber" ||
      key === "l_ordnumber" ||
      key === "l_quonumber"
    ) {
      formData.value[key] = false;
    } else {
      formData.value[key] = "";
    }
  });
}

// ----------------------------------------------------
//  processFilters - loads cookie & merges with default
// ----------------------------------------------------
function processFilters() {
  const saved = LocalStorage.getItem(filterCookieName.value);
  if (saved) {
    try {
      const parsed = typeof saved === "string" ? JSON.parse(saved) : saved;
      if (parsed && parsed.columns && parsed.order) {
        // Merge with our local selectedColumns
        selectedColumns.value = {
          ...selectedColumns.value,
          ...parsed.columns,
        };
        // Reorder baseColumns
        const newOrder = [];
        parsed.order.forEach((nm) => {
          const found = baseColumns.value.find((c) => c.name === nm);
          if (found) newOrder.push(found);
        });
        // Append any that were not in saved order
        baseColumns.value.forEach((c) => {
          if (!newOrder.includes(c)) newOrder.push(c);
        });
        baseColumns.value = newOrder;
      } else {
        throw new Error("Invalid cookie structure");
      }
    } catch (error) {
      console.error("Error parsing saved filters:", error);
      LocalStorage.remove(filterCookieName.value);
    }
  } else {
    // No cookie => create defaults
    const defaults = {};
    baseColumns.value.forEach((c) => {
      defaults[c.name] = c.default;
    });
    const filterObj = {
      columns: defaults,
      order: baseColumns.value.map((c) => c.name),
    };
    LocalStorage.set(filterCookieName.value, filterObj, { expires: 30 });
    selectedColumns.value = defaults;
  }
}

// ----------------------------------------------------
//  filteredResults
//    If any transaction toggles are on => deduplicate
// ----------------------------------------------------
const filteredResults = computed(() => {
  // If no transaction toggles => just return rows as-is
  if (!isAnyTransactionTypeSelected.value) {
    return results.value.map((row, idx) => ({
      ...row,
      uniqueRowId: `${row.id}-${idx}`,
    }));
  }

  const transactionCols = [
    "invid",
    "module",
    "invnumber",
    "ordnumber",
    "quonumber",
    "amount",
    "tax",
    "total",
    "subtotal",
  ];
  const seen = new Set();

  return results.value.map((row, idx) => {
    const newRow = { ...row };

    if (seen.has(row.id)) {
      // Blank out non-transaction columns
      Object.keys(newRow).forEach((key) => {
        if (!transactionCols.includes(key)) {
          newRow[key] = "";
        }
      });
    } else {
      seen.add(row.id);
    }

    // Always attach a uniqueRowId
    newRow.uniqueRowId = `${row.id}-${idx}`;
    return newRow;
  });
});

// ----------------------------------------------------
//  getPath
// ----------------------------------------------------
const createLink = inject("createLink");

function getPath(row) {
  const base = createLink(vcType.value);
  return { path: base, query: { id: row.id } };
}

function getinvPath(row) {
  const base =
    vcType.value === "vendor"
      ? row.module === "ir"
        ? createLink("vendor.invoice")
        : createLink("vendor.transaction")
      : row.module === "is"
      ? createLink("customer.invoice")
      : createLink("customer.transaction");
  return { path: base, query: { id: row.invid } };
}

// ----------------------------------------------------
//  updateVCSettings
//    1) Switch out the relevant columns from allColumns
//    2) Load cookies for that set
// ----------------------------------------------------
function updateVCSettings() {
  // Switch out labeling
  if (vcType.value === "vendor") {
    nameLabel.value = "Vendor";
    numberLabel.value = "Vendor Number";
    transactionLabel.value.transNumber = "AP Transactions";
    transactionLabel.value.invNumber = "Vendor Invoices";
    transactionLabel.value.ordNumber = "Purchase Orders";

    // Filter out "customer"/"customernumber" from baseColumns
    baseColumns.value = allColumns.filter(
      (c) => c.name !== "customer" && c.name !== "customernumber"
    );
  } else {
    nameLabel.value = "Customer";
    numberLabel.value = "Customer Number";
    transactionLabel.value.transNumber = "AR Transactions";
    transactionLabel.value.invNumber = "Sales Invoices";
    transactionLabel.value.ordNumber = "Sales Orders";

    // Filter out "vendor"/"vendornumber" from baseColumns
    baseColumns.value = allColumns.filter(
      (c) => c.name !== "vendor" && c.name !== "vendornumber"
    );
  }

  // Process cookie-based user preferences
  processFilters();
}

// ----------------------------------------------------
//  Lifecycle
// ----------------------------------------------------
onMounted(async () => {
  if (updateTitle) {
    updateTitle(
      vcType.value === "vendor" ? "Search Vendors" : "Search Customers"
    );
  }
  await fetchLinks();
  updateVCSettings(); // Initialize baseColumns and selectedColumns on mount
});

watch(
  () => route.params.type,
  (newType) => {
    vcType.value = newType || "customer";
    updateVCSettings();
    if (updateTitle) {
      updateTitle(
        vcType.value === "vendor" ? "Search Vendors" : "Search Customers"
      );
    }
  }
);
</script>
<style scoped>
.drag-area {
  display: flex;
  flex-wrap: wrap;
}

/* Table container height */
:deep(.q-table__container) {
  height: calc(100vh - 180px);
  position: relative;
}

/* Sticky header styles */
:deep(.q-table thead) {
  position: sticky;
  z-index: 2;
  top: 0;
  background-color: var(--q-maintext);
  color: var(--q-main g);
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

/* Loading state */
.q-table--loading {
  opacity: 0.7;
  transition: opacity 0.3s ease-in-out;
}

/* Totals row styling */
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
  text-align: left;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}

:deep(.totals-row td[class*="amount"]),
:deep(.totals-row td[class*="paid"]),
:deep(.totals-row td[class*="tax"]),
:deep(.totals-row td[class*="paymentdiff"]) {
  text-align: right !important;
}

/* Number columns alignment */
:deep(.q-table tbody td[class*="amount"]),
:deep(.q-table tbody td[class*="paid"]),
:deep(.q-table tbody td[class*="tax"]),
:deep(.q-table tbody td[class*="paymentdiff"]) {
  text-align: right;
}

/* Virtual scroll table content */
:deep(.q-virtual-scroll__content) {
  margin-bottom: 0 !important;
}

/* Ensure proper padding */
:deep(.q-table td) {
  padding: 8px 16px;
}

.wrapped-description {
  white-space: pre-wrap;
  min-width: 10vw;
}
</style>
