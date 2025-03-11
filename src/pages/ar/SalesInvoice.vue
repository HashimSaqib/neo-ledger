<template>
  <q-page class="q-pa-sm relative-position">
    <div class="mainbg textmain q-pa-md-sm q-pa-sm">
      <div class="row justify-between full-width">
        <div class="col-sm-6 col-12">
          <div class="row full-width">
            <s-select
              :label="t('Customer')"
              :options="customers"
              option-label="label"
              option-value="customernumber"
              v-model="selectedCustomer"
              dense
              outlined
              label-color="secondary"
              class="q-mb-sm col-12 col-sm-7"
              @update:model-value="customerUpdate"
              search="label"
              bg-color="input"
            />
            <div class="q-ml-sm" style="display: flex; align-items: center">
              <a
                href="#"
                @click.prevent="openEditCustomer"
                class="text-primary q-mr-xs"
                style="text-decoration: none"
                v-if="selectedCustomer"
                >?</a
              >
              <a
                href="#"
                @click.prevent="openAddCustomer"
                class="text-primary"
                style="margin-right: 0.5em; text-decoration: none"
                >+</a
              >
            </div>
            <div class="col-sm-4 q-md-ml-md content-center" v-if="customer">
              <p class="q-px-sm maintext q-ma-none">
                <strong>{{ t("Credit Limit") }}</strong>
                <span class="text-primary q-mx-sm">
                  {{ formatAmount(customer.creditlimit) }}
                </span>
                <strong>{{ t("Remaining") }}</strong>
                <span class="text-negative q-ml-sm">
                  {{ formatAmount(customer.creditremaining) }}
                </span>
              </p>
            </div>
          </div>
          <div v-if="customer">
            <p class="q-mb-sm q-px-sm maintext">
              <strong>{{ t("Address") }}</strong> {{ customer.full_address }}
            </p>
          </div>

          <div class="row">
            <s-select
              outlined
              v-model="recordAccount"
              :options="recordAccounts"
              :label="t('Record In')"
              dense
              popup-content-class="mainbg maintext"
              label-color="secondary"
              bg-color="input"
              class="q-mb-sm col-sm-7 col-12"
              search="label"
              account
            />
          </div>

          <div v-if="currencies && currencies.length" class="row">
            <q-select
              v-if="currencies"
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
              class="q-mb-sm col-sm-5 col-12 q-ml-md-sm q-mb-sm"
              :label="t('Exchange Rate')"
              outlined
              bg-color="input"
              dense
              v-model="exchangeRate"
            />
          </div>
          <div class="row q-mb-sm">
            <q-input
              outlined
              :label="t('Description')"
              v-model="description"
              bg-color="input"
              label-color="secondary"
              class="col-sm-10 col-12"
              dense
              autogrow
            />
          </div>
          <div class="row q-gutter-x-sm">
            <q-input
              outlined
              :label="t('Shipping Point')"
              v-model="shippingPoint"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              dense
              autogrow
            />
            <q-input
              outlined
              :label="t('Ship Via')"
              v-model="shipVia"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              dense
              autogrow
            />
            <q-input
              outlined
              :label="t('Way Bill')"
              v-model="wayBill"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              dense
              autogrow
            />
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
              class="col-sm-5 col-12 q-mb-sm"
            />
          </div>
        </div>
        <div class="col-sm-4 col-12">
          <div class="row justify-around">
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
          <div class="row justify-around">
            <q-input
              v-model="invDate"
              :label="t('Invoice Date')"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              type="date"
            />
            <q-input
              v-model="dueDate"
              :label="t('Due Date')"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              type="date"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- Line Items Section -->
    <div class="mainbg q-my-sm q-pa-sm">
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
      <draggable
        v-model="lines"
        item-key="id"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element: line, index }">
          <div :key="line.id">
            <!-- Main line fields -->
            <div
              class="row justify-between"
              :class="line.lineitemdetail ? '' : 'q-mb-sm'"
            >
              <s-select
                :key="line.id"
                outlined
                v-model="line.partnumber"
                :label="t('Number')"
                class="col-2"
                bg-color="input"
                label-color="secondary"
                dense
                :options="items"
                option-label="partnumber"
                option-value="partnumber"
                @update:model-value="handleLineItemChange(line, index)"
                search="label"
                :ref="(el) => (lineSelects[index] = el)"
              />
              <q-input
                outlined
                v-model="line.description"
                :label="t('Description')"
                class="col-2"
                bg-color="input"
                label-color="secondary"
                dense
                autogrow
              />
              <q-input
                outlined
                v-model="line.qty"
                :label="t('Qty')"
                type="number"
                class="col-1"
                bg-color="input"
                label-color="secondary"
                dense
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                :value="line.oh"
                :label="t('OH')"
                class="col-1"
                bg-color="input"
                label-color="secondary"
                dense
                readonly
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.unit"
                :label="t('Unit')"
                class="col-1"
                bg-color="input"
                label-color="secondary"
                dense
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <fn-input
                outlined
                v-model="line.price"
                :label="t('Price')"
                class="col-2"
                bg-color="input"
                label-color="secondary"
                dense
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.discount"
                :label="t('%')"
                type="number"
                class="col-1"
                bg-color="input"
                label-color="secondary"
                dense
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.extended"
                :model-value="formatAmount(line.extended)"
                :label="t('Extended')"
                dense
                class="col-1"
                bg-color="input"
                label-color="secondary"
                readonly
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-btn
                flat
                dense
                icon="keyboard_arrow_down"
                :class="line.lineitemdetail ? 'rotate-180' : ''"
                @click="toggleDetail(line)"
              />
              <q-btn
                color="negative"
                icon="delete"
                dense
                flat
                @click="removeLine(index)"
              />
            </div>

            <div v-if="line.lineitemdetail" class="row q-pa-sm q-gutter-xs">
              <q-input
                outlined
                v-model="line.devliverydate"
                :label="t('Delivery Date')"
                dense
                type="date"
                class="col-2"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.itemnotes"
                :label="t('Item Notes')"
                dense
                type="textarea"
                rows="1"
                class="col-4"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.serialnumber"
                :label="t('Serial No.')"
                dense
                class="col-3"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.costvendor"
                :label="t('Vendor')"
                dense
                class="col-3"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <fn-input
                outlined
                v-model="line.cost"
                :label="t('Cost')"
                dense
                class="col-2"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.ordernumber"
                :label="t('Order Number')"
                dense
                class="col-3"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.customerponumber"
                :label="t('PO Number')"
                dense
                class="col-3"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-input
                outlined
                v-model="line.package"
                :label="t('Packaging')"
                dense
                class="col-3"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <fn-input
                outlined
                v-model="line.netweight"
                :label="t('N.W.')"
                dense
                class="col-2"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <fn-input
                outlined
                v-model="line.weight"
                :label="t('G.W.')"
                dense
                class="col-2"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <fn-input
                outlined
                v-model="line.volume"
                :label="t('Volume')"
                dense
                class="col-2"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
            </div>
          </div>
        </template>
      </draggable>

      <div class="row justify-between items-end">
        <div class="col">
          <q-input
            dense
            outlined
            class="col-sm-10 col-12"
            rows="2"
            bg-color="input"
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
            class="col-sm-11 col-12"
            rows="2"
            bg-color="input"
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
                @click="taxInclude"
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
            <div class="">
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
    <!-- Payment Section -->
    <div class="mainbg q-my-sm q-pa-sm">
      <div class="row q-mb-md">
        <h6 class="q-my-none q-pa-none text-secondary">{{ t("Payments") }}</h6>
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
          class="q-mt-sm"
          bg-color="input"
          label-color="secondary"
          dense
          type="date"
          @keyup.enter="handlePaymentEnter(index, $event)"
          :ref="(el) => (paymentDateInputs[index] = el)"
        />
        <q-input
          outlined
          v-model="payment.source"
          :label="t('Source')"
          class="q-mt-sm"
          bg-color="input"
          label-color="secondary"
          dense
          @keyup.enter="handlePaymentEnter(index, $event)"
        />
        <q-input
          outlined
          v-model="payment.memo"
          :label="t('Memo')"
          class="q-mt-sm"
          bg-color="input"
          label-color="secondary"
          dense
          @keyup.enter="handlePaymentEnter(index, $event)"
        />
        <fn-input
          outlined
          v-model="payment.amount"
          :label="t('Amount')"
          class="q-mt-sm"
          bg-color="input"
          label-color="secondary"
          dense
          @keyup.enter="handlePaymentEnter(index, $event)"
        />
        <fn-input
          v-if="selectedCurrency && selectedCurrency.rn != 1"
          outlined
          v-model="payment.exchangerate"
          :label="t('Exch')"
          class="q-mt-sm col-1"
          dense
          @keyup.enter="handlePaymentEnter(index, $event)"
        />
        <s-select
          outlined
          v-model="payment.account"
          :options="paymentAccounts"
          :label="t('Account')"
          option-label="label"
          option-value="id"
          class="q-mt-sm col-3"
          bg-color="input"
          label-color="secondary"
          dense
          search="label"
          account
          @keyup.enter="handlePaymentEnter(index, $event)"
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
    <div class="row q-gutter-x-md" v-if="invId">
      <q-select
        :options="['Invoice']"
        v-model="printOptions.type"
        class="mainbg"
        dense
        outlined
      />
      <q-select
        :options="['PDF']"
        v-model="printOptions.format"
        class="mainbg"
        dense
        outlined
      />
      <q-select
        :options="['Download']"
        v-model="printOptions.location"
        class="mainbg"
        dense
        outlined
      />
    </div>
    <q-separator class="q-my-sm" size="2px" v-if="invId" />
    <q-btn
      :label="t('Post')"
      color="primary"
      @click="postInvoice"
      class="relative-position q-mr-md"
    />
    <q-btn
      color="accent"
      :label="t('Print')"
      @click="printInvoice"
      v-if="invId"
    />
    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>
    <q-dialog v-model="customerDialog">
      <q-card style="min-width: 80vw" class="q-pa-none">
        <q-card-section class="q-pa-none">
          <AddVC
            :id="dialogMode === 'edit' ? selectedCustomer.id : null"
            type="customer"
            @close="customerDialog = false"
            @saved="customerSaved"
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
import { formatAmount } from "src/helpers/utils";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";
import AddVC from "src/pages/arap/AddVC.vue";
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const loading = ref(false);
const updateTitle = inject("updateTitle");
const printOptions = ref({
  type: "Invoice",
  format: "PDF",
  location: "Download",
});
// Set title based on invoice type
updateTitle("Customer Invoice");
if (route.query.credit_invoice) {
  updateTitle("Credit Invoice");
}

// Unique line id counter
let lineId = 1;

// Dragging flag for reordering
const dragging = ref(false);

// Refs for auto-focusing newly added items
const lineSelects = ref([]);
const paymentDateInputs = ref([]);

// Customers
const customers = ref([]);
const selectedCustomer = ref();
const fetchCustomers = async () => {
  try {
    const response = await api.get("/arap/list/customer");
    customers.value = response.data;
  } catch (error) {
    console.log(error);
  }
};
const customer = ref();
const fetchCustomer = async (id) => {
  try {
    const response = await api.get(`/arap/list/customer/${id}`);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
const taxAccounts = ref([]);
const customerSaved = async (id) => {
  console.log(id.id);
  await fetchCustomers();
  selectedCustomer.value = customers.value.find((cus) => cus.id == id.id);
  console.log("SELECTED CUSTOMER");
  console.log(selectedCustomer.value);
  customerUpdate(id);
  customerDialog.value = false;
};

const customerUpdate = async (newValue) => {
  if (!newValue) {
    customer.value = {};
    return;
  }
  customer.value = await fetchCustomer(newValue.id);
  taxAccounts.value = customer.value.taxaccounts
    ? customer.value.taxaccounts.split(" ")
    : [];
  console.log(customer.value);
  intnotes.value = customer.value.intnotes;
  const recordAccountAccno = customer.value?.AR?.split("--")[0] ?? "";

  if (recordAccountAccno) {
    const matchingRecord = recordAccounts.value.find(
      (account) => account.accno === recordAccountAccno
    );
    if (matchingRecord) {
      recordAccount.value = matchingRecord;
    } else {
    }
  }
  const paymentAccountAccno =
    customer.value?.payment_accno?.split("--")[0] || "";
  defaultPaymentAccount.value =
    paymentAccounts.value.find(
      (account) => account.accno === paymentAccountAccno
    ) || paymentAccounts.value[0];

  payments.value.forEach(
    (payment) =>
      payment.amount === 0 && (payment.account = defaultPaymentAccount.value)
  );

  if (customer.value?.currency) {
    const customerCurrency = currencies.value.find(
      (curr) => curr.curr === customer.value.currency
    );
    if (customerCurrency) {
      selectedCurrency.value = customerCurrency;
    } else {
      console.warn(
        `No matching currency found for: ${customer.value.currency}`
      );
    }
  }
  if (invDate.value) {
    console.log(invDate.value);
    const terms = customer.value?.terms ?? 0;
    const newDueDate = date.addToDate(invDate.value, { days: terms });
    dueDate.value = date.formatDate(newDueDate, "YYYY-MM-DD");

    console.log(dueDate.value);
  } else {
    console.warn("Invalid invoice date");
  }
  calculateTaxes();
};
const customerDialog = ref(false);
const dialogMode = ref("add"); // "add" or "edit"

const openAddCustomer = () => {
  dialogMode.value = "add";
  customerDialog.value = true;
};

const openEditCustomer = () => {
  if (!selectedCustomer.value) return;
  dialogMode.value = "edit";
  customerDialog.value = true;
};
const resetForm = () => {
  // Reset basic form fields
  selectedCustomer.value = null;
  recordAccount.value = null;
  selectedCurrency.value = null;
  shippingPoint.value = "";
  shipVia.value = "";
  wayBill.value = "";
  description.value = "";
  notes.value = "";
  intnotes.value = "";
  invNumber.value = "";
  ordNumber.value = "";
  dueDate.value = "";
  poNumber.value = "";

  lines.value = [
    {
      partnumber: null,
      description: "",
      qty: 0,
      oh: "",
      unit: "",
      price: 0,
      discount: 0,
    },
  ];

  payments.value = [
    {
      date: "",
      source: "",
      memo: "",
      amount: 0,
      account: { label: "" },
      exchangerate: 1,
    },
  ];

  // Reset exchange rate and tax related fields
  exchangeRate.value = 1;
  invoiceTaxes.value = [];
  taxIncluded.value = false;
};
// Accounts
const recordAccount = ref();
const recordAccounts = ref([]);
const paymentAccounts = ref([]);
const defaultPaymentAccount = ref([]);
const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    const accounts = response.data;
    recordAccounts.value = accounts.filter((account) => account.link === "AR");
    paymentAccounts.value = accounts.filter((account) =>
      account.link.split(":").includes("AR_paid")
    );
    defaultPaymentAccount.value = paymentAccounts.value[0];
    recordAccount.value = recordAccounts.value[0];
  } catch (error) {
    console.log(error);
    Notify.create({
      message: error.response.data.message,
      type: "negative",
      position: "center",
    });
  }
};
// Links
const departments = ref([]);
const selectedDepartment = ref();
const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/customer`);
    console.log(response.data);
    departments.value = response.data.departments;
    currencies.value = response.data.currencies;
    if (currencies.value) {
      selectedCurrency.value = currencies.value.find(
        (currency) => currency.rn === 1
      );
    }
    console.log(response.data);
  } catch (error) {
    console.log(error);
  }
};
// Currencies
const selectedCurrency = ref();
const currencies = ref([]);
const exchangeRate = ref();

// Other Header Info
const shippingPoint = ref("");
const shipVia = ref("");
const wayBill = ref("");
const description = ref("");
const notes = ref("");
const intnotes = ref("");

// Invoice Information
const { formatDate, addToDate } = date;
const getTodayDate = () => {
  return formatDate(new Date(), "YYYY-MM-DD");
};

const invType = ref(route.query.credit_invoice ? "credit_invoice" : "invoice");

const invNumber = ref("");
const invId = ref(route.query.id ? `${route.query.id}` : "");
const ordNumber = ref("");
const invDate = ref(getTodayDate());
const dueDate = ref(getTodayDate());
const poNumber = ref("");

const items = ref([]);
const fetchItems = async () => {
  try {
    const response = await api.get("/items");
    items.value = response.data.parts.map((item) => ({
      ...item,
      label: `${item.partnumber} -- ${item.description}`,
    }));
    console.log(items.value);
  } catch (error) {
    console.log(error);
  }
};

const lines = ref([
  {
    id: lineId++,
    lineitemdetail: false,
    number: "",
    description: "",
    qty: 1,
    oh: 0,
    unit: "",
    price: 0,
    discount: 0,
  },
]);

const toggleDetail = (line) => {
  line.lineitemdetail = !line.lineitemdetail;
};

// Lock flags to prevent duplicate additions on enter key
let lineEnterLock = false;
let paymentEnterLock = false;

// Function to add a new line at a given index
const addLineAt = (index) => {
  const newLine = {
    id: lineId++,
    lineitemdetail: false,
    item: "",
    number: "",
    description: "",
    qty: 1,
    oh: 0,
    unit: "",
    price: 0,
    discount: 0,
  };
  lines.value.splice(index + 1, 0, newLine);
  nextTick(() => {
    const newIndex = index + 1;
    if (lineSelects.value[newIndex]?.focus) {
      lineSelects.value[newIndex].focus();
    }
  });
};

// Called when enter is pressed on any field in a line
const handleLineEnter = (index, event) => {
  if (lineEnterLock) return;
  lineEnterLock = true;
  event.preventDefault();
  event.stopPropagation();
  addLineAt(index);
  setTimeout(() => {
    lineEnterLock = false;
  }, 300);
};

// Function to add a new line when the Add Line button is clicked
const addLine = () => {
  addLineAt(lines.value.length - 1);
};

const removeLine = (index) => {
  if (lines.value.length > 1) {
    lines.value.splice(index, 1);
  }
};

// Invoice Taxes
const taxIncluded = ref(false);
const invoiceTaxes = ref([]);
const calculateTaxes = () => {
  invoiceTaxes.value = [];

  lines.value.forEach((line) => {
    if (!line.partnumber || !line.partnumber.id) {
      return;
    }

    const selectedItem = items.value.find(
      (item) => item.id === line.partnumber.id
    );
    if (selectedItem && selectedItem.taxaccounts) {
      selectedItem.taxaccounts.forEach((taxAccount) => {
        if (taxAccounts.value.includes(taxAccount)) {
          const name =
            customer.value[`${taxAccount}_description`] || "Tax Name Not Found";
          const taxRate = customer.value[`${taxAccount}_rate`] || 0;

          let taxAmount = 0;
          let netAmount = parseFloat(line.extended);

          if (taxIncluded.value) {
            taxAmount = netAmount * (taxRate / (1 + taxRate));
            netAmount -= taxAmount;
          } else {
            taxAmount = netAmount * taxRate;
          }

          const existingTax = invoiceTaxes.value.find(
            (tax) => tax.name === `${name} ${(taxRate * 100).toFixed(0)}%`
          );

          if (existingTax) {
            existingTax.amount += parseFloat(taxAmount.toFixed(2));
          } else {
            invoiceTaxes.value.push({
              name: `${name} ${(taxRate * 100).toFixed(0)}%`,
              amount: parseFloat(taxAmount.toFixed(2)),
              acc: taxAccount,
              rate: taxRate,
            });
          }
        }
      });
    }
  });
};

const subtotal = computed(() => {
  let totalValue = lines.value.reduce((acc, line) => {
    return acc + (parseFloat(line.extended) || 0);
  }, 0);

  if (taxIncluded.value) {
    const totalTaxes = invoiceTaxes.value.reduce((acc, tax) => {
      return acc + (parseFloat(tax.amount) || 0);
    }, 0);

    totalValue -= totalTaxes;
  }

  return parseFloat(totalValue.toFixed(2));
});

const taxInclude = () => {
  calculateTaxes();
};

const total = computed(() => {
  const totalTaxes = invoiceTaxes.value.reduce((acc, tax) => {
    return acc + (parseFloat(tax.amount) || 0);
  }, 0);

  let totalValue = lines.value.reduce((acc, line) => {
    return acc + (parseFloat(line.extended) || 0);
  }, 0);

  if (!taxIncluded.value) {
    totalValue += totalTaxes;
  }

  return parseFloat(totalValue.toFixed(2));
});

const calculateExtended = (qty, price, discount) => {
  const baseValue = qty * price;
  const discountedValue = baseValue - (baseValue * discount) / 100;
  return discountedValue.toFixed(2);
};

const handleLineItemChange = (newValue, index) => {
  if (dragging.value) return;

  if (newValue && newValue.partnumber) {
    if (!newValue.noupdate) {
      const line = lines.value[index];
      line.description = newValue.partnumber.description || "";
      line.oh = newValue.partnumber.oh || 0;
      line.unit = newValue.partnumber.unit || "";
      line.price = newValue.partnumber.sellprice || 0;
      line.extended = calculateExtended(
        line.qty || 1,
        line.price,
        line.discount || 0
      );
    } else {
      const line = lines.value[index];
      line.noupdate = false;
    }
  }
  calculateTaxes();
};

// Payment Data
const payments = ref([
  {
    date: getTodayDate(),
    source: "",
    memo: "",
    amount: 0,
    account: defaultPaymentAccount.value,
  },
]);

// Function to add a new payment at a given index
const addPaymentAt = (index) => {
  const newPayment = {
    date: getTodayDate(),
    source: "",
    memo: "",
    amount: 0,
    account: defaultPaymentAccount.value,
  };
  payments.value.splice(index + 1, 0, newPayment);
  nextTick(() => {
    if (
      paymentDateInputs.value[index + 1] &&
      paymentDateInputs.value[index + 1].focus
    ) {
      paymentDateInputs.value[index + 1].focus();
    }
  });
};

// Called when enter is pressed on any payment field
const handlePaymentEnter = (index, event) => {
  if (paymentEnterLock) return;
  paymentEnterLock = true;
  event.preventDefault();
  event.stopPropagation();
  addPaymentAt(index);
  setTimeout(() => {
    paymentEnterLock = false;
  }, 300);
};

// Function to add a new payment when the Add Payment button is clicked
const addPayment = () => {
  addPaymentAt(payments.value.length - 1);
};

const removePayment = (index) => {
  if (payments.value.length > 1) {
    payments.value.splice(index, 1);
  }
};

const printInvoice = async () => {
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
      `/print_invoice?id=${invId.value}&vc=customer`,
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

const postInvoice = async () => {
  if (!selectedCustomer.value) {
    Notify.create({
      message: t("Customer is required."),
      type: "negative",
      position: "center",
    });
    return;
  }

  if (!recordAccount.value) {
    Notify.create({
      message: t("Account is required."),
      type: "negative",
      position: "center",
    });
    return;
  }

  if (!selectedCurrency.value) {
    Notify.create({
      message: t("Currency is required."),
      type: "negative",
      position: "center",
    });
    return;
  }

  if (
    lines.value.length === 0 ||
    !lines.value.some((line) => line.partnumber)
  ) {
    Notify.create({
      message: t("At least one line item is required."),
      type: "negative",
      position: "center",
    });
    return;
  }
  const invoiceData = {
    selectedCustomer: selectedCustomer.value,
    shippingPoint: shippingPoint.value,
    shipVia: shipVia.value,
    wayBill: wayBill.value,
    description: description.value,
    notes: notes.value,
    intnotes: intnotes.value,
    invNumber: invNumber.value,
    ordNumber: ordNumber.value,
    invDate: invDate.value,
    dueDate: dueDate.value,
    poNumber: poNumber.value,
    recordAccount: recordAccount.value,
    selectedCurrency: selectedCurrency.value,
    type: invType.value,
    lines: lines.value
      .filter((line) => line.partnumber && line.partnumber.id) // Filter out empty partnumbers
      .map((line) => ({
        number: line.partnumber.id,
        description: line.description,
        qty: line.qty,
        oh: line.oh,
        unit: line.unit,
        price: line.price,
        discount: line.discount,
        lineitemdetail: line.lineitemdetail,
        devliverydate: line.deliverydate,
        itemnotes: line.itemnotes,
        ordernumber: line.ordernumber,
        serialnumber: line.serialnumber,
        customerponumber: line.customerponumber,
        costvendor: line.costvendor,
        package: line.package,
        volume: line.volume,
        weight: line.weight,
        netweight: line.netweight,
        cost: line.cost,
      })),
    payments: payments.value.map((payment) => ({
      date: payment.date,
      source: payment.source,
      memo: payment.memo,
      amount: payment.amount,
      account: payment.account.label,
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

  console.log("Invoice Data:", invoiceData);
  try {
    loading.value = true;
    const response = await api.post(
      `/arap/invoice/customer/${invId.value}`,
      invoiceData
    );
    Notify.create({
      message: "Transaction posted successfully",
      type: "positive",
      position: "center",
    });
    if (route.query.callback) {
      const query = { ...route.query, search: 1 };
      router.push({ path: route.query.callback, query: query });
    } else {
      resetForm();
    }
  } catch (error) {
    console.log(error);
    Notify.create({
      message: error.response?.data?.message || "Transaction error",
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const fetchInvoice = async (id) => {
  if (id) {
    try {
      const response = await api.get(`/arap/invoice/customer/${id}`);
      console.log(response.data);
      loadInvoice(response.data);
    } catch (error) {
      console.log(error);
    }
  }
};

const loadInvoice = async (invoice) => {
  if (
    customers.value.length === 0 ||
    items.value.length === 0 ||
    recordAccounts.value.length === 0 ||
    currencies.value.length === 0
  ) {
    await Promise.all([
      fetchCustomers(),
      fetchItems(),
      fetchAccounts(),
      fetchLinks(),
    ]);
  }

  selectedCustomer.value = customers.value.find(
    (cust) => cust.customernumber === invoice.customernumber
  );

  if (!selectedCustomer.value) {
    Notify.create({
      message: `Customer with number ${invoice.customernumber} not found.`,
      type: "negative",
      position: "center",
    });
    return;
  }

  await customerUpdate(selectedCustomer.value);

  recordAccount.value = recordAccounts.value.find(
    (account) => account.accno === invoice.recordAccount.accno
  );

  if (!recordAccount.value) {
    Notify.create({
      message: `Sales account ${invoice.recordAccount.accno} not found.`,
      type: "negative",
      position: "center",
    });
    return;
  }

  if (departments.value?.length) {
    selectedDepartment.value = departments.value.find(
      (dpt) => dpt.id === invoice.department_id
    );
  }

  shippingPoint.value = invoice.shippingPoint;
  shipVia.value = invoice.shipVia;
  wayBill.value = invoice.wayBill;
  description.value = invoice.description;
  notes.value = invoice.notes;
  intnotes.value = invoice.intnotes;
  invNumber.value = invoice.invNumber;
  invId.value = invoice.id;
  invType.value = invoice.type;
  ordNumber.value = invoice.ordNumber;
  invDate.value = invoice.invDate;
  dueDate.value = invoice.dueDate;
  poNumber.value = invoice.poNumber;

  if (invType.value === "credit_invoice") {
    updateTitle("Credit Invoice");
  }

  if (invoice.currency) {
    selectedCurrency.value = currencies.value.find(
      (curr) => curr.curr === invoice.currency
    );
  }
  exchangeRate.value = invoice.exchangerate || 1;
  taxIncluded.value = !!invoice.taxincluded;

  lines.value = invoice.lines.map((line) => {
    return {
      id: lineId++,
      partnumber: line,
      description: line.description,
      qty: line.qty,
      oh: line.oh,
      unit: line.unit,
      price: line.price,
      discount: line.discount,
      extended:
        line.qty * line.price - (line.qty * line.price * line.discount) / 100,
      lineitemdetail: line.lineitemdetail ? true : false,
      devliverydate: line.deliverydate,
      itemnotes: line.itemnotes,
      ordernumber: line.ordernumber,
      serialnumber: line.serialnumber,
      customerponumber: line.customerponumber,
      costvendor: line.costvendor,
      package: line.package,
      volume: line.volume,
      weight: line.weight,
      netweight: line.netweight,
      cost: line.cost,
      volume: line.cost,
      noupdate: true,
    };
  });
  console.log(invoice.lines);
  calculateTaxes();

  payments.value = invoice.payments.map((payment) => {
    const account = paymentAccounts.value.find(
      (acc) => acc.id === payment.account || acc.label === payment.account
    );
    if (!account) {
      Notify.create({
        message: `Payment account ${payment.account} not found.`,
        type: "negative",
        position: "center",
      });
      return {};
    }
    return {
      date: payment.date,
      source: payment.source,
      memo: payment.memo,
      amount: payment.amount,
      account: account,
      exchangerate: payment.exchangerate,
    };
  });
  if (payments.value.length === 0) {
    addPayment();
  }
};

watch(
  lines,
  (newLines) => {
    newLines.forEach((line, index) => {
      line.extended = calculateExtended(
        line.qty || 1,
        line.price,
        line.discount || 0
      );
    });
    calculateTaxes();
  },
  { deep: true }
);

onMounted(() => {
  fetchAccounts();
  fetchLinks();
  fetchItems();
  fetchCustomers();
  fetchInvoice(route.query.id);
});
</script>
