<!-- BankAdjustmentConfirmation.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md">
      <div class="col">
        <div class="text-h4">{{ t("Final Step: Clearing Account Adjustment") }}</div>
        <q-btn
          flat
          icon="arrow_back"
          :label="t('Back to Details')"
          @click="goBack"
          class="q-mt-sm"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-grey-6 q-mt-md">{{ t("Loading confirmation details...") }}</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-lg">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-negative q-mt-md">{{ error }}</div>
      <q-btn
        :label="t('Retry')"
        color="primary"
        class="q-mt-md"
        @click="fetchConfirmationData"
      />
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Warning Banner -->
      <q-banner class="bg-warning text-black q-mb-md">
        <template v-slot:avatar>
          <q-icon name="warning" />
        </template>
        <div class="text-weight-bold">
          {{ t("Review carefully - this action cannot be undone") }}
        </div>
        <div class="text-caption">
          {{ t("This will permanently modify your accounting records") }}
        </div>
      </q-banner>

      <!-- GL Transaction Details -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">{{ t("Clearing Account Transaction") }}</div>
          <q-table
            :rows="glDetails"
            :columns="glColumns"
            flat
            dense
            bordered
            hide-pagination
            class="q-mt-md"
          >
            <template v-slot:body-cell-debit="props">
              <q-td :props="props" class="text-right">
                {{ props.value ? formatAmount(props.value) : "" }}
              </q-td>
            </template>
            <template v-slot:body-cell-credit="props">
              <q-td :props="props" class="text-right">
                {{ props.value ? formatAmount(props.value) : "" }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <!-- Selected Transactions -->
      <q-card v-if="selectedTransactions.length" class="q-mb-md">
        <q-card-section>
          <div class="text-h6">{{ t("Transactions to be Adjusted") }}</div>
          <q-table
            :rows="selectedTransactions"
            :columns="selectedColumns"
            flat
            dense
            bordered
            hide-pagination
            class="q-mt-md"
          >
            <template v-slot:body-cell-amount="props">
              <q-td :props="props" class="text-right">
                {{ formatAmount(props.value) }}
              </q-td>
            </template>
          </q-table>

          <!-- Totals Row -->
          <q-separator class="q-mt-md" />
          <div class="row q-pa-sm bg-grey-2">
            <div class="col text-weight-bold">{{ t("Total") }}:</div>
            <div class="col-2 text-right text-weight-bold">
              {{ formatAmount(totalAmount) }}
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Selected GL Account -->
      <q-card v-if="glAccountDetails.accno" class="q-mb-md">
        <q-card-section>
          <div class="text-h6">{{ t("Selected GL Account") }}</div>
          <q-table
            :rows="[glAccountDetails]"
            :columns="glAccountColumns"
            flat
            dense
            bordered
            hide-pagination
            class="q-mt-md"
          />
        </q-card-section>
      </q-card>

      <!-- Summary Card -->
      <q-card class="q-mb-md">
        <q-card-section class="bg-grey-2">
          <div class="text-h6">{{ t("Transaction Summary") }}</div>
          <div class="q-mt-sm">
            <div v-if="selectedTransactions.length">
              <strong>{{ selectedTransactions.length }}</strong> {{ t("transactions will be adjusted") }}
            </div>
            <div v-if="glAccountDetails.accno">
              {{ t("GL account will be changed to") }}:
              <strong
                >{{ glAccountDetails.accno }} -
                {{ glAccountDetails.description }}</strong
              >
            </div>
            <div v-if="totalAmount > 0">
              {{ t("Total adjustment amount") }}:
              <strong>{{ formatAmount(totalAmount) }}</strong>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Action Buttons -->
      <div class="q-gutter-md">
        <q-btn
          color="primary"
          :label="t('Just Do It')"
          icon="check"
          :loading="processing"
          @click="confirmProcessing"
        />
        <q-btn
          color="grey"
          :label="t('Back')"
          icon="arrow_back"
          @click="goBack"
          :disabled="processing"
        />
      </div>
    </div>

    <!-- Processing Confirmation Dialog -->
    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ t("Confirm Processing") }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ t("Are you sure you want to process this adjustment? This action cannot be undone.") }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="t('Cancel')" v-close-popup />
          <q-btn
            flat
            :label="t('Yes, Process')"
            color="primary"
            @click="processAdjustment"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { formatAmount } from "src/helpers/utils";
import { useI18n } from "vue-i18n";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

// Reactive data
const loading = ref(false);
const processing = ref(false);
const error = ref(null);
const glDetails = ref([]);
const selectedTransactions = ref([]);
const glAccountDetails = ref({});
const showConfirmDialog = ref(false);

// Table columns
const glColumns = [
  { name: "id", label: t("ID"), field: "id", align: "left" },
  { name: "reference", label: t("Reference"), field: "reference", align: "left" },
  { name: "transdate", label: t("Date"), field: "transdate", align: "left" },
  { name: "accno", label: t("Account"), field: "accno", align: "left" },
  {
    name: "account_description",
    label: t("Account Description"),
    field: "account_description",
    align: "left",
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  { name: "source", label: t("Source"), field: "source", align: "left" },
  { name: "memo", label: t("Memo"), field: "memo", align: "left" },
  { name: "debit", label: t("Debit"), field: "debit", align: "right" },
  { name: "credit", label: t("Credit"), field: "credit", align: "right" },
];

const selectedColumns = [
  { name: "invnumber", label: t("Invoice"), field: "invnumber", align: "left" },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  {
    name: "ordnumber",
    label: t("Order Number"),
    field: "ordnumber",
    align: "left",
  },
  { name: "transdate", label: t("Date"), field: "transdate", align: "left" },
  { name: "amount", label: t("Amount"), field: "amount", align: "right" },
];

const glAccountColumns = [
  { name: "accno", label: t("Account"), field: "accno", align: "left" },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
];

// Computed properties
const totalAmount = computed(() => {
  return selectedTransactions.value.reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );
});

// Methods
const fetchConfirmationData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.post("/bank_adjustments/book_selected", {
      trans_id: route.params.trans_id,
      accno: route.query.accno,
      gl_account_id: route.query.gl_account_id,
      selected_ids: route.query.selected_ids,
    });

    if (response.data.success) {
      const data = response.data.data;
      glDetails.value = data.gl_details || [];
      selectedTransactions.value = data.selected_transactions || [];
      glAccountDetails.value = data.gl_account_details || {};
    } else {
      error.value = response.data.error || t("Failed to fetch confirmation data");
    }
  } catch (err) {
    console.error("Error fetching confirmation data:", err);
    error.value =
      err.response?.data?.error ||
      t("An error occurred while fetching confirmation data");
  } finally {
    loading.value = false;
  }
};

const confirmProcessing = () => {
  showConfirmDialog.value = true;
};

const processAdjustment = async () => {
  processing.value = true;

  try {
    const response = await api.post("/bank_adjustments/process_adjustment", {
      trans_id: route.params.trans_id,
      gl_account_id: route.query.gl_account_id,
      accno: route.query.accno,
      selected_ids: route.query.selected_ids,
    });

    if (response.data.success) {
      $q.notify({
        type: "positive",
        message: response.data.message || t("Adjustment processed successfully!"),
        timeout: 3000,
      });

      // Navigate back to main transactions page
      router.push({ name: "BankAdjustment" });
    } else {
      $q.notify({
        type: "negative",
        message: response.data.error || t("Processing failed"),
        timeout: 5000,
      });
    }
  } catch (err) {
    console.error("Error processing adjustment:", err);
    $q.notify({
      type: "negative",
      message:
        err.response?.data?.error ||
        t("An error occurred while processing the adjustment"),
      timeout: 5000,
    });
  } finally {
    processing.value = false;
  }
};

const goBack = () => {
  router.push({
    name: "BankAdjustmentDetail",
    params: { trans_id: route.params.trans_id, accno: route.query.accno },
  });
};

// Lifecycle
onMounted(() => {
  fetchConfirmationData();
});
</script>
