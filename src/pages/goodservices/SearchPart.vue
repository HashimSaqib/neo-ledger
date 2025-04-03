<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent="search" class="q-px-sm q-py-sm mainbg">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <!-- Basic Info Section (common fields) -->
        <div class="row q-mt-sm q-gutter-sm">
          <q-input
            v-model="formData.partnumber"
            class="lightbg col-6 col-md-3"
            label="Number"
            outlined
            dense
          />
          <q-input
            v-model="formData.description"
            class="lightbg col-6 col-md-3"
            label="Description"
            outlined
            dense
          />
          <q-input
            v-model="formData.serialnumber"
            class="lightbg col-6 col-md-3"
            label="Serial Number"
            outlined
            dense
          />
          <!-- For parts and allitems, include extra fields -->
          <template v-if="itemType !== 'services'">
            <q-input
              v-model="formData.lot"
              class="lightbg col-6 col-md-3"
              label="Lot"
              outlined
              dense
            />
            <q-input
              v-model="formData.make"
              class="lightbg col-6 col-md-3"
              label="Make"
              outlined
              dense
            />
            <q-input
              v-model="formData.model"
              class="lightbg col-6 col-md-3"
              label="Model"
              outlined
              dense
            />
            <q-input
              v-model="formData.drawing"
              class="lightbg col-6 col-md-3"
              label="Drawing"
              outlined
              dense
            />
            <q-input
              v-model="formData.toolnumber"
              class="lightbg col-6 col-md-3"
              label="Tool Number"
              outlined
              dense
            />
            <q-input
              v-model="formData.microfiche"
              class="lightbg col-6 col-md-3"
              label="Microfiche"
              outlined
              dense
            />
            <q-input
              v-model="formData.barcode"
              class="lightbg col-6 col-md-3"
              label="Barcode"
              outlined
              dense
            />
          </template>
        </div>

        <!-- Item Status Section -->
        <div class="q-mt-sm">
          <div class="text-subtitle1">Item Status</div>
          <q-option-group
            v-model="formData.itemstatus"
            :options="itemStatusOptions"
            type="radio"
            inline
          />
        </div>

        <!-- Transaction Filters (common) -->
        <div class="row q-mt-sm">
          <div class="col-12">
            <div class="text-subtitle1">Transaction Filters</div>
          </div>
          <div class="col-12 row q-col-gutter-md">
            <q-toggle
              v-model="formData.sold"
              label="Sales Invoices"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.ordered"
              label="Sales Orders"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.quoted"
              label="Quotations"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.bought"
              label="Vendor Invoices"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.onorder"
              label="Purchase Orders"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.rfq"
              label="RFQ"
              :true-value="1"
              :false-value="0"
            />
          </div>
        </div>
        <div
          v-if="
            formData.sold ||
            formData.ordered ||
            formData.quoted ||
            formData.bought ||
            formData.onorder ||
            formData.rfq
          "
        >
          <div class="row q-mt-sm q-gutter-sm">
            <q-input
              v-model="formData.transdatefrom"
              type="date"
              label="Transaction Date From"
              outlined
              dense
              class="col-6 col-md-3"
            />
            <q-input
              v-model="formData.transdateto"
              type="date"
              label="Transaction Date To"
              outlined
              dense
              class="col-6 col-md-3"
            />
            <q-select
              v-model="formData.month"
              :options="monthOptions"
              label="Period: Month"
              outlined
              dense
              class="col-6 col-md-3"
            />
            <q-select
              v-model="formData.year"
              :options="yearOptions"
              label="Period: Year"
              outlined
              dense
              class="col-6 col-md-3"
            />
            <div class="col-12 q-mt-sm">
              <q-option-group
                v-model="formData.interval"
                :options="intervalOptions"
                type="radio"
                inline
                label="Interval"
              />
            </div>
          </div>

          <!-- Method, Status & Report Detail (common) -->
          <div class="row q-gutter-sm">
            <div class="col">
              <q-option-group
                v-model="formData.method"
                :options="methodOptions"
                type="radio"
                inline
                label="Method"
              />
            </div>
            <div class="col">
              <q-checkbox v-model="formData.open" label="Open" />
              <q-checkbox v-model="formData.closed" label="Closed" />
            </div>
            <div class="col">
              <q-option-group
                v-model="formData.summary"
                :options="summaryOptions"
                type="radio"
                inline
                label="Report Detail"
              />
            </div>
          </div>
        </div>

        <!-- Column Selection for Report -->
        <div class="q-py-md">
          <div class="text-subtitle1">Include in Report</div>
          <div class="row">
            <!-- The checkboxes here correspond to fields in the unified columns list -->
            <q-checkbox v-model="formData.l_runningnumber" label="No." />
            <q-checkbox v-model="formData.l_id" label="ID" />
            <q-checkbox v-model="formData.l_partnumber" label="Number" />
            <q-checkbox v-model="formData.l_description" label="Description" />
            <q-checkbox v-model="formData.l_onhand" label="Qty" />
            <q-checkbox v-model="formData.l_unit" label="Unit" />
            <q-checkbox v-model="formData.l_priceupdate" label="Updated" />
            <q-checkbox v-model="formData.l_lot" label="Lot" />
            <q-checkbox v-model="formData.l_expires" label="Expires" />
            <q-checkbox
              v-model="formData.l_checkinventory"
              label="Check Inventory"
            />
            <q-checkbox v-model="formData.l_cost" label="Cost" />
            <q-checkbox v-model="formData.l_sellprice" label="Sell Price" />
            <q-checkbox v-model="formData.l_listprice" label="List Price" />
            <q-checkbox v-model="formData.l_lastcost" label="Last Cost" />
            <q-checkbox v-model="formData.l_avgcost" label="Average Cost" />
            <q-checkbox v-model="formData.l_linetotal" label="Extended" />
            <q-checkbox v-model="formData.l_markup" label="Markup" />
            <q-checkbox v-model="formData.l_bin" label="Bin" />
            <q-checkbox v-model="formData.l_rop" label="ROP" />
            <q-checkbox v-model="formData.l_weight" label="Weight" />
            <q-checkbox v-model="formData.l_notes" label="Notes" />
            <q-checkbox v-model="formData.l_image" label="Image" />
            <q-checkbox v-model="formData.l_drawing" label="Drawing" />
            <q-checkbox v-model="formData.l_toolnumber" label="Tool Number" />
            <q-checkbox v-model="formData.l_microfiche" label="Microfiche" />
            <q-checkbox v-model="formData.l_make" label="Make" />
            <q-checkbox v-model="formData.l_model" label="Model" />
            <q-checkbox v-model="formData.l_account" label="Accounts" />
            <q-checkbox v-model="formData.l_name" label="Name" />
            <q-checkbox v-model="formData.l_curr" label="Currency" />
            <q-checkbox v-model="formData.l_employee" label="Employee" />
            <q-checkbox
              v-model="formData.l_serialnumber"
              label="Serial Number"
            />
            <q-checkbox
              v-model="formData.l_countryorigin"
              label="Country of Origin"
            />
            <q-checkbox v-model="formData.l_tariff_hscode" label="HS Code" />
            <q-checkbox v-model="formData.l_barcode" label="Barcode" />
            <q-checkbox v-model="formData.l_subtotal" label="Subtotal" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="row q-mt-sm">
          <q-btn type="submit" label="Search" color="primary" class="q-mr-sm" />
          <q-btn label="Clear" @click="clearForm" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Results Table -->
    <div v-if="results.length > 0">
      <q-table
        class="q-mt-sm"
        :rows="results"
        row-key="id"
        :columns="finalColumns"
        :rows-per-page-options="[0]"
        hide-bottom
        flat
        bordered
        dense
      >
        <template v-slot:body-cell-partnumber="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.partnumber }}
            </router-link>
          </q-td>
        </template>
        <template v-slot:body-cell="props">
          <q-td :props="props">
            <span
              v-if="
                ['sellprice', 'lastcost', 'listprice', 'onhand'].includes(
                  props.col.name
                )
              "
            >
              {{ formatAmount(props.row[props.col.name]) }}
            </span>
            <span v-else class="multiline">
              {{ props.row[props.col.name] }}
            </span>
          </q-td>
        </template>
        <template v-slot:body-cell-invnumber="props">
          <q-td :props="props">
            <router-link :to="getinvPath(props.row)" class="text-primary">
              {{ props.row.invnumber }}
            </router-link>
          </q-td>
        </template>
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <router-link :to="getVcPath(props.row)" class="text-primary">
              {{ props.row.name }}
            </router-link>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import { useRoute } from "vue-router";
import { Notify } from "quasar";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { formatAmount } from "src/helpers/utils";
const updateTitle = inject("updateTitle");

const { t } = useI18n();
const route = useRoute();

const itemType = ref(route.params.type || "items"); // expected: parts, services, allitems

const pageTitle = computed(() => {
  if (itemType.value === "allitems") return "Search All Items";
  if (itemType.value === "parts") return "Search Parts";
  if (itemType.value === "services") return "Search Services";
  return "Search Items";
});
updateTitle(pageTitle.value);
const filtersOpen = ref(true);
const results = ref([]);

// Unified reactive form data
const formData = ref({
  partnumber: "",
  description: "",
  serialnumber: "",
  lot: "",
  make: "",
  model: "",
  drawing: "",
  toolnumber: "",
  microfiche: "",
  barcode: "",
  itemstatus: "active",
  sold: 0,
  ordered: 0,
  quoted: 0,
  bought: 0,
  onorder: 0,
  rfq: 0,
  transdatefrom: "",
  transdateto: "",
  month: "",
  year: "",
  interval: "1",
  method: "accrual",
  open: false,
  closed: false,
  summary: "detail",

  // Report inclusion toggles
  l_runningnumber: false,
  l_id: false,
  l_partnumber: true,
  l_description: true,
  l_onhand: true,
  l_unit: false,
  l_priceupdate: false,
  l_lot: false,
  l_expires: false,
  l_checkinventory: false,
  l_cost: false,
  l_sellprice: true,
  l_listprice: false,
  l_lastcost: false,
  l_avgcost: false,
  l_linetotal: false,
  l_markup: false,
  l_bin: false,
  l_rop: false,
  l_weight: false,
  l_notes: true,
  l_image: false,
  l_drawing: false,
  l_toolnumber: false,
  l_microfiche: false,
  l_make: false,
  l_model: false,
  l_account: false,
  l_name: false,
  l_curr: false,
  l_employee: false,
  l_serialnumber: false,
  l_countryorigin: false,
  l_tariff_hscode: false,
  l_barcode: false,
  l_subtotal: false,
});

// Options for radio groups and selects
const itemStatusOptions = [
  { label: "Active", value: "active" },
  { label: "On Hand", value: "onhand" },
  { label: "Short", value: "short" },
  { label: "Obsolete", value: "obsolete" },
  { label: "Orphaned", value: "orphaned" },
];

const monthOptions = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const yearOptions = [
  { label: "2025", value: "2025" },
  // add more years as needed
];

const intervalOptions = [
  { label: "Current", value: "0" },
  { label: "Month", value: "1" },
  { label: "Quarter", value: "3" },
  { label: "Year", value: "12" },
];

const methodOptions = [
  { label: "Accrual", value: "accrual" },
  { label: "Cash", value: "cash" },
];

const summaryOptions = [
  { label: "Summary", value: "summary" },
  { label: "Detail", value: "detail" },
];

// Unified master list of columns (all possible fields)
const baseColumns = [
  {
    name: "runningnumber",
    label: "No.",
    field: "runningnumber",
    align: "left",
  },
  { name: "id", label: "ID", field: "id", align: "left" },
  { name: "partnumber", label: "Number", field: "partnumber", align: "left" },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "let",
  },
  { name: "notes", label: "Notes", field: "notes", align: "left" },
  {
    name: "onhand",
    label: "Qty",
    field: "onhand",
    align: "right",
    sortable: "true",
  },
  { name: "unit", label: "Unit", field: "unit", align: "left" },
  {
    name: "priceupdate",
    label: "Updated",
    field: "priceupdate",
    align: "left",
  },
  { name: "lot", label: "Lot", field: "lot", align: "left" },
  { name: "expires", label: "Expires", field: "expires", align: "left" },
  {
    name: "checkinventory",
    label: "Check Inventory",
    field: "checkinventory",
    align: "left",
  },
  { name: "cost", label: "Cost", field: "cost", align: "right" },
  {
    name: "sellprice",
    label: "Sell Price",
    field: "sellprice",
    align: "right",
  },
  {
    name: "listprice",
    label: "List Price",
    field: "listprice",
    align: "right",
  },
  { name: "lastcost", label: "Last Cost", field: "lastcost", align: "right" },
  { name: "avgcost", label: "Average Cost", field: "avgcost", align: "right" },
  { name: "linetotal", label: "Extended", field: "linetotal", align: "right" },
  { name: "markup", label: "Markup", field: "markup", align: "right" },
  { name: "bin", label: "Bin", field: "bin", align: "left" },
  { name: "rop", label: "ROP", field: "rop", align: "left" },
  { name: "weight", label: "Weight", field: "weight", align: "left" },

  { name: "image", label: "Image", field: "image", align: "left" },
  { name: "drawing", label: "Drawing", field: "drawing", align: "left" },
  {
    name: "toolnumber",
    label: "Tool Number",
    field: "toolnumber",
    align: "left",
  },
  {
    name: "microfiche",
    label: "Microfiche",
    field: "microfiche",
    align: "left",
  },
  { name: "make", label: "Make", field: "make", align: "left" },
  { name: "model", label: "Model", field: "model", align: "left" },
  { name: "account", label: "Accounts", field: "account", align: "left" },
  { name: "name", label: "Name", field: "name", align: "left" },
  { name: "curr", label: "Currency", field: "curr", align: "left" },
  { name: "employee", label: "Employee", field: "employee", align: "left" },
  {
    name: "serialnumber",
    label: "Serial Number",
    field: "serialnumber",
    align: "left",
  },
  {
    name: "countryorigin",
    label: "Country of Origin",
    field: "countryorigin",
    align: "left",
  },
  {
    name: "tariff_hscode",
    label: "HS Code",
    field: "tariff_hscode",
    align: "left",
  },
  { name: "barcode", label: "Barcode", field: "barcode", align: "left" },
  { name: "subtotal", label: "Subtotal", field: "subtotal", align: "right" },
];
const finalColumns = computed(() => {
  // 1. Filter out any columns the user has not toggled on.
  let cols = baseColumns.filter(
    (col) => formData.value["l_" + col.name] === true
  );

  // 2. If itemType is "services", remove the part-specific columns.
  if (itemType.value === "services") {
    const removeForServices = [
      "lot",
      "expires",
      "checkinventory",
      "cost",
      "bin",
      "rop",
      "weight",
      "image",
      "drawing",
      "toolnumber",
      "microfiche",
      "make",
      "model",
      "countryorigin",
      "tariff_hscode",
      "barcode",
    ];
    cols = cols.filter((col) => !removeForServices.includes(col.name));
  }

  // 3. If `sold` or `bought` is 1, insert 'invnumber' after 'lastcost'.
  if (formData.value.sold === 1 || formData.value.bought === 1) {
    const lastCostIndex = cols.findIndex((col) => col.name === "lastcost");
    if (lastCostIndex !== -1) {
      cols.splice(lastCostIndex + 1, 0, {
        name: "invnumber",
        label: "Invoice",
        field: "invnumber",
        align: "right",
      });
    }
  }

  // 4. If "accounts" is checked, remove the 'account' column and
  //    replace it with two columns: 'income' and 'expense'.
  if (formData.value.l_accounts === true) {
    // Find the 'account' column (if it exists after toggling).
    const accountIndex = cols.findIndex((col) => col.name === "account");
    if (accountIndex !== -1) {
      // Remove the 'account' column.
      cols.splice(accountIndex, 1);

      // Insert 'income' and 'expense' columns at the same position.
      cols.splice(
        accountIndex,
        0,
        {
          name: "income",
          label: "Income",
          field: "income",
          align: "right",
        },
        {
          name: "expense",
          label: "Expense",
          field: "expense",
          align: "right",
        }
      );
    }
  }

  return cols;
});

const searchItem = computed(() => {
  if (itemType.value === "allitems") return "allitems";
  if (itemType.value === "parts") return "part";
  if (itemType.value === "services") return "service";
});

function search() {
  const searchItemValue = searchItem.value;
  const params = {
    ...formData.value,
    searchitems: searchItemValue,
  };

  api
    .get("/ic/items", { params })
    .then((resp) => {
      results.value = resp.data;
      filtersOpen.value = false;
    })
    .catch((err) => {
      console.error(err);
      Notify.create({
        message: err.response?.data?.message || "Error performing search",
        type: "negative",
        position: "center",
      });
    });
}

// Clear the form to its default state.
function clearForm() {
  Object.keys(formData.value).forEach((key) => {
    if (typeof formData.value[key] === "boolean") {
      formData.value[key] = false;
    } else {
      formData.value[key] = "";
    }
  });
  // Reset default selections
  formData.value.itemstatus = "active";
  formData.value.method = "accrual";
  formData.value.summary = "detail";
}

const createLink = inject("createLink");
function getPath(row) {
  if (itemType.value === "services") {
    return { path: createLink("service.add"), query: { id: row.id } };
  }
  return { path: createLink("part.add"), query: { id: row.id } };
}
function getinvPath(row) {
  const base =
    row.module === "ir"
      ? createLink("vendor.invoice")
      : row.module === "is"
      ? createLink("customer.invoice")
      : "";

  return { path: base, query: { id: row.trans_id } };
}
function getVcPath(row) {
  const base = createLink($vc);

  return { path: base, query: { id: row.vc_id } };
}

onMounted(() => {});
</script>

<style scoped>
.drag-area {
  display: flex;
  flex-wrap: wrap;
}

/* Example: maintain table container height */
:deep(.q-table__container) {
  height: calc(100vh - 180px);
  position: relative;
}

/* Sticky header styles */
:deep(.q-table thead) {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}
.multiline {
  white-space: pre-wrap; /* Allows wrapping and respects newline characters */
  word-wrap: break-word; /* Helps prevent overly long words from overflowing */
}

:deep(.q-table td) {
  padding: 8px 16px;
}
</style>
