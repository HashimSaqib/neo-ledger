<template>
  <div class="container q-mt-md">
    <q-expansion-item
      :label="t('Recurring schedule')"
      header-class="container-bg"
      default-opened
      class="q-mb-md"
    >
      <div class="q-gutter-y-md q-pa-sm">
        <q-input
          :model-value="name"
          :label="t('Name (optional)')"
          outlined
          dense
          class="col-12 col-sm-6"
          bg-color="input"
          label-color="secondary"
          @update:model-value="$emit('update:name', $event)"
        />
        <s-select
          :model-value="frequency"
          :options="frequencyOptions"
          option-label="label"
          option-value="value"
          map-options
          emit-value
          :label="t('Frequency *')"
          outlined
          dense
          class="col-12 col-sm-4"
          @update:model-value="onFrequencyChange"
        />
        <!-- Weekly: day selection -->
        <div v-if="frequency === 'weekly'">
          <div class="text-subtitle2 q-mb-sm text-weight-medium">
            {{ t("Select Days") }}
          </div>
          <div class="row q-gutter-xs">
            <q-btn
              v-for="day in weekDays"
              :key="day.value"
              :label="day.shortLabel"
              :color="isWeekDaySelected(day.value) ? 'primary' : 'grey-3'"
              :text-color="isWeekDaySelected(day.value) ? 'white' : 'grey-8'"
              @click="toggleWeekDay(day.value)"
              size="sm"
              no-caps
              unelevated
              style="min-width: 45px"
            >
              <q-tooltip>{{ day.label }}</q-tooltip>
            </q-btn>
          </div>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ t("Select one or more days. Defaults to Monday if none selected.") }}
          </div>
        </div>
        <!-- Monthly: day-of-month selection -->
        <div v-if="frequency === 'monthly'">
          <div class="text-subtitle2 q-mb-sm text-weight-medium">
            {{ t("Select Days of Month") }}
          </div>
          <div class="row q-gutter-xs q-mb-sm">
            <q-btn
              :label="t('1st & 15th')"
              color="secondary"
              @click="setMonthDays([1, 15])"
              size="xs"
              outline
              no-caps
            />
            <q-btn
              :label="t('Last Day')"
              color="secondary"
              @click="setMonthDays([-1])"
              size="xs"
              outline
              no-caps
            />
          </div>
          <div class="row q-gutter-xs">
            <q-btn
              v-for="day in 31"
              :key="day"
              :label="day.toString()"
              :color="isMonthDaySelected(day) ? 'primary' : 'grey-3'"
              :text-color="isMonthDaySelected(day) ? 'white' : 'grey-8'"
              @click="toggleMonthDay(day)"
              size="sm"
              no-caps
              unelevated
              style="min-width: 40px"
            />
            <q-btn
              label="-1"
              :color="isMonthDaySelected(-1) ? 'primary' : 'grey-3'"
              :text-color="isMonthDaySelected(-1) ? 'white' : 'grey-8'"
              @click="toggleMonthDay(-1)"
              size="sm"
              no-caps
              unelevated
              style="min-width: 40px"
            >
              <q-tooltip>{{ t("Last day of month") }}</q-tooltip>
            </q-btn>
          </div>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ t("Select one or more days. Use -1 for last day of month. Defaults to 1st if none selected.") }}
          </div>
        </div>
        <!-- Delivery time (when to run) -->
        <div>
          <q-input
            :model-value="deliveryTime"
            :label="t('Run at (time) *')"
            outlined
            dense
            bg-color="input"
            label-color="secondary"
            mask="time"
            :rules="['time']"
            @update:model-value="$emit('update:deliveryTime', $event)"
          >
            <template v-slot:append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time
                    :model-value="deliveryTime"
                    format24h
                    @update:model-value="$emit('update:deliveryTime', $event)"
                  >
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup :label="t('Close')" color="primary" flat />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ t("Select the time of day when the recurring invoice should run") }}
          </div>
        </div>
        <div class="row q-gutter-md">
          <q-input
            :model-value="startDate"
            :label="t('Start date (optional)')"
            type="date"
            outlined
            dense
            class="col-12 col-sm-4"
            bg-color="input"
            label-color="secondary"
            @update:model-value="$emit('update:startDate', $event)"
          />
          <q-input
            :model-value="endDate"
            :label="t('End date (optional)')"
            type="date"
            outlined
            dense
            class="col-12 col-sm-4"
            bg-color="input"
            label-color="secondary"
            @update:model-value="$emit('update:endDate', $event)"
          />
          <q-input
            :model-value="dueDateDays"
            :label="t('Due in (days)')"
            type="number"
            min="0"
            outlined
            dense
            class="col-12 col-sm-2"
            bg-color="input"
            label-color="secondary"
            @update:model-value="$emit('update:dueDateDays', $event)"
          />
        </div>
      </div>
    </q-expansion-item>
    <div class="q-pa-sm q-gutter-y-md">
      <q-checkbox
        :model-value="sendEmail"
        :label="t('Send email when invoice is created')"
        @update:model-value="$emit('update:sendEmail', $event)"
      />
      <template v-if="sendEmail">
        <q-input
          :model-value="emailTo"
          :label="t('To (optional, uses customer email if empty)')"
          outlined
          dense
          class="col-12 col-sm-6"
          bg-color="input"
          label-color="secondary"
          @update:model-value="$emit('update:emailTo', $event)"
        />
        <MessageVariableInput
          type="invoice_send"
          simple
          :model-value="message"
          :label="t('Message')"
          @update:model-value="$emit('update:message', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import MessageVariableInput from "src/components/MessageVariableInput.vue";

const { t } = useI18n();

const props = defineProps({
  name: { type: String, default: "" },
  frequency: { type: String, default: "monthly" },
  deliveryTime: { type: String, default: "09:00" },
  customSchedule: { type: Object, default: null },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  dueDateDays: { type: Number, default: 30 },
  sendEmail: { type: Boolean, default: false },
  message: { type: String, default: "" },
  emailTo: { type: String, default: "" },
});

const emit = defineEmits([
  "update:name",
  "update:frequency",
  "update:deliveryTime",
  "update:customSchedule",
  "update:startDate",
  "update:endDate",
  "update:dueDateDays",
  "update:sendEmail",
  "update:message",
  "update:emailTo",
]);

const frequencyOptions = [
  { label: t("Daily"), value: "daily" },
  { label: t("Weekly"), value: "weekly" },
  { label: t("Monthly"), value: "monthly" },
];

const weekDays = [
  { value: 1, label: t("Monday"), shortLabel: t("Mon") },
  { value: 2, label: t("Tuesday"), shortLabel: t("Tue") },
  { value: 3, label: t("Wednesday"), shortLabel: t("Wed") },
  { value: 4, label: t("Thursday"), shortLabel: t("Thu") },
  { value: 5, label: t("Friday"), shortLabel: t("Fri") },
  { value: 6, label: t("Saturday"), shortLabel: t("Sat") },
  { value: 7, label: t("Sunday"), shortLabel: t("Sun") },
];

function onFrequencyChange(frequency) {
  if (frequency === "daily") {
    emit("update:customSchedule", null);
  } else {
    emit("update:customSchedule", { days: [] });
  }
  emit("update:frequency", frequency);
}

function isWeekDaySelected(day) {
  return props.customSchedule?.days?.includes(day) ?? false;
}

function toggleWeekDay(day) {
  let next = props.customSchedule ? { days: [...props.customSchedule.days] } : { days: [] };
  if (!next.days) next.days = [];
  const idx = next.days.indexOf(day);
  if (idx > -1) {
    next.days.splice(idx, 1);
  } else {
    next.days.push(day);
    next.days.sort((a, b) => a - b);
  }
  emit("update:customSchedule", next.days.length ? next : null);
}

function isMonthDaySelected(day) {
  return props.customSchedule?.days?.includes(day) ?? false;
}

function toggleMonthDay(day) {
  let next = props.customSchedule ? { days: [...props.customSchedule.days] } : { days: [] };
  if (!next.days) next.days = [];
  const idx = next.days.indexOf(day);
  if (idx > -1) {
    next.days.splice(idx, 1);
  } else {
    next.days.push(day);
    next.days.sort((a, b) => {
      if (a === -1) return 1;
      if (b === -1) return -1;
      return a - b;
    });
  }
  emit("update:customSchedule", next.days.length ? next : null);
}

function setMonthDays(days) {
  emit("update:customSchedule", { days: [...days] });
}
</script>
