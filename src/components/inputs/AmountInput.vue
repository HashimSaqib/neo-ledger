<template>
  <div class="input-container" ref="containerRef">
    <q-input
      :model-value="displayValue"
      @update:model-value="onInput"
      @focus="onFocus"
      @blur="onBlur"
      outlined
      dense
      bg-color="input"
      :label="label"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
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
  return isEditing.value ? rawValue.value : formatAmount(props.modelValue);
});

/**
 * Handle focus: switch to editing mode and show the formatted value
 */
function onFocus() {
  isEditing.value = true;
  // Show the same formatted value for editing
  rawValue.value = formatAmount(props.modelValue);
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
  const newVal = parseAmount(rawValue.value);
  emit("update:modelValue", newVal);
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (isEditing.value) {
      rawValue.value = formatAmount(newVal);
    }
  },
);

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
