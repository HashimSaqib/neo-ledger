<template>
  <div class="exchange-rate-input">
    <fn-input
      :model-value="numericValue"
      @update:model-value="emitValue"
      :label="noLabel ? '' : label"
      outlined
      dense
      :bg-color="bgColor"
      label-color="secondary"
      :no-label="noLabel"
    >
      <template #append>
        <q-icon
          name="arrow_downward"
          class="cursor-pointer text-primary"
          size="18px"
          @mousedown.prevent="fetchRate"
        >
          <q-tooltip>{{ t("Get suggested exchange rate (Swiss BAZG)") }}</q-tooltip>
        </q-icon>
      </template>
    </fn-input>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
import { api } from "src/boot/axios";

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: "",
  },
  currency: {
    type: String,
    default: "",
  },
  transdate: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  noLabel: {
    type: Boolean,
    default: false,
  },
  bgColor: {
    type: String,
    default: "input",
  },
});

const emit = defineEmits(["update:modelValue"]);

const numericValue = computed(() => {
  if (props.modelValue === "" || props.modelValue == null) return 0;
  const num = Number(props.modelValue);
  return Number.isNaN(num) ? 0 : num;
});

function emitValue(val) {
  const num = typeof val === "number" ? val : parseFloat(val);
  emit("update:modelValue", Number.isNaN(num) ? 0 : num);
}

const fetchRate = async () => {
  const dateStr =
    typeof props.transdate === "string"
      ? props.transdate
      : props.transdate?.value ?? "";
  if (!props.currency?.trim() || !dateStr) {
    Notify.create({
      message: t("Currency and date are required to fetch exchange rate"),
      type: "warning",
      position: "top",
    });
    return;
  }
  try {
    const response = await api.get("/get_exchange_rate", {
      params: { currency: props.currency, transdate: dateStr },
    });
    const rate = response.data?.exchange_rate;
    if (rate != null && !Number.isNaN(Number(rate))) {
      emitValue(Number(rate));
      Notify.create({
        message: t("Exchange rate updated"),
        type: "positive",
        position: "top",
      });
    } else {
      Notify.create({
        message: t("Invalid exchange rate from provider"),
        type: "warning",
        position: "top",
      });
    }
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      t("Failed to fetch exchange rate");
    Notify.create({
      message: msg,
      type: "negative",
      position: "top",
    });
  }
};
</script>

<style scoped>
.exchange-rate-input {
  display: block;
}
</style>
