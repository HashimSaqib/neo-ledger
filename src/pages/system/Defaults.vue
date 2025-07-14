<template>
  <q-page class="q-px-md q-py-md">
    <q-form ref="formRef" class="q-pa-md mainbg" @submit.prevent="submitForm">
      <div class="row q-mb-sm q-gutter-md">
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.company"
            name="company"
            :label="t('Company Name')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.address"
            name="address"
            :label="t('Address')"
            type="textarea"
            outlined
            dense
            rows="2"
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.address1"
            name="address1"
            :label="t('Address Line 1')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.address2"
            name="address2"
            :label="t('Address Line 2')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.city"
            name="city"
            :label="t('City')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.state"
            name="state"
            :label="t('State/Province')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.zip"
            name="zip"
            :label="t('ZIP/Postal Code')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.country"
            name="country"
            :label="t('Country')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.businessnumber"
            name="businessnumber"
            :label="t('Business Number')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.referenceurl"
            name="referenceurl"
            :label="t('Reference Documents')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.precision"
            name="precision"
            :label="t('Precision')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.annualinterest"
            name="annualinterest"
            :label="t('Annual Interest')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.tel"
            name="tel"
            :label="t('Phone')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.fax"
            name="fax"
            :label="t('Fax')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.companyemail"
            name="companyemail"
            :label="t('E-mail')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.companywebsite"
            name="companywebsite"
            :label="t('Website')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.latepaymentfee"
            name="latepaymentfee"
            :label="t('Late Payment Fee')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.restockingcharge"
            name="restockingcharge"
            :label="t('Restocking Charge')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.weightunit"
            name="weightunit"
            :label="t('Weight Unit')"
            outlined
            dense
            class="lightbg input-box"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.method"
            name="method"
            :label="t('Reporting Method (Cash)')"
          />
          <q-checkbox
            v-model="form.checkinventory"
            name="checkinventory"
            :label="t('Check Inventory')"
          />
          <q-checkbox
            v-model="form.forcewarehouse"
            name="forcewarehouse"
            :label="t('Force Warehouse')"
          />
          <q-checkbox
            v-model="form.hideaccounts"
            name="hideaccounts"
            :label="t('Hide Closed Accounts')"
          />
          <q-checkbox
            v-model="form.linetax"
            name="linetax"
            :label="t('Line Tax')"
            :disable="locklinetax"
          />
          <q-checkbox
            v-model="form.namesbynumber"
            name="namesbynumber"
            :label="t('Sort Names by Number')"
          />
          <q-checkbox
            v-model="form.xelatex"
            name="xelatex"
            :label="t('XeLatex')"
          />
        </div>
      </div>
      <div class="row items-center">
        <p class="q-my-none q-py-none">Round</p>
        <q-option-group
          v-model="form.roundchange"
          name="roundchange"
          type="radio"
          inline
          :options="roundOptions"
          :label="t('Round')"
        />
      </div>
      <div class="row">
        <div>
          <q-option-group
            v-model="form.typeofcontact"
            name="typeofcontact"
            type="radio"
            inline
            :options="typeofcontactOptions"
            :label="t('Type of Contact')"
            class="col-12 col-md-5"
          />
        </div>
      </div>

      <!-- Heading: Default Accounts -->
      <div class="text-h6 q-mt-md">{{ t("Default Accounts") }}</div>

      <!-- Inventory & Income -->
      <div class="row q-mb-sm q-gutter-md">
        <s-select
          v-model="form.IC"
          :options="inventoryOptions"
          item-label="label"
          :label="t('Inventory')"
          outlined
          dense
          class="lightbg input-box col-12 col-md-5"
          search="label"
          account
        />
        <s-select
          v-model="form.IC_income"
          :options="incomeOptions"
          item-label="label"
          :label="t('Income')"
          outlined
          dense
          search="label"
          class="lightbg input-box col-12 col-md-5"
          account
        />
        <s-select
          v-model="form.IC_expense"
          :options="expenseOptions"
          item-label="label"
          :label="t('Expense')"
          outlined
          dense
          class="lightbg input-box col-12 col-md-5"
          search="label"
          account
        />
        <s-select
          v-model="form.fxgainloss"
          :options="fxgainlossOptions"
          item-label="label"
          :label="t('Foreign Exchange Gain/Loss')"
          outlined
          dense
          class="lightbg input-box col-12 col-md-5"
          search="label"
          account
        />
        <s-select
          v-model="form.cashovershort"
          :options="cashovershortOptions"
          item-label="label"
          :label="t('Cash Over/Short')"
          outlined
          dense
          class="lightbg input-box col-12 col-md-5"
          search="label"
          account
        />
        <q-input
          v-model="form.clearing"
          name="clearing"
          :label="t('Clearing Account')"
          outlined
          dense
          class="lightbg input-box col-12 col-md-5"
        />
        <q-input
          v-model="form.transition"
          name="transition"
          :label="t('Transition Account')"
          outlined
          dense
          class="lightbg input-box col-12 col-md-5"
        />
      </div>

      <!-- Heading: Last Numbers -->
      <div class="text-h6 q-mt-md">{{ t("Last Numbers") }}</div>
      <div class="maintext q-my-none">
        {{
          t(
            "Next numbers combine fixed patterns with variables and auto-incrementing digits. Use variables like <%date%> or <%yy%><%mm%> together with numbers (e.g., 0001) to create custom numbering sequences that increment automatically."
          )
        }}
      </div>
      <!-- Variable Chips for Defaults -->
      <div class="row q-my-xs q-gutter-sm">
        <template v-if="activeLastNumberField">
          <q-chip
            color="primary"
            v-for="item in filteredTokens"
            :key="item.token"
            clickable
            class="cursor-pointer"
            @click="insertToken(item.token)"
          >
            {{ item.token }}
            <q-tooltip>{{ item.tooltip }}</q-tooltip>
          </q-chip>
        </template>
      </div>

      <!-- GL Reference Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.glnumber"
            name="glnumber"
            :label="t('GL Reference Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('glnumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_glnumber"
            name="lock_glnumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- Sales Invoice/AR Transaction Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.sinumber"
            name="sinumber"
            :label="t('Sales Invoice/AR Transaction Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('sinumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_sinumber"
            name="lock_sinumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- Sales Order Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.sonumber"
            name="sonumber"
            :label="t('Sales Order Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('sonumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_sonumber"
            name="lock_sonumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- Vendor Invoice/AP Transaction Number -->
      <div class="row q-mb-sm">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.vinumber"
            name="vinumber"
            :label="t('Vendor Invoice/AP Transaction Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('vinumber')"
          />
        </div>
      </div>

      <!-- Batch Number -->
      <div class="row q-mb-sm">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.batchnumber"
            name="batchnumber"
            :label="t('Batch Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('batchnumber')"
          />
        </div>
      </div>

      <!-- Voucher Number -->
      <div class="row q-mb-sm">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.vouchernumber"
            name="vouchernumber"
            :label="t('Voucher Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('vouchernumber')"
          />
        </div>
      </div>

      <!-- Purchase Order Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.ponumber"
            name="ponumber"
            :label="t('Purchase Order Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('ponumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_ponumber"
            name="lock_ponumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- Sales Quotation Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.sqnumber"
            name="sqnumber"
            :label="t('Sales Quotation Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('sqnumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_sqnumber"
            name="lock_sqnumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- RFQ Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.rfqnumber"
            name="rfqnumber"
            :label="t('RFQ Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('rfqnumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_rfqnumber"
            name="lock_rfqnumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- Part Number -->
      <div class="row q-mb-sm">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.partnumber"
            name="partnumber"
            :label="t('Part Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('partnumber')"
          />
        </div>
      </div>

      <!-- Job/Project Number -->
      <div class="row q-mb-sm">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.projectnumber"
            name="projectnumber"
            :label="t('Job/Project Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('projectnumber')"
          />
        </div>
      </div>

      <!-- Employee Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.employeenumber"
            name="employeenumber"
            :label="t('Employee Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('employeenumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_employeenumber"
            name="lock_employeenumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- Customer Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.customernumber"
            name="customernumber"
            :label="t('Customer Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('customernumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_customernumber"
            name="lock_customernumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- Vendor Number + Lock -->
      <div class="row q-mb-sm items-center">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.vendornumber"
            name="vendornumber"
            :label="t('Vendor Number')"
            outlined
            dense
            class="lightbg input-box"
            @focus="setActiveLastNumberField('vendornumber')"
          />
        </div>
        <div class="col-auto">
          <q-checkbox
            v-model="form.lock_vendornumber"
            name="lock_vendornumber"
            :label="t('Lock')"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <div class="row q-mt-md">
        <div class="col-auto">
          <q-btn :label="t('Save')" type="submit" color="primary" />
        </div>
      </div>
    </q-form>
  </q-page>
</template>
<script setup>
import { ref, onMounted, inject, computed } from "vue";
import { Notify } from "quasar";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";

const updateTitle = inject("updateTitle");
updateTitle("Company Defaults");
const { t } = useI18n();

const formRef = ref(null);

const form = ref({
  company: "",
  address: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  tel: "",
  fax: "",
  companyemail: "",
  companywebsite: "",
  businessnumber: "",
  method: false,
  cdt: false,
  referenceurl: "",
  precision: "",
  annualinterest: "",
  latepaymentfee: "",
  restockingcharge: "",
  roundchange: "",
  weightunit: "",
  namesbynumber: false,
  xelatex: false,
  typeofcontact: "",
  checkinventory: false,
  forcewarehouse: false,
  hideaccounts: false,
  linetax: false,
  IC: null,
  IC_income: null,
  IC_expense: null,
  fxgainloss: null,
  cashovershort: null,
  clearing: "",
  transition: "",
  glnumber: "",
  lock_glnumber: false,
  sinumber: "",
  lock_sinumber: false,
  sonumber: "",
  lock_sonumber: false,
  vinumber: "",
  batchnumber: "",
  vouchernumber: "",
  ponumber: "",
  lock_ponumber: false,
  sqnumber: "",
  lock_sqnumber: false,
  rfqnumber: "",
  lock_rfqnumber: false,
  partnumber: "",
  projectnumber: "",
  employeenumber: "",
  lock_employeenumber: false,
  customernumber: "",
  lock_customernumber: false,
  vendornumber: "",
  lock_vendornumber: false,
});

// Options
const roundOptions = [
  { label: "0.01", value: "0.01" },
  { label: "0.05", value: "0.05" },
  { label: "0.1", value: "0.1" },
  { label: "0.2", value: "0.2" },
  { label: "0.5", value: "0.5" },
  { label: "1", value: "1" },
];

const typeofcontactOptions = [
  { label: "Company", value: "" },
  { label: "Person", value: "person" },
];

// s-select items (arrays of objects)
const inventoryOptions = ref([]);
const incomeOptions = ref([]);
const expenseOptions = ref([]);
const fxgainlossOptions = ref([]);
const cashovershortOptions = ref([]);

// Turn the original account into { ...acc, label: "accno--desc" }
// We keep the rest of the fields (like id, accno, description).
function parseAccountOptions(arr) {
  return arr.map((acc) => ({
    ...acc,
    label: `${acc.accno}--${acc.description}`,
  }));
}

function isChecked(val) {
  return val === "checked" || val === "1" || val === 1;
}

/**
 * After fetching the arrays, we must find the object that has the matching ID,
 * then assign that entire object to form.IC or form.IC_income, etc.
 */
function findAccountById(arr, id) {
  return arr.find((acc) => String(acc.id) === String(id)) || null;
}

const locklinetax = ref(false);

// New reactive variable to track which last number field is active
const activeLastNumberField = ref(null);

// Define token categories and their corresponding field applicability
const allTokens = [
  {
    token: "<%date%>",
    tooltip: t("Inserts the current date based on system date format."),
    categories: ["all"],
  },
  {
    token: "<%yy%>",
    tooltip: t("Inserts the two-digit year (or full year if using yyyy)."),
    categories: ["all"],
  },
  {
    token: "<%mm%>",
    tooltip: t("Inserts the month (two-digit)."),
    categories: ["all"],
  },
  {
    token: "<%dd%>",
    tooltip: t("Inserts the day (two-digit)."),
    categories: ["all"],
  },
  {
    token: "<%fdm%>",
    tooltip: t("Inserts the first day of the month."),
    categories: ["all"],
  },
  {
    token: "<%ldm%>",
    tooltip: t("Inserts the last day of the month."),
    categories: ["all"],
  },
  {
    token: "<%curr%>",
    tooltip: t("Inserts the current currency symbol/code."),
    categories: ["all"],
  },
  {
    token: "<%name%>",
    tooltip: t("Inserts the name from the corresponding field."),
    categories: ["customer", "vendor", "employee"],
  },
  {
    token: "<%business%>",
    tooltip: t("Inserts the business name."),
    categories: ["customer", "vendor", "transaction"],
  },
  {
    token: "<%description%>",
    tooltip: t("Inserts a description text."),
    categories: ["part", "transaction"],
  },
  {
    token: "<%item%>",
    tooltip: t("Inserts an item text."),
    categories: ["part"],
  },
  {
    token: "<%partsgroup%>",
    tooltip: t("Inserts a parts group text."),
    categories: ["part"],
  },
  {
    token: "<%phone%>",
    tooltip: t("Inserts the phone number (digits only)."),
    categories: ["customer", "vendor"],
  },
];

// Map each field to its relevant categories
const fieldCategoryMap = {
  glnumber: ["all", "transaction"],
  sinumber: ["all", "transaction", "customer"],
  sonumber: ["all", "transaction", "customer"],
  vinumber: ["all", "transaction", "vendor"],
  batchnumber: ["all", "transaction"],
  vouchernumber: ["all", "transaction"],
  ponumber: ["all", "transaction", "vendor"],
  sqnumber: ["all", "transaction", "customer"],
  rfqnumber: ["all", "transaction", "vendor"],
  partnumber: ["all", "part"],
  projectnumber: ["all", "project"],
  employeenumber: ["all", "employee"],
  customernumber: ["all", "customer"],
  vendornumber: ["all", "vendor"],
};

// Computed property to filter tokens based on active field
const filteredTokens = computed(() => {
  if (!activeLastNumberField.value) {
    return [];
  }

  const relevantCategories = fieldCategoryMap[activeLastNumberField.value] || [
    "all",
  ];

  return allTokens.filter(
    (token) =>
      token.categories.includes("all") ||
      token.categories.some((category) => relevantCategories.includes(category))
  );
});

function setActiveLastNumberField(fieldName) {
  activeLastNumberField.value = fieldName;
}

function insertToken(token) {
  if (activeLastNumberField.value) {
    form.value[activeLastNumberField.value] =
      form.value[activeLastNumberField.value] + token;
  } else {
    Notify.create({
      message: t(
        "Please select a Last Number field before inserting a variable."
      ),
      type: "warning",
      position: "center",
    });
  }
}

async function loadDefaults() {
  try {
    const { data } = await api.get("/system/companydefaults");

    // Basic fields
    form.value.company = data.company || "";
    form.value.address = data.address || "";
    form.value.address1 = data.address1 || "";
    form.value.address2 = data.address2 || "";
    form.value.city = data.city || "";
    form.value.state = data.state || "";
    form.value.zip = data.zip || "";
    form.value.country = data.country || "";
    form.value.tel = data.tel || "";
    form.value.fax = data.fax || "";
    form.value.companyemail = data.companyemail || "";
    form.value.companywebsite = data.companywebsite || "";
    form.value.businessnumber = data.businessnumber || "";
    form.value.method = isChecked(data.method);
    form.value.cdt = isChecked(data.cdt);
    form.value.referenceurl = data.referenceurl || "";
    form.value.precision = data.precision || "";
    form.value.annualinterest = data.annualinterest || "";
    form.value.latepaymentfee = data.latepaymentfee || "";
    form.value.restockingcharge = data.restockingcharge || "";
    form.value.roundchange = data.roundchange || "";
    form.value.weightunit = data.weightunit || "";
    form.value.namesbynumber = isChecked(data.namesbynumber);
    form.value.xelatex = isChecked(data.xelatex);
    form.value.typeofcontact = data.typeofcontact || "";
    form.value.checkinventory = isChecked(data.checkinventory);
    form.value.forcewarehouse = isChecked(data.forcewarehouse);
    form.value.hideaccounts = isChecked(data.hideaccounts);
    form.value.linetax = isChecked(data.linetax);
    form.value.clearing = data.clearing || "";
    form.value.transition = data.transition || "";
    // Last Numbers + locks
    form.value.glnumber = data.glnumber || "";
    form.value.lock_glnumber = isChecked(data.lock_glnumber);
    form.value.sinumber = data.sinumber || "";
    form.value.lock_sinumber = isChecked(data.lock_sinumber);
    form.value.sonumber = data.sonumber || "";
    form.value.lock_sonumber = isChecked(data.lock_sonumber);
    form.value.vinumber = data.vinumber || "";
    form.value.batchnumber = data.batchnumber || "";
    form.value.vouchernumber = data.vouchernumber || "";
    form.value.ponumber = data.ponumber || "";
    form.value.lock_ponumber = isChecked(data.lock_ponumber);
    form.value.sqnumber = data.sqnumber || "";
    form.value.lock_sqnumber = isChecked(data.lock_sqnumber);
    form.value.rfqnumber = data.rfqnumber || "";
    form.value.lock_rfqnumber = isChecked(data.lock_rfqnumber);
    form.value.partnumber = data.partnumber || "";
    form.value.projectnumber = data.projectnumber || "";
    form.value.employeenumber = data.employeenumber || "";
    form.value.lock_employeenumber = isChecked(data.lock_employeenumber);
    form.value.customernumber = data.customernumber || "";
    form.value.lock_customernumber = isChecked(data.lock_customernumber);
    form.value.vendornumber = data.vendornumber || "";
    form.value.lock_vendornumber = isChecked(data.lock_vendornumber);
    if (data.locklinetax) {
      locklinetax.value = true;
    }

    // Build the arrays for s-select
    if (data.IC) {
      inventoryOptions.value = parseAccountOptions(data.IC);
    }
    if (data.IC_income) {
      incomeOptions.value = parseAccountOptions(data.IC_income);
    }
    if (data.IC_expense) {
      expenseOptions.value = parseAccountOptions(data.IC_expense);
    }
    if (data.fxgainloss) {
      fxgainlossOptions.value = parseAccountOptions(data.fxgainloss);
    }
    if (data.cashovershort) {
      cashovershortOptions.value = parseAccountOptions(data.cashovershort);
    }

    if (inventoryOptions.value.length && data.inventory_accno_id) {
      form.value.IC = findAccountById(
        inventoryOptions.value,
        data.inventory_accno_id
      );
    }
    if (incomeOptions.value.length && data.income_accno_id) {
      form.value.IC_income = findAccountById(
        incomeOptions.value,
        data.income_accno_id
      );
    }
    if (expenseOptions.value.length && data.expense_accno_id) {
      form.value.IC_expense = findAccountById(
        expenseOptions.value,
        data.expense_accno_id
      );
    }
    if (fxgainlossOptions.value.length && data.fxgainloss_accno_id) {
      form.value.fxgainloss = findAccountById(
        fxgainlossOptions.value,
        data.fxgainloss_accno_id
      );
    }
    if (cashovershortOptions.value.length && data.cashovershort_accno_id) {
      form.value.cashovershort = findAccountById(
        cashovershortOptions.value,
        data.cashovershort_accno_id
      );
    }
  } catch (err) {
    console.error("Error loading company defaults", err);
  }
}

async function submitForm() {
  try {
    console.log(form.value);
    const payload = {
      ...form.value,
      IC: form.value.IC?.label ?? null,
      IC_income: form.value.IC_income?.label ?? null,
      IC_expense: form.value.IC_expense?.label ?? null,
      fxgainloss: form.value.fxgainloss?.label ?? null,
      cashovershort: form.value.cashovershort?.label ?? null,
    };
    console.log(payload);

    await api.post("/system/companydefaults", payload);

    Notify.create({
      message: t("Defaults saved successfully"),
      type: "positive",
      position: "top-right",
    });
  } catch (err) {
    console.error("Error saving defaults", err);
    Notify.create({
      message: t("Error saving defaults"),
      type: "negative",
      position: "center",
    });
  }
}

onMounted(() => {
  loadDefaults();
});
</script>

<style scoped>
.row.items-center > .col-auto {
  display: flex;
  align-items: center;
}
.q-pr-sm {
  padding-right: 8px;
}
.q-pl-sm {
  padding-left: 8px;
}
</style>
