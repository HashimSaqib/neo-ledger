<template>
  <q-input
    :label="label"
    :model-value="displayValue"
    @update:model-value="onInput"
    @focus="onFocus"
    @blur="onBlur"
    outlined
    dense
  />
</template>

<script setup>
import { ref, computed } from "vue";
import { formatAmount } from "src/helpers/utils";

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

/**
 * displayValue is what we actually pass to <q-input>.
 * - When not editing, we show a formatted string.
 * - When editing, we show the raw numeric string (unformatted).
 */
const displayValue = computed(() => {
  return isEditing.value ? rawValue.value : formatAmount(props.modelValue); // Your custom format function
});

/**
 * Handle focus: switch to editing mode and show raw numeric string
 */
function onFocus() {
  isEditing.value = true;
  rawValue.value = props.modelValue.toString();
}

/**
 * Handle blur: parse the user’s input, fallback to 0 if invalid,
 * then emit the new value to the parent.
 */
function onBlur() {
  isEditing.value = false;
  const parsed = parseFloat(rawValue.value.replace(/[^0-9.-]/g, ""));
  const newVal = isNaN(parsed) ? 0 : parsed;
  emit("update:modelValue", newVal);
}

/**
 * Sync the rawValue as user types (when focused).
 */
function onInput(value) {
  rawValue.value = value;
}
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
