<template>
  <div class="revenue-widget" :class="{ 'revenue-widget--dragging': isDragging }">
    <div class="widget-header" @mousedown="$emit('dragStart', $event)">
      <div class="widget-header__left">
        <q-icon name="show_chart" size="20px" class="widget-icon" />
        <span class="widget-title">{{ t("Revenue") }}</span>
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
        <!-- KPI row -->
        <div class="kpi-row">
          <div class="kpi-card">
            <span class="kpi-label">{{ t("AC YTD") }}</span>
            <span class="kpi-value">{{ formatAmount(data.ac_ytd) }}</span>
          </div>
          <div class="kpi-card kpi-card--secondary">
            <span class="kpi-label">{{ t("PY YTD") }}</span>
            <span class="kpi-value kpi-value--secondary">{{ formatAmount(data.py_ytd) }}</span>
            <span
              v-if="data.py_ytd > 0"
              class="kpi-delta"
              :class="deltaClass"
            >
              <q-icon :name="deltaIcon" size="12px" />
              {{ deltaText }}
            </span>
          </div>
        </div>

        <!-- Chart -->
        <div class="chart-section">
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-line legend-line--ac" />
              <span class="legend-label">{{ t("AC") }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-line legend-line--py" />
              <span class="legend-label">{{ t("PY") }}</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="chartCanvas" />
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
    validator: (val) => ["monthly", "quarterly", "yearly"].includes(val),
  },
});

defineEmits(["dragStart", "refresh", "toggleVisibility"]);

defineExpose({
  getPdfExport: () => ({
    type: "chart",
    labels: chartData.value.labels,
    datasets: chartData.value.datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      color: ds.borderColor,
      dashed: Array.isArray(ds.borderDash) && ds.borderDash.length > 0,
    })),
    formatY: (v) => formatAmount(v),
    kpis: [
      { label: "AC YTD", value: formatAmount(props.data?.ac_ytd ?? 0) },
      { label: "PY YTD", value: formatAmount(props.data?.py_ytd ?? 0) },
      ...(deltaText.value ? [{ label: "YoY", value: deltaText.value }] : []),
    ],
  }),
});

const chartCanvas = ref(null);
let chartInstance = null;

const AC_COLOR  = "#3b82f6";
const AC_FILL   = "rgba(59, 130, 246, 0.12)";
const PY_COLOR  = "#94a3b8";
const PY_FILL   = "rgba(148, 163, 184, 0.07)";

const hasData = computed(() => {
  const bm = props.data?.by_month;
  return bm != null && Object.keys(bm).length > 0;
});

// Fold monthly data into display buckets for the chosen period type
const chartData = computed(() => {
  const byMonth = props.data?.by_month;
  if (!byMonth || !Object.keys(byMonth).length) return { labels: [], datasets: [] };

  const months = Object.keys(byMonth).sort();

  let buckets;
  if (props.periodType === "quarterly") {
    const qMap = {};
    months.forEach((m) => {
      const [year, mo] = m.split("-").map(Number);
      const key = `${year}-Q${Math.ceil(mo / 3)}`;
      if (!qMap[key]) qMap[key] = [];
      qMap[key].push(m);
    });
    buckets = Object.keys(qMap)
      .sort((a, b) => {
        const [yA, qA] = a.split("-Q").map(Number);
        const [yB, qB] = b.split("-Q").map(Number);
        return yA - yB || qA - qB;
      })
      .map((k) => ({ key: k, months: qMap[k] }));
  } else if (props.periodType === "yearly") {
    const yMap = {};
    months.forEach((m) => {
      const year = m.substring(0, 4);
      if (!yMap[year]) yMap[year] = [];
      yMap[year].push(m);
    });
    buckets = Object.keys(yMap)
      .sort()
      .map((k) => ({ key: k, months: yMap[k] }));
  } else {
    buckets = months.map((m) => ({ key: m, months: [m] }));
  }

  const formatLabel = (key) => {
    if (props.periodType === "monthly") {
      const [year, month] = key.split("-");
      const d = new Date(year, parseInt(month) - 1);
      return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    }
    return key;
  };

  const sumBucket = (months) =>
    months.reduce(
      (acc, m) => {
        const d = byMonth[m] || {};
        acc.ac += d.ac || 0;
        acc.py += d.py || 0;
        return acc;
      },
      { ac: 0, py: 0 }
    );

  const aggregated = buckets.map((b) => ({ label: formatLabel(b.key), ...sumBucket(b.months) }));

  return {
    labels: aggregated.map((b) => b.label),
    datasets: [
      {
        label: t("AC"),
        data: aggregated.map((b) => b.ac),
        borderColor: AC_COLOR,
        backgroundColor: AC_FILL,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: AC_COLOR,
      },
      {
        label: t("PY"),
        data: aggregated.map((b) => b.py),
        borderColor: PY_COLOR,
        backgroundColor: PY_FILL,
        borderWidth: 2,
        borderDash: [6, 4],
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: PY_COLOR,
        pointStyle: "circle",
      },
    ],
  };
});

// YTD delta vs prior year
const delta = computed(() => {
  const ac = props.data?.ac_ytd ?? 0;
  const py = props.data?.py_ytd ?? 0;
  if (!py) return null;
  return ((ac - py) / Math.abs(py)) * 100;
});

const deltaClass = computed(() => {
  if (delta.value === null) return "";
  return delta.value >= 0 ? "kpi-delta--up" : "kpi-delta--down";
});

const deltaIcon = computed(() => {
  if (delta.value === null) return "";
  return delta.value >= 0 ? "trending_up" : "trending_down";
});

const deltaText = computed(() => {
  if (delta.value === null) return "";
  const sign = delta.value >= 0 ? "+" : "";
  return `${sign}${delta.value.toFixed(1)}% ${t("vs PY")}`;
});

const initChart = () => {
  if (!chartCanvas.value) return;
  if (chartInstance) chartInstance.destroy();

  const ctx = chartCanvas.value.getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "line",
    data: chartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { size: 12, weight: "600" },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatAmount(ctx.raw)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: getCssVar("border"), drawBorder: false },
          ticks: {
            color: getCssVar("mutedtext"),
            font: { size: 10 },
            callback: (v) => formatAmount(v),
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

watch(() => props.periodType, async () => {
  if (hasData.value) { await nextTick(); initChart(); }
});

watch(() => $q.dark.isActive, async () => {
  if (hasData.value) { await nextTick(); initChart(); }
});

watch(() => props.data, async () => {
  if (hasData.value) { await nextTick(); initChart(); }
}, { deep: true });

watch(() => props.loading, async (loading) => {
  if (!loading && hasData.value) { await nextTick(); initChart(); }
});

onMounted(() => {
  if (hasData.value && !props.loading) nextTick(() => initChart());
});
</script>

<style lang="scss" scoped>
.revenue-widget {
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

  &:active { cursor: grabbing; }

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

.widget-icon { color: var(--q-primary); }

.widget-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--q-maintext);
}

.widget-menu-btn { color: var(--q-mutedtext); }

.drag-handle {
  color: var(--q-mutedtext);
  cursor: grab;
  &:active { cursor: grabbing; }
}

.widget-content { padding: 1rem; }

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

  .empty-icon { opacity: 0.5; }
}

// KPI row
.kpi-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.kpi-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 1rem;
  background: var(--q-mainbg);
  border: 1px solid var(--q-border);
  border-radius: 10px;

  &--secondary {
    flex: 0 0 auto;
    min-width: 0;
  }
}

.kpi-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--q-mutedtext);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--q-maintext);
  line-height: 1.15;

  &--secondary {
    font-size: 1.1rem;
    color: var(--q-mutedtext);
  }
}

.kpi-delta {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.72rem;
  font-weight: 600;
  margin-top: 0.1rem;

  &--up   { color: #22c55e; }
  &--down { color: #ef4444; }
}

// Chart
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
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-line {
  display: inline-block;
  width: 24px;
  height: 2px;
  border-radius: 1px;

  &--ac {
    background: #3b82f6;
  }

  &--py {
    // Simulate dashed line with gradient
    background: repeating-linear-gradient(
      90deg,
      #94a3b8 0px,
      #94a3b8 6px,
      transparent 6px,
      transparent 10px
    );
  }
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
