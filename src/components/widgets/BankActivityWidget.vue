<template>
  <div class="bank-activity-widget" :class="{ 'bank-activity-widget--dragging': isDragging }">
    <div class="widget-header" @mousedown="$emit('dragStart', $event)">
      <div class="widget-header__left">
        <q-icon name="account_balance" size="20px" class="widget-icon" />
        <span class="widget-title">{{ widgetTitle }}</span>
      </div>
      <div class="widget-header__right">
        <q-select
          v-if="allBankAccounts.length > 0"
          :model-value="selectedAccountIds"
          multiple
          dense
          outlined
          :options="accountOptions"
          option-value="id"
          option-label="label"
          emit-value
          map-options
          :label="t('Accounts')"
          :hint="selectedAccountIds.length === 0 ? t('All accounts') : ''"
          class="account-select"
          @update:model-value="onSelectedAccountsChange"
        >
          <template v-slot:prepend>
            <q-icon name="account_balance" size="18px" />
          </template>
        </q-select>
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
        <div class="chart-section">
          <div class="chart-legend">
            <div
              v-for="(entry, index) in accountLabels"
              :key="entry.id"
              class="legend-item"
            >
              <span
                class="legend-dot"
                :style="{ background: accountColors[index % accountColors.length].line }"
              ></span>
              <span class="legend-label">{{ entry.label }}</span>
            </div>
          </div>
          <div class="chart-container">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>
      </template>

      <div v-else class="widget-empty">
        <q-icon name="account_balance_wallet" size="48px" class="empty-icon" />
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
    validator: (val) =>
      ["daily", "monthly", "quarterly", "yearly"].includes(val),
  },
  selectedAccountIds: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "dragStart",
  "refresh",
  "toggleVisibility",
  "update:selectedAccountIds",
]);

const chartCanvas = ref(null);
let chartInstance = null;

const widgetTitle = computed(() => t("Bank Account Activity"));

const accountColors = [
  { line: "#3b82f6", fill: "rgba(59, 130, 246, 0.15)" },
  { line: "#22c55e", fill: "rgba(34, 197, 94, 0.15)" },
  { line: "#f97316", fill: "rgba(249, 115, 22, 0.15)" },
  { line: "#8b5cf6", fill: "rgba(139, 92, 246, 0.15)" },
  { line: "#ec4899", fill: "rgba(236, 72, 153, 0.15)" },
  { line: "#06b6d4", fill: "rgba(6, 182, 212, 0.15)" },
];

const allBankAccounts = computed(() => {
  return props.data?.bank_accounts || [];
});

const accountOptions = computed(() => {
  return allBankAccounts.value.map((acc) => ({
    id: acc.id ?? acc.accno,
    label:
      acc.description || acc.name || acc.accno || String(acc.id ?? ""),
  }));
});

const bankAccounts = computed(() => {
  const all = allBankAccounts.value;
  const selected = props.selectedAccountIds;
  if (!selected || selected.length === 0) return all;
  const idSet = new Set(selected);
  return all.filter((acc) => idSet.has(acc.id ?? acc.accno));
});

const onSelectedAccountsChange = (ids) => {
  emit("update:selectedAccountIds", ids || []);
};

const hasData = computed(() => {
  return (
    bankAccounts.value.length > 0 &&
    bankAccounts.value.some(
      (acc) => acc.acc_trans && acc.acc_trans.length > 0
    )
  );
});

const accountLabels = computed(() => {
  return bankAccounts.value.map((acc) => ({
    id: acc.id ?? acc.accno,
    label:
      acc.description || acc.name || acc.accno || String(acc.id ?? ""),
  }));
});

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

const chartData = computed(() => {
  const accounts = bankAccounts.value;
  if (!accounts.length) return { labels: [], datasets: [] };

  const allPeriodsSet = new Set();
  accounts.forEach((acc) => {
    (acc.acc_trans || []).forEach((tx) => {
      allPeriodsSet.add(groupByPeriod(tx.transdate));
    });
  });
  const sortedPeriods = Array.from(allPeriodsSet).sort((a, b) => {
    if (props.periodType === "quarterly") {
      const [yearA, qA] = a.split("-Q");
      const [yearB, qB] = b.split("-Q");
      return yearA - yearB || (qA - qB);
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
      const d = new Date(year, parseInt(month, 10) - 1);
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

  const datasets = accounts.map((acc, index) => {
    const trans = (acc.acc_trans || []).slice();
    trans.sort(
      (a, b) => new Date(a.transdate).getTime() - new Date(b.transdate).getTime()
    );

    const balanceByPeriod = {};
    sortedPeriods.forEach((p) => {
      let periodEndTime;
      if (props.periodType === "daily") {
        periodEndTime = new Date(p + "T23:59:59").getTime();
      } else if (props.periodType === "monthly") {
        const [y, m] = p.split("-").map(Number);
        periodEndTime = new Date(y, m, 0, 23, 59, 59).getTime();
      } else if (props.periodType === "quarterly") {
        const [y, q] = p.split("-Q").map((s, i) => (i === 0 ? parseInt(s, 10) : parseInt(s, 10)));
        periodEndTime = new Date(y, q * 3, 0, 23, 59, 59).getTime();
      } else {
        periodEndTime = new Date(parseInt(p, 10), 11, 31, 23, 59, 59).getTime();
      }
      let sum = 0;
      trans.forEach((tx) => {
        if (new Date(tx.transdate).getTime() <= periodEndTime) {
          sum += Number(tx.amount) || 0;
        }
      });
      balanceByPeriod[p] = sum;
    });

    const color = accountColors[index % accountColors.length];
    return {
      label: acc.description || acc.name || acc.accno || String(acc.id ?? ""),
      data: sortedPeriods.map((p) => balanceByPeriod[p]),
      backgroundColor: color.fill,
      borderColor: color.line,
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: color.line,
    };
  });

  return {
    labels: sortedPeriods.map(formatLabel),
    datasets,
  };
});

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
  async () => {
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

watch(
  () => props.selectedAccountIds,
  async () => {
    if (hasData.value) {
      await nextTick();
      initChart();
    }
  },
  { deep: true }
);

onMounted(() => {
  if (hasData.value) {
    nextTick(() => {
      initChart();
    });
  }
});
</script>

<style lang="scss" scoped>
.bank-activity-widget {
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

.account-select {
  min-width: 140px;
  max-width: 200px;

  :deep(.q-field__control) {
    height: 32px;
  }

  :deep(.q-field__native) {
    min-height: 32px;
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
