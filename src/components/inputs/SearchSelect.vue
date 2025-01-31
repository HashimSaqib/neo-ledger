<template>
  <q-select
    ref="qSelectRef"
    v-model="internalValue"
    :label="label"
    :options="filteredOptions"
    use-input
    input-debounce="0"
    :auto-select-first="true"
    v-model:input-value="searchTerm"
    @filter="onFilter"
    @popup-show="onPopupShow"
    outlined
    dense
    :multiple="multiple"
    clearable
    fill-input
    hide-selected
    :emit-value="emitValue"
    :map-options="mapOptions"
    class="lightbg maintext"
  />
</template>

<script setup>
import { ref, watch } from "vue";

// Define props that mirror q-select’s props + our custom search
const props = defineProps({
  modelValue: {
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: "",
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  emitValue: {
    type: Boolean,
    default: false,
  },
  mapOptions: {
    type: Boolean,
    default: false,
  },
  /**
   * Our custom prop:
   * - If your options are objects,
   *   specify the key that should be used for searching.
   * - If null, it falls back to a string-based search of the entire item.
   */
  search: {
    type: String,
    default: null,
  },
});

// Emit the usual v-model event
const emit = defineEmits(["update:modelValue"]);

// internalValue is our local copy of the v-model
const internalValue = ref(props.modelValue);

// Keep internalValue in sync with the incoming prop
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal;
  }
);

// Whenever local changes, emit to the parent
watch(internalValue, (newVal) => {
  emit("update:modelValue", newVal);
});

// Keep an internal copy of the original options
const internalOptions = ref([...props.options]);
watch(
  () => props.options,
  (newVal) => {
    internalOptions.value = [...newVal];
  },
  { deep: true }
);

// The filtered list that we pass to <q-select>
const filteredOptions = ref([...props.options]);

// A separate ref for the text that is displayed in the input while searching
const searchTerm = ref("");

/**
 * The filter event from <q-select> passes (val, update).
 * We do our custom filtering here—no separate file needed.
 */
function onFilter(val, update) {
  // Keep track of what the user typed
  searchTerm.value = val;

  update(
    () => {
      if (!val) {
        // If the search box is cleared, show all options
        filteredOptions.value = internalOptions.value;
      } else {
        // Convert the user's search text to lowercase
        const needle = val.toLowerCase();

        filteredOptions.value = internalOptions.value.filter((option) => {
          let text;
          if (props.search && typeof option === "object" && option !== null) {
            // If the search doesn't exist on this option, use empty string
            text = option[props.search] ? String(option[props.search]) : "";
          } else {
            // Otherwise, treat the entire item as a string
            text = String(option);
          }
          return text.toLowerCase().includes(needle);
        });
      }
    },
    // Second argument to update: function to manipulate QSelect's ref
    (ref) => {
      if (val !== "" && filteredOptions.value.length > 0) {
        ref.setOptionIndex(-1); // Reset option index
        ref.moveOptionSelection(1, true); // Focus the first option
      }
    }
  );
}
function onPopupShow() {
  if (internalValue.value != null && internalValue.value !== "") {
    searchTerm.value = "";
  }
}
</script>
