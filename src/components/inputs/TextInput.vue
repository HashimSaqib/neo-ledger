<template>
  <div class="input-container">
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
  gap: 0.5rem;
}

.input-label {
  font-weight: 600;
  color: #65758b;
}
</style>
