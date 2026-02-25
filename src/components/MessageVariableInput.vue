<template>
  <div ref="messageInputWrapRef" class="variable-input-wrapper">
    <q-input
      ref="messageInputRef"
      :model-value="currentMessageContent"
      type="textarea"
      autogrow
      outlined
      dense
      :label="label ?? t('Message')"
      hide-bottom-space
      class="q-mb-sm"
      @update:model-value="onMessageInput"
      @keydown="onMessageKeydown"
    />
    <div
      v-show="variableMenuOpen"
      ref="variableDropdownRef"
      class="variable-dropdown"
      @mousedown.prevent
    >
      <q-list dense style="min-width: 200px; max-height: 240px">
        <q-item
          v-for="(v, i) in filteredVariables"
          :key="v"
          clickable
          dense
          :active="variableHighlightedIndex === i"
          active-class="variable-item-active"
          @click="onSelectVariable(v)"
        >
          <q-item-section>{{ v }}</q-item-section>
        </q-item>
        <q-item v-if="!filteredVariables.length" dense>
          <q-item-section class="text-grey">{{
            t("No variables match")
          }}</q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
  <div v-if="!simple" class="row q-gutter-xs">
    <q-btn
      v-for="row in messageRows"
      :key="row.language_code"
      flat
      dense
      no-caps
      size="sm"
      :color="
        activeMessageLanguage === row.language_code ? 'primary' : 'grey-7'
      "
      :label="
        row.language_code + (row.description ? ' · ' + row.description : '')
      "
      @click="$emit('update:activeMessageLanguage', row.language_code)"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  /** Message type key; determines which variable list is available (e.g. 'invoice_send'). */
  type: {
    type: String,
    required: true,
  },
  /** When true, binds to a plain string via v-model and hides language tabs. */
  simple: {
    type: Boolean,
    default: false,
  },
  /** Used when simple=true: the plain string message content. */
  modelValue: {
    type: String,
    default: "",
  },
  /** Rows per language: { language_code, description?, content } */
  messageRows: {
    type: Array,
    default: () => [],
  },
  /** Currently selected language code */
  activeMessageLanguage: {
    type: String,
    default: "",
  },
  /** Input label */
  label: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "update:messageRows",
  "update:activeMessageLanguage",
]);

// Variable sets by type (add new types here)
const VARIABLE_SETS = {
  invoice_send: [
    "invnumber",
    "invdate",
    "duedate",
    "subtotal",
    "total",
    "customer",
    "customeremail",
    "firstname",
    "lastname",
    "salutation",
    "contacttitle",
    "occupation",
    "company",
    "companyaddress1",
    "companyaddress2",
    "companycity",
    "companystate",
    "companycountry",
    "companyzip",
    "companyemail",
    "iban",
    "bic",
    "currency",
    "month",
    "month-1",
    "month+1",
    "year",
  ],
  invoice_fields: ["month", "month-1", "month+1", "year"],
};

const VARIABLES = computed(() => {
  const list = VARIABLE_SETS[props.type] ?? VARIABLE_SETS.invoice_send ?? [];
  return [...list].sort((a, b) => a.localeCompare(b));
});

const messageInputWrapRef = ref(null);
const messageInputRef = ref(null);
const variableDropdownRef = ref(null);
const variableMenuOpen = ref(false);
const variableMenuFilter = ref("");
const variableHighlightedIndex = ref(0);
const variableCaretStart = ref(0);
const variableCaretEnd = ref(0);
const variableContentSnapshot = ref("");

const currentMessageContent = computed({
  get() {
    if (props.simple) return props.modelValue;
    const row = props.messageRows.find(
      (r) => r.language_code === props.activeMessageLanguage,
    );
    return row ? row.content : "";
  },
  set(val) {
    if (props.simple) {
      emit("update:modelValue", val);
      return;
    }
    const rows = props.messageRows.map((r) =>
      r.language_code === props.activeMessageLanguage
        ? { ...r, content: val }
        : { ...r },
    );
    emit("update:messageRows", rows);
  },
});

const filteredVariables = computed(() => {
  const p = variableMenuFilter.value.toLowerCase();
  if (!p) return VARIABLES.value;
  return VARIABLES.value.filter((v) => v.toLowerCase().startsWith(p));
});

function getInputEl() {
  const q = messageInputRef.value;
  if (!q) return null;
  return (
    q.getNativeElement?.() ??
    q.nativeEl ??
    q.$el?.querySelector?.("input") ??
    null
  );
}

function getVariablePartial() {
  const el = getInputEl();
  if (!el) return { partial: "", startIndex: -1, endIndex: 0 };
  const content = el.value ?? "";
  const start = el.selectionStart ?? content.length;
  const beforeCaret = content.slice(0, start);
  const lastBrace = beforeCaret.lastIndexOf("{");
  if (lastBrace === -1) return { partial: "", startIndex: -1, endIndex: start };
  const afterBrace = beforeCaret.slice(lastBrace + 1);
  if (/[}]/.test(afterBrace))
    return { partial: "", startIndex: -1, endIndex: start };
  return { partial: afterBrace, startIndex: lastBrace, endIndex: start };
}

function openVariableMenu() {
  const { partial, startIndex, endIndex } = getVariablePartial();
  if (startIndex === -1) {
    variableMenuOpen.value = false;
    return;
  }
  variableMenuFilter.value = partial;
  variableCaretStart.value = startIndex;
  variableCaretEnd.value = endIndex;
  const el = getInputEl();
  variableContentSnapshot.value = el?.value ?? "";
  variableHighlightedIndex.value = 0;
  variableMenuOpen.value = true;
}

function onMessageInput(val) {
  currentMessageContent.value = val;
  nextTick(() => openVariableMenu());
}

function scrollHighlightedIntoView() {
  nextTick(() => {
    const el = variableDropdownRef.value?.querySelector?.(
      ".variable-item-active",
    );
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}

function onMessageKeydown(e) {
  if (!variableMenuOpen.value) {
    if (e.key === "Escape") variableMenuOpen.value = false;
    return;
  }
  const list = filteredVariables.value;
  const n = list.length;
  if (e.key === "Escape") {
    e.preventDefault();
    variableMenuOpen.value = false;
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    variableHighlightedIndex.value = n
      ? Math.min(variableHighlightedIndex.value + 1, n - 1)
      : 0;
    scrollHighlightedIntoView();
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    variableHighlightedIndex.value = n
      ? Math.max(variableHighlightedIndex.value - 1, 0)
      : 0;
    scrollHighlightedIntoView();
    return;
  }
  if (e.key === "Enter") {
    const idx = variableHighlightedIndex.value;
    if (list[idx]) {
      e.preventDefault();
      onSelectVariable(list[idx]);
    }
  }
}

function onSelectVariable(variableName) {
  const content = variableContentSnapshot.value;
  const start = variableCaretStart.value;
  const end = variableCaretEnd.value;
  const beforeCaret = content.slice(0, start);
  const afterCaret = content.slice(end);
  const newContent = beforeCaret + "{" + variableName + "} " + afterCaret;

  if (props.simple) {
    emit("update:modelValue", newContent);
  } else {
    const row = props.messageRows.find(
      (r) => r.language_code === props.activeMessageLanguage,
    );
    if (!row) return;
    const rows = props.messageRows.map((r) =>
      r.language_code === props.activeMessageLanguage
        ? { ...r, content: newContent }
        : { ...r },
    );
    emit("update:messageRows", rows);
  }

  variableMenuOpen.value = false;
  variableMenuFilter.value = "";
  nextTick(() => {
    const input = getInputEl();
    if (input) {
      const pos = start + variableName.length + 3;
      input.setSelectionRange(pos, pos);
      input.focus();
    }
  });
}

function handleClickOutside(e) {
  const wrap = messageInputWrapRef.value;
  if (variableMenuOpen.value && wrap && !wrap.contains(e.target)) {
    variableMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.variable-input-wrapper {
  position: relative;
}
.variable-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--q-body-bg, #fff);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: auto;
}
.variable-dropdown .variable-item-active {
  background: rgba(25, 118, 210, 0.12);
}
</style>
