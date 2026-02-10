<template>
  <div class="top10-vc-widget" :class="{ 'top10-vc-widget--dragging': isDragging }">
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
        <div class="top10-summary">
          <span class="top10-summary__label">{{ totalLabel }}</span>
          <span class="top10-summary__amount">{{ formatAmount(totalAmount) }}</span>
        </div>
        <div class="top10-list">
          <div
            v-for="(row, index) in top10Rows"
            :key="row.vc_id"
            class="top10-row"
          >
            <div class="top10-row__rank">{{ index + 1 }}</div>
            <div class="top10-row__main">
              <span class="top10-row__name">{{ row.vc_name || t("Unknown") }}</span>
              <span class="top10-row__amount">{{ formatAmount(row.amount) }}</span>
              <span class="top10-row__pct">{{ row.percentText }}</span>
              <span
                v-if="row.trend !== null"
                class="top10-row__trend"
                :class="trendClass(row.trend)"
                :title="trendTitle(row)"
              >
                <q-icon
                  v-if="row.trend === 1"
                  name="trending_up"
                  size="16px"
                />
                <q-icon
                  v-else-if="row.trend === -1"
                  name="trending_down"
                  size="16px"
                />
                <q-icon
                  v-else
                  name="remove"
                  size="14px"
                />
              </span>
            </div>
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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatAmount } from "src/helpers/utils";

const { t } = useI18n();

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
  previousData: {
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

defineEmits(["dragStart", "refresh", "toggleVisibility"]);

const isCustomer = computed(() => props.type === "customer");

const widgetTitle = computed(() =>
  isCustomer.value ? t("Top 10 Customers") : t("Top 10 Vendors")
);

const widgetIcon = computed(() =>
  isCustomer.value ? "people" : "business"
);

const totalLabel = computed(() =>
  isCustomer.value ? t("Total Sales") : t("Total Purchases")
);

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

const previousByVc = computed(() => {
  if (!props.previousData?.transactions) return {};
  const tx = props.previousData.transactions;
  const list = [
    ...(tx.open?.transactions || []),
    ...(tx.overdue?.transactions || []),
    ...(tx.closed?.transactions || []),
    ...(tx.overpaid?.transactions || []),
  ];
  const byVc = {};
  list.forEach((row) => {
    const id = row.vc_id ?? row.vc_name ?? "?";
    if (!byVc[id]) byVc[id] = { amount: 0, vc_name: row.vc_name };
    byVc[id].amount += Number(row.totalamount) || 0;
  });
  return byVc;
});

const top10Rows = computed(() => {
  const transactions = allTransactions.value;
  if (!transactions.length) return [];

  const byVc = {};
  transactions.forEach((row) => {
    const id = row.vc_id ?? row.vc_name ?? "?";
    if (!byVc[id]) {
      byVc[id] = { vc_id: id, vc_name: row.vc_name, amount: 0 };
    }
    byVc[id].amount += Number(row.totalamount) || 0;
  });

  const total = Object.values(byVc).reduce((sum, r) => sum + r.amount, 0);
  if (total <= 0) return [];

  const rows = Object.values(byVc)
    .map((r) => ({
      ...r,
      percent: total > 0 ? (r.amount / total) * 100 : 0,
      percentText: total > 0 ? `${((r.amount / total) * 100).toFixed(1)}%` : "0%",
      trend: null,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const prev = previousByVc.value;
  if (Object.keys(prev).length > 0) {
    rows.forEach((r) => {
      const prevAmount = prev[r.vc_id]?.amount ?? 0;
      if (prevAmount === 0 && r.amount === 0) r.trend = 0;
      else if (r.amount > prevAmount) r.trend = 1;
      else if (r.amount < prevAmount) r.trend = -1;
      else r.trend = 0;
    });
  }

  return rows;
});

const totalAmount = computed(() => {
  return allTransactions.value.reduce(
    (sum, tx) => sum + (Number(tx.totalamount) || 0),
    0
  );
});

const hasData = computed(() => top10Rows.value.length > 0);

function trendClass(trend) {
  if (trend === 1) return "top10-row__trend--up";
  if (trend === -1) return "top10-row__trend--down";
  return "top10-row__trend--same";
}

function trendTitle(row) {
  if (row.trend === null) return "";
  const prev = previousByVc.value[row.vc_id]?.amount ?? 0;
  if (row.trend === 1) return t("Increased vs previous period");
  if (row.trend === -1) return t("Decreased vs previous period");
  return t("No change vs previous period");
}
</script>

<style lang="scss" scoped>
.top10-vc-widget {
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

.top10-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--q-mainbg);
  border: 1px solid var(--q-border);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.top10-summary__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--q-mutedtext);
}

.top10-summary__amount {
  font-size: 1rem;
  font-weight: 600;
  color: var(--q-maintext);
}

.top10-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.top10-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--q-mainbg);
  border: 1px solid var(--q-border);
  border-radius: 6px;
}

.top10-row__rank {
  flex-shrink: 0;
  width: 22px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--q-mutedtext);
  text-align: center;
}

.top10-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.top10-row__name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--q-maintext);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top10-row__amount {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--q-maintext);
  margin-left: auto;
}

.top10-row__pct {
  font-size: 0.75rem;
  color: var(--q-mutedtext);
}

.top10-row__trend {
  flex-shrink: 0;

  &--up {
    color: #22c55e;
  }

  &--down {
    color: #ef4444;
  }

  &--same {
    color: var(--q-mutedtext);
  }
}
</style>
