<template>
  <q-page class="q-pa-md">
    <!-- Search Params Expansion -->
    <q-expansion-item
      :label="t('Search Params')"
      header-class="lightbg maintext"
      expand-icon-class="maintext"
      v-model="filtersOpen"
      class="mainbg textmain q-pa-md-md q-pa-sm"
    >
      <q-form @submit.prevent="loadTransactions">
        <q-select
          v-model="form.accno"
          :label="t('Account Number')"
          :options="paymentAccounts"
          :option-value="accno"
          option-label="label"
          use-input
          input-debounce="0"
          @filter="filterAccounts"
          dense
          class="q-my-md"
          outlined
        />
        <div class="row q-col-gutter-md q-mb-md">
          <q-input
            v-model="form.fromdate"
            :label="t('From Date')"
            type="date"
            outlined
            class="col"
            dense
          />
          <q-input
            v-model="form.todate"
            :label="t('To Date')"
            type="date"
            outlined
            class="col"
            dense
          />
        </div>

        <!-- Additional Toggles -->
        <div class="row q-col-gutter-md q-mb-md items-center">
          <!-- "report" -> 1 => Show only cleared OR generate "Reconciliation Report" -->
          <q-checkbox
            v-model="form.report"
            :label="t('Reconciliation Report (Cleared Only)')"
            class="col-auto"
          />

          <!-- Summary vs Detail -->
          <q-radio
            v-model="form.summary"
            val="1"
            :label="t('Summary View')"
            class="col-auto"
          />
          <q-radio
            v-model="form.summary"
            val="0"
            :label="t('Detail View')"
            class="col-auto"
          />

          <!-- fx_transaction -> 1 => Include FX differences -->
          <q-checkbox
            v-model="form.fx_transaction"
            :label="t('Include FX Transactions')"
            class="col-auto"
          />
        </div>

        <!-- Submit Button -->
        <q-btn type="submit" color="primary" :label="t('Load Transactions')" />
      </q-form>
    </q-expansion-item>

    <!-- Transactions Section -->
    <div v-if="transactions.length" class="q-mt-md">
      <!-- Show Reconciliation Date if present -->
      <div v-if="balances?.reconciliation_date" class="q-mb-md text-bold">
        {{ t("Reconciliation Date") }}: {{ balances.reconciliation_date }}
      </div>

      <q-table
        :rows="transactions"
        :columns="columns"
        row-key="id"
        flat
        bordered
        dense
        :rows-per-page-options="[0]"
      >
        <template #top-row>
          <q-tr>
            <q-td colspan="3" class="text-weight-medium">
              {{ t("Beginning Balance") }}
            </q-td>
            <q-td></q-td>
            <q-td class="text-right text-weight-medium">
              {{ formatAmount(0) }}
            </q-td>
            <q-td class="text-right text-weight-medium">
              {{ formatAmount(0) }}
            </q-td>
            <q-td class="text-right text-weight-medium">
              {{ formatAmount(balances.beginning_balance) }}
            </q-td>
          </q-tr>
        </template>

        <template #header-cell-cleared="props">
          <q-th v-bind="props" class="text-center">
            <q-checkbox
              :model-value="isAllCleared"
              :indeterminate="isSomeCleared"
              @update:modelValue="(val) => toggleAll(val)"
              dense
            />
          </q-th>
        </template>

        <!-- Cleared Checkbox in rows -->
        <template #body-cell-cleared="props">
          <q-td :props="props">
            <q-checkbox v-model="props.row.cleared" dense />
          </q-td>
        </template>

        <!-- Debit Column -->
        <template #body-cell-debit="props">
          <q-td :props="props" class="text-right">
            {{ props.row.amount < 0 ? formatAmount(-props.row.amount) : "" }}
          </q-td>
        </template>

        <template #body-cell-credit="props">
          <q-td :props="props" class="text-right">
            {{ props.row.amount >= 0 ? formatAmount(props.row.amount) : "" }}
          </q-td>
        </template>

        <template #body-cell-balance="props">
          <q-td :props="props" class="text-right">
            {{ formatAmount(runningBalance(props.row.index)) }}
          </q-td>
        </template>

        <template #bottom-row>
          <q-tr>
            <q-td colspan="4" class="text-weight-bold text-right">
              {{ t("Totals") }}:
            </q-td>
            <q-td class="text-right text-weight-bold">
              {{ formatAmount(totals.debits) }}
            </q-td>
            <q-td class="text-right text-weight-bold">
              {{ formatAmount(totals.credits) }}
            </q-td>
            <q-td class="text-right text-weight-bold">
              {{ formatAmount(totals.balance) }}
            </q-td>
          </q-tr>
        </template>
      </q-table>

      <div class="q-pa-md">
        <div class="row justify-between align-center">
          <div class="col-md-4">
            <div>
              <q-checkbox
                v-model="ignoreBalance"
                :label="t('Ignore Difference')"
              />
            </div>
            <q-btn
              color="primary"
              :label="t('Save Reconciliation')"
              @click="saveReconciliation"
              :disable="Math.abs(difference) >= 0.01 && !ignoreBalance"
            />
          </div>
          <div class="col-4">
            <fn-input
              v-model="statementBalance"
              :label="t('Statement Balance')"
              class="q-mb-sm mainbg"
            />
            <q-input
              :model-value="formatAmount(difference)"
              :label="t('Difference')"
              outlined
              dense
              readonly
              class="text-right q-mt-none mainbg"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { formatAmount } from "src/helpers/utils";
import { useI18n } from "vue-i18n";
const updateTitle = inject("updateTitle");
updateTitle("Reconciliation");

const { t } = useI18n();
const $q = useQuasar();

const filtersOpen = ref(true);

const form = ref({
  accno: "",
  fromdate: "",
  todate: "",
  report: false,
  summary: "1",
  fx_transaction: false,
});
const ignoreBalance = ref(false);

// Table data and balances
const transactions = ref([]);
const balances = ref({});
const statementBalance = ref(0);
const ml = ref(1);

const runningBalance = (index) => {
  if (!balances.value) return 0;
  let balance = balances.value.beginning_balance || 0;
  for (let i = 0; i <= index; i++) {
    balance += transactions.value[i].amount * ml.value;
  }
  return balance;
};

const totals = computed(() => {
  return transactions.value.reduce(
    (acc, tx) => {
      const amount = tx.amount * ml.value;
      return {
        balance: acc.balance + amount,
        debits: acc.debits + (tx.amount < 0 ? Math.abs(tx.amount) : 0),
        credits: acc.credits + (tx.amount >= 0 ? tx.amount : 0),
        clearedAmount: acc.clearedAmount + (tx.cleared ? amount : 0),
      };
    },
    {
      balance: 0,
      debits: 0,
      credits: 0,
      clearedAmount: 0,
    }
  );
});
const difference = computed(() => {
  if (!balances.value) return 0;
  const clearedAmount =
    transactions.value
      .filter((tx) => tx.cleared)
      .reduce((sum, tx) => sum + tx.amount, 0) * ml.value;

  const beginning = balances.value.beginning_balance || 0;

  return beginning + clearedAmount - statementBalance.value;
});

const isAllCleared = computed(() => {
  return (
    transactions.value.length > 0 &&
    transactions.value.every((tx) => tx.cleared)
  );
});
const isSomeCleared = computed(() => {
  const someChecked = transactions.value.some((tx) => tx.cleared);
  const someUnchecked = transactions.value.some((tx) => !tx.cleared);
  return someChecked && someUnchecked;
});
const toggleAll = (val) => {
  transactions.value.forEach((tx) => {
    tx.cleared = val;
  });
};

const columns = computed(() => [
  { name: "transdate", label: t("Date"), field: "transdate", align: "left" },
  { name: "source", label: t("Source"), field: "source" },
  { name: "description", label: t("Description"), field: "description" },
  { name: "cleared", label: "", align: "center" },
  { name: "debit", label: t("Debit"), align: "right" },
  { name: "credit", label: t("Credit"), align: "right" },
  { name: "balance", label: t("Balance"), align: "right" },
]);

// Load transactions from API
const loadTransactions = async () => {
  try {
    const { data } = await api.get("/cash/reconciliation/", {
      params: {
        ...form.value,
        accno: form.value.accno.accno,
        report: form.value.report ? 1 : 0,
        summary: form.value.summary === "1" ? 1 : 0,
        fx_transaction: form.value.fx_transaction ? 1 : 0,
      },
    });

    transactions.value = data.transactions.map((tx, index) => ({
      ...tx,
      cleared: !!tx.cleared,
      index: index,
    }));

    balances.value = {
      beginning_balance: data.beginning_balance || 0,
      ending_balance: data.ending_balance || 0,
      fx_balance: data.fx_balance || 0,
      fx_endingbalance: data.fx_endingbalance || 0,
      reconciliation_date: data.reconciliation_date || null,
    };

    ml.value = data.account_category === "A" ? -1 : 1;

    statementBalance.value = balances.value.ending_balance * ml.value;

    if (!form.value.fx_transaction) {
      statementBalance.value =
        (balances.value.ending_balance - balances.value.fx_endingbalance) *
        ml.value;
    }

    filtersOpen.value = false;
    updateTitle(form.value.accno.label);
  } catch (error) {
    console.error(error);

    // Check if the error response exists and has a status code
    if (error.response && error.response.status === 404) {
      // Clear existing transactions
      transactions.value = [];

      // Notify the user that no transactions were found
      $q.notify({
        position: "center",
        type: "negative",
        message: t("No transactions found"),
      });
    } else {
      // Handle other types of errors
      $q.notify({
        type: "negative",
        message: t(error),
      });
    }
  }
};

const saveReconciliation = async () => {
  try {
    const recDate =
      balances.value.reconciliation_date ||
      new Date().toISOString().slice(0, 10);

    const payload = {
      accno: form.value.accno.accno,
      reconciliation_date: recDate,
      transactions: transactions.value.map((tx) => ({
        id: tx.id,
        date_cleared: tx.cleared ? recDate : "",
        old_cleared: tx.oldcleared || "",
        transdate: tx.transdate,
        source: tx.source,
      })),
    };

    await api.post("/cash/reconciliation/", payload);
    $q.notify({
      type: "positive",
      message: t("Reconciliation saved"),
      position: "center",
    });

    // Reload updated data
    loadTransactions();
  } catch (error) {
    $q.notify({ type: "negative", message: t("Save failed") });
  }
};

const paymentAccounts = ref([]);
const allAccounts = ref([]);
const loadPaymentAccounts = async () => {
  const { data } = await api.get("/cash/reconciliation/paymentaccounts");

  allAccounts.value = data.map((acc) => ({
    ...acc,
    label: `${acc.accno} - ${acc.description}`,
    value: acc.accno,
  }));

  form.value.accno = allAccounts.value[0];
};
function filterAccounts(val, update) {
  if (val === "") {
    update(() => {
      paymentAccounts.value = [...allAccounts.value];
    });
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    paymentAccounts.value = allAccounts.value.filter((acc) =>
      acc.label.toLowerCase().includes(needle)
    );
  });
}

onMounted(async () => {
  await loadPaymentAccounts();
});
</script>

<style scoped>
.text-negative {
  color: #c10015;
  font-weight: bold;
}

.q-table :deep(.q-table__top) {
  border-bottom: 2px solid #ddd;
}
.q-table :deep(.q-table__bottom) {
  border-top: 2px solid #ddd;
  background-color: #f8f9fa;
}

.input-right :deep(input) {
  text-align: right;
}

.q-table :deep(.q-checkbox__inner) {
  font-size: 1.2em;
}

.lightbg {
  background-color: #f4f5f8;
}
.maintext {
  color: #333;
}
</style>
