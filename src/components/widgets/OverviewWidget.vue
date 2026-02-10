<template>
  <div class="overview-widget" :class="{ 'overview-widget--dragging': isDragging }">
    <div class="widget-header" @mousedown="$emit('dragStart', $event)">
      <div class="widget-header__left">
        <q-icon :name="widgetIcon" size="20px" class="widget-icon" />
        <span class="widget-title">{{ widgetTitle }}</span>
      </div>
      <div class="widget-header__right">
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="more_vert"
          class="widget-menu-btn"
        >
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup @click="$emit('refresh')">
                <q-item-section avatar>
                  <q-icon name="refresh" size="20px" />
                </q-item-section>
                <q-item-section>{{ t("Refresh") }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="$emit('toggleVisibility')">
                <q-item-section avatar>
                  <q-icon name="visibility_off" size="20px" />
                </q-item-section>
                <q-item-section>{{ t("Hide") }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-icon name="drag_indicator" class="drag-handle" />
      </div>
    </div>

    <div class="widget-content">
      <div v-if="loading" class="widget-loading">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <template v-else-if="hasData">
        <!-- Chart Section -->
        <div class="chart-section">
          <div class="chart-legend">
            <div
              v-for="(color, status) in statusColors"
              :key="status"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ background: color.line }"></span>
              <span class="legend-label">{{ getStatusLabel(status) }}</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>

      </template>

      <div v-else class="widget-empty">
        <q-icon name="inbox" size="48px" class="empty-icon" />
        <span>{{ t("No data available") }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Chart, registerables } from "chart.js";
import { getCssVar, useQuasar } from "quasar";
import { formatAmount } from "src/helpers/utils";

Chart.register(...registerables);

const { t } = useI18n();
const $q = useQuasar();

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (val) => ["customer", "vendor"].includes(val),
  },
  data: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  isDragging: {
    type: Boolean,
    default: false,
  },
  periodType: {
    type: String,
    default: "monthly",
    validator: (val) => ["daily", "monthly", "quarterly", "yearly"].includes(val),
  },
});

const emit = defineEmits(["dragStart", "refresh", "toggleVisibility"]);

const chartCanvas = ref(null);
let chartInstance = null;

const isCustomer = computed(() => props.type === "customer");

const widgetTitle = computed(() =>
  isCustomer.value ? t("Accounts Receivable") : t("Accounts Payable")
);

const widgetIcon = computed(() =>
  isCustomer.value ? "trending_up" : "trending_down"
);

const statusColors = {
  open: { line: "#3b82f6", fill: "rgba(59, 130, 246, 0.15)" },
  overdue: { line: "#ef4444", fill: "rgba(239, 68, 68, 0.15)" },
  closed: { line: "#22c55e", fill: "rgba(34, 197, 94, 0.15)" },
  overpaid: { line: "#f97316", fill: "rgba(249, 115, 22, 0.15)" },
};

const hasData = computed(() => {
  return (
    props.data &&
    props.data.transactions &&
    Object.keys(props.data.transactions).length > 0
  );
});

const allTransactions = computed(() => {
  if (!props.data?.transactions) return [];
  const tx = props.data.transactions;
  return [
    ...(tx.open?.transactions || []),
    ...(tx.overdue?.transactions || []),
    ...(tx.closed?.transactions || []),
    ...(tx.overpaid?.transactions || []),
  ];
});

const chartData = computed(() => {
  const transactions = allTransactions.value;
  if (!transactions.length) return { labels: [], datasets: [] };

  const groupByPeriod = (date) => {
    const d = new Date(date);
    if (props.periodType === "daily") {
      return date;
    } else if (props.periodType === "monthly") {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (props.periodType === "quarterly") {
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
    if (props.periodType === "quarterly") {
      const [yearA, qA] = a.split("-Q");
      const [yearB, qB] = b.split("-Q");
      return yearA - yearB || qA - qB;
    }
    return a.localeCompare(b);
  });

  const formatLabel = (period) => {
    if (props.periodType === "daily") {
      const d = new Date(period);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } else if (props.periodType === "monthly") {
      const [year, month] = period.split("-");
      const d = new Date(year, parseInt(month) - 1);
      return d.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
    } else if (props.periodType === "quarterly") {
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
        pointRadius: 3,
        pointHoverRadius: 5,
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
        pointRadius: 3,
        pointHoverRadius: 5,
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
        pointRadius: 3,
        pointHoverRadius: 5,
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
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: statusColors.overpaid.line,
      },
    ],
  };
});

const getStatusLabel = (status) => {
  const labels = {
    open: t("Open"),
    overdue: t("Overdue"),
    closed: t("Closed"),
    overpaid: t("Overpaid"),
  };
  return labels[status] || status;
};

const initChart = () => {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = chartCanvas.value.getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "line",
    data: chartData.value,
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
          titleFont: { size: 12, weight: "600" },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 6,
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
            font: { size: 10 },
            callback: (value) => formatAmount(value),
            padding: 6,
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            color: getCssVar("mutedtext"),
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 0,
            padding: 6,
          },
        },
      },
    },
  });
};

watch(
  () => props.periodType,
  async (newVal, oldVal) => {
    console.log(`Period type changed from ${oldVal} to ${newVal}`);
    if (hasData.value) {
      await nextTick();
      initChart();
    }
  }
);

watch(
  () => $q.dark.isActive,
  async () => {
    if (hasData.value) {
      await nextTick();
      initChart();
    }
  }
);

watch(
  () => props.data,
  async () => {
    if (hasData.value) {
      await nextTick();
      initChart();
    }
  },
  { deep: true }
);

// When loading becomes false, the chart section is finally in the DOM — init chart then
// (on date change we update data while still loading, so initChart() runs with canvas null)
watch(
  () => props.loading,
  async (loading) => {
    if (!loading && hasData.value) {
      await nextTick();
      initChart();
    }
  }
);

onMounted(() => {
  if (hasData.value && !props.loading) {
    nextTick(() => {
      initChart();
    });
  }
});
</script>

<style lang="scss" scoped>
.overview-widget {
  background: var(--q-lightbg);
  border: 1px solid var(--q-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &--dragging {
    opacity: 0.8;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: scale(1.02);
  }
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--q-lightbg);
  border-bottom: 1px solid var(--q-border);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
}

.widget-icon {
  color: var(--q-primary);
}

.widget-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--q-maintext);
}

.widget-menu-btn {
  color: var(--q-mutedtext);
}

.drag-handle {
  color: var(--q-mutedtext);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.widget-content {
  padding: 1rem;
}

.widget-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.widget-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 0.5rem;
  color: var(--q-mutedtext);

  .empty-icon {
    opacity: 0.5;
  }
}

.chart-section {
  background: var(--q-mainbg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 0.75rem;
}

.chart-legend {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-label {
  font-size: 0.7rem;
  color: var(--q-mutedtext);
  font-weight: 500;
}

.chart-container {
  height: 280px;
  position: relative;
}
</style>
