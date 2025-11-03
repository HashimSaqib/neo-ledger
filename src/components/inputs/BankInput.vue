<template>
  <div class="input-container">
    <q-input
      :model-value="displayValue"
      @update:model-value="onInput"
      @focus="onFocus"
      @blur="onBlur"
      outlined
      dense
      bg-color="input"
      :label="label"
      :error="hasError"
      :error-message="errorMessage"
      :hint="hint"
      :rules="computedRules"
      :lazy-rules="lazyRules"
      hide-bottom-space
    >
      <template v-slot:append v-if="isValid && displayValue">
        <q-icon name="check_circle" color="positive" />
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  label: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "iban",
    validator: (value) => ["iban", "qriban", "bic"].includes(value),
  },
  required: {
    type: Boolean,
    default: false,
  },
  hint: {
    type: String,
    default: "",
  },
  lazyRules: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "focus", "blur", "validation"]);

const isEditing = ref(false);
const rawValue = ref("");
const hasError = ref(false);
const errorMessage = ref("");
const isValid = ref(false);

const ibanLengths = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  BY: 28,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
};

/**
 * Format value with spaces every 4 characters
 */
const formatWithSpaces = (value) => {
  if (!value) return "";
  const cleaned = value.replace(/\s/g, "").toUpperCase();
  return cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
};

/**
 * Clean value (remove spaces, uppercase)
 */
const cleanValue = (value) => {
  if (!value) return "";
  return value.replace(/\s/g, "").toUpperCase();
};

/**
 * Display value with formatting
 */
const displayValue = computed(() => {
  if (isEditing.value) {
    return rawValue.value;
  }
  return props.modelValue ? formatWithSpaces(props.modelValue) : "";
});

/**
 * Validate IBAN using mod-97 algorithm
 */
const validateIbanChecksum = (iban) => {
  const cleaned = cleanValue(iban);

  // Rearrange: move first 4 chars to end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  const numeric = rearranged.replace(/[A-Z]/g, (char) => {
    return char.charCodeAt(0) - 55; // A=65, so 65-55=10
  });

  // Calculate mod 97
  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = (parseInt(block, 10) % 97) + remainder.slice(block.length);
  }

  return parseInt(remainder, 10) % 97 === 1;
};

/**
 * Validate IBAN format and checksum
 */
const validateIban = (value) => {
  if (!value) {
    return { valid: true, error: "" }; // Empty is valid if not required
  }

  const cleaned = cleanValue(value);

  // Check basic format
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) {
    return {
      valid: false,
      error: "Invalid IBAN format (must start with 2 letters, 2 digits)",
    };
  }

  // Check length
  if (cleaned.length < 15 || cleaned.length > 34) {
    return {
      valid: false,
      error: "IBAN length must be between 15 and 34 characters",
    };
  }

  // Get country code
  const countryCode = cleaned.slice(0, 2);

  // Check country-specific length
  if (ibanLengths[countryCode]) {
    if (cleaned.length !== ibanLengths[countryCode]) {
      return {
        valid: false,
        error: `Invalid IBAN length for ${countryCode} (expected ${ibanLengths[countryCode]} characters)`,
      };
    }
  }

  // Validate checksum
  if (!validateIbanChecksum(cleaned)) {
    return { valid: false, error: "Invalid IBAN checksum" };
  }

  return { valid: true, error: "", formatted: cleaned };
};

/**
 * Validate QR-IBAN (Switzerland specific)
 */
const validateQrIban = (value) => {
  if (!value) {
    return { valid: true, error: "" }; // Empty is valid if not required
  }

  const cleaned = cleanValue(value);

  // Must be Swiss IBAN
  if (!cleaned.startsWith("CH") && !cleaned.startsWith("LI")) {
    return {
      valid: false,
      error: "QR-IBAN must be a Swiss (CH) or Liechtenstein (LI) IBAN",
    };
  }

  // Must be exactly 21 characters
  if (cleaned.length !== 21) {
    return { valid: false, error: "QR-IBAN must be exactly 21 characters" };
  }

  // Extract QR-IID (positions 5-9, after country code and check digits)
  const qrIid = parseInt(cleaned.slice(4, 9), 10);

  // QR-IID must be in range 30000-31999
  if (qrIid < 30000 || qrIid > 31999) {
    return {
      valid: false,
      error: "Invalid QR-IBAN institution ID (must be 30000-31999)",
    };
  }

  // Validate checksum using standard IBAN validation
  if (!validateIbanChecksum(cleaned)) {
    return { valid: false, error: "Invalid QR-IBAN checksum" };
  }

  return { valid: true, error: "", formatted: cleaned };
};

/**
 * Validate BIC/SWIFT code
 */
const validateBic = (value) => {
  if (!value) {
    return { valid: true, error: "" }; // Empty is valid if not required
  }

  const cleaned = cleanValue(value);

  // Check length (8 or 11 characters)
  if (cleaned.length !== 8 && cleaned.length !== 11) {
    return { valid: false, error: "BIC must be 8 or 11 characters" };
  }

  // Check format: AAAABBCCXXX
  // Bank Code (4 letters) + Country Code (2 letters) + Location Code (2 alphanumeric) + Branch Code (3 alphanumeric, optional)
  const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  if (!bicRegex.test(cleaned)) {
    return { valid: false, error: "Invalid BIC format (must be AAAABBCCXXX)" };
  }

  return { valid: true, error: "", formatted: cleaned };
};

/**
 * Main validation function
 */
const validate = (value) => {
  let result;

  switch (props.type) {
    case "iban":
      result = validateIban(value);
      break;
    case "qriban":
      result = validateQrIban(value);
      break;
    case "bic":
      result = validateBic(value);
      break;
    default:
      result = { valid: true, error: "" };
  }

  // Check required
  if (props.required && !value) {
    result = {
      valid: false,
      error: `${props.label || props.type.toUpperCase()} is required`,
    };
  }

  hasError.value = !result.valid;
  errorMessage.value = result.error;
  isValid.value = result.valid && !!value;

  emit("validation", { valid: result.valid, error: result.error });

  return result;
};

/**
 * Computed rules for q-input
 */
const computedRules = computed(() => {
  if (!props.required && !rawValue.value && !props.modelValue) {
    return [];
  }

  return [
    (val) => {
      const result = validate(val || props.modelValue);
      return result.valid || result.error;
    },
  ];
});

/**
 * Handle focus
 */
const onFocus = () => {
  isEditing.value = true;
  rawValue.value = props.modelValue;
  emit("focus");
};

/**
 * Handle blur
 */
const onBlur = () => {
  isEditing.value = false;
  const cleaned = cleanValue(rawValue.value);
  const result = validate(cleaned);

  if (result.valid && result.formatted) {
    emit("update:modelValue", result.formatted);
  } else if (cleaned) {
    emit("update:modelValue", cleaned);
  } else {
    emit("update:modelValue", "");
  }

  emit("blur");
};

/**
 * Handle input change
 */
const onInput = (value) => {
  rawValue.value = value;
};

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (!isEditing.value && newValue) {
      validate(newValue);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
