<template>
  <s-select
    v-model="internalValue"
    :options="countries"
    :label="label"
    :outlined="outlined"
    :dense="dense"
    :required="required"
    :clearable="clearable"
    :disable="disable"
    :readonly="readonly"
    option-label="name"
    option-value="code"
    search="name"
    map-options
    emit-value
    :class="customClass"
  >
    <template v-if="$slots.prepend" v-slot:prepend>
      <slot name="prepend"></slot>
    </template>
    <template v-if="$slots.append" v-slot:append>
      <slot name="append"></slot>
    </template>
  </s-select>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { countries } from "src/helpers/countries";
import neoledgerConfig from "../../../neoledger.json";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "Country",
  },
  outlined: {
    type: Boolean,
    default: true,
  },
  dense: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  disable: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const internalValue = ref(props.modelValue);

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    internalValue.value = newValue;
  }
);

// Watch for internal changes and emit to parent
watch(internalValue, (newValue) => {
  emit("update:modelValue", newValue);
});
</script>
