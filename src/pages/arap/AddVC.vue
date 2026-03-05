<template>
  <q-page class="q-pa-md lightbg" :class="haveProps ? 'q-py-sm' : 'q-py-sm'">
    <q-form
      @submit.prevent="submitForm"
      ref="formRef"
      class="q-px-md add-vc-form"
      :class="[
        haveProps ? 'q-py-sm add-vc-form--full-width' : 'q-py-sm container',
      ]"
    >
      <div class="">
        <!-- Type Selection -->
        <div class="row q-gutter-md q-mb-sm items-center">
          <q-radio v-model="form.typeofcontact" val="company">
            <template #default>
              <q-icon name="business" size="sm" class="q-mr-xs" />
              <span>{{ t("Company") }}</span>
            </template>
          </q-radio>
          <q-radio v-model="form.typeofcontact" val="person">
            <template #default>
              <q-icon name="person" size="sm" class="q-mr-xs" />
              <span>{{ t("Person") }}</span>
            </template>
          </q-radio>
        </div>

        <!-- Tab Navigation -->
        <q-tabs
          v-model="activeTab"
          dense
          class="add-vc-tabs q-mb-none q-pa-md"
          active-color="white"
          inactive-color="grey-7"
          indicator-color="primary"
          align="left"
        >
          <q-tab name="customer" :label="vcType" />
          <q-tab name="contact" :label="t('Contact Person')" />
          <q-tab name="vat" :label="t('VAT')" />
          <q-tab
            v-if="componentType === 'customer'"
            name="communication"
            :label="t('Communication')"
          />
          <q-tab name="accounting" :label="t('Accounting')" />
          <q-tab name="bank" :label="t('Bank Accounts')" />
        </q-tabs>

        <div class="q-px-md">
          <q-separator class="q-my-md" />
        </div>

        <q-tab-panels v-model="activeTab" animated class="q-pa-md">
          <!-- Customer tab -->
          <q-tab-panel name="customer" class="q-pa-none">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <text-input
                  v-model="form.name"
                  name="name"
                  :label="t(`${vcType} Name`)"
                  outlined
                  dense
                  required
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-4">
                <text-input
                  v-model="form.vcnumber"
                  name="vcnumber"
                  :label="t(`${vcType} Number`)"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
            </div>

            <div
              class="text-uppercase text-caption text-weight-bold text-grey-7 q-mt-md q-mb-sm"
            >
              {{ t("Address") }}
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-8">
                <text-input
                  v-model="form.address1"
                  name="address1"
                  :label="t('Street Name')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-4">
                <text-input
                  v-model="form.street"
                  name="street"
                  :label="t('Street Number')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12">
                <text-input
                  v-model="form.address2"
                  name="address2"
                  :label="t('Address 2')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12">
                <text-input
                  v-model="form.post_office"
                  name="post_office"
                  :label="t('Postal Office')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.zipcode"
                  name="zipcode"
                  :label="t('Zip/Postal Code')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.city"
                  name="city"
                  :label="t('City')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.state"
                  name="state"
                  :label="t('State/Province')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <country-input
                  v-model="form.country"
                  name="country"
                  :label="t('Country')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
            </div>

            <div
              class="text-uppercase text-caption text-weight-bold text-grey-7 q-mt-md q-mb-sm"
            >
              {{ t("Contact") }}
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.phone"
                  name="phone"
                  :label="t('Phone')"
                  outlined
                  dense
                  type="tel"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.mobile"
                  name="mobile"
                  :label="t('Mobile')"
                  outlined
                  dense
                  type="tel"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.email"
                  name="email"
                  :label="t('E-mail')"
                  outlined
                  dense
                  type="email"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.cc"
                  name="cc"
                  :label="t('Cc')"
                  outlined
                  dense
                  type="email"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12">
                <text-input
                  v-model="form.bcc"
                  name="bcc"
                  :label="t('Bcc')"
                  outlined
                  dense
                  type="email"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.fax"
                  name="fax"
                  :label="t('Fax')"
                  outlined
                  dense
                  type="tel"
                  class="q-mb-sm"
                />
              </div>
            </div>

            <div
              class="text-uppercase text-caption text-weight-bold text-grey-7 q-mt-md q-mb-sm"
            >
              {{ t("Additional") }}
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.taxnumber"
                  name="taxnumber"
                  :label="t('Tax Number / SSN')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.sic_code"
                  name="sic_code"
                  :label="t('SIC')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12">
                <text-input
                  v-model="form.notes"
                  name="notes"
                  :label="t('Notes')"
                  type="textarea"
                  outlined
                  rows="3"
                  class="q-mb-sm"
                />
              </div>
            </div>
            <q-separator class="q-mt-md" />
          </q-tab-panel>

          <!-- Contact Person tab -->
          <q-tab-panel name="contact" class="q-pa-none">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6 q-col-gutter-md">
                <text-input
                  v-model="form.salutation"
                  name="salutation"
                  :label="t('Salutation')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
                <text-input
                  v-model="form.firstname"
                  name="firstname"
                  :label="t('First Name')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
                <text-input
                  v-model="form.occupation"
                  name="occupation"
                  :label="t('Occupation')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6 q-col-gutter-md">
                <text-input
                  v-model="form.contacttitle"
                  name="contacttitle"
                  :label="t('Title')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
                <text-input
                  v-model="form.lastname"
                  name="lastname"
                  :label="t('Last Name')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
                <div class="q-mb-sm">
                  <q-radio
                    v-model="form.gender"
                    name="gender"
                    val="M"
                    :label="t('Male')"
                  />
                  <q-radio
                    v-model="form.gender"
                    name="gender"
                    val="F"
                    :label="t('Female')"
                  />
                </div>
              </div>
            </div>
          </q-tab-panel>

          <!-- VAT tab -->
          <q-tab-panel name="vat" class="q-pa-none">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">
              {{ t("VAT Rates") }}
            </div>
            <div class="q-col-gutter-sm">
              <div
                v-for="tax in taxAccounts"
                :key="tax.id"
                class="col-12 col-sm-6 col-md-4"
              >
                <q-checkbox
                  v-model="form[`tax_${tax.id}`]"
                  :name="`tax_${tax.id}`"
                  :label="tax.description"
                  :false-value="0"
                  :true-value="1"
                  dense
                />
              </div>
            </div>
            <q-separator class="q-mt-md" />
            <q-checkbox
              v-model="form.taxincluded"
              name="taxincluded"
              :label="t('Tax Included')"
              class="q-mt-md"
              dense
            />
            <q-separator class="q-mt-md" />
          </q-tab-panel>

          <!-- Communication tab -->
          <q-tab-panel
            v-if="componentType === 'customer'"
            name="communication"
            class="q-pa-none"
          >
            <div class="row q-col-gutter-md">
              <div class="col-12" v-if="languages.length > 0">
                <s-select
                  v-model="form.language_code"
                  name="language_code"
                  :options="languages"
                  option-value="code"
                  option-label="description"
                  emit-value
                  map-options
                  :label="t('Language')"
                  outlined
                  dense
                  clearable
                  class="q-mb-sm"
                />
              </div>
              <div v-if="componentType === 'customer'" class="col-12">
                <MessageVariableInput
                  type="invoice_send"
                  :message-rows="customerMessageRows"
                  :active-message-language="activeMessageLanguage"
                  :label="t('Message')"
                  @update:message-rows="onCustomerMessageRowsUpdate"
                  @update:active-message-language="
                    activeMessageLanguage = $event
                  "
                />
              </div>
            </div>
            <q-separator class="q-mt-md" />
          </q-tab-panel>

          <!-- Accounting tab -->
          <q-tab-panel name="accounting" class="q-pa-none">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="text-caption text-weight-medium q-mb-xs">
                  {{ arap }} {{ t("Account") }}
                </div>
                <q-select
                  v-model="form.arap_accno"
                  name="arap_accno"
                  :options="recordAccounts"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <div class="text-caption text-weight-medium q-mb-xs">
                  {{ t("Payment Account") }}
                </div>
                <q-select
                  v-model="form.payment_accno"
                  name="payment_accno"
                  :options="paymentAccounts"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <fn-input
                  v-model="form.creditlimit"
                  name="creditlimit"
                  :label="t('Credit Limit')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.threshold"
                  name="threshold"
                  :label="t('Threshold')"
                  outlined
                  dense
                  type="number"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.terms"
                  name="terms"
                  :label="t('Terms (days)')"
                  outlined
                  dense
                  type="number"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="form.curr"
                  name="curr"
                  :options="currencies"
                  :label="t('Currency')"
                  option-value="curr"
                  option-label="curr"
                  emit-value
                  map-options
                  outlined
                  dense
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12">
                <text-input
                  v-model="form.discount"
                  name="discount"
                  :label="t('Discount (%)')"
                  outlined
                  dense
                  type="number"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.startdate"
                  name="startdate"
                  :label="t('Start Date')"
                  outlined
                  dense
                  type="date"
                  class="q-mb-sm"
                />
              </div>
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.enddate"
                  name="enddate"
                  :label="t('End Date')"
                  outlined
                  dense
                  type="date"
                  class="q-mb-sm"
                />
              </div>
            </div>
            <q-separator class="q-mt-md" />
          </q-tab-panel>

          <!-- Bank Accounts tab -->
          <q-tab-panel name="bank" class="q-pa-none">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2 text-weight-medium">
                {{ t("Bank Accounts") }}
              </div>
              <q-btn
                flat
                round
                dense
                icon="add"
                size="sm"
                color="primary"
                :disable="!isEditMode"
                @click="openAddBankDialog"
              />
            </div>

            <q-list v-if="bankAccounts.length > 0" bordered separator>
              <q-item
                v-for="bank in bankAccounts"
                :key="bank.id"
                clickable
                class="bank-item"
                @click="editBank(bank)"
              >
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ bank.name || "Unnamed Bank" }}
                  </q-item-label>
                  <q-item-label v-if="bank.qriban">
                    {{ bank.qriban }}
                    <q-badge color="primary" class="q-ml-xs" label="QRIBAN" />
                  </q-item-label>
                  <q-item-label v-else>
                    {{ bank.iban || "No IBAN" }}
                  </q-item-label>
                  <div v-if="bank.is_primary">
                    <q-item-label caption>Default</q-item-label>
                  </div>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    color="grey-7"
                    size="sm"
                    @click.stop="editBank(bank)"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-py-xl text-grey-6">
              <q-icon name="account_balance" size="3rem" class="q-mb-sm" />
              <div class="text-body2">
                {{ t("No bank accounts added yet.") }}
              </div>
              <q-btn
                flat
                :label="t('Add Bank Account')"
                icon="add"
                color="primary"
                class="q-mt-sm"
                :disable="!isEditMode"
                @click="openAddBankDialog"
              />
            </div>
          </q-tab-panel>
        </q-tab-panels>

        <!-- Action Buttons -->

        <div class="row q-px-md">
          <s-button type="save" @click="submitForm()" :loading="loading" />
        </div>
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </q-form>

    <!-- Bank Account Form Dialog -->
    <BankAccountForm
      v-model="showBankFormDialog"
      :editing-bank="editingBank"
      :trans-id="componentId"
      :vc-type="componentType"
      :require-existing-record="isEditMode"
      @saved="handleBankAccountSaved"
      @close="handleBankFormClose"
    />
  </q-page>
</template>
<script setup>
import { ref, onMounted, watch, computed, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";
import BankAccountForm from "src/components/BankAccountForm.vue";
import MessageVariableInput from "src/components/MessageVariableInput.vue";

// Define props so the component can work as an embedded component
const props = defineProps({
  id: { type: [String, Number], default: null },
  type: { type: String, default: null },
});

// Define emits for the event that will be raised after save
const emit = defineEmits(["saved"]);

// Computed property that returns true if props were passed in
const haveProps = computed(() => props.id !== null || props.type !== null);

const updateTitle = inject("updateTitle");
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// Create computed values that prefer props over route params
const componentId = computed(() => {
  return props.id ?? route.params.id ?? route.query.id;
});
const componentType = computed(() => {
  return props.type ?? route.params.type;
});

// Computed property for edit mode based on componentId
const isEditMode = computed(() => !!componentId.value);

// Compute VC type based on the componentType value
const vcType = computed(() =>
  componentType.value === "customer" ? "Customer" : "Vendor",
);

// Active tab for tabular navigation
const activeTab = ref("customer");

// Bank account management
const showBankFormDialog = ref(false);
const bankAccounts = ref([]);
const editingBank = ref(null);

// Form state with all fields matching original HTML form
const form = ref({
  id: "",
  typeofcontact: "company",
  vcnumber: "",
  name: "",
  street: "",
  address1: "",
  address2: "",
  post_office: "",
  city: "",
  state: "",
  zipcode: "",
  country: "",
  salutation: "",
  firstname: "",
  lastname: "",
  contacttitle: "",
  occupation: "",
  gender: "M",
  phone: "",
  fax: "",
  mobile: "",
  email: "",
  cc: "",
  bcc: "",
  arap_accno: "",
  payment_accno: "",
  prepayment_accno: "",
  creditlimit: 0,
  threshold: "",
  terms: "",
  curr: "",
  startdate: new Date().toISOString().split("T")[0],
  enddate: "",
  discount: "",
  taxnumber: "",
  sic_code: "",
  language_code: "",
  notes: "",
  taxincluded: false,
  message: "",
  // Hidden fields
  discount_accno: "",
  cashdiscount: "",
  discountterms: "",
  referencecode_1: "",
  referencetmpfile_1: "",
  referencearchive_id_1: "",
  referencefilename_1: "",
  referencefolder_1: "",
  addressid: "",
  contactid: "",
});

// References and state
const loading = ref(false);
const formRef = ref(null);
const accounts = ref([]);
const recordAccounts = ref([]);
const defaultRecordAccount = ref(null);
const paymentAccounts = ref([]);
const defaultPaymentAccount = ref(null);
const taxAccounts = ref([]);
const languages = ref([]);
const arap = ref("");

// Message (customer only): single template stored in form.message, shown as one row
const activeMessageLanguage = ref("");
const customerMessageRows = computed(() => {
  const lang = form.value.language_code || languages.value[0]?.code || "en";
  const desc = languages.value.find((l) => l.code === lang)?.description ?? "";
  return [
    {
      language_code: lang,
      description: desc,
      content: form.value.message ?? "",
    },
  ];
});
function onCustomerMessageRowsUpdate(rows) {
  if (rows && rows.length > 0) {
    form.value.message = rows[0].content ?? "";
  }
}

// Helper: Format account options for q-select
const formatAccountOption = (account) => ({
  label: `${account.accno}--${account.description}`,
  value: `${account.accno}--${account.description}`,
});

// Unified function to update VC-related values
const updateVCSettings = async () => {
  const isCustomer = componentType.value === "customer";

  if (!haveProps.value) {
    updateTitle(
      isEditMode.value ? `Edit ${vcType.value}` : `Add ${vcType.value}`,
    );
  }

  // Set AR/AP label
  arap.value = isCustomer ? t("AR") : t("AP");

  if (accounts.value.length > 0) {
    const linkType = isCustomer ? "AR" : "AP";
    const taxLink = isCustomer ? "AR_tax" : "AP_tax";
    const paymentLink = isCustomer ? "AR_paid" : "AP_paid";

    // Filter and format accounts for dropdowns
    const filteredRecordAccounts = accounts.value.filter(
      (account) => account.link === linkType,
    );
    recordAccounts.value = filteredRecordAccounts.map(formatAccountOption);

    const defaultRecord = defaultRecordAccount.value
      ? filteredRecordAccounts.find(
          (acc) => String(acc.id) === String(defaultRecordAccount.value),
        )
      : null;
    form.value.arap_accno = defaultRecord
      ? formatAccountOption(defaultRecord)
      : recordAccounts.value[0];

    const filteredPaymentAccounts = accounts.value.filter((account) =>
      account.link.split(":").includes(paymentLink),
    );
    paymentAccounts.value = filteredPaymentAccounts.map(formatAccountOption);

    const defaultPayment = defaultPaymentAccount.value
      ? filteredPaymentAccounts.find(
          (acc) => String(acc.id) === String(defaultPaymentAccount.value),
        )
      : null;
    form.value.payment_accno = defaultPayment
      ? formatAccountOption(defaultPayment)
      : paymentAccounts.value[0];

    // Initialize tax checkboxes in form
    taxAccounts.value.forEach((tax) => {
      form.value[`tax_${tax.ac}`] = false;
    });
  }
};
const fetchVc = async (id) => {
  try {
    await fetchLinks();
    const response = await api.get(`/arap/${componentType.value}/${id}`);
    const data = response.data;

    // Handle taxaccounts (space-separated string)
    const taxAccountsString = data.taxaccounts; // e.g., "2310 2320 2330"
    const taxIds = taxAccountsString ? taxAccountsString.split(" ") : [];
    taxIds.forEach((taxId) => {
      // Set checkbox to true if data[`tax_${taxId}`] equals "1"
      form.value[`tax_${taxId}`] = data[`tax_${taxId}`] === "1" ? 1 : 0;
    });
    console.log(form.value);
    // Handle all_contact array
    if (data.all_contact && data.all_contact.length > 0) {
      const contact = data.all_contact[0]; // Take the first contact
      form.value.salutation = contact.salutation || "";
      form.value.firstname = contact.firstname || "";
      form.value.lastname = contact.lastname || "";
      form.value.contacttitle = contact.contacttitle || "";
      form.value.occupation = contact.occupation || "";
      form.value.gender = contact.gender || "M";
      form.value.contactid = contact.id || "";
    }

    // Other fields mapping
    form.value.vcnumber =
      vcType.value === "Vendor" ? data.vendornumber : data.customernumber;
    form.value.id = data.id;
    form.value.taxincluded = data.taxincluded === 1;
    form.value.addressid = data.addressid;

    // Map remaining fields (excluding the ones already handled)
    const excludedFields = ["taxaccounts", "all_contact", "taxincluded"];
    Object.keys(form.value).forEach((key) => {
      if (data[key] !== undefined && !excludedFields.includes(key)) {
        form.value[key] = data[key];
      }
    });
    await updateVCSettings();
  } catch (error) {
    console.error("Failed to fetch vc:", error);
    Notify.create({
      message: t("Failed to load vc data"),
      type: "negative",
      position: "center",
    });
  }
};

// Bank account management functions
const fetchBankAccounts = async () => {
  if (!isEditMode.value || !componentId.value) return;

  try {
    const response = await api.get(`/bank/${componentType.value}`, {
      params: { trans_id: componentId.value },
    });
    bankAccounts.value = response.data;
  } catch (error) {
    console.error("Failed to fetch bank accounts:", error);
  }
};

const openAddBankDialog = () => {
  editingBank.value = null;
  showBankFormDialog.value = true;
};

const editBank = (bank) => {
  console.log("Editing bank:", bank);
  editingBank.value = bank;
  showBankFormDialog.value = true;
};

const handleBankFormClose = () => {
  editingBank.value = null;
};

const handleBankAccountSaved = async () => {
  await fetchBankAccounts();
};

// Form submission handler
const submitForm = async () => {
  try {
    if (!formRef.value.validate()) {
      Notify.create({
        message: t("Please correct the errors in the form"),
        type: "negative",
        position: "center",
      });
      return;
    }
    if (!form.value.name) {
      Notify.create({
        message: t("Name is required"),
        type: "negative",
        position: "center",
      });
      return;
    }

    loading.value = true;
    // Create a payload based on current form values
    const payload = { ...form.value };

    // Convert tax checkbox values to 1 or 0
    const taxKeys = Object.keys(payload).filter((key) =>
      key.startsWith("tax_"),
    );
    taxKeys.forEach((key) => {
      payload[key] = form.value[key] ? 1 : 0;
    });

    // Rebuild the taxaccounts string using only tax IDs that are true
    payload.taxaccounts = taxKeys
      .filter((key) => payload[key] === 1)
      .map((key) => key.slice(4))
      .join(" ");

    // Convert taxincluded to numeric value
    payload.taxincluded = form.value.taxincluded ? 1 : 0;

    // Convert complex fields (assuming these have a .label property)
    payload.arap_accno =
      form.value.arap_accno && form.value.arap_accno.label
        ? form.value.arap_accno.label
        : form.value.arap_accno;

    payload.payment_accno =
      form.value.payment_accno && form.value.payment_accno.label
        ? form.value.payment_accno.label
        : form.value.payment_accno;

    const response = await api.post(`/arap/${componentType.value}`, payload);
    Notify.create({
      message: t(`${vcType.value} updated successfully`),
      type: "positive",
      position: "top-right",
    });
    // Refresh data with the returned id
    await fetchVc(response.data.id);
    await fetchBankAccounts();
    emit("saved", { id: response.data.id });
  } catch (error) {
    console.error("Form submission error:", error);
    Notify.create({
      message: t("An error occurred while saving"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

watch(
  () => route.params.type,
  () => updateVCSettings(),
);

// Keep message tab in sync with VC language (customer only)
watch(
  [() => form.value.language_code, languages],
  () => {
    if (componentType.value === "customer") {
      activeMessageLanguage.value =
        form.value.language_code || languages.value[0]?.code || "en";
    }
  },
  { immediate: true },
);

const currencies = ref();
const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/${componentType.value}`);
    accounts.value = response.data.accounts.all;
    defaultRecordAccount.value = response.data.record || null;
    defaultPaymentAccount.value = response.data.payment || null;
    currencies.value = response.data.currencies;

    // Determine AR or AP based on componentType
    const ARAP = componentType.value === "customer" ? "AR_tax" : "AP_tax";

    // Filter out tax accounts that don't include the correct ARAP link
    const filteredTaxAccounts = response.data.tax_accounts.filter((tax) => {
      const links = tax.link?.split(":") || [];
      return links.includes(ARAP);
    });

    // Remove duplicates based on chart_id
    const uniqueTaxAccounts = filteredTaxAccounts.reduce((acc, current) => {
      const exists = acc.find((item) => item.chart_id === current.chart_id);
      if (!exists) acc.push(current);
      return acc;
    }, []);

    // Set taxAccounts and initialize form fields
    taxAccounts.value = uniqueTaxAccounts.map((tax) => ({
      id: tax.accno,
      description: `${tax.description}`,
    }));

    taxAccounts.value.forEach((tax) => {
      form.value[`tax_${tax.id}`] = 0;
    });
    form.value.terms = response.data.term_days ?? form.value.terms;

    // Languages for dropdown (optional; hide dropdown when empty or missing)
    const raw = response.data.languages;
    languages.value = Array.isArray(raw) && raw.length > 0 ? raw : [];
  } catch (error) {
    console.error(error);
  }
};

// Initialize component
onMounted(async () => {
  await fetchLinks();
  await updateVCSettings();
  // Only attempt to fetch VC data if there is a valid id
  if (componentId.value) {
    await fetchVc(componentId.value);
    await fetchBankAccounts();
  }
});
</script>

<style scoped>
.add-vc-form {
  width: 80%;
}

.add-vc-form--full-width {
  width: 100%;
}

/* Tab styling: active tab with filled background like screenshot */
.add-vc-tabs :deep(.q-tab) {
  border-radius: 4px;
  margin-right: 4px;
  text-transform: none;
}

.add-vc-tabs :deep(.q-tab--active) {
  background: var(--q-primary);
  color: white;
}

.add-vc-tabs :deep(.q-tab__indicator) {
  display: none;
}

.bank-item {
  transition: all 0.2s ease;
}

.bank-item:hover {
  background-color: rgba(25, 118, 210, 0.04);
}
</style>
