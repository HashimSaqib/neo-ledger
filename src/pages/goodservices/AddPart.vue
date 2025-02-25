<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <q-form @submit.prevent="submitForm" ref="formRef" class="q-pa-md">
      <div class="row q-mb-md mainbg q-gutter-md">
        <div class="col-12 col-md-5 q-mr-xl">
          <q-input
            v-model="form.partnumber"
            name="partnumber"
            label="Number"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.description"
            name="description"
            label="Description"
            type="textarea"
            outlined
            dense
            rows="2"
            class="q-mb-sm lightbg"
          />

          <!-- Accounts Section -->
          <q-select
            v-model="form.inventory"
            :options="inventoryAccounts"
            name="IC_inventory"
            label="Inventory"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-select
            v-model="form.income"
            :options="incomeAccounts"
            name="IC_income"
            label="Income"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-select
            v-model="form.cogs"
            :options="cogsAccounts"
            name="IC_expense"
            label="COGS"
            outlined
            dense
            class="q-mb-sm lightbg"
          />

          <!-- Tax Accounts -->
          <div class="q-mb-sm">
            <div class="text-weight-bold q-mb-xs">Tax</div>
            <div v-for="tax in taxAccounts" :key="tax.id" class="q-mb-xs">
              <q-checkbox
                v-model="form.taxes[tax.id]"
                :name="`IC_tax_${tax.id}`"
                :label="tax.description"
              />
            </div>
          </div>

          <!-- Reference Documents -->
          <div class="q-mb-sm">
            <div class="text-weight-bold">Reference Documents</div>
            <q-input
              v-model="form.referenceDescription"
              name="referencedescription_1"
              label="Reference Description"
              outlined
              dense
              class="q-mb-sm lightbg"
            />
            <q-checkbox
              v-model="form.referenceConfidential"
              name="referenceconfidential_1"
              label="Confidential"
              class="q-mb-sm"
            />
          </div>

          <!-- Notes -->
          <q-input
            v-model="form.notes"
            name="notes"
            label="Notes"
            type="textarea"
            outlined
            dense
            rows="2"
            class="q-mb-sm lightbg"
          />

          <!-- Additional Fields -->
          <q-input
            v-model="form.image"
            name="image"
            label="Image"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.drawing"
            name="drawing"
            label="Drawing"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.microfiche"
            name="microfiche"
            label="Microfiche"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.toolnumber"
            name="toolnumber"
            label="Tool Number"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>

        <!-- Right Column: Updated, Lot, Expires, Sell Price, List Price, Last Cost, Markup %, Average Cost, Unit, Weight, On Hand, Check Inventory, ROP, Bin -->
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.priceupdate"
            name="priceupdate"
            label="Updated"
            type="date"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.lot"
            name="lot"
            label="Lot"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.expires"
            name="expires"
            label="Expires"
            type="date"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.sellprice"
            name="sellprice"
            label="Sell Price"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.listprice"
            name="listprice"
            label="List Price"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.lastcost"
            name="lastcost"
            label="Last Cost"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.markup"
            name="markup"
            label="Markup (%)"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.averageCost"
            name="averageCost"
            label="Average Cost"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.unit"
            name="unit"
            label="Unit"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.weight"
            name="weight"
            label="Weight (kg)"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.onhand"
            name="onhand"
            label="On Hand"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-checkbox
            v-model="form.checkinventory"
            name="checkinventory"
            label="Check Inventory"
            class="q-mb-sm"
          />
          <q-input
            v-model="form.rop"
            name="rop"
            label="ROP"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
          <q-input
            v-model="form.bin"
            name="bin"
            label="Bin"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
      </div>

      <div class="row q-mb-md q-gutter-md mainbg">
        <div class="col-12 col-md-4">
          <q-input
            v-model="form.countryorigin"
            name="countryorigin"
            label="Country of Origin"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model="form.tariff_hscode"
            name="tariff_hscode"
            label="HS Code"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model="form.barcode"
            name="barcode"
            label="Barcode"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
      </div>

      <!-- Group: Make and Model -->
      <div class="row q-mb-md q-gutter-md mainbg">
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.make"
            name="make_1"
            label="Make"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model="form.model"
            name="model_1"
            label="Model"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
      </div>

      <!-- Group: Vendor Information -->
      <div class="row q-mb-md q-gutter-md q-mt-sm mainbg">
        <div class="col-12 col-md-2">
          <q-select
            v-model="form.vendor"
            :options="vendorList"
            name="vendor_1"
            label="Vendor"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-input
            v-model="form.vendorPartNumber"
            name="partnumber_1"
            label="Number"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-input
            v-model="form.vendorCost"
            name="lastcost_1"
            label="Cost"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-1">
          <q-select
            v-model="form.vendorCurrency"
            :options="currencyOptions"
            name="vendorcurr_1"
            label="Curr"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-input
            v-model="form.vendorLeadtime"
            name="leadtime_1"
            label="Leadtime (days)"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
      </div>

      <div class="row q-mb-md q-gutter-md q-mt-sm mainbg">
        <div class="col-12 col-md-2">
          <q-select
            v-model="form.customer"
            :options="customerList"
            name="customer_1"
            label="Customer"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-input
            v-model="form.priceBreak"
            name="pricebreak_1"
            label="Break"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-input
            v-model="form.customerPrice"
            name="customerprice_1"
            label="Sell Price"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-1">
          <q-select
            v-model="form.customerCurrency"
            :options="currencyOptions"
            name="customercurr_1"
            label="Curr"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-input
            v-model="form.validFrom"
            name="validfrom_1"
            label="From"
            type="date"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
        <div class="col-12 col-md-2">
          <q-input
            v-model="form.validTo"
            name="validto_1"
            label="To"
            type="date"
            outlined
            dense
            class="q-mb-sm lightbg"
          />
        </div>
      </div>
      <div class="row justify-start q-mt-md">
        <q-btn label="Save" type="submit" color="primary" />
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Notify } from "quasar";

const form = ref({
  // Basic Information
  partnumber: "",
  description: "",
  // Account & Tax Section
  inventory: "",
  income: "",
  cogs: "",
  taxes: {
    2310: false,
    2320: false,
    2330: false,
  },
  referenceDescription: "",
  referenceConfidential: false,
  notes: "",
  // Pricing & Inventory Details
  priceupdate: new Date().toISOString().split("T")[0],
  lot: "",
  expires: "",
  sellprice: "",
  listprice: "",
  lastcost: "",
  markup: "",
  averageCost: "",
  unit: "",
  weight: "",
  onhand: "",
  checkinventory: false,
  rop: "",
  bin: "",
  // Additional Descriptive Info
  image: "",
  countryorigin: "",
  drawing: "",
  tariff_hscode: "",
  microfiche: "",
  barcode: "",
  toolnumber: "",
  // Make & Model
  make: "",
  model: "",
  // Vendor Information
  vendor: null,
  vendorPartNumber: "",
  vendorCost: "",
  vendorCurrency: "",
  vendorLeadtime: "",
  // Customer Pricing
  customer: null,
  priceBreak: "",
  customerPrice: "",
  customerCurrency: "",
  validFrom: "",
  validTo: "",
});

// Placeholder account arrays
const inventoryAccounts = ref([
  { label: "1510--Inventory 2", value: "1510--Inventory 2" },
  { label: "1520--Inventory / General", value: "1520--Inventory / General" },
  {
    label: "1530--Inventory / Aftermarket Parts",
    value: "1530--Inventory / Aftermarket Parts",
  },
  { label: "1535--Inventory TEST", value: "1535--Inventory TEST" },
]);

const incomeAccounts = ref([
  { label: "4020--Sales / General", value: "4020--Sales / General" },
  {
    label: "4030--Sales / Aftermarket Parts",
    value: "4030--Sales / Aftermarket Parts",
  },
]);

const cogsAccounts = ref([
  { label: "5020--COGS / General", value: "5020--COGS / General" },
  {
    label: "5030--COGS / Aftermarket Parts",
    value: "5030--COGS / Aftermarket Parts",
  },
]);

const taxAccounts = ref([
  { id: "2310", description: "2310--VAT (10%)" },
  { id: "2320", description: "2320--VAT (14%)" },
  { id: "2330", description: "2330--VAT (30%)" },
]);

// Placeholder vendor and customer lists
const vendorList = ref([
  { label: "Athletic Corner", value: "Athletic Corner--10107" },
  { label: "Brekke Inc", value: "Brekke Inc--10233" },
  { label: "Keyboard Vendor", value: "Keyboard Vendor--10114" },
  { label: "Maverick Media One", value: "Maverick Media One--10167" },
  { label: "MEILI HOTELS AG", value: "MEILI HOTELS AG--10173" },
  { label: "SVK TRV", value: "SVK TRV--10186" },
  { label: "Walker Ltd", value: "Walker Ltd--10235" },
  { label: "yallo", value: "yallo--10174" },
]);

const customerList = ref([
  { label: "Hashim Saqib", value: "Hashim Saqib--10302" },
  { label: "Saqib Ibrahim", value: "Saqib Ibrahim--10075" },
]);

// Placeholder currency options
const currencyOptions = ref([
  { label: "PKR", value: "PKR" },
  { label: "USD", value: "USD" },
]);

// Placeholder function to simulate fetching data from an API
const fetchPlaceholderData = async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  // In a real implementation, you would fetch and assign data for accounts, vendors, and customers here.
};

const submitForm = async () => {
  if (!form.value.partnumber || !form.value.description) {
    Notify.create({
      message: "Please fill in the required fields",
      type: "negative",
      position: "center",
    });
    return;
  }
  console.log("Submitted form:", form.value);
  Notify.create({
    message: "Part/Service saved successfully",
    type: "positive",
    position: "center",
  });
};

onMounted(async () => {
  await fetchPlaceholderData();
});
</script>
