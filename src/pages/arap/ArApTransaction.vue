<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <q-splitter v-model="splitterModel" class="full-width">
      <!-- Left Panel - Invoice Form -->
      <template v-slot:before>
        <div class="mainbg textmain q-pa-sm">
          <div class="row justify-between full-width q-mt-sm">
            <div class="col-12 col-sm-5">
              <div class="row full-width">
                <s-select
                  :label="t(vcLabel)"
                  :options="vcList"
                  option-label="label"
                  :option-value="vcNumberField"
                  v-model="selectedVc"
                  dense
                  outlined
                  bg-color="input"
                  label-color="secondary"
                  class="q-mb-sm col-12 col-sm-9"
                  @update:model-value="vcUpdate"
                  search="label"
                  account
                />
                <div class="q-ml-sm" style="display: flex; align-items: center">
                  <a
                    href="#"
                    @click.prevent="openEditVc"
                    class="text-primary q-mr-xs"
                    style="text-decoration: none"
                    v-if="selectedVc"
                    >?</a
                  >
                  <a
                    href="#"
                    @click.prevent="openAddVc"
                    class="text-primary"
                    style="margin-right: 0.5em; text-decoration: none"
                    >+</a
                  >
                </div>
                <div class="col-sm-4 q-md-ml-md content-center" v-if="vc">
                  <p class="q-px-sm maintext q-ma-none">
                    <strong>{{ t("Credit Limit") }}</strong>
                    <span class="text-primary q-mx-sm">
                      {{ formatAmount(vc.creditlimit) }}
                    </span>
                    <strong>{{ t("Remaining") }}</strong>
                    <span class="text-negative q-ml-sm">
                      {{ formatAmount(vc.creditremaining) }}
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
                  v-model="recordAccount"
                  :options="recordAccounts"
                  :label="t('Record In')"
                  dense
                  bg-color="input"
                  label-color="secondary"
                  class="q-mb-sm col-sm-9 col-12"
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
                  class="q-mb-sm col-sm-5 col-12"
                  bg-color="input"
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
              <div class="row q-mb-sm">
                <q-select
                  v-if="departments.length > 0"
                  outlined
                  v-model="selectedDepartment"
                  :options="departments"
                  option-value="description"
                  option-label="description"
                  :label="t('Department')"
                  dense
                  bg-color="input"
                  label-color="secondary"
                  clearable
                  autogrow
                  hide-bottom-space
                  class="col-5"
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
            <div class="col-12 col-sm-6">
              <div class="row q-gutter-sm">
                <q-input
                  outlined
                  :label="t('Invoice Number')"
                  v-model="invNumber"
                  class="q-mb-sm col-sm-5 col-12"
                  bg-color="input"
                  label-color="secondary"
                  dense
                />
                <q-input
                  outlined
                  :label="t('Order Number')"
                  v-model="ordNumber"
                  class="q-mb-sm col-sm-5 col-12"
                  bg-color="input"
                  label-color="secondary"
                  dense
                />
              </div>
              <div class="row q-gutter-sm">
                <q-input
                  v-model="invDate"
                  :label="t('Invoice Date')"
                  class="q-mb-sm col-sm-5 col-12"
                  bg-color="input"
                  label-color="secondary"
                  outlined
                  dense
                  type="date"
                  @change="filterProjects"
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
                  bg-color="input"
                  label-color="secondary"
                  class="col-sm-11 col-12"
                  dense
                  type="textarea"
                  rows="2"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Items Section -->
        <div class="mainbg q-my-md q-pa-md">
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
                <q-input
                  outlined
                  v-model="line.description"
                  :label="t('Description')"
                  :class="lineTax && taxAccountList ? 'col-2' : 'col-4'"
                  dense
                  :ref="(el) => (lineDescRefs[index] = el)"
                  autogrow
                  label-color="secondary"
                  bg-color="input"
                />
                <s-select
                  outlined
                  v-model="line.account"
                  :options="itemAccounts"
                  :label="t('Account')"
                  option-label="label"
                  option-value="id"
                  :class="lineTax && taxAccountList ? 'col-2' : 'col-4'"
                  bg-color="input"
                  label-color="secondary"
                  dense
                  search="label"
                  account
                />
                <!-- Amount field with enter key -->
                <fn-input
                  outlined
                  v-model="line.amount"
                  :label="t('Amount')"
                  class="col-2"
                  bg-color="input"
                  label-color="secondary"
                  dense
                  @keyup.enter="() => handleLineEnter(index)"
                />
                <s-select
                  v-if="filteredProjects.length > 0"
                  outlined
                  :options="filteredProjects"
                  :label="t('Project')"
                  option-label="description"
                  option-value="description"
                  v-model="line.project"
                  class="col-2"
                  bg-color="input"
                  label-color="secondary"
                  dense
                  search="description"
                />

                <s-select
                  v-if="lineTax && taxAccountList"
                  outlined
                  v-model="line.taxAccount"
                  :options="taxAccountList"
                  :label="t('Tax Account')"
                  option-label="label"
                  option-value="accno"
                  class="col-2"
                  bg-color="input"
                  label-color="secondary"
                  dense
                  search="label"
                  account
                  @update:model-value="() => onLineTaxAccountChange(index)"
                />
                <!-- Tax Amount field with enter key -->
                <fn-input
                  v-if="lineTax && taxAccountList"
                  outlined
                  v-model="line.taxAmount"
                  :label="t('Tax Amount')"
                  class="col-1"
                  bg-color="input"
                  label-color="secondary"
                  dense
                  @keyup.enter="() => handleLineEnter(index)"
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
                class="col-sm-10 col-12"
                rows="2"
                bg-color="input"
                :label="t('Notes')"
                type="textarea"
                v-model="notes"
              />
            </div>
            <div class="col q-ml-md">
              <q-input
                dense
                outlined
                class="col-sm-11 col-12"
                rows="2"
                bg-color="input"
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

        <!-- Payments Section -->
        <div class="mainbg q-my-md q-pa-md">
          <div class="row q-mb-md">
            <h6 class="q-my-none q-pa-none text-secondary">
              {{ t("Payments") }}
            </h6>
            <q-btn
              color="primary"
              label-color="secondary"
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
            <!-- Date field with inline ref and enter key -->
            <q-input
              outlined
              v-model="payment.date"
              :label="t('Date')"
              class="q-mt-sm"
              bg-color="input"
              label-color="secondary"
              dense
              type="date"
              :ref="(el) => (paymentDateRefs[index] = el)"
              @keyup.enter="() => handlePaymentEnter(index)"
            />
            <q-input
              outlined
              v-model="payment.source"
              :label="t('Source')"
              class="q-mt-sm"
              bg-color="input"
              label-color="secondary"
              dense
              @keyup.enter="() => handlePaymentEnter(index)"
            />
            <q-input
              outlined
              v-model="payment.memo"
              :label="t('Memo')"
              class="q-mt-sm"
              bg-color="input"
              label-color="secondary"
              dense
              @keyup.enter="() => handlePaymentEnter(index)"
            />
            <fn-input
              outlined
              v-model="payment.amount"
              :label="t('Amount')"
              class="q-mt-sm"
              label-color="secondary"
              bg-color="input"
              dense
              @keyup.enter="() => handlePaymentEnter(index)"
            />
            <fn-input
              v-if="selectedCurrency && selectedCurrency.rn != 1"
              outlined
              v-model="payment.exchangerate"
              :label="t('Exhcnage Rate')"
              class="q-mt-sm"
              bg-color="input"
              label-color="secondary"
              dense
              @keyup.enter="() => handlePaymentEnter(index)"
            />
            <s-select
              outlined
              v-model="payment.account"
              :options="paymentAccounts"
              :label="t('Account')"
              option-label="label"
              option-value="id"
              label-color="secondary"
              class="col-2 q-mt-sm"
              :class="
                selectedCurrency && selectedCurrency.rn !== 1 ? 'col-3' : ''
              "
              bg-color="input"
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

        <!-- Action Buttons -->
        <div class="row q-my-sm">
          <q-btn
            :label="t('Post')"
            color="primary"
            @click="postInvoice"
            class="q-mr-md"
          />
          <q-btn
            class="q-mr-md"
            :label="t('Print')"
            color="accent"
            @click="printTransaction"
            v-if="invId"
          />
          <q-btn
            :label="t('Delete')"
            color="warning"
            @click="deleteTransaction"
            v-if="invId"
          />
        </div>
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

    <!-- Global Loading Indicator -->
    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>

    <!-- Add/Edit VC Dialog -->
    <q-dialog v-model="vcDialog">
      <q-card style="min-width: 80vw" class="q-pa-none">
        <q-card-section class="q-pa-none">
          <AddVC
            :id="dialogMode === 'edit' ? selectedVc.id : null"
            :type="type"
            @close="vcDialog = false"
            @saved="vcSaved"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed, inject, nextTick } from "vue";
import { api } from "src/boot/axios";
import { date, Notify } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { formatAmount, confirmDelete } from "src/helpers/utils";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";
import AddVC from "src/pages/arap/AddVC.vue";

// -------------------------
// Internationalization and Routing
// -------------------------
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const updateTitle = inject("updateTitle");
const { formatDate } = date;
const getTodayDate = () => formatDate(new Date(), "YYYY-MM-DD");

// -------------------------
// Transaction Type & Page Title
// -------------------------
const type = ref(route.params.type || route.query.type || "vendor");
if (type.value === "customer") {
  updateTitle("AR Transaction");
} else {
  updateTitle("AP Transaction");
}

// -------------------------
// UI and Form State
// -------------------------
const splitterModel = ref(100);
const invoicePreview = ref(null);
const loading = ref(false);
const selectedFile = ref(null);
const vcDialog = ref(false);
const dialogMode = ref(null); // "add" or "edit"

// -------------------------
// Entity, Account and Currency State
// -------------------------
const vcList = ref([]);
// The minimal vendor selection (bound to the s-select)
const selectedVc = ref(null);
// The full fetched vendor details
const vc = ref(null);
const taxAccounts = ref([]);
const lineTax = ref(false);
const taxAccountList = ref([]);

const recordAccount = ref(null);
const recordAccounts = ref([]);
const paymentAccounts = ref([]);
const itemAccounts = ref([]);
const accounts = ref([]);

const selectedDepartment = ref();
const selectedCurrency = ref(null);
const currencies = ref([]);
const exchangeRate = ref(1);

// -------------------------
// Invoice Details & Calculations
// -------------------------
const description = ref("");
const notes = ref("");
const intnotes = ref("");
const invNumber = ref("");
const invId = ref(route.query.id || "");
const ordNumber = ref("");
const invDate = ref(getTodayDate());
const dueDate = ref(getTodayDate());
const poNumber = ref("");
const link = ref("");

const taxIncluded = ref(false);
const invoiceTaxes = ref([]);

// -------------------------
// Line Items Management
// -------------------------
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

// For "Add Line" button (appends at the end)
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

const removeLine = (index) => {
  if (lines.value.length > 1) {
    lines.value.splice(index, 1);
  }
};

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
  const computed = taxIncluded.value
    ? line.amount * (taxRate / (1 + taxRate))
    : line.amount * taxRate;
  return parseFloat(computed.toFixed(2));
};

const onLineTaxAccountChange = (index) => {
  if (initialLoad.value) return;
  const line = lines.value[index];
  if (line.taxAccount) {
    if (
      !line.apiTaxAccount ||
      line.taxAccount.accno.toString() !== line.apiTaxAccount?.toString()
    ) {
      line.apiTaxAmount = 0;
      line.taxAmount = computeLineTaxAmount(line);
    } else {
      line.taxAmount = line.apiTaxAmount;
    }
  }
  calculateTaxes();
};

const calculateTaxes = () => {
  if (initialLoad.value) return;
  if (!lineTax.value && preserveApiTaxes.value) return;
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
        if (taxAcc) taxAgg[taxAccNo].rate = taxAcc.rate;
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

const total = computed(() => {
  const totalTaxes = invoiceTaxes.value.reduce(
    (acc, tax) => acc + (parseFloat(tax.amount) || 0),
    0
  );
  let totalValue = lines.value.reduce(
    (acc, line) => acc + (parseFloat(line.amount) || 0),
    0
  );
  if (!taxIncluded.value) totalValue += totalTaxes;
  return parseFloat(totalValue.toFixed(2));
});

// -------------------------
// Payment Management
// -------------------------
const defaultPaymentAccount = ref();
const payments = ref([
  { date: getTodayDate(), source: "", memo: "", amount: 0, account: "" },
]);

// For "Add Payment" button (appends at the end)
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
// Refs for Focus Management
// -------------------------
const lineDescRefs = ref([]);
const paymentDateRefs = ref([]);

// -------------------------
// Enter Key Handlers for Inserting New Row Next to Active Row
// -------------------------
const handleLineEnter = (index) => {
  const newLine = {
    id: Date.now(),
    amount: 0,
    account: null,
    description: "",
    taxAccount: null,
    taxAmount: 0,
  };
  lines.value.splice(index + 1, 0, newLine);
  nextTick(() => {
    const newInput = lineDescRefs.value[index + 1];
    if (newInput && newInput.focus) {
      newInput.focus();
    }
  });
};

const handlePaymentEnter = (index) => {
  const newPayment = {
    date: getTodayDate(),
    source: "",
    memo: "",
    amount: 0,
    account: "",
  };
  payments.value.splice(index + 1, 0, newPayment);
  nextTick(() => {
    const newInput = paymentDateRefs.value[index + 1];
    if (newInput && newInput.focus) {
      newInput.focus();
    }
  });
};

// -------------------------
// Data Fetching Functions
// -------------------------
const departments = ref([]);
const projects = ref([]);
const filteredProjects = ref([]);

const filterProjects = () => {
  if (!invDate.value) return;

  filteredProjects.value = projects.value.filter((project) => {
    const start = project.startdate ? new Date(project.startdate) : null;
    const end = project.enddate ? new Date(project.enddate) : null;
    const invDateObj = new Date(invDate.value);

    if (!start && !end) return true; // Include if both are null
    if (!start) return invDateObj <= end; // Include if only end date exists
    if (!end) return invDateObj >= start; // Include if only start date exists

    return invDateObj >= start && invDateObj <= end; // Include if within range
  });
};
const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/${type.value}/`);
    lineTax.value = response.data.linetax;
    departments.value = response.data.departments;
    projects.value = response.data.projects;
    filterProjects();
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

const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    accounts.value = response.data;
    const linkType = type.value === "vendor" ? "AP" : "AR";
    const linkPaid = type.value === "vendor" ? "AP_paid" : "AR_paid";
    const icLink = type.value === "vendor" ? "AP_amount" : "AR_amount";
    recordAccounts.value = accounts.value.filter(
      (account) => account.link === linkType
    );
    recordAccount.value = recordAccounts.value[0] || null;
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

let initialLoad = ref(false);
let preserveApiTaxes = ref(false);

// -------------------------
// Invoice Submission & Loading
// -------------------------
const resetForm = () => {
  selectedVc.value = null;
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
  preserveApiTaxes.value = false;
  invoicePreview.value = null;
  selectedFile.value = null;
  splitterModel.value = 100;
};
const postInvoice = async () => {
  if (!selectedVc.value) {
    Notify.create({
      message: t("Entity is required: " + vcLabel.value),
      type: "negative",
      position: "center",
    });
    return;
  }
  if (!recordAccount.value) {
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
      selectedVc.value,
    description: description.value,
    notes: notes.value,
    intnotes: intnotes.value,
    invNumber: invNumber.value,
    invId: invId.value,
    ordNumber: ordNumber.value,
    invDate: invDate.value,
    dueDate: dueDate.value,
    poNumber: poNumber.value,
    recordAccount: recordAccount.value,
    selectedCurrency: selectedCurrency.value,
    curr: selectedCurrency.value.curr,
    lines: lines.value.map((line) => ({
      amount: line.amount,
      account: line.account ? line.account.accno : null,
      description: line.description,
      taxAccount: line.taxAccount ? line.taxAccount.accno : null,
      taxAmount: line.taxAmount,
      project: line.project
        ? `${line.project.projectnumber}--${line.project.id}`
        : null,
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

  if (selectedDepartment.value) {
    invoiceData.department = `${selectedDepartment.value.description}--${selectedDepartment.value.id}`;
  }

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
    const idParam = invId.value ? `/${invId.value}` : "";
    const response = await api.post(
      `/arap/transaction/${type.value}${idParam}`,
      invoiceData
    );
    Notify.create({
      message: t("Transaction posted successfully"),
      type: "positive",
      position: "center",
    });
    // If there's a callback route, redirect with query params.
    if (route.query.callback) {
      const query = { ...route.query, search: 1 };
      router.push({ path: route.query.callback, query: query });
    } else {
      // Otherwise, reset form data for a new transaction.
      resetForm();
    }
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

// -------------------------
// Deleting a Transaction
// -------------------------
async function deleteTransaction(id) {
  try {
    const confirmed = await confirmDelete({
      title: t("Confirm Deletion"),
      message: t(
        "Are you sure you want to delete this transaction? This action cannot be undone."
      ),
    });

    if (confirmed) {
      await api.delete(`/arap/transaction/${type.value}/${invId.value}`);

      Notify.create({
        message: t("Transaction deleted successfully"),
        color: "positive",
        position: "center",
      });

      if (route.query.callback) {
        const query = { ...route.query, search: 1 };
        router.push({ path: route.query.callback, query: query });
      } else {
        resetForm();
      }
    } else {
      Notify.create({
        message: t("Transaction Delete canceled"),
        color: "warning",
        position: "center",
      });
    }
  } catch (error) {
    Notify.create({
      message: t("Unable to delete transaction") + error,
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
}
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

const loadInvoice = async (invoice) => {
  if (
    !vcList.value.length ||
    !recordAccounts.value.length ||
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
    // Update the minimal vendor selection used by the s-select.
    selectedVc.value = vcToSelect;
    // Ensure vcUpdate completes before updating the rest of the invoice.
    await vcUpdate(vcToSelect);
    if (!vc.value) {
      throw new Error("Vendor details update did not complete.");
    }

    if (invoice.taxes && invoice.taxes.length > 0) {
      taxIncluded.value = Boolean(invoice.taxincluded);
      invoiceTaxes.value = invoice.taxes.map((tx) => ({
        name: tx.name || `${tx.accno} ${(tx.rate * 100).toFixed(0)}%`,
        amount: parseFloat(tx.amount),
        acc: tx.accno,
        rate: parseFloat(tx.rate),
      }));
      preserveApiTaxes.value = true;
    } else {
      calculateTaxes();
    }

    lines.value = invoice.lineitems.map((item, index) => ({
      id: Date.now() + index,
      amount: Boolean(invoice.taxincluded)
        ? +item.amount + +item.taxAmount
        : +item.amount,
      account:
        itemAccounts.value.find((acc) => acc.accno == item.accno) || null,
      description: item.description,
      taxAccount:
        lineTax.value && item.taxAccount
          ? taxAccountList.value.find(
              (acc) => acc.accno.toString() === item.taxAccount.toString()
            ) || null
          : null,
      taxAmount: lineTax.value ? item.taxAmount || 0 : 0,
      apiTaxAmount: lineTax.value ? item.taxAmount || 0 : 0,
      apiTaxAccount: lineTax.value ? item.taxAccount : null,
      project:
        projects.value.length > 0 && item.project
          ? projects.value.find((proj) => proj.id === item.project)
          : null,
    }));
    console.log(projects.value);
    recordAccount.value = recordAccounts.value[0] || null;
    invDate.value = invoice.invDate || "";
    dueDate.value = invoice.dueDate || "";
    link.value = invoice.file;
    if (invoice.currency) {
      selectedCurrency.value = currencies.value.find(
        (curr) => curr.curr === invoice.currency
      );
    }
    exchangeRate.value = invoice.exchangerate || 1;
    if (departments.value?.length) {
      selectedDepartment.value = departments.value.find(
        (dpt) => dpt.id === invoice.department_id
      );
    }
    notes.value = invoice.notes || "";
    intnotes.value = invoice.intNotes || "";
    invNumber.value = invoice.invNumber || "";
    description.value = invoice.description || "";
    invId.value = invoice.id;
    ordNumber.value = "";
    poNumber.value = "";

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
// Add/Edit Dialog Functions
// -------------------------
const openAddVc = () => {
  dialogMode.value = "add";
  vcDialog.value = true;
};

const openEditVc = () => {
  if (!selectedVc.value) return;
  dialogMode.value = "edit";
  vcDialog.value = true;
};

const vcSaved = async (savedEntity) => {
  await fetchvcList();
  selectedVc.value = vcList.value.find((vc) => vc.id == savedEntity.id);
  vcUpdate(selectedVc.value);
  vcDialog.value = false;
};

// -------------------------
// Update Vendor Details (Separate from the minimal selection)
// -------------------------
let isUpdatingVc = false;
const vcUpdate = async (newValue) => {
  if (!newValue) {
    vc.value = {};
    return;
  }
  // Prevent recursive updates from triggering an infinite loop
  if (isUpdatingVc) return;
  isUpdatingVc = true;
  try {
    const entityId = newValue.id || newValue;
    const fetchedEntity = await fetchEntity(entityId);
    if (fetchedEntity) {
      // Update the full vendor details (vc) and related state
      vc.value = fetchedEntity;
      taxAccounts.value = fetchedEntity.taxaccounts
        ? fetchedEntity.taxaccounts.split(" ")
        : [];
      taxAccountList.value = accounts.value
        .filter((account) => taxAccounts.value.includes(account.accno))
        .map((acc) => ({
          ...acc,
          rate: parseFloat(fetchedEntity[`${acc.accno}_rate`] || 0),
        }));
      intnotes.value = fetchedEntity.intnotes;

      const recordAccountAccno = fetchedEntity?.AR?.split("--")[0] ?? "";
      if (recordAccountAccno) {
        const matchingRecord = recordAccounts.value.find(
          (account) => account.accno === recordAccountAccno
        );
        if (matchingRecord) {
          recordAccount.value = matchingRecord;
        }
      }

      const paymentAccountAccno =
        fetchedEntity?.payment_accno?.split("--")[0] || "";
      defaultPaymentAccount.value =
        paymentAccounts.value.find(
          (account) => account.accno === paymentAccountAccno
        ) || paymentAccounts.value[0];
      payments.value.forEach(
        (payment) =>
          payment.amount === 0 &&
          (payment.account = defaultPaymentAccount.value)
      );

      if (fetchedEntity?.currency) {
        const matchingCurrency = currencies.value.find(
          (curr) => curr.curr === fetchedEntity.currency
        );
        if (matchingCurrency) {
          selectedCurrency.value = matchingCurrency;
        } else {
          console.warn(
            `No matching currency found for: ${fetchedEntity.currency}`
          );
        }
      }

      if (invDate.value) {
        const terms = fetchedEntity?.terms ?? 0;
        const newDueDate = date.addToDate(invDate.value, { days: terms });
        dueDate.value = date.formatDate(newDueDate, "YYYY-MM-DD");
      } else {
        console.warn("Invalid invoice date");
      }

      calculateTaxes();
    }
  } catch (error) {
    console.error("Error in vcUpdate:", error);
    Notify.create({
      message:
        t("Failed to update vc details: ") +
        (error.message || t("Please try again")),
      type: "negative",
      position: "center",
    });
  } finally {
    isUpdatingVc = false;
  }
};

// -------------------------
// Computed Properties & Watchers
// -------------------------
const vcLabel = computed(() =>
  type.value === "vendor" ? "Vendor" : "Customer"
);
const vcNumberField = computed(() =>
  type.value === "vendor" ? "vendornumber" : "customernumber"
);

watch(
  lines,
  () => {
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
    selectedVc.value = null;
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
    preserveApiTaxes.value = false;

    await fetchvcList();
    if (accounts.value.length > 0) {
      const linkType = newType === "vendor" ? "AP" : "AR";
      const linkPaid = newType === "vendor" ? "AP_paid" : "AR_paid";
      const icLink = newType === "vendor" ? "AP_amount" : "AR_amount";

      recordAccounts.value = accounts.value.filter(
        (account) => account.link === linkType
      );
      paymentAccounts.value = accounts.value.filter((account) =>
        account.link.split(":").includes(linkPaid)
      );
      itemAccounts.value = accounts.value.filter((account) =>
        account.link.split(":").includes(icLink)
      );
      recordAccount.value = recordAccounts.value[0] || null;
      payments.value[0].account = paymentAccounts.value[0] || null;
    }
    invoicePreview.value = null;
    selectedFile.value = null;
    splitterModel.value = 100;
  },
  { immediate: true }
);

onMounted(() => {
  fetchLinks();
  fetchAccounts();
  fetchCurrencies();
  fetchvcList();
  fetchInvoice(route.query.id);
});

const printTransaction = async () => {
  loading.value = true;
  if (!invId.value) {
    Notify.create({
      message: t("Invoice ID is required"),
      type: "negative",
      position: "center",
    });
    return;
  }

  try {
    const response = await api.get(
      `/print_transaction?id=${invId.value}&vc=${type.value}`,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.pdf";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    loading.value = false;
  } catch (error) {
    Notify.create({
      message: t("Failed to download invoice"),
      type: "negative",
      position: "center",
    });
    console.error("Error downloading invoice:", error);
    loading.value = false;
  }
};
</script>
