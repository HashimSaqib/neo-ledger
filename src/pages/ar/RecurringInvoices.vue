<template>
  <q-page class="q-pa-md relative-position">
    <div class="row justify-between items-center q-mb-md">
      <h6 class="q-my-none text-secondary">{{ t("Recurring Invoices") }}</h6>
      <q-btn
        color="primary"
        :label="t('Create recurring invoice')"
        icon="add"
        @click="goToCreate"
      />
    </div>

    <div v-if="loading" class="full-width flex justify-center q-pa-lg">
      <q-spinner color="primary" size="3em" />
    </div>

    <q-table
      v-else
      :rows="rows"
      :columns="columns"
      row-key="id"
      flat
      dense
      :rows-per-page-options="[10, 25, 50]"
      class="maintext"
    >
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          {{ props.value || t("(Unnamed)") }}
        </q-td>
      </template>
      <template v-slot:body-cell-frequency="props">
        <q-td :props="props">
          {{ formatFrequency(props.row) }}
        </q-td>
      </template>
      <template v-slot:body-cell-next_run_at="props">
        <q-td :props="props">
          {{ props.value ? formatDateTime(props.value) : "—" }}
        </q-td>
      </template>
      <template v-slot:body-cell-is_active="props">
        <q-td :props="props">
          <q-badge :color="props.value ? 'positive' : 'grey'">
            {{ props.value ? t("Active") : t("Inactive") }}
          </q-badge>
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props" class="q-gutter-xs">
          <q-btn
            flat
            dense
            size="sm"
            icon="edit"
            color="primary"
            @click="editRecurring(props.row.id)"
          >
            <q-tooltip>{{ t("Edit") }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            size="sm"
            icon="history"
            color="primary"
            @click="openRuns(props.row)"
          >
            <q-tooltip>{{ t("View runs") }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            size="sm"
            icon="delete"
            color="negative"
            @click="confirmDeleteRecurring(props.row)"
          >
            <q-tooltip>{{ t("Delete") }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Runs history dialog -->
    <q-dialog v-model="runsDialog" persistent>
      <q-card style="min-width: 500px; max-width: 90vw">
        <q-card-section class="row items-center">
          <span class="text-h6">{{ t("Recurring invoice runs") }}</span>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div v-if="runsLoading" class="flex justify-center q-py-md">
            <q-spinner color="primary" />
          </div>
          <q-table
            v-else
            :rows="runs"
            :columns="runsColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 10 }"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge
                  :color="props.value === 'success' ? 'positive' : 'negative'"
                >
                  {{ props.value }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-created_invoice_id="props">
              <q-td :props="props">
                <q-btn
                  v-if="props.value"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  :label="String(props.value)"
                  @click="openInvoice(props.value)"
                />
                <span v-else>—</span>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete confirmation -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">{{ t("Delete recurring invoice?") }}</div>
          <div class="text-body2 q-mt-sm">
            {{ t("This will remove the recurring schedule. Already created invoices are not affected.") }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="t('Cancel')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="t('Delete')"
            color="negative"
            @click="deleteRecurring"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "src/boot/axios";
import { Notify } from "quasar";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const rows = ref([]);
const runsDialog = ref(false);
const runsLoading = ref(false);
const runs = ref([]);
const deleteDialog = ref(false);
const recurringToDelete = ref(null);

const columns = [
  { name: "name", label: t("Name"), field: "name", align: "left", sortable: true },
  { name: "frequency", label: t("Schedule"), field: "frequency", align: "left" },
  { name: "next_run_at", label: t("Next run"), field: "next_run_at", align: "left" },
  { name: "is_active", label: t("Status"), field: "is_active", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

const runsColumns = [
  { name: "ran_at", label: t("Run at"), field: "ran_at", align: "left" },
  { name: "status", label: t("Status"), field: "status", align: "left" },
  { name: "created_invoice_id", label: t("Invoice"), field: "created_invoice_id", align: "left" },
  { name: "error_message", label: t("Error"), field: "error_message", align: "left" },
];

const WEEK_DAY_LABELS = [
  t("Mon"), t("Tue"), t("Wed"), t("Thu"), t("Fri"), t("Sat"), t("Sun"),
];

function formatFrequency(row) {
  const freq = row.frequency || "monthly";
  const cap = t(freq.charAt(0).toUpperCase() + freq.slice(1));
  const schedule = row.custom_schedule;
  const days = schedule && typeof schedule === "object" && Array.isArray(schedule.days)
    ? schedule.days
    : typeof schedule === "string"
      ? (() => { try { const p = JSON.parse(schedule); return p?.days || []; } catch { return []; } })()
      : [];
  const timeStr = row.delivery_time ? String(row.delivery_time).substring(0, 5) : "";
  if (freq === "weekly" && days.length > 0) {
    const labels = days.map((d) => WEEK_DAY_LABELS[d - 1] || d);
    return timeStr ? `${cap} (${labels.join(", ")}) ${timeStr}` : `${cap} (${labels.join(", ")})`;
  }
  if (freq === "monthly" && days.length > 0) {
    const labels = days.map((d) => (d === -1 ? t("Last") : String(d)));
    return timeStr ? `${cap} (${labels.join(", ")}) ${timeStr}` : `${cap} (${labels.join(", ")})`;
  }
  return timeStr ? `${cap} ${timeStr}` : cap;
}

function formatDateTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function fetchList() {
  loading.value = true;
  try {
    const { data } = await api.get("/recurring-invoices");
    rows.value = Array.isArray(data) ? data : [];
  } catch (e) {
    Notify.create({
      message: e.response?.data?.error || t("Failed to load recurring invoices"),
      type: "negative",
      position: "center",
    });
    rows.value = [];
  } finally {
    loading.value = false;
  }
}

const clientPath = computed(() => `/client/${route.params.client || ""}`);

function goToCreate() {
  router.push({
    path: `${clientPath.value}/ar/sales-invoice/invoice`,
    query: { recurring: "1" },
  });
}

function editRecurring(id) {
  router.push({
    path: `${clientPath.value}/ar/sales-invoice/invoice`,
    query: { recurringId: String(id) },
  });
}

function openInvoice(invoiceId) {
  router.push({
    path: `${clientPath.value}/ar/sales-invoice/invoice`,
    query: { id: String(invoiceId) },
  });
  runsDialog.value = false;
}

async function openRuns(row) {
  runsDialog.value = true;
  runs.value = [];
  runsLoading.value = true;
  try {
    const { data } = await api.get(`/recurring-invoices/${row.id}/runs`);
    runs.value = Array.isArray(data) ? data : [];
  } catch (e) {
    Notify.create({
      message: e.response?.data?.error || t("Failed to load runs"),
      type: "negative",
      position: "center",
    });
  } finally {
    runsLoading.value = false;
  }
}

function confirmDeleteRecurring(row) {
  recurringToDelete.value = row;
  deleteDialog.value = true;
}

async function deleteRecurring() {
  if (!recurringToDelete.value) return;
  const id = recurringToDelete.value.id;
  try {
    await api.delete(`/recurring-invoices/${id}`);
    Notify.create({
      message: t("Recurring invoice deleted"),
      type: "positive",
      position: "top-right",
    });
    deleteDialog.value = false;
    recurringToDelete.value = null;
    await fetchList();
  } catch (e) {
    Notify.create({
      message: e.response?.data?.error || t("Delete failed"),
      type: "negative",
      position: "center",
    });
  }
}

onMounted(() => {
  fetchList();
});
</script>
