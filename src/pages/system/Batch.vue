<template>
  <q-page class="lightbg q-pa-sm">
    <div class="q-pa-md">
      <!-- Jobs table -->
      <q-table
        :rows="jobs"
        :columns="columns"
        :loading="loading"
        row-key="id"
        :pagination="{ rowsPerPage: 10 }"
        v-model:pagination="pagination"
        dense
        :rows-per-page-options="[0]"
        hide-bottom
      >
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>

        <template v-slot:body-cell-progress_percent="props">
          <q-td :props="props">
            <q-linear-progress
              :value="props.row.progress_percent / 100"
              class="q-mt-sm"
              color="primary"
              size="25px"
              :label="true"
            >
              <div class="absolute-full flex flex-center">
                <q-badge
                  color="white"
                  text-color="black"
                  :label="`${props.row.progress_percent}%`"
                />
              </div>
            </q-linear-progress>
          </q-td>
        </template>

        <template v-slot:body-cell-failed_count="props">
          <q-td :props="props">
            <a
              v-if="props.row.failed_count > 0"
              href="#"
              class="text-negative"
              @click.prevent="showJobDetails(props.row, 'error')"
            >
              {{ props.row.failed_count }}
            </a>
            <span v-else>{{ props.row.failed_count }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-total_emails="props">
          <q-td :props="props">
            <a
              href="#"
              class="text-primary"
              @click.prevent="showEmails(props.row)"
            >
              {{ props.row.total_emails }}
            </a>
          </q-td>
        </template>

        <template v-slot:body-cell-view_emails="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              color="primary"
              icon="email"
              @click="showEmails(props.row)"
              :label="t('View')"
            />
          </q-td>
        </template>

        <template v-slot:body-cell-success_count="props">
          <q-td :props="props">
            <a
              v-if="props.row.success_count > 0"
              href="#"
              class="text-positive"
              @click.prevent="showJobDetails(props.row, 'success')"
            >
              {{ props.row.success_count }}
            </a>
            <span v-else>{{ props.row.success_count }}</span>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <div class="row no-wrap">
              <!-- Cancel button - only for active or inactive jobs -->
              <q-btn
                v-if="['active', 'inactive'].includes(props.row.state)"
                flat
                dense
                color="negative"
                icon="cancel"
                @click="confirmJobAction(props.row, 'cancel')"
                class="q-mr-xs"
              >
                <q-tooltip>{{ t("Cancel") }}</q-tooltip>
              </q-btn>

              <!-- Delete button - for all jobs -->
              <q-btn
                flat
                dense
                color="grey"
                icon="delete"
                @click="confirmJobAction(props.row, 'delete')"
              >
                <q-tooltip>{{ t("Delete") }}</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="getStatusColor(props.row.status)"
              :label="props.row.status"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Combined Email/Errors Dialog -->
    <q-dialog v-model="itemsDialog">
      <q-card style="min-width: 700px; max-height: 80vh">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ dialogTitle }}
          </div>
          <q-space></q-space>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-none">
          <q-table
            :rows="selectedItems"
            :columns="currentColumns"
            dense
            :loading="detailsLoading"
            :pagination="detailsPagination"
            v-model:pagination="detailsPagination"
            @request="onDetailsRequest"
          >
            <template v-slot:loading>
              <q-inner-loading showing color="primary" />
            </template>
            <template
              v-slot:body-cell-error_message="props"
              v-if="showingErrors"
            >
              <q-td :props="props">
                <div class="wrapped-error">{{ props.value }}</div>
              </q-td>
            </template>
          </q-table>
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
            :label="getActionLabel(confirmAction)"
            :color="getActionColor(confirmAction)"
            @click="executeJobAction"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed, onUnmounted, watch } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify, date } from "quasar";

// Inject the update title function
const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Email Batch Jobs"));
const { formatDate } = date;

// State variables
const loading = ref(false);
const jobs = ref([]);
const pagination = ref({
  rowsPerPage: 10,
  page: 1,
});
let pollingInterval = null;
let activeJobsExist = ref(false);

// Email dialog variables
const itemsDialog = ref(false);
const selectedItems = ref([]);
const showingErrors = ref(false);
const detailsLoading = ref(false);
const selectedJobId = ref(null);
const selectedStatusType = ref(null);
const dialogTitle = ref("");
const detailsPagination = ref({
  rowsPerPage: 20,
  page: 1,
  sortBy: "created_at",
  descending: true,
});
const totalDetails = ref(0);

// Confirmation dialog variables
const confirmDialog = ref(false);
const confirmMessage = ref("");
const confirmAction = ref("");
const jobToManage = ref(null);

// Table column definitions
const columns = computed(() => [
  { name: "id", label: t("ID"), field: "id", align: "left", sortable: true },
  {
    name: "jobtype",
    label: t("Job Name"),
    field: "jobtype",
    align: "left",
    sortable: true,
  },
  {
    name: "status",
    label: t("Status"),
    field: "status",
    align: "left",
    sortable: true,
  },
  {
    name: "created",
    label: t("Created"),
    field: "created",
    align: "left",
    sortable: true,
    format: formatDateTime,
  },
  {
    name: "finished",
    label: t("Finished"),
    field: "finished",
    align: "left",
    sortable: true,
    format: formatDateTime,
  },
  {
    name: "total_emails",
    label: t("Total"),
    field: "total_emails",
    align: "right",
    sortable: true,
  },
  {
    name: "success_count",
    label: t("Success"),
    field: "success_count",
    align: "right",
    sortable: true,
  },
  {
    name: "failed_count",
    label: t("Failed"),
    field: "failed_count",
    align: "right",
    sortable: true,
  },
  {
    name: "progress_percent",
    label: t("Progress"),
    field: "progress_percent",
    align: "center",
  },
  {
    name: "actions",
    label: t("Actions"),
    field: "actions",
    align: "center",
  },
]);

// Email columns for the job details
const emailColumns = computed(() => [
  {
    name: "invnumber",
    label: t("Invoice #"),
    field: "invnumber",
    align: "left",
    sortable: true,
  },
  {
    name: "email",
    label: t("Email"),
    field: "email",
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: t("Name"),
    field: "name",
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
    name: "created_at",
    label: t("Processed At"),
    field: "created_at",
    align: "left",
    sortable: true,
    format: formatDateTimeIso,
  },
]);

// Error columns
const errorColumns = computed(() => [
  {
    name: "invnumber",
    label: t("Invoice #"),
    field: "invnumber",
    align: "left",
    sortable: true,
  },
  {
    name: "email",
    label: t("Email"),
    field: "email",
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: t("Name"),
    field: "name",
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
    name: "error_message",
    label: t("Error Message"),
    field: "error_message",
    align: "left",
    sortable: true,
  },
  {
    name: "created_at",
    label: t("Processed At"),
    field: "created_at",
    align: "left",
    sortable: true,
    format: formatDateTimeIso,
  },
]);

// Determine current columns based on what we're displaying
const currentColumns = computed(() => {
  return showingErrors.value ? errorColumns.value : emailColumns.value;
});

// Utility functions
function formatDateTime(timestamp) {
  if (!timestamp) return "";
  return formatDate(new Date(timestamp * 1000), "YYYY-MM-DD HH:mm:ss");
}

function formatDateTimeIso(dateStr) {
  if (!dateStr) return "";
  return formatDate(new Date(dateStr), "YYYY-MM-DD HH:mm:ss");
}

function getStatusColor(status) {
  const statusColors = {
    active: "blue",
    inactive: "grey",
    finished: "positive",
    completed: "positive",
    failed: "negative",
    queued: "orange",
  };
  return statusColors[status] || "grey";
}

function getActionLabel(action) {
  const labels = {
    delete: t("Delete"),
    cancel: t("Cancel Job"),
    restart: t("Restart"),
  };
  return labels[action] || t("Confirm");
}

function getActionColor(action) {
  return ["delete", "cancel"].includes(action) ? "negative" : "primary";
}

function showNotification(message, type = "positive") {
  Notify.create({
    message,
    type,
    position: "top",
  });
}

// View functions
function showEmails(job) {
  if (job.emails && Array.isArray(job.emails)) {
    selectedItems.value = job.emails;
    showingErrors.value = false;
    dialogTitle.value = t("Emails to Process");
    itemsDialog.value = true;
  } else {
    showNotification(t("No email data available"), "warning");
  }
}

async function showJobDetails(job, status) {
  selectedJobId.value = job.id;
  selectedStatusType.value = status;
  showingErrors.value = status === "error";
  dialogTitle.value =
    status === "error" ? t("Failed Emails") : t("Successful Emails");
  detailsPagination.value.page = 1;

  itemsDialog.value = true;
  await loadJobStatusDetails();
}

// API interactions
async function loadJobStatusDetails() {
  if (!selectedJobId.value || !selectedStatusType.value) return;

  detailsLoading.value = true;
  try {
    const response = await api.get(`/email_job_status/${selectedJobId.value}`, {
      params: {
        status: selectedStatusType.value,
        page: detailsPagination.value.page,
        per_page: detailsPagination.value.rowsPerPage,
      },
    });

    if (response.data.success) {
      selectedItems.value = response.data.items;
      totalDetails.value = response.data.total;
    } else {
      showNotification(
        response.data.message || t("Failed to load details"),
        "negative"
      );
    }
  } catch (error) {
    console.error("Error fetching job details:", error);
    showNotification(
      error.response?.data?.message || t("Failed to load details"),
      "negative"
    );
  } finally {
    detailsLoading.value = false;
  }
}

function onDetailsRequest(props) {
  Object.assign(detailsPagination.value, props.pagination);
  loadJobStatusDetails();
}

function confirmJobAction(job, action) {
  jobToManage.value = job;
  confirmAction.value = action;

  const messages = {
    cancel: t("Are you sure you want to cancel this job?"),
    restart: t(
      "Are you sure you want to restart this job? A new job will be created with the same parameters."
    ),
    delete: t(
      "Are you sure you want to delete this job? This action cannot be undone."
    ),
  };

  confirmMessage.value = messages[action] || t("Are you sure?");
  confirmDialog.value = true;
}

async function executeJobAction() {
  if (!jobToManage.value || !confirmAction.value) return;

  loading.value = true;
  try {
    const response = await api.post("/manage_email_job", null, {
      params: {
        job_id: jobToManage.value.id,
        action: confirmAction.value,
      },
    });

    if (response.data.success) {
      showNotification(response.data.message);

      // If restart, potentially handle the new job ID
      if (confirmAction.value === "restart" && response.data.new_job_id) {
        console.log("New job created with ID:", response.data.new_job_id);
      }

      // Reload jobs to reflect changes
      await loadJobs();
    } else {
      showNotification(response.data.message || t("Action failed"), "negative");
    }
  } catch (error) {
    console.error(`Error ${confirmAction.value} job:`, error);
    showNotification(
      error.response?.data?.message || t("Action failed"),
      "negative"
    );
  } finally {
    loading.value = false;
    jobToManage.value = null;
    confirmAction.value = "";
  }
}

async function loadJobs() {
  loading.value = true;
  try {
    const response = await api.get("/email_jobs");
    if (response.data.success) {
      jobs.value = response.data.jobs;

      // Check if any active jobs exist to adjust polling frequency
      activeJobsExist.value = jobs.value.some((job) =>
        ["active", "inactive", "queued"].includes(job.state)
      );

      // If details dialog is open and we're looking at the current job, refresh the details too
      if (itemsDialog.value && selectedJobId.value) {
        loadJobStatusDetails();
      }
    } else {
      showNotification(
        response.data.message || t("Failed to load jobs"),
        "negative"
      );
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
    showNotification(
      error.response?.data?.message || t("Failed to load jobs"),
      "negative"
    );
  } finally {
    loading.value = false;
  }
}

// Polling management
function setupPolling() {
  if (pollingInterval) clearInterval(pollingInterval);

  // Set polling interval - more frequent if there are active jobs
  const pollTime = activeJobsExist.value ? 5000 : 15000;
  pollingInterval = setInterval(loadJobs, pollTime);

  return pollingInterval;
}

// Lifecycle and watchers
watch(activeJobsExist, setupPolling);

watch(itemsDialog, (isOpen) => {
  if (!isOpen) {
    selectedJobId.value = null;
    selectedStatusType.value = null;
    selectedItems.value = [];
  }
});

onMounted(() => {
  loadJobs();
  pollingInterval = setupPolling();
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<style scoped>
.wrapped-error {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}
:deep(.q-table__container) {
  height: calc(100vh - 180px);
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
.q-table--loading {
  opacity: 0.7;
  transition: opacity 0.3s ease-in-out;
}
:deep(.totals-row),
:deep(.subtotal-row) {
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
  font-weight: var(--q-font-weight-bolder);
}
.group-header {
  background-color: var(--q-secondary);
  color: var(--q-mainbg);
  font-weight: bold;
}
:deep(.q-table td) {
  padding: 8px 16px;
}
:deep(.q-virtual-scroll__content) {
  margin-bottom: 0 !important;
}
.text-left {
  text-align: left;
}
.text-right {
  text-align: right;
}
.wrapped-description {
  white-space: pre-wrap;
  min-width: 10vw;
}
.wrapped-error {
  white-space: pre-wrap;
  min-width: 10vw;
  color: var(--q-negative);
}
</style>
