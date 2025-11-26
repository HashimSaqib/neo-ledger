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
            :label="t('Number')"
            outlined
            dense
          />
          <q-input
            v-model="formData.description"
            class="lightbg col-6 col-md-3"
            :label="t('Description')"
            outlined
            dense
          />
          <q-input
            v-model="formData.serialnumber"
            class="lightbg col-6 col-md-3"
            :label="t('Serial Number')"
            outlined
            dense
          />
          <!-- For parts and allitems, include extra fields -->
          <template v-if="itemType !== 'services'">
            <q-input
              v-model="formData.lot"
              class="lightbg col-6 col-md-3"
              :label="t('Lot')"
              outlined
              dense
            />
            <q-input
              v-model="formData.make"
              class="lightbg col-6 col-md-3"
              :label="t('Make')"
              outlined
              dense
            />
            <q-input
              v-model="formData.model"
              class="lightbg col-6 col-md-3"
              :label="t('Model')"
              outlined
              dense
            />
            <q-input
              v-model="formData.drawing"
              class="lightbg col-6 col-md-3"
              :label="t('Drawing')"
              outlined
              dense
            />
            <q-input
              v-model="formData.toolnumber"
              class="lightbg col-6 col-md-3"
              :label="t('Tool Number')"
              outlined
              dense
            />
            <q-input
              v-model="formData.microfiche"
              class="lightbg col-6 col-md-3"
              :label="t('Microfiche')"
              outlined
              dense
            />
            <q-input
              v-model="formData.barcode"
              class="lightbg col-6 col-md-3"
              :label="t('Barcode')"
              outlined
              dense
            />
          </template>
        </div>

        <!-- Item Status Section -->
        <div class="q-mt-sm">
          <div class="text-subtitle1">{{ t("Item Status") }}</div>
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
            <div class="text-subtitle1">{{ t("Transaction Filters") }}</div>
          </div>
          <div class="col-12 row q-col-gutter-md">
            <q-toggle
              v-model="formData.sold"
              :label="t('Sales Invoices')"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.ordered"
              :label="t('Sales Orders')"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.quoted"
              :label="t('Quotations')"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.bought"
              :label="t('Vendor Invoices')"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.onorder"
              :label="t('Purchase Orders')"
              :true-value="1"
              :false-value="0"
            />
            <q-toggle
              v-model="formData.rfq"
              :label="t('RFQ')"
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
              :label="t('Transaction Date From')"
              outlined
              dense
              class="col-6 col-md-3"
            />
            <q-input
              v-model="formData.transdateto"
              type="date"
              :label="t('Transaction Date To')"
              outlined
              dense
              class="col-6 col-md-3"
            />
            <q-select
              v-model="formData.month"
              :options="monthOptions"
              :label="t('Period: Month')"
              outlined
              dense
              class="col-6 col-md-3"
            />
            <q-select
              v-model="formData.year"
              :options="yearOptions"
              :label="t('Period: Year')"
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
                :label="t('Interval')"
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
                :label="t('Method')"
              />
            </div>
            <div class="col">
              <q-checkbox v-model="formData.open" :label="t('Open')" />
              <q-checkbox v-model="formData.closed" :label="t('Closed')" />
            </div>
            <div class="col">
              <q-option-group
                v-model="formData.summary"
                :options="summaryOptions"
                type="radio"
                inline
                :label="t('Report Detail')"
              />
            </div>
          </div>
        </div>

        <!-- Column Selection for Report -->
        <div class="q-py-md">
          <div class="text-subtitle1">{{ t("Include in Report") }}</div>
          <div class="row">
            <!-- The checkboxes here correspond to fields in the unified columns list -->
            <q-checkbox v-model="formData.l_runningnumber" :label="t('No.')" />
            <q-checkbox v-model="formData.l_id" :label="t('ID')" />
            <q-checkbox v-model="formData.l_partnumber" :label="t('Number')" />
            <q-checkbox
              v-model="formData.l_description"
              :label="t('Description')"
            />
            <q-checkbox v-model="formData.l_onhand" :label="t('Qty')" />
            <q-checkbox v-model="formData.l_unit" :label="t('Unit')" />
            <q-checkbox
              v-model="formData.l_priceupdate"
              :label="t('Updated')"
            />
            <q-checkbox v-model="formData.l_lot" :label="t('Lot')" />
            <q-checkbox v-model="formData.l_expires" :label="t('Expires')" />
            <q-checkbox
              v-model="formData.l_checkinventory"
              :label="t('Check Inventory')"
            />
            <q-checkbox v-model="formData.l_cost" :label="t('Cost')" />
            <q-checkbox
              v-model="formData.l_sellprice"
              :label="t('Sell Price')"
            />
            <q-checkbox
              v-model="formData.l_listprice"
              :label="t('List Price')"
            />
            <q-checkbox v-model="formData.l_lastcost" :label="t('Last Cost')" />
            <q-checkbox
              v-model="formData.l_avgcost"
              :label="t('Average Cost')"
            />
            <q-checkbox v-model="formData.l_linetotal" :label="t('Extended')" />
            <q-checkbox v-model="formData.l_markup" :label="t('Markup')" />
            <q-checkbox v-model="formData.l_bin" :label="t('Bin')" />
            <q-checkbox v-model="formData.l_rop" :label="t('ROP')" />
            <q-checkbox v-model="formData.l_weight" :label="t('Weight')" />
            <q-checkbox v-model="formData.l_notes" :label="t('Notes')" />
            <q-checkbox v-model="formData.l_image" :label="t('Image')" />
            <q-checkbox v-model="formData.l_drawing" :label="t('Drawing')" />
            <q-checkbox
              v-model="formData.l_toolnumber"
              :label="t('Tool Number')"
            />
            <q-checkbox
              v-model="formData.l_microfiche"
              :label="t('Microfiche')"
            />
            <q-checkbox v-model="formData.l_make" :label="t('Make')" />
            <q-checkbox v-model="formData.l_model" :label="t('Model')" />
            <q-checkbox v-model="formData.l_account" :label="t('Accounts')" />
            <q-checkbox v-model="formData.l_name" :label="t('Name')" />
            <q-checkbox v-model="formData.l_curr" :label="t('Currency')" />
            <q-checkbox v-model="formData.l_employee" :label="t('Employee')" />
            <q-checkbox
              v-model="formData.l_serialnumber"
              :label="t('Serial Number')"
            />
            <q-checkbox
              v-model="formData.l_countryorigin"
              :label="t('Country of Origin')"
            />
            <q-checkbox
              v-model="formData.l_tariff_hscode"
              :label="t('HS Code')"
            />
            <q-checkbox v-model="formData.l_barcode" :label="t('Barcode')" />
            <q-checkbox v-model="formData.l_subtotal" :label="t('Subtotal')" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="row q-mt-sm">
          <q-btn
            type="submit"
            :label="t('Search')"
            color="primary"
            class="q-mr-sm"
          />
          <q-btn :label="t('Clear')" @click="clearForm" />
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
const itemStatusOptions = computed(() => [
  { label: t("Active"), value: "active" },
  { label: t("On Hand"), value: "onhand" },
  { label: t("Short"), value: "short" },
  { label: t("Obsolete"), value: "obsolete" },
  { label: t("Orphaned"), value: "orphaned" },
]);

const monthOptions = computed(() => [
  { label: t("January"), value: "01" },
  { label: t("February"), value: "02" },
  { label: t("March"), value: "03" },
  { label: t("April"), value: "04" },
  { label: t("May"), value: "05" },
  { label: t("June"), value: "06" },
  { label: t("July"), value: "07" },
  { label: t("August"), value: "08" },
  { label: t("September"), value: "09" },
  { label: t("October"), value: "10" },
  { label: t("November"), value: "11" },
  { label: t("December"), value: "12" },
]);

const yearOptions = [
  { label: "2025", value: "2025" },
  // add more years as needed
];

const intervalOptions = computed(() => [
  { label: t("Current"), value: "0" },
  { label: t("Month"), value: "1" },
  { label: t("Quarter"), value: "3" },
  { label: t("Year"), value: "12" },
]);

const methodOptions = computed(() => [
  { label: t("Accrual"), value: "accrual" },
  { label: t("Cash"), value: "cash" },
]);

const summaryOptions = computed(() => [
  { label: t("Summary"), value: "summary" },
  { label: t("Detail"), value: "detail" },
]);

// Unified master list of columns (all possible fields)
const baseColumns = computed(() => [
  {
    name: "runningnumber",
    label: t("No."),
    field: "runningnumber",
    align: "left",
  },
  { name: "id", label: t("ID"), field: "id", align: "left" },
  {
    name: "partnumber",
    label: t("Number"),
    field: "partnumber",
    align: "left",
    sortable: true,
  },

  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
    sortable: true,
  },
  {
    name: "notes",
    label: t("Notes"),
    field: "notes",
    align: "left",
    sortable: true,
  },
  {
    name: "onhand",
    label: t("Qty"),
    field: "onhand",
    align: "right",
    sortable: true,
  },
  { name: "unit", label: t("Unit"), field: "unit", align: "left" },
  {
    name: "priceupdate",
    label: t("Updated"),
    field: "priceupdate",
    align: "left",
  },
  { name: "lot", label: t("Lot"), field: "lot", align: "left" },
  { name: "expires", label: t("Expires"), field: "expires", align: "left" },
  {
    name: "checkinventory",
    label: t("Check Inventory"),
    field: "checkinventory",
    align: "left",
  },
  {
    name: "cost",
    label: t("Cost"),
    field: "cost",
    align: "right",
    sortable: true,
  },
  {
    name: "sellprice",
    label: t("Sell Price"),
    field: "sellprice",
    align: "right",
    sortable: true,
  },
  {
    name: "listprice",
    label: t("List Price"),
    field: "listprice",
    align: "right",
    sortable: true,
  },
  {
    name: "lastcost",
    label: t("Last Cost"),
    field: "lastcost",
    align: "right",
  },
  {
    name: "avgcost",
    label: t("Average Cost"),
    field: "avgcost",
    align: "right",
  },
  {
    name: "linetotal",
    label: t("Extended"),
    field: "linetotal",
    align: "right",
  },
  { name: "markup", label: t("Markup"), field: "markup", align: "right" },
  { name: "bin", label: t("Bin"), field: "bin", align: "left" },
  { name: "rop", label: t("ROP"), field: "rop", align: "left" },
  { name: "weight", label: t("Weight"), field: "weight", align: "left" },

  { name: "image", label: t("Image"), field: "image", align: "left" },
  { name: "drawing", label: t("Drawing"), field: "drawing", align: "left" },
  {
    name: "toolnumber",
    label: t("Tool Number"),
    field: "toolnumber",
    align: "left",
  },
  {
    name: "microfiche",
    label: t("Microfiche"),
    field: "microfiche",
    align: "left",
  },
  { name: "make", label: t("Make"), field: "make", align: "left" },
  { name: "model", label: t("Model"), field: "model", align: "left" },
  { name: "account", label: t("Accounts"), field: "account", align: "left" },
  { name: "name", label: t("Name"), field: "name", align: "left" },
  { name: "curr", label: t("Currency"), field: "curr", align: "left" },
  { name: "employee", label: t("Employee"), field: "employee", align: "left" },
  {
    name: "serialnumber",
    label: t("Serial Number"),
    field: "serialnumber",
    align: "left",
  },
  {
    name: "countryorigin",
    label: t("Country of Origin"),
    field: "countryorigin",
    align: "left",
  },
  {
    name: "tariff_hscode",
    label: t("HS Code"),
    field: "tariff_hscode",
    align: "left",
  },
  { name: "barcode", label: t("Barcode"), field: "barcode", align: "left" },
  { name: "subtotal", label: t("Subtotal"), field: "subtotal", align: "right" },
]);
const finalColumns = computed(() => {
  // 1. Filter out any columns the user has not toggled on.
  let cols = baseColumns.value.filter(
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
    const lastCostIndex = cols.findIndex((col) => col.name === "description");
    if (lastCostIndex !== -1) {
      cols.splice(lastCostIndex + 1, 0, {
        name: "invnumber",
        label: t("Invoice"),
        field: "invnumber",
        align: "left",
        sortable: true,
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
          label: t("Income"),
          field: "income",
          align: "right",
        },
        {
          name: "expense",
          label: t("Expense"),
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
        message: err.response?.data?.message || t("Error performing search"),
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
