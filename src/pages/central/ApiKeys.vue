<template>
  <q-dialog v-model="localDialog">
    <q-card style="min-width: 50vw; max-width: 50vw">
      <q-card-section class="q-pb-none">
        <div class="text-h6 q-mt-none">
          {{ t("API Keys") }} - {{ datasetName }}
        </div>
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <!-- Header with create button -->
        <div class="row q-mb-md items-center justify-between">
          <q-btn
            :label="t('Create New API Key')"
            @click="showCreateDialog = true"
            color="primary"
            icon="add"
            size="sm"
          />
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex flex-center q-pa-lg">
          <q-spinner-dots size="50px" color="primary" />
        </div>

        <!-- Error banner -->
        <q-banner
          v-if="error"
          class="q-mb-md"
          color="negative"
          text-color="white"
          dismissible
          @dismiss="error = false"
        >
          {{ error }}
        </q-banner>

        <!-- API Keys List -->
        <div v-if="!loading && !error">
          <!-- No API keys message -->
          <div
            v-if="apiKeys.length === 0"
            class="flex flex-center column q-py-xl text-grey text-center"
          >
            <q-icon name="vpn_key" size="64px" />
            <div class="text-h6 q-mt-md">{{ t("No API Keys Found") }}</div>
            <div class="text-body2">
              {{ t("Create your first API key to get started") }}
            </div>
          </div>

          <!-- API Keys Table -->
          <q-card v-else flat bordered>
            <q-table
              :rows="apiKeys"
              :columns="columns"
              row-key="id"
              flat
              bordered
              :loading="loading"
              hide-pagination
              hide-bottom
              dense
            >
              <!-- Status column -->
              <template v-slot:body-cell-status="props">
                <q-td :props="props">
                  <q-badge
                    :color="props.row.disabled ? 'negative' : 'positive'"
                    :label="props.row.disabled ? t('Disabled') : t('Active')"
                  />
                </q-td>
              </template>

              <!-- Created column -->
              <template v-slot:body-cell-created="props">
                <q-td :props="props">
                  {{ formatDate(props.row.created) }}
                </q-td>
              </template>

              <!-- Last Used column -->
              <template v-slot:body-cell-last_used="props">
                <q-td :props="props">
                  {{
                    props.row.last_used
                      ? formatDate(props.row.last_used)
                      : t("Never")
                  }}
                </q-td>
              </template>

              <!-- Actions column -->
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <div class="flex flex-center">
                    <q-btn
                      flat
                      round
                      dense
                      color="negative"
                      icon="delete"
                      @click="deleteApiKey(props.row)"
                      :loading="processingKey === props.row.id"
                      size="sm"
                    >
                      <q-tooltip>{{ t("Delete API Key") }}</q-tooltip>
                    </q-btn>
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-card>
        </div>

        <!-- Close button -->
        <q-card-actions align="right" class="q-mt-md">
          <q-btn flat :label="t('Close')" @click="closeDialog" />
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Create API Key Dialog -->
  <q-dialog v-model="showCreateDialog">
    <q-card style="min-width: 500px">
      <q-card-section class="q-pb-none">
        <div class="text-h6">{{ t("Create New API Key") }}</div>
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <q-form ref="apiKeyForm" @submit.prevent="createApiKey">
          <q-input
            v-model="newApiKey.label"
            dense
            :label="t('API Key Label')"
            outlined
            bg-color="input"
            label-color="secondary"
            :rules="[
              (val) => !!val || t('API Key Label is required'),
              (val) =>
                val.length >= 3 ||
                t('Label must be at least 3 characters long'),
            ]"
            class="q-mb-sm"
            hide-bottom-space
          />

          <q-card-actions align="right">
            <q-btn flat :label="t('Cancel')" @click="cancelCreate" />
            <q-btn
              flat
              :label="t('Create')"
              color="primary"
              type="submit"
              :loading="creating"
            />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- New API Key Display Dialog -->
  <q-dialog v-model="showNewKeyDialog">
    <q-card style="min-width: 600px">
      <q-card-section class="q-pb-none">
        <div class="text-h6">{{ t("API Key Created Successfully") }}</div>
      </q-card-section>

      <q-card-section>
        <div class="text-body2 q-mb-md">
          {{
            t(
              "Please copy your API key now. You won't be able to see it again."
            )
          }}
        </div>

        <q-input
          v-model="newApiKeyValue"
          readonly
          outlined
          dense
          bg-color="grey-2"
          class="q-mb-md"
        >
          <template v-slot:append>
            <q-btn
              flat
              round
              dense
              icon="content_copy"
              @click="copyToClipboard"
            >
              <q-tooltip>{{ t("Copy to Clipboard") }}</q-tooltip>
            </q-btn>
          </template>
        </q-input>

        <q-banner class="bg-warning text-black">
          <template v-slot:avatar>
            <q-icon name="warning" color="black" />
          </template>
          {{ t("Store this API key securely. It will not be shown again.") }}
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="t('Close')" @click="closeNewKeyDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Delete Confirmation Dialog -->
  <q-dialog v-model="showDeleteDialog">
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ t("Delete API Key") }}</div>
      </q-card-section>

      <q-card-section>
        {{ t("Are you sure you want to delete the API key") }} "{{
          keyToDelete?.label
        }}"?
        {{ t("This action cannot be undone.") }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat :label="t('Cancel')" @click="showDeleteDialog = false" />
        <q-btn
          flat
          :label="t('Delete')"
          color="negative"
          @click="confirmDelete"
          :loading="processingKey === keyToDelete?.id"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Define props for controlling dialog visibility and dataset info
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  datasetId: {
    type: [String, Number],
    required: true,
  },
  datasetName: {
    type: String,
    required: true,
  },
});

// Define emits for updating the parent state
const emit = defineEmits(["update:modelValue"]);

// Local state for dialog visibility (sync with prop)
const localDialog = ref(props.modelValue);
watch(
  () => props.modelValue,
  (newVal) => {
    localDialog.value = newVal;
  }
);
watch(localDialog, (newVal) => {
  emit("update:modelValue", newVal);
});

// Reactive data
const loading = ref(false);
const error = ref("");
const apiKeys = ref([]);
const showCreateDialog = ref(false);
const showNewKeyDialog = ref(false);
const showDeleteDialog = ref(false);
const creating = ref(false);
const processingKey = ref(null);
const keyToDelete = ref(null);
const newApiKeyValue = ref("");

// Form data
const newApiKey = ref({
  label: "",
});

// Form reference
const apiKeyForm = ref(null);

// Table columns
const columns = computed(() => [
  {
    name: "label",
    label: t("Label"),
    field: "label",
    align: "left",
    sortable: true,
  },
  {
    name: "created",
    label: t("Created"),
    field: "created",
    align: "left",
    sortable: true,
  },
  {
    name: "last_used",
    label: t("Last Used"),
    field: "last_used",
    align: "left",
    sortable: true,
  },
  {
    name: "actions",
    label: t("Actions"),
    field: "actions",
    align: "center",
  },
]);

// Fetch API keys for the specific dataset
const fetchApiKeys = async () => {
  if (!props.datasetId) return;

  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get(`/api_keys?client=${props.datasetName}`);
    apiKeys.value = data.api_keys || [];
  } catch (err) {
    if (err.response?.status === 404) {
      // 404 means no API keys found - this is not an error, just empty state
      apiKeys.value = [];
      error.value = "";
    } else {
      error.value = err.response?.data?.error || t("Failed to fetch API keys");
      console.error("Error fetching API keys:", err);
    }
  } finally {
    loading.value = false;
  }
};

// Create new API key for the dataset
const createApiKey = async () => {
  if (apiKeyForm.value && !apiKeyForm.value.validate()) {
    Notify.create({
      message: t("Please fill in all required fields."),
      color: "warning",
    });
    return;
  }

  creating.value = true;

  try {
    const { data } = await api.post(
      `/api_keys?client=${props.datasetName}&label=${newApiKey.value.label}`
    );

    newApiKeyValue.value = data.api_key;
    showCreateDialog.value = false;
    showNewKeyDialog.value = true;

    // Reset form
    newApiKey.value.label = "";

    // Refresh the list
    await fetchApiKeys();

    Notify.create({
      message: t("API key created successfully"),
      color: "positive",
    });
  } catch (err) {
    Notify.create({
      message: err.response?.data?.error || t("Failed to create API key"),
      color: "negative",
    });
  } finally {
    creating.value = false;
  }
};

// Delete API key
const deleteApiKey = (apiKey) => {
  keyToDelete.value = apiKey;
  showDeleteDialog.value = true;
};

// Confirm delete
const confirmDelete = async () => {
  if (!keyToDelete.value) return;

  processingKey.value = keyToDelete.value.id;

  try {
    const { data } = await api.delete(`/api_keys/${keyToDelete.value.id}`);

    // Remove from local state
    apiKeys.value = apiKeys.value.filter(
      (key) => key.id !== keyToDelete.value.id
    );

    Notify.create({
      message: data.message || t("API key deleted successfully"),
      color: "positive",
    });
  } catch (err) {
    Notify.create({
      message: err.response?.data?.error || t("Failed to delete API key"),
      color: "negative",
    });
  } finally {
    processingKey.value = null;
    showDeleteDialog.value = false;
    keyToDelete.value = null;
  }
};

// Copy to clipboard
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(newApiKeyValue.value);
    Notify.create({
      message: t("API key copied to clipboard"),
      color: "positive",
    });
  } catch (err) {
    Notify.create({
      message: t("Failed to copy to clipboard"),
      color: "negative",
    });
  }
};

// Close new key dialog
const closeNewKeyDialog = () => {
  showNewKeyDialog.value = false;
  newApiKeyValue.value = "";
};

// Cancel create
const cancelCreate = () => {
  showCreateDialog.value = false;
  newApiKey.value.label = "";
};

// Close main dialog
const closeDialog = () => {
  localDialog.value = false;
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Watch for dialog opening to fetch data
watch(localDialog, (newVal) => {
  if (newVal && props.datasetId) {
    fetchApiKeys();
  }
});

// Initialize component
onMounted(() => {
  if (props.datasetId) {
    fetchApiKeys();
  }
});
</script>

<style scoped>
.q-table th {
  font-weight: 600;
}
</style>
