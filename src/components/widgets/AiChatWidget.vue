<template>
  <div
    class="ai-chat-widget"
    :class="{
      'ai-chat-widget--dragging': isDragging,
      'ai-chat-widget--fullscreen': fullscreen,
    }"
  >
    <!-- Header -->
    <div class="widget-header" @mousedown="onHeaderMousedown">
      <div class="widget-header__left">
        <div class="brand">
          <q-icon name="auto_awesome" size="18px" class="brand-icon" />
        </div>
        <div class="title-block">
          <span class="widget-title">{{ t("AI Assistant") }}</span>
          <span class="widget-subtitle">{{ subtitle }}</span>
        </div>
      </div>

      <div class="widget-header__right">
        <!-- Model selector -->
        <s-select
          v-model="selectedModelKey"
          :options="flatModelOptions"
          :disable="!flatModelOptions.length"
          class="model-picker"
          dense
          emit-value
          map-options
          option-label="label"
          option-value="value"
          search="label"
          :placeholder="t('Select model')"
        />

        <q-btn
          flat
          round
          dense
          size="sm"
          :icon="fullscreen ? 'fullscreen_exit' : 'fullscreen'"
          class="header-btn"
          @click="toggleFullscreen"
        >
          <q-tooltip>{{
            fullscreen ? t("Exit fullscreen") : t("Fullscreen")
          }}</q-tooltip>
        </q-btn>

        <q-btn flat round dense size="sm" icon="more_vert" class="header-btn">
          <q-menu>
            <q-list style="min-width: 170px">
              <q-item
                clickable
                v-close-popup
                :disable="messages.length === 0 && !isStreaming"
                @click="clearConversation"
              >
                <q-item-section avatar>
                  <q-icon name="restart_alt" size="18px" />
                </q-item-section>
                <q-item-section>{{ t("Clear conversation") }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="refreshConfig">
                <q-item-section avatar>
                  <q-icon name="refresh" size="18px" />
                </q-item-section>
                <q-item-section>{{ t("Reload models") }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item
                clickable
                v-close-popup
                @click="$emit('toggleVisibility')"
              >
                <q-item-section avatar>
                  <q-icon name="visibility_off" size="18px" />
                </q-item-section>
                <q-item-section>{{ t("Hide") }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-icon v-if="!fullscreen" name="drag_indicator" class="drag-handle" />
      </div>
    </div>

    <!-- Conversation -->
    <div
      ref="scrollRef"
      class="chat-scroll"
      :class="{ 'chat-scroll--empty': isEmptyState }"
    >
      <!-- Empty state -->
      <div v-if="isEmptyState" class="empty-state">
        <div class="empty-icon-wrap">
          <q-icon name="auto_awesome" size="28px" />
        </div>
        <h4 class="empty-title">{{ t("Ask me anything") }}</h4>
        <p class="empty-desc">
          {{
            t(
              "I can answer questions about your ledger data. I only share natural-language answers — never raw rows or SQL.",
            )
          }}
        </p>

        <div class="suggestions">
          <button
            v-for="s in suggestions"
            :key="s"
            type="button"
            class="suggestion-chip"
            :disabled="!configReady || isStreaming"
            @click="useSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <template v-else>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message"
          :class="[`message--${msg.role}`, { 'message--error': msg.error }]"
        >
          <div class="message__avatar" v-if="msg.role === 'assistant'">
            <q-icon name="auto_awesome" size="14px" />
          </div>

          <div class="message__body">
            <!-- Status line (only on the currently streaming assistant message) -->
            <div
              v-if="
                msg.role === 'assistant' &&
                idx === messages.length - 1 &&
                isStreaming &&
                statusText
              "
              class="message__status"
            >
              <span class="status-dot" />
              {{ statusText }}
            </div>

            <div
              v-if="msg.role === 'assistant'"
              class="message__content"
              v-html="renderMarkdown(msg)"
            />
            <div v-else class="message__content message__content--plain">
              {{ msg.content }}
            </div>

            <!-- Message-level actions: copy raw markdown, and (when the
                 response contains one or more tables) export as PDF / Excel. -->
            <div
              v-if="
                msg.role === 'assistant' &&
                msg.content &&
                !(idx === messages.length - 1 && isStreaming)
              "
              class="message__actions"
            >
              <q-btn
                flat
                dense
                size="xs"
                no-caps
                class="message__copy-btn"
                :icon="copiedIdx === idx ? 'check' : 'content_copy'"
                :label="copiedIdx === idx ? t('Copied') : t('Copy')"
                @click="copyMessageMarkdown(msg, idx)"
              >
                <q-tooltip>{{ t("Copy raw markdown") }}</q-tooltip>
              </q-btn>

              <q-btn
                v-if="msg.tableCount > 0"
                flat
                dense
                size="xs"
                no-caps
                class="message__copy-btn"
                icon="picture_as_pdf"
                :label="t('Export PDF')"
                @click="exportMessageTablesPdf(msg)"
              >
                <q-tooltip>{{ t("Export tables as PDF") }}</q-tooltip>
              </q-btn>

              <q-btn
                v-if="msg.tableCount > 0"
                flat
                dense
                size="xs"
                no-caps
                class="message__copy-btn"
                icon="table_view"
                :label="t('Export Excel')"
                @click="exportMessageTablesExcel(msg)"
              >
                <q-tooltip>{{ t("Export tables as Excel") }}</q-tooltip>
              </q-btn>
            </div>

            <!-- Clarify prompt -->
            <div v-if="msg.clarify" class="message__clarify">
              <q-icon name="help_outline" size="14px" />
              <span>{{ msg.clarify }}</span>
            </div>

            <!-- Streaming indicator: three subtle pulsing dots -->
            <span
              v-if="
                msg.role === 'assistant' &&
                idx === messages.length - 1 &&
                isStreaming
              "
              class="typing-indicator"
              :class="{ 'typing-indicator--standalone': !msg.content }"
              aria-label="Assistant is typing"
              role="status"
            >
              <span class="typing-dot" />
              <span class="typing-dot" />
              <span class="typing-dot" />
            </span>
          </div>
        </div>
      </template>
    </div>

    <!-- Composer -->
    <div class="composer">
      <div class="composer__inner">
        <textarea
          ref="inputRef"
          v-model="draft"
          class="composer__textarea"
          :placeholder="
            configReady
              ? t('Message the assistant…')
              : t('Loading assistant configuration…')
          "
          :rows="1"
          :disabled="!configReady"
          @input="autosize"
          @keydown.enter.exact.prevent="onSubmit"
          @keydown.enter.shift.exact="onShiftEnter"
        />

        <div class="composer__actions">
          <span class="composer__hint">{{
            t("Enter to send · Shift+Enter for newline")
          }}</span>

          <s-btn
            v-if="isStreaming"
            type="destructive"
            icon="stop"
            :label="t('Stop')"
            class="composer__action-btn"
            @click="abortStream"
          />
          <s-btn
            v-else
            type="primary"
            icon="arrow_upward"
            :label="t('Send')"
            :disable="!canSend"
            class="composer__action-btn"
            @click="onSubmit"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { Notify } from "quasar";
import { isAxiosError } from "axios";
import { api } from "src/boot/axios";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { utils as xlsxUtils, writeFile as xlsxWriteFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatAmount, formatDate, PDF_STYLES } from "src/helpers/utils";

const { t } = useI18n();
const route = useRoute();

const props = defineProps({
  isDragging: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "dragStart",
  "dragEnd",
  "refresh",
  "toggleVisibility",
]);

// Fullscreen state
const fullscreen = ref(false);
const toggleFullscreen = () => {
  fullscreen.value = !fullscreen.value;
  nextTick(scrollToBottom);
};

// Config
const configLoading = ref(false);
const configReady = ref(false);
const providersConfig = ref([]); // array of providers with models
const statementTimeout = ref(null);
const defaultProvider = ref(null);
const defaultModel = ref(null);
const selectedProvider = ref(null);
const selectedModel = ref(null);

const mapToModel = (m) => {
  if (typeof m === "string") return { id: m, label: m };
  if (!m || typeof m !== "object") return null;
  const id = m.id || m.model_id || m.name;
  if (!id) return null;
  return { id, label: m.label || m.name || m.id || id };
};

/** Unwrap common API envelope shapes so `normalizeConfig` always sees a flat object. */
const unwrapAiConfig = (data) => {
  if (data == null || typeof data !== "object") return data;
  if (
    data.data != null &&
    typeof data.data === "object" &&
    !Array.isArray(data.data)
  ) {
    const inner = data.data;
    if (
      "providers" in inner ||
      "models" in inner ||
      "default_model" in inner ||
      "default_provider" in inner ||
      "available_models" in inner
    ) {
      return inner;
    }
  }
  if (data.config != null && typeof data.config === "object")
    return data.config;
  if (data.result != null && typeof data.result === "object")
    return data.result;
  return data;
};

// Normalize config response into a predictable shape.
// Accepts:
//   { providers: [{ id, models: [{id,label?}|string] }], default_provider, default_model, statement_timeout }
// or flat:
//   { providers: ["claude","gpt"], models: { claude:[...], gpt:[...] } }
// or:
//   { models: { claude: [...] } } without `providers` (inferred)
// or:
//   { available_models: [{ provider, id, label? }] }
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== "object") return;

  const out = [];

  if (Array.isArray(raw.providers) && raw.providers.length) {
    for (const p of raw.providers) {
      if (typeof p === "string") {
        const models = Array.isArray(raw.models?.[p]) ? raw.models[p] : [];
        out.push({
          id: p,
          models: models.map(mapToModel).filter(Boolean),
        });
      } else if (p && typeof p === "object" && (p.id || p.provider)) {
        const pid = p.id || p.provider;
        const models = Array.isArray(p.models) ? [...p.models] : [];
        if (models.length === 0 && p.default_model) {
          models.push({ id: p.default_model, label: p.default_model });
        }
        out.push({
          id: pid,
          models: models.map(mapToModel).filter(Boolean),
        });
      }
    }
  }

  if (
    out.length === 0 &&
    raw.models &&
    typeof raw.models === "object" &&
    !Array.isArray(raw.models)
  ) {
    for (const [id, list] of Object.entries(raw.models)) {
      if (!Array.isArray(list)) continue;
      out.push({ id, models: list.map(mapToModel).filter(Boolean) });
    }
  }

  if (
    out.length === 0 &&
    Array.isArray(raw.available_models) &&
    raw.available_models.length
  ) {
    const byProvider = new Map();
    for (const row of raw.available_models) {
      if (!row || typeof row !== "object") continue;
      const pid = row.provider || row.provider_id || "default";
      if (!byProvider.has(pid)) byProvider.set(pid, []);
      const m = mapToModel(row);
      if (m) byProvider.get(pid).push(m);
    }
    for (const [id, models] of byProvider) {
      if (models.length) out.push({ id, models });
    }
  }

  providersConfig.value = out;
  statementTimeout.value =
    typeof raw.statement_timeout === "number" ? raw.statement_timeout : null;

  const preferredProvider = raw.default_provider;
  defaultProvider.value =
    preferredProvider && out.some((p) => p.id === preferredProvider)
      ? preferredProvider
      : out[0]?.id || null;
  defaultModel.value =
    raw.default_model ||
    out.find((p) => p.id === defaultProvider.value)?.models?.[0]?.id ||
    null;

  if (!selectedProvider.value && defaultProvider.value) {
    selectedProvider.value = defaultProvider.value;
  }
  if (!selectedModel.value && defaultModel.value) {
    selectedModel.value = defaultModel.value;
  }

  const hasAnyModel = out.some((p) => p.models?.length > 0);
  configReady.value = hasAnyModel;
};

const AI_CONFIG_PATHS = ["/ai/chat/config", "/ai/config"];

const loadConfig = async () => {
  configLoading.value = true;
  let lastErr = null;
  try {
    for (const path of AI_CONFIG_PATHS) {
      try {
        const { data } = await api.get(path);
        normalizeConfig(unwrapAiConfig(data));
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    console.error("Failed to load AI chat config:", lastErr);
    configReady.value = false;
  } finally {
    configLoading.value = false;
  }
};

const refreshConfig = () => {
  loadConfig();
};

// Model selector state
const flatModelOptions = computed(() =>
  providersConfig.value.flatMap((p) =>
    p.models.map((m) => ({
      value: `${p.id}:${m.id}`,
      label: `${p.id}-${m.id}`,
      provider: p.id,
      model: m.id,
    })),
  ),
);

const selectedModelKey = computed({
  get() {
    if (!selectedProvider.value || !selectedModel.value) return null;
    return `${selectedProvider.value}:${selectedModel.value}`;
  },
  set(value) {
    if (!value || typeof value !== "string") return;
    const splitIdx = value.indexOf(":");
    if (splitIdx <= 0) return;
    selectedProvider.value = value.slice(0, splitIdx);
    selectedModel.value = value.slice(splitIdx + 1);
  },
});

const activeModelLabel = computed(() => {
  if (!flatModelOptions.value.length) return t("No models");
  const selected = flatModelOptions.value.find(
    (m) => m.value === selectedModelKey.value,
  );
  if (!selected) return t("Select model");
  return selected.label;
});

const subtitle = computed(() => {
  if (configLoading.value) return t("Loading…");
  if (!configReady.value) return t("Offline");
  if (isStreaming.value) return t("Generating…");
  return activeModelLabel.value;
});

// Conversation state
const messages = ref([]); // {role:'user'|'assistant', content:string, error?:bool, clarify?:string}
const draft = ref("");
const isStreaming = ref(false);
const statusText = ref("");
let streamAbort = null;

const isEmptyState = computed(
  () => messages.value.length === 0 && !isStreaming.value,
);

const canSend = computed(
  () =>
    configReady.value && !isStreaming.value && draft.value.trim().length > 0,
);

const suggestions = [
  t("Summarize this month's cash position"),
  t("Show my top customers by outstanding balance"),
  t("What's our year-over-year revenue change?"),
  t("List any overdue invoices over 30 days"),
];

const useSuggestion = (text) => {
  draft.value = text;
  nextTick(() => {
    autosize();
    onSubmit();
  });
};

// Composer refs/autosize
const inputRef = ref(null);
const scrollRef = ref(null);

const autosize = () => {
  const el = inputRef.value;
  if (!el) return;
  el.style.height = "auto";
  const max = fullscreen.value ? 220 : 140;
  el.style.height = Math.min(el.scrollHeight, max) + "px";
};

const onShiftEnter = () => {
  // allow newline; autosize on next tick
  nextTick(autosize);
};

const scrollToBottom = () => {
  const el = scrollRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
};

watch(
  () => messages.value.length,
  () => nextTick(scrollToBottom),
);

// Parse SSE stream chunks: events are separated by a blank line, each event
// has "event: <name>" and "data: <payload>" lines. Payload may be JSON or text.
const parseSseBuffer = (buffer, onEvent) => {
  let idx;
  let remaining = buffer;
  while ((idx = remaining.indexOf("\n\n")) !== -1) {
    const raw = remaining.slice(0, idx);
    remaining = remaining.slice(idx + 2);

    let event = "message";
    const dataLines = [];
    for (const line of raw.split("\n")) {
      if (!line || line.startsWith(":")) continue;
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).replace(/^ /, ""));
      }
    }
    if (dataLines.length === 0 && event === "message") continue;
    const data = dataLines.join("\n");
    onEvent(event, data);
  }
  return remaining;
};

const tryParseJson = (s) => {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const onSubmit = async () => {
  if (!canSend.value) return;

  const userText = draft.value.trim();
  draft.value = "";
  nextTick(autosize);

  // Push user message
  messages.value.push({ role: "user", content: userText });
  // Push an empty assistant placeholder we will stream into
  messages.value.push({ role: "assistant", content: "" });

  await streamChat();
};

const streamChat = async () => {
  isStreaming.value = true;
  statusText.value = t("Preparing…");

  const controller = new AbortController();
  streamAbort = controller;

  const assistantIdx = messages.value.length - 1;

  // Build history payload — strip transient fields
  const history = messages.value
    .slice(0, assistantIdx) // exclude the placeholder assistant
    .map((m) => ({ role: m.role, content: m.content }));

  const body = { messages: history };
  if (selectedProvider.value) body.provider = selectedProvider.value;
  if (selectedModel.value) body.model = selectedModel.value;

  try {
    if (!route.params?.client) {
      throw new Error(
        t("No company context — open a dataset to use the assistant."),
      );
    }

    // Use `api` (same baseURL + session as `api.get`). Raw `fetch` to the
    // absolute API URL often hits CORS; axios GET uses XHR. Streaming needs
    // the fetch adapter + responseType "stream" (see axios 1.15 fetch adapter).
    const response = await api.post("/ai/chat", body, {
      adapter: "fetch",
      responseType: "stream",
      signal: controller.signal,
      headers: {
        Accept: "text/event-stream",
      },
    });

    const stream = response.data;
    if (!stream || typeof stream.getReader !== "function") {
      throw new Error(
        t("Streaming is not supported in this browser. Please try again."),
      );
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    const handleEvent = (event, data) => {
      switch (event) {
        case "status": {
          const parsed = tryParseJson(data);
          const stage =
            (parsed && (parsed.stage || parsed.status || parsed.message)) ||
            data;
          const labels = {
            planning: t("Planning…"),
            querying: t("Querying data…"),
            answering: t("Composing answer…"),
          };
          statusText.value = labels[stage] || stage || t("Working…");
          break;
        }
        // Sent once (right before the first token) when the backend has
        // detected which Markdown table columns should be formatted as
        // amounts. Header names match the Markdown <th> text exactly.
        case "meta": {
          const parsed = tryParseJson(data);
          if (parsed && Array.isArray(parsed.amounts)) {
            messages.value[assistantIdx].amounts = parsed.amounts.filter(
              (n) => typeof n === "string" && n.length > 0,
            );
          }
          break;
        }
        // Many proxies/frameworks use default SSE event name "message" (not "token").
        case "message":
        case "text":
        case "content":
        case "token": {
          const parsed = tryParseJson(data);
          let piece =
            parsed && typeof parsed === "object"
              ? (parsed.token ??
                parsed.text ??
                parsed.content ??
                parsed.delta ??
                parsed.choices?.[0]?.delta?.content ??
                "")
              : data;
          if (!piece && parsed?.choices?.[0]?.delta?.content) {
            piece = parsed.choices[0].delta.content;
          }
          if (piece) {
            messages.value[assistantIdx].content += piece;
            nextTick(scrollToBottom);
          }
          break;
        }
        case "clarify": {
          const parsed = tryParseJson(data);
          const text =
            (parsed && (parsed.question || parsed.message || parsed.text)) ||
            data;
          messages.value[assistantIdx].clarify = text;
          break;
        }
        case "error": {
          const parsed = tryParseJson(data);
          const text =
            (parsed && (parsed.message || parsed.error)) ||
            data ||
            t("An error occurred");
          messages.value[assistantIdx].error = true;
          if (!messages.value[assistantIdx].content) {
            messages.value[assistantIdx].content = text;
          } else {
            messages.value[assistantIdx].content += `\n\n_${text}_`;
          }
          break;
        }
        case "done":
        default:
          break;
      }
    };

    // Read loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      buf = parseSseBuffer(buf, handleEvent);
    }
    // Flush any trailing event
    if (buf.trim()) {
      parseSseBuffer(buf + "\n\n", handleEvent);
    }
  } catch (err) {
    if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") {
      if (!messages.value[assistantIdx].content) {
        messages.value[assistantIdx].content = t("Stopped.");
        messages.value[assistantIdx].error = true;
      }
    } else {
      let msg = t("Failed to reach the assistant. Please try again.");
      if (isAxiosError(err)) {
        const d = err.response?.data;
        if (d && typeof d === "object" && !Array.isArray(d) && d.message) {
          msg = d.message;
        } else if (typeof d === "string" && d.trim()) {
          const parsed = tryParseJson(d);
          msg = parsed?.message || d;
        } else {
          msg = err.message || err.response?.statusText || msg;
        }
      } else {
        msg = err?.message || msg;
      }
      if (!messages.value[assistantIdx].content) {
        messages.value[assistantIdx].content = msg;
      } else {
        messages.value[assistantIdx].content += `\n\n_${msg}_`;
      }
      messages.value[assistantIdx].error = true;
      Notify.create({ type: "negative", message: msg, position: "top" });
    }
  } finally {
    isStreaming.value = false;
    statusText.value = "";
    streamAbort = null;
    nextTick(scrollToBottom);
  }
};

const abortStream = () => {
  if (streamAbort) streamAbort.abort();
};

const clearConversation = () => {
  if (isStreaming.value) abortStream();
  messages.value = [];
};

// Markdown rendering: GFM via `marked` (tables, lists, headings, etc.)
// then sanitized through DOMPurify for safety.
//
// marked v9+ uses token objects for renderer overrides. We keep the default
// renderers for everything except: code blocks (add our own class and language
// label), links (force target=_blank, rel=noopener), and tables (wrap in a
// scrollable container so wide tables don't overflow the widget).
const escapeAttr = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Side-channels used by the `table` renderer. Set by `renderMarkdown` before
// each synchronous `marked.parse` call, cleared immediately after.
//   currentAmountColumns: Set<string> | null — header names to treat as amounts
//   currentTableCache:    Array | null       — accumulator for structured table
//                                              data (one entry per parsed table)
let currentAmountColumns = null;
let currentTableCache = null;

// Cache of structured table data per assistant message. Used by the toolbar
// click handler to regenerate PDF / Excel exports without re-parsing the
// Markdown. WeakMap so entries are GC'd with the message object on reset.
const tableCacheByMsg = new WeakMap();

// ----- Inline value markers ---------------------------------------------
//
// The answer LLM wraps every amount and date in a marker so the frontend
// can apply locale-aware formatting (formatAmount / formatDate) consistently
// in tables, lists, totals, and prose alike:
//
//   Amount: {{amt:41976.34}}, {{amt:-1500}}
//   Date:   {{date:2026-04-01}}   or {{date:2026-04-01T12:34:56}}
//
// The values inside the markers are raw (no separators / no rounding).
// Markers may appear *inside* a link's label text, e.g. `[{{amt:X}}](url)`,
// so we simply replace them as plain text — they aren't Markdown or HTML
// metacharacters, so they survive parse + sanitize untouched.
//
// Use non-greedy matching so multiple markers on the same line are each
// captured individually. The capture group deliberately forbids `}` so
// nested braces don't confuse the match.
const AMT_MARKER_RE = /\{\{amt:([^}]+)\}\}/g;
const DATE_MARKER_RE = /\{\{date:([^}]+)\}\}/g;
const PURE_AMT_MARKER_RE = /^\s*\{\{amt:([^}]+)\}\}\s*$/;

// Replace markers with their display-formatted equivalents, escaping the
// output for safe HTML insertion. Used post-DOMPurify on the already-
// sanitized HTML string.
const applyValueMarkersHtml = (html) => {
  if (!html || (html.indexOf("{{") === -1)) return html;
  return html
    .replace(AMT_MARKER_RE, (_, v) => escapeHtml(formatAmount(String(v).trim())))
    .replace(DATE_MARKER_RE, (_, v) => escapeHtml(formatDate(String(v).trim())));
};

// Replace markers with their display-formatted equivalents as plain text
// (no HTML escaping). Used for the clipboard copy so pasted content
// reflects what the user sees on screen.
const applyValueMarkersText = (text) => {
  if (!text || (text.indexOf("{{") === -1)) return text;
  return String(text)
    .replace(AMT_MARKER_RE, (_, v) => formatAmount(String(v).trim()))
    .replace(DATE_MARKER_RE, (_, v) => formatDate(String(v).trim()));
};

// Decode HTML entities (&amp; &lt; &quot; …) produced by the inline-parsed
// output so exported cells contain real characters rather than escaped ones.
let _entityDecoderEl = null;
const decodeEntities = (s) => {
  if (!s || s.indexOf("&") === -1) return s;
  if (!_entityDecoderEl) _entityDecoderEl = document.createElement("textarea");
  _entityDecoderEl.innerHTML = s;
  return _entityDecoderEl.value;
};

// Best-effort extraction of a plain text representation from a marked token
// cell. Prefers the inline-parsed output (which, thanks to our `link` and
// `codespan` renderers, strips hyperlinks and inline code) over the raw
// Markdown source so exports and amount matching ignore link / backtick
// syntax.
const cellPlainText = (cell, parser) => {
  try {
    const parsed = parser
      .parseInline(cell?.tokens || [])
      .replace(/<[^>]+>/g, "")
      .trim();
    if (parsed) return decodeEntities(parsed);
  } catch {
    /* fall through to raw text */
  }
  if (cell && typeof cell.text === "string") return cell.text.trim();
  return "";
};

// If the cell's raw text is numeric (e.g. "41976.34", "-12.5", "1.2e3"),
// return the formatted amount. Otherwise return null to indicate the
// default inline rendering should be used (keeps "—", "N/A", blanks, etc.
// intact as emitted by the model).
const formatAmountCell = (raw) => {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  // Tolerate a leading sign; reject anything containing separators or
  // currency so we don't double-format values the model already formatted.
  if (!/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return escapeHtml(formatAmount(n));
};

marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }) {
      const language = (lang || "").trim().split(/\s+/)[0];
      const label = language
        ? `<span class="code-lang">${escapeHtml(language)}</span>`
        : "";
      return `<pre class="code-block">${label}<code>${escapeHtml(text)}</code></pre>`;
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const safeHref = typeof href === "string" ? href : "";
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
      return `<a href="${escapeAttr(safeHref)}"${titleAttr} target="_blank" rel="noopener noreferrer">${inner}</a>`;
    },
    table(token) {
      // Resolve which column indexes are amount columns (headers whose
      // plain text exactly matches a name from the backend `meta` event).
      const headerNames = token.header.map((cell) =>
        cellPlainText(cell, this.parser),
      );
      const amountColIdx = new Set();
      if (currentAmountColumns && currentAmountColumns.size) {
        headerNames.forEach((name, i) => {
          if (name && currentAmountColumns.has(name)) amountColIdx.add(i);
        });
      }

      const headerCells = token.header
        .map((cell, i) => {
          const align = token.align?.[i];
          const alignAttr = align ? ` align="${align}"` : "";
          return `<th${alignAttr}>${this.parser.parseInline(cell.tokens)}</th>`;
        })
        .join("");

      // Parallel structured capture for export: per row we keep the raw
      // text and the parsed number (or null) for each cell.
      const structuredRows = [];

      const bodyRows = token.rows
        .map((row) => {
          const rowText = [];
          const rowNum = [];
          const cells = row
            .map((cell, i) => {
              const raw = cellPlainText(cell, this.parser);
              rowText.push(raw);

              // Amount columns are right-aligned even when the Markdown
              // header doesn't explicitly declare it, so numbers line up.
              const align = amountColIdx.has(i) ? "right" : token.align?.[i];
              const alignAttr = align ? ` align="${align}"` : "";

              let content;
              if (amountColIdx.has(i)) {
                const formatted = formatAmountCell(raw);
                if (formatted != null) {
                  // Keep the parsed number for Excel export (raw) and PDF
                  // (formatted via formatAmount).
                  rowNum.push(Number(raw.trim()));
                  content = formatted;
                } else {
                  rowNum.push(null);
                  content = this.parser.parseInline(cell.tokens);
                }
              } else {
                rowNum.push(null);
                content = this.parser.parseInline(cell.tokens);
              }
              return `<td${alignAttr}>${content}</td>`;
            })
            .join("");
          structuredRows.push({ text: rowText, num: rowNum });
          return `<tr>${cells}</tr>`;
        })
        .join("");

      // Record this table in the per-message cache so the message-level
      // export buttons can rebuild PDF / Excel exports without re-parsing.
      if (currentTableCache) {
        currentTableCache.push({
          headers: headerNames,
          amountColIdx: Array.from(amountColIdx),
          rows: structuredRows,
        });
      }

      return `<div class="md-table-wrap"><table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
    },
  },
});

const renderMarkdown = (msg) => {
  if (!msg || !msg.content) return "";
  currentAmountColumns =
    Array.isArray(msg.amounts) && msg.amounts.length
      ? new Set(msg.amounts)
      : null;
  currentTableCache = [];
  try {
    const html = marked.parse(String(msg.content));
    const sanitized = DOMPurify.sanitize(html, {
      ADD_ATTR: ["target", "rel"],
    });
    tableCacheByMsg.set(msg, currentTableCache);
    // Expose table count reactively so the message-level export buttons
    // can show/hide without needing to observe the non-reactive WeakMap.
    // Only write when changed to avoid unnecessary re-renders.
    if (msg.tableCount !== currentTableCache.length) {
      msg.tableCount = currentTableCache.length;
    }
    // Final pass: replace any {{amt:X}} / {{date:X}} markers the model
    // emitted with user-locale-formatted values. Safe to run on the
    // already-sanitized HTML because the marker characters `{}:` are not
    // HTML-significant and formatAmount / formatDate produce plain text.
    return applyValueMarkersHtml(sanitized);
  } finally {
    currentAmountColumns = null;
    currentTableCache = null;
  }
};

// Drag handoff — only trigger drag from the header background, never when the
// user clicks interactive elements (menus, model picker, buttons).
const onHeaderMousedown = (e) => {
  if (fullscreen.value) return;
  const target = e.target;
  if (
    target.closest(".q-btn") ||
    target.closest(".q-menu") ||
    target.closest(".model-picker") ||
    target.closest(".header-btn")
  ) {
    return;
  }
  emit("dragStart", e);
  // If the user mouses up without actually starting a drag, notify the
  // parent so it can restore the non-draggable state (otherwise text
  // selection elsewhere in the widget would be hijacked by HTML5 drag).
  const cleanup = () => {
    window.removeEventListener("mouseup", cleanup);
    window.removeEventListener("dragend", cleanup);
    emit("dragEnd");
  };
  window.addEventListener("mouseup", cleanup, { once: true });
  window.addEventListener("dragend", cleanup, { once: true });
};

// --- Message-level table exports (PDF / Excel) ---------------------------
//
// The `table` markdown renderer captures a structured copy of each parsed
// table into a per-message cache (`tableCacheByMsg`). Clicking the export
// buttons next to the Copy button regenerates PDF / Excel from that cache.
// When a message contains multiple tables we put each on its own PDF page /
// its own Excel sheet.

const tableExportFileBase = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `ai-assistant-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
    d.getDate(),
  )}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

// Convert a raw cell (potentially containing {{amt:X}} and/or {{date:X}}
// markers) into an Excel value. If the entire cell is a single amount
// marker we return a JS number so Excel treats the column as numeric.
// Otherwise the cell becomes a string with markers replaced: amounts
// stay raw (no thousand separators, no rounding) so analysts can still
// parse them, and dates are locale-formatted. Non-marker cells fall back
// to the legacy per-column numeric parsing (kept for backwards compat
// with any pre-marker backend responses).
const excelCellValue = (text, isAmountCol, fallbackNum) => {
  const s = String(text ?? "");
  if (!s) return "";

  const pureAmt = s.match(PURE_AMT_MARKER_RE);
  if (pureAmt) {
    const n = Number(String(pureAmt[1]).trim());
    if (Number.isFinite(n)) return n;
  }

  const hasAnyMarker = s.indexOf("{{") !== -1;
  if (!hasAnyMarker && isAmountCol && fallbackNum != null) {
    return fallbackNum;
  }

  return s
    .replace(AMT_MARKER_RE, (_, v) => String(v).trim())
    .replace(DATE_MARKER_RE, (_, v) => formatDate(String(v).trim()));
};

// Convert a raw cell into its PDF string. All markers are substituted
// with the user-locale formatted value (same as what's shown in chat),
// so the exported PDF mirrors the on-screen response.
const pdfCellValue = (text, isAmountCol, fallbackNum) => {
  const s = String(text ?? "");
  if (!s) return "";

  const hasAnyMarker = s.indexOf("{{") !== -1;
  if (!hasAnyMarker && isAmountCol && fallbackNum != null) {
    return formatAmount(fallbackNum);
  }

  return s
    .replace(AMT_MARKER_RE, (_, v) => formatAmount(String(v).trim()))
    .replace(DATE_MARKER_RE, (_, v) => formatDate(String(v).trim()));
};

const buildExcelRows = (table) => {
  const amountSet = new Set(table.amountColIdx);
  const header = table.headers.slice();
  const body = table.rows.map((row) =>
    row.text.map((text, i) =>
      excelCellValue(text, amountSet.has(i), row.num[i]),
    ),
  );
  return { header, body };
};

const buildPdfRows = (table) => {
  const amountSet = new Set(table.amountColIdx);
  const header = table.headers.slice();
  const body = table.rows.map((row) =>
    row.text.map((text, i) =>
      pdfCellValue(text, amountSet.has(i), row.num[i]),
    ),
  );
  return { header, body };
};

// Excel export: amount columns are written as raw numbers (so Excel can
// sum/average them); everything else is written as plain text. One sheet
// per table in the message.
const exportMessageTablesExcel = (msg) => {
  const tables = tableCacheByMsg.get(msg);
  if (!tables || !tables.length) return;
  try {
    const book = xlsxUtils.book_new();
    tables.forEach((table, i) => {
      const { header, body } = buildExcelRows(table);
      const aoa = [header, ...body];
      const sheet = xlsxUtils.aoa_to_sheet(aoa);

      sheet["!cols"] = header.map((h, col) => {
        let max = String(h ?? "").length;
        for (const row of body) {
          const v = row[col];
          const len = v == null ? 0 : String(v).length;
          if (len > max) max = len;
        }
        return { wch: Math.min(max + 2, 60) };
      });

      const name = tables.length === 1 ? "Table" : `Table ${i + 1}`;
      xlsxUtils.book_append_sheet(book, sheet, name);
    });
    xlsxWriteFile(book, `${tableExportFileBase()}.xlsx`, {
      compression: true,
    });
  } catch (err) {
    Notify.create({
      type: "negative",
      message: t("Failed to export Excel"),
      position: "top",
    });
  }
};

// PDF export: amount columns are formatted via formatAmount (matching the
// in-chat rendering) and right-aligned. Uses the shared PDF_STYLES so the
// output looks consistent with the rest of the app's reports. Each table
// is stacked vertically on the same PDF, with its number as a subtitle
// when there is more than one.
const exportMessageTablesPdf = (msg) => {
  const tables = tableCacheByMsg.get(msg);
  if (!tables || !tables.length) return;
  try {
    const doc = new jsPDF({ orientation: "landscape" });
    let startY = 15;

    tables.forEach((table, i) => {
      const { header, body } = buildPdfRows(table);
      const amountSet = new Set(table.amountColIdx);
      const columnStyles = {};
      amountSet.forEach((col) => {
        columnStyles[col] = { halign: "right" };
      });

      if (tables.length > 1) {
        doc.setFontSize(PDF_STYLES.subtitle.fontSize);
        doc.text(`${t("Table")} ${i + 1}`, 15, startY);
        startY += 6;
      }

      autoTable(doc, {
        head: [header],
        body,
        startY,
        margin: { left: 15, right: 15 },
        ...PDF_STYLES.transactionTable,
        columnStyles,
      });

      startY = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`${tableExportFileBase()}.pdf`);
  } catch (err) {
    Notify.create({
      type: "negative",
      message: t("Failed to export PDF"),
      position: "top",
    });
  }
};

// Copy raw markdown for a given assistant message to the clipboard.
const copiedIdx = ref(null);
const copyMessageMarkdown = async (msg, idx) => {
  // Copy the Markdown with inline value markers substituted for their
  // display-formatted values, so pasted content matches what's on screen.
  const text = applyValueMarkersText(String(msg?.content ?? ""));
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    copiedIdx.value = idx;
    setTimeout(() => {
      if (copiedIdx.value === idx) copiedIdx.value = null;
    }, 1500);
  } catch (err) {
    Notify.create({
      type: "negative",
      message: t("Failed to copy"),
      position: "top",
    });
  }
};

onMounted(() => {
  loadConfig();
  nextTick(autosize);
});

onBeforeUnmount(() => {
  if (streamAbort) streamAbort.abort();
});

// Expose an empty pdf export so WidgetContainer's export flow skips this widget
defineExpose({
  getPdfExport: () => null,
});
</script>

<style lang="scss" scoped>
.ai-chat-widget {
  background: var(--q-lightbg);
  border: 1px solid var(--q-border);
  border-radius: 12px;
  overflow: hidden;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
  display: flex;
  flex-direction: column;
  min-height: 460px;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &--dragging {
    opacity: 0.8;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: scale(1.02);
  }

  &--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 6000;
    border-radius: 0;
    border: none;
    min-height: 0;
    height: 100vh;
    width: 100vw;
    background: var(--q-lightbg);
    animation: chat-fade-in 180ms ease-out;
  }
}

@keyframes chat-fade-in {
  from {
    opacity: 0;
    transform: scale(0.99);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Header */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--q-lightbg);
  border-bottom: 1px solid var(--q-border);
  cursor: grab;
  flex-shrink: 0;
  min-height: 56px;

  &:active {
    cursor: grabbing;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }
}

.ai-chat-widget--fullscreen .widget-header {
  cursor: default;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--q-primary) 20%, transparent),
    color-mix(in srgb, var(--q-primary) 6%, transparent)
  );
  border: 1px solid color-mix(in srgb, var(--q-primary) 24%, var(--q-border));
  color: var(--q-primary);
  flex-shrink: 0;
}

.brand-icon {
  color: var(--q-primary);
}

.title-block {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  min-width: 0;
}

.widget-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--q-maintext);
}

.widget-subtitle {
  font-size: 0.72rem;
  color: var(--q-mutedtext);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}

.header-btn {
  color: var(--q-mutedtext);
}

.drag-handle {
  color: var(--q-mutedtext);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.model-picker {
  width: 180px;
  min-width: 150px;
  font-size: 0.75rem;

  :deep(.q-field__control) {
    min-height: 30px;
    border-radius: 8px;
  }

  :deep(.q-field__native),
  :deep(.q-field__input) {
    font-size: 0.75rem;
  }
}

/* Scroll area */
.chat-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1rem;
  background: var(--q-mainbg);
  scroll-behavior: smooth;
  user-select: text;
  -webkit-user-select: text;

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Themed scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--q-mutedtext) 28%, transparent);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* Empty state */
.empty-state {
  max-width: 520px;
  text-align: center;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.empty-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
  color: var(--q-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.empty-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--q-maintext);
}

.empty-desc {
  margin: 0;
  color: var(--q-mutedtext);
  font-size: 0.85rem;
  line-height: 1.45;
  max-width: 420px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.suggestion-chip {
  background: var(--q-lightbg);
  color: var(--q-maintext);
  border: 1px solid var(--q-border);
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;

  &:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--q-primary) 40%, var(--q-border));
    background: color-mix(in srgb, var(--q-primary) 8%, var(--q-lightbg));
    color: var(--q-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Messages */
.message {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1rem;
  animation: msg-in 160ms ease-out;

  &--user {
    justify-content: flex-end;

    .message__body {
      background: var(--q-primary);
      color: #fff;
      border-top-right-radius: 4px;
      max-width: 80%;
    }
  }

  &--assistant {
    justify-content: flex-start;

    .message__body {
      background: var(--q-lightbg);
      color: var(--q-maintext);
      border: 1px solid var(--q-border);
      border-top-left-radius: 4px;
      max-width: 100%;
    }
  }

  &--error .message__body {
    border-color: color-mix(in srgb, #ef4444 40%, var(--q-border));
  }
}

@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message__avatar {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--q-primary) 16%, transparent);
  color: var(--q-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.message__body {
  padding: 0.6rem 0.85rem;
  border-radius: 12px;
  font-size: 0.88rem;
  line-height: 1.55;
  min-width: 0;
  word-break: break-word;
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

.message__status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: var(--q-mutedtext);
  margin-bottom: 0.35rem;
  font-style: italic;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--q-primary);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

.message__content {
  :deep(p) {
    margin: 0 0 0.55rem;
    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 0.85rem 0 0.35rem;
    font-weight: 600;
    color: var(--q-maintext);
    line-height: 1.3;

    &:first-child {
      margin-top: 0;
    }
  }

  :deep(h1) {
    font-size: 1.15rem;
  }
  :deep(h2) {
    font-size: 1.05rem;
  }
  :deep(h3) {
    font-size: 0.98rem;
  }
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    font-size: 0.9rem;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0.25rem 0 0.55rem 1.25rem;
    padding: 0;
  }

  :deep(ul ul),
  :deep(ul ol),
  :deep(ol ul),
  :deep(ol ol) {
    margin: 0.15rem 0 0.25rem 1rem;
  }

  :deep(li) {
    margin: 0.15rem 0;

    > p {
      margin: 0 0 0.2rem;
    }
  }

  :deep(a) {
    color: var(--q-primary);
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      text-decoration: none;
    }
  }

  :deep(blockquote) {
    margin: 0.5rem 0;
    padding: 0.35rem 0.75rem;
    border-left: 3px solid
      color-mix(in srgb, var(--q-primary) 45%, var(--q-border));
    background: color-mix(in srgb, var(--q-primary) 6%, transparent);
    color: var(--q-maintext);
    border-radius: 0 6px 6px 0;

    p {
      margin: 0;
    }

    p + p {
      margin-top: 0.35rem;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--q-border);
    margin: 0.75rem 0;
  }

  :deep(code) {
    background: color-mix(in srgb, var(--q-mutedtext) 12%, transparent);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.82em;
  }

  :deep(pre.code-block) {
    background: var(--q-mainbg);
    border: 1px solid var(--q-border);
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    margin: 0.5rem 0;
    overflow-x: auto;
    font-size: 0.8rem;
    position: relative;

    code {
      background: transparent;
      padding: 0;
      font-size: 0.8rem;
      display: block;
      white-space: pre;
    }
  }

  :deep(.code-lang) {
    display: block;
    font-size: 0.68rem;
    color: var(--q-mutedtext);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.3rem;
  }

  /* Tables (GFM) */
  :deep(.md-table-wrap) {
    margin: 0.55rem 0;
    overflow-x: auto;
    border: 1px solid var(--q-border);
    border-radius: 8px;
    background: var(--q-mainbg);

    &::-webkit-scrollbar {
      height: 8px;
    }
    &::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--q-mutedtext) 28%, transparent);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
    color: var(--q-maintext);
  }

  :deep(thead th) {
    text-align: left;
    font-weight: 600;
    background: color-mix(in srgb, var(--q-mutedtext) 8%, transparent);
    color: var(--q-maintext);
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--q-border);
    white-space: nowrap;
  }

  :deep(tbody td) {
    padding: 0.45rem 0.75rem;
    border-bottom: 1px solid
      color-mix(in srgb, var(--q-border) 60%, transparent);
    vertical-align: top;
  }

  :deep(tbody tr:last-child td) {
    border-bottom: none;
  }

  :deep(tbody tr:nth-child(even)) {
    background: color-mix(in srgb, var(--q-mutedtext) 4%, transparent);
  }

  :deep(th[align="right"]),
  :deep(td[align="right"]) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  :deep(th[align="center"]),
  :deep(td[align="center"]) {
    text-align: center;
  }

  :deep(th[align="left"]),
  :deep(td[align="left"]) {
    text-align: left;
  }

  &--plain {
    white-space: pre-wrap;
  }
}

.message--user .message__content {
  :deep(code) {
    background: rgba(255, 255, 255, 0.22);
    color: #fff;
  }

  :deep(a) {
    color: #fff;
    text-decoration: underline;
  }
}

.message__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-top: 0.35rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.message--assistant:hover .message__actions,
.message__actions:focus-within {
  opacity: 1;
}

.message__copy-btn {
  color: var(--q-mutedtext);
  font-size: 0.72rem;
  padding: 2px 6px;
  min-height: 0;
  border-radius: 6px;

  :deep(.q-icon) {
    font-size: 14px;
  }

  &:hover {
    color: var(--q-primary);
    background: color-mix(in srgb, var(--q-primary) 8%, transparent);
  }
}

.message__clarify {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.65rem;
  background: color-mix(in srgb, var(--q-primary) 10%, transparent);
  border: 1px dashed color-mix(in srgb, var(--q-primary) 40%, var(--q-border));
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--q-maintext);
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  vertical-align: 1px;

  &--standalone {
    margin-left: 0;
    padding: 2px 0;
  }
}

.typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--q-primary) 70%, transparent);
  animation: typing-pulse 1.2s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.15s;
  }

  &:nth-child(3) {
    animation-delay: 0.3s;
  }
}

@keyframes typing-pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.7);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Composer */
.composer {
  border-top: 1px solid var(--q-border);
  background: var(--q-lightbg);
  padding: 0.65rem 0.75rem 0.75rem;
  flex-shrink: 0;
}

.composer__inner {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: var(--q-mainbg);
  border: 1px solid var(--q-border);
  border-radius: 12px;
  padding: 0.5rem 0.6rem 0.5rem 0.8rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus-within {
    border-color: color-mix(in srgb, var(--q-primary) 55%, var(--q-border));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--q-primary) 18%, transparent);
  }
}

.composer__textarea {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  color: var(--q-maintext);
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
  max-height: 220px;
  min-height: 22px;

  &::placeholder {
    color: var(--q-mutedtext);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.composer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.composer__hint {
  font-size: 0.7rem;
  color: var(--q-mutedtext);
}

/* Tighten the global <s-btn> so it fits snugly in the composer row
   without changing its look anywhere else in the app. */
.composer__action-btn {
  :deep(.button) {
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    font-weight: 600;
  }

  :deep(.text-color) {
    margin-left: 0.35rem !important;
    margin-top: 0 !important;
    font-size: 0.8rem;
    line-height: 1;
  }

  :deep(.icon-color) {
    font-size: 16px;
  }
}

@media (max-width: 600px) {
  .composer__hint {
    display: none;
  }

  .widget-subtitle {
    max-width: 160px;
  }
}

/* Fullscreen refinements */
.ai-chat-widget--fullscreen {
  .chat-scroll {
    padding: 1.25rem max(1rem, calc((100% - 820px) / 2));
  }

  .composer {
    padding: 0.75rem max(1rem, calc((100% - 820px) / 2)) 1rem;
  }

  .widget-header {
    padding: 0.75rem 1.25rem;
  }

  .message__body {
    font-size: 0.92rem;
  }

  .message--user .message__body {
    max-width: 70%;
  }
}
</style>
