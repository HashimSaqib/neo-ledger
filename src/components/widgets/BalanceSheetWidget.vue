<template>
  <div class="bs-widget" :class="{ 'bs-widget--dragging': isDragging }">
    <div class="widget-header" @mousedown="$emit('dragStart', $event)">
      <div class="widget-header__left">
        <q-icon name="account_balance_wallet" size="20px" class="widget-icon" />
        <span class="widget-title">{{ t("Balance Sheet") }}</span>
      </div>
      <div class="widget-header__right">
        <q-btn flat round dense size="sm" icon="more_vert" class="widget-menu-btn">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup @click="$emit('refresh')">
                <q-item-section avatar><q-icon name="refresh" size="20px" /></q-item-section>
                <q-item-section>{{ t("Refresh") }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="$emit('toggleVisibility')">
                <q-item-section avatar><q-icon name="visibility_off" size="20px" /></q-item-section>
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
        <div class="chart-block">
          <div class="chart-block__header">
            <span class="chart-block__title">{{ t("1 - Assets") }}</span>
          </div>
          <div class="chart-legend">
            <div
              v-for="(cat, i) in assetCategories"
              :key="'al-' + cat"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ background: assetColors[i % assetColors.length] }" />
              <span class="legend-label">{{ cat }} – {{ categoryLabel(cat) }}</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="assetsCanvas" />
          </div>
        </div>

        <div class="chart-block chart-block--liabilities">
          <div class="chart-block__header">
            <span class="chart-block__title">{{ t("2 - Liabilities") }}</span>
          </div>
          <div class="chart-legend">
            <div
              v-for="(cat, i) in liabilityCategories"
              :key="'ll-' + cat"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ background: liabilityColors[i % liabilityColors.length] }" />
              <span class="legend-label">{{ cat }} – {{ categoryLabel(cat) }}</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="liabCanvas" />
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
import ChartDataLabels from "chartjs-plugin-datalabels";
import { getCssVar, useQuasar } from "quasar";
import { formatAmount } from "src/helpers/utils";

Chart.register(...registerables);

const { t } = useI18n();
const $q = useQuasar();

const props = defineProps({
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  isDragging: { type: Boolean, default: false },
  periodType: {
    type: String,
    default: "monthly",
    validator: (v) => ["monthly", "quarterly", "yearly"].includes(v),
  },
});

defineEmits(["dragStart", "refresh", "toggleVisibility"]);

const assetsCanvas = ref(null);
const liabCanvas = ref(null);
let assetsChart = null;
let liabChart = null;

// Blues: index 0 = darkest (bottom of stack), ascending to lightest
const assetColors = [
  "#1e3a8a",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#bfdbfe",
  "#dbeafe",
];

// Yellows/oranges: index 0 = darkest (bottom of stack), ascending to lightest
const liabilityColors = [
  "#92400e",
  "#b45309",
  "#d97706",
  "#f59e0b",
  "#fbbf24",
  "#fcd34d",
  "#fef3c7",
];

const hasData = computed(() => {
  const bm = props.data?.by_month;
  return bm != null && Object.keys(bm).length > 0;
});

const assetCategories = computed(() => props.data?.asset_categories ?? []);
const liabilityCategories = computed(() => props.data?.liability_categories ?? []);

const categoryLabel = (cat) => props.data?.labels?.[cat] ?? cat;

const buckets = computed(() => {
  const byMonth = props.data?.by_month;
  if (!byMonth) return [];
  const months = Object.keys(byMonth).sort();

  if (props.periodType === "quarterly") {
    const qMap = {};
    months.forEach((m) => {
      const [year, mo] = m.split("-").map(Number);
      const key = `${year}-Q${Math.ceil(mo / 3)}`;
      if (!qMap[key]) qMap[key] = [];
      qMap[key].push(m);
    });
    return Object.keys(qMap)
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
    return Object.keys(yMap)
      .sort()
      .map((k) => ({ key: k, months: yMap[k] }));
  } else {
    return months.map((m) => ({ key: m, months: [m] }));
  }
});

const bucketLabels = computed(() =>
  buckets.value.map(({ key }) => {
    if (props.periodType === "monthly") {
      const [year, month] = key.split("-");
      return new Date(year, parseInt(month) - 1).toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
    }
    return key;
  })
);

const sumCat = (monthsList, side, cat) => {
  const bm = props.data.by_month;
  return monthsList.reduce((acc, m) => acc + (bm[m]?.[side]?.[cat] ?? 0), 0);
};

// Minimum bar segment height (px) to show an inner label
const MIN_LABEL_HEIGHT = 22;

// Per-chart plugin that draws total badges above (assets) or below (liabilities) bars
const makeTotalPlugin = (side, badgeColor) => ({
  id: `totalBadge_${side}`,
  afterDraw(chart) {
    const { ctx, data } = chart;
    const count = bucketLabels.value.length;

    for (let i = 0; i < count; i++) {
      const total = data.datasets.reduce((sum, ds) => sum + (ds.data[i] || 0), 0);
      if (total === 0) continue;

      // Find the outermost bar element (last visible dataset)
      let outerMeta = null;
      for (let d = data.datasets.length - 1; d >= 0; d--) {
        const meta = chart.getDatasetMeta(d);
        if (meta.visible && meta.data[i]) {
          outerMeta = meta;
          break;
        }
      }
      if (!outerMeta) continue;

      const bar = outerMeta.data[i];
      const text = formatAmount(Math.abs(total));

      ctx.save();
      ctx.font = "600 10px sans-serif";
      const textW = ctx.measureText(text).width;
      const padH = 4;
      const padV = 3;
      const rectW = textW + padH * 2;
      const rectH = 16;
      const rectX = bar.x - rectW / 2;

      if (side === "assets") {
        const rectY = bar.y - rectH - 5;
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, 3);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, bar.x, rectY + rectH / 2);
      } else {
        const rectY = bar.y + 5;
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, 3);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, bar.x, rectY + rectH / 2);
      }

      ctx.restore();
    }
  },
});

const buildDatasets = (side, categories, colors) =>
  categories.map((cat, i) => ({
    label: `${cat} – ${categoryLabel(cat)}`,
    data: buckets.value.map(({ months }) => -sumCat(months, side, cat)),
    backgroundColor: colors[i % colors.length],
    borderWidth: 0,
    barPercentage: 0.7,
    categoryPercentage: 0.8,
    datalabels: {
      anchor: "center",
      align: "center",
      color: "#ffffff",
      font: { size: 9, weight: "600" },
      formatter: (value) => formatAmount(Math.abs(value)),
      display(ctx) {
        const meta = ctx.chart.getDatasetMeta(ctx.datasetIndex);
        const bar = meta.data[ctx.dataIndex];
        return bar && Math.abs(bar.height ?? 0) >= MIN_LABEL_HEIGHT;
      },
    },
  }));

const sharedBarOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: "index" },
  animation: { duration: 400 },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(0,0,0,0.82)",
      titleFont: { size: 12, weight: "600" },
      bodyFont: { size: 11 },
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        label: (ctx) =>
          ctx.parsed.y !== 0
            ? `${ctx.dataset.label}: ${formatAmount(Math.abs(ctx.parsed.y))}`
            : null,
      },
    },
    datalabels: {
      // global fallback – overridden per dataset
      display: false,
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      ticks: {
        color: getCssVar("mutedtext"),
        font: { size: 10 },
        maxRotation: 0,
      },
    },
    y: {
      stacked: true,
      grid: { color: getCssVar("border"), drawBorder: false },
      border: { display: false },
      ticks: {
        color: getCssVar("mutedtext"),
        font: { size: 10 },
        callback: (v) => formatAmount(v),
      },
    },
  },
});

const initCharts = () => {
  if (!assetsCanvas.value || !liabCanvas.value) return;

  if (assetsChart) assetsChart.destroy();
  if (liabChart) liabChart.destroy();

  const labels = bucketLabels.value;
  const baseOpts = sharedBarOptions();

  const assetDatasets = buildDatasets("assets", assetCategories.value, assetColors);
  const liabDatasets = buildDatasets(
    "liabilities",
    liabilityCategories.value,
    [...liabilityColors].reverse()
  );

  assetsChart = new Chart(assetsCanvas.value.getContext("2d"), {
    type: "bar",
    plugins: [ChartDataLabels, makeTotalPlugin("assets", "#2563eb")],
    data: { labels, datasets: assetDatasets },
    options: {
      ...baseOpts,
      layout: { padding: { top: 28 } },
      scales: {
        ...baseOpts.scales,
        y: { ...baseOpts.scales.y, min: 0 },
      },
    },
  });

  liabChart = new Chart(liabCanvas.value.getContext("2d"), {
    type: "bar",
    plugins: [ChartDataLabels, makeTotalPlugin("liabilities", "#d97706")],
    data: { labels, datasets: liabDatasets },
    options: {
      ...baseOpts,
      layout: { padding: { bottom: 28 } },
      scales: {
        ...baseOpts.scales,
        y: { ...baseOpts.scales.y, max: 0 },
      },
    },
  });
};

const tryInit = async () => {
  if (hasData.value) {
    await nextTick();
    initCharts();
  }
};

watch(() => props.data, tryInit, { deep: true });
watch(() => props.periodType, tryInit);
watch(() => props.loading, async (v) => { if (!v) await tryInit(); });
watch(() => $q.dark.isActive, tryInit);

onMounted(() => {
  if (hasData.value && !props.loading) nextTick(initCharts);
});
</script>

<style lang="scss" scoped>
.bs-widget {
  background: var(--q-lightbg);
  border: 1px solid var(--q-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
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

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  &__right { gap: 0.25rem; }
}

.widget-icon  { color: var(--q-primary); }
.widget-title { font-size: 0.95rem; font-weight: 600; color: var(--q-maintext); }
.widget-menu-btn { color: var(--q-mutedtext); }
.drag-handle  { color: var(--q-mutedtext); cursor: grab; &:active { cursor: grabbing; } }

.widget-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  .empty-icon { opacity: 0.5; }
}

.chart-block {
  background: var(--q-mainbg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  padding: 0.75rem 0.75rem 0.5rem;

  &__header {
    margin-bottom: 0.5rem;
  }

  &__title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--q-maintext);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.9rem;
  margin-bottom: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.68rem;
  color: var(--q-mutedtext);
  font-weight: 500;
  white-space: nowrap;
}

.chart-container {
  height: 300px;
  position: relative;
}
</style>
