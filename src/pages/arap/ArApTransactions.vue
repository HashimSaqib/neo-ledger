<template>
  <q-page class="q-pa-md q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm container hide-print">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="container-bg"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <!-- Loading indicator shown inside params section when fetching -->
        <div v-if="loading" class="q-mt-xs q-py-xs text-center">
          <q-spinner-dots color="primary" size="30px" />
        </div>

        <!-- Basic Info Section -->
        <div class="flex-container">
          <div class="flex-container q-mt-md container">
            <s-select
              v-model="formData.account"
              :label="t('Accounts')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              :options="recordAccounts"
              account
              option-label="label"
            />
            <s-select
              v-model="formData.customer"
              :label="partyListLabel"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              :options="customers"
              search="label"
              option-label="label"
            />
            <q-input
              v-model="formData.customernumber"
              :label="partyNumberLabel"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              option-label="label"
            />
            <q-input
              v-model="formData.invnumber"
              class="lightbg"
              :label="t('Invoice Number')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.ordnumber"
              class="lightbg"
              :label="t('Order Number')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.ponumber"
              class="lightbg"
              :label="t('PO Number')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.shipvia"
              class="lightbg"
              :label="t('Ship Via')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.shippingpoint"
              class="lightbg"
              :label="t('Shipping Point')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.waybill"
              class="lightbg"
              :label="t('Waybill')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.warehouse"
              class="lightbg"
              :label="t('Warehouse')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.employee"
              class="lightbg"
              :label="t('Employee')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.department"
              class="lightbg"
              :label="t('Department')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.description"
              class="lightbg col-5"
              :label="t('Description')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.notes"
              class="lightbg col-5"
              :label="t('Notes')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.memo"
              class="lightbg"
              :label="t('Memo')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <q-input
              v-model="formData.source"
              class="lightbg"
              :label="t('Source')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
          </div>

          <div>
            <div class="flex-container q-mt-md container">
              <q-input
                v-model="formData.transdatefrom"
                type="date"
                :label="t('Transaction Date From')"
                input-class="maintext"
                label-color="secondary"
                class="lightbg col-4"
                outlined
                dense
              />
              <q-input
                v-model="formData.transdateto"
                type="date"
                :label="t('Transaction Date To')"
                input-class="maintext"
                label-color="secondary"
                class="lightbg col-4"
                outlined
                dense
              />
              <q-input
                v-model="formData.createdfrom"
                type="date"
                :label="t('Created Date From')"
                input-class="maintext"
                label-color="secondary"
                class="lightbg col-4"
                outlined
                dense
              />
              <q-input
                v-model="formData.createdto"
                type="date"
                :label="t('Created Date To')"
                input-class="maintext"
                label-color="secondary"
                class="lightbg col-4"
                outlined
                dense
              />
              <q-input
                v-model="formData.updatedfrom"
                type="date"
                :label="t('Updated Date From')"
                input-class="maintext"
                label-color="secondary"
                class="lightbg col-4"
                outlined
                dense
              />
              <q-input
                v-model="formData.updatedto"
                type="date"
                :label="t('Updated Date To')"
                input-class="maintext"
                label-color="secondary"
                class="lightbg col-4"
                outlined
                dense
              />
            </div>
            <div class="container">
              <q-toggle
                :model-value="formData.outstanding === 'Y'"
                @update:model-value="
                  (val) => (formData.outstanding = val ? 'Y' : '')
                "
                :label="t('Outstanding')"
                color="primary"
              />
              <q-toggle
                :model-value="formData.open === 'Y'"
                @update:model-value="(val) => (formData.open = val ? 'Y' : '')"
                :label="t('Open')"
                color="primary"
              />
              <q-toggle
                :model-value="formData.closed === 'Y'"
                @update:model-value="
                  (val) => (formData.closed = val ? 'Y' : '')
                "
                :label="t('Closed')"
                color="primary"
              />
              <q-toggle
                :model-value="formData.paidlate === 'Y'"
                @update:model-value="
                  (val) => (formData.paidlate = val ? 'Y' : '')
                "
                :label="t('Paid Late')"
                color="primary"
              />
              <q-toggle
                :model-value="formData.paidearly === 'Y'"
                @update:model-value="
                  (val) => (formData.paidearly = val ? 'Y' : '')
                "
                :label="t('Paid Early')"
                color="primary"
              />
              <q-toggle
                :model-value="formData.onhold === 'Y'"
                @update:model-value="
                  (val) => (formData.onhold = val ? 'Y' : '')
                "
                :label="t('On Hold')"
                color="primary"
              />
              <q-separator class="q-my-sm" />
              <div class="q-py-sm">
                <draggable
                  v-model="baseColumns"
                  item-key="name"
                  class="drag-area"
                >
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
            </div>
          </div>
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
        <s-button type="export-xl" @click="downloadExcel" class="q-mr-md" />
        <s-button type="export-pdf" @click="downloadPDF" />
      </div>
      <q-table
        class="q-mt-sm"
        :rows="filteredResults"
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

        <!-- Created Date Column -->
        <template v-slot:body-cell-created="props">
          <q-td :props="props">{{ formatTimestamp(props.row.created) }}</q-td>
        </template>

        <!-- Updated Date Column -->
        <template v-slot:body-cell-updated="props">
          <q-td :props="props">{{ formatUpdatedTimestamp(props.row) }}</q-td>
        </template>

        <template v-slot:body-cell-files="props">
          <q-td :props="props">
            <file-list :files="props.row.files" :report="true" />
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
        <template v-slot:body-cell-amount="props">
          <q-td :props="props">{{ formatAmount(props.row.amount) }}</q-td>
        </template>

        <!-- Paid Column -->
        <template v-slot:body-cell-paid="props">
          <q-td :props="props">{{ formatAmount(props.row.paid) }}</q-td>
        </template>

        <!-- Tax Column -->
        <template v-slot:body-cell-tax="props">
          <q-td :props="props">{{ formatAmount(props.row.tax) }}</q-td>
        </template>

        <!-- Net Amount Column -->
        <template v-slot:body-cell-netamount="props">
          <q-td :props="props">{{ formatAmount(props.row.netamount) }}</q-td>
        </template>

        <!-- Payment Difference Column -->
        <template v-slot:body-cell-paymentdiff="props">
          <q-td :props="props">{{ formatAmount(props.row.paymentdiff) }}</q-td>
        </template>

        <!-- Totals Row -->
        <template v-slot:bottom-row>
          <q-tr class="totals-row">
            <q-td
              v-for="col in columns"
              :key="col.name"
              :style="{ textAlign: col.align || 'left' }"
            >
              <template
                v-if="
                  [
                    'amount',
                    'netamount',
                    'paid',
                    'tax',
                    'paymentdiff',
                  ].includes(col.name)
                "
              >
                {{ formatAmount(totals[col.name]) || "" }}
              </template>
              <template v-else-if="col.name === 'description'">
                <strong>{{ t("Totals") }}</strong>
              </template>
              <template v-else> &nbsp; </template>
            </q-td>
          </q-tr>
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
import {
  formatAmount,
  downloadReport,
  createPDF,
  formatTimestamp,
  formatUpdatedTimestamp,
} from "src/helpers/utils";
import FileList from "src/components/FileList.vue";
const createLink = inject("createLink");

const { t } = useI18n();
const updateTitle = inject("updateTitle");
const route = useRoute();

// Initialize the type based on route param ("customer" or "vendor")
const type = ref(route.params.type || "customer");

// Computed labels for party selection and number
const partyListLabel = computed(() =>
  type.value === "customer" ? t("Customers") : t("Vendors")
);
const partyNumberLabel = computed(() =>
  type.value === "customer" ? t("Customer Number") : t("Vendor Number")
);

// Form data (with defaults)
const formData = ref({
  customer: "",
  invnumber: "",
  description: "",
  ordnumber: "",
  ponumber: "",
  source: "",
  memo: "",
  notes: "",
  transdatefrom: "",
  transdateto: "",
  month: "",
  year: "",
  interval: "0",
  department: "",
  warehouse: "",
  shippingpoint: "",
  shipvia: "",
  waybill: "",
  open: "Y",
  summary: "1",
  outstanding: "",
  closed: "Y",
  paidlate: "",
  paidearly: "",
  onhold: "",
  till: "",
  createdfrom: "",
  createdto: "",
  updatedfrom: "",
  updatedto: "",
});

const filtersOpen = route.query.search == 1 ? ref(false) : ref(true);
const results = ref([]);
const totals = ref({});
const loading = ref(false);

const baseColumns = ref([
  { name: "id", label: t("ID"), field: "id", default: false },
  {
    name: "invnumber",
    label: t("Invoice Number"),
    field: "invnumber",
    default: true,
    align: "left",
  },
  {
    name: "ordnumber",
    label: t("Order Number"),
    field: "ordnumber",
    default: false,
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
    name: "files",
    label: t("Files"),
    field: "files",
    default: true,
    sortable: true,
    align: "left",
  },
  {
    name: "ponumber",
    label: t("PO Number"),
    field: "ponumber",
    default: false,
    align: "left",
  },
  {
    name: "transdate",
    label: t("Invoice Date"),
    field: "transdate",
    default: true,
    align: "left",
  },
  {
    name: "created",
    label: t("Created Date"),
    field: "created",
    default: false,
    align: "left",
  },
  {
    name: "updated",
    label: t("Updated Date"),
    field: "updated",
    default: false,
    align: "left",
  },
  {
    name: "status",
    label: t("Status"),
    field: "status",
    default: true,
    align: "left",
  },
  {
    name: "name",
    label: partyListLabel.value.slice(0, -1),
    field: "name",
    default: true,
    align: "left",
  },
  {
    name: "customernumber",
    label: partyNumberLabel.value,
    field: "customernumber",
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
    name: "shipvia",
    label: t("Ship Via"),
    field: "shipvia",
    default: false,
    align: "left",
  },
  {
    name: "shippingpoint",
    label: t("Shipping Point"),
    field: "shippingpoint",
    default: false,
    align: "left",
  },
  {
    name: "waybill",
    label: t("Waybill"),
    field: "waybill",
    default: false,
    align: "left",
  },
  {
    name: "warehouse",
    label: t("Warehouse"),
    field: "warehouse",
    default: false,
    align: "left",
  },
  {
    name: "department",
    label: t("Department"),
    field: "department",
    default: false,
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
    name: "city",
    label: t("City"),
    field: "city",
    default: false,
    align: "left",
  },
  {
    name: "zipcode",
    label: t("Zipcode"),
    field: "zipcode",
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
    name: "netamount",
    label: t("Amount"),
    field: "netamount",
    default: false,
    align: "right",
  },

  {
    name: "tax",
    label: t("Tax"),
    field: "tax",
    default: false,
    align: "right",
  },
  {
    name: "amount",
    label: t("Total"),
    field: "amount",
    default: false,
    align: "right",
  },
  {
    name: "paid",
    label: t("Paid"),
    field: "paid",
    default: false,
    align: "right",
  },
  {
    name: "curr",
    label: t("Currency"),
    field: "curr",
    default: false,
    align: "left",
  },
  {
    name: "datepaid",
    label: t("Date Paid"),
    field: "datepaid",
    default: true,
    align: "left",
  },
  {
    name: "paymentdiff",
    label: t("Payment Difference"),
    field: "paymentdiff",
    default: false,
    align: "right",
  },
  {
    name: "paymentaccount",
    label: t("Payment Account"),
    field: "paymentaccount",
    default: false,
    align: "left",
  },

  {
    name: "duedate",
    label: t("Due Date"),
    field: "duedate",
    default: false,
    align: "left",
  },
  {
    name: "notes",
    label: t("Notes"),
    field: "notes",
    default: false,
    align: "left",
  },
]);

// Set all columns to be left-aligned and sortable
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

// Process filters from cookies (unchanged)
function processFilters() {
  const savedFilters = LocalStorage.getItem(
    `${type.value}_transactions_filters`
  );

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
      LocalStorage.remove(`${type.value}_transactions_filters`);
    }
  } else {
    const defaultFilters = {
      columns: baseColumns.value.reduce((acc, column) => {
        acc[column.name] = column.default;
        return acc;
      }, {}),
      order: baseColumns.value.map((col) => col.name),
    };

    LocalStorage.set(`${type.value}_transactions_filters`, defaultFilters, {
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
      LocalStorage.set(`${type.value}_transactions_filters`, filters, {
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
    const requiredKeys = ["id", "invoice", "till"];
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

const recordAccounts = ref([]);
const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    const accounts = response.data;
    // Filter by AR for customer transactions, AP for vendor transactions.
    recordAccounts.value = accounts.filter(
      (account) => account.link === (type.value === "customer" ? "AR" : "AP")
    );
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || t("Error fetching accounts"),
      type: "negative",
      position: "center",
    });
  }
};

const customers = ref([]);
const fetchCustomers = async () => {
  try {
    // Use dynamic endpoint: /arap/list/customer or /arap/list/vendor
    const response = await api.get(`/arap/list/${type.value}`);
    customers.value = response.data;
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || t("Error fetching") + " " + type.value,
      type: "negative",
      position: "center",
    });
  }
};

const flattenParams = (obj, prefix = "") => {
  const flattened = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (key === "customer" && typeof value === "object") {
      if (value.customernumber) {
        flattened["customernumber"] = value.customernumber;
      }
    } else if (key === "account" && typeof value === "object") {
      if (value.accno) {
        flattened["accno"] = value.accno;
      }
    } else if (typeof value === "object" && !Array.isArray(value)) {
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

/**
 * loadParams: Loads query parameters into formData.
 *
 * For example, if the URL includes ?accno=123&customer=Acme&invnumber=INV001,
 * this function will find the matching account from recordAccounts and assign it
 * to formData.account, and similarly for customer/vendor. Other parameters are loaded directly.
 *
 * Additionally, if a query parameter "search" equals "1", the search() function is called.
 */
const loadParams = () => {
  const query = route.query;

  // Load account using "accno"
  if (query.accno) {
    const account = recordAccounts.value.find(
      (acc) => acc.accno === query.accno
    );
    formData.value.account = account || query.accno;
  }

  // Load party using "customernumber" (remains the same key)
  if (query.customernumber) {
    const cust = customers.value.find(
      (c) =>
        c.customernumber.toLowerCase() === query.customernumber.toLowerCase()
    );
    formData.value.customer = cust || query.customer;
  }

  // Simplify loading of other parameters using an array of keys
  const simpleParams = [
    "invnumber",
    "ordnumber",
    "ponumber",
    "shipvia",
    "shippingpoint",
    "waybill",
    "warehouse",
    "employee",
    "department",
    "description",
    "notes",
    "memo",
    "source",
    "transdatefrom",
    "transdateto",
    "createdfrom",
    "createdto",
    "updatedfrom",
    "updatedto",
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

const search = async () => {
  loading.value = true;
  try {
    const params = flattenParams(formData.value);
    // Dynamic endpoint: /arap/transactions/customer or /arap/transactions/vendor
    const response = await api.get(`/arap/transactions/${type.value}`, {
      params,
    });
    filtersOpen.value = false;
    results.value = response.data.transactions;
    totals.value = response.data.totals;
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

const clearForm = () => {
  Object.keys(formData.value).forEach((key) => {
    if (key === "open") {
      formData.value[key] = "Y";
    } else if (key === "summary") {
      formData.value[key] = "1";
    } else if (key === "interval") {
      formData.value[key] = "0";
    } else {
      formData.value[key] = "";
    }
  });
};

const getPath = (row) => {
  let path = "";
  if (row.till) {
    path = createLink("ar.till");
  } else if (row.invoice) {
    path =
      type.value === "customer"
        ? createLink("customer.invoice")
        : createLink("vendor.invoice");
  } else {
    path = createLink(`${type.value}.transaction`);
  }
  const flatParams = flattenParams(formData.value);
  return {
    path,
    query: {
      id: row.id,
      ...flatParams,
      callback: createLink("base") + `/arap/transactions/${type.value}/`,
    },
  };
};

const downloadExcel = () => {
  downloadReport(filteredResults.value, columns.value, totals.value);
};
const title = inject("title");
const downloadPDF = () => {
  const params = {};

  type.value === "customer" ? "Customer Transactions" : "Vendor Transactions";
  createPDF(
    filteredResults.value,
    columns.value,
    totals.value,
    title.value,
    params
  );
};
onMounted(async () => {
  processFilters();
  await fetchAccounts();
  await fetchCustomers();
  updateTitle(
    type.value === "customer" ? "Customer Transactions" : "Vendor Transactions"
  );

  loadParams();
});
</script>

<style scoped>
/* Condensed/dense layout adjustments */
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
</style>
