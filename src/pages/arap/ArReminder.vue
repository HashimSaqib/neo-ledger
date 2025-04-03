<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm mainbg">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <div class="row q-mt-none q-gutter-md">
          <s-select
            :label="t('Customer')"
            :options="customers"
            v-model="formData.customer"
            class="lightbg col-6 col-md-3"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            emit-value
            map-options
            option-value="id"
            search="label"
          />
          <s-select
            :label="t('Department')"
            :options="departments"
            v-model="formData.department"
            class="lightbg col-6 col-md-3"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            option-label="description"
            option-value="id"
            emit-value
            map-options
            search="description"
          />
          <q-btn :label="t('Search')" color="primary" @click.prevent="search" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Export buttons -->
    <div class="row q-mb-sm hide-print" v-if="results.length > 0">
      <q-btn
        :label="t('Export')"
        @click="downloadExcel"
        class="q-mr-sm"
        color="accent"
      />
      <q-btn
        :label="t('Print')"
        @click="downloadPDF"
        class="q-mr-sm"
        color="info"
      />
    </div>

    <!-- Transactions Table -->
    <q-table
      :rows="results"
      :columns="columns"
      row-key="id"
      flat
      bordered
      class="q-mt-md"
      v-if="results"
      :rows-per-page-options="[0]"
      virtual-scroll-sticky-end
      hide-bottom
    >
      <template v-slot:body-cell-level="props">
        <q-td :props="props">
          <q-select
            v-model="props.row.level"
            :options="[1, 2, 3]"
            dense
            outlined
            size="sm"
            @update:model-value="(val) => updateLevel(props.row, val)"
          />
        </q-td>
      </template>
      <!-- Customer column: rendered as a clickable link using getVcPath -->
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <router-link :to="getVcPath(props.row)" class="text-primary">
            {{ props.row.name }}
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-invoice="props">
        <q-td :props="props">
          <router-link :to="getPath(props.row)" class="text-primary">
            {{ props.row.invnumber }}
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-due="props">
        <q-td :props="props">{{ formatAmount(props.row.due) }}</q-td>
      </template>
      <!-- Add actions column with print button -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            dense
            flat
            color="primary"
            icon="print"
            :label="t('Print')"
            @click="printReminder(props.row)"
            :loading="props.row.printing"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
import { formatAmount, downloadReport, createPDF } from "src/helpers/utils";
const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle("Reminder");
const route = useRoute();
const router = useRouter();

const customers = ref([]);
const departments = ref([]);
const results = ref([]);
const formData = ref({});
const loading = ref(false);
const filtersOpen = ref(true);

const search = async () => {
  loading.value = true;
  try {
    const params = formData.value;
    const response = await api.get(`/arap/reminder/customer`, {
      params,
    });
    filtersOpen.value = false;
    if (!response.data.transactions) {
      Notify.create({
        message: t("No results found"),
        position: "center",
        color: "negative",
      });
      results.value = [];
    } else {
      results.value = response.data.transactions;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/reminder`);
    departments.value = response.data.departments;
    customers.value = response.data.customers;
  } catch (error) {
    console.log(error);
  }
};

onMounted(() => {
  fetchLinks();
});

// Updated function to handle level updates using the new POST route
const updateLevel = async (row, newLevel) => {
  console.log("Updated level for row:", row, "New level:", newLevel);
  try {
    // Send a POST request with the required parameters to update the level.
    await api.post(`/arap/reminder/customer`, {
      client: formData.value.customer, // pass client if needed
      id: row.id,
      level: newLevel,
    });
    // Optionally, update the row locally
    row.level = newLevel;
    Notify.create({
      message: t("Level Updated"),
      position: "center",
      color: "positive",
    });
  } catch (error) {
    console.error("Error updating level:", error);
  }
};

const printReminder = async (row) => {
  row.printing = true;
  try {
    const template = `reminder${row.level}`;
    const response = await api.get(
      `/print_invoice?id=${row.id}&vc=customer&template=${template}&format=tex`,
      { responseType: "blob" }
    );
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template}_${row.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error printing reminder:", error);
  } finally {
    row.printing = false;
  }
};

const columns = [
  {
    name: "name",
    label: t("Customer"),
    field: "name",
    align: "left",
  },
  {
    name: "customernumber",
    label: t("Customer Number"),
    field: "customernumber",
    align: "left",
  },
  {
    name: "level",
    label: t("Level"),
    field: "level",
    align: "left",
    style: "width: 100px",
  },
  {
    name: "invoice",
    label: t("Invoice"),
    field: "invnumber",
    align: "left",
    style: "width: 150px",
  },
  {
    name: "transdate",
    label: t("Date"),
    field: "transdate",
    align: "left",
  },
  {
    name: "duedate",
    label: t("Date Due"),
    field: "duedate",
    align: "left",
  },
  {
    name: "due",
    label: t("Due"),
    field: "due",
    align: "right",
  },
  {
    name: "actions",
    label: t("Actions"),
    field: "actions",
    align: "center",
    style: "width: 120px",
  },
];

const exportColumns = columns.filter((col) => col.name !== "actions");
const downloadExcel = () => {
  downloadReport(results.value, exportColumns);
};

const downloadPDF = () => {
  const params = {};
  const title = "Customer Reminders";
  createPDF(results.value, exportColumns, null, title, params);
};

const createLink = inject("createLink");
const getPath = (row) => {
  let path = "";
  if (row.till) {
    path = createLink("ar.till");
  } else if (row.invoice) {
    path = createLink("customer.invoice");
  } else {
    path = createLink("customer.tranaction");
  }
  const flatParams = formData.value;
  return {
    path,
    query: {
      id: row.id,
      ...flatParams,
      callback: createLink("base") + `/ar/reminder/`,
    },
  };
};

function getVcPath(row) {
  const base = createLink("customer");
  return { path: base, query: { id: row.customer_id } };
}
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

:deep(.q-table tbody td[class*="amount"]),
:deep(.q-table tbody td[class*="paid"]),
:deep(.q-table tbody td[class*="tax"]),
:deep(.q-table tbody td[class*="paymentdiff"]) {
  text-align: right;
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
