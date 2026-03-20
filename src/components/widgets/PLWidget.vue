<template>
  <div class="pl-widget" :class="{ 'pl-widget--dragging': isDragging }">
    <div class="widget-header" @mousedown="$emit('dragStart', $event)">
      <div class="widget-header__left">
        <q-icon name="analytics" size="20px" class="widget-icon" />
        <span class="widget-title">{{ t("P&L Overview") }}</span>
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
        <div class="pl-table-wrapper">
          <table class="pl-table">
            <thead>
              <tr>
                <th class="col-account">{{ t("GL Account") }}</th>
                <th class="col-value col-ac-header">{{ t("AC") }}</th>
                <th class="col-value">{{ t("PY") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in tableRows"
                :key="row.key"
                :class="['pl-row', row.type === 'pct' ? 'pl-row--pct' : 'pl-row--main']"
              >
                <td class="col-account">{{ row.label }}</td>
                <td class="col-value col-ac">
                  {{ row.type === "pct" ? formatPct(row.ac) : formatAmount(row.ac) }}
                </td>
                <td class="col-value">
                  {{ row.type === "pct" ? formatPct(row.py) : formatAmount(row.py) }}
                </td>
              </tr>
            </tbody>
          </table>
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
});

defineEmits(["dragStart", "refresh", "toggleVisibility"]);

defineExpose({
  getPdfExport: () => ({
    type: "table",
    headers: [t("GL Account"), t("AC (YTD)"), t("PY (YTD)")],
    rows: tableRows.value.map((r) => [
      r.label,
      r.type === "pct" ? formatPct(r.ac) : formatAmount(r.ac),
      r.type === "pct" ? formatPct(r.py) : formatAmount(r.py),
    ]),
    rowStyles: tableRows.value.map((r) => (r.type === "pct" ? "muted" : "normal")),
  }),
});

const hasData = computed(() => props.data?.ytd != null);

const formatPct = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return `${parseFloat(val).toFixed(1)}%`;
};

const tableRows = computed(() => {
  const ytd = props.data?.ytd;
  if (!ytd) return [];

  return [
    {
      key: "umsatz",
      label: t("Umsatz"),
      type: "main",
      ac: ytd.umsatz?.ac,
      py: ytd.umsatz?.py,
    },
    {
      key: "db1",
      label: t("Deckungsbeitrag 1 (DB 1)"),
      type: "main",
      ac: ytd.db1?.ac,
      py: ytd.db1?.py,
    },
    {
      key: "db1_pct",
      label: t("DB 1 %"),
      type: "pct",
      ac: ytd.db1?.ac_pct,
      py: ytd.db1?.py_pct,
    },
    {
      key: "db2",
      label: t("Deckungsbeitrag 2 (DB 2)"),
      type: "main",
      ac: ytd.db2?.ac,
      py: ytd.db2?.py,
    },
    {
      key: "db2_pct",
      label: t("DB 2 %"),
      type: "pct",
      ac: ytd.db2?.ac_pct,
      py: ytd.db2?.py_pct,
    },
    {
      key: "ebitda",
      label: t("EBITDA"),
      type: "main",
      ac: ytd.ebitda?.ac,
      py: ytd.ebitda?.py,
    },
    {
      key: "ebitda_pct",
      label: t("EBITDA %"),
      type: "pct",
      ac: ytd.ebitda?.ac_pct,
      py: ytd.ebitda?.py_pct,
    },
    {
      key: "ebit",
      label: t("EBIT"),
      type: "main",
      ac: ytd.ebit?.ac,
      py: ytd.ebit?.py,
    },
    {
      key: "ebit_pct",
      label: t("EBIT %"),
      type: "pct",
      ac: ytd.ebit?.ac_pct,
      py: ytd.ebit?.py_pct,
    },
  ];
});
</script>

<style lang="scss" scoped>
.pl-widget {
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

.widget-icon  { color: var(--q-primary); }

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

// Table
.pl-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--q-border);
  border-radius: 8px;
}

.pl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;

  thead tr {
    border-bottom: 2px solid var(--q-border);
  }

  th {
    padding: 0.6rem 0.85rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--q-mutedtext);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    background: var(--q-mainbg);
  }

  tbody tr {
    border-bottom: 1px solid var(--q-border);

    &:last-child { border-bottom: none; }
  }

  td {
    padding: 0.55rem 0.85rem;
    color: var(--q-maintext);
  }
}

// AC column header highlight
.col-ac-header {
  background: rgba(59, 130, 246, 0.1) !important;
  color: var(--q-primary) !important;
}

// AC column body cells
.col-ac {
  background: rgba(59, 130, 246, 0.05);
}

.col-account {
  width: 60%;
  text-align: left;
}

.col-value {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

// Main amount rows
.pl-row--main {
  td { font-weight: 500; }
}

// Percentage rows — indented label, muted, smaller
.pl-row--pct {
  td {
    color: var(--q-mutedtext);
    font-size: 0.78rem;
  }

  .col-account {
    padding-left: 1.6rem;

    &::before {
      content: "";
    }
  }
}
</style>
