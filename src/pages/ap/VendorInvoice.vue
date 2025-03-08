<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <div class="mainbg textmain q-pa-md-md q-pa-sm">
      <div class="row justify-between full-width q-mt-md">
        <div class="col-sm-6 col-12">
          <div class="row full-width">
            <s-select
              :label="t('Vendor')"
              :options="vendors"
              option-label="label"
              option-value="vendornumber"
              v-model="selectedVendor"
              dense
              outlined
              input-class="maintext"
              label-color="secondary"
              class="lightbg q-mb-sm col-12 col-sm-7"
              @update:model-value="vendorUpdate"
              search="label"
            />
            <div class="col-sm-4 q-md-ml-md content-center" v-if="vendor">
              <p class="q-px-sm maintext q-ma-none">
                <strong>{{ t("Credit Limit") }}</strong>
                <span class="text-primary q-mx-sm">
                  {{ formatAmount(vendor.creditlimit) }}
                </span>
                <strong>{{ t("Remaining") }}</strong>
                <span class="text-negative q-ml-sm">
                  {{ formatAmount(vendor.creditremaining) }}
                </span>
              </p>
            </div>
          </div>
          <div v-if="vendor">
            <p class="q-mb-sm q-px-sm maintext">
              <strong>{{ t("Address") }}</strong> {{ vendor.full_address }}
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
              input-class="maintext"
              label-color="secondary"
              class="lightbg q-mb-sm col-sm-7 col-12"
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
              class="lightbg q-mb-sm col-sm-5 col-12"
              input-class="maintext"
              label-color="secondary"
            />
            <q-input
              v-if="selectedCurrency.rn != 1"
              class="lightbg q-mb-sm col-sm-5 col-12 q-ml-md-sm q-mb-sm"
              :label="t('Exchange Rate')"
              outlined
              dense
              v-model="exchangeRate"
            />
          </div>
          <div class="row">
            <q-input
              outlined
              :label="t('Shipping Point')"
              v-model="shippingPoint"
              class="lightbg q-mb-sm col-sm-3 col-12"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              :label="t('Ship Via')"
              v-model="shipVia"
              class="lightbg q-mb-sm col-sm-3 col-12 q-ml-md-md"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              :label="t('Way Bill')"
              v-model="wayBill"
              class="lightbg q-mb-sm q-ml-md-md col-sm-3 col-12"
              input-class="maintext"
              label-color="secondary"
              dense
            />
          </div>
          <div class="row q-my-md-sm"></div>
        </div>
        <div class="col-sm-4 col-12">
          <div class="row justify-around">
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
          <div class="row justify-around">
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
          <div class="row justify-around">
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
    <!-- Line Items Section -->
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
      <draggable
        v-model="lines"
        item-key="id"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element: line, index }">
          <div class="row q-mb-md justify-between" :key="line.id">
            <q-btn icon="drag_indicator" class="lighttext" flat dense />
            <s-select
              :key="line.id"
              outlined
              v-model="line.partnumber"
              :label="t('Number')"
              class="lightbg col-2"
              input-class="maintext"
              label-color="secondary"
              dense
              :options="items"
              option-label="partnumber"
              option-value="partnumber"
              @update:model-value="handleLineItemChange(line, index)"
              search="label"
            />
            <q-input
              outlined
              v-model="line.description"
              :label="t('Description')"
              class="lightbg col-2"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              v-model="line.qty"
              :label="t('Qty')"
              type="number"
              class="lightbg col-1"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              :value="line.oh"
              :label="t('OH')"
              class="lightbg col-1"
              input-class="maintext"
              label-color="secondary"
              dense
              readonly
            />
            <q-input
              outlined
              v-model="line.unit"
              :label="t('Unit')"
              class="lightbg col-1"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <fn-input
              outlined
              v-model="line.price"
              :label="t('Price')"
              class="lightbg col-2"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              v-model="line.discount"
              :label="t('%')"
              type="number"
              class="lightbg col-1"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              v-model="line.extended"
              :model-value="formatAmount(line.extended)"
              :label="t('Extended')"
              dense
              class="lightbg col-1"
              input-class="maintext"
              label-color="secondary"
              readonly
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
    <div class="mainbg q-my-md q-pa-md">
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
          :label="t('Exch')"
          class="lightbg q-mt-sm col-1"
          dense
        />
        <s-select
          outlined
          v-model="payment.account"
          :options="paymentAccounts"
          :label="t('Account')"
          option-label="label"
          option-value="id"
          class="lightbg q-mt-sm col-3"
          input-class="maintext"
          label-color="secondary"
          dense
          label="search"
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
      class="q-mr-md"
    />
    <q-btn color="danger" :label="t('Delete')" />
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
import draggable from "vuedraggable";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const loading = ref(false);
const updateTitle = inject("updateTitle");
updateTitle("Vendor Invoice");
if (route.query.debit_invoice) {
  updateTitle("Debit Invoice");
}

// Unique line id counter
let lineId = 1;
const printOptions = ref({
  type: "Invoice",
  format: "PDF",
  location: "Download",
});

// Dragging flag for reordering
const dragging = ref(false);

// Customers
const vendors = ref([]);
const selectedVendor = ref();
const fetchVendors = async () => {
  try {
    const response = await api.get("/arap/list/vendor");
    vendors.value = response.data;
  } catch (error) {
    console.log(error);
  }
};
const vendor = ref();
const fetchVendor = async (id) => {
  try {
    const response = await api.get(`/arap/list/vendor/${id}`);
    console.log(response);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
const taxAccounts = ref([]);
const vendorUpdate = async (newValue) => {
  vendor.value = await fetchVendor(newValue.id);
  taxAccounts.value = vendor.value.taxaccounts
    ? vendor.value.taxaccounts.split(" ")
    : [];
  calculateTaxes();
};

// Accounts
const recordAccount = ref();
const recordAccounts = ref([]);
const paymentAccounts = ref([]);
const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    const accounts = response.data;
    recordAccounts.value = accounts.filter((account) => account.link === "AP");
    paymentAccounts.value = accounts.filter((account) =>
      account.link.split(":").includes("AP_paid")
    );
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

// Currencies
const selectedCurrency = ref();
const currencies = ref([]);
const exchangeRate = ref();
const fetchCurrencies = async () => {
  try {
    const response = await api.get("/system/currencies");
    currencies.value = response.data;
    if (currencies.value) {
      selectedCurrency.value = currencies.value.find(
        (currency) => currency.rn === 1
      );
    }
  } catch (error) {
    console.log("Failed to submit Currencies:", error);
    Notify.create({
      message: error.response.data.message,
      type: "negative",
      position: "center",
    });
  }
};

// Other Header Info
const shippingPoint = ref("");
const shipVia = ref("");
const wayBill = ref("");
const description = ref("");
const notes = ref("");
const intnotes = ref("");

// Invoice Information
const { formatDate } = date;
const getTodayDate = () => {
  return formatDate(new Date(), "YYYY-MM-DD");
};

const invType = ref(route.query.debit_invoice ? "debit_invoice" : "invoice");

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
    number: "",
    description: "",
    qty: 1,
    oh: 0,
    unit: "",
    price: 0,
    discount: 0,
  },
]);

// Function to add a new line
const addLine = () => {
  lines.value.push({
    id: lineId++,
    item: "",
    number: "",
    description: "",
    qty: 1,
    oh: 0,
    unit: "",
    price: 0,
    discount: 0,
  });
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
            vendor.value[`${taxAccount}_description`] || "Tax Name Not Found";
          const taxRate = vendor.value[`${taxAccount}_rate`] || 0;

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

// Handle part number change; skip updating during a drag
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
    account: "",
  },
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
      `/print_invoice?id=${invId.value}&vc=vendor`,
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
const resetForm = () => {
  // Reset basic form fields
  selectedVendor.value = null;
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
  invDate.value = "";
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

const postInvoice = async () => {
  if (!selectedVendor.value) {
    Notify.create({
      message: "Vendor is required.",
      type: "negative",
      position: "center",
    });
    return;
  }

  if (!recordAccount.value) {
    Notify.create({
      message: "Account is required.",
      type: "negative",
      position: "center",
    });
    return;
  }

  if (!selectedCurrency.value) {
    Notify.create({
      message: "Currency is required.",
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
      message: "At least one line item is required.",
      type: "negative",
      position: "center",
    });
    return;
  }

  const invoiceData = {
    selectedVendor: selectedVendor.value,
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
    lines: lines.value.map((line) => ({
      number: line.partnumber.id,
      description: line.description,
      qty: line.qty,
      oh: line.oh,
      unit: line.unit,
      price: line.price,
      discount: line.discount,
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
      `/arap/invoice/vendor/${invId.value}`,
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
      const response = await api.get(`/arap/invoice/vendor/${id}`);
      console.log(response.data);
      loadInvoice(response.data);
    } catch (error) {
      console.log(error);
    }
  }
};

const loadInvoice = async (invoice) => {
  if (
    vendors.value.length === 0 ||
    items.value.length === 0 ||
    recordAccounts.value.length === 0 ||
    currencies.value.length === 0
  ) {
    await Promise.all([
      fetchVendors(),
      fetchItems(),
      fetchAccounts(),
      fetchCurrencies(),
    ]);
  }

  selectedVendor.value = vendors.value.find(
    (vend) => vend.vendornumber === invoice.vendornumber
  );

  if (!selectedVendor.value) {
    Notify.create({
      message: `Vendor with number ${invoice.vendornumber} not found.`,
      type: "negative",
      position: "center",
    });
    return;
  }

  await vendorUpdate(selectedVendor.value);

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

  if (invType.value === "debit_invoice") {
    updateTitle("Debit Invoice");
  }

  if (invoice.currency) {
    selectedCurrency.value = currencies.value.find(
      (curr) => curr.curr === invoice.currency
    );
  }
  exchangeRate.value = invoice.exchangerate || 1;
  taxIncluded.value = !!invoice.taxincluded;

  // When loading, add unique id for each line
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
  fetchCurrencies();
  fetchItems();
  fetchVendors();
  fetchInvoice(route.query.id);
});
</script>
