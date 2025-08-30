<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm mainbg hide-print">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <!-- Loading indicator shown inside params section when fetching -->
        <div v-if="loading" class="q-mt-xs q-py-xs text-center">
          <q-spinner-dots color="primary" size="30px" />
        </div>

        <!-- Basic Info Section -->
        <div class="row q-mt-xs q-gutter-sm">
          <s-select
            v-model="formData.customer"
            class="lightbg col-6 col-md-3"
            :label="partyListLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            :options="customers"
            search="label"
          />
          <q-input
            v-model="formData.customernumber"
            class="lightbg col-6 col-md-3"
            :label="partyNumberLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
        </div>

        <!-- Document Numbers Section -->
        <div class="row q-mt-xs q-gutter-sm">
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
            v-model="formData.quonumber"
            class="lightbg"
            :label="t('Quotation Number')"
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
        <div class="row q-mt-xs q-gutter-sm">
          <q-input
            v-model="formData.warehouse"
            class="lightbg col-4"
            :label="t('Warehouse')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <q-input
            v-model="formData.department"
            class="lightbg col-4"
            :label="t('Department')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
        </div>

        <!-- Description Fields Section -->
        <div class="row q-mt-xs q-gutter-sm">
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
        </div>

        <!-- Date Range Section -->
        <div class="row q-mt-xs q-gutter-sm">
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

        <div class="row q-mt-sm q-gutter-sm">
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
        </div>

        <div class="q-py-sm">
          <draggable v-model="baseColumns" item-key="name" class="drag-area">
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
        <div class="row q-mt-sm q-gutter-x-sm">
          <q-btn
            type="submit"
            :label="t('Search')"
            color="primary"
            @click="search"
          />
          <q-btn :label="t('Clear')" @click="clearForm" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Results Table -->
    <div v-if="results.length > 0">
      <div class="row q-mb-sm hide-print">
        <q-btn
          :label="t('Export XL')"
          @click="downloadExcel"
          class="q-mr-sm"
          color="accent"
        />
        <q-btn
          :label="t('Export PDF')"
          @click="downloadPDF"
          class="q-mr-sm"
          color="info"
        />
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
        <!-- Order/Quotation Number Column -->
        <template v-slot:body-cell-ordnumber="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.ordnumber }}
            </router-link>
          </q-td>
        </template>

        <template v-slot:body-cell-quonumber="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.quonumber }}
            </router-link>
          </q-td>
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

        <!-- Net Amount Column -->
        <template v-slot:body-cell-netamount="props">
          <q-td :props="props">{{ formatAmount(props.row.netamount) }}</q-td>
        </template>

        <!-- Totals Row -->
        <template v-slot:bottom-row>
          <q-tr class="totals-row">
            <q-td
              v-for="col in columns"
              :key="col.name"
              :style="{ textAlign: col.align || 'left' }"
            >
              <template v-if="['amount', 'netamount'].includes(col.name)">
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

// Route parameters
const type = computed(() => route.params.type); // 'order' or 'quotation'
const vc = computed(() => route.params.vc); // 'customer' or 'vendor'

// Computed labels for party selection and number
const partyListLabel = computed(() =>
  vc.value === "customer" ? t("Customers") : t("Vendors")
);
const partyNumberLabel = computed(() =>
  vc.value === "customer" ? t("Customer Number") : t("Vendor Number")
);

// Form data (with defaults)
const formData = ref({
  customer: "",
  ordnumber: "",
  quonumber: "",
  description: "",
  ponumber: "",
  memo: "",
  notes: "",
  transdatefrom: "",
  transdateto: "",
  warehouse: "",
  shipvia: "",
  shippingpoint: "",
  waybill: "",
  open: "Y",
  closed: "Y",
});

const filtersOpen = route.query.search == 1 ? ref(false) : ref(true);
const results = ref([]);
const totals = ref({});
const loading = ref(false);

const baseColumns = ref([
  { name: "id", label: "ID", field: "id", default: false },
  {
    name: "ordnumber",
    label: "Order Number",
    field: "ordnumber",
    default: type.value === "order",
    align: "left",
  },
  {
    name: "quonumber",
    label: "Quotation Number",
    field: "quonumber",
    default: type.value === "quotation",
    align: "left",
  },
  {
    name: "description",
    label: "Description",
    field: "description",
    default: true,
    sortable: true,
    align: "left",
  },
  {
    name: "files",
    label: "Files",
    field: "files",
    default: true,
    sortable: true,
    align: "left",
  },
  {
    name: "ponumber",
    label: "PO Number",
    field: "ponumber",
    default: false,
    align: "left",
  },
  {
    name: "transdate",
    label: "Transaction Date",
    field: "transdate",
    default: true,
    align: "left",
  },
  {
    name: "reqdate",
    label: "Required Date",
    field: "reqdate",
    default: false,
    align: "left",
  },
  {
    name: "name",
    label: partyListLabel.value.slice(0, -1), // singular version e.g. "Customer" or "Vendor"
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
    name: "shipvia",
    label: "Ship Via",
    field: "shipvia",
    default: false,
    align: "left",
  },
  {
    name: "shippingpoint",
    label: "Shipping Point",
    field: "shippingpoint",
    default: false,
    align: "left",
  },
  {
    name: "waybill",
    label: "Waybill",
    field: "waybill",
    default: false,
    align: "left",
  },
  {
    name: "warehouse",
    label: "Warehouse",
    field: "warehouse",
    default: false,
    align: "left",
  },
  {
    name: "netamount",
    label: "Net Amount",
    field: "netamount",
    default: false,
    align: "right",
  },
  {
    name: "amount",
    label: "Total Amount",
    field: "amount",
    default: false,
    align: "right",
  },
  {
    name: "backorder",
    label: "Back Order",
    field: "backorder",
    default: false,
    align: "left",
  },
  {
    name: "curr",
    label: "Currency",
    field: "curr",
    default: false,
    align: "left",
  },
  {
    name: "exchangerate",
    label: "Exchange Rate",
    field: "exchangerate",
    default: false,
    align: "right",
  },
  {
    name: "closed",
    label: "Closed",
    field: "closed",
    default: false,
    align: "left",
  },
  {
    name: "notes",
    label: "Notes",
    field: "notes",
    default: false,
    align: "left",
  },
  {
    name: "memo",
    label: "Memo",
    field: "memo",
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

// Process filters from localStorage with type-specific keys
function processFilters() {
  const storageKey = `${vc.value}_${type.value}_columns`;
  const savedFilters = LocalStorage.getItem(storageKey);

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
        baseColumns.value = parsedFilters.order
          .map((name) => baseColumns.value.find((col) => col.name === name))
          .filter((col) => col !== undefined);
      } else {
        throw new Error("Invalid filter structure in storage.");
      }
    } catch (error) {
      console.error("Error parsing saved filters:", error);
      LocalStorage.remove(storageKey);
    }
  } else {
    const defaultFilters = {
      columns: baseColumns.value.reduce((acc, column) => {
        acc[column.name] = column.default;
        return acc;
      }, {}),
      order: baseColumns.value.map((col) => col.name),
    };

    LocalStorage.set(storageKey, defaultFilters, {
      expires: 30,
    });
    selectedColumns.value = defaultFilters.columns;
  }
}

watch(
  [selectedColumns, baseColumns],
  () => {
    const storageKey = `${vc.value}_${type.value}_columns`;
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((col) => col.name),
    };
    try {
      LocalStorage.set(storageKey, filters, {
        expires: 30,
      });
    } catch (error) {
      console.error("Error saving filters to storage:", error);
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
    const requiredKeys = ["id"];
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

const customers = ref([]);
const fetchCustomers = async () => {
  try {
    // Use dynamic endpoint: /arap/list/customer or /arap/list/vendor
    const response = await api.get(`/arap/list/${vc.value}`);
    customers.value = response.data;
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || "Error fetching " + vc.value,
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
 */
const loadParams = () => {
  const query = route.query;

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
    "ordnumber",
    "quonumber",
    "ponumber",
    "shipvia",
    "shippingpoint",
    "waybill",
    "warehouse",
    "description",
    "notes",
    "memo",
    "transdatefrom",
    "transdateto",
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
    // Use the new OE endpoint: /oe/:type/:vc
    const response = await api.get(`/oe/${type.value}/${vc.value}`, {
      params,
    });
    filtersOpen.value = false;
    results.value = response.data.orders;
    totals.value = response.data.totals;
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || "Error performing search",
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
    } else if (key === "closed") {
      formData.value[key] = "Y";
    } else {
      formData.value[key] = "";
    }
  });
};

const getPath = (row) => {
  // Create appropriate path based on type and vc
  let path = "";
  if (type.value === "order") {
    path =
      vc.value === "customer"
        ? createLink("customer.order")
        : createLink("vendor.order");
  } else {
    path =
      vc.value === "customer"
        ? createLink("customer.quotation")
        : createLink("vendor.quotation");
  }

  const flatParams = flattenParams(formData.value);
  return {
    path,
    query: {
      id: row.id,
      ...flatParams,
      callback: createLink("base") + `/oe/${type.value}/${vc.value}/`,
    },
  };
};

const downloadExcel = () => {
  downloadReport(filteredResults.value, columns.value, totals.value);
};

const title = inject("title");
const downloadPDF = () => {
  const params = {};
  const reportTitle = `${vc.value === "customer" ? "Customer" : "Vendor"} ${
    type.value === "order" ? "Orders" : "Quotations"
  }`;
  createPDF(
    filteredResults.value,
    columns.value,
    totals.value,
    reportTitle,
    params
  );
};

onMounted(async () => {
  processFilters();
  await fetchCustomers();

  // Update page title based on type and vc
  const pageTitle = computed(() => {
    if (type.value === "order") {
      return vc.value === "customer"
        ? "Sales Order Reports"
        : "Purchase Order Reports";
    } else {
      return vc.value === "customer" ? "Quotation Reports" : "RFQ Reports";
    }
  });

  updateTitle(pageTitle.value);
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
  color: var(--q-mainbg);
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
