<template>
  <q-page class="lightbg q-pa-sm">
    <div class="q-pa-md">
      <!-- Processing Records Table -->
      <q-table
        :rows="processingRecords"
        :columns="columns"
        :loading="loading"
        row-key="id"
        :pagination="pagination"
        v-model:pagination="pagination"
        @request="onRequest"
        dense
        hide-bottom
        hide-pagination
      >
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="getStatusColor(props.row.status)"
              :label="props.row.status"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-file_name="props">
          <q-td :props="props">
            <div class="row">
              <q-btn
                v-if="props.row.file.link"
                flat
                dense
                size="sm"
                color="primary"
                :icon="getFileIcon(props.row.file.extension)"
                @click="downloadFile(props.row.file)"
              >
                <q-tooltip>{{ t("View File") }}</q-tooltip>
              </q-btn>
              <q-icon
                v-else
                :name="getFileIcon(props.row.file.extension)"
                color="grey-5"
                size="sm"
              />
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-error_message="props">
          <q-td :props="props">
            <div v-if="props.row.error_message" class="wrapped-error">
              <q-badge
                color="negative"
                :label="props.row.error_type || 'Error'"
              />
              <div class="q-mt-xs">{{ props.row.error_message }}</div>
            </div>
            <span v-else class="text-grey-6">-</span>
          </q-td>
        </template>

        <template v-slot:body-cell-duration="props">
          <q-td :props="props">
            <span v-if="props.row.duration">
              {{ formatDuration(props.row.duration) }}
            </span>
            <span
              v-else-if="props.row.started && !props.row.completed"
              class="text-blue"
            >
              {{ t("Processing...") }}
            </span>
            <span v-else class="text-grey-6">-</span>
          </q-td>
        </template>

        <template v-slot:body-cell-additional_info="props">
          <q-td :props="props">
            <div v-if="props.row.additional_info" class="additional-info">
              <div class="row items-center q-gutter-xs">
                <q-badge
                  v-if="getModelName(props.row.additional_info)"
                  color="primary"
                  :label="getModelName(props.row.additional_info)"
                  class="q-mb-xs"
                />
              </div>
              <div
                v-if="getTokenInfo(props.row.additional_info)"
                class="token-info"
              >
                {{ getTokenInfo(props.row.additional_info) }}
              </div>
            </div>
            <span v-else class="text-grey-6">-</span>
          </q-td>
        </template>

        <template v-slot:body-cell-reference_link="props">
          <q-td :props="props">
            <router-link
              :to="getPath(props.row)"
              class="text-primary"
              v-if="props.row.reference_id"
            >
              {{ props.row.reference }}
            </router-link>
            <span v-else class="text-grey-6">-</span>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Details Dialog -->
    <q-dialog v-model="detailsDialog" maximized>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">{{ t("Processing Details") }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-none">
          <div class="q-pa-md">
            <div class="row q-gutter-md">
              <div class="col-md-6 col-sm-12">
                <q-list bordered>
                  <q-item-label header>{{
                    t("Processing Information")
                  }}</q-item-label>
                  <q-item>
                    <q-item-section>
                      <q-item-label>{{ t("Status") }}</q-item-label>
                      <q-item-label caption>
                        <q-badge
                          :color="getStatusColor(selectedRecord?.status)"
                          :label="selectedRecord?.status"
                        />
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label>{{ t("Type") }}</q-item-label>
                      <q-item-label caption>{{
                        selectedRecord?.type
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-item-label>{{ t("Started") }}</q-item-label>
                      <q-item-label caption>{{
                        formatDateTime(selectedRecord?.started)
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="selectedRecord?.completed">
                    <q-item-section>
                      <q-item-label>{{ t("Completed") }}</q-item-label>
                      <q-item-label caption>{{
                        formatDateTime(selectedRecord?.completed)
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="selectedRecord?.reference_id">
                    <q-item-section>
                      <q-item-label>{{ t("Reference ID") }}</q-item-label>
                      <q-item-label caption>{{
                        selectedRecord?.reference_id
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div class="col-md-6 col-sm-12">
                <q-list bordered>
                  <q-item-label header>{{
                    t("File Information")
                  }}</q-item-label>
                  <q-item>
                    <q-item-section>
                      <q-item-label>{{ t("File Name") }}</q-item-label>
                      <q-item-label caption>{{
                        selectedRecord?.file?.name
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label>{{ t("File Type") }}</q-item-label>
                      <q-item-label caption>{{
                        selectedRecord?.file?.extension
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label>{{ t("Storage Location") }}</q-item-label>
                      <q-item-label caption>{{
                        selectedRecord?.file?.location
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-if="selectedRecord?.file?.link">
                    <q-item-section>
                      <q-item-label>{{ t("File Link") }}</q-item-label>
                      <q-item-label caption>
                        <q-btn
                          flat
                          dense
                          color="primary"
                          icon="download"
                          :label="t('Download')"
                          @click="downloadFile(selectedRecord.file)"
                        />
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>

            <!-- Error Information -->
            <div v-if="selectedRecord?.error_message" class="q-mt-md">
              <q-list bordered>
                <q-item-label header class="text-negative">{{
                  t("Error Information")
                }}</q-item-label>
                <q-item>
                  <q-item-section>
                    <q-item-label>{{ t("Error Type") }}</q-item-label>
                    <q-item-label caption>
                      <q-badge
                        color="negative"
                        :label="selectedRecord?.error_type || 'Unknown'"
                      />
                    </q-item-label>
                  </q-item-section>
                </q-item>
                <q-item>
                  <q-item-section>
                    <q-item-label>{{ t("Error Message") }}</q-item-label>
                    <q-item-label caption>
                      <div class="wrapped-error">
                        {{ selectedRecord?.error_message }}
                      </div>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirmDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">{{ confirmMessage }}</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="t('Cancel')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="
              confirmAction === 'cancel'
                ? t('Cancel Processing')
                : t('Retry Processing')
            "
            :color="confirmAction === 'cancel' ? 'negative' : 'positive'"
            @click="executeAction"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed, onUnmounted } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify, date } from "quasar";
import { useRouter } from "vue-router";

// Inject the update title function
const updateTitle = inject("updateTitle");
updateTitle("Document Processing");

const createLink = inject("createLink");

const getPath = (row) => {
  console.log(row);
  let path = "";
  if (row.type === "customer_invoice") {
    path = createLink("customer.invoice");
  } else if (row.type === "vendor_transaction") {
    path = createLink("vendor.transaction");
  }
  return {
    path,
    query: {
      id: row.reference_id,
    },
  };
};

const { t } = useI18n();
const { formatDate } = date;
const router = useRouter();

// State variables
const loading = ref(false);
const processingRecords = ref([]);
const pagination = ref({
  sortBy: "started",
  descending: true,
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
});

// Filters
const filters = ref({
  status: null,
  type: null,
});

// Filter options
const statusOptions = [
  { label: t("Started"), value: "start" },
  { label: t("Completed"), value: "completed" },
  { label: t("Error"), value: "error" },
];

const typeOptions = [
  { label: t("Customer Invoice"), value: "customer_invoice" },
  { label: t("Vendor Invoice"), value: "vendor_invoice" },
];

// Dialog states
const detailsDialog = ref(false);
const selectedRecord = ref(null);
const confirmDialog = ref(false);
const confirmMessage = ref("");
const confirmAction = ref("");
const recordToManage = ref(null);

// Polling
let pollingInterval = null;

// Table columns
const columns = computed(() => [
  {
    name: "status",
    label: t("Status"),
    field: "status",
    align: "left",
    sortable: true,
  },
  {
    name: "type",
    label: t("Type"),
    field: "type",
    align: "left",
    sortable: true,
  },
  {
    name: "file_name",
    label: t("File"),
    field: (row) => row.file?.name,
    align: "left",
    sortable: true,
  },
  {
    name: "additional_info",
    label: t("Additional Info"),
    field: "additional_info",
    align: "left",
  },
  {
    name: "reference_link",
    label: t("Reference"),
    field: "reference_id",
    align: "center",
  },
  {
    name: "started",
    label: t("Started"),
    field: "started",
    align: "left",
    sortable: true,
    format: formatDateTime,
  },
  {
    name: "completed",
    label: t("Completed"),
    field: "completed",
    align: "left",
    sortable: true,
    format: formatDateTime,
  },
  {
    name: "duration",
    label: t("Duration"),
    field: "duration",
    align: "left",
  },

  {
    name: "error_message",
    label: t("Error"),
    field: "error_message",
    align: "left",
  },
]);

// Utility functions
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  return formatDate(new Date(dateStr), "YYYY-MM-DD HH:mm:ss");
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(2);
  return minutes > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${remainingSeconds}s`;
}

function getStatusColor(status) {
  const colors = {
    start: "blue",
    completed: "positive",
    error: "negative",
  };
  return colors[status] || "grey";
}

function getFileIcon(extension) {
  const icons = {
    pdf: "picture_as_pdf",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    bmp: "image",
    tiff: "image",
    tif: "image",
  };
  return icons[extension?.toLowerCase()] || "description";
}

function getModelName(additionalInfo) {
  if (!additionalInfo) return null;
  try {
    const info = JSON.parse(additionalInfo);
    return info.model || null;
  } catch (error) {
    console.error("Error parsing additional_info:", error);
    return null;
  }
}

function getTokenInfo(additionalInfo) {
  if (!additionalInfo) return null;
  try {
    const info = JSON.parse(additionalInfo);
    if (info.input_token && info.output_token) {
      return `${info.input_token} → ${info.output_token}`;
    }
    return null;
  } catch (error) {
    console.error("Error parsing additional_info:", error);
    return null;
  }
}

function showNotification(message, type = "positive") {
  Notify.create({
    message,
    type,
    position: "top",
  });
}

// Actions
function showDetails(record) {
  selectedRecord.value = record;
  detailsDialog.value = true;
}

function downloadFile(file) {
  if (file?.link) {
    window.open(file.link, "_blank");
  }
}

function confirmCancelProcessing(record) {
  recordToManage.value = record;
  confirmAction.value = "cancel";
  confirmMessage.value = t("Are you sure you want to cancel this processing?");
  confirmDialog.value = true;
}

function confirmRetryProcessing(record) {
  recordToManage.value = record;
  confirmAction.value = "retry";
  confirmMessage.value = t(
    "Are you sure you want to retry processing this file?"
  );
  confirmDialog.value = true;
}

function clearFilters() {
  filters.value = {
    status: null,
    type: null,
  };
  loadProcessingRecords();
}

async function executeAction() {
  if (!recordToManage.value) return;

  loading.value = true;
  try {
    const endpoint =
      confirmAction.value === "cancel"
        ? `/ai_processing/${recordToManage.value.id}/cancel`
        : `/ai_processing/${recordToManage.value.id}/retry`;

    const response = await api.post(endpoint);

    if (response.data.success) {
      showNotification(
        response.data.message || t("Action completed successfully")
      );
      await loadProcessingRecords();
    } else {
      showNotification(response.data.message || t("Action failed"), "negative");
    }
  } catch (error) {
    console.error("Error executing action:", error);
    showNotification(
      error.response?.data?.message || t("Action failed"),
      "negative"
    );
  } finally {
    loading.value = false;
    recordToManage.value = null;
    confirmAction.value = "";
  }
}

// API calls
async function loadProcessingRecords() {
  loading.value = true;
  try {
    const params = {
      limit: pagination.value.rowsPerPage,
      offset: (pagination.value.page - 1) * pagination.value.rowsPerPage,
    };

    // Add filters
    if (filters.value.status) params.status = filters.value.status;
    if (filters.value.type) params.type = filters.value.type;

    const response = await api.get("/ai_processing/list", { params });

    if (response.data.success) {
      processingRecords.value = response.data.data.records;
      pagination.value.rowsNumber = response.data.data.pagination.total;
    } else {
      showNotification(
        response.data.message || t("Failed to load processing records"),
        "negative"
      );
    }
  } catch (error) {
    console.error("Error loading processing records:", error);
    showNotification(
      error.response?.data?.message || t("Failed to load processing records"),
      "negative"
    );
  } finally {
    loading.value = false;
  }
}

function onRequest(props) {
  Object.assign(pagination.value, props.pagination);
  loadProcessingRecords();
}

function setupPolling() {
  if (pollingInterval) clearInterval(pollingInterval);

  // Check for active processing records
  const hasActiveRecords = processingRecords.value.some(
    (record) => record.status === "start"
  );

  // More frequent polling if there are active records
  const pollTime = hasActiveRecords ? 5000 : 15000;
  pollingInterval = setInterval(loadProcessingRecords, pollTime);
}

// Lifecycle
onMounted(() => {
  loadProcessingRecords();
  setupPolling();
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<style scoped>
.wrapped-error {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 100px;
  overflow-y: auto;
  color: var(--q-negative);
  font-size: 0.85em;
}

:deep(.q-table__container) {
  height: calc(100vh - 240px);
  position: relative;
}

:deep(.q-table thead) {
  position: sticky;
  z-index: 2;
  top: 0;
  background-color: var(--q-maintext);
  color: var(--q-maindark);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

:deep(.q-table thead tr) {
  position: sticky;
  top: 0;
  z-index: 2;
}

:deep(.q-table thead tr th) {
  position: sticky;
  top: 0;
  z-index: 2;
  font-weight: var(--q-font-weight-bolder);
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}

:deep(.q-table td) {
  padding: 8px 12px;
  vertical-align: top;
}

.text-left {
  text-align: left;
}

.text-right {
  text-align: right;
}

.additional-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.token-info {
  font-size: 0.85em;
  color: var(--q-primary);
  font-weight: 500;
}
</style>
