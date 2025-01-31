<template>
  <q-page class="lightbg q-px-md q-py-md">
    <q-form
      @submit.prevent="submitForm"
      ref="formRef"
      class="q-px-md q-py-md mainbg"
    >
      <div class="mainbg q-mt-md">
        <!-- Type Selection -->
        <div class="row q-mb-sm">
          <q-radio v-model="form.typeofcontact" val="company" label="Company" />
          <q-radio v-model="form.typeofcontact" val="person" label="Person" />
        </div>

        <div class="row full-width justify-between">
          <!-- First Column -->
          <div class="col-12 col-md-4">
            <q-input
              v-model="form.vcnumber"
              name="vcnumber"
              :label="t(`${vcType} Number`)"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.name"
              name="name"
              :label="t(`${vcType}`)"
              outlined
              dense
              required
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.address1"
              name="address1"
              :label="t('Address')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.address2"
              name="address2"
              :label="t('Address 2')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.city"
              name="city"
              :label="t('City')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.state"
              name="state"
              :label="t('State/Province')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.zipcode"
              name="zipcode"
              :label="t('Zip/Postal Code')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.country"
              name="country"
              :label="t('Country')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.notes"
              name="notes"
              :label="t('Notes')"
              type="textarea"
              outlined
              rows="3"
              class="lightbg q-mb-sm"
            />
          </div>

          <!-- Second Column -->
          <div class="col-12 col-md-3">
            <q-input
              v-model="form.salutation"
              name="salutation"
              :label="t('Salutation')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.firstname"
              name="firstname"
              :label="t('First Name')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.lastname"
              name="lastname"
              :label="t('Last Name')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.contacttitle"
              name="contacttitle"
              :label="t('Title')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.occupation"
              name="occupation"
              :label="t('Occupation')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
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

            <q-input
              v-model="form.phone"
              name="phone"
              :label="t('Phone')"
              outlined
              dense
              type="tel"
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.fax"
              name="fax"
              :label="t('Fax')"
              outlined
              dense
              type="tel"
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.mobile"
              name="mobile"
              :label="t('Mobile')"
              outlined
              dense
              type="tel"
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.email"
              name="email"
              :label="t('E-mail')"
              outlined
              dense
              type="email"
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.cc"
              name="cc"
              :label="t('Cc')"
              outlined
              dense
              type="email"
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.bcc"
              name="bcc"
              :label="t('Bcc')"
              outlined
              dense
              type="email"
              class="lightbg q-mb-sm input-box"
            />
          </div>

          <div class="col-12 col-md-4">
            <!-- Tax Section -->
            <div class="q-mb-md row">
              <div v-for="tax in taxAccounts" :key="tax.id">
                <q-checkbox
                  v-model="form[`tax_${tax.id}`]"
                  :name="`tax_${tax.id}`"
                  :label="tax.description"
                />
              </div>
              <q-checkbox
                v-model="form.taxincluded"
                name="taxincluded"
                :label="t('Tax Included')"
              />
            </div>

            <!-- Account Information -->
            <div class="row q-mb-sm">
              <div class="col-4">{{ arap }}</div>
              <div class="col-8">
                <q-select
                  v-model="form.arap_accno"
                  name="arap_accno"
                  :options="recordAccounts"
                  outlined
                  dense
                  class="lightbg"
                />
              </div>
            </div>

            <div class="row q-mb-sm">
              <div class="col-4">{{ t("Payment") }}</div>
              <div class="col-8">
                <q-select
                  v-model="form.payment_accno"
                  name="payment_accno"
                  :options="paymentAccounts"
                  outlined
                  dense
                  class="lightbg"
                />
              </div>
            </div>

            <!-- Additional Fields -->
            <fn-input
              v-model="form.creditlimit"
              name="creditlimit"
              :label="t('Credit Limit')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.threshold"
              name="threshold"
              :label="t('Threshold')"
              outlined
              dense
              type="number"
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.terms"
              name="terms"
              :label="t('Terms (days)')"
              outlined
              dense
              type="number"
              class="lightbg q-mb-sm input-box"
            />

            <!-- Currency and Dates -->
            <q-select
              v-model="form.curr"
              name="curr"
              :options="['PKR', 'USD']"
              :label="t('Currency')"
              outlined
              dense
              class="lightbg q-mb-sm"
            />
            <q-input
              v-model="form.startdate"
              name="startdate"
              :label="t('Start Date')"
              outlined
              dense
              type="date"
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.enddate"
              name="enddate"
              :label="t('End Date')"
              outlined
              dense
              type="date"
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.discount"
              name="discount"
              :label="t('Discount (%)')"
              outlined
              dense
              type="number"
              class="lightbg q-mb-sm input-box"
            />

            <!-- Tax Information -->
            <q-input
              v-model="form.taxnumber"
              name="taxnumber"
              :label="t('Tax Number / SSN')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.sic_code"
              name="sic_code"
              :label="t('SIC')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
          </div>
        </div>

        <!-- Notes Section -->
        <div class="row q-mt-md"></div>

        <!-- Bank Information -->
        <div class="row q-mt-md q-gutter-x-lg">
          <div class="col-12 col-md-4">
            <q-input
              v-model="form.bankname"
              name="bankname"
              :label="t('Bank')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.bankaddress1"
              name="bankaddress1"
              :label="t('Bank Address')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.bankaddress2"
              name="bankaddress2"
              :label="t('Bank Address 2')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.bankcity"
              name="bankcity"
              :label="t('Bank City')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.bankstate"
              name="bankstate"
              :label="t('Bank State/Province')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.bankzipcode"
              name="bankzipcode"
              :label="t('Bank Zip/Postal Code')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.bankcountry"
              name="bankcountry"
              :label="t('Bank Country')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-input
              v-model="form.iban"
              name="iban"
              :label="t('IBAN')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.bic"
              name="bic"
              :label="t('BIC')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.membernumber"
              name="membernumber"
              :label="t('Member Number')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-input
              v-model="form.clearingnumber"
              name="clearingnumber"
              :label="t('BC Number')"
              outlined
              dense
              class="lightbg q-mb-sm input-box"
            />
            <q-checkbox
              v-model="form.remittancevoucher"
              name="remittancevoucher"
              :label="t('Remittance Voucher')"
            />
          </div>
        </div>
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </q-form>
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

const updateTitle = inject("updateTitle");
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// Computed properties for page state
const isEditMode = computed(() => !!route.params.id);
const vcType = computed(() =>
  route.params.type === "customer" ? t("Customer") : t("Vendor")
);

// Form state with all fields matching original HTML form
const form = ref({
  id: "",
  typeofcontact: "company",
  vcnumber: "",
  name: "",
  address1: "",
  address2: "",
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
  creditlimit: "",
  threshold: "",
  terms: "",
  curr: "PKR",
  startdate: new Date().toISOString().split("T")[0], // Today's date as default
  enddate: "",
  discount: "",
  taxnumber: "",
  sic_code: "",
  notes: "",
  bankname: "",
  bankaddress1: "",
  bankaddress2: "",
  bankcity: "",
  bankstate: "",
  bankzipcode: "",
  bankcountry: "",
  iban: "",
  bic: "",
  membernumber: "",
  clearingnumber: "",
  remittancevoucher: false,
  referencedescription_1: "",
  referenceconfidential_1: false,
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
const paymentAccounts = ref([]);
const taxAccounts = ref([]);
const arap = ref("");

// Format account options for q-select
const formatAccountOption = (account) => ({
  label: `${account.accno}--${account.description}`,
  value: `${account.accno}--${account.description}`,
});

// Unified function to update VC-related values
const updateVCSettings = async () => {
  const isCustomer = route.params.type === "customer";

  // Update page title
  updateTitle(
    isEditMode.value ? `Edit ${vcType.value}` : `Add ${vcType.value}`
  );

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

    taxAccounts.value = accounts.value
      .filter((account) => account.link.split(":").includes(taxLink))
      .map((account) => ({
        id: account.accno,
        description: `${account.description} `,
      }));

    paymentAccounts.value = accounts.value
      .filter((account) => account.link.split(":").includes(paymentLink))
      .map(formatAccountOption);

    // Initialize tax checkboxes in form
    taxAccounts.value.forEach((tax) => {
      form.value[`tax_${tax.id}`] = false;
    });
  }
};

// Fetch accounts from API
const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    accounts.value = response.data;
    await updateVCSettings();
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    Notify.create({
      message: t("Failed to fetch accounts"),
      type: "negative",
      position: "center",
    });
  }
};

// Fetch vc data if in edit mode
const fetchVc = async (id) => {
  try {
    const response = await api.get(`/arap/${route.params.type}/${id}`);

    // Destructure response data for clarity
    const data = response.data;

    // Handle taxaccounts (space-separated string)
    const taxAccountsString = data.taxaccounts; // e.g., "2310 2320 2330"
    const taxIds = taxAccountsString ? taxAccountsString.split(" ") : [];
    taxIds.forEach((id) => {
      form.value[`tax_${id}`] = true;
    });

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

    form.value.vcnumber =
      vcType.value === "Vendor" ? data.vendornumber : data.customernumber;
    form.value.id = data.id;
    // Handle remittancevoucher and taxincluded (1 or 0)
    form.value.remittancevoucher = data.remittancevoucher === 1;
    form.value.taxincluded = data.taxincluded === 1;
    form.value.addressid = data.addressid;

    // Map other fields, excluding the ones already handled
    const excludedFields = [
      "taxaccounts",
      "all_contact",
      "remittancevoucher",
      "taxincluded",
    ];
    Object.keys(form.value).forEach((key) => {
      if (data[key] !== undefined && !excludedFields.includes(key)) {
        form.value[key] = data[key];
      }
    });
  } catch (error) {
    console.error("Failed to fetch vc:", error);
    Notify.create({
      message: t("Failed to load vc data"),
      type: "negative",
      position: "center",
    });
  }
};

// Form submission handler
const submitForm = async () => {
  try {
    // Validate form
    if (!formRef.value.validate()) {
      Notify.create({
        message: t("Please correct the errors in the form"),
        type: "negative",
        position: "center",
      });
      return;
    }

    loading.value = true;

    // Prepare payload
    const payload = { ...form.value };

    // Add selected taxes to payload
    payload.taxes = taxAccounts.value
      .filter((tax) => form.value[`tax_${tax.id}`])
      .map((tax) => tax.id);

    // Optionally, convert boolean fields to integers if API expects 1/0
    payload.remittancevoucher = form.value.remittancevoucher ? 1 : 0;
    payload.taxincluded = form.value.taxincluded ? 1 : 0;

    // Submit to API

    await api.post(`/arap/${route.params.type}`, payload);
    Notify.create({
      message: t(`${vcType.value} updated successfully`),
      type: "positive",
      position: "center",
    });
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

// Watch for type changes
watch(
  () => route.params.type,
  () => updateVCSettings()
);

// Initialize component
onMounted(async () => {
  await fetchAccounts();
  await fetchVc(route.query.id);
});
</script>
