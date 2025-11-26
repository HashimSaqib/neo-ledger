<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <div class="mainbg textmain q-pa-sm">
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
              input-class=" lightbg maintext"
              label-color="secondary"
              class="q-mb-sm col-12 col-sm-7"
              @update:model-value="customerUpdate"
              search="label"
            />
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
          <div class="row q-gutter-sm">
            <s-select
              outlined
              v-model="salesAccount"
              :options="salesAccounts"
              :label="t('Record In')"
              dense
              popup-content-class="lightbg maintext"
              input-class="maintext"
              label-color="secondary"
              class="q-mb-sm col-sm-7 col-12"
              search="label"
              account
            />
            <div v-if="currencies && currencies.length" class="col-sm-4 col-12">
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
                class="lightbg col-sm-5 col-12"
                :label="t('Exchange Rate')"
                outlined
                dense
                v-model="exchangeRate"
              />
            </div>
          </div>
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
              readonly
            />
            <q-input
              v-model="invDate"
              :label="t('Invoice Date')"
              class="lightbg q-mb-sm col-sm-5 col-12"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              type="date"
              readonly
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
      <div
        v-for="(line, index) in lines"
        :key="index"
        class="row q-mb-md justify-between"
      >
        <q-select
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
          search="partnumber"
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

      <div class="row items-start justify-between">
        <div class="col-8">
          <div class="row q-mb-md">
            <q-btn
              color="primary"
              icon="add"
              dense
              flat
              :label="t('Add Line')"
              @click="addPayment"
            />
          </div>
          <div
            v-for="(payment, index) in payments"
            :key="index"
            class="row q-mb-md justify-between"
          >
            <fn-input
              outlined
              v-model="payment.amount"
              :label="t('Amount')"
              class="lightbg col-2"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              v-model="payment.source"
              :label="t('Source')"
              class="lightbg col-2"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <q-input
              outlined
              v-model="payment.memo"
              :label="t('Memo')"
              class="lightbg col-3"
              input-class="maintext"
              label-color="secondary"
              dense
            />
            <s-select
              outlined
              v-model="payment.account"
              :options="paymentAccounts"
              :label="t('Account')"
              option-label="label"
              option-value="id"
              class="lightbg col-4"
              input-class="maintext"
              label-color="secondary"
              dense
              account
              search="label"
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
        <div class="col-4">
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
                <strong> {{ formatAmount(subtotal) }} </strong>
              </p>
            </div>
          </div>

          <div
            class="row justify-end maintext"
            v-for="tax in invoiceTaxes"
            :key="tax.name"
          >
            <div class="q-mr-xl">
              <p class="q-my-xs">{{ t(tax.name) }}</p>
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
                <strong> {{ formatAmount(total) }} </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <q-btn
      :label="t('Post')"
      color="primary"
      @click="postInvoice"
      class="relative-position"
    >
    </q-btn>
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
const updateTitle = inject("updateTitle");
updateTitle(t("Add POS Invoice"));
const { t } = useI18n();

const route = useRoute();
const router = useRouter();

const loading = ref(false);

// State management
const expanded = ref(true);
const expansionLabel = ref("");

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
    console.log(response);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
const taxAccounts = ref([]);
const customerUpdate = async (newValue) => {
  customer.value = await fetchCustomer(newValue.id);
  taxAccounts.value = customer.value.taxaccounts
    ? customer.value.taxaccounts.split(" ")
    : [];
  calculateTaxes();
};

// Accounts
const salesAccount = ref();
const salesAccounts = ref([]);
const paymentAccounts = ref([]);
const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    const accounts = response.data;
    salesAccounts.value = accounts.filter((account) => account.link === "AR");
    paymentAccounts.value = accounts.filter((account) =>
      account.link.split(":").includes("AR_paid")
    );
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

const invNumber = ref("");
const ordNumber = ref("");
const invDate = ref(getTodayDate());
const dueDate = ref(getTodayDate());
const poNumber = ref("");

// Line Items

const items = ref([]);
const fetchItems = async () => {
  try {
    const response = await api.get("/items");
    items.value = response.data.parts;
  } catch (error) {
    console.log(error);
  }
};
const lines = ref([
  {
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
            customer.value[`${taxAccount}_description`] || "Tax Name Not Found";
          const taxRate = customer.value[`${taxAccount}_rate`] || 0;

          let taxAmount = 0;
          let netAmount = parseFloat(line.extended);

          if (taxIncluded.value) {
            // If tax is included, reverse-calculate the tax
            taxAmount = netAmount * (taxRate / (1 + taxRate));
            netAmount -= taxAmount; // Adjust net amount after tax
          } else {
            // If tax is not included, calculate normally
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
    return acc + (parseFloat(line.extended) || 0); // Ensure extended is treated as a number
  }, 0);

  if (taxIncluded.value) {
    const totalTaxes = invoiceTaxes.value.reduce((acc, tax) => {
      return acc + (parseFloat(tax.amount) || 0); // Ensure tax.amount is treated as a number
    }, 0);

    totalValue -= totalTaxes; // Subtotal is the total value minus taxes if tax is included
  }

  return parseFloat(totalValue.toFixed(2)); // Ensure it returns a properly formatted float
});

const taxInclude = () => {
  calculateTaxes();
};
const total = computed(() => {
  const totalTaxes = invoiceTaxes.value.reduce((acc, tax) => {
    return acc + (parseFloat(tax.amount) || 0); // Ensure tax.amount is treated as a number
  }, 0);

  let totalValue = lines.value.reduce((acc, line) => {
    return acc + (parseFloat(line.extended) || 0); // Ensure extended is treated as a number
  }, 0);

  if (!taxIncluded.value) {
    totalValue += totalTaxes; // Add taxes if not included in line totals
  }

  return parseFloat(totalValue.toFixed(2)); // Ensure it returns a properly formatted float
});

// Explicit method to handle part number changes and update line details
const handleLineItemChange = (newValue, index) => {
  console.log("Line item changed:", newValue, index);

  if (newValue && newValue.partnumber) {
    // Update the corresponding line's properties based on the selected item
    const line = lines.value[index];
    line.description = newValue.partnumber.description || "";
    line.oh = newValue.partnumber.oh || 0;
    line.unit = newValue.partnumber.unit || "";
    line.price = newValue.partnumber.sellprice || 0;

    // Recalculate the extended price using the calculation function
    line.extended = calculateExtended(
      line.qty || 1,
      line.price,
      line.discount || 0
    );
  }

  // Recalculate taxes or perform any other required logic
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

// Function to add a new payment line
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
const postInvoice = async () => {
  // Validation
  if (!selectedCustomer.value) {
    Notify.create({
      message: t("Customer is required."),
      type: "negative",
      position: "center",
    });
    return;
  }

  if (!salesAccount.value) {
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

  // Create the invoice data object
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
    salesAccount: salesAccount.value,
    selectedCurrency: selectedCurrency.value,
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
    })),
    // needed to specify a pos transaction. should be updated to be last 3 digits of IP address
    till: "123",
  };

  // Add exchange rate if selected currency is not rn === 1 (Checking for default curency)
  if (selectedCurrency.value.rn !== 1) {
    invoiceData.exchangerate = exchangeRate.value;
  }

  // Add taxes if invoiceTaxes is not empty
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

    // Check if route.query.id exists
    const idParam = route.query.id ? `/${route.query.id}` : "";

    // Make the API request and append idParam if available
    const response = await api.post(`/ar/invoice${idParam}`, invoiceData);

    console.log(response.data);

    // Notify the user of success
    Notify.create({
      message: t("Transaction posted successfully"),
      type: "positive",
      position: "top-right",
    });
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
      updateTitle(t("Edit POS Invoice"));
      const response = await api.get(`/ar/invoice/${id}`);
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
    salesAccounts.value.length === 0 ||
    currencies.value.length === 0
  ) {
    await Promise.all([
      fetchCustomers(),
      fetchItems(),
      fetchAccounts(),
      fetchCurrencies(),
    ]);
  }

  // Set selectedCustomer based on invoice.customernumber
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

  // Fetch and set detailed customer data
  await customerUpdate(selectedCustomer.value);

  // Set salesAccount
  salesAccount.value = salesAccounts.value.find(
    (account) => account.accno === invoice.salesAccount.accno
  );

  if (!salesAccount.value) {
    Notify.create({
      message: `Sales account ${invoice.salesAccount.accno} not found.`,
      type: "negative",
      position: "center",
    });
    return;
  }

  // Set other header information
  shippingPoint.value = invoice.shippingPoint;
  shipVia.value = invoice.shipVia;
  wayBill.value = invoice.wayBill;
  description.value = invoice.description;
  notes.value = invoice.notes;
  intnotes.value = invoice.intnotes;
  invNumber.value = invoice.invNumber;
  ordNumber.value = invoice.ordNumber;
  invDate.value = invoice.invDate;
  dueDate.value = invoice.dueDate;
  poNumber.value = invoice.poNumber;

  // Set currency and exchange rate if provided
  if (invoice.selectedCurrency) {
    selectedCurrency.value = currencies.value.find(
      (curr) => curr.curr === invoice.selectedCurrency.curr
    );
  }
  exchangeRate.value = invoice.exchangerate || 1;

  // Set taxIncluded
  taxIncluded.value = !!invoice.taxincluded;

  // Set lines
  lines.value = invoice.lines.map((line) => {
    return {
      partnumber: line,
      description: line.description,
      qty: line.qty,
      oh: line.oh,
      unit: line.unit,
      price: line.price,
      discount: line.discount,
      extended:
        line.qty * line.price - (line.qty * line.price * line.discount) / 100,
    };
  });

  // Recalculate taxes
  calculateTaxes();

  // Set payments
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
    };
  });
  if (payments.value.length < 1) {
    addPayment();
  }
};

const calculateExtended = (qty, price, discount) => {
  const baseValue = qty * price;
  const discountedValue = baseValue - (baseValue * discount) / 100;
  return discountedValue.toFixed(2);
};

watch(
  lines,
  (newLines) => {
    newLines.forEach((line, index) => {
      // Recalculate the extended price for each line
      line.extended = calculateExtended(
        line.qty || 1,
        line.price,
        line.discount || 0
      );
    });

    // After updating the extended prices, recalculate the taxes
    calculateTaxes();
  },
  { deep: true }
);

// Fetch data on mounted
onMounted(() => {
  fetchAccounts();
  fetchCurrencies();
  fetchItems();
  fetchCustomers();
  fetchInvoice(route.query.id);
});
</script>
