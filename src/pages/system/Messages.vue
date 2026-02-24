<template>
  <q-page class="lightbg q-pa-md">
    <div class="column q-gutter-md">
      <!-- Languages -->
      <div class="container">
        <div class="container-bg">
          <div class="row items-center justify-between q-pa-md">
            <span class="text-h6 q-my-none">{{ t("Languages") }}</span>
            <q-btn
              :label="t('Add Language')"
              color="primary"
              unelevated
              no-caps
              dense
              @click="openAddPopup"
            />
          </div>
          <q-separator />
          <q-table
            :rows="languages"
            :columns="columns"
            row-key="code"
            flat
            dense
            hide-header
            hide-bottom
            separator="horizontal"
            :rows-per-page-options="[0]"
          >
            <template v-slot:body-cell-code="props">
              <q-td :props="props" class="text-weight-medium">{{
                props.row.code
              }}</q-td>
            </template>
            <template v-slot:body-cell-description="props">
              <q-td :props="props" class="text">{{
                props.row.description || "—"
              }}</q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props" class="q-pl-sm">
                <q-btn
                  :label="t('Edit')"
                  color="primary"
                  flat
                  dense
                  no-caps
                  size="sm"
                  @click="openEditPopup(props.row)"
                />
              </q-td>
            </template>
          </q-table>
          <p v-if="!languages.length" class="text-grey-7 text-body2 q-ma-none">
            {{ t("No languages yet. Add one to get started.") }}
          </p>
        </div>
      </div>

      <!-- Message configuration -->
      <div class="container">
        <div class="container-bg">
          <div
            class="row items-center justify-between q-pa-md flex-wrap q-col-gutter-x-sm"
          >
            <span class="text-h6 q-my-none">{{
              t("Message configuration")
            }}</span>
            <div class="row items-center q-col-gutter-x-sm">
              <q-select
                v-model="selectedMessageType"
                :options="messageTypeOptions"
                :label="t('Message type')"
                emit-value
                map-options
                outlined
                dense
                style="min-width: 200px"
                @update:model-value="loadMessagesForType"
              />
              <q-btn
                :label="t('Save')"
                color="primary"
                unelevated
                no-caps
                dense
                :loading="savingMessages"
                :disable="languages.length === 0"
                @click="saveAllMessages"
              />
            </div>
          </div>
          <q-separator />
          <template v-if="languages.length === 0">
            <p class="text-grey-7 text-body2 q-ma-none q-pa-md">
              {{ t("Add at least one language to configure messages.") }}
            </p>
          </template>
          <template v-else>
            <MessageVariableInput
              :type="selectedMessageType"
              v-model:message-rows="messageRows"
              v-model:active-message-language="activeMessageLanguage"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Language add/edit dialog -->
    <q-dialog v-model="editDialog" position="standard">
      <q-card flat bordered style="min-width: 320px; max-width: 90vw">
        <q-card-section class="text-h6 q-pa-md">
          {{ isEditMode ? t("Edit language") : t("Add language") }}
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-md">
          <q-input
            v-model="selectedLanguage.code"
            :label="t('Code')"
            outlined
            dense
            maxlength="6"
            :readonly="isEditMode"
            :hint="
              isEditMode
                ? t('Code cannot be changed when editing')
                : t('1–6 characters')
            "
            class="q-mb-sm"
          />
          <q-input
            v-model="selectedLanguage.description"
            :label="t('Description')"
            outlined
            dense
            hide-bottom-space
          />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            :label="t('Cancel')"
            color="grey-7"
            no-caps
            v-close-popup
          />
          <q-btn
            unelevated
            :label="t('Save')"
            color="primary"
            no-caps
            @click="saveLanguage"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed, watch } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";
import MessageVariableInput from "src/components/MessageVariableInput.vue";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Messages"));
const languages = ref([]);
const editDialog = ref(false);
const isEditMode = ref(false);
const selectedLanguage = ref({ code: "", description: "" });

// Message configuration
const MESSAGE_TYPES = [{ value: "invoice_send", label: "Invoice send" }];
const messageTypeOptions = computed(() =>
  MESSAGE_TYPES.map((opt) => ({ value: opt.value, label: t(opt.label) })),
);
const selectedMessageType = ref("invoice_send");
const messagesForType = ref([]);
const messageRows = ref([]);
const savingMessages = ref(false);

const columns = computed(() => [
  { name: "code", label: t("Code"), field: "code", align: "left" },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  { name: "actions", label: t("Actions"), align: "right" },
]);

const activeMessageLanguage = ref("");

function buildMessageRows() {
  const langs = languages.value;
  const messages = messagesForType.value;
  messageRows.value = langs.map((lang) => {
    const msg = messages.find((m) => m.language_code === lang.code);
    return {
      language_code: lang.code,
      description: lang.description || "",
      content: msg ? (msg.content ?? "") : "",
      id: msg ? msg.id : undefined,
    };
  });
  if (messageRows.value.length && !messageRows.value.some(
    (r) => r.language_code === activeMessageLanguage.value
  )) {
    activeMessageLanguage.value = messageRows.value[0].language_code;
  } else if (messageRows.value.length && !activeMessageLanguage.value) {
    activeMessageLanguage.value = messageRows.value[0].language_code;
  }
}

const loadMessagesForType = async () => {
  if (!selectedMessageType.value) return;
  try {
    const response = await api.get("/system/messages", {
      params: { message_type: selectedMessageType.value },
    });
    messagesForType.value = response.data || [];
    buildMessageRows();
  } catch (error) {
    Notify.create({
      message:
        error.response?.data?.error?.message || t("Can't fetch messages"),
      type: "negative",
      position: "center",
    });
    messagesForType.value = [];
    messageRows.value = [];
  }
};

const saveAllMessages = async () => {
  savingMessages.value = true;
  try {
    for (const row of messageRows.value) {
      const payload = {
        message_type: selectedMessageType.value,
        language_code: row.language_code,
        content: row.content ?? "",
        trans_id: null,
      };
      if (row.id != null && row.id !== "") {
        payload.id = row.id;
      }
      await api.post("/system/messages", payload);
    }
    Notify.create({
      message: t("Messages saved successfully"),
      type: "positive",
      position: "top-right",
    });
    await loadMessagesForType();
  } catch (error) {
    Notify.create({
      message:
        error.response?.data?.error?.message || t("Failed to save messages"),
      type: "negative",
      position: "center",
    });
  } finally {
    savingMessages.value = false;
  }
};

const getLanguages = async () => {
  try {
    const response = await api.get("/system/languages");
    languages.value = response.data;
    buildMessageRows();
  } catch (error) {
    Notify.create({
      message:
        error.response?.data?.error?.message || t("Can't fetch languages"),
      type: "negative",
      position: "center",
    });
  }
};

watch(selectedMessageType, loadMessagesForType);

const openAddPopup = () => {
  selectedLanguage.value = { code: "", description: "" };
  isEditMode.value = false;
  editDialog.value = true;
};

const openEditPopup = (row) => {
  selectedLanguage.value = { ...row };
  isEditMode.value = true;
  editDialog.value = true;
};

const saveLanguage = async () => {
  const code = (selectedLanguage.value.code || "").trim();
  const description = (selectedLanguage.value.description || "").trim();
  if (code.length < 1 || code.length > 6) {
    Notify.create({
      message: t("Code must be between 1 and 6 characters"),
      type: "negative",
      position: "center",
    });
    return;
  }
  try {
    await api.post("/system/languages", { code, description });
    Notify.create({
      message: t("Language saved successfully"),
      type: "positive",
      position: "top-right",
    });
    editDialog.value = false;
    await getLanguages();
    buildMessageRows();
  } catch (error) {
    Notify.create({
      message:
        error.response?.data?.error?.message || t("Failed to save language"),
      type: "negative",
      position: "center",
    });
  }
};

onMounted(async () => {
  await getLanguages();
  await loadMessagesForType();
});
</script>
