<template>
  <div class="input-container" ref="containerRef">
    <label v-if="label && !noLabel" class="input-label">{{ label }}</label>
    <q-input
      :model-value="displayValue"
      @update:model-value="onInput"
      @focus="onFocus"
      @blur="onBlur"
      outlined
      dense
      bg-color="input"
      :placeholder="placeholder"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { LocalStorage } from "quasar";
import { formatAmount, parseAmount } from "src/helpers/utils";

/**
 * Props:
 * - modelValue: numeric value from the parent
 * - label: input label
 */
const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  label: {
    type: String,
    default: "",
  },
  inlinelabel: {
    type: Boolean,
    default: false,
  },
  noLabel: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "",
  },
  emitOnInput: {
    type: Boolean,
    default: false,
  },
  disableRounding: {
    type: Boolean,
    default: false,
  },
});

/**
 * Emits:
 * - update:modelValue: standard event for v-model
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * Internal state
 */
const isEditing = ref(false);
const rawValue = ref("");
const containerRef = ref(null);

/**
 * displayValue is what we actually pass to <q-input>.
 * - When not editing, we show a formatted string.
 * - When editing, we show the raw value the user is typing.
 */
const displayValue = computed(() => {
  if (isEditing.value) return rawValue.value;
  return props.disableRounding
    ? stringifyValue(props.modelValue)
    : formatAmount(props.modelValue);
});

/**
 * Handle focus: switch to editing mode and show the formatted value
 */
function onFocus() {
  isEditing.value = true;
  rawValue.value = props.disableRounding
    ? stringifyValue(props.modelValue)
    : formatAmount(props.modelValue);
}

/**
 * Handle blur: parse the user's input and emit the new value.
 * If focus moved to an element inside this component (e.g. the append icon),
 * skip the emit so an external modelValue update isn't overwritten.
 */
function onBlur(event) {
  const relatedTarget = event.relatedTarget;
  if (
    relatedTarget &&
    containerRef.value &&
    containerRef.value.contains(relatedTarget)
  ) {
    return;
  }
  isEditing.value = false;
  const newVal = parseInputValue(rawValue.value);
  emit("update:modelValue", newVal);
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (isEditing.value) {
      rawValue.value = props.disableRounding
        ? stringifyValue(newVal)
        : formatAmount(newVal);
    }
  },
);

/**
 * Sync the rawValue as user types (when focused).
 */
function onInput(value) {
  rawValue.value = value;
  if (props.emitOnInput) {
    emit("update:modelValue", parseInputValue(value));
  }
}

function stringifyValue(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return String(value);
  const parsed = Number(value);
  return Number.isNaN(parsed) ? String(value) : String(parsed);
}

function parseInputValue(value) {
  if (!props.disableRounding) return parseAmount(String(value ?? ""));
  return parseAmountWithoutRounding(value);
}

function parseAmountWithoutRounding(amountValue) {
  if (amountValue === null || amountValue === undefined || amountValue === "") {
    return 0;
  }

  if (typeof amountValue === "number") {
    return Number.isNaN(amountValue) ? 0 : amountValue;
  }

  const amountString = String(amountValue);
  const numberFormat = LocalStorage.getItem("numberFormat") || "1,000.00";
  let parsed;

  switch (numberFormat) {
    case "1,000.00":
      parsed = parseFloat(amountString.replace(/,/g, ""));
      break;
    case "1'000.00":
      parsed = parseFloat(amountString.replace(/'/g, ""));
      break;
    case "1.000,00":
      parsed = parseFloat(amountString.replace(/\./g, "").replace(/,/g, "."));
      break;
    case "1000,00":
      parsed = parseFloat(amountString.replace(/,/g, "."));
      break;
    case "1000.00":
      parsed = parseFloat(amountString);
      break;
    default:
      parsed = parseFloat(amountString.replace(/,/g, ""));
      break;
  }

  return Number.isNaN(parsed) ? 0 : parsed;
}
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
