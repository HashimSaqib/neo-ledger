<template>
  <div ref="rootRef" class="q-pa-md">
    <!-- Template Selector and Upload Button -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-5">
        <s-select
          outlined
          dense
          v-model="selectedTemplate"
          :options="templates"
          label="Select Template"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          clearable
          @update:model-value="loadTemplateContent"
          :loading="loading"
          class="text-body1"
        />
      </div>
      <div>
        <q-btn
          color="primary"
          icon="add"
          label="Upload New Template"
          class="full-width"
          @click="showUploadDialog = true"
        />
      </div>
    </div>

    <!-- Main Card -->
    <q-card v-if="selectedTemplate" class="q-mt-md shadow-3">
      <q-card-section class="lightbg q-pa-sm">
        <div class="row items-center justify-between">
          <!-- Editor Controls (only for text-based files) -->
          <div class="row q-gutter-sm" v-if="isTextType">
            <q-btn
              @click="toggleReadOnly"
              :label="isReadOnly ? 'Edit Mode' : 'View Mode'"
              :color="isReadOnly ? 'positive' : 'warning'"
              :icon="isReadOnly ? 'edit' : 'visibility'"
              dense
              outline
              class="q-px-sm"
            />
            <q-btn
              @click="saveTemplateContent"
              label="Save Changes"
              color="primary"
              icon="save"
              dense
              :loading="saving"
              :disable="isReadOnly"
            >
              <q-tooltip v-if="isReadOnly" class="bg-negative">
                Switch to Edit Mode to save changes
              </q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <!-- Included Files Section -->
      <q-card-section
        v-if="isTextType && templateIncludes.length > 0"
        class="q-pa-sm mainbg"
      >
        <div class="row items-center">
          <q-icon
            name="insert_drive_file"
            size="sm"
            class="q-mr-sm"
            color="primary"
          />
          <span class="lighttext q-mr-md">Included files:</span>
          <div class="row q-gutter-x-sm">
            <div v-for="(include, index) in templateIncludes" :key="index">
              <q-chip
                clickable
                :color="include.exists ? 'primary' : 'negative'"
                text-color="white"
                @click="loadIncludeFile(include.name)"
              >
                {{ include.name }}
                <q-tooltip>
                  {{
                    include.exists
                      ? "Click to load this file"
                      : "File not found in templates"
                  }}
                </q-tooltip>
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- File display area -->
      <q-card-section>
        <!-- PDF View -->
        <template v-if="templateType === 'pdf'">
          <div class="relative-position" style="height: 75vh">
            <q-inner-loading :showing="fileLoading" label="Loading PDF..." />
            <iframe
              width="100%"
              height="100%"
              type="application/pdf"
              class="rounded-borders"
              @load="fileLoading = false"
              @error="handleFileLoadError"
            />
          </div>

          <!-- Replacement Upload for PDF -->
          <div class="q-mt-sm">
            <q-btn
              label="Replace PDF"
              color="primary"
              icon="upload"
              @click="promptFileReplacement('pdf')"
            />
          </div>
        </template>

        <!-- Image View -->
        <template v-else-if="isImageType">
          <div class="relative-position" style="overflow: auto">
            <q-inner-loading :showing="fileLoading" label="Loading Image..." />
            <img
              style="max-width: 100%; height: auto"
              @load="fileLoading = false"
              @error="handleFileLoadError"
            />
          </div>

          <!-- Replacement Upload for Image -->
          <div class="q-mt-sm">
            <q-btn
              label="Replace Image"
              color="primary"
              icon="upload"
              @click="promptFileReplacement('image')"
            />
          </div>
        </template>

        <!-- Monaco Editor View (HTML, TEX, etc.) -->
        <template v-else>
          <div class="relative-position" style="height: 75vh">
            <q-inner-loading
              :showing="editorLoading"
              label="Initializing Editor..."
            />
            <div ref="editorContainer" class="full-height" />
          </div>
        </template>
      </q-card-section>

      <!-- Editor status (only for text-based files) -->
      <q-separator v-if="isTextType" />
      <q-card-actions v-if="isTextType" class="q-pa-md mainbg">
        <div class="row items-center q-gutter-sm">
          <q-icon name="info" color="info" size="sm" class="q-mr-xs" />
          <span class="text-caption lighttext">
            {{
              isReadOnly
                ? "View mode - toggle edit mode to make changes"
                : "Edit mode - changes can be saved"
            }}
          </span>
        </div>
      </q-card-actions>
    </q-card>

    <!-- New Template Upload Dialog -->
    <q-dialog v-model="showUploadDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Upload New Template</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-file
            v-model="newTemplateFile"
            label="Select File"
            outlined
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.html,.tex"
            @update:model-value="validateNewFile"
            bottom-slots
          >
            <template v-slot:hint v-if="newTemplateFile">
              {{ newTemplateFile.name }} ({{
                formatFileSize(newTemplateFile.size)
              }})
            </template>
          </q-file>

          <q-input
            v-model="newTemplateName"
            label="Template Name (optional)"
            hint="If empty, the original file name will be used"
            class="q-mt-sm"
            outlined
          />

          <div v-if="fileExistsWarning" class="text-negative q-mt-sm">
            <q-icon name="warning" />
            A file with this name already exists. Uploading will replace it.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            :loading="uploading"
            :disable="!newTemplateFile"
            flat
            label="Upload"
            color="primary"
            @click="uploadNewTemplate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Hidden file input for replacements -->
    <input
      ref="fileInput"
      type="file"
      class="hide"
      @change="uploadReplacementFile"
    />

    <!-- Confirmation Dialog -->
    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">{{ confirmMessage }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            flat
            label="Replace"
            color="negative"
            @click="confirmReplacement"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  computed,
  watch,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import * as monaco from "monaco-editor";

/** Quasar + Refs **/
const $q = useQuasar();
const rootRef = ref(null);
const editorContainer = ref(null);
const fileInput = ref(null);

/** Reactive State **/
const templates = ref([]);
const selectedTemplate = ref(null);
const templateContent = ref("");
const isReadOnly = ref(true);
const loading = ref(false);
const saving = ref(false);
const fileLoading = ref(true);
const editorLoading = ref(true);
const client = ref(null); // Add client ref to handle client parameter

// Upload Functionality
const newTemplateFile = ref(null);
const newTemplateName = ref("");
const fileExistsWarning = ref(false);
const showUploadDialog = ref(false);
const uploading = ref(false);

// Replacement Functionality
const currentFileType = ref(null);
const acceptTypes = ref("");
const showConfirmDialog = ref(false);
const confirmMessage = ref("");
const pendingAction = ref(null);

const errorMessage = ref("");
let editor = null;

// Store for blob URLs to manage memory
const blobUrls = ref([]);

/** Computed: Determine file type by extension **/
const templateType = computed(() => {
  if (!selectedTemplate.value) return "";
  const ext = selectedTemplate.value.split(".").pop().toLowerCase();

  if (["pdf"].includes(ext)) return "pdf";
  else if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext))
    return "image";
  else if (ext === "tex") return "tex";
  else if (ext === "html") return "html";
  return "html"; // default fallback
});

const isImageType = computed(() => templateType.value === "image");
const isTextType = computed(() => {
  return ["html", "tex"].includes(templateType.value);
});

/** Editor language for Monaco **/
const editorLanguage = computed(() => {
  switch (templateType.value) {
    case "tex":
      return "latex";
    case "html":
      return "html";
    default:
      return "html";
  }
});

// Extract includes from template content using regex
const extractIncludes = (content) => {
  const regex = /<%include\s+([^%>]+)%>/g;
  const includes = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    includes.push(match[1].trim());
  }

  return includes;
};

// Computed property to check if includes exist in our templates list
const templateIncludes = computed(() => {
  if (!isTextType.value || !templateContent.value) return [];

  const includes = extractIncludes(templateContent.value);
  return includes.map((include) => {
    // Check if the include exists in our templates list
    const exists = templates.value.some((template) => {
      if (typeof template === "object" && template.value) {
        return template.value === include;
      }
      return template === include;
    });

    return {
      name: include,
      exists,
    };
  });
});

// Register custom language definitions with Monaco
const registerCustomLanguages = () => {
  // Create custom themes first
  monaco.editor.defineTheme("customLightTheme", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "template-tag", foreground: "0000AA", fontStyle: "bold" },
      { token: "template-variable", foreground: "AA0000" },
      { token: "template-control", foreground: "AA00AA", fontStyle: "bold" },
      { token: "template-loop", foreground: "00AA00", fontStyle: "bold" },
    ],
    colors: {},
  });

  monaco.editor.defineTheme("customDarkTheme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "template-tag", foreground: "6699FF", fontStyle: "bold" },
      { token: "template-variable", foreground: "FF9999" },
      { token: "template-control", foreground: "FF99FF", fontStyle: "bold" },
      { token: "template-loop", foreground: "99FF99", fontStyle: "bold" },
    ],
    colors: {},
  });

  // Register LaTeX language with template syntax
  monaco.languages.register({ id: "latex" });
  monaco.languages.setMonarchTokensProvider("latex", {
    tokenizer: {
      root: [
        // Template syntax rules first
        [/<%include\s+[^%>]+%>/, "template-tag"],
        [/<%if\s+[^%>]+%>/, "template-control"],
        [/<%end\s+[^%>]+%>/, "template-control"],
        [/<%foreach\s+[^%>]+%>/, "template-loop"],
        [/<%[^%>]+%>/, "template-variable"],

        // Standard LaTeX syntax
        [/%.*$/, "comment"],
        [/\\[a-zA-Z]+/, "keyword"],
        [/\\begin(?=\{)/, "keyword"],
        [/\\end(?=\{)/, "keyword"],
        [/\$\$/, "delimiter.math", "@math"],
        [/\$/, "delimiter.math", "@math"],
        [/\{/, "delimiter.curly"],
        [/\}/, "delimiter.curly"],
        [/\[/, "delimiter.square"],
        [/\]/, "delimiter.square"],
        [/[a-zA-Z0-9]+/, "variable"],
      ],
      math: [
        [/\$\$/, "delimiter.math", "@pop"],
        [/\$/, "delimiter.math", "@pop"],
        [/[^$]+/, "string"],
      ],
    },
  });

  // Create custom HTML language definition with template syntax highlighting
  // This approach works by creating a new tokenizer that extends the default HTML tokenizer
  const htmlWithTemplateTokenizer = {
    defaultToken: "",
    tokenPostfix: ".html",

    tokenizer: {
      root: [
        // Custom template syntax patterns
        [/<%include\s+[^%>]+%>/, "template-tag"],
        [/<%if\s+[^%>]+%>/, "template-control"],
        [/<%end\s+[^%>]+%>/, "template-control"],
        [/<%foreach\s+[^%>]+%>/, "template-loop"],
        [/<%[^%>]+%>/, "template-variable"],

        // HTML standard syntax (copied from default Monaco HTML tokenizer)
        [/<!DOCTYPE/, "metatag", "@doctype"],
        [/<!--/, "comment", "@comment"],
        [
          /(<)((?:[\w\-]+:)?[\w\-]+)(\s*)(\/>)/,
          ["delimiter", "tag", "", "delimiter"],
        ],
        [/(<)(script)/, ["delimiter", { token: "tag", next: "@script" }]],
        [/(<)(style)/, ["delimiter", { token: "tag", next: "@style" }]],
        [
          /(<)((?:[\w\-]+:)?[\w\-]+)/,
          ["delimiter", { token: "tag", next: "@otherTag" }],
        ],
        [
          /(<\/)((?:[\w\-]+:)?[\w\-]+)/,
          ["delimiter", { token: "tag", next: "@otherTag" }],
        ],
        [/[^<]+/, ""],
      ],

      // Rest of HTML tokenizer states
      doctype: [
        [/[^>]+/, "metatag.content"],
        [/>/, "metatag", "@pop"],
      ],
      comment: [
        [/-->/, "comment", "@pop"],
        [/[^-]+/, "comment.content"],
        [/./, "comment.content"],
      ],
      otherTag: [
        // Add template highlighting even inside tags
        [/<%include\s+[^%>]+%>/, "template-tag"],
        [/<%if\s+[^%>]+%>/, "template-control"],
        [/<%end\s+[^%>]+%>/, "template-control"],
        [/<%foreach\s+[^%>]+%>/, "template-loop"],
        [/<%[^%>]+%>/, "template-variable"],

        [/\/?>/, "delimiter", "@pop"],
        [/"([^"]*)"/, "attribute.value"],
        [/'([^']*)'/, "attribute.value"],
        [/[\w\-]+/, "attribute.name"],
        [/=/, "delimiter"],
        [/[ \t\r\n]+/, ""],
      ],
      script: [
        // Make sure to highlight templates in script blocks
        [/<%include\s+[^%>]+%>/, "template-tag"],
        [/<%if\s+[^%>]+%>/, "template-control"],
        [/<%end\s+[^%>]+%>/, "template-control"],
        [/<%foreach\s+[^%>]+%>/, "template-loop"],
        [/<%[^%>]+%>/, "template-variable"],

        [/type/, "attribute.name", "@scriptAfterType"],
        [/"([^"]*)"/, "attribute.value"],
        [/'([^']*)'/, "attribute.value"],
        [/[\w\-]+/, "attribute.name"],
        [/=/, "delimiter"],
        [
          />/,
          {
            token: "delimiter",
            next: "@scriptEmbedded",
            nextEmbedded: "text/javascript",
          },
        ],
        [/[ \t\r\n]+/, ""],
        [
          /(<\/)(script\s*)(>)/,
          ["delimiter", "tag", { token: "delimiter", next: "@pop" }],
        ],
      ],
      scriptAfterType: [
        [/=/, "delimiter", "@scriptAfterTypeEquals"],
        [
          />/,
          {
            token: "delimiter",
            next: "@scriptEmbedded",
            nextEmbedded: "text/javascript",
          },
        ],
        [/[ \t\r\n]+/, ""],
        [/<\/script\s*>/, { token: "@rematch", next: "@pop" }],
      ],
      scriptAfterTypeEquals: [
        [
          /"([^"]*)"/,
          {
            token: "attribute.value",
            switchTo: "@scriptWithCustomType.$1",
          },
        ],
        [
          /'([^']*)'/,
          {
            token: "attribute.value",
            switchTo: "@scriptWithCustomType.$1",
          },
        ],
        [
          />/,
          {
            token: "delimiter",
            next: "@scriptEmbedded",
            nextEmbedded: "text/javascript",
          },
        ],
        [/[ \t\r\n]+/, ""],
        [/<\/script\s*>/, { token: "@rematch", next: "@pop" }],
      ],
      scriptWithCustomType: [
        [
          />/,
          {
            token: "delimiter",
            next: "@scriptEmbedded.$S2",
            nextEmbedded: "$S2",
          },
        ],
        [/"([^"]*)"/, "attribute.value"],
        [/'([^']*)'/, "attribute.value"],
        [/[\w\-]+/, "attribute.name"],
        [/=/, "delimiter"],
        [/[ \t\r\n]+/, ""],
        [/<\/script\s*>/, { token: "@rematch", next: "@pop" }],
      ],
      scriptEmbedded: [
        // Template highlighting in script content
        [/<%include\s+[^%>]+%>/, "template-tag"],
        [/<%if\s+[^%>]+%>/, "template-control"],
        [/<%end\s+[^%>]+%>/, "template-control"],
        [/<%foreach\s+[^%>]+%>/, "template-loop"],
        [/<%[^%>]+%>/, "template-variable"],

        [
          /<\/script/,
          { token: "@rematch", next: "@pop", nextEmbedded: "@pop" },
        ],
        [/[^<]+/, ""],
      ],
      style: [
        // Template highlighting in style blocks
        [/<%include\s+[^%>]+%>/, "template-tag"],
        [/<%if\s+[^%>]+%>/, "template-control"],
        [/<%end\s+[^%>]+%>/, "template-control"],
        [/<%foreach\s+[^%>]+%>/, "template-loop"],
        [/<%[^%>]+%>/, "template-variable"],

        [/type/, "attribute.name", "@styleAfterType"],
        [/"([^"]*)"/, "attribute.value"],
        [/'([^']*)'/, "attribute.value"],
        [/[\w\-]+/, "attribute.name"],
        [/=/, "delimiter"],
        [
          />/,
          {
            token: "delimiter",
            next: "@styleEmbedded",
            nextEmbedded: "text/css",
          },
        ],
        [/[ \t\r\n]+/, ""],
        [
          /(<\/)(style\s*)(>)/,
          ["delimiter", "tag", { token: "delimiter", next: "@pop" }],
        ],
      ],
      styleAfterType: [
        [/=/, "delimiter", "@styleAfterTypeEquals"],
        [
          />/,
          {
            token: "delimiter",
            next: "@styleEmbedded",
            nextEmbedded: "text/css",
          },
        ],
        [/[ \t\r\n]+/, ""],
        [/<\/style\s*>/, { token: "@rematch", next: "@pop" }],
      ],
      styleAfterTypeEquals: [
        [
          /"([^"]*)"/,
          {
            token: "attribute.value",
            switchTo: "@styleWithCustomType.$1",
          },
        ],
        [
          /'([^']*)'/,
          {
            token: "attribute.value",
            switchTo: "@styleWithCustomType.$1",
          },
        ],
        [
          />/,
          {
            token: "delimiter",
            next: "@styleEmbedded",
            nextEmbedded: "text/css",
          },
        ],
        [/[ \t\r\n]+/, ""],
        [/<\/style\s*>/, { token: "@rematch", next: "@pop" }],
      ],
      styleWithCustomType: [
        [
          />/,
          {
            token: "delimiter",
            next: "@styleEmbedded.$S2",
            nextEmbedded: "$S2",
          },
        ],
        [/"([^"]*)"/, "attribute.value"],
        [/'([^']*)'/, "attribute.value"],
        [/[\w\-]+/, "attribute.name"],
        [/=/, "delimiter"],
        [/[ \t\r\n]+/, ""],
        [/<\/style\s*>/, { token: "@rematch", next: "@pop" }],
      ],
      styleEmbedded: [
        // Template highlighting in style content
        [/<%include\s+[^%>]+%>/, "template-tag"],
        [/<%if\s+[^%>]+%>/, "template-control"],
        [/<%end\s+[^%>]+%>/, "template-control"],
        [/<%foreach\s+[^%>]+%>/, "template-loop"],
        [/<%[^%>]+%>/, "template-variable"],

        [/<\/style/, { token: "@rematch", next: "@pop", nextEmbedded: "@pop" }],
        [/[^<]+/, ""],
      ],
    },
  };

  // Override the HTML language with our custom tokenizer
  monaco.languages.setMonarchTokensProvider("html", htmlWithTemplateTokenizer);

  // Add completion items for template syntax
  const completionItems = [
    {
      label: "<%include",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "<%include $1%>$0",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Include another template file",
    },
    {
      label: "<%if",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "<%if $1%>\n\t$2\n<%end $1%>$0",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Conditional block",
    },
    {
      label: "<%foreach",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "<%foreach $1%>\n\t$2\n<%end $1%>$0",
      insertTextRules:
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Loop through items",
    },
  ];

  // Register completion providers for both HTML and LaTeX
  monaco.languages.registerCompletionItemProvider("html", {
    provideCompletionItems: () => ({
      suggestions: completionItems,
    }),
  });

  monaco.languages.registerCompletionItemProvider("latex", {
    provideCompletionItems: () => ({
      suggestions: [
        ...completionItems,
        {
          label: "\\begin{document}",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "\\begin{document}\n\t$0\n\\end{document}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Document environment",
        },
      ],
    }),
  });

  // Apply the appropriate theme
  monaco.editor.setTheme(
    $q.dark.isActive ? "customDarkTheme" : "customLightTheme"
  );
};

// Initialize the Monaco editor (only for text files)
const initializeEditor = () => {
  // Only init if it's a text type file
  if (!editorContainer.value || !isTextType.value) return;

  // Dispose any existing instance
  if (editor) editor.dispose();

  editor = monaco.editor.create(editorContainer.value, {
    value: templateContent.value,
    language: editorLanguage.value,
    theme: $q.dark.isActive ? "customDarkTheme" : "customLightTheme",
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    readOnly: isReadOnly.value,
    fontSize: 14,
    lineNumbers: "on",
    renderWhitespace: "all",
    wordWrap: "on",
  });

  editorLoading.value = false;
};

/** Lifecycle and watchers **/
onMounted(() => {
  // Register our custom language definitions first
  registerCustomLanguages();
  getTemplates();

  // Try to get client info if needed for your app
  client.value = localStorage.getItem("client") || null;
});

// Whenever a template is chosen, load its content
watch(selectedTemplate, () => {
  if (selectedTemplate.value) {
    loadTemplateContent();
    // Re‐init the editor if needed
    setTimeout(initializeEditor, 100);
  }
});

watch(templateType, initializeEditor);

// Watch for theme changes and update Monaco editor accordingly
watch(
  () => $q.dark.isActive,
  (isDark) => {
    if (editor) {
      monaco.editor.setTheme(isDark ? "customDarkTheme" : "customLightTheme");
    }
  }
);

onBeforeUnmount(() => {
  // Clean up editor
  if (editor) {
    editor.dispose();
    editor = null;
  }

  // Revoke any blob URLs to prevent memory leaks
  blobUrls.value.forEach((url) => URL.revokeObjectURL(url));
});

/** Methods **/

// Load an included file when clicked in the includes list
const loadIncludeFile = (filename) => {
  // Find the template in the templates list
  const templateItem = templates.value.find((template) => {
    if (typeof template === "object" && template.value) {
      return template.value === filename;
    }
    return template === filename;
  });

  if (templateItem) {
    selectedTemplate.value =
      typeof templateItem === "object" ? templateItem.value : templateItem;
  } else {
    $q.notify({
      message: `Template file "${filename}" not found`,
      color: "negative",
      position: "top",
    });
  }
};

// Load list of templates from server
const getTemplates = async () => {
  try {
    loading.value = true;
    const params = {};
    if (client.value) {
      params.client = client.value;
    }

    const { data } = await api.get("/system/templates", { params });
    templates.value = data.templates || data;
  } catch (error) {
    handleError("Failed to load templates", error);
  } finally {
    loading.value = false;
  }
};

// Load the content for all template types
const loadTemplateContent = async () => {
  if (!selectedTemplate.value) return;
  try {
    editorLoading.value = true;
    fileLoading.value = true;

    const params = { id: selectedTemplate.value };
    if (client.value) {
      params.client = client.value;
    }

    if (isTextType.value) {
      // For text-based templates, get as text
      const { data } = await api.get("/system/template", { params });
      templateContent.value = data;

      if (editor) {
        editor.setValue(data);
        monaco.editor.setModelLanguage(editor.getModel(), editorLanguage.value);
        editor.updateOptions({ readOnly: isReadOnly.value });
      }
    } else {
      // For binary files (PDFs, images), fetch as blob
      const response = await api.get("/system/template", {
        params,
        responseType: "blob",
      });

      // Create a blob URL from the response
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          (templateType.value === "pdf" ? "application/pdf" : "image/*"),
      });

      // Create a blob URL and store it for later cleanup
      const objectUrl = URL.createObjectURL(blob);

      // Add to our list of URLs to clean up
      blobUrls.value.push(objectUrl);

      // We need to use nextTick to ensure the DOM is updated
      nextTick(() => {
        // Find and update the appropriate element
        if (templateType.value === "pdf") {
          const iframe = document.querySelector("iframe");
          if (iframe) iframe.src = objectUrl;
        } else if (isImageType.value) {
          const img = document.querySelector("img");
          if (img) img.src = objectUrl;
        }
      });
    }
  } catch (error) {
    handleError("Failed to load template content", error);
    fileLoading.value = false;
  } finally {
    editorLoading.value = false;
    // Note: fileLoading is set to false in the onload handlers for iframe/img
  }
};

// Handle file load errors
const handleFileLoadError = () => {
  fileLoading.value = false;
  $q.notify({
    message: `Failed to load ${templateType.value} file`,
    color: "negative",
    position: "center",
  });
};

// Save text-based template content
const saveTemplateContent = async () => {
  try {
    saving.value = true;
    const content = editor ? editor.getValue() : templateContent.value;

    const params = { id: selectedTemplate.value };
    if (client.value) {
      params.client = client.value;
    }

    await api.post("/system/template", { content }, { params });

    $q.notify({
      message: "Template saved successfully",
      color: "positive",
      position: "center",
    });
  } catch (error) {
    handleError("Failed to save template", error);
  } finally {
    saving.value = false;
  }
};

// Toggle read‐only mode in the Monaco editor
const toggleReadOnly = () => {
  isReadOnly.value = !isReadOnly.value;
  if (editor) {
    editor.updateOptions({ readOnly: isReadOnly.value });
  }
};

// Format file size for display
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
};

// Validate the new file and check if it already exists
const validateNewFile = async () => {
  if (!newTemplateFile.value) {
    fileExistsWarning.value = false;
    return;
  }

  // Use file name if no custom name provided
  if (!newTemplateName.value) {
    newTemplateName.value = newTemplateFile.value.name;
  }

  // Check if the file already exists
  try {
    const params = { checkExists: newTemplateName.value };
    if (client.value) {
      params.client = client.value;
    }

    const { data } = await api.get("/system/template/check", { params });
    fileExistsWarning.value = data.exists;
  } catch (error) {
    console.error("Error checking file existence:", error);
    // Continue without warning if check fails
    fileExistsWarning.value = false;
  }
};

// Upload a new template file
const uploadNewTemplate = async () => {
  if (!newTemplateFile.value) return;

  try {
    uploading.value = true;
    const formData = new FormData();
    formData.append("file", newTemplateFile.value);
    formData.append(
      "name",
      newTemplateName.value || newTemplateFile.value.name
    );

    const params = {};
    if (client.value) {
      params.client = client.value;
    }

    await api.post("/system/template/upload", formData, {
      params,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    $q.notify({
      message: `Template ${
        fileExistsWarning.value ? "replaced" : "uploaded"
      } successfully`,
      color: "positive",
      position: "center",
    });

    // Reset form and refresh templates
    newTemplateFile.value = null;
    newTemplateName.value = "";
    fileExistsWarning.value = false;
    showUploadDialog.value = false;
    getTemplates();
  } catch (error) {
    handleError("Failed to upload template", error);
  } finally {
    uploading.value = false;
  }
};

// Prompt for file replacement based on type
const promptFileReplacement = (fileType) => {
  currentFileType.value = fileType;

  // Set the accept attribute based on file type
  if (fileType === "pdf") {
    acceptTypes.value = "application/pdf";
  } else if (fileType === "image") {
    acceptTypes.value = "image/*";
  } else {
    acceptTypes.value = ".html,.tex";
  }

  if (fileInput.value) {
    fileInput.value.accept = acceptTypes.value;
    fileInput.value.value = ""; // reset in case user re-uploads same file
    fileInput.value.click();
  }
};

// Upload the replacement file
const uploadReplacementFile = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return; // user canceled

  // Validate file type
  let isValidType = false;

  if (currentFileType.value === "pdf" && file.type === "application/pdf") {
    isValidType = true;
  } else if (
    currentFileType.value === "image" &&
    file.type.startsWith("image/")
  ) {
    isValidType = true;
  } else if (
    currentFileType.value === "html" ||
    currentFileType.value === "tex"
  ) {
    // For text files, check extension
    const ext = file.name.split(".").pop().toLowerCase();
    isValidType = currentFileType.value === ext;
  }

  if (!isValidType) {
    $q.notify({
      message: `Invalid file type. Please select a ${currentFileType.value} file.`,
      color: "negative",
      position: "center",
    });
    return;
  }

  // Ask for confirmation before replacing
  showConfirmDialog.value = true;
  confirmMessage.value = `Are you sure you want to replace the current ${currentFileType.value} file?`;

  // Store the pending action
  pendingAction.value = async () => {
    try {
      saving.value = true;
      fileLoading.value = true;
      const formData = new FormData();
      formData.append("file", file);

      const params = { id: selectedTemplate.value };
      if (client.value) {
        params.client = client.value;
      }

      await api.post("/system/template/upload", formData, {
        params,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      $q.notify({
        message: "File replaced successfully",
        color: "positive",
        position: "center",
      });

      // Reload the content to show the updated file
      loadTemplateContent();
    } catch (error) {
      handleError("Failed to replace file", error);
      fileLoading.value = false;
    } finally {
      saving.value = false;
    }
  };
};

// Confirm the replacement action
const confirmReplacement = () => {
  if (pendingAction.value) {
    pendingAction.value();
    pendingAction.value = null;
  }
};

/** Error Handler **/
const handleError = (message, error) => {
  console.error(error);
  errorMessage.value = `${message}: ${
    error.response?.data?.message || error.message
  }`;
  $q.notify({
    message: errorMessage.value,
    color: "negative",
    position: "center",
  });
};
</script>

<style scoped>
.hide {
  display: none;
}
.full-height {
  height: 100%;
}
.rounded-borders {
  border-radius: 4px;
}
</style>
