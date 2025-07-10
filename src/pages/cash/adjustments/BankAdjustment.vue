<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md">
      <div class="col-12">
        <h2 class="text-h6 q-mt-sm q-mb-none">
          Account: {{ accountInfo.number }} - {{ accountInfo.description }}
        </h2>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-grey-6 q-mt-md">Loading transactions...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center q-pa-lg">
      <q-icon name="error" size="50px" color="negative" />
      <div class="text-negative q-mt-md">{{ error }}</div>
      <q-btn
        label="Retry"
        color="primary"
        class="q-mt-md"
        @click="fetchTransactions"
      />
    </div>

    <!-- Transactions Table -->
    <div v-else>
      <q-table
        :rows="transactions"
        :columns="columns"
        row-key="trans_id"
        flat
        dense
        bordered
        hide-pagination
      >
        <!-- Custom slot for transaction date to make it clickable -->
        <template v-slot:body-cell-transdate="props">
          <q-td :props="props">
            <q-btn
              flat
              dense
              color="primary"
              :label="props.value"
              @click="viewTransactionDetail(props.row)"
            />
          </q-td>
        </template>

        <!-- Custom slot for amounts formatting -->
        <template v-slot:body-cell-debit="props">
          <q-td :props="props" class="text-right">
            {{ props.value > 0 ? formatAmount(props.value) : "" }}
          </q-td>
        </template>

        <template v-slot:body-cell-credit="props">
          <q-td :props="props" class="text-right">
            {{ props.value > 0 ? formatAmount(props.value) : "" }}
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, inject, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import { formatAmount } from "src/helpers/utils";
import { useRouter } from "vue-router";
const { t } = useI18n();
const $q = useQuasar();
const updateTitle = inject("updateTitle");
const router = useRouter();

// Reactive data
const transactions = ref([]);
const loading = ref(false);
const error = ref(null);
const accountInfo = ref({ number: "", description: "" });
const totals = ref({ debit: 0, credit: 0 });
const summary = ref({
  total_records: 0,
  total_debit_formatted: "",
  total_credit_formatted: "",
});

// Table columns definition
const columns = [
  {
    name: "transdate",
    label: "Transaction Date",
    field: "transdate",
    align: "left",
    sortable: true,
  },
  {
    name: "trans_type",
    label: "Type",
    field: "trans_type",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "left",
    sortable: true,
  },
  {
    name: "reference_display",
    label: "Reference",
    field: "reference_display",
    align: "left",
    sortable: true,
  },
  {
    name: "curr",
    label: "Currency",
    field: "curr",
    align: "left",
    sortable: true,
  },
  {
    name: "source",
    label: "Source",
    field: "source",
    align: "left",
    sortable: true,
  },
  {
    name: "memo",
    label: "Memo",
    field: "memo",
    align: "left",
    sortable: true,
  },
  {
    name: "debit",
    label: "Debit",
    field: "debit",
    align: "right",
    sortable: true,
  },
  {
    name: "credit",
    label: "Credit",
    field: "credit",
    align: "right",
    sortable: true,
  },
];

// Methods
const fetchTransactions = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get("/bank_adjustments/transactions");

    if (response.data.success) {
      const data = response.data.data;
      transactions.value = data.transactions || [];
      totals.value = data.totals || { debit: 0, credit: 0 };
      accountInfo.value = data.account_info || { number: "", description: "" };
      summary.value = data.summary || {
        total_records: 0,
        total_debit_formatted: "",
        total_credit_formatted: "",
      };
    } else {
      error.value = response.data.error || "Failed to fetch transactions";
    }
  } catch (err) {
    console.error("Error fetching transactions:", err);
    error.value =
      err.response?.data?.error ||
      "An error occurred while fetching transactions";
  } finally {
    loading.value = false;
  }
};

const getTypeColor = (type) => {
  const colors = {
    AR: "blue",
    AP: "orange",
    GL: "green",
  };
  return colors[type] || "grey";
};

const viewTransactionDetail = (transaction) => {
  router.push({
    name: "BankAdjustmentDetail",
    params: {
      trans_id: transaction.trans_id,
      accno: accountInfo.value.number,
    },
  });
};

// Lifecycle
onMounted(() => {
  updateTitle("Bank Adjustment");
  fetchTransactions();
});
</script>
