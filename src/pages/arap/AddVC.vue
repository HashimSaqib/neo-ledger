<template>
  <q-page class="q-pa-md lightbg" :class="haveProps ? 'q-py-sm' : 'q-py-sm'">
    <q-form
      @submit.prevent="submitForm"
      ref="formRef"
      class="q-px-md container"
      :class="haveProps ? 'q-py-sm' : 'q-py-sm'"
    >
      <div class="">
        <!-- Type Selection -->
        <div class="row q-mb-sm">
          <q-radio v-model="form.typeofcontact" val="company" label="Company" />
          <q-radio v-model="form.typeofcontact" val="person" label="Person" />
        </div>

        <!-- Section Toggles -->
        <div class="row q-mb-md q-gutter-sm">
          <q-checkbox
            v-model="showAdditionalInfo"
            label="Additional Information"
            dense
          />
          <q-checkbox
            v-model="showContactPerson"
            label="Contact Person"
            dense
          />
          <q-checkbox
            v-model="showBankAccounts"
            label="Bank Accounts"
            dense
            :disable="!isEditMode"
          />
        </div>

        <div class="row full-width">
          <!-- First Column - Mandatory Fields -->
          <div class="col-12 col-md-3 container-bg q-pa-md q-pr-sm">
            <text-input
              v-model="form.vcnumber"
              name="vcnumber"
              :label="t(`${vcType} Number`)"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.name"
              name="name"
              :label="t(`${vcType}`)"
              outlined
              dense
              required
              class="q-mb-sm"
            />
            <text-input
              v-model="form.street"
              name="street"
              :label="t('Street Number')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.address1"
              name="address1"
              :label="t('Street Name')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.address2"
              name="address2"
              :label="t('Address 2')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.post_office"
              name="post_office"
              :label="t('Postal Office')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.city"
              name="city"
              :label="t('City')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.zipcode"
              name="zipcode"
              :label="t('Zip/Postal Code')"
              outlined
              dense
              class="q-mb-sm"
            />
            <country-input
              v-model="form.country"
              name="country"
              :label="t('Country')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.email"
              name="email"
              :label="t('E-mail')"
              outlined
              dense
              type="email"
              class="q-mb-sm"
            />
            <text-input
              v-model="form.cc"
              name="cc"
              :label="t('Cc')"
              outlined
              dense
              type="email"
              class="q-mb-sm"
            />
            <text-input
              v-model="form.bcc"
              name="bcc"
              :label="t('Bcc')"
              outlined
              dense
              type="email"
              class="q-mb-sm"
            />

            <!-- Tax Section -->
            <div class="q-mb-md row">
              <div v-for="tax in taxAccounts" :key="tax.id">
                <q-checkbox
                  v-model="form[`tax_${tax.id}`]"
                  :name="`tax_${tax.id}`"
                  :label="tax.description"
                  :false-value="0"
                  :true-value="1"
                />
              </div>
              <q-checkbox
                v-model="form.taxincluded"
                name="taxincluded"
                :label="t('Tax Included')"
              />
            </div>
          </div>

          <!-- Second Column - Additional Information (when enabled) -->
          <div
            v-show="showAdditionalInfo"
            class="col-12 col-md-3 container-bg q-pa-md q-px-sm"
          >
            <text-input
              v-model="form.state"
              name="state"
              :label="t('State/Province')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.notes"
              name="notes"
              :label="t('Notes')"
              type="textarea"
              outlined
              rows="3"
              class="q-mb-sm"
            />
            <text-input
              v-model="form.phone"
              name="phone"
              :label="t('Phone')"
              outlined
              dense
              type="tel"
              class="q-mb-sm"
            />
            <text-input
              v-model="form.fax"
              name="fax"
              :label="t('Fax')"
              outlined
              dense
              type="tel"
              class="q-mb-sm"
            />
            <text-input
              v-model="form.mobile"
              name="mobile"
              :label="t('Mobile')"
              outlined
              dense
              type="tel"
              class="q-mb-sm"
            />

            <!-- Account Information -->
            <div class="row items-center q-mb-sm">
              <div class="col-4">{{ arap }}</div>
              <q-select
                v-model="form.arap_accno"
                name="arap_accno"
                :options="recordAccounts"
                outlined
                dense
                class="col-8"
              />
            </div>

            <div class="row items-center q-mb-sm">
              <div class="col-4">{{ t("Payment") }}</div>
              <q-select
                v-model="form.payment_accno"
                name="payment_accno"
                :options="paymentAccounts"
                outlined
                dense
                class="col-8"
              />
            </div>

            <!-- Additional Fields -->
            <fn-input
              v-model="form.creditlimit"
              name="creditlimit"
              :label="t('Credit Limit')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.threshold"
              name="threshold"
              :label="t('Threshold')"
              outlined
              dense
              type="number"
              class="q-mb-sm"
            />
            <text-input
              v-model="form.terms"
              name="terms"
              :label="t('Terms (days)')"
              outlined
              dense
              type="number"
              class="q-mb-sm"
            />

            <!-- Currency and Dates -->
            <q-select
              v-model="form.curr"
              name="curr"
              :options="currencies"
              :label="t('Currency')"
              option-value="curr"
              option-label="curr"
              emit-value
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.startdate"
              name="startdate"
              :label="t('Start Date')"
              outlined
              dense
              type="date"
              class="q-mb-sm"
            />
            <text-input
              v-model="form.enddate"
              name="enddate"
              :label="t('End Date')"
              outlined
              dense
              type="date"
              class="q-mb-sm"
            />
            <text-input
              v-model="form.discount"
              name="discount"
              :label="t('Discount (%)')"
              outlined
              dense
              type="number"
              class="q-mb-sm"
            />

            <!-- Tax Information -->
            <text-input
              v-model="form.taxnumber"
              name="taxnumber"
              :label="t('Tax Number / SSN')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.sic_code"
              name="sic_code"
              :label="t('SIC')"
              outlined
              dense
              class="q-mb-sm"
            />
          </div>

          <!-- Third Column - Contact Person (when enabled) -->
          <div
            v-show="showContactPerson"
            class="col-12 col-md-3 container-bg q-pa-md q-px-sm"
          >
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
              v-model="form.lastname"
              name="lastname"
              :label="t('Last Name')"
              outlined
              dense
              class="q-mb-sm"
            />
            <text-input
              v-model="form.contacttitle"
              name="contacttitle"
              :label="t('Title')"
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

            <div class="q-mb-sm">
              <q-radio
                v-model="form.gender"
                name="gender"
                val="M"
                label="Male"
              />
              <q-radio
                v-model="form.gender"
                name="gender"
                val="F"
                label="Female"
              />
            </div>
          </div>

          <!-- Fourth Column - Bank Accounts (when enabled) -->
          <div
            v-show="showBankAccounts"
            class="col-12 col-md-3 container-bg q-pa-md q-pl-sm"
          >
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2 text-weight-medium">Bank Accounts</div>
              <q-btn
                flat
                round
                dense
                icon="add"
                size="sm"
                color="primary"
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
              <div class="text-body2">No bank accounts</div>
            </div>
          </div>
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

    <!-- Action Buttons -->
    <div class="row justify-start q-mt-md">
      <q-btn
        :label="t('Save')"
        type="submit"
        color="primary"
        :loading="loading"
        :disable="loading"
        @click="submitForm()"
      />
    </div>
  </q-page>
</template>
<script setup>
import { ref, onMounted, watch, computed, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";
import BankAccountForm from "src/components/BankAccountForm.vue";

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
  componentType.value === "customer" ? t("Customer") : t("Vendor")
);

// Section visibility toggles
const showAdditionalInfo = ref(false);
const showContactPerson = ref(false);
const showBankAccounts = ref(false);

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
  notes: "",
  taxincluded: false,
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
const taxAccounts = ref([]);
const arap = ref("");

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
      isEditMode.value ? `Edit ${vcType.value}` : `Add ${vcType.value}`
    );
  }

  // Set AR/AP label
  arap.value = isCustomer ? t("AR") : t("AP");

  if (accounts.value.length > 0) {
    const linkType = isCustomer ? "AR" : "AP";
    const taxLink = isCustomer ? "AR_tax" : "AP_tax";
    const paymentLink = isCustomer ? "AR_paid" : "AP_paid";

    // Filter and format accounts for dropdowns
    recordAccounts.value = accounts.value
      .filter((account) => account.link === linkType)
      .map(formatAccountOption);

    console.log(defaultRecordAccount.value);

    if (!defaultRecordAccount.value) {
      defaultRecordAccount.value = recordAccounts.value[0].id;
    }
    if (defaultRecordAccount.value) {
      form.value.arap_accno = recordAccounts.value.find(
        (acc) => acc.value.id == defaultRecordAccount.value.id
      );
    }

    paymentAccounts.value = accounts.value
      .filter((account) => account.link.split(":").includes(paymentLink))
      .map(formatAccountOption);

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
      key.startsWith("tax_")
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
  () => updateVCSettings()
);

const currencies = ref();
const fetchLinks = async () => {
  try {
    const response = await api.get(
      `/create_links/${vcType.value.toLowerCase()}`
    );
    accounts.value = response.data.accounts.all;
    defaultRecordAccount.value = response.data.record || null;
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
.bank-item {
  transition: all 0.2s ease;
}

.bank-item:hover {
  background-color: rgba(25, 118, 210, 0.04);
}
</style>
