<template>
  <q-page class="q-pa-md q-py-sm lightbg relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm container">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="container-bg"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <div class="search-vc-params q-mt-md">
          <div class="flex-container search-vc-params__grid">
            <div class="container flex-container search-vc-params__search">
              <s-select
                v-model="formData.dropdown"
                :label="nameLabel"
                outlined
                dense
                :options="vCList"
                option-label="label"
                option-value="name"
                search="label"
                map-options
                emit-value
                clearable
                class="search-vc-field"
              />
              <text-input
                v-model="formData.name"
                :label="nameLabel"
                outlined
                dense
                class="search-vc-field"
              />
              <text-input
                v-model="formData[vcNumberProperty]"
                :label="numberLabel"
                outlined
                dense
                class="search-vc-field"
              />
              <text-input
                v-model="formData.contact"
                :label="t('Contact')"
                outlined
                dense
                class="search-vc-field"
              />
              <text-input
                v-model="formData.email"
                :label="t('E-mail')"
                type="email"
                outlined
                dense
                class="search-vc-field"
              />
              <text-input
                v-model="formData.phone"
                :label="t('Phone')"
                type="tel"
                outlined
                dense
                class="search-vc-field"
              />
              <text-input
                v-model="formData.address"
                :label="t('Address')"
                outlined
                dense
                class="search-vc-field"
              />
              <text-input
                v-model="formData.city"
                :label="t('City')"
                outlined
                dense
                class="search-vc-field"
              />
              <text-input
                v-model="formData.state"
                :label="t('State/Province')"
                outlined
                dense
                class="search-vc-field"
              />
              <text-input
                v-model="formData.zipcode"
                :label="t('Zip/Postal Code')"
                outlined
                dense
                class="search-vc-field"
              />
              <country-input
                v-model="formData.country"
                :label="t('Country')"
                outlined
                dense
                class="search-vc-field"
              />
            </div>

            <div class="container search-vc-params__filters">
              <draggable v-model="baseColumns" item-key="name" class="drag-area">
                <template #item="{ element }">
                  <q-checkbox
                    size="2rem"
                    v-model="selectedColumns[element.name]"
                    :label="t(element.label)"
                    color="primary"
                    class="q-mr-md maintext"
                  />
                </template>
              </draggable>
            </div>
          </div>
        </div>

        <div class="row q-mt-md justify-end">
          <s-button type="clear" @click="clearForm" class="q-mr-sm" />
          <s-button type="search" @click="search" />
        </div>
      </q-expansion-item>
    </q-form>

    <div v-if="displayRows.length > 0" class="table-styling q-mt-md">
      <q-table
        :rows="displayRows"
        row-key="uniqueRowId"
        :columns="finalColumns"
        flat
        bordered
        dense
        :rows-per-page-options="[0]"
        virtual-scroll
        virtual-scroll-sticky-end
      >
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.name }}
            </router-link>
          </q-td>
        </template>
        <template v-slot:body-cell="props">
          <q-td :props="props">
            <span v-if="numericColumnNames.has(props.col.name)">
              {{ formatAmount(props.row[props.col.name]) }}
            </span>
            <span v-else>
              {{ props.row[props.col.name] }}
            </span>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from "vue";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { LocalStorage, Notify } from "quasar";
import draggable from "vuedraggable";
import { useI18n } from "vue-i18n";
import { formatAmount } from "src/helpers/utils";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
const route = useRoute();

/** Table columns that should use amount formatting when visible */
const numericColumnNames = new Set([
  "creditlimit",
  "outstanding",
  "availablecredit",
  "discount",
  "threshold",
]);

const allColumns = computed(() => [
  {
    name: "customernumber",
    label: t("Customer Number"),
    field: "customernumber",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "vendornumber",
    label: t("Vendor Number"),
    field: "vendornumber",
    default: true,
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: t("Name"),
    field: "name",
    default: true,
    align: "left",
    sortable: true,
  },
  {
    name: "address",
    label: t("Address"),
    field: "address",
    default: true,
    align: "left",
    sortable: true,
  },
  {
    name: "salutation",
    label: t("Salutation"),
    field: "salutation",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "contact",
    label: t("Contact"),
    field: "contact",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "title",
    label: t("Title"),
    field: "title",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "gender",
    label: t("Gender"),
    field: "gender",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "occupation",
    label: t("Occupation"),
    field: "occupation",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "email",
    label: t("E-mail"),
    field: "email",
    default: true,
    align: "left",
    sortable: true,
  },
  {
    name: "cc",
    label: t("Cc"),
    field: "cc",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "bcc",
    label: t("Bcc"),
    field: "bcc",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "city",
    label: t("City"),
    field: "city",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "state",
    label: t("State/Province"),
    field: "state",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "zipcode",
    label: t("Zip/Postal Code"),
    field: "zipcode",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "country",
    label: t("Country"),
    field: "country",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "phone",
    label: t("Phone"),
    field: "phone",
    default: true,
    align: "left",
    sortable: true,
  },
  {
    name: "fax",
    label: t("Fax"),
    field: "fax",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "notes",
    label: t("Notes"),
    field: "notes",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "discount",
    label: t("Discount"),
    field: "discount",
    default: false,
    align: "right",
    sortable: true,
  },
  {
    name: "threshold",
    label: t("Threshold"),
    field: "threshold",
    default: false,
    align: "right",
    sortable: true,
  },
  {
    name: "accounts",
    label: t("Accounts"),
    field: "accounts",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "paymentmethod",
    label: t("Payment Method"),
    field: "paymentmethod",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "taxnumber",
    label: t("Tax Number"),
    field: "taxnumber",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "salesperson",
    label: t("Salesperson"),
    field: "salesperson",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "pricegroup",
    label: t("Pricegroup"),
    field: "pricegroup",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "sic",
    label: t("SIC"),
    field: "sic",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "bank",
    label: t("Bank"),
    field: "bank",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "iban",
    label: t("IBAN"),
    field: "iban",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "bic",
    label: t("BIC"),
    field: "bic",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "membernumber",
    label: t("Member Number"),
    field: "membernumber",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "bcnumber",
    label: t("BC Number"),
    field: "bcnumber",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "typeofbusiness",
    label: t("Type of Business"),
    field: "typeofbusiness",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "creditlimit",
    label: t("Credit Limit"),
    field: "creditlimit",
    default: false,
    align: "right",
    sortable: true,
  },
  {
    name: "outstanding",
    label: t("Outstanding"),
    field: "outstanding",
    default: false,
    align: "right",
    sortable: true,
  },
  {
    name: "availablecredit",
    label: t("Available Credit"),
    field: "availablecredit",
    default: false,
    align: "right",
    sortable: true,
  },
  {
    name: "terms",
    label: t("Terms"),
    field: "terms",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "language",
    label: t("Language"),
    field: "language",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "remittancevoucher",
    label: t("Remittance Voucher"),
    field: "remittancevoucher",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "startdate",
    label: t("Startdate"),
    field: "startdate",
    default: false,
    align: "left",
    sortable: true,
  },
  {
    name: "enddate",
    label: t("Enddate"),
    field: "enddate",
    default: false,
    align: "left",
    sortable: true,
  },
]);

const baseColumns = ref([]);

const vcType = ref(route.params.type || "customer");

const formData = ref({
  dropdown: "",
  name: "",
  contact: "",
  email: "",
  phone: "",
  customernumber: "",
  vendornumber: "",
  address: "",
  city: "",
  state: "",
  zipcode: "",
  country: "",
});

const nameLabel = ref(t("Customer"));
const numberLabel = ref(t("Customer Number"));

const vcNumberProperty = computed(() => {
  return vcType.value === "vendor" ? "vendornumber" : "customernumber";
});

const filtersOpen = ref(true);
const results = ref([]);

const displayRows = computed(() =>
  results.value.map((row, idx) => ({
    ...row,
    uniqueRowId: `${row.id}-${idx}`,
  })),
);

const selectedColumns = ref({});

const vCList = ref([]);
const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/${vcType.value}/`);
    vcType.value === "customer"
      ? (vCList.value = response.data.customers)
      : (vCList.value = response.data.vendors);
  } catch (error) {
    console.error("Failed to fetch links:", error);
    Notify.create({
      message: t("Failed to fetch links"),
      type: "negative",
      position: "center",
    });
  }
};

const finalColumns = computed(() =>
  baseColumns.value.filter(
    (col) => selectedColumns.value[col.name] === true,
  ),
);

const filterCookieName = computed(() => {
  return vcType.value === "vendor"
    ? "vendor_search_filters"
    : "customer_search_filters";
});

watch(
  [selectedColumns, baseColumns, filterCookieName],
  () => {
    const filters = {
      columns: selectedColumns.value,
      order: baseColumns.value.map((c) => c.name),
    };
    try {
      LocalStorage.set(filterCookieName.value, filters, { expires: 30 });
    } catch (error) {
      console.error("Error saving filters to cookies:", error);
    }
  },
  { deep: true },
);

function flattenParams(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      v === null ||
      v === undefined ||
      (typeof v === "string" && v.trim() === "") ||
      (typeof v === "boolean" && !v)
    ) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

async function search() {
  try {
    const endpoint =
      vcType.value === "vendor" ? "/arap/vendor/" : "/arap/customer/";
    const params = flattenParams(formData.value);
    params.name = formData.value.dropdown;
    const resp = await api.get(endpoint, { params });
    const rows = resp.data;
    results.value = Array.isArray(rows) ? rows : [];
    filtersOpen.value = false;
  } catch (err) {
    console.error(err);
    Notify.create({
      message:
        err.response?.data?.message ||
        err.response?.data?.error ||
        t("Error performing search"),
      type: "negative",
      position: "center",
    });
  }
}

function clearForm() {
  formData.value = {
    dropdown: "",
    name: "",
    contact: "",
    email: "",
    phone: "",
    customernumber: "",
    vendornumber: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
  };
}

function processFilters() {
  const saved = LocalStorage.getItem(filterCookieName.value);
  if (saved) {
    try {
      const parsed = typeof saved === "string" ? JSON.parse(saved) : saved;
      if (parsed && parsed.columns && parsed.order) {
        selectedColumns.value = {
          ...selectedColumns.value,
          ...parsed.columns,
        };
        const newOrder = [];
        parsed.order.forEach((nm) => {
          const found = baseColumns.value.find((c) => c.name === nm);
          if (found) newOrder.push(found);
        });
        baseColumns.value.forEach((c) => {
          if (!newOrder.includes(c)) newOrder.push(c);
        });
        baseColumns.value = newOrder;
      } else {
        throw new Error("Invalid cookie structure");
      }
    } catch (error) {
      console.error("Error parsing saved filters:", error);
      LocalStorage.remove(filterCookieName.value);
    }
  } else {
    const defaults = {};
    baseColumns.value.forEach((c) => {
      defaults[c.name] = c.default;
    });
    const filterObj = {
      columns: defaults,
      order: baseColumns.value.map((c) => c.name),
    };
    LocalStorage.set(filterCookieName.value, filterObj, { expires: 30 });
    selectedColumns.value = defaults;
  }
}

const createLink = inject("createLink");

function getPath(row) {
  const base = createLink(vcType.value);
  return { path: base, query: { id: row.id } };
}

function updateVCSettings() {
  if (vcType.value === "vendor") {
    nameLabel.value = t("Vendor");
    numberLabel.value = t("Vendor Number");
    baseColumns.value = allColumns.value.filter(
      (c) => c.name !== "customer" && c.name !== "customernumber",
    );
  } else {
    nameLabel.value = t("Customer");
    numberLabel.value = t("Customer Number");
    baseColumns.value = allColumns.value.filter(
      (c) => c.name !== "vendor" && c.name !== "vendornumber",
    );
  }
  processFilters();
}

onMounted(async () => {
  if (updateTitle) {
    updateTitle(
      vcType.value === "vendor" ? t("Search Vendors") : t("Search Customers"),
    );
  }
  await fetchLinks();
  updateVCSettings();
});

watch(
  () => route.params.type,
  async (newType) => {
    vcType.value = newType || "customer";
    await fetchLinks();
    updateVCSettings();
    if (updateTitle) {
      updateTitle(
        vcType.value === "vendor" ? t("Search Vendors") : t("Search Customers"),
      );
    }
  },
);
</script>

<style scoped>
.search-vc-params__grid.flex-container {
  align-items: flex-start;
}

.search-vc-params__grid > .container {
  min-width: 0;
}

/* Inner GL-style 2-col grid: .flex-container > * is ~50% in app.scss */
.search-vc-params__search.flex-container {
  gap: 12px 20px;
}

.search-vc-params__filters {
  max-height: min(60vh, 520px);
  overflow-y: auto;
}

.search-vc-field {
  width: 100%;
  min-width: 0;
}

/* Left-align text in search parameter fields */
.search-vc-params :deep(.q-field__native),
.search-vc-params :deep(input),
.search-vc-params :deep(textarea) {
  text-align: left;
}

.drag-area {
  display: flex;
  flex-wrap: wrap;
}

:deep(.q-table__container) {
  height: calc(100vh - 180px);
  position: relative;
}

:deep(.q-table thead) {
  position: sticky;
  z-index: 2;
  top: 0;
  background-color: var(--q-maintext);
  color: var(--q-main);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

:deep(.q-table thead tr) {
  position: sticky;
  top: 0;
  z-index: 2;
}

:deep(.q-table thead tr th) {
  position: sticky;
  top: 0;
  z-index: 2;
  font-weight: var(--q-font-weight-bolder);
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}

.q-table--loading {
  opacity: 0.7;
  transition: opacity 0.3s ease-in-out;
}

:deep(.q-virtual-scroll__content) {
  margin-bottom: 0 !important;
}

:deep(.q-table td) {
  padding: 8px 16px;
}
</style>
