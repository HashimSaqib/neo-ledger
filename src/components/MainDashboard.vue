<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="selectedRange"
                  :options="dateRangeOptions"
                  :label="t('Date Range')"
                  outlined
                  dense
                  @update:model-value="handleRangeChange"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="consolidateOption"
                  :options="consolidateOptions"
                  :label="t('View By')"
                  outlined
                  dense
                  @update:model-value="fetchData"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
        <div class="row q-col-gutter-md">
          <div class="row">
            <dashboard-card
              :title="t('Monthly Expenses')"
              :value="totalExpenses"
              :subtitle="t('Total expenses for the selected period')"
              chart-id="expenses-chart"
              :chart-data="expensesChartData"
              :chart-options="chartOptions"
              :loading="loading"
              :currency="selectedCurrency"
              @chart-mounted="updateExpensesChartInstance"
            />
          </div>
          <div class="row">
            <dashboard-card
              :title="t('Monthly Sales')"
              :value="totalSales"
              :subtitle="t('Total sales for the selected period')"
              chart-id="sales-chart"
              :chart-data="salesChartData"
              :chart-options="chartOptions"
              :loading="loading"
              :currency="selectedCurrency"
              @chart-mounted="updateSalesChartInstance"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { date, useQuasar, getCssVar } from "quasar";
import { api } from "src/boot/axios";
import DashboardCard from "./DashboardCard.vue";
import { formatAmount } from "src/helpers/utils";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// Chart instances reference
const expensesChartInstance = ref(null);
const salesChartInstance = ref(null);

// Quasar instance
const $q = useQuasar();

// State variables
const loading = ref(false);
const metricsData = ref([]);
const currencies = ref([]);
const selectedCurrency = ref(null);

// Chart options ref to make it reactive
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => {
          return formatAmount(value, selectedCurrency.value?.curr);
        },
        color: getCssVar("lighttext"),
        font: {
          size: 12,
        },
      },
    },
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        color: getCssVar("mutedtext"),
        font: {
          size: 12,
        },
      },
    },
  },
});

// Date range and consolidation options
const selectedRange = ref(null);
const consolidateOption = ref({ label: "Monthly", value: "monthly" });

const dateRangeOptions = [
  { label: t("Last 7 Days"), value: "7days" },
  { label: t("Last 14 Days"), value: "14days" },
  { label: t("Last Month"), value: "1month" },
  { label: t("Last 90 Days"), value: "90days" },
  { label: t("Last Year"), value: "1year" },
];

const consolidateOptions = [
  { label: t("Daily"), value: "daily" },
  { label: t("Monthly"), value: "monthly" },
];

// Computed properties for filtered data
const expenses = computed(() =>
  metricsData.value.filter((item) => item.type === "expenses")
);

const sales = computed(() =>
  metricsData.value.filter((item) => item.type === "sales")
);

// Calculate date range based on selected option
const getDateRange = (option) => {
  const end = new Date();
  let start = new Date();

  switch (option) {
    case "7days":
      start.setDate(end.getDate() - 7);
      break;
    case "14days":
      start.setDate(end.getDate() - 14);
      break;
    case "1month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "90days":
      start.setDate(end.getDate() - 90);
      break;
    case "1year":
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setFullYear(end.getFullYear() - 1);
  }

  return {
    start: date.formatDate(start, "YYYY-MM-DD"),
    end: date.formatDate(end, "YYYY-MM-DD"),
  };
};

// Methods to update chart instances
const updateExpensesChartInstance = (instance) => {
  expensesChartInstance.value = instance;
};

const updateSalesChartInstance = (instance) => {
  salesChartInstance.value = instance;
};

// Handle date range change
const handleRangeChange = () => {
  fetchData();
};

// Watch for dark mode changes
watch(
  () => $q.dark.isActive,
  async () => {
    // Update chart options with new theme colors
    chartOptions.value = {
      ...chartOptions.value,
      scales: {
        y: {
          ...chartOptions.value.scales.y,
          ticks: {
            ...chartOptions.value.scales.y.ticks,
            color: getCssVar("lighttext"),
          },
          grid: {
            color: getCssVar("mutedtext"),
            display: false,
          },
        },
        x: {
          ...chartOptions.value.scales.x,
          ticks: {
            ...chartOptions.value.scales.x.ticks,
            color: getCssVar("lighttext"),
          },
          grid: {
            color: getCssVar("mutedtext"),
            display: false,
          },
        },
      },
    };

    // Force charts to update with new theme colors
    if (expensesChartData.value?.data?.datasets?.[0]) {
      expensesChartData.value.data.datasets[0].backgroundColor =
        getCssVar("lighttext");
      expensesChartData.value.data.datasets[0].borderColor = "red";
      expensesChartData.value.data.datasets[0].pointBackgroundColor = "red";
    }

    if (salesChartData.value?.data?.datasets?.[0]) {
      salesChartData.value.data.datasets[0].backgroundColor =
        getCssVar("lighttext");
      salesChartData.value.data.datasets[0].borderColor = "green";
      salesChartData.value.data.datasets[0].pointBackgroundColor = "green";
    }

    await nextTick();

    // Update both chart instances
    expensesChartInstance.value?.update();
    salesChartInstance.value?.update();
  },
  { immediate: true }
);

// Computed totals
const totalExpenses = computed(() => {
  return expenses.value.reduce((sum, item) => sum + item.amount, 0);
});

const totalSales = computed(() => {
  return sales.value.reduce((sum, item) => sum + item.amount, 0);
});

// Create chart data function
const createChartData = (data, type) => ({
  type: "line",
  data: {
    labels: data.map((d) => {
      const format =
        consolidateOption.value.value === "daily" ? "DD MMM YYYY" : "MMM YYYY";
      return date.formatDate(d.period, format);
    }),
    datasets: [
      {
        label: "Amount",
        data: data.map((d) => d.amount),
        tension: 0.4,
        fill: false,
        backgroundColor: getCssVar("lighttext"),
        borderColor: type === "sales" ? "green" : "red",
        pointBackgroundColor: type === "sales" ? "green" : "red",
        borderWidth: 2,
      },
    ],
  },
});

// Computed chart data
const expensesChartData = computed(() =>
  createChartData(expenses.value, "expenses")
);
const salesChartData = computed(() => createChartData(sales.value, "sales"));

// Fetch currencies
const fetchCurrencies = async () => {
  try {
    const response = await api.get("/system/currencies");
    currencies.value = response.data;
    selectedCurrency.value = currencies.value.find((curr) => curr.rn === 1);
  } catch (error) {
    console.error("Error fetching currencies:", error);
    $q.notify({
      type: "negative",
      message: "Failed to fetch currencies",
    });
  }
};

// Fetch metrics data
const fetchData = async () => {
  loading.value = true;
  try {
    const dateRange = getDateRange(selectedRange.value?.value);
    const response = await api.get("/reports/metrics", {
      params: {
        start_date: dateRange.start,
        end_date: dateRange.end,
        consolidate: consolidateOption.value.value,
      },
    });
    metricsData.value = response.data;
  } catch (error) {
    console.error("Error fetching metrics data:", error);
    $q.notify({
      type: "negative",
      message: "Failed to fetch metrics data",
    });
  } finally {
    loading.value = false;
  }
};

// Component initialization
onMounted(async () => {
  selectedRange.value = dateRangeOptions.find(
    (option) => option.value === "1year"
  );
  await fetchCurrencies();
  await fetchData();
});
</script>
