<template>
  <q-page class="lightbg q-px-md q-py-md relative-position">
    <q-form @submit.prevent class="q-px-md q-py-md mainbg">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <!-- Basic Info Section -->
        <div class="row q-mt-md q-gutter-md">
          <q-select
            v-model="formData.account"
            class="lightbg col-6 col-md-3"
            :label="t('Accounts')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            :options="salesAccounts"
          />
          <q-select
            v-model="formData.vendor"
            class="lightbg col-3"
            :label="t('Vendors')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            :options="vendors"
          />
          <q-input
            v-model="formData.vendornumber"
            class="lightbg"
            :label="t('vendor Number')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
        </div>

        <!-- Document Numbers Section -->
        <div class="row q-mt-sm q-gutter-md">
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
        </div>

        <!-- Entity Information Section -->
        <div class="row q-mt-sm q-gutter-md">
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
        </div>

        <!-- Description Fields Section -->
        <div class="row q-mt-sm q-gutter-md">
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

        <!-- Date Range Section -->
        <div class="row q-mt-sm q-gutter-md">
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
        </div>

        <div class="row q-mt-sm q-gutter-md">
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
            @update:model-value="(val) => (formData.closed = val ? 'Y' : '')"
            :label="t('Closed')"
            color="primary"
          />
          <q-toggle
            :model-value="formData.paidlate === 'Y'"
            @update:model-value="(val) => (formData.paidlate = val ? 'Y' : '')"
            :label="t('Paid Late')"
            color="primary"
          />
          <q-toggle
            :model-value="formData.paidearly === 'Y'"
            @update:model-value="(val) => (formData.paidearly = val ? 'Y' : '')"
            :label="t('Paid Early')"
            color="primary"
          />
          <q-toggle
            :model-value="formData.onhold === 'Y'"
            @update:model-value="(val) => (formData.onhold = val ? 'Y' : '')"
            :label="t('On Hold')"
            color="primary"
          />
        </div>
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
        <div class="row q-mt-md">
          <q-btn
            type="submit"
            :label="t('Search')"
            color="primary"
            class="q-mr-sm"
            @click="search"
          />
          <q-btn :label="t('Clear')" @click="clearForm" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Column Selection -->

    <!-- Results Table -->
    <div v-if="results.length > 0">
      <q-table
        class="q-mt-md"
        :rows="filteredResults"
        row-key="id"
        :columns="columns"
        flat
        bordered
        dense
        :rows-per-page-options="[0]"
        virtual-scroll
        virtual-scroll-sticky-end
      >
        <!-- Invoice Number Column -->
        <template v-slot:body-cell-invnumber="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.invnumber }}
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

        <!-- vendor  Name -->
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
            <q-td v-for="col in columns" :key="col.name">
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
import { Cookies, Notify } from "quasar";
import draggable from "vuedraggable";
import { useI18n } from "vue-i18n";
import { formatAmount } from "src/helpers/utils";
const { t } = useI18n();
const updateTitle = inject("updateTitle");

// Updated form data initialization with Y/empty string values
const formData = ref({
  vendor: "",
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
  open: "Y", // Default to "Y"
  summary: "1",
  outstanding: "",
  closed: "",
  paidlate: "",
  paidearly: "",
  onhold: "",
  till: "",
});
const filtersOpen = ref(true);
const results = ref([]);
const totals = ref({});
const baseColumns = ref([
  {
    name: "id",
    label: "ID",
    field: "id",
    default: false,
  },
  {
    name: "invnumber",
    label: "Invoice Number",
    field: "invnumber",
    default: true,
  },
  {
    name: "ordnumber",
    label: "Order Number",
    field: "ordnumber",
    default: false,
  },
  {
    name: "description",
    label: "Description",
    field: "description",
    default: true,
    sortable: true,
  },
  {
    name: "ponumber",
    label: "PO Number",
    field: "ponumber",
    default: false,
  },
  {
    name: "transdate",
    label: "Invoice Date",
    field: "transdate",
    default: true,
  },
  {
    name: "name",
    label: "Vendor",
    field: "name",
    default: true,
  },
  {
    name: "vendornumber",
    label: "Vendor Number",
    field: "vendornumber",
    default: false,
  },
  {
    name: "taxnumber",
    label: "Tax Number",
    field: "taxnumber",
    default: false,
  },
  {
    name: "shipvia",
    label: "Ship Via",
    field: "shipvia",
    default: false,
  },
  {
    name: "shippingpoint",
    label: "Shipping Point",
    field: "shippingpoint",
    default: false,
  },
  {
    name: "waybill",
    label: "Waybill",
    field: "waybill",
    default: false,
  },
  {
    name: "warehouse",
    label: "Warehouse",
    field: "warehouse",
    default: false,
  },

  {
    name: "department",
    label: "Department",
    field: "department",
    default: false,
  },
  {
    name: "address",
    label: "Address",
    field: "address",
    default: false,
  },
  {
    name: "city",
    label: "City",
    field: "city",
    default: false,
  },
  {
    name: "zipcode",
    label: "Zipcode",
    field: "zipcode",
    default: false,
  },
  {
    name: "country",
    label: "Country",
    field: "country",
    default: false,
  },
  {
    name: "netamount",
    label: "Amount",
    field: "netamount",
    default: false,
  },
  {
    name: "paid",
    label: "Paid",
    field: "paid",
    default: false,
  },
  {
    name: "tax",
    label: "Tax",
    field: "tax",
    default: false,
  },
  {
    name: "amount",
    label: "Total",
    field: "amount",
    default: false,
  },
  {
    name: "curr",
    label: "Currency",
    field: "curr",
    default: false,
  },
  {
    name: "datepaid",
    label: "Date Paid",
    field: "datepaid",
    default: true,
  },
  {
    name: "paymentdifferent",
    label: "Payment Difference",
    field: "paymentdiff",
    default: false,
  },
  {
    name: "paymentaccount",
    label: "Payment Account",
    field: "paymentaccount",
    default: false,
  },
  {
    name: "paymentmethod",
    label: "Payment Method",
    field: "paymentmethod",
    default: false,
  },
  {
    name: "duedate",
    label: "Due Date",
    field: "duedate",
    default: false,
  },
  {
    name: "notes",
    label: "Notes",
    field: "notes",
    default: false,
  },
]);

// Initialize all columns with left alignment
baseColumns.value = baseColumns.value.map((column) => ({
  ...column,
  align: "left",
  sortable: true,
}));

const selectedColumns = ref(
  baseColumns.value.reduce((acc, column) => {
    acc[column.name] = column.default;
    return acc;
  }, {})
);

function processFilters() {
  const savedFilters = Cookies.get("ar_transactions_filters");

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

    Cookies.set("ar_transactions_filters", defaultFilters, {
      expires: 30,
    });

    selectedColumns.value = defaultFilters.columns;
    baseColumns.value = defaultFilters.order
      .map((name) => baseColumns.value.find((col) => col.name === name))
      .filter((col) => col !== undefined);
  }
}

// Watch for changes in filters
watch(
  [selectedColumns, baseColumns],
  () => {
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((col) => col.name),
    };

    try {
      Cookies.set("ar_transactions_filters", filters, {
        expires: 30,
      });
    } catch (error) {
      console.error("Error saving filters to cookies:", error);
    }
  },
  { deep: true }
);

// Computed properties for columns and filtered results
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
    const requiredKeys = ["id", "invoice"];

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

// Data fetching functions
const salesAccounts = ref([]);
const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    const accounts = response.data;
    salesAccounts.value = accounts.filter((account) => account.link === "AP");
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || "Error fetching accounts",
      type: "negative",
      position: "center",
    });
  }
};

const vendors = ref([]);
const fetchVendors = async () => {
  try {
    const response = await api.get("/arap/list/vendor");
    vendors.value = response.data;
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || "Error fetching vendors",
      type: "negative",
      position: "center",
    });
  }
};
const flattenParams = (obj, prefix = "") => {
  const flattened = {};

  Object.entries(obj).forEach(([key, value]) => {
    // Skip null, undefined, or empty string values
    if (value === null || value === undefined || value === "") {
      return;
    }

    // Handle `vendor` object differently
    if (key === "vendor" && typeof value === "object") {
      // Add only `vendornumber` key-value pair
      if (value.vendornumber) {
        flattened["vendornumber"] = value.vendornumber;
      }
    }
    // Handle `account` object differently
    else if (key === "account" && typeof value === "object") {
      // Add only `accno` key-value pair
      if (value.accno) {
        flattened["accno"] = value.accno;
      }
    }
    // Handle nested objects for other keys
    else if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenParams(value, prefix ? `${prefix}[${key}]` : key)
      );
    } else {
      // Add non-empty primitive values
      const paramKey = prefix ? `${prefix}[${key}]` : key;
      flattened[paramKey] = value;
    }
  });

  return flattened;
};

// Form actions
const search = async () => {
  try {
    const params = flattenParams(formData.value);
    const response = await api.get("/arap/transactions/vendor", {
      params: params,
    });

    filtersOpen.value = false;
    results.value = response.data.transactions;
    totals.value = response.data.totals;
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || "Error performing search",
      type: "negative",
      position: "center",
    });
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

  if (row.invoice) {
    path = "/ap/vendor-invoice";
  } else {
    path = "/arap/transaction/vendor";
  }

  return { path, query: { id: row.id } };
};

// Lifecycle hooks
onMounted(() => {
  processFilters();
  fetchAccounts();
  fetchVendors();
  updateTitle("AP Transactions");
});
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
