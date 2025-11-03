<template>
  <q-page class="q-pa-sm relative-position">
    <!-- Main Form Header Section -->
    <div class="container q-pa-md-sm q-pa-sm">
      <div class="row justify-between full-width">
        <!-- VC Selection and Information -->
        <div class="col-sm-6 col-12">
          <div class="row full-width">
            <s-select
              :label="t(vcLabel)"
              :options="vcList"
              option-label="label"
              :option-value="vcNumberField"
              v-model="selectedVc"
              dense
              outlined
              label-color="secondary"
              class="q-mb-sm col-12 col-sm-7"
              @update:model-value="vcUpdate"
              search="label"
              bg-color="input"
            />
            <div class="q-ml-sm" style="display: flex; align-items: center">
              <q-btn
                @click.prevent="openEditVc"
                class="text-primary q-mr-xs"
                style="text-decoration: none"
                v-if="selectedVc"
                icon="edit"
                flat
                dense
              />
              <q-btn
                @click.prevent="openAddVc"
                class="text-primary"
                style="margin-right: 0.5em; text-decoration: none"
                icon="add"
                flat
                dense
              />
            </div>
            <div
              class="col-sm-4 q-md-ml-md content-center"
              v-if="vc && isOrder"
            >
              <p class="q-px-sm maintext q-ma-none">
                <strong>{{ t("Credit Limit") }}</strong>
                <span class="text-primary q-mx-sm">
                  {{ formatAmount(vc.creditlimit) }}
                </span>
                <strong>{{ t("Remaining") }}</strong>
                <span
                  class="q-ml-sm"
                  :class="
                    vc.creditremaining > 0 ? 'text-positive' : 'text-negative'
                  "
                >
                  {{ formatAmount(vc.creditremaining) }}
                </span>
              </p>
            </div>
          </div>

          <div v-if="vc">
            <p class="q-mb-sm q-px-sm maintext">
              <strong>{{ t("Address") }}</strong> {{ vc.full_address }}
            </p>
          </div>

          <!-- Currency Selection -->
          <div class="row"></div>

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
            <text-input
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
            <text-input
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
            <text-input
              outlined
              :label="t('Shipping Point')"
              v-model="shippingPoint"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              dense
              autogrow
            />
            <text-input
              outlined
              :label="t('Ship Via')"
              v-model="shipVia"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              dense
              autogrow
            />
            <text-input
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

        <!-- Number and Date Fields -->
        <div class="col-sm-4 col-12">
          <div class="row justify-start q-gutter-x-sm">
            <text-input
              outlined
              :label="t(numberFieldLabel)"
              v-model="formData.number"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              dense
              :disable="lockNumber"
            />
            <text-input
              v-model="formData.date"
              :label="t(dateFieldLabel)"
              class="q-mb-sm col-sm-5 col-12"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              type="date"
              @change="filterProjects"
            />
            <text-input
              v-model="formData.requiredBy"
              :label="t(requiredByLabel)"
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
    <div class="container q-mt-sm q-mb-none q-pa-sm">
      <div class="row q-mb-md">
        <h6 class="q-my-none q-pa-none text-secondary">{{ t("Items") }}</h6>
        <s-button type="add-line" @click="addLine" class="q-ml-md" />
        <s-button
          type="add-part"
          @click="openAddPart('part')"
          class="q-ml-md"
        />
        <s-button
          type="add-service"
          @click="openAddPart('service')"
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
              class="row justify-between align-center container-bg q-pa-md"
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
              <text-input
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
              <text-input
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
              <text-input
                outlined
                v-model="line.onhand"
                :label="t('OH')"
                class="col-1 maintext"
                bg-color="input"
                label-color="secondary"
                dense
                type="input"
                @keyup.enter="handleLineEnter(index, $event)"
                disable
              />
              <text-input
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
              <text-input
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
              <text-input
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
              <text-input
                outlined
                v-model="line.devliverydate"
                :label="t('Delivery Date')"
                dense
                type="date"
                class="col-2"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <text-input
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
              <text-input
                outlined
                v-model="line.serialnumber"
                :label="t('Serial No.')"
                dense
                class="col-3"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <text-input
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
              <text-input
                outlined
                v-model="line.ordernumber"
                :label="t('Order Number')"
                dense
                class="col-3"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <text-input
                outlined
                v-model="line.customerponumber"
                :label="t('PO Number')"
                dense
                class="col-3"
                bg-color="input"
                @keyup.enter="handleLineEnter(index, $event)"
              />
              <text-input
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
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Order Totals and Notes -->
    <div class="container q-mt-none q-mb-sm q-pa-sm">
      <div class="row justify-between items-end q-mt-sm">
        <div class="col">
          <text-input
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
          <text-input
            dense
            outlined
            class="col-sm-11 col-12"
            rows="2"
            autogrow
            bg-color="input"
            label-color="secondary"
            :label="t('Internal Notes')"
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
    <div v-if="isOrder" class="container q-mb-sm q-mt-none q-pa-sm">
      <div class="row q-mb-md">
        <h6 class="q-my-none q-pa-none text-secondary">{{ t("Payments") }}</h6>
        <s-button type="add-line" @click="addPayment" class="q-ml-md" />
      </div>
      <div
        v-for="(payment, index) in payments"
        :key="index"
        class="row q-mb-md justify-between container-bg q-pa-md"
      >
        <text-input
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
        <text-input
          outlined
          v-model="payment.source"
          :label="t('Source')"
          class="q-mt-sm"
          bg-color="input"
          label-color="secondary"
          dense
          @keyup.enter="handlePaymentEnter(index, $event)"
        />
        <text-input
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
          :options="openPaymentAccounts"
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
      <div class="row">
        <p class="q-my-xs maintext">
          <strong>Outstanding: {{ formatAmount(balance) }}</strong>
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="row q-mt-md justify-end">
      <s-button
        type="delete"
        @click="deleteOrder"
        class="q-mr-md"
        v-if="canDelete"
      />
      <s-button type="save" @click="saveOrder" class="q-mr-md" v-if="canPost" />
      <s-button type="post" @click="postOrder" class="q-mr-md" v-if="canPost" />
      <s-button type="new-number" @click="newNumber" class="q-mr-md" />
      <s-button
        type="post-as-new"
        @click="postOrderAsNew"
        class="q-mr-md"
        v-if="canPostAsNew"
      />
    </div>

    <q-separator class="q-my-sm" size="2px" v-if="orderId" />

    <div class="row q-gutter-x-md" v-if="orderId">
      <s-select
        :options="templates"
        option-label="label"
        option-value="value"
        map-options
        emit-value
        v-model="printOptions.template"
        search="label"
      />
      <s-select
        :options="['tex', 'html']"
        v-model="printOptions.format"
        class="mainbg"
        dense
        outlined
      />
      <s-select
        :options="printLocations"
        v-model="printOptions.location"
        class="mainbg"
        dense
        outlined
        map-options
        emit-value
        search="label"
      />
      <s-button type="print" @click="printOrder" v-if="orderId" />
      <s-button type="email" @click="toggleEmailDialog" v-if="orderId" />
    </div>

    <div class="row q-mt-md">
      <LastTransactions
        type="oe"
        :oe_type="type"
        :vc="vcType"
        class="col-12 col-lg-6"
        ref="lastTransactionsRef"
      />
    </div>

    <!-- Add/Edit VC Dialog -->
    <q-dialog v-model="vcDialog">
      <q-card style="min-width: 80vw" class="q-pa-none">
        <q-card-section class="q-pa-none">
          <AddVC
            :id="dialogMode === 'edit' ? selectedVc.id : null"
            :type="vcType"
            @close="vcDialog = false"
            @saved="vcSaved"
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
            @saved="partSaved"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Email Dialog -->
    <q-dialog v-model="emailDialog">
      <q-card style="min-width: 500px" class="q-pa-sm">
        <q-card-section class="q-pa-none"> </q-card-section>
        <q-card-section>
          <EmailOptions
            :selectedVc="vc"
            :orderId="orderId"
            :orderNumber="formData.number"
            :type="type"
            :vcType="vcType"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Loading Spinner -->
    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import draggable from "vuedraggable";
import { api } from "src/boot/axios";
import { Notify, date } from "quasar";
import { formatAmount, confirmDelete } from "src/helpers/utils";
import AddVC from "src/pages/arap/AddVC.vue";
import AddPart from "src/pages/goodservices/AddPart.vue";
import EmailOptions from "src/components/EmailOptions.vue";
import LastTransactions from "src/components/LastTransactions.vue";

// Props
const props = defineProps({
  id: {
    type: [String, Number],
    default: null,
  },
});
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const $q = useQuasar();
const updateTitle = inject("updateTitle");
const { formatDate } = date;
const getTodayDate = () => formatDate(new Date(), "YYYY-MM-DD");

// LastTransactions ref
const lastTransactionsRef = ref(null);

// Route parameters
const type = computed(() => route.params.type); // 'order' or 'quotation'
const vcType = computed(() => route.params.vc); // 'customer' or 'vendor'

// Computed properties for dynamic labels
const pageTitle = computed(() => {
  if (type.value === "order") {
    return vcType.value === "customer" ? "Sales Order" : "Purchase Order";
  } else {
    return vcType.value === "customer" ? "Quotation" : "Request For Quotation";
  }
});

// Update page title
updateTitle(pageTitle.value);

const vcLabel = computed(() => {
  return vcType.value === "customer" ? "Customer" : "Vendor";
});

const vcNumberField = computed(() => {
  return vcType.value === "customer" ? "customernumber" : "vendornumber";
});

const dateFieldLabel = computed(() => {
  return type.value === "order" ? "Order Date" : "Quotation Date";
});

const requiredByLabel = computed(() => {
  if (type.value === "quotation") {
    return vcType.value === "customer" ? "Valid Until" : "Required By";
  }
  return "Required By";
});

const numberFieldLabel = computed(() => {
  if (type.value === "order") {
    return vcType.value === "customer" ? "Order Number" : "PO Number";
  } else {
    return vcType.value === "customer" ? "Quotation Number" : "RFQ Number";
  }
});

const isOrder = computed(() => type.value === "order");

// Line counter for dynamic elements
let lineId = 1;

// Reactive data
const selectedVc = ref(null);
const vcList = ref([]);
const vc = ref(null);
const formData = ref({
  date: getTodayDate(),
  requiredBy: "",
  number: "",
});

// Additional form fields
const selectedCurrency = ref(null);
const currencies = ref([]);
const exchangeRate = ref(1);
const description = ref("");
const shippingPoint = ref("");
const shipVia = ref("");
const wayBill = ref("");
const selectedDepartment = ref(null);
const departments = ref([]);
const lockNumber = ref(false);
const notes = ref("");
const intnotes = ref("");

// Order ID and print options
const orderId = ref(route.query.id ? `${route.query.id}` : "");
const loading = ref(false);

// Dynamic templates based on order type
const templates = computed(() => {
  if (type.value === "order") {
    return vcType.value === "customer"
      ? [{ label: t("Sales Order"), value: "sales_order" }]
      : [{ label: t("Purchase Order"), value: "purchase_order" }];
  } else {
    return vcType.value === "customer"
      ? [{ label: t("Sales Quotation"), value: "sales_quotation" }]
      : [{ label: t("Request for Quotation"), value: "request_quotation" }];
  }
});

const printLocations = [
  { label: t("Screen"), value: "screen" },
  { label: t("Download"), value: "download" },
];

const printOptions = ref({
  template: "sales_order", // Will be updated dynamically
  format: "tex",
  location: "screen",
});

// Update template based on order type
const updatePrintTemplate = () => {
  if (type.value === "order") {
    printOptions.value.template =
      vcType.value === "customer" ? "sales_order" : "purchase_order";
  } else {
    printOptions.value.template =
      vcType.value === "customer" ? "sales_quotation" : "request_quotation";
  }
};

// Line items
const lines = ref([
  {
    id: lineId++,
    lineitemdetail: false,
    partnumber: "",
    description: "",
    qty: 1,
    onhand: "",
    unit: "",
    price: 0,
    discount: 0,
    extended: 0,
    project: null,
    devliverydate: "",
    itemnotes: "",
    serialnumber: "",
    costvendor: "",
    cost: 0,
    ordernumber: "",
    customerponumber: "",
    package: "",
    netweight: 0,
    weight: 0,
  },
]);
const items = ref([]);
const lineSelects = ref([]);
const descriptionInputs = ref([]);
const dragging = ref(false);
const filteredProjects = ref([]);

// =====================
// Data: VCs, Items, Accounts, Links, and Currencies
// =====================

// VCs (Customers/Vendors)
const fetchVcList = async () => {
  try {
    const endpoint =
      vcType.value === "customer" ? "/arap/list/customer" : "/arap/list/vendor";
    const response = await api.get(endpoint);
    vcList.value = response.data;
  } catch (error) {
    console.log(error);
  }
};

const fetchVc = async (id) => {
  try {
    const endpoint =
      vcType.value === "customer"
        ? `/arap/list/customer/${id}`
        : `/arap/list/vendor/${id}`;
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const vcSaved = async (savedEntity) => {
  await fetchVcList();
  selectedVc.value = vcList.value.find((vc) => vc.id == savedEntity.id);
  await vcUpdate(selectedVc.value);
  vcDialog.value = false;
};

// Open Product (Part) Dialog for Editing
const openEditPart = (line) => {
  selectedPartLine.value = line;
  // Determine type based on inventory_accno_id property
  selectedPartType.value =
    line.partnumber && line.partnumber.inventory_accno_id ? "part" : "service";
  partDialog.value = true;
};

const openAddPart = (type) => {
  selectedPartType.value = type;
  partDialog.value = true;
};

const partSaved = async () => {
  // When a part is saved, re-fetch the items list.
  await fetchItems();
  partDialog.value = false;
};

// Items
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
const paymentAccounts = ref([]);
const defaultPaymentAccount = ref(null);
const openPaymentAccounts = ref([]);

const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    const accounts = response.data;
    paymentAccounts.value = accounts.filter((account) =>
      account.link.split(":").includes("AR_paid")
    );
    defaultPaymentAccount.value = paymentAccounts.value[0];
    openPaymentAccounts.value = paymentAccounts.value.filter(
      (account) => account.closed === 0
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

// Links & Currencies & Projects
const fetchLinks = async () => {
  try {
    const endpoint =
      vcType.value === "customer"
        ? "/create_links/customer"
        : "/create_links/vendor";
    const response = await api.get(endpoint);
    departments.value = response.data.departments;
    currencies.value = response.data.currencies;
    lockNumber.value = response.data.locknumber == 1 ? true : false;
    closedto.value = response.data.closedto;
    revtrans.value = response.data.revtrans;
    taxes.value = response.data.tax_accounts;
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

// Additional data
const taxes = ref([]);
const closedto = ref(null);
const revtrans = ref(null);
const projects = ref([]);

// =====================
// Dialogs: VC & Product
// =====================
// VC Dialog
const vcDialog = ref(false);
const dialogMode = ref("add"); // "add" or "edit"

// Product (Part) Dialog
const partDialog = ref(false);
const selectedPartLine = ref(null);
const selectedPartType = ref("");

// Email Dialog
const emailDialog = ref(false);

// =====================
// Payments Handling
// =====================
const paymentmethod_id = ref(null);
const paymentDateInputs = ref([]);
const payments = ref([
  {
    date: getTodayDate(),
    source: "",
    memo: "",
    amount: 0,
    account: null,
    exchangerate: 1,
  },
]);

// Computed totals
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

const taxTotal = computed(() => {
  return invoiceTaxes.value.reduce((acc, tax) => {
    return acc + (parseFloat(tax.amount) || 0);
  }, 0);
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

const totalPaid = computed(() => {
  return payments.value.reduce((acc, payment) => {
    return acc + (parseFloat(payment.amount) || 0);
  }, 0);
});

const balance = computed(() => {
  return total.value - totalPaid.value;
});

// Add computed properties to control button visibility
const canPost = computed(
  () =>
    (!closedto.value ||
      !originalOrderDate.value ||
      originalOrderDate.value > closedto.value) &&
    (!closedto.value || formData.value.date > closedto.value)
);

const canPostAsNew = computed(
  () =>
    orderId.value && (!closedto.value || formData.value.date > closedto.value)
);

const canDelete = computed(
  () =>
    orderId.value &&
    (!closedto.value ||
      !originalOrderDate.value ||
      originalOrderDate.value > closedto.value) &&
    revtrans.value != 1
);

// Add originalOrderDate ref to track the original order date for existing orders
const originalOrderDate = ref(null);

// Methods
const vcUpdate = async (newValue) => {
  if (!newValue) {
    vc.value = {};
    return;
  }
  vc.value = await fetchVc(newValue.id);
  vc.value.taxaccounts = vc.value.taxaccounts || "";
  const taxAccountsArray = vc.value.taxaccounts.split(" ");
  const paymentAccountAccno = vc.value?.payment_accno?.split("--")[0] || "";
  if (!paymentmethod_id.value) {
    defaultPaymentAccount.value =
      paymentAccounts.value.find(
        (account) => account.accno === paymentAccountAccno
      ) || paymentAccounts.value[0];
  } else {
    defaultPaymentAccount.value =
      paymentAccounts.value.find(
        (account) => account.id === paymentmethod_id.value
      ) || paymentAccounts.value[0];
  }
  payments.value.forEach(
    (payment) =>
      payment.amount === 0 && (payment.account = defaultPaymentAccount.value)
  );
  if (vc.value?.currency) {
    const vcCurrency = currencies.value.find(
      (curr) => curr.curr === vc.value.currency
    );
    if (vcCurrency) {
      selectedCurrency.value = vcCurrency;
    } else {
      console.warn(
        `Currency ${vc.value.currency} not found in available currencies`
      );
    }
  }
  calculateTaxes();

  // Refresh last transactions when VC changes
  if (lastTransactionsRef.value) {
    lastTransactionsRef.value.fetchTransactions();
  }
};

const openEditVc = () => {
  if (!selectedVc.value) return;
  dialogMode.value = "edit";
  vcDialog.value = true;
};

const openAddVc = () => {
  dialogMode.value = "add";
  vcDialog.value = true;
};

const addLine = () => {
  const newLine = {
    id: lineId++,
    partnumber: "",
    description: "",
    qty: 1,
    onhand: 0,
    unit: "",
    price: 0,
    discount: 0,
    extended: 0,
    lineitemdetail: false,
    project: null,
    devliverydate: "",
    itemnotes: "",
    serialnumber: "",
    costvendor: "",
    cost: 0,
    ordernumber: "",
    customerponumber: "",
    package: "",
    netweight: 0,
    weight: 0,
  };
  lines.value.push(newLine);
};

const removeLine = (index) => {
  lines.value.splice(index, 1);
};

const addLineAt = (index) => {
  const newLine = {
    id: lineId++,
    partnumber: "",
    description: "",
    qty: 1,
    onhand: 0,
    unit: "",
    price: 0,
    discount: 0,
    extended: 0,
    lineitemdetail: false,
    project: null,
    devliverydate: "",
    itemnotes: "",
    serialnumber: "",
    costvendor: "",
    cost: 0,
    ordernumber: "",
    customerponumber: "",
    package: "",
    netweight: 0,
    weight: 0,
  };
  lines.value.splice(index + 1, 0, newLine);
  nextTick(() => {
    const newIndex = index + 1;
    // Focus on the new line if needed
  });
};

const handleLineItemChange = (newValue, index) => {
  if (dragging.value) return;
  if (newValue && newValue.partnumber) {
    if (!newValue.noupdate) {
      console.log(newValue);
      const line = lines.value[index];
      line.description = newValue.partnumber.description || "";
      line.onhand = newValue.partnumber.onhand || "";
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

const handleLineEnter = (index, event) => {
  // Handle enter key on line items
};

const calculateExtended = (qty, price, discount) => {
  const baseValue = qty * price;
  const discountedValue = baseValue - (baseValue * discount) / 100;
  return discountedValue.toFixed(2);
};

// =====================
// Taxes & Totals Calculation
// =====================
const taxIncluded = ref(false);
const invoiceTaxes = ref([]);

const calculateTaxes = () => {
  if (!vc.value) {
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
          vc.value.taxaccounts &&
          vc.value.taxaccounts.split(" ").includes(taxAccount)
        ) {
          const name =
            vc.value[`${taxAccount}_description`] || "Tax Name Not Found";

          // Find the applicable tax rate based on order date
          const applicableTaxes = taxes.value
            .filter((tax) => tax.accno === taxAccount)
            .filter((tax) => {
              // Include if validto is null (currently valid) or greater than order date
              return (
                !tax.validto ||
                new Date(tax.validto) > new Date(formData.value.date)
              );
            })
            .sort((a, b) => {
              // Sort by validto date, null values last
              if (!a.validto) return 1;
              if (!b.validto) return -1;
              return new Date(a.validto) - new Date(b.validto);
            });

          // Use the most recent applicable tax rate
          const taxRate =
            applicableTaxes.length > 0 ? applicableTaxes[0].rate : 0;

          let taxAmount = 0;
          let netAmount = parseFloat(line.extended);
          if (taxIncluded.value) {
            taxAmount = netAmount * (taxRate / (1 + taxRate));
            netAmount -= taxAmount;
          } else {
            taxAmount = netAmount * taxRate;
          }
          const existingTax = invoiceTaxes.value.find(
            (tax) => tax.name === `${name} ${(taxRate * 100).toFixed(2)}%`
          );
          if (existingTax) {
            existingTax.amount += parseFloat(taxAmount.toFixed(2));
          } else {
            invoiceTaxes.value.push({
              name: `${name} ${(taxRate * 100).toFixed(2)}%`,
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

const toggleDetail = (line) => {
  line.lineitemdetail = !line.lineitemdetail;
};

const filterProjects = () => {
  if (!formData.value.date) return;

  filteredProjects.value = projects.value.filter((project) => {
    const start = project.startdate ? new Date(project.startdate) : null;
    const end = project.enddate ? new Date(project.enddate) : null;
    const orderDateObj = new Date(formData.value.date);

    if (!start && !end) return true; // Include if both are null
    if (!start) return orderDateObj <= end; // Include if only end date exists
    if (!end) return orderDateObj >= start; // Include if only start date exists

    return orderDateObj >= start && orderDateObj <= end; // Include if within range
  });
};

const addPaymentAt = (index) => {
  const newPayment = {
    date: getTodayDate(),
    source: "",
    memo: "",
    amount: 0,
    account: paymentmethod_id.value
      ? openPaymentAccounts.value.find(
          (acc) => acc.id == paymentmethod_id.value
        )
      : defaultPaymentAccount.value,
    exchangerate: 1,
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

const post = () => {
  // Post the order/quotation
  $q.notify({
    type: "positive",
    message: t("Posted successfully"),
  });
};

// New button methods
const saveOrder = async () => {
  try {
    const orderData = formatOrderData();

    // Make API call to save order
    const endpoint = `/oe/${type.value}/${vcType.value}${
      orderId.value ? `/${orderId.value}` : ""
    }`;
    const response = await api.post(endpoint, orderData);

    if (response.data && response.data.id) {
      orderId.value = response.data.id;
      Notify.create({
        message: t("Order saved successfully"),
        type: "positive",
        position: "top-right",
      });
      // Stay on the page after saving
      await fetchOrder(response.data.id);
      // Refresh last transactions
      if (lastTransactionsRef.value) {
        lastTransactionsRef.value.fetchTransactions();
      }
    }
  } catch (error) {
    console.error("Error saving order:", error);
    Notify.create({
      message: error.response?.data?.message || t("Error saving order"),
      type: "negative",
      position: "center",
    });
  }
};

const postOrder = async () => {
  if (!selectedVc.value) {
    Notify.create({
      message: t("VC is required."),
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

  try {
    loading.value = true;
    // Format data according to backend expectations
    const orderData = formatOrderData();

    // Make API call
    const endpoint = `/oe/${type.value}/${vcType.value}${
      orderId.value ? `/${orderId.value}` : ""
    }`;
    const response = await api.post(endpoint, orderData);

    Notify.create({
      message: t("Order posted successfully"),
      type: "positive",
      position: "top-right",
    });

    const id = response.data.id;
    if (route.query.callback) {
      const query = { ...route.query, search: 1 };
      router.push({ path: route.query.callback, query: query });
    } else {
      resetForm();
      // Refresh last transactions
      if (lastTransactionsRef.value) {
        lastTransactionsRef.value.fetchTransactions();
      }
    }
  } catch (error) {
    console.error("Error posting order:", error);
    Notify.create({
      message: error.response?.data?.message || t("Error posting order"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const newNumber = async () => {
  try {
    // Determine the correct module name for the backend
    let module;
    if (type.value === "order") {
      module = vcType.value === "customer" ? "customer_order" : "vendor_order";
    } else {
      module =
        vcType.value === "customer" ? "customer_quotation" : "vendor_quotation";
    }

    // API call to get next available number
    const endpoint = `/next_number/${module}`;
    const response = await api.get(endpoint);

    if (response.data && response.data.number) {
      formData.value.number = response.data.number;
      Notify.create({
        message: t("New number generated"),
        type: "positive",
        position: "top-right",
      });
    }
  } catch (error) {
    console.error("Error generating new number:", error);
    Notify.create({
      message:
        error.response?.data?.message || t("Error generating new number"),
      type: "negative",
      position: "center",
    });
  }
};

const postOrderAsNew = async () => {
  try {
    loading.value = true;
    // Clear the order ID to create a new order
    const currentOrderId = orderId.value;
    orderId.value = "";

    // Use the same logic as postOrder but without the existing ID
    const orderData = formatOrderData();

    // Make API call to create new order
    const endpoint = `/oe/${type.value}/${vcType.value}`;
    const response = await api.post(endpoint, orderData);

    Notify.create({
      message: t("Order posted as new successfully"),
      type: "positive",
      position: "top-right",
    });

    const id = response.data.id;
    if (route.query.callback) {
      const query = { ...route.query, search: 1 };
      router.push({ path: route.query.callback, query: query });
    } else {
      resetForm();
    }
  } catch (error) {
    console.error("Error posting order as new:", error);
    Notify.create({
      message: error.response?.data?.message || t("Error posting order as new"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const deleteOrder = async () => {
  if (!orderId.value) {
    Notify.create({
      message: t("No order to delete"),
      type: "negative",
      position: "center",
    });
    return;
  }

  try {
    const confirmed = await confirmDelete(
      t("Are you sure you want to delete this order?")
    );
    if (!confirmed) return;

    const endpoint = `/oe/${type.value}/${vcType.value}/${orderId.value}`;
    await api.delete(endpoint);

    Notify.create({
      message: t("Order deleted successfully"),
      type: "positive",
      position: "top-right",
    });

    // Reset form or redirect
    orderId.value = "";
    // You might want to redirect to a new order or clear the form
    // window.location.href = `/oe/${type.value}/${vcType.value}`;
  } catch (error) {
    console.error("Error deleting order:", error);
    Notify.create({
      message: error.response?.data?.message || t("Error deleting order"),
      type: "negative",
      position: "center",
    });
  }
};

const printOrder = async () => {
  loading.value = true;
  if (!orderId.value) {
    Notify.create({
      message: t("Order ID is required"),
      type: "negative",
      position: "center",
    });
    return;
  }
  try {
    const response = await api.get(
      `/print_oe/${type.value}/${vcType.value}/${orderId.value}?template=${printOptions.value.template}&format=${printOptions.value.format}`,
      {
        responseType: "blob",
      }
    );
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    if (printOptions.value.location === "screen") {
      // Open PDF in a new tab or window
      window.open(url, "_blank");
    } else {
      // Download PDF
      const a = document.createElement("a");
      a.href = url;
      a.download = `${printOptions.value.template}_${orderId.value}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    // Clean up the object URL after a short delay
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    loading.value = false;
  } catch (error) {
    Notify.create({
      message: t("Failed to download order"),
      type: "negative",
      position: "center",
    });
    console.error("Error downloading order:", error);
    loading.value = false;
  }
};

const toggleEmailDialog = () => {
  emailDialog.value = !emailDialog.value;
};

// =====================
// Reset Form Function
// =====================
const resetForm = () => {
  selectedVc.value = null;
  vc.value = null;
  selectedCurrency.value = null;
  shippingPoint.value = "";
  shipVia.value = "";
  wayBill.value = "";
  description.value = "";
  notes.value = "";
  intnotes.value = "";
  formData.value = {
    date: getTodayDate(),
    requiredBy: "",
    number: "",
  };
  lines.value = [
    {
      id: lineId++,
      partnumber: null,
      description: "",
      qty: 1,
      onhand: "",
      unit: "",
      price: 0,
      discount: 0,
      extended: 0,
      project: null,
      devliverydate: "",
      itemnotes: "",
      serialnumber: "",
      costvendor: "",
      cost: 0,
      ordernumber: "",
      customerponumber: "",
      package: "",
      netweight: 0,
      weight: 0,
    },
  ];
  payments.value = [
    {
      date: getTodayDate(),
      source: "",
      memo: "",
      amount: 0,
      account: null,
      exchangerate: 1,
    },
  ];
  exchangeRate.value = 1;
  selectedDepartment.value = null;
  orderId.value = "";
  originalOrderDate.value = null;
};

// Helper function to format order data for API calls
const formatOrderData = () => {
  return {
    // Basic order details
    number: formData.value.number,
    description: description.value,
    date: formData.value.date,
    requiredBy: formData.value.requiredBy,
    currency: selectedCurrency.value.curr,
    exchangerate: selectedCurrency.value.rn !== 1 ? exchangeRate.value : 1,
    notes: notes.value,
    intnotes: intnotes.value,
    till: "",
    department: selectedDepartment.value
      ? selectedDepartment.value.description
      : "",
    ponumber: "",
    terms: 0,
    closed: 0,
    backorder: 0,

    // VC information
    customer_id: vcType.value === "customer" ? selectedVc.value.id : null,
    customer: vcType.value === "customer" ? selectedVc.value.name : "",
    vendor_id: vcType.value === "vendor" ? selectedVc.value.id : null,
    vendor: vcType.value === "vendor" ? selectedVc.value.name : "",

    // Shipping information
    shippingPoint: shippingPoint.value,
    shipVia: shipVia.value,
    wayBill: wayBill.value,

    // Ship-to address (from VC)
    shipto: vc.value
      ? {
          name: vc.value.name || "",
          street: vc.value.street || "",
          address1: vc.value.address1 || "",
          address2: vc.value.address2 || "",
          post_office: vc.value.post_office || "",
          city: vc.value.city || "",
          state: vc.value.state || "",
          zipcode: vc.value.zipcode || "",
          country: vc.value.country || "",
          contact: vc.value.contact || "",
          phone: vc.value.phone || "",
          fax: vc.value.fax || "",
          email: vc.value.email || "",
        }
      : {},

    // Line items
    lines: lines.value
      .filter((line) => line.partnumber && line.partnumber.id)
      .map((line) => ({
        number: line.partnumber.id,
        parts_id: line.partnumber.id,
        description: line.description,
        qty: parseFloat(line.qty) || 0,
        ship: 0,
        price: parseFloat(line.price) || 0,
        discount: parseFloat(line.discount) || 0,
        unit: line.unit || "",
        lineitemdetail: line.lineitemdetail ? 1 : 0,
        deliverydate: line.devliverydate || "",
        reqdate: line.devliverydate || "",
        itemnotes: line.itemnotes || "",
        ordernumber: line.ordernumber || "",
        serialnumber: line.serialnumber || "",
        customerponumber: line.customerponumber || "",
        costvendor: line.costvendor || "",
        package: line.package || "",
        volume: 0,
        netweight: parseFloat(line.netweight) || 0,
        grossweight: parseFloat(line.weight) || 0,
        weight: parseFloat(line.weight) || 0,
        cost: parseFloat(line.cost) || 0,
        project: line.project || "",
        project_id: line.project || "",
        taxaccounts: "",
      })),

    // Payments
    payments: payments.value
      .filter((payment) => payment.amount > 0)
      .map((payment) => ({
        date: payment.date,
        source: payment.source || "",
        memo: payment.memo || "",
        amount: parseFloat(payment.amount) || 0,
        account: payment.account ? payment.account.accno : "",
        exchangerate: parseFloat(payment.exchangerate) || 1,
      })),

    // Taxes
    taxincluded: taxIncluded.value ? 1 : 0,
    taxes: invoiceTaxes.value.map((tax) => ({
      accno: tax.acc,
      rate: tax.rate,
    })),

    department_id: selectedDepartment.value ? selectedDepartment.value.id : "",
    warehouse: "",
    warehouse_id: "",
    files: [],
  };
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

// Add watcher for order date .changes
watch(
  formData,
  () => {
    calculateTaxes();
  },
  { deep: true }
);

watch(partDialog, () => {
  if (!partDialog.value) {
    selectedPartLine.value = null;
    selectedPartType.value = "";
  }
});

// Fetch existing order for editing
const fetchOrder = async (id) => {
  try {
    const endpoint = `/oe/${type.value}/${vcType.value}/${id}`;
    const response = await api.get(endpoint);
    const orderData = response.data;

    // Populate form with existing data
    formData.value = {
      date: orderData.transdate || getTodayDate(),
      requiredBy: orderData.reqdate || "",
      number: orderData.ordnumber || orderData.quonumber || "",
    };

    description.value = orderData.description || "";
    shippingPoint.value = orderData.shippingpoint || "";
    shipVia.value = orderData.shipvia || "";
    wayBill.value = orderData.waybill || "";
    notes.value = orderData.notes || "";
    intnotes.value = orderData.intnotes || "";
    exchangeRate.value = orderData.exchangerate || 1;
    taxIncluded.value = orderData.taxincluded === 1;

    // Set currency
    if (orderData.currency) {
      const currency = currencies.value.find(
        (c) => c.curr === orderData.currency
      );
      if (currency) {
        selectedCurrency.value = currency;
      }
    }

    // Set department
    if (orderData.department) {
      const department = departments.value.find(
        (d) => d.description === orderData.department
      );
      if (department) {
        selectedDepartment.value = department;
      }
    }

    // Set VC
    if (orderData.customer_id || orderData.vendor_id) {
      const vcId = orderData.customer_id || orderData.vendor_id;
      const vc = vcList.value.find((v) => v.id === vcId);
      if (vc) {
        selectedVc.value = vc;
        await vcUpdate(vc);
      }
    }

    // Populate line items
    if (orderData.lines && orderData.lines.length > 0) {
      lines.value = orderData.lines.map((line, index) => ({
        id: lineId++,
        lineitemdetail: line.lineitemdetail === 1,
        partnumber: items.value.find((item) => item.id === line.id) || "",
        description: line.description || "",
        qty: parseFloat(line.qty) || 1,
        onhand: line.onhand || "",
        unit: line.unit || "",
        price: parseFloat(line.price) || 0,
        discount: parseFloat(line.discount) || 0,
        extended:
          parseFloat(line.sellprice) *
          (parseFloat(line.qty) || 1) *
          (1 - (parseFloat(line.discount) || 0) / 100),
        project: line.projectnumber || null,
        devliverydate: line.reqdate || "",
        itemnotes: line.itemnotes || "",
        serialnumber: line.serialnumber || "",
        costvendor: line.costvendor || "",
        cost: parseFloat(line.cost) || 0,
        ordernumber: line.ordernumber || "",
        customerponumber: line.customerponumber || "",
        package: line.package || "",
        netweight: parseFloat(line.netweight) || 0,
        weight: parseFloat(line.grossweight) || 0,
      }));
    }

    // Populate payments
    if (orderData.payments && orderData.payments.length > 0) {
      payments.value = orderData.payments.map((payment) => ({
        date: payment.datepaid || getTodayDate(),
        source: payment.source || "",
        memo: payment.memo || "",
        amount: parseFloat(payment.amount) || 0,
        account:
          paymentAccounts.value.find((acc) => acc.accno === payment.account) ||
          null,
        exchangerate: parseFloat(payment.exchangerate) || 1,
      }));
    }

    // Set original order date for validation
    originalOrderDate.value = orderData.transdate;
  } catch (error) {
    console.error("Error fetching order:", error);
    Notify.create({
      message: error.response?.data?.message || t("Error loading order"),
      type: "negative",
      position: "center",
    });
  }
};

// Load initial data
onMounted(async () => {
  try {
    await Promise.all([
      fetchAccounts(),
      fetchLinks(),
      fetchItems(),
      fetchVcList(),
    ]);

    // Update print template based on current route
    updatePrintTemplate();

    // Load existing order/quotation if ID is provided
    if (route.query.id) {
      await fetchOrder(route.query.id);
    }
  } catch (error) {
    console.error("Error loading initial data:", error);
  }
});

// Watch for route changes to update print template
watch([type, vcType], () => {
  updatePrintTemplate();
});
</script>

<style scoped></style>
