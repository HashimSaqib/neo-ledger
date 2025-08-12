<template>
  <q-page class="q-px-md q-py-md">
    <q-form ref="formRef" class="q-pa-md mainbg" @submit.prevent="submitForm">
      <div class="row q-py-none">
        <div class="col-12 col-md-6">
          <q-select
            v-model="selectedPromptType"
            :options="promptTypes"
            :label="t('Prompt Type')"
            outlined
            dense
            class="lightbg input-box"
            @update:model-value="loadPrompt"
          />
        </div>
      </div>
      <div v-if="selectedPromptType" class="row col-md-6 q-my-none q-py-none">
        <q-select
          v-model="selectedModel"
          :options="modelOptions"
          :label="t('AI Model')"
          outlined
          dense
          class="lightbg input-box q-my-none"
        />
      </div>
      <div v-if="selectedPromptType" class="row q-mb-md q-mt-none">
        <div class="col-12">
          <q-input
            v-model="currentPrompt"
            :label="t('AI Prompt')"
            type="textarea"
            outlined
            dense
            rows="8"
            class="lightbg input-box"
            :placeholder="t('Enter your AI prompt here...')"
          />
        </div>
      </div>

      <div v-if="selectedPromptType" class="row q-mb-md">
        <div class="col-12">
          <q-btn
            :label="t('Save Prompt')"
            type="submit"
            color="primary"
            :loading="loading"
            :disable="
              !selectedPromptType || !currentPrompt.trim() || !selectedModel
            "
          />
        </div>
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
import { api } from "src/boot/axios";

const { t } = useI18n();

const formRef = ref(null);
const loading = ref(false);
const selectedPromptType = ref(null);
const selectedModel = ref(null);
const currentPrompt = ref("");

const promptTypes = [
  { label: t("General"), value: "general" },
  { label: t("Vendor Bill"), value: "ap_transaction" },
];

const modelOptions = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

// Only keep a map of prompts by type
const prompts = ref([]);

async function loadPrompts() {
  try {
    loading.value = true;
    const { data } = await api.get("/ai_prompts");
    prompts.value = data.prompts || [];
    // If a type is selected, load its prompt
    if (selectedPromptType.value) {
      loadPrompt();
    }
  } catch (err) {
    console.error("Error loading prompts", err);
    Notify.create({
      message: t("Error loading prompts"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
}

function loadPrompt() {
  if (!selectedPromptType.value) {
    currentPrompt.value = "";
    selectedModel.value = null;
    return;
  }
  const existingPrompt = prompts.value.find(
    (p) =>
      p.name === (selectedPromptType.value.value || selectedPromptType.value)
  );
  if (existingPrompt) {
    currentPrompt.value = existingPrompt.prompt || "";
    selectedModel.value = existingPrompt.model || null;
  } else {
    currentPrompt.value = "";
    selectedModel.value = null;
  }
}

async function submitForm() {
  if (
    !selectedPromptType.value ||
    !currentPrompt.value.trim() ||
    !selectedModel.value
  ) {
    Notify.create({
      message: t(
        "Please select a prompt type, enter a prompt, and select a model"
      ),
      type: "warning",
      position: "center",
    });
    return;
  }

  try {
    loading.value = true;
    const payload = {
      name: selectedPromptType.value.value || selectedPromptType.value,
      prompt: currentPrompt.value.trim(),
      model: selectedModel.value,
    };
    await api.post("/ai_prompts", payload);
    Notify.create({
      message: t("Prompt saved successfully"),
      type: "positive",
      position: "top-right",
    });
    // Reload prompts to update the cache
    await loadPrompts();
  } catch (err) {
    console.error("Error saving prompt", err);
    Notify.create({
      message: t("Error saving prompt"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPrompts();
});
</script>

<style scoped>
.lightbg {
  background-color: rgba(255, 255, 255, 0.1);
}

.input-box {
  margin-bottom: 16px;
}
</style>
