<template>
  <q-page class="lightbg q-px-md q-py-md relative-position">
    <q-splitter v-model="splitterModel" class="full-width">
      <!-- Left Panel - Invoice Form -->
      <template v-slot:before>
        <div class="mainbg textmain q-pa-md-md q-pa-sm">
          <div class="row justify-between full-width q-mt-md">
            <div class="col-12 col-lg-5">
              <div class="row full-width">
                <s-select
                  :label="t(vcLabel)"
                  :options="vcList"
                  option-label="label"
                  :option-value="vcNumberField"
                  v-model="selectedEntity"
                  dense
                  outlined
                  input-class="maintext"
                  label-color="secondary"
                  class="q-mb-sm col-12 col-sm-9"
                  @update:model-value="vcUpdate"
                  search="label"
                  account
                />
                <div class="col-sm-4 q-md-ml-md content-center" v-if="vc">
                  <p class="q-px-sm maintext q-ma-none">
                    <strong>{{ t("Credit Limit") }}</strong>
                    <span class="text-primary q-mx-sm">
                      {{ vc.creditlimit }}
                    </span>
                    <strong>{{ t("Remaining") }}</strong>
                    <span class="text-negative q-ml-sm">
                      {{ vc.creditremaining }}
                    </span>
                  </p>
                </div>
              </div>
              <div v-if="vc">
                <p class="q-mb-sm q-px-sm maintext">
                  <strong>{{ t("Address") }}</strong> {{ vc.full_address }}
                </p>
              </div>
              <div class="row">
                <s-select
                  outlined
                  v-model="salesAccount"
                  :options="salesAccounts"
                  :label="t('Record In')"
                  dense
                  popup-content-class="mainbg maintext"
                  input-class="maintext"
                  label-color="secondary"
                  class="lightbg q-mb-sm col-sm-9 col-12"
                  search="label"
                />
              </div>
              <div v-if="currencies && currencies.length" class="row">
                <q-select
                  outlined
                  v-model="selectedCurrency"
                  :options="currencies"
                  option-value="curr"
                  option-label="curr"
                  :label="t('Currency')"
                  dense
                  class="lightbg q-mb-sm col-sm-5 col-12"
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-if="selectedCurrency && selectedCurrency.rn != 1"
                  class="lightbg q-mb-sm col-sm-5 col-12 q-ml-md-sm"
                  :label="t('Exchange Rate')"
                  outlined
                  dense
                  v-model="exchangeRate"
                />
              </div>
              <div class="row">
                <q-file
                  v-model="selectedFile"
                  :label="t('Choose File')"
                  filled
                  dense
                  outlined
                  input-class="maintext"
                  label-color="secondary"
                  class="lightbg q-mb-sm col-sm-7 col-12"
                  :multiple="false"
                  name="files"
                />
                <q-btn
                  :label="t('Load Invoice')"
                  color="primary"
                  class="q-mb-sm q-ml-md-sm"
                  @click="uploadInvoice"
                  :disable="!selectedFile"
                />
              </div>
              <div class="row" v-if="link">
                <a :href="link" target="_blank" rel="noopener noreferrer">
                  {{ t("View Document") }}
                </a>
              </div>
            </div>
            <div class="col-12 col-lg-6">
              <div class="row q-gutter-sm">
                <q-input
                  outlined
                  :label="t('Invoice Number')"
                  v-model="invNumber"
                  class="lightbg q-mb-sm col-sm-5 col-12"
                  input-class="maintext"
                  label-color="secondary"
                  dense
                />
                <q-input
                  outlined
                  :label="t('Order Number')"
                  v-model="ordNumber"
                  class="lightbg q-mb-sm col-sm-5 col-12"
                  input-class="maintext"
                  label-color="secondary"
                  dense
                />
              </div>
              <div class="row q-gutter-sm">
                <q-input
                  v-model="invDate"
                  :label="t('Invoice Date')"
                  class="lightbg q-mb-sm col-sm-5 col-12"
                  input-class="maintext"
                  label-color="secondary"
                  outlined
                  dense
                  type="date"
                />
                <q-input
                  v-model="dueDate"
                  :label="t('Due Date')"
                  class="lightbg q-mb-sm col-sm-5 col-12"
                  input-class="maintext"
                  label-color="secondary"
                  outlined
                  dense
                  type="date"
                />
              </div>
              <div class="row q-gutter-sm">
                <q-input
                  outlined
                  :label="t('Description')"
                  v-model="description"
                  input-class="maintext"
                  label-color="secondary"
                  class="lightbg col-sm-11 col-12"
                  dense
                  type="textarea"
                  rows="2"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="mainbg q-my-md q-pa-md">
          <!-- Items Section -->
          <div class="row q-mb-md">
            <h6 class="q-my-none q-pa-none text-secondary">{{ t("Items") }}</h6>
            <q-btn
              color="primary"
              icon="add"
              dense
              flat
              :label="t('Add Line')"
              @click="addLine"
              class="q-ml-md"
            />
          </div>
          <!-- Use draggable to enable reordering of line items -->
          <draggable v-model="lines" item-key="id">
            <template #item="{ element: line, index }">
              <div class="row q-mb-md justify-between">
                <!-- Drag handle icon -->
                <q-btn icon="drag_indicator" class="q-mr-xs" flat dense />
                <q-input
                  outlined
                  v-model="line.description"
                  :label="t('Description')"
                  class="lightbg"
                  :class="lineTax && taxAccountList ? 'col-2' : 'col-4'"
                  input-class="maintext"
                  label-color="secondary"
                  dense
                />
                <s-select
                  outlined
                  v-model="line.account"
                  :options="itemAccounts"
                  :label="t('Account')"
                  option-label="label"
                  option-value="id"
                  :class="lineTax && taxAccountList ? 'col-2' : 'col-4'"
                  input-class="maintext"
                  label-color="secondary"
                  dense
                  search="label"
                  account
                />
                <fn-input
                  outlined
                  v-model="line.amount"
                  :label="t('Amount')"
                  class="lightbg col-2"
                  input-class="maintext"
                  label-color="secondary"
                  dense
                />
                <!-- Show tax account and amount only if line tax is enabled -->
                <s-select
                  v-if="lineTax && taxAccountList"
                  outlined
                  v-model="line.taxAccount"
                  :options="taxAccountList"
                  :label="t('Tax Account')"
                  option-label="label"
                  option-value="accno"
                  class="lightbg col-2"
                  input-class="maintext"
                  label-color="secondary"
                  dense
                  search="label"
                  account
                  @update:model-value="() => onLineTaxAccountChange(index)"
                />
                <fn-input
                  v-if="lineTax && taxAccountList"
                  outlined
                  v-model="line.taxAmount"
                  :label="t('Tax Amount')"
                  class="lightbg col-2"
                  input-class="maintext"
                  label-color="secondary"
                  dense
                />
                <q-btn
                  color="negative"
                  icon="delete"
                  dense
                  flat
                  @click="removeLine(index)"
                />
              </div>
            </template>
          </draggable>

          <!-- Totals Section -->
          <div class="row justify-between items-end">
            <div class="col">
              <q-input
                dense
                outlined
                class="lightbg col-sm-10 col-12"
                rows="2"
                input-class="maintext"
                label-color="secondary"
                :label="t('Notes')"
                type="textarea"
                v-model="notes"
              />
            </div>
            <div class="col q-ml-md">
              <q-input
                dense
                outlined
                class="lightbg col-sm-11 col-12"
                rows="2"
                input-class="maintext"
                label-color="secondary"
                :label="t('Internal Notes')"
                type="textarea"
                v-model="intnotes"
              />
            </div>
            <div class="col">
              <div class="row justify-end">
                <div class="maintext">
                  <q-checkbox
                    :label="t('Tax Included')"
                    v-model="taxIncluded"
                    @click="calculateTaxes"
                  />
                </div>
              </div>
              <div class="row justify-end">
                <div class="q-mr-xl">
                  <p class="q-my-xs maintext">
                    <strong>{{ t("Subtotal") }}</strong>
                  </p>
                </div>
                <div>
                  <p class="q-my-xs maintext">
                    <strong>{{ formatAmount(subtotal) }}</strong>
                  </p>
                </div>
              </div>
              <div
                class="row justify-end maintext"
                v-for="tax in invoiceTaxes"
                :key="tax.name"
              >
                <div class="q-mr-xl">
                  <p class="q-my-xs">{{ tax.name }}</p>
                </div>
                <div>
                  <p class="q-my-xs">{{ formatAmount(tax.amount) }}</p>
                </div>
              </div>
              <div class="row justify-end">
                <div class="q-mr-xl">
                  <p class="q-my-xs maintext">
                    <strong>{{ t("Total") }}</strong>
                  </p>
                </div>
                <div>
                  <p class="q-my-xs maintext">
                    <strong>{{ formatAmount(total) }}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mainbg q-my-md q-pa-md">
          <div class="row q-mb-md">
            <h6 class="q-my-none q-pa-none text-secondary">
              {{ t("Payments") }}
            </h6>
            <q-btn
              color="primary"
              icon="add"
              dense
              flat
              :label="t('Add Line')"
              @click="addPayment"
              class="q-ml-md"
            />
          </div>
          <div
            v-for="(payment, index) in payments"
            :key="index"
            class="row q-mb-md justify-between"
          >
            <q-input
              outlined
              v-model="payment.date"
              :label="t('Date')"
              class="lightbg q-mt-sm"
              input-class="maintext"
              label-color="secondary"
              dense
              type="date"
            />
            <q-input
              outlined
              v-model="payment.source"
              :label="t('Source')"
              class="lightbg q-mt-sm"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              v-model="payment.memo"
              :label="t('Memo')"
              class="lightbg q-mt-sm"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <fn-input
              outlined
              v-model="payment.amount"
              :label="t('Amount')"
              class="lightbg q-mt-sm"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <fn-input
              v-if="selectedCurrency && selectedCurrency.rn != 1"
              outlined
              v-model="payment.exchangerate"
              :label="t('Exhcnage Rate')"
              class="lightbg q-mt-sm"
              dense
            />
            <s-select
              outlined
              v-model="payment.account"
              :options="paymentAccounts"
              :label="t('Account')"
              option-label="label"
              option-value="id"
              class="lightbg col-2 q-mt-sm"
              :class="
                selectedCurrency && selectedCurrency.rn !== 1 ? 'col-3' : ''
              "
              input-class="maintext"
              label-color="secondary"
              dense
              search="label"
              account
            />
            <q-btn
              color="negative"
              icon="delete"
              dense
              flat
              @click="removePayment(index)"
            />
          </div>
        </div>
        <q-btn
          :label="t('Post')"
          color="primary"
          @click="postInvoice"
          class="relative-position"
        ></q-btn>
      </template>

      <!-- Right Panel - Invoice Preview -->
      <template v-slot:after>
        <div class="q-px-md">
          <div v-if="invoicePreview">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6">{{ t("Invoice Preview") }}</div>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <q-img
                  :src="invoicePreview"
                  spinner-color="primary"
                  fit="contain"
                >
                  <template v-slot:loading>
                    <div class="text-center">
                      <q-spinner-dots color="primary" size="40px" />
                    </div>
                  </template>
                </q-img>
              </q-card-section>
            </q-card>
          </div>
          <div v-else class="text-center full-height flex flex-center">
            <div class="text-grey-6">
              <q-icon name="file_upload" size="48px" />
              <div class="text-h6 q-mt-md">
                {{ t("Upload an invoice to preview") }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </q-splitter>

    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed, inject } from "vue";
import { api } from "src/boot/axios";
import { date, Notify } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { formatAmount } from "src/helpers/utils";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable"; // Import draggable

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const updateTitle = inject("updateTitle");
const { formatDate } = date;
const getTodayDate = () => formatDate(new Date(), "YYYY-MM-DD");

// -----------------------------------------------------
// Flags to control tax calculation & initial load
// -----------------------------------------------------
const initialLoad = ref(false);
const preserveApiTaxes = ref(false); // NEW FLAG to skip overwriting API taxes

// -------------------------
// UI and Form State
// -------------------------
const splitterModel = ref(100);
const invoicePreview = ref(null);
const loading = ref(false);
const selectedFile = ref(null);

// Determine transaction type and update page title accordingly.
const type = ref(route.params.type || route.query.type || "vendor");
if (type.value === "customer") {
  updateTitle("AR Transaction");
} else {
  updateTitle("AP Transaction");
}

// -------------------------
// Entity and Tax Management
// -------------------------
const vcList = ref([]);
const selectedEntity = ref();
const vc = ref(null);
const taxAccounts = ref([]);
const lineTax = ref(false); // enables per-line tax calculations if true
const taxAccountList = ref([]);

// -------------------------
// Account References
// -------------------------
const salesAccount = ref(null);
const salesAccounts = ref([]);
const paymentAccounts = ref([]);
const itemAccounts = ref([]);
const accounts = ref([]);

// -------------------------
// Currency Management
// -------------------------
const selectedCurrency = ref(null);
const currencies = ref([]);
const exchangeRate = ref(1);

// -------------------------
// Invoice Details
// -------------------------
const description = ref("");
const notes = ref("");
const intnotes = ref("");
const invNumber = ref("");
const ordNumber = ref("");
const invDate = ref(getTodayDate());
const dueDate = ref(getTodayDate());
const poNumber = ref("");
const link = ref("");

// -------------------------
// Tax Values (computed & API-provided)
// -------------------------
const taxIncluded = ref(false);
const invoiceTaxes = ref([]);

// -------------------------
// Line Items Management
// -------------------------
// Include a unique "id" for each line item.
const lines = ref([
  {
    id: Date.now(),
    amount: 0,
    account: null,
    description: "",
    taxAccount: null,
    taxAmount: 0,
  },
]);

// Add a new blank line item.
const addLine = () => {
  lines.value.push({
    id: Date.now(),
    amount: 0,
    account: null,
    description: "",
    taxAccount: null,
    taxAmount: 0,
  });
};

// Remove a line item if more than one exists.
const removeLine = (index) => {
  if (lines.value.length > 1) {
    lines.value.splice(index, 1);
  }
};

// Compute tax for a given line item based on its amount and tax account.
const computeLineTaxAmount = (line) => {
  if (!line.amount || !line.taxAccount) return 0;
  const taxAcc = taxAccountList.value.find(
    (a) =>
      a.accno ===
      (typeof line.taxAccount === "object"
        ? line.taxAccount.accno
        : line.taxAccount)
  );
  if (!taxAcc) return 0;
  const taxRate = taxAcc.rate;
  // If tax is included in the amount, extract the tax component; otherwise, apply the rate directly.
  const computed = taxIncluded.value
    ? line.amount * (taxRate / (1 + taxRate))
    : line.amount * taxRate;
  return parseFloat(computed.toFixed(2));
};

// Handle changes to a line's tax account, recalculating tax if not in initial load.
const onLineTaxAccountChange = (index) => {
  if (initialLoad.value) return;
  const line = lines.value[index];
  if (line.taxAccount) {
    if (
      !line.apiTaxAccount ||
      line.taxAccount.accno.toString() !== line.apiTaxAccount.toString()
    ) {
      line.apiTaxAmount = 0;
      line.taxAmount = computeLineTaxAmount(line);
    } else {
      line.taxAmount = line.apiTaxAmount;
    }
  }
  calculateTaxes();
};

// Calculate taxes based on current line items and tax configuration.
const calculateTaxes = () => {
  // Skip if the form is still loading from the API
  if (initialLoad.value) return;

  // If line-based tax is NOT enabled AND we are preserving API taxes, skip
  if (!lineTax.value && preserveApiTaxes.value) {
    return;
  }

  if (!vc.value || !taxAccounts.value.length) {
    invoiceTaxes.value = [];
    return;
  }
  if (lineTax.value) {
    const taxAgg = {};
    lines.value.forEach((line) => {
      if (line.taxAccount && line.taxAmount) {
        const taxAccNo =
          typeof line.taxAccount === "object"
            ? line.taxAccount.accno
            : line.taxAccount;
        if (!taxAgg[taxAccNo]) {
          taxAgg[taxAccNo] = { amount: 0, rate: 0 };
        }
        taxAgg[taxAccNo].amount += parseFloat(line.taxAmount) || 0;
        const taxAcc = taxAccountList.value.find((a) => a.accno === taxAccNo);
        if (taxAcc) {
          taxAgg[taxAccNo].rate = taxAcc.rate;
        }
      }
    });
    invoiceTaxes.value = Object.keys(taxAgg).map((accNo) => {
      const taxAcc = taxAccountList.value.find((a) => a.accno === accNo);
      const name =
        (taxAcc && vc.value[`${taxAcc.accno}_description`]) ||
        (taxAcc && taxAcc.label) ||
        t("Tax Name Not Found");
      return {
        name: `${name} ${(taxAgg[accNo].rate * 100).toFixed(0)}%`,
        amount: parseFloat(taxAgg[accNo].amount.toFixed(2)),
        acc: taxAcc ? taxAcc.accno : "",
        rate: taxAgg[accNo].rate,
      };
    });
  } else {
    invoiceTaxes.value = taxAccounts.value.map((taxAcc) => {
      const name = vc.value[`${taxAcc}_description`] || t("Tax Name Not Found");
      const taxRate = parseFloat(vc.value[`${taxAcc}_rate`] || 0);
      const netAmount = subtotal.value;
      const taxAmount = taxIncluded.value
        ? netAmount * (taxRate / (1 + taxRate))
        : netAmount * taxRate;
      return {
        name: `${name} ${(taxRate * 100).toFixed(0)}%`,
        amount: parseFloat(taxAmount.toFixed(2)),
        acc: taxAcc,
        rate: taxRate,
      };
    });
  }
};

// Compute subtotal by summing all line amounts and subtracting taxes if included.
const subtotal = computed(() => {
  let totalValue = lines.value.reduce(
    (acc, line) => acc + (parseFloat(line.amount) || 0),
    0
  );
  if (taxIncluded.value) {
    const totalTaxes = invoiceTaxes.value.reduce(
      (acc, tax) => acc + (parseFloat(tax.amount) || 0),
      0
    );
    totalValue -= totalTaxes;
  }
  return parseFloat(totalValue.toFixed(2));
});

// Compute total by adding taxes if they are not already included.
const total = computed(() => {
  const totalTaxes = invoiceTaxes.value.reduce(
    (acc, tax) => acc + (parseFloat(tax.amount) || 0),
    0
  );
  let totalValue = lines.value.reduce(
    (acc, line) => acc + (parseFloat(line.amount) || 0),
    0
  );
  if (!taxIncluded.value) {
    totalValue += totalTaxes;
  }
  return parseFloat(totalValue.toFixed(2));
});

// -------------------------
// Payment Management
// -------------------------
const payments = ref([
  { date: getTodayDate(), source: "", memo: "", amount: 0, account: "" },
]);

const addPayment = () => {
  payments.value.push({
    date: getTodayDate(),
    source: "",
    memo: "",
    amount: 0,
    account: "",
  });
};

const removePayment = (index) => {
  if (payments.value.length > 1) {
    payments.value.splice(index, 1);
  }
};

// -------------------------
// Data Fetching Functions
// -------------------------
const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/${type.value}/`);
    lineTax.value = response.data.linetax;
  } catch (error) {
    console.error("Failed to fetch links:", error);
    Notify.create({
      message: t("Failed to fetch links"),
      type: "negative",
      position: "center",
    });
  }
};

const fetchvcList = async () => {
  try {
    const response = await api.get(`/arap/list/${type.value}`);
    vcList.value = response.data;
  } catch (error) {
    console.error("Failed to fetch vcList:", error);
    Notify.create({
      message: t("Failed to fetch vcList"),
      type: "negative",
      position: "center",
    });
  }
};

const fetchEntity = async (id) => {
  try {
    const response = await api.get(`/arap/list/${type.value}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch vc details:", error);
    return null;
  }
};

const vcUpdate = async (newValue) => {
  const entityId = newValue.id || newValue;
  vc.value = await fetchEntity(entityId);
  if (vc.value) {
    taxAccounts.value = vc.value.taxaccounts
      ? vc.value.taxaccounts.split(" ")
      : [];
    taxAccountList.value = accounts.value
      .filter((account) => taxAccounts.value.includes(account.accno))
      .map((acc) => ({
        ...acc,
        rate: parseFloat(vc.value[`${acc.accno}_rate`] || 0),
      }));
    calculateTaxes();
  }
};

const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    accounts.value = response.data;
    const linkType = type.value === "vendor" ? "AP" : "AR";
    const linkPaid = type.value === "vendor" ? "AP_paid" : "AR_paid";
    const icLink = type.value === "vendor" ? "AP_amount" : "AR_amount";

    salesAccounts.value = accounts.value.filter(
      (account) => account.link === linkType
    );
    salesAccount.value = salesAccounts.value[0] || null;
    paymentAccounts.value = accounts.value.filter((account) =>
      account.link.split(":").includes(linkPaid)
    );
    itemAccounts.value = accounts.value.filter((account) =>
      account.link.split(":").includes(icLink)
    );
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    Notify.create({
      message: t("Failed to fetch accounts"),
      type: "negative",
      position: "center",
    });
  }
};

const fetchCurrencies = async () => {
  try {
    const response = await api.get("/system/currencies");
    currencies.value = response.data;
    if (currencies.value && currencies.value.length) {
      selectedCurrency.value =
        currencies.value.find((currency) => currency.rn === 1) || null;
    }
  } catch (error) {
    console.error("Failed to fetch currencies:", error);
    Notify.create({
      message: t("Failed to fetch currencies"),
      type: "negative",
      position: "center",
    });
  }
};

// -------------------------
// Invoice Submission & Loading
// -------------------------
const postInvoice = async () => {
  if (!selectedEntity.value) {
    Notify.create({
      message: t("Entity is required: " + vcLabel.value),
      type: "negative",
      position: "center",
    });
    return;
  }
  if (!salesAccount.value) {
    Notify.create({
      message: t("Account is required"),
      type: "negative",
      position: "center",
    });
    return;
  }
  if (!selectedCurrency.value) {
    Notify.create({
      message: t("Currency is required"),
      type: "negative",
      position: "center",
    });
    return;
  }
  if (
    lines.value.length === 0 ||
    !lines.value.some((line) => line.amount && line.account)
  ) {
    Notify.create({
      message: t("At least one line item with amount and account is required"),
      type: "negative",
      position: "center",
    });
    return;
  }

  const invoiceData = {
    [type.value === "vendor" ? "selectedVendor" : "selectedCustomer"]:
      selectedEntity.value,
    description: description.value,
    notes: notes.value,
    intnotes: intnotes.value,
    invNumber: invNumber.value,
    ordNumber: ordNumber.value,
    invDate: invDate.value,
    dueDate: dueDate.value,
    poNumber: poNumber.value,
    salesAccount: salesAccount.value,
    selectedCurrency: selectedCurrency.value,
    curr: selectedCurrency.value.curr,
    lines: lines.value.map((line) => ({
      amount: line.amount,
      account: line.account ? line.account.accno : null,
      description: line.description,
      taxAccount: line.taxAccount ? line.taxAccount.accno : null,
      taxAmount: line.taxAmount,
    })),
    payments: payments.value.map((payment) => ({
      date: payment.date,
      source: payment.source,
      memo: payment.memo,
      amount: payment.amount,
      account:
        payment.account && payment.account.label
          ? payment.account.label
          : payment.account,
      exchangerate: payment.exchangerate,
    })),
  };

  if (selectedCurrency.value.rn !== 1) {
    invoiceData.exchangerate = exchangeRate.value;
  }
  if (invoiceTaxes.value.length > 0) {
    invoiceData.taxes = invoiceTaxes.value.map((tax) => ({
      accno: tax.acc,
      amount: tax.amount,
      rate: tax.rate,
    }));
    invoiceData.taxincluded = taxIncluded.value;
  }

  try {
    loading.value = true;
    const idParam = route.query.id ? `/${route.query.id}` : "";
    await api.post(`/arap/transaction/${type.value}${idParam}`, invoiceData);
    Notify.create({
      message: t("Transaction posted successfully"),
      type: "positive",
      position: "center",
    });
  } catch (error) {
    console.error("Transaction error:", error);
    Notify.create({
      message: t("Transaction error: ") + (error.response?.data?.message || ""),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

// Upload invoice file, then load the invoice details from the API response.
const uploadInvoice = async () => {
  loading.value = true;
  const formData = new FormData();
  formData.append("files", selectedFile.value);
  try {
    const response = await api.post("/upload_invoice", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    Notify.create({
      type: "positive",
      message:
        t("File uploaded successfully: ") + (response.data.message || ""),
      position: "center",
    });
    splitterModel.value = 70;
    invoicePreview.value = URL.createObjectURL(selectedFile.value);
    loadInvoice(response.data);
  } catch (error) {
    console.error("Upload Error:", error);
    Notify.create({
      type: "negative",
      message: t("File upload failed: Please try again"),
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const fetchInvoice = async (id) => {
  if (id) {
    try {
      const response = await api.get(`/arap/transaction/${type.value}/${id}`);
      loadInvoice(response.data);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
    }
  }
};

// Load invoice data into the form, preserving any tax values if present.
const loadInvoice = async (invoice) => {
  if (
    !vcList.value.length ||
    !salesAccounts.value.length ||
    !currencies.value.length
  ) {
    await Promise.all([
      fetchLinks(),
      fetchvcList(),
      fetchAccounts(),
      fetchCurrencies(),
    ]);
  }
  initialLoad.value = true;
  try {
    const vcId = invoice[`${type.value}_id`];
    let vcToSelect = vcList.value.find((vc) => vc.id === vcId);
    if (!vcToSelect) {
      const fetchedEntity = await fetchEntity(vcId);
      if (fetchedEntity) {
        vcList.value.push(fetchedEntity);
        vcToSelect = fetchedEntity;
      } else {
        throw new Error(t("Failed to fetch vc details"));
      }
    }
    await vcUpdate(vcToSelect);
    selectedEntity.value = {
      id: vcToSelect.id,
      label: vcToSelect.name,
      [vcNumberField.value]: vcToSelect[vcNumberField.value],
    };

    // Use API taxes if provided; otherwise, fall back to calculateTaxes.
    if (invoice.taxes && invoice.taxes.length > 0) {
      taxIncluded.value = Boolean(invoice.taxincluded);
      invoiceTaxes.value = invoice.taxes.map((tx) => ({
        name: tx.name || `${tx.accno} ${(tx.rate * 100).toFixed(0)}%`,
        amount: parseFloat(tx.amount),
        acc: tx.accno,
        rate: parseFloat(tx.rate),
      }));
      preserveApiTaxes.value = true; // <-- We have legit API taxes; preserve them
    } else {
      calculateTaxes();
    }

    // Map invoice line items with a unique "id"
    lines.value = invoice.lineitems.map((item, index) => ({
      id: Date.now() + index,
      amount: Boolean(invoice.taxincluded)
        ? +item.amount + +item.taxAmount
        : +item.amount,
      account:
        itemAccounts.value.find((acc) => acc.accno == item.accno) || null,
      description: item.description,
      taxAccount: lineTax.value
        ? taxAccountList.value.find(
            (acc) => acc.accno.toString() === item.taxAccount.toString()
          ) || null
        : null,
      taxAmount: lineTax.value ? item.taxAmount || 0 : 0,
      apiTaxAmount: lineTax.value ? item.taxAmount || 0 : 0,
      apiTaxAccount: lineTax.value ? item.taxAccount : null,
    }));

    salesAccount.value = salesAccounts.value[0] || null;
    invDate.value = invoice.invDate || "";
    dueDate.value = invoice.dueDate || "";
    link.value = invoice.file;
    if (invoice.currency) {
      selectedCurrency.value = currencies.value.find(
        (curr) => curr.curr === invoice.currency
      );
    }
    exchangeRate.value = invoice.exchangerate || 1;
    description.value = "";
    notes.value = "";
    intnotes.value = "";
    invNumber.value = invoice.invNumber || "";
    ordNumber.value = "";
    poNumber.value = "";

    // Map payments if any
    if (invoice.payments && invoice.payments.length > 0) {
      payments.value = invoice.payments.map((payment) => ({
        date: payment.date || getTodayDate(),
        source: payment.source || "",
        memo: payment.memo || "",
        amount: payment.amount || 0,
        exchangerate: payment.exchangerate,
        account:
          paymentAccounts.value.find((acc) => acc.accno === payment.account) ||
          paymentAccounts.value[0],
      }));
    } else {
      payments.value = [
        {
          date: getTodayDate(),
          source: "",
          memo: "",
          amount: 0,
          account: paymentAccounts.value[0],
        },
      ];
    }
  } catch (error) {
    console.error("Error loading invoice:", error);
    Notify.create({
      message:
        t("Failed to load invoice: ") +
        (error.message || t("Please try again")),
      type: "negative",
      position: "center",
    });
  } finally {
    initialLoad.value = false;
  }
};

// -------------------------
// Watchers
// -------------------------
watch(
  lines,
  () => {
    // If user changes the lines and we had API-based taxes,
    // we clear preserveApiTaxes to allow normal re-calculation.
    if (!initialLoad.value) {
      preserveApiTaxes.value = false;
      calculateTaxes();
    }
  },
  { deep: true }
);

watch(
  type,
  async (newType) => {
    selectedEntity.value = null;
    vc.value = null;
    lines.value = [
      {
        id: Date.now(),
        amount: 0,
        account: null,
        description: "",
        taxAccount: null,
        taxAmount: 0,
      },
    ];
    payments.value = [
      { date: getTodayDate(), source: "", memo: "", amount: 0, account: "" },
    ];
    description.value = "";
    notes.value = "";
    intnotes.value = "";
    invNumber.value = "";
    ordNumber.value = "";
    poNumber.value = "";
    taxIncluded.value = false;
    invoiceTaxes.value = [];
    preserveApiTaxes.value = false; // reset since we're changing type

    await fetchvcList();
    if (accounts.value.length > 0) {
      const linkType = newType === "vendor" ? "AP" : "AR";
      const linkPaid = newType === "vendor" ? "AP_paid" : "AR_paid";
      const icLink = newType === "vendor" ? "AP_amount" : "AR_amount";

      salesAccounts.value = accounts.value.filter(
        (account) => account.link === linkType
      );
      paymentAccounts.value = accounts.value.filter((account) =>
        account.link.split(":").includes(linkPaid)
      );
      itemAccounts.value = accounts.value.filter((account) =>
        account.link.split(":").includes(icLink)
      );
      salesAccount.value = salesAccounts.value[0] || null;
      payments.value[0].account = paymentAccounts.value[0] || null;
    }
    invoicePreview.value = null;
    selectedFile.value = null;
    splitterModel.value = 100;
  },
  { immediate: true }
);

const vcLabel = computed(() =>
  type.value === "vendor" ? "Vendor" : "Customer"
);
const vcNumberField = computed(() =>
  type.value === "vendor" ? "vendornumber" : "customernumber"
);

onMounted(() => {
  fetchLinks();
  fetchAccounts();
  fetchCurrencies();
  fetchvcList();
  fetchInvoice(route.query.id);
});
</script>
