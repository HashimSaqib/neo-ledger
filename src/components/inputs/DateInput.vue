<template>
  <div class="input-container">
    <q-input
      :model-value="displayValue"
      @update:model-value="onInput"
      @focus="onFocus"
      @blur="onBlur"
      outlined
      dense
      type="date"
      :label="label"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

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
 * - When editing, we show the raw value the user is typing.
 */
const displayValue = computed(() => {
  return isEditing.value ? rawValue.value : props.modelValue;
});

/**
 * Handle focus: switch to editing mode and show the formatted value
 */
function onFocus() {
  isEditing.value = true;
  // Show the same formatted value for editing
  rawValue.value = props.modelValue;
}

/**
 * Handle blur: parse the user's input and emit the new value
 */
function onBlur() {
  isEditing.value = false;
  emit("update:modelValue", rawValue.value);
}

/**
 * Sync the rawValue as user types (when focused).
 */
function onInput(value) {
  rawValue.value = value;
}
</script>

<style></style>
