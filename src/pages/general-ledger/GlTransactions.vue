<template>
  <q-page class="lightbg q-pa-sm relative-position">
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
          <q-btn
            type="submit"
            :label="t('Search')"
            color="primary"
            class="q-mt-md"
            @click="search"
          />
        </div>
      </q-expansion-item>
    </q-form>

    <div v-if="results.length > 0">
      <q-table
        class="q-mt-md"
        :rows="filteredResults"
        row-key="id"
        :columns="columns"
        flat
        bordered
        dense
        virtual-scroll
        :rows-per-page-options="[0]"
      >
        <template v-slot:body-cell-reference="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.reference }}
            </router-link>
          </q-td>
        </template>
        <template v-slot:body-cell-description="props">
          <q-td :props="props">
            <div class="wrapped-description">
              {{ props.row.description }}
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-memo="props">
          <q-td :props="props">
            <div class="wrapped-description">
              {{ props.row.memo }}
            </div>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { Cookies } from "quasar";
import draggable from "vuedraggable";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const formData = ref({});
const filtersOpen = ref(true);
const results = ref([]);

const baseColumns = ref([
  {
    name: "id",
    align: "left",
    label: "ID",
    field: "id",
    sortable: true,
    slot: true,
    default: true,
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
      const parsedFilters = savedFilters;

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

        console.log("Parsed and applied filters:", parsedFilters);
      } else {
        throw new Error("Invalid structure in parsed filters");
      }
    } catch (error) {
      console.error("Error parsing saved filters:", error);
      Cookies.remove("gl_list_filters");
    }
  } else {
    // Initialize default filters
    const defaultFilters = {
      columns: baseColumns.value.reduce((acc, column) => {
        acc[column.name] = column.default;
        return acc;
      }, {}),
      order: baseColumns.value.map((col) => col.name),
    };

    // Set the default filters to cookies
    Cookies.set("gl_list_filters", JSON.stringify(defaultFilters), {
      expires: 30,
    });

    selectedColumns.value = defaultFilters.columns;
    baseColumns.value = defaultFilters.order
      .map((name) => baseColumns.value.find((col) => col.name === name))
      .filter((col) => col !== undefined);

    console.log("Set default filters:", defaultFilters);
  }
}

onMounted(() => {
  processFilters();
});

// Watch selectedColumns and baseColumns and save changes to cookies
watch(
  [selectedColumns, baseColumns],
  () => {
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((col) => col.name),
    };

    try {
      Cookies.set("gl_list_filters", JSON.stringify(filters), {
        expires: 30,
      });
    } catch (error) {
      console.error("Error saving filters to cookie:", error);
    }
  },
  { deep: true }
);

// Filtered columns based on selected checkboxes
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
    const requiredKeys = ["id", "type", "till", "invoice"];

    // Always include required keys
    requiredKeys.forEach((key) => {
      filtered[key] = result[key];
    });

    // Include selected columns
    Object.keys(selectedColumns.value).forEach((key) => {
      if (selectedColumns.value[key]) {
        filtered[key] = result[key];
      }
    });

    return filtered;
  });
});

const search = async () => {
  try {
    const response = await api.get("/gl/transactions/lines", {
      params: formData.value,
    });
    filtersOpen.value = false;
    results.value = response.data;
    console.log(results.value);
  } catch (error) {
    console.error(error);
  }
};

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
  text-align: right;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}

:deep(.totals-row td:nth-child(3)) {
  text-align: left !important;
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
