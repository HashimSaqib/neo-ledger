<template>
  <q-expansion-item
    icon="event_repeat"
    :label="t('Accrual')"
    :caption="headerCaption"
    header-class="container-bg accrual-header"
    expand-icon-class="maintext"
    dense
    dense-toggle
    switch-toggle-side
    v-model="expanded"
    class="q-mb-sm no-hover-expansion accrual-panel"
  >
    <div class="q-pa-md">
      <!-- Enable / disable -->
      <div class="row items-center q-mb-md">
        <q-toggle
          v-model="enabled"
          :label="t('Spread this transaction over multiple periods')"
          color="primary"
          dense
        />
      </div>

      <!-- Three inputs in one line, identical styling to other forms -->
      <div v-if="enabled" class="row q-col-gutter-md q-mb-sm">
        <div class="col-12 col-sm-4">
          <s-select
            outlined
            dense
            v-model="period"
            :options="periodOptions"
            :label="t('Period')"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            bg-color="input"
            label-color="secondary"
          />
        </div>
        <div class="col-12 col-sm-4">
          <text-input
            outlined
            v-model="lengthStr"
            :label="lengthLabel"
            type="number"
          />
        </div>
        <div class="col-12 col-sm-4">
          <date-input
            outlined
            dense
            v-model="startdate"
            :label="t('Start date')"
          />
        </div>
      </div>

      <!-- Natural-language summary line -->
      <div
        v-if="enabled && summaryText"
        class="text-caption text-grey-7 q-mb-md q-mt-xs"
      >
        {{ summaryText }}
      </div>

      <!-- Posted schedule (display only) -->
      <div
        v-if="enabled && lines && lines.length"
        class="accrual-schedule q-pa-sm"
      >
        <div class="row items-center q-mb-sm">
          <span class="text-caption text-grey-7">{{
            t("Posted schedule")
          }}</span>
          <q-space />
          <span class="text-caption text-grey-7"
            >{{ lines.length }} {{ t("entries") }}</span
          >
        </div>
        <table class="accrual-table">
          <thead>
            <tr>
              <th class="text-left">{{ t("Date") }}</th>
              <th class="text-left">{{ t("Debit") }}</th>
              <th class="text-left">{{ t("Credit") }}</th>
              <th class="text-right">{{ t("Amount") }}</th>
              <th class="text-center"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in lines" :key="idx">
              <td>{{ row.date }}</td>
              <td>{{ row.debitAccno }}</td>
              <td>{{ row.creditAccno }}</td>
              <td class="text-right">{{ formatAmount(row.amount) }}</td>
              <td class="text-center">
                <q-icon
                  :name="row.kind === 'accrual' ? 'south_east' : 'undo'"
                  size="14px"
                  :color="row.kind === 'accrual' ? 'primary' : 'grey-6'"
                >
                  <q-tooltip>{{
                    row.kind === "accrual" ? t("Accrual") : t("Reversal")
                  }}</q-tooltip>
                </q-icon>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </q-expansion-item>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  // Two-way binding for the accrual config. `null` when no accrual is set.
  // Shape: { period: 'monthly'|'quarterly'|'yearly', length: int, startdate: 'YYYY-MM-DD', accrual_id?: int }
  modelValue: { type: Object, default: null },
  // Posted accrual lines from the API (display-only).
  lines: { type: Array, default: () => [] },
  // Default startdate to fall back on (typically the invoice date)
  defaultStartdate: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const { t } = useI18n();

const expanded = ref(false);
const enabled = ref(false);
const period = ref("monthly");
const lengthStr = ref("1"); // text-input is string-typed
const startdate = ref("");

const periodOptions = computed(() => [
  { label: t("Monthly"), value: "monthly" },
  { label: t("Quarterly"), value: "quarterly" },
  { label: t("Yearly"), value: "yearly" },
]);

const lengthLabel = computed(() => {
  if (period.value === "quarterly") return t("Number of quarters");
  if (period.value === "yearly") return t("Number of years");
  return t("Number of months");
});

const headerCaption = computed(() => {
  if (!enabled.value) return t("Off");
  const n = Number(lengthStr.value) || 0;
  if (!n) return "";
  const unit =
    period.value === "quarterly"
      ? n === 1
        ? t("quarter")
        : t("quarters")
      : period.value === "yearly"
        ? n === 1
          ? t("year")
          : t("years")
        : n === 1
          ? t("month")
          : t("months");
  return `${n} ${unit}${startdate.value ? " · " + startdate.value : ""}`;
});

const summaryText = computed(() => {
  const n = Number(lengthStr.value) || 0;
  if (!n) return "";
  const periodName =
    period.value === "quarterly"
      ? t("quarters")
      : period.value === "yearly"
        ? t("years")
        : t("months");
  const start = startdate.value || props.defaultStartdate;
  if (!start) return t("Spread over {n} {p}", { n, p: periodName });
  return t("Spread over {n} {p} starting {d}", { n, p: periodName, d: start });
});

// Hydrate from incoming modelValue. Auto-open dropdown when an accrual exists.
watch(
  () => props.modelValue,
  (val) => {
    if (val && val.period) {
      enabled.value = true;
      period.value = val.period;
      lengthStr.value = String(val.length || 1);
      startdate.value = val.startdate || props.defaultStartdate || "";
      expanded.value = true;
    } else {
      enabled.value = false;
      expanded.value = false;
    }
  },
  { immediate: true },
);

// When defaultStartdate (invoice date) changes and the user hasn't picked one, follow it.
watch(
  () => props.defaultStartdate,
  (val) => {
    if (!startdate.value && val) startdate.value = val;
  },
  { immediate: true },
);

function emitCurrent() {
  if (!enabled.value) {
    emit("update:modelValue", null);
    return;
  }
  emit("update:modelValue", {
    period: period.value,
    length: Number(lengthStr.value) || 0,
    startdate: startdate.value || props.defaultStartdate || "",
  });
}

watch([enabled, period, lengthStr, startdate], emitCurrent);

function formatAmount(v) {
  const n = Number(v) || 0;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
</script>

<style scoped>
.accrual-panel {
  border-radius: 6px;
}

.accrual-header :deep(.q-item__section--side) {
  min-width: 0;
  padding-right: 12px;
}

.accrual-header :deep(.q-item__label--caption) {
  color: var(--q-secondary);
  font-size: 0.75rem;
}

.accrual-schedule {
  border: 1px solid var(--q-input);
  border-radius: 6px;
  background: transparent;
}

.accrual-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.accrual-table thead th {
  font-weight: 500;
  color: var(--q-secondary);
  padding: 6px 8px;
  border-bottom: 1px solid var(--q-input);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.accrual-table tbody td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--q-input);
}

.accrual-table tbody tr:last-child td {
  border-bottom: none;
}

.accrual-table tbody tr:hover {
  background: rgba(0, 0, 0, 0.02);
}
</style>
