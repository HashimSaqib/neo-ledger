<!-- BankAdjustmentDetail.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md">
      <div class="col">
        <q-btn
          flat
          icon="arrow_back"
          label="Back to Transactions"
          @click="goBack"
        />
      </div>
    </div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-grey-6 q-mt-md">Loading transaction details...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-lg">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-negative q-mt-md">{{ error }}</div>
      <q-btn
        label="Retry"
        color="primary"
        class="q-mt-md"
        @click="fetchTransactionDetails"
      />
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- GL Transaction Details -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">GL Transaction Details</div>
          <q-table
            :rows="glTransactions"
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

      <!-- GL Account Selection Form -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Account Selection & Filters</div>
          <div class="row q-gutter-md">
            <div class="col-md-3">
              <s-select
                v-model="selectedGlAccount"
                :options="chartAccounts"
                label="GL Account"
                option-value="id"
                option-label="descrip"
                emit-value
                map-options
                clearable
                search="descrip"
              />
            </div>

            <div class="col-md-2">
              <q-input
                v-model="fromDate"
                label="From Date"
                type="date"
                dense
                bg-color="input"
                outlined
              />
            </div>
            <div class="col-md-2">
              <q-input
                v-model="toDate"
                label="To Date"
                type="date"
                dense
                bg-color="input"
                outlined
              />
            </div>
            <div class="col-md-2">
              <q-select
                dense
                v-model="arapType"
                :options="[
                  { label: 'AR', value: 'ar' },
                  { label: 'AP', value: 'ap' },
                ]"
                label="AR or AP"
                emit-value
                map-options
                outlined
                bg-color="input"
              />
            </div>
            <div class="col-md-3">
              <q-input
                v-model="iban"
                label="IBAN"
                dense
                bg-color="input"
                outlined
              />
            </div>
            <div class="col-md-2">
              <q-btn
                color="primary"
                label="Load Transactions"
                @click="loadOutstandingTransactions"
                :loading="loadingOutstanding"
              />
            </div>
          </div>
          <div class="row q-gutter-md q-mt-sm">
            <div class="col-md-2">
              <q-btn
                color="primary"
                label="Select All"
                @click="selectAll"
                :disabled="!outstandingTransactions.length"
              />
            </div>
            <div class="col-md-2">
              <q-btn
                color="black"
                label="Deselect All"
                @click="deselectAll"
                :disabled="!outstandingTransactions.length"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Outstanding Transactions -->
      <q-card v-if="outstandingTransactions.length" class="q-mb-md">
        <q-card-section>
          <div class="text-h6">
            Outstanding {{ arapType.toUpperCase() }} Transactions
          </div>
          <q-table
            :rows="outstandingTransactions"
            :columns="outstandingColumns"
            flat
            dense
            bordered
            hide-pagination
            class="q-mt-md"
          >
            <template v-slot:body-cell-select="props">
              <q-td :props="props">
                <q-checkbox
                  v-model="props.row.selected"
                  @update:model-value="updateSelection"
                />
              </q-td>
            </template>
            <template v-slot:body-cell-amount="props">
              <q-td :props="props" class="text-right">
                {{ formatAmount(props.value) }}
              </q-td>
            </template>
            <template v-slot:body-cell-paid="props">
              <q-td :props="props" class="text-right">
                {{ formatAmount(props.value) }}
              </q-td>
            </template>
            <template v-slot:body-cell-due="props">
              <q-td :props="props" class="text-right">
                {{ formatAmount(props.value) }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <!-- Action Buttons -->
      <div class="q-gutter-md">
        <q-btn
          color="primary"
          label="Book Selected Transactions"
          :disabled="!hasValidSelection"
          @click="proceedToConfirmation"
        />
        <q-btn color="black" label="Cancel" @click="goBack" />
      </div>

      <!-- Selection Summary -->
      <q-card v-if="selectedTransactions.length" class="q-mt-md">
        <q-card-section>
          <div class="text-h6">Selection Summary</div>
          <div class="q-mt-sm">
            <div>
              <strong>Selected Transactions:</strong>
              {{ selectedTransactions.length }}
            </div>
            <div>
              <strong>Total Amount:</strong>
              {{ formatAmount(totalSelectedAmount) }}
            </div>
            <div>
              <strong>Search Amount:</strong> {{ formatAmount(searchAmount) }}
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { formatAmount } from "src/helpers/utils";

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

// Reactive data
const loading = ref(false);
const loadingOutstanding = ref(false);
const error = ref(null);
const glTransactions = ref([]);
const chartAccounts = ref([]);
const outstandingTransactions = ref([]);
const selectedGlAccount = ref(null);
const fromDate = ref("");
const toDate = ref("");
const arapType = ref("ar");
const searchAmount = ref(0);
const iban = ref("");

// Table columns
const glColumns = [
  { name: "reference", label: "Reference", field: "reference", align: "left" },
  { name: "transdate", label: "Date", field: "transdate", align: "left" },
  { name: "accno", label: "Account", field: "accno", align: "left" },
  {
    name: "account_description",
    label: "Description",
    field: "account_description",
    align: "left",
  },
  {
    name: "description",
    label: "GL Description",
    field: "description",
    align: "left",
  },
  { name: "source", label: "Source", field: "source", align: "left" },
  { name: "memo", label: "Memo", field: "memo", align: "left" },
  { name: "curr", label: "Currency", field: "curr", align: "left" },
  { name: "debit", label: "Debit", field: "debit", align: "right" },
  { name: "credit", label: "Credit", field: "credit", align: "right" },
];

const outstandingColumns = [
  { name: "select", label: "Select", field: "select", align: "center" },
  { name: "invnumber", label: "Invoice#", field: "invnumber", align: "left" },
  { name: "transdate", label: "Date", field: "transdate", align: "left" },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "left",
  },
  { name: "ordnumber", label: "Order#", field: "ordnumber", align: "left" },
  { name: "name", label: "Customer/Vendor", field: "name", align: "left" },
  { name: "curr", label: "Currency", field: "curr", align: "left" },
  { name: "amount", label: "Amount", field: "amount", align: "right" },
  { name: "paid", label: "Paid", field: "paid", align: "right" },
  { name: "due", label: "Due", field: "due", align: "right" },
];

// Computed properties
const selectedTransactions = computed(() => {
  return outstandingTransactions.value.filter((t) => t.selected);
});

const totalSelectedAmount = computed(() => {
  return selectedTransactions.value.reduce((sum, t) => sum + (t.due || 0), 0);
});

const hasValidSelection = computed(() => {
  return selectedGlAccount.value || selectedTransactions.value.length > 0;
});

// Methods
const fetchTransactionDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get("/bank_adjustments/transaction_detail", {
      params: {
        trans_id: route.params.trans_id,
        accno: route.params.accno,
      },
    });

    if (response.data.success) {
      const data = response.data.data;
      glTransactions.value = data.gl_transactions || [];
      chartAccounts.value = data.chart_accounts || [];
      searchAmount.value = data.search_amount || 0;
      arapType.value = data.arap || "ar";

      // Set IBAN from the first transaction's source field
      if (glTransactions.value.length > 0) {
        iban.value = glTransactions.value[0].source || "";
      }

      // Auto-load outstanding transactions
      loadOutstandingTransactions();
    } else {
      error.value =
        response.data.error || "Failed to fetch transaction details";
    }
  } catch (err) {
    console.error("Error fetching transaction details:", err);
    error.value =
      err.response?.data?.error ||
      "An error occurred while fetching transaction details";
  } finally {
    loading.value = false;
  }
};

const loadOutstandingTransactions = async () => {
  loadingOutstanding.value = true;

  try {
    const response = await api.get(
      "/bank_adjustments/outstanding_transactions",
      {
        params: {
          arap: arapType.value,
          fromdate: fromDate.value,
          todate: toDate.value,
          search_amount: searchAmount.value,
          iban: iban.value,
        },
      }
    );

    if (response.data.success) {
      const data = response.data.data;
      outstandingTransactions.value = (data.outstanding_transactions || []).map(
        (t) => ({
          ...t,
          selected: Boolean(t.auto_selected),
        })
      );
    } else {
      $q.notify({
        type: "negative",
        message:
          response.data.error || "Failed to load outstanding transactions",
      });
    }
  } catch (err) {
    console.error("Error loading outstanding transactions:", err);
    $q.notify({
      type: "negative",
      message: "An error occurred while loading outstanding transactions",
    });
  } finally {
    loadingOutstanding.value = false;
  }
};

const selectAll = () => {
  outstandingTransactions.value.forEach((t) => (t.selected = true));
  updateSelection();
};

const deselectAll = () => {
  outstandingTransactions.value.forEach((t) => (t.selected = false));
  updateSelection();
};

const updateSelection = () => {
  // Force reactivity update
  outstandingTransactions.value = [...outstandingTransactions.value];
};

const proceedToConfirmation = () => {
  const selectedIds = selectedTransactions.value.map((t) => t.id).join(",");

  router.push({
    name: "BankAdjustmentConfirmation",
    params: { trans_id: route.params.trans_id },
    query: {
      selected_ids: selectedIds,
      gl_account_id: selectedGlAccount.value || "",
      accno: route.params.accno,
    },
  });
};

const goBack = () => {
  router.push({ name: "BankAdjustment" });
};

// Lifecycle
onMounted(() => {
  fetchTransactionDetails();
});
</script>
