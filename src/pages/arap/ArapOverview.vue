<template>
  <q-page class="q-pa-md q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm container hide-print">
      <q-expansion-item
        :label="t('Filters')"
        header-class="container-bg"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <div class="flex-container q-mt-md">
          <q-input
            v-model="formData.transdatefrom"
            type="date"
            :label="t('Date From')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg"
            outlined
            dense
          />
          <q-input
            v-model="formData.transdateto"
            type="date"
            :label="t('Date To')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg"
            outlined
            dense
          />
          <s-select
            v-model="formData.vc"
            :label="vcLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            :options="vcList"
            search="label"
            option-label="label"
          />
          <q-input
            v-model="formData.invnumber"
            :label="t('Invoice Number')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg"
            outlined
            dense
          />
          <q-input
            v-model="formData.description"
            :label="t('Description')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-5"
            outlined
            dense
          />
        </div>

        <div class="row q-mt-sm q-gutter-x-sm justify-end">
          <s-button type="clear" @click="clearForm" />
          <s-button type="search" @click="fetchOverview" />
        </div>
      </q-expansion-item>
    </q-form>

    <div v-if="loading" class="q-mt-lg text-center">
      <q-spinner-dots color="primary" size="50px" />
    </div>

    <div v-else-if="hasData">
      <div class="view-tabs q-mt-md">
        <button
          class="view-tab"
          :class="{ 'view-tab--active': activeView === 'overview' }"
          @click="activeView = 'overview'"
        >
          <q-icon name="dashboard" size="18px" />
          <span>{{ t("Overview") }}</span>
        </button>
        <button
          class="view-tab"
          :class="{ 'view-tab--active': activeView === 'graph' }"
          @click="switchToGraph"
        >
          <q-icon name="show_chart" size="18px" />
          <span>{{ t("Graph") }}</span>
        </button>
      </div>

      <div v-show="activeView === 'overview'">
        <div class="summary-grid q-mt-md">
          <div
            v-for="(card, status) in summaryCards"
            :key="status"
            class="summary-card"
            :class="[
              `summary-card--${status}`,
              { 'summary-card--active': activeStatus === status },
            ]"
            @click="setActiveStatus(status)"
          >
            <div class="summary-card__header">
              <span class="summary-card__title">{{ card.title }}</span>
              <q-icon
                :name="card.icon"
                :class="`summary-card__icon--${status}`"
                size="18px"
              />
            </div>
            <div class="summary-card__amount">
              {{ formatAmount(card.amount) }}
            </div>
            <div class="summary-card__count">
              {{ card.count }}
              {{ card.count === 1 ? t("transaction") : t("transactions") }}
            </div>
          </div>
        </div>
      </div>

      <div v-show="activeView === 'graph'" class="graph-view q-mt-md">
        <div class="graph-card">
          <div class="graph-card__header">
            <div class="graph-card__title">
              <q-icon name="trending_up" size="24px" class="q-mr-sm" />
              {{ t("Transaction Trends") }}
            </div>
            <div class="graph-card__controls">
              <div class="period-toggle">
                <button
                  v-for="period in periodOptions"
                  :key="period.value"
                  class="period-btn"
                  :class="{
                    'period-btn--active': chartPeriod === period.value,
                  }"
                  @click="chartPeriod = period.value"
                >
                  {{ period.label }}
                </button>
              </div>
            </div>
          </div>
          <div class="graph-card__legend">
            <div
              v-for="(color, status) in statusColors"
              :key="status"
              class="legend-item"
            >
              <span
                class="legend-dot"
                :style="{ background: color.line }"
              ></span>
              <span class="legend-label">{{ getStatusLabel(status) }}</span>
            </div>
          </div>
          <div class="graph-card__chart">
            <canvas ref="mainChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <div class="container q-mt-md">
        <div class="row items-center justify-end q-mb-md">
          <div class="row q-gutter-x-sm hide-print">
            <s-button type="export-xl" @click="downloadExcel" />
            <s-button type="export-pdf" @click="downloadPDF" />
            <router-link :to="newInvoiceLink">
              <s-button type="primary" :label="newInvoiceLabel" icon="add" />
            </router-link>
          </div>
        </div>

        <q-table
          v-if="activeTransactions.length > 0"
          :rows="activeTransactions"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          virtual-scroll
          :virtual-scroll-slice-size="30"
          :virtual-scroll-item-size="48"
          :rows-per-page-options="[0]"
          hide-bottom
        >
          <template v-slot:body-cell-invnum="props">
            <q-td :props="props">
              <span class="wrapped-cell">
                <router-link
                  :to="getInvoiceLink(props.row)"
                  class="text-primary"
                >
                  {{ props.row.invnum }}
                </router-link>
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-vc_name="props">
            <q-td :props="props">
              <router-link :to="getVcLink(props.row)" class="text-primary">
                {{ props.row.vc_name }}
              </router-link>
            </q-td>
          </template>

          <template v-slot:body-cell-totalamount="props">
            <q-td :props="props" class="text-right">
              {{ formatAmount(props.row.totalamount) }}
            </q-td>
          </template>

          <template v-slot:body-cell-amountpaid="props">
            <q-td :props="props" class="text-right">
              {{ formatAmount(props.row.amountpaid) }}
            </q-td>
          </template>

          <template v-slot:body-cell-outstanding="props">
            <q-td :props="props" class="text-right">
              {{ formatAmount(props.row.totalamount - props.row.amountpaid) }}
            </q-td>
          </template>

          <template v-slot:body-cell-description="props">
            <q-td :props="props">
              <span class="wrapped-cell">{{ props.row.description }}</span>
            </q-td>
          </template>

          <template v-slot:body-cell-duedate="props">
            <q-td
              :props="props"
              :class="{ 'text-negative': isOverdue(props.row) }"
            >
              {{ props.row.duedate }}
            </q-td>
          </template>
        </q-table>

        <div v-else class="text-center q-py-lg mutedtext">
          {{ t("No transactions found") }}
        </div>
      </div>
    </div>

    <div v-else-if="!loading && searched" class="text-center q-mt-lg mutedtext">
      {{ t("No data available. Try adjusting your filters.") }}
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { Notify, getCssVar, useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { Chart, registerables } from "chart.js";
import {
  formatAmount,
  downloadReport,
  createPDF as createPDFUtil,
} from "src/helpers/utils";

Chart.register(...registerables);

const { t } = useI18n();
const route = useRoute();
const updateTitle = inject("updateTitle");
const createLink = inject("createLink");

const vcType = ref(route.params.type || "customer");
const isCustomer = computed(() => vcType.value === "customer");

const vcLabel = computed(() =>
  isCustomer.value ? t("Customer") : t("Vendor")
);
const pageTitle = computed(() =>
  isCustomer.value
    ? t("Accounts Receivable Overview")
    : t("Accounts Payable Overview")
);

const formData = ref({
  transdatefrom: "",
  transdateto: "",
  vc: null,
  invnumber: "",
  description: "",
});

const filtersOpen = ref(false);
const loading = ref(false);
const searched = ref(false);
const vcList = ref([]);
const overviewData = ref(null);
const activeStatus = ref("open");

const $q = useQuasar();
const activeView = ref("overview");
const mainChartCanvas = ref(null);
let mainChartInstance = null;
const chartPeriod = ref("monthly");

const periodOptions = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];

const switchToGraph = async () => {
  activeView.value = "graph";
  await nextTick();
  initMainChart();
};

const hasData = computed(() => {
  return (
    overviewData.value &&
    Object.keys(overviewData.value.transactions || {}).length > 0
  );
});

const summaryCards = computed(() => {
  if (!overviewData.value?.transactions) return {};

  const tx = overviewData.value.transactions;
  return {
    open: {
      title: t("Open"),
      amount: tx.open?.amount || 0,
      count: tx.open?.no || 0,
      icon: "schedule",
    },
    overdue: {
      title: t("Overdue"),
      amount: tx.overdue?.amount || 0,
      count: tx.overdue?.no || 0,
      icon: "warning",
    },
    closed: {
      title: t("Closed"),
      amount: tx.closed?.amount || 0,
      count: tx.closed?.no || 0,
      icon: "check_circle",
    },
    overpaid: {
      title: t("Overpaid"),
      amount: tx.overpaid?.amount || 0,
      count: tx.overpaid?.no || 0,
      icon: "account_balance_wallet",
    },
  };
});

const allTransactions = computed(() => {
  if (!overviewData.value?.transactions) return [];
  const tx = overviewData.value.transactions;
  return [
    ...(tx.open?.transactions || []),
    ...(tx.overdue?.transactions || []),
    ...(tx.closed?.transactions || []),
    ...(tx.overpaid?.transactions || []),
  ];
});

const statusColors = {
  open: { line: "#3b82f6", fill: "rgba(59, 130, 246, 0.15)" },
  overdue: { line: "#ef4444", fill: "rgba(239, 68, 68, 0.15)" },
  closed: { line: "#22c55e", fill: "rgba(34, 197, 94, 0.15)" },
  overpaid: { line: "#f97316", fill: "rgba(249, 115, 22, 0.15)" },
};

const mainChartData = computed(() => {
  const transactions = allTransactions.value;
  if (!transactions.length) return { labels: [], datasets: [] };

  const groupByPeriod = (date) => {
    const d = new Date(date);
    if (chartPeriod.value === "daily") {
      return date;
    } else if (chartPeriod.value === "monthly") {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (chartPeriod.value === "quarterly") {
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${quarter}`;
    } else {
      return `${d.getFullYear()}`;
    }
  };

  const aggregated = {};
  transactions.forEach((tx) => {
    const period = groupByPeriod(tx.transdate);
    if (!aggregated[period]) {
      aggregated[period] = { open: 0, overdue: 0, closed: 0, overpaid: 0 };
    }
    aggregated[period][tx.status] += Number(tx.totalamount) || 0;
  });

  const sortedPeriods = Object.keys(aggregated).sort((a, b) => {
    if (chartPeriod.value === "quarterly") {
      const [yearA, qA] = a.split("-Q");
      const [yearB, qB] = b.split("-Q");
      return yearA - yearB || qA - qB;
    }
    return a.localeCompare(b);
  });

  const formatLabel = (period) => {
    if (chartPeriod.value === "daily") {
      const d = new Date(period);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } else if (chartPeriod.value === "monthly") {
      const [year, month] = period.split("-");
      const d = new Date(year, parseInt(month) - 1);
      return d.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
    } else if (chartPeriod.value === "quarterly") {
      return period;
    } else {
      return period;
    }
  };

  return {
    labels: sortedPeriods.map(formatLabel),
    datasets: [
      {
        label: t("Open"),
        data: sortedPeriods.map((p) => aggregated[p].open),
        backgroundColor: statusColors.open.fill,
        borderColor: statusColors.open.line,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: statusColors.open.line,
      },
      {
        label: t("Overdue"),
        data: sortedPeriods.map((p) => aggregated[p].overdue),
        backgroundColor: statusColors.overdue.fill,
        borderColor: statusColors.overdue.line,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: statusColors.overdue.line,
      },
      {
        label: t("Closed"),
        data: sortedPeriods.map((p) => aggregated[p].closed),
        backgroundColor: statusColors.closed.fill,
        borderColor: statusColors.closed.line,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: statusColors.closed.line,
      },
      {
        label: t("Overpaid"),
        data: sortedPeriods.map((p) => aggregated[p].overpaid),
        backgroundColor: statusColors.overpaid.fill,
        borderColor: statusColors.overpaid.line,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: statusColors.overpaid.line,
      },
    ],
  };
});

const initMainChart = () => {
  if (!mainChartCanvas.value) return;

  if (mainChartInstance) {
    mainChartInstance.destroy();
  }

  const ctx = mainChartCanvas.value.getContext("2d");
  mainChartInstance = new Chart(ctx, {
    type: "line",
    data: mainChartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { size: 13, weight: "600" },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${formatAmount(context.raw)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: getCssVar("border"),
            drawBorder: false,
          },
          ticks: {
            color: getCssVar("mutedtext"),
            font: { size: 11 },
            callback: (value) => formatAmount(value),
            padding: 8,
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            color: getCssVar("mutedtext"),
            font: { size: 11 },
            maxRotation: 45,
            minRotation: 0,
            padding: 8,
          },
        },
      },
    },
  });
};

const getStatusLabel = (status) => {
  const labels = {
    open: t("Open"),
    overdue: t("Overdue"),
    closed: t("Closed"),
    overpaid: t("Overpaid"),
  };
  return labels[status] || status;
};

watch(chartPeriod, async () => {
  if (activeView.value === "graph") {
    await nextTick();
    initMainChart();
  }
});

watch(
  () => $q.dark.isActive,
  async () => {
    await nextTick();
    if (activeView.value === "graph") {
      initMainChart();
    }
  }
);

const activeTransactions = computed(() => {
  if (!overviewData.value?.transactions) return [];
  return (
    overviewData.value.transactions[activeStatus.value]?.transactions || []
  );
});

const activeStatusTitle = computed(() => {
  const titles = {
    open: t("Open Transactions"),
    overdue: t("Overdue Transactions"),
    closed: t("Closed Transactions"),
    overpaid: t("Overpaid Transactions"),
  };
  return titles[activeStatus.value] || t("Transactions");
});

const newInvoiceLink = computed(() => {
  return isCustomer.value
    ? createLink("customer.invoice")
    : createLink("vendor.transaction");
});

const newInvoiceLabel = computed(() => {
  return isCustomer.value ? t("Customer Invoice") : t("Vendor Transaction");
});

const columns = computed(() => [
  {
    name: "invnum",
    label: t("Invoice #"),
    field: "invnum",
    align: "left",
    sortable: true,
    style: "max-width: 150px",
  },
  {
    name: "vc_name",
    label: vcLabel.value,
    field: "vc_name",
    align: "left",
    sortable: true,
    style: "min-width: 150px",
  },
  {
    name: "transdate",
    label: t("Date"),
    field: "transdate",
    align: "left",
    sortable: true,
  },
  {
    name: "duedate",
    label: t("Due Date"),
    field: "duedate",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
    style: "max-width: 300px",
  },
  {
    name: "totalamount",
    label: t("Amount"),
    field: "totalamount",
    align: "right",
    sortable: true,
  },
  {
    name: "amountpaid",
    label: t("Paid"),
    field: "amountpaid",
    align: "right",
    sortable: true,
  },
  {
    name: "outstanding",
    label: t("Outstanding"),
    field: "outstanding",
    align: "right",
  },
]);

const setActiveStatus = (status) => {
  activeStatus.value = status;
};

const getStatusColor = (status) => {
  const colors = {
    open: "blue",
    overdue: "red",
    closed: "green",
    overpaid: "orange",
  };
  return colors[status] || "grey";
};

const isOverdue = (row) => {
  if (!row.duedate) return false;
  const today = new Date().toISOString().split("T")[0];
  return row.duedate < today && row.status !== "closed";
};

const getInvoiceLink = (row) => {
  const path = row.invoice
    ? createLink(isCustomer.value ? "customer.invoice" : "vendor.invoice")
    : createLink(
        isCustomer.value ? "customer.transaction" : "vendor.transaction"
      );
  return { path, query: { id: row.id } };
};

const getVcLink = (row) => {
  const path = createLink(vcType.value);
  return { path, query: { id: row.vc_id } };
};

const fetchVcList = async () => {
  try {
    const response = await api.get(`/arap/list/${vcType.value}`);
    vcList.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const fetchOverview = async () => {
  loading.value = true;
  searched.value = true;

  try {
    const params = {};
    if (formData.value.transdatefrom)
      params.transdatefrom = formData.value.transdatefrom;
    if (formData.value.transdateto)
      params.transdateto = formData.value.transdateto;
    if (formData.value.vc?.id)
      params[`${vcType.value}_id`] = formData.value.vc.id;
    if (formData.value.invnumber) params.invnumber = formData.value.invnumber;
    if (formData.value.description)
      params.description = formData.value.description;

    const response = await api.get(`/arap/overview/${vcType.value}`, {
      params,
    });
    overviewData.value = response.data;
    filtersOpen.value = false;

    // set active status to first one that has transactions
    const statuses = ["open", "overdue", "closed", "overpaid"];
    for (const status of statuses) {
      if (response.data.transactions[status]?.no > 0) {
        activeStatus.value = status;
        break;
      }
    }
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.error || t("Error fetching overview"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const clearForm = () => {
  formData.value = {
    transdatefrom: "",
    transdateto: "",
    vc: null,
    invnumber: "",
    description: "",
  };
};

const downloadExcel = () => {
  const rows = activeTransactions.value.map((row) => ({
    ...row,
    outstanding: row.totalamount - row.amountpaid,
  }));
  downloadReport(rows, columns.value, {});
};

const title = inject("title");
const downloadPDF = () => {
  const rows = activeTransactions.value.map((row) => ({
    ...row,
    outstanding: row.totalamount - row.amountpaid,
  }));
  createPDFUtil(rows, columns.value, {}, title.value, {});
};

onMounted(async () => {
  updateTitle(pageTitle.value);
  await fetchVcList();
  fetchOverview();
});
</script>

<style lang="scss" scoped>
.view-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
  background: var(--q-lightbg);
  border-radius: 10px;
  width: fit-content;
  border: 1px solid var(--q-border);
}

.view-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--q-mutedtext);
  transition: all 0.2s ease;

  &:hover {
    color: var(--q-maintext);
    background: var(--q-highlight);
  }

  &--active {
    background: var(--q-mainbg);
    color: var(--q-maintext);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.graph-view {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.graph-card {
  background: var(--q-lightbg);
  border: 1px solid var(--q-border);
  border-radius: 16px;
  padding: 1.5rem;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  &__title {
    display: flex;
    align-items: center;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--q-maintext);
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__legend {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--q-border);
  }

  &__chart {
    height: 350px;
    position: relative;
  }
}

.period-toggle {
  display: flex;
  background: var(--q-mainbg);
  border-radius: 8px;
  padding: 0.25rem;
  border: 1px solid var(--q-border);
}

.period-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--q-mutedtext);
  transition: all 0.15s ease;

  &:hover {
    color: var(--q-maintext);
  }

  &--active {
    background: #3b82f6;
    color: white;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-label {
  font-size: 0.8rem;
  color: var(--q-mutedtext);
  font-weight: 500;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

@media (max-width: 1024px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  background: var(--q-lightbg);
  border: 1px solid var(--q-border);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &--active {
    border-width: 2px;
  }

  &--open.summary-card--active {
    border-color: #3b82f6;
  }

  &--overdue.summary-card--active {
    border-color: #ef4444;
  }

  &--closed.summary-card--active {
    border-color: #22c55e;
  }

  &--overpaid.summary-card--active {
    border-color: #f97316;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  &__title {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--q-mutedtext);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__icon--open {
    color: #3b82f6;
  }
  &__icon--overdue {
    color: #ef4444;
  }
  &__icon--closed {
    color: #22c55e;
  }
  &__icon--overpaid {
    color: #f97316;
  }

  &__amount {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--q-maintext);
    line-height: 1.2;
  }

  &__count {
    font-size: 0.75rem;
    color: var(--q-mutedtext);
    margin-top: 0.25rem;
  }
}

.table-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--q-maintext);
}

:deep(.q-table__container) {
  height: calc(100vh - 340px);
  position: relative;
}

:deep(.q-table thead) {
  position: sticky;
  z-index: 2;
  top: 0;
  background-color: var(--q-maintext);
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
  font-weight: 600;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}

:deep(.q-table tbody tr:hover) {
  background-color: var(--q-highlight);
}

:deep(.q-virtual-scroll__content) {
  margin-bottom: 0 !important;
}

:deep(.q-table td) {
  padding: 4px 8px;
}

:deep(.q-badge) {
  font-weight: 500;
  padding: 0.25rem 0.5rem;
}

.wrapped-cell {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: block;
}
</style>
