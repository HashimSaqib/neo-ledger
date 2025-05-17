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
    bg-color="input"
  />
</template>

<script setup>
import { ref, watch } from "vue";

// Define props that mirror q-select’s props plus our custom search/account props
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
   * Custom prop: specify the key to search on when not using account mode.
   * If null, the entire item is used for string-based search.
   */
  search: {
    type: String,
    default: null,
  },
  /**
   * New prop: if true, the search will target "accno" and "label" properties.
   * - If the input starts with a number, it will search on the "accno" property using a startsWith match.
   * - Otherwise, it will search on the "label" property using a substring match.
   * Additionally, the filtered results are sorted from the lowest to the highest accno.
   */
  account: {
    type: Boolean,
    default: false,
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
 * We apply our custom filtering (and sorting when in account mode) here.
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
        if (props.account) {
          // Custom search behavior for account mode:
          const firstChar = val.charAt(0);
          if (/\d/.test(firstChar)) {
            // If input starts with a number, filter on the "accno" property (using startsWith)
            filteredOptions.value = internalOptions.value.filter((option) => {
              if (option && typeof option === "object") {
                const accno = option.accno ? String(option.accno) : "";
                return accno.toLowerCase().startsWith(val.toLowerCase());
              }
              return false;
            });
          } else {
            // If input is text, filter on the "label" property (using includes)
            filteredOptions.value = internalOptions.value.filter((option) => {
              if (option && typeof option === "object") {
                const labelText = option.label ? String(option.label) : "";
                return labelText.toLowerCase().includes(val.toLowerCase());
              }
              return false;
            });
          }
          // Sort the filtered results by accno (lowest to highest)
          filteredOptions.value.sort((a, b) => {
            const aAcc = a && a.accno ? parseInt(a.accno, 10) : Infinity;
            const bAcc = b && b.accno ? parseInt(b.accno, 10) : Infinity;
            return aAcc - bAcc;
          });
        } else {
          // Original search behavior when account mode is off
          const needle = val.toLowerCase();
          filteredOptions.value = internalOptions.value.filter((option) => {
            let text;
            if (props.search && typeof option === "object" && option !== null) {
              text = option[props.search] ? String(option[props.search]) : "";
            } else {
              text = String(option);
            }
            return text.toLowerCase().includes(needle);
          });
        }
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
const qSelectRef = ref(null);
defineExpose({
  focus: () => {
    qSelectRef.value.focus();
  },
  blur: () => {
    qSelectRef.value.blur();
  },
});
function onPopupShow() {
  if (internalValue.value != null && internalValue.value !== "") {
    searchTerm.value = "";
  }
}
</script>
