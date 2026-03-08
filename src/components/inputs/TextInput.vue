<template>
  <div class="input-container">
    <label v-if="label && !noLabel" class="input-label">{{ label }}</label>
    <q-input
      :model-value="displayValue"
      @update:model-value="onInput"
      @focus="onFocus"
      @blur="onBlur"
      outlined
      dense
      :type="type"
      :autogrow="autogrow"
      :rows="rows"
      bg-color="input"
      :placeholder="placeholder"
      :disable="disable"
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
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  inlinelabel: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "text",
  },
  autogrow: {
    type: Boolean,
    default: false,
  },
  rows: {
    type: Number,
    default: 1,
  },
  noLabel: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "",
  },
  disable: {
    type: Boolean,
    default: false,
  },
});

/**
 * Emits:
 * - update:modelValue: standard event for v-model
 */
const emit = defineEmits(["update:modelValue", "focus", "blur"]);

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
  emit("focus");
}

/**
 * Handle blur: parse the user's input and emit the new value
 */
function onBlur() {
  isEditing.value = false;
  emit("update:modelValue", rawValue.value);
  emit("blur");
}

/**
 * Sync the rawValue as user types (when focused).
 */
function onInput(value) {
  rawValue.value = value;
}
</script>

<style>
.input-container {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.input-label {
  font-size: 0.8rem;
  margin-bottom: 0px;
  font-weight: 400;
  color: #2b2b2b;
}
</style>
