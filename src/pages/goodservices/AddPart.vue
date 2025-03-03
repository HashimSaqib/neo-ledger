<template>
  <q-page class="q-pa-sm relative-position">
    <q-form @submit.prevent="submitForm" ref="formRef" class="q-pa-md">
      <!-- Basic Information & Other Fields remain unchanged -->
      <div class="row q-mb-md mainbg q-gutter-md">
        <div class="col-12 col-md-5 q-mr-xl">
          <q-input
            v-model="form.partnumber"
            name="partnumber"
            label="Number"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.description"
            name="description"
            label="Description"
            type="textarea"
            outlined
            dense
            rows="2"
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />

          <!-- Accounts Section -->
          <s-select
            v-model="form.inventory"
            :options="inventoryAccounts"
            name="IC_inventory"
            label="Inventory"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
            search="label"
            account
          />
          <s-select
            v-model="form.income"
            :options="incomeAccounts"
            name="IC_income"
            label="Income"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
            search="label"
            account
          />
          <!-- Only show Cogs if type is NOT service -->
          <s-select
            v-if="type !== 'service'"
            v-model="form.cogs"
            :options="cogsAccounts"
            name="IC_expense"
            label="COGS"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
            search="label"
            account
          />

          <!-- Tax Accounts -->
          <div class="q-mb-sm">
            <div class="text-weight-bold">Tax</div>
            <div class="row">
              <div v-for="tax in taxAccounts" :key="tax.chart_id">
                <q-checkbox
                  v-model="form.taxes[tax.chart_id]"
                  :name="`IC_tax_${tax.chart_id}`"
                  :label="tax.description"
                />
              </div>
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
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
            />
            <q-checkbox
              v-model="form.referenceConfidential"
              name="referenceconfidential_1"
              label="Confidential"
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
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
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />

          <!-- Additional Fields -->
          <q-input
            v-model="form.image"
            name="image"
            label="Image"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.drawing"
            name="drawing"
            label="Drawing"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.microfiche"
            name="microfiche"
            label="Microfiche"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.toolnumber"
            name="toolnumber"
            label="Tool Number"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
        </div>

        <!-- Right Column: Pricing & Inventory Details -->
        <div class="col-12 col-md-5">
          <q-input
            v-model="form.priceupdate"
            name="priceupdate"
            label="Updated"
            type="date"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.lot"
            name="lot"
            label="Lot"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.expires"
            name="expires"
            label="Expires"
            type="date"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.sellprice"
            name="sellprice"
            label="Sell Price"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.listprice"
            name="listprice"
            label="List Price"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-model="form.lastcost"
            name="lastcost"
            label="Last Cost"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <!-- Fields hidden when type is service -->
          <q-input
            v-if="type !== 'service'"
            v-model="form.averageCost"
            name="averageCost"
            label="Average Cost"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-if="type !== 'service'"
            v-model="form.unit"
            name="unit"
            label="Unit"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-if="type !== 'service'"
            v-model="form.weight"
            name="weight"
            label="Weight (kg)"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-if="type !== 'service'"
            v-model="form.onhand"
            name="onhand"
            label="On Hand"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-checkbox
            v-if="type !== 'service'"
            v-model="form.checkinventory"
            name="checkinventory"
            label="Check Inventory"
            class="q-mb-sm"
          />
          <q-input
            v-if="type !== 'service'"
            v-model="form.rop"
            name="rop"
            label="ROP"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
          <q-input
            v-if="type !== 'service'"
            v-model="form.bin"
            name="bin"
            label="Bin"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
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
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model="form.tariff_hscode"
            name="tariff_hscode"
            label="HS Code"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model="form.barcode"
            name="barcode"
            label="Barcode"
            outlined
            dense
            class="q-mb-sm"
            bg-color="input"
            label-color="secondary"
          />
        </div>
      </div>

      <!-- Group: Make and Model (Now an Array) - Hide entirely for service -->
      <div v-if="type !== 'service'" class="q-mb-md">
        <div class="text-weight-bold q-mb-xs">Make and Model</div>
        <div
          v-for="(line, index) in form.makeModelLines"
          :key="'mm-' + index"
          class="row q-mb-md q-gutter-md mainbg items-center"
        >
          <div class="col-12 col-md-4">
            <q-input
              v-model="line.make"
              :name="`make_${index}`"
              label="Make"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleMakeModelEnter(index)"
              :ref="(el) => (makeInputRefs[index] = el)"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="line.model"
              :name="`model_${index}`"
              label="Model"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleMakeModelEnter(index)"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="negative"
              icon="delete"
              dense
              flat
              @click="deleteMakeModelLine(index)"
            />
          </div>
        </div>
      </div>

      <!-- Group: Vendor Information (Now an Array) -->
      <div class="q-mb-md">
        <div class="text-weight-bold q-mb-xs">Vendor Information</div>
        <div
          v-for="(line, index) in form.vendorLines"
          :key="'vendor-' + index"
          class="row q-mb-md q-gutter-md mainbg items-center"
        >
          <div class="col-12 col-md-2">
            <q-select
              v-model="line.vendor"
              :options="vendors"
              option-label="label"
              option-value="label"
              :name="`vendor_${index}`"
              label="Vendor"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleVendorEnter(index)"
              :ref="(el) => (vendorInputRefs[index] = el)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="line.vendorPartNumber"
              :name="`partnumber_${index}`"
              label="Number"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleVendorEnter(index)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="line.vendorCost"
              :name="`lastcost_${index}`"
              label="Cost"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleVendorEnter(index)"
            />
          </div>
          <div class="col-12 col-md-1">
            <q-select
              v-model="line.vendorCurrency"
              :options="currencies"
              :name="`vendorcurr_${index}`"
              label="Curr"
              option-value="curr"
              option-label="curr"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleVendorEnter(index)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="line.vendorLeadtime"
              :name="`leadtime_${index}`"
              label="Leadtime (days)"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleVendorEnter(index)"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="negative"
              icon="delete"
              dense
              flat
              @click="deleteVendorLine(index)"
            />
          </div>
        </div>
      </div>

      <!-- Group: Customer Information (Now an Array) -->
      <div class="q-mb-md">
        <div class="text-weight-bold q-mb-xs">Customer Information</div>
        <div
          v-for="(line, index) in form.customerLines"
          :key="'customer-' + index"
          class="row q-mb-md q-gutter-md mainbg items-center"
        >
          <div class="col-12 col-md-2">
            <q-select
              v-model="line.customer"
              :options="customers"
              option-label="label"
              option-value="label"
              :name="`customer_${index}`"
              label="Customer"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleCustomerEnter(index)"
              :ref="(el) => (customerInputRefs[index] = el)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="line.priceBreak"
              :name="`pricebreak_${index}`"
              label="Break"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleCustomerEnter(index)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="line.customerPrice"
              :name="`customerprice_${index}`"
              label="Sell Price"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleCustomerEnter(index)"
            />
          </div>
          <div class="col-12 col-md-1">
            <q-select
              v-model="line.customerCurrency"
              :options="currencies"
              :name="`customercurr_${index}`"
              label="Curr"
              option-value="curr"
              option-label="curr"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleCustomerEnter(index)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="line.validFrom"
              :name="`validfrom_${index}`"
              label="From"
              type="date"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleCustomerEnter(index)"
            />
          </div>
          <div class="col-12 col-md-2">
            <q-input
              v-model="line.validTo"
              :name="`validto_${index}`"
              label="To"
              type="date"
              outlined
              dense
              class="q-mb-sm"
              bg-color="input"
              label-color="secondary"
              @keyup.enter.prevent="handleCustomerEnter(index)"
            />
          </div>
          <div class="col-auto">
            <q-btn
              color="negative"
              icon="delete"
              dense
              flat
              @click="deleteCustomerLine(index)"
            />
          </div>
        </div>
      </div>

      <div class="row justify-start q-mt-md">
        <!-- Changed click event to submitForm -->
        <q-btn label="Save" @click="submitForm" color="primary" />
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, nextTick } from "vue";
import { Notify } from "quasar";
import { api } from "src/boot/axios";
import { useRoute } from "vue-router";

const route = useRoute();
// -------------------------
// Transaction Type & Page Title
// -------------------------
const updateTitle = inject("updateTitle");
const type = ref(route.params.type || route.query.type || "part");
if (type.value === "part") {
  updateTitle("Add Part");
} else if (type.value === "service") {
  updateTitle("Add Service");
}

const form = ref({
  // Basic Information
  partnumber: "",
  description: "",
  // Account & Tax Section
  inventory: "",
  income: "",
  cogs: "",
  taxes: {},
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
  // Make & Model Lines as Array (removed for service)
  makeModelLines: [{ make: "", model: "" }],
  // Vendor Lines as Array
  vendorLines: [
    {
      vendor: null,
      vendorPartNumber: "",
      vendorCost: "",
      vendorCurrency: "",
      vendorLeadtime: "",
    },
  ],
  // Customer Lines as Array
  customerLines: [
    {
      customer: null,
      priceBreak: "",
      customerPrice: "",
      customerCurrency: "",
      validFrom: "",
      validTo: "",
    },
  ],
});

const inventoryAccounts = ref([]);
const incomeAccounts = ref([]);
const cogsAccounts = ref([]);
const taxAccounts = ref([]);
const vendors = ref([]);
const customers = ref([]);
const currencies = ref([]);

// Refs for dynamic field focusing
const makeInputRefs = [];
const vendorInputRefs = [];
const customerInputRefs = [];

const getLinks = async () => {
  try {
    const response = await api.get("/create_links/goodsservices");
    const links = response.data;
    taxAccounts.value = links.tax_accounts;
    taxAccounts.value.forEach((tax) => {
      form.value.taxes[tax.chart_id] = false;
    });
    inventoryAccounts.value = links.accounts.inventory;
    incomeAccounts.value = links.accounts.income;
    cogsAccounts.value = links.accounts.cogs;
    currencies.value = links.currencies;
    vendors.value = links.vendors;
    customers.value = links.customers;
  } catch (error) {
    Notify.create({
      message: "Failed to fetch links",
      type: "negative",
      position: "center",
    });
  }
};

// Default post route – prepares the data and logs it
const submitForm = async () => {
  if (!form.value.partnumber || !form.value.description) {
    Notify.create({
      message: "Please fill in the required fields",
      type: "negative",
      position: "center",
    });
    return;
  }

  // Create a shallow copy of form data
  const postData = { ...form.value };

  // If type is service, remove the fields that need to be hidden
  if (type.value === "service") {
    delete postData.cogs;
    delete postData.averageCost;
    delete postData.weight;
    delete postData.onhand;
    delete postData.checkinventory;
    delete postData.rop;
    delete postData.bin;
    delete postData.makeModelLines;
  }

  // For now, just log the data (simulate post route)
  console.log("Submitted data:", postData);
  Notify.create({
    message: "Part/Service saved successfully",
    type: "positive",
    position: "center",
  });
};

// Delete functions for each array group
function deleteMakeModelLine(index) {
  if (form.value.makeModelLines.length > 1) {
    form.value.makeModelLines.splice(index, 1);
  } else {
    form.value.makeModelLines[0] = { make: "", model: "" };
  }
}

function deleteVendorLine(index) {
  if (form.value.vendorLines.length > 1) {
    form.value.vendorLines.splice(index, 1);
  } else {
    form.value.vendorLines[0] = {
      vendor: null,
      vendorPartNumber: "",
      vendorCost: "",
      vendorCurrency: "",
      vendorLeadtime: "",
    };
  }
}

function deleteCustomerLine(index) {
  if (form.value.customerLines.length > 1) {
    form.value.customerLines.splice(index, 1);
  } else {
    form.value.customerLines[0] = {
      customer: null,
      priceBreak: "",
      customerPrice: "",
      customerCurrency: "",
      validFrom: "",
      validTo: "",
    };
  }
}

// Make/Model helper functions
function handleMakeModelEnter(index) {
  const lines = form.value.makeModelLines;
  // Only add a new line if on the last line
  if (index === lines.length - 1) {
    lines.push({ make: "", model: "" });
    nextTick(() => {
      // Focus the 'make' input on the newly added line
      makeInputRefs[index + 1]?.focus && makeInputRefs[index + 1].focus();
    });
  }
}

// Vendor helper functions
function handleVendorEnter(index) {
  const lines = form.value.vendorLines;
  if (index === lines.length - 1) {
    lines.push({
      vendor: null,
      vendorPartNumber: "",
      vendorCost: "",
      vendorCurrency: "",
      vendorLeadtime: "",
    });
    nextTick(() => {
      vendorInputRefs[index + 1]?.focus && vendorInputRefs[index + 1].focus();
    });
  }
}

// Customer helper functions
function handleCustomerEnter(index) {
  const lines = form.value.customerLines;
  if (index === lines.length - 1) {
    lines.push({
      customer: null,
      priceBreak: "",
      customerPrice: "",
      customerCurrency: "",
      validFrom: "",
      validTo: "",
    });
    nextTick(() => {
      customerInputRefs[index + 1]?.focus &&
        customerInputRefs[index + 1].focus();
    });
  }
}

onMounted(async () => {
  await getLinks();
});
</script>
