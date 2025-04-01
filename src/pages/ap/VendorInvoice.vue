<template>
  <q-page class="q-pa-sm relative-position">
    <!-- Main Form Header Section -->
    <div class="mainbg textmain q-pa-md-sm q-pa-sm">
      <div class="row justify-between full-width">
        <!-- Vendor Selection and Information -->
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
              label-color="secondary"
              class="q-mb-sm col-12 col-sm-7"
              @update:model-value="vendorUpdate"
              search="label"
              bg-color="input"
            />
            <div class="q-ml-sm" style="display: flex; align-items: center">
              <q-btn
                @click.prevent="openEditVendor"
                class="text-primary q-mr-xs"
                style="text-decoration: none"
                v-if="selectedVendor"
                icon="edit"
                flat
                dense
              />

              <q-btn
                @click.prevent="openAddVendor"
                class="text-primary"
                style="margin-right: 0.5em; text-decoration: none"
                icon="add"
                flat
                dense
              />
            </div>
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

          <!-- Record Account & Currency Selection -->
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

          <!-- Additional Header Fields -->
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

        <!-- Invoice Number and Date Fields -->
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
              @change="filterProjects"
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
            <!-- Main Line Fields -->
            <div
              class="row justify-between align-center"
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
              <!-- Edit Product Button -->

              <s-select
                v-if="!line.partnumber"
                :key="line.id"
                outlined
                v-model="line.partnumber"
                :label="t('Description')"
                class="col-2"
                bg-color="input"
                label-color="secondary"
                dense
                :options="items"
                option-label="description"
                option-value="partnumber"
                @update:model-value="handleLineItemChange(line, index)"
                search="label"
                :ref="(el) => (descriptionInputs[index] = el)"
              />
              <q-input
                v-else
                outlined
                v-model="line.description"
                :label="t('Description')"
                class="col-2"
                bg-color="input"
                label-color="secondary"
                dense
                autogrow
                @keydown.enter="handleLineEnter(index, $event)"
                :ref="(el) => (descriptionInputs[index] = el)"
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
                bg-color="input"
                label-color="secondary"
                readonly
                class="col-1"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <q-btn
                flat
                dense
                icon="edit"
                href="#"
                size="0.8rem"
                @click.prevent="openEditPart(line)"
                class="text-primary items-center"
                v-if="line.partnumber"
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

            <!-- Detailed Line Item Section -->
            <div v-if="line.lineitemdetail" class="row q-pa-sm q-gutter-xs">
              <s-select
                outlined
                v-model="line.project"
                :options="filteredProjects"
                option-label="projectnumber"
                option-value="value"
                emit-value
                map-options
                :label="t('Project')"
                @keydown.enter="handleLineEnter(index, $event)"
              />
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
                v-model="line.vendorponumber"
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

      <!-- Invoice Totals and Notes -->
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

    <!-- Print Options Section (shown if invoice exists) -->
    <div class="row q-gutter-x-md" v-if="invId">
      <s-select
        :options="templates"
        option-label="label"
        option-value="value"
        map-options
        emit-value
        v-model="printOptions.template"
        search="label"
        label="Template"
      />
      <q-select
        :options="['tex', 'html']"
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

    <!-- Vendor Dialog for Adding/Editing Vendor -->
    <q-dialog v-model="vendorDialog">
      <q-card style="min-width: 80vw" class="q-pa-none">
        <q-card-section class="q-pa-none">
          <AddVC
            :id="dialogMode === 'edit' ? selectedVendor.id : null"
            type="vendor"
            @close="vendorDialog = false"
            @saved="vendorSaved"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Product (Part) Dialog for Editing Products -->
    <q-dialog v-model="partDialog">
      <q-card style="min-width: 80vw" class="q-pa-none">
        <q-card-section class="q-pa-none">
          <AddPart
            :id="
              selectedPartLine && selectedPartLine.partnumber
                ? selectedPartLine.partnumber.id
                : null
            "
            :type="selectedPartType"
            @close="closePartDialog"
            @saved="partSaved"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
// =====================
// Imports & Initialization
// =====================
import {
  ref,
  onMounted,
  watch,
  computed,
  inject,
  nextTick,
  onUnmounted,
} from "vue";
import { api } from "src/boot/axios";
import { date, Notify } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { formatAmount } from "src/helpers/utils";
import { useI18n } from "vue-i18n";
import draggable from "vuedraggable";
import AddVC from "src/pages/arap/AddVC.vue";
import AddPart from "src/pages/goodservices/AddPart.vue";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const loading = ref(false);
const updateTitle = inject("updateTitle");

// =====================
// Dialogs: Vendor & Product
// =====================
// Vendor Dialog
const vendorDialog = ref(false);
const dialogMode = ref("add"); // "add" or "edit"

// Product (Part) Dialog
const partDialog = ref(false);
const selectedPartLine = ref(null);
const selectedPartType = ref("");

// Open Vendor Dialogs
const openAddVendor = () => {
  dialogMode.value = "add";
  vendorDialog.value = true;
};
const openEditVendor = () => {
  if (!selectedVendor.value) return;
  dialogMode.value = "edit";
  vendorDialog.value = true;
};

// Open Product (Part) Dialog for Editing
const openEditPart = (line) => {
  selectedPartLine.value = line;
  // Determine type based on inventory_accno_id property
  selectedPartType.value =
    line.partnumber && line.partnumber.inventory_accno_id ? "part" : "service";
  partDialog.value = true;
};
const closePartDialog = () => {
  partDialog.value = false;
};
const partSaved = async () => {
  // When a part is saved, re-fetch the items list.
  await fetchItems();
  partDialog.value = false;
};

// =====================
// Title & Invoice Type Setup
// =====================

updateTitle("Vendor Invoice");
if (route.query.credit_invoice) {
  updateTitle("Credit Invoice");
}
const invType = ref(route.query.credit_invoice ? "credit_invoice" : "invoice");

const templates = [
  { label: t("Invoice"), value: "vendor_invoice" },
  { label: t("Pick List"), value: "pick_list" },
  { label: t("Packing List"), value: "packing_list" },
];
const printOptions = ref({
  template: "vendor_invoice",
  format: "tex",
  location: "download",
});
// =====================
// Counters & Refs for Dynamic Elements
// =====================
let lineId = 1;
const dragging = ref(false);
const lineSelects = ref([]);
const paymentDateInputs = ref([]);
const descriptionInputs = ref([]);

// =====================
// Data: Vendors, Items, Accounts, Links, and Currencies
// =====================

// Vendors
const vendors = ref([]);
const selectedVendor = ref();
const vendor = ref();
const fetchVendors = async () => {
  try {
    const response = await api.get("/arap/list/vendor");
    vendors.value = response.data;
  } catch (error) {
    console.log(error);
  }
};
const fetchVendor = async (id) => {
  try {
    const response = await api.get(`/arap/list/vendor/${id}`);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
const vendorSaved = async (id) => {
  await fetchVendors();
  selectedVendor.value = vendors.value.find((cus) => cus.id == id.id);
  vendorUpdate(id);
  vendorDialog.value = false;
};

// Items
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

// Accounts
const recordAccount = ref();
const recordAccounts = ref([]);
const paymentAccounts = ref([]);
const defaultPaymentAccount = ref([]);
const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    const accounts = response.data;
    recordAccounts.value = accounts.filter((account) => account.link === "AP");
    paymentAccounts.value = accounts.filter((account) =>
      account.link.split(":").includes("AP_paid")
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

// Links & Currencies & Projects
const departments = ref([]);
const selectedDepartment = ref();
const projects = ref([]);
const filteredProjects = ref([]);

const currencies = ref([]);
const exchangeRate = ref();
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
    const response = await api.get(`/create_links/vendor`);
    departments.value = response.data.departments;
    currencies.value = response.data.currencies;
    if (currencies.value) {
      selectedCurrency.value = currencies.value.find(
        (currency) => currency.rn === 1
      );
    }
    projects.value = response.data.projects;
    filterProjects();
  } catch (error) {
    console.log(error);
  }
};

// =====================
// Form Fields & Invoice Information
// =====================
const selectedCurrency = ref();
const shippingPoint = ref("");
const shipVia = ref("");
const wayBill = ref("");
const description = ref("");
const notes = ref("");
const intnotes = ref("");
const invNumber = ref("");
const ordNumber = ref("");
const poNumber = ref("");
const invId = ref(route.query.id ? `${route.query.id}` : "");

const { formatDate, addToDate } = date;
const getTodayDate = () => {
  return formatDate(new Date(), "YYYY-MM-DD");
};
const invDate = ref(getTodayDate());
const dueDate = ref(getTodayDate());

// =====================
// Invoice Lines & Calculations
// =====================
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
const calculateExtended = (qty, price, discount) => {
  const baseValue = qty * price;
  const discountedValue = baseValue - (baseValue * discount) / 100;
  return discountedValue.toFixed(2);
};
const toggleDetail = (line) => {
  line.lineitemdetail = !line.lineitemdetail;
};

// Add/Remove Line Functions
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
const addLine = () => {
  addLineAt(lines.value.length - 1);
};
const removeLine = (index) => {
  if (lines.value.length > 1) {
    lines.value.splice(index, 1);
  }
};

// Handle Enter Key for Lines
let lineEnterLock = false;
const handleLineEnter = (index, event) => {
  if (lineEnterLock) return;
  lineEnterLock = true;
  if (!event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    addLineAt(index);
  }
  setTimeout(() => {
    lineEnterLock = false;
  }, 300);
};

// Handle Line Item Change (update details based on selected item)
const handleLineItemChange = (newValue, index) => {
  if (dragging.value) return;
  if (newValue && newValue.partnumber) {
    if (!newValue.noupdate) {
      console.log(newValue);
      const line = lines.value[index];
      line.description = newValue.partnumber.description || "";
      line.oh = newValue.partnumber.oh || 0;
      line.unit = newValue.partnumber.unit || "";
      line.price = newValue.partnumber.sellprice || 0;
      line.itemnotes = newValue.partnumber.notes || "";
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
  nextTick(() => {
    if (descriptionInputs.value[index]) {
      descriptionInputs.value[index].focus();
    }
  });
};

// Watch Lines for Recalculation
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

// =====================
// Taxes & Totals Calculation
// =====================
const taxIncluded = ref(false);
const invoiceTaxes = ref([]);
const calculateTaxes = () => {
  if (!vendor.value) {
    return;
  }
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
        if (
          vendor.value.taxaccounts &&
          vendor.value.taxaccounts.split(" ").includes(taxAccount)
        ) {
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
const taxInclude = () => {
  calculateTaxes();
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

// =====================
// Payments Handling
// =====================
const payments = ref([
  {
    date: getTodayDate(),
    source: "",
    memo: "",
    amount: 0,
    account: defaultPaymentAccount.value,
  },
]);
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
let paymentEnterLock = false;
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
const addPayment = () => {
  addPaymentAt(payments.value.length - 1);
};
const removePayment = (index) => {
  if (payments.value.length > 1) {
    payments.value.splice(index, 1);
  }
};

// =====================
// Vendor Update & Invoice Loading Functions
// =====================
const vendorUpdate = async (newValue) => {
  if (!newValue) {
    vendor.value = {};
    return;
  }
  vendor.value = await fetchVendor(newValue.id);
  vendor.value.taxaccounts = vendor.value.taxaccounts || "";
  const taxAccountsArray = vendor.value.taxaccounts.split(" ");
  const recordAccountAccno = vendor.value?.AP?.split("--")[0] ?? "";
  if (recordAccountAccno) {
    const matchingRecord = recordAccounts.value.find(
      (account) => account.accno === recordAccountAccno
    );
    if (matchingRecord) {
      recordAccount.value = matchingRecord;
    }
  }
  const paymentAccountAccno = vendor.value?.payment_accno?.split("--")[0] || "";
  defaultPaymentAccount.value =
    paymentAccounts.value.find(
      (account) => account.accno === paymentAccountAccno
    ) || paymentAccounts.value[0];
  payments.value.forEach(
    (payment) =>
      payment.amount === 0 && (payment.account = defaultPaymentAccount.value)
  );
  if (vendor.value?.currency) {
    const vendorCurrency = currencies.value.find(
      (curr) => curr.curr === vendor.value.currency
    );
    if (vendorCurrency) {
      selectedCurrency.value = vendorCurrency;
    } else {
      console.warn(`No matching currency found for: ${vendor.value.currency}`);
    }
  }
  if (invDate.value) {
    const terms = vendor.value?.terms ?? 0;
    const newDueDate = date.addToDate(invDate.value, { days: terms });
    dueDate.value = date.formatDate(newDueDate, "YYYY-MM-DD");
  } else {
    console.warn("Invalid invoice date");
  }
  calculateTaxes();
};

const fetchInvoice = async (id) => {
  if (id) {
    try {
      const response = await api.get(`/arap/invoice/vendor/${id}`);
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
      fetchLinks(),
    ]);
  }
  selectedVendor.value = vendors.value.find(
    (cust) => cust.vendornumber === invoice.vendornumber
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
      vendorponumber: line.vendorponumber,
      costvendor: line.costvendor,
      package: line.package,
      volume: line.volume,
      weight: line.weight,
      netweight: line.netweight,
      cost: line.cost,
      noupdate: true,
      project: (() => {
        const foundProject = projects.value.find(
          (project) => project.id === line.project
        );
        return foundProject
          ? `${foundProject.projectnumber}--${foundProject.id}`
          : "";
      })(),
    };
  });
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

// =====================
// Print & Post Invoice Functions
// =====================
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
      `/print_invoice?id=${invId.value}&vc=vendor&template=${printOptions.value.template}&format=${printOptions.value.format}`,
      {
        responseType: "blob",
      }
    );
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${printOptions.value.template}_${invId.value}.pdf`;
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
  if (!selectedVendor.value) {
    Notify.create({
      message: t("Vendor is required."),
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
    lines: lines.value
      .filter((line) => line.partnumber && line.partnumber.id)
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
        vendorponumber: line.vendorponumber,
        costvendor: line.costvendor,
        package: line.package,
        volume: line.volume,
        weight: line.weight,
        netweight: line.netweight,
        cost: line.cost,
        project: line.project,
      })),
    payments: payments.value.map((payment) => ({
      date: payment.date,
      source: payment.source,
      memo: payment.memo,
      amount: payment.amount,
      account: payment.account ? payment.account.label : "",
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

// =====================
// Reset Form Function
// =====================
const resetForm = () => {
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
  exchangeRate.value = 1;
  invoiceTaxes.value = [];
  taxIncluded.value = false;
};

// =====================
// Shift Key Listener for Description Autogrow
// =====================
const description_autogrow = ref(false);
const toggleShift = (e) => (description_autogrow.value = e.shiftKey);
onUnmounted(() => {
  window.removeEventListener("keydown", toggleShift);
  window.removeEventListener("keyup", toggleShift);
});

// =====================
// Mounted & Initialization
// =====================
onMounted(() => {
  window.addEventListener("keydown", toggleShift);
  window.addEventListener("keyup", toggleShift);
  fetchAccounts();
  fetchLinks();
  fetchItems();
  fetchVendors();
  fetchInvoice(route.query.id);
});
</script>
