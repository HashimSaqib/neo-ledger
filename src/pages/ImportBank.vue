<template>
  <q-page>
    <div class="q-pa-md">
      <div class="row q-gutter-md q-mb-md">
        <div class="col-12">
          <div class="text-h6 q-mb-md">Bank Import Configuration</div>
          <div class="row q-gutter-md">
            <div class="col-md-6">
              <div class="text-subtitle2">
                Clearing Account: {{ clearingAccount }}
              </div>
            </div>
            <div class="col-md-6">
              <s-select
                v-model="selectedPaymentAccount"
                :options="paymentAccounts"
                option-label="label"
                option-value="accno"
                label="Payment Account (Bank Account)"
                outlined
                dense
                class="lightbg input-box"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- CMPT Import Section -->
      <div class="q-mb-lg">
        <CmptImport @transactions-parsed="handleTransactionsParsed" />
      </div>

      <!-- GL Transactions Preview -->
      <div v-if="glTransactions.length > 0" class="q-mt-lg">
        <div class="text-h6 q-mb-md">
          Generated GL Transactions ({{ Math.floor(glTransactions.length / 2) }}
          Transactions)
        </div>

        <q-table
          :rows="glTransactions"
          :columns="glColumns"
          row-key="id"
          dense
          :rows-per-page-options="[0]"
          hide-pagination
          class="mainbg"
        >
          <template v-slot:body-cell-debit="props">
            <q-td :props="props">
              <span v-if="props.row.debit > 0" class="text-positive">
                {{ formatAmount(props.row.debit) }}
              </span>
              <span v-else class="text-grey">-</span>
            </q-td>
          </template>

          <template v-slot:body-cell-credit="props">
            <q-td :props="props">
              <span v-if="props.row.credit > 0" class="text-negative">
                {{ formatAmount(props.row.credit) }}
              </span>
              <span v-else class="text-grey">-</span>
            </q-td>
          </template>

          <template v-slot:body-cell-transdate="props">
            <q-td :props="props">
              {{ formatDate(props.row.transdate) }}
            </q-td>
          </template>

          <template v-slot:body-cell-description="props">
            <q-td :props="props">
              <div v-if="props.row.description" class="text-caption">
                <div
                  v-for="(line, index) in props.row.description.split('\n')"
                  :key="index"
                >
                  {{ line }}
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-memo="props">
            <q-td :props="props">
              <div v-if="props.row.memo" class="text-caption">
                <div
                  v-for="(line, index) in props.row.memo.split('\n')"
                  :key="index"
                >
                  {{ line }}
                </div>
              </div>
            </q-td>
          </template>

          <template v-slot:body-cell-notes="props">
            <q-td :props="props">
              <div v-if="props.row.notes" class="text-caption">
                <div
                  v-for="(line, index) in props.row.notes.split('\n')"
                  :key="index"
                >
                  {{ line }}
                </div>
              </div>
            </q-td>
          </template>
        </q-table>

        <div class="row q-mt-md justify-end">
          <q-btn
            color="primary"
            :label="t('Import GL Transactions')"
            @click="importGLTransactions"
            :loading="importing"
            :disable="glTransactions.length === 0"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  inject,
  computed,
  watch,
  nextTick,
} from "vue";
import { useI18n } from "vue-i18n";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import CmptImport from "src/components/CmptImport.vue";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
const clearingAccount = ref("");
const loading = ref(false);
const importing = ref(false);
const paymentAccounts = ref([]);
const selectedPaymentAccount = ref(null);
const bankTransactions = ref([]);
const glTransactions = ref([]);

// GL Transaction table columns
const glColumns = [
  {
    name: "transdate",
    label: t("Transdate"),
    field: "transdate",
    align: "left",
    sortable: true,
    style: "width: 120px",
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
    sortable: true,
    style: "width: 300px",
  },
  {
    name: "currency",
    label: t("Currency"),
    field: "currency",
    align: "center",
    sortable: true,
    style: "width: 80px",
  },
  {
    name: "accno",
    label: t("Account No"),
    field: "accno",
    align: "left",
    sortable: true,
    style: "width: 120px",
  },
  {
    name: "debit",
    label: t("Debit"),
    field: "debit",
    align: "right",
    sortable: true,
    style: "width: 120px",
  },
  {
    name: "credit",
    label: t("Credit"),
    field: "credit",
    align: "right",
    sortable: true,
    style: "width: 120px",
  },
  {
    name: "source",
    label: t("Source"),
    field: "source",
    align: "left",
    sortable: true,
    style: "width: 150px",
  },
  {
    name: "memo",
    label: t("Memo"),
    field: "memo",
    align: "left",
    sortable: true,
    style: "width: 250px",
  },
  {
    name: "notes",
    label: t("Notes"),
    field: "notes",
    align: "left",
    sortable: true,
    style: "width: 250px",
  },
];

const fetchLinks = async () => {
  const response = await api.get("/create_links/import_bank");
  paymentAccounts.value = response.data.payment_accounts;
  clearingAccount.value = response.data.clearing_account;
};

const handleTransactionsParsed = (transactions) => {
  bankTransactions.value = transactions;
  generateGLTransactions();
};

const generateGLTransactions = () => {
  if (!selectedPaymentAccount.value || !clearingAccount.value) {
    Notify.create({
      message: t("Please select a payment account first"),
      type: "warning",
      position: "center",
    });
    return;
  }

  const transactions = [];
  let transactionId = 1;

  bankTransactions.value.forEach((bankTx, index) => {
    const transdate = formatDateForGL(bankTx.bookingDate);
    const currency = bankTx.currency || "USD";
    const amount = bankTx.amount || 0;
    const isCredit = bankTx.creditDebitInd === "CRDT";

    // Build description from remittance info or use default
    const description = bankTx.remittanceInfo || "Bank Transaction";

    // Build references for notes column with line breaks
    const references = [];
    if (bankTx.endToEndId) references.push(`E2E: ${bankTx.endToEndId}`);
    if (bankTx.instructionId) references.push(`Instr: ${bankTx.instructionId}`);
    if (bankTx.paymentInfoId)
      references.push(`PmtInf: ${bankTx.paymentInfoId}`);
    if (bankTx.creditorReference)
      references.push(`Ref: ${bankTx.creditorReference}`);
    if (bankTx.accountServicerRef)
      references.push(`AcctRef: ${bankTx.accountServicerRef}`);

    const notes = references.length > 0 ? references.join("\n") : "";

    // Use IBAN as source, fallback to "BANK"
    const source = bankTx.counterpartyIban || "BANK";

    // Build memo with counterparty information and line breaks
    const memoParts = [];
    if (bankTx.counterpartyName) {
      memoParts.push(bankTx.counterpartyName);
    }
    if (bankTx.counterpartyAddress) {
      memoParts.push(bankTx.counterpartyAddress);
    }
    const memo =
      memoParts.length > 0
        ? memoParts.join("\n")
        : `Bank transaction: ${bankTx.accountServicerRef || bankTx.id}`;

    // Create two GL transaction lines for each bank transaction (one transaction pair)
    // Note: Bank CRDT = money coming IN = we DEBIT our bank account
    // Bank DBIT = money going OUT = we CREDIT our bank account
    const line1 = {
      id: `${transactionId}-1`,
      transdate: transdate,
      description: description,
      currency: currency,
      accno: selectedPaymentAccount.value.accno,
      debit: isCredit ? amount : 0, // CRDT = money IN = DEBIT our bank account
      credit: isCredit ? 0 : amount, // DBIT = money OUT = CREDIT our bank account
      source: source,
      memo: memo,
      notes: notes,
      transactionGroup: index,
    };

    const line2 = {
      id: `${transactionId}-2`,
      transdate: transdate,
      description: description,
      currency: currency,
      accno: clearingAccount.value,
      debit: isCredit ? 0 : amount, // CRDT = money IN = CREDIT clearing account
      credit: isCredit ? amount : 0, // DBIT = money OUT = DEBIT clearing account
      source: source,
      memo: memo,
      notes: notes,
      transactionGroup: index,
    };

    transactions.push(line1, line2);
    transactionId++;
  });

  glTransactions.value = transactions;
};

const formatDateForGL = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // yyyy-mm-dd format
  } catch {
    return dateString;
  }
};

const formatAmount = (amount) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

const importGLTransactions = async () => {
  if (glTransactions.value.length === 0) {
    Notify.create({
      message: t("No GL transactions to import"),
      type: "warning",
      position: "center",
    });
    return;
  }

  importing.value = true;

  try {
    // Group transactions by transaction group for proper import
    const groups = {};

    glTransactions.value.forEach((tx) => {
      if (!groups[tx.transactionGroup]) {
        groups[tx.transactionGroup] = {
          transdate: tx.transdate,
          description: tx.description,
          currency: tx.currency,
          notes: tx.notes,
          lines: [],
        };
      }
      groups[tx.transactionGroup].lines.push({
        accno: tx.accno,
        debit: tx.debit,
        credit: tx.credit,
        memo: tx.memo,
        source: tx.source,
      });
    });

    // Convert to array format expected by backend (same as Import.vue)
    const formattedData = [];

    Object.entries(groups).forEach(([groupIndex, groupData]) => {
      const transaction = {
        reference: "", // Let server auto-generate reference
        transdate: groupData.transdate || formatDateForGL(new Date()),
        department: null, // No department for bank imports
        description: groupData.description || "Bank Transaction",
        notes: groupData.notes || "",
        curr: groupData.currency || "USD",
        exchangeRate: 1.0, // Default exchange rate
        lines: groupData.lines.map((line) => ({
          accno: line.accno,
          debit: line.debit,
          credit: line.credit,
          memo: line.memo,
          source: line.source,
          project: null, // No project for bank imports
          taxAccount: "", // No tax account for bank imports
          linetaxamount: 0, // No tax amount for bank imports
        })),
      };

      formattedData.push(transaction);
    });

    const response = await api.post("/import/gl", formattedData);

    Notify.create({
      message: t("GL transactions imported successfully"),
      type: "positive",
      position: "top-right",
    });

    // Clear the transactions after successful import
    glTransactions.value = [];
    bankTransactions.value = [];
  } catch (error) {
    console.error("Import error:", error);
    Notify.create({
      message: t("Failed to import GL transactions"),
      type: "negative",
      position: "center",
    });
  } finally {
    importing.value = false;
  }
};

// Watch for changes in payment account selection
watch(selectedPaymentAccount, () => {
  if (bankTransactions.value.length > 0) {
    generateGLTransactions();
  }
});

onMounted(() => {
  updateTitle("Import Bank");
  fetchLinks();
});
</script>

<style scoped>
.q-table {
  background-color: var(--q-primary);
}

.text-caption {
  font-size: 0.75rem;
  line-height: 1.2;
}
</style>
