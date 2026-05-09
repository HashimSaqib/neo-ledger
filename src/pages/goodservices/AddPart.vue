<template>
  <q-page
    class="q-pa-md lightbg relative-position"
    :class="haveProps ? 'q-py-sm' : 'q-py-sm'"
  >
    <q-form
      ref="formRef"
      class="q-px-md add-part-form"
      :class="[
        haveProps ? 'q-py-sm add-part-form--full-width' : 'q-py-sm container',
      ]"
      @submit.prevent="submitForm"
    >
      <q-tabs
        v-model="activeTab"
        dense
        class="add-part-tabs q-mb-none q-pa-md"
        active-color="white"
        inactive-color="grey-7"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="mandatory" :label="t('Mandatory Field')" />
        <q-tab name="additional" :label="t('Additional Details')" />
        <q-tab name="pricing" :label="t('Pricing')" />
      </q-tabs>

      <div class="q-px-md">
        <q-separator class="q-my-md" />
      </div>

      <q-tab-panels v-model="activeTab" animated class="q-pa-md">
        <q-tab-panel name="mandatory" class="q-pa-none">
          <div class="row q-mb-sm q-gutter-sm">
            <div class="col-12 col-md-6">
              <text-input
                v-model="form.partnumber"
                name="partnumber"
                :label="t('Number')"
                outlined
                dense
                class="q-mb-sm"
                label-color="secondary"
                :placeholder="t('Auto')"
              />
              <text-input
                v-model="form.description"
                name="description"
                :label="t('Description')"
                type="textarea"
                outlined
                dense
                rows="2"
                class="q-mb-sm"
                label-color="secondary"
                :rules="[requiredRule]"
                hide-bottom-space
              />
              <text-input
                v-model="form.unit"
                name="unit"
                :label="t('Unit')"
                outlined
                dense
                class="q-mb-sm"
                label-color="secondary"
                :rules="[unitMaxRule]"
                hide-bottom-space
              />
            </div>
            <div class="col-12 col-md-6">
              <text-input
                v-model="form.sellprice"
                name="sellprice"
                :label="t('Sell Price')"
                outlined
                dense
                class="q-mb-sm"
                label-color="secondary"
              />
            </div>
          </div>

          <div class="row q-mb-sm q-gutter-sm">
            <div class="col-12 col-md-6">
              <s-select
                v-model="form.income"
                :options="serviceIncomeAccounts"
                name="income_accno"
                :label="t('Income')"
                outlined
                dense
                class="q-mb-sm"
                label-color="secondary"
                search="label"
                account
                :rules="[requiredRule]"
                hide-bottom-space
                option-label="label"
              />
              <s-select
                v-model="form.expense"
                :options="expenseAccounts"
                name="expense_accno"
                :label="t('Expense')"
                outlined
                dense
                class="q-mb-sm"
                label-color="secondary"
                search="label"
                account
                hide-bottom-space
                option-label="label"
              />
            </div>
            <div class="col-12 col-md-6">
              <div class="row">
                <div v-for="tax in taxAccountsList" :key="tax.accno">
                  <q-checkbox
                    v-model="form.taxes[tax.accno]"
                    :name="`IC_tax_${tax.accno}`"
                    :label="t(tax.description)"
                  />
                </div>
              </div>
              <text-input
                v-model="form.notes"
                name="notes"
                :label="t('Notes')"
                type="textarea"
                outlined
                dense
                rows="2"
                class="q-mb-sm"
                label-color="secondary"
              />
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="additional" class="q-pa-none">
          <div class="q-mb-sm">
            <div class="text-weight-bold q-mb-xs">
              {{ t("Additional Details") }}
            </div>
            <div class="row q-mb-sm q-gutter-sm">
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.drawing"
                  name="drawing"
                  :label="t('Drawing')"
                  outlined
                  dense
                  class="q-mb-sm"
                  label-color="secondary"
                />
                <text-input
                  v-model="form.microfiche"
                  name="microfiche"
                  :label="t('Microfiche')"
                  outlined
                  dense
                  class="q-mb-sm"
                  label-color="secondary"
                />
                <text-input
                  v-model="form.toolnumber"
                  name="toolnumber"
                  :label="t('Tool Number')"
                  outlined
                  dense
                  class="q-mb-sm"
                  label-color="secondary"
                />
                <text-input
                  v-model="form.priceupdate"
                  name="priceupdate"
                  :label="t('Updated')"
                  type="date"
                  outlined
                  dense
                  class="q-mb-sm"
                  label-color="secondary"
                />
              </div>
              <div class="col-12 col-md-6">
                <country-input
                  v-model="form.countryorigin"
                  name="countryorigin"
                  :label="t('Country of Origin')"
                  outlined
                  dense
                  class="q-mb-sm"
                />
                <text-input
                  v-model="form.tariff_hscode"
                  name="tariff_hscode"
                  :label="t('HS Code')"
                  outlined
                  dense
                  class="q-mb-sm"
                  label-color="secondary"
                />
                <text-input
                  v-model="form.barcode"
                  name="barcode"
                  :label="t('Barcode')"
                  outlined
                  dense
                  class="q-mb-sm"
                  label-color="secondary"
                />
              </div>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="pricing" class="q-pa-none">
          <div class="q-mb-sm">
            <div class="text-weight-bold q-mb-xs">
              {{ t("Pricing") }}
            </div>
            <div class="row q-mb-sm q-gutter-sm">
              <div class="col-12 col-md-6">
                <text-input
                  v-model="form.listprice"
                  name="listprice"
                  :label="t('List Price')"
                  outlined
                  dense
                  class="q-mb-sm"
                  label-color="secondary"
                />
                <text-input
                  v-model="form.lastcost"
                  name="lastcost"
                  :label="t('Last Cost')"
                  outlined
                  dense
                  class="q-mb-sm"
                  label-color="secondary"
                />
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <div class="row justify-start q-mt-md">
        <s-button type="post" @click="submitForm(false)" class="q-mx-sm" />
        <s-button
          type="post-as-new"
          @click="submitForm(true)"
          class="q-mx-sm"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed, watch } from "vue";
import { Notify } from "quasar";
import { api } from "src/boot/axios";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const updateTitle = inject("updateTitle");

const props = defineProps({
  id: { type: [String, Number], default: null },
  type: { type: String, default: null },
  initialData: { type: Object, default: null },
});
const emit = defineEmits(["saved"]);
const haveProps = computed(() => props.id != null || props.type != null);
const componentId = computed(() => (props.type ? props.id : route.query.id));

if (!props.type) {
  updateTitle(t("Add Service"));
}

const formRef = ref(null);
const saveAsNew = ref(false);

const activeTab = ref("mandatory");

const form = ref({
  partnumber: "",
  description: "",
  income: "",
  expense: "",
  taxes: {},
  mocoId: null,
  referenceDescription: "",
  referenceConfidential: false,
  notes: "",
  priceupdate: new Date().toISOString().split("T")[0],
  sellprice: "",
  listprice: "",
  lastcost: "",
  markup: "",
  unit: "",
  image: "",
  countryorigin: "",
  drawing: "",
  tariff_hscode: "",
  microfiche: "",
  barcode: "",
  toolnumber: "",
  vendorLines: [
    {
      vendor: null,
      vendorPartNumber: "",
      vendorCost: "",
      vendorCurrency: "",
      vendorLeadtime: "",
    },
  ],
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

const serviceIncomeAccounts = ref([]);
const expenseAccounts = ref([]);
const taxAccounts = ref({});
const taxAccountsList = computed(() => Object.values(taxAccounts.value || {}));
const vendors = ref([]);
const customers = ref([]);
const currencies = ref([]);

const requiredRule = (v) => !!v || t("This field is required");

function fieldStrLen(val) {
  if (val == null || val === "") return 0;
  return String(val).length;
}

function maxLengthMessage(max) {
  return `${t("Must be at most")} ${max} ${t("characters")}`;
}

const unitMaxRule = (v) => fieldStrLen(v) <= 5 || maxLengthMessage(5);

const FORBIDDEN_IC_KEYS = [
  "income_accno_id",
  "income_account_id",
  "IC_income",
  "ic_income",
  "icIncome",
  "expense_accno_id",
  "expense_account_id",
];

function validateIcItemPayload(postData, { isCreate }) {
  const errors = [];
  if (
    postData.unit != null &&
    postData.unit !== "" &&
    fieldStrLen(postData.unit) > 5
  ) {
    errors.push(`unit: ${maxLengthMessage(5)}`);
  }
  if (
    isCreate &&
    (postData.income_accno == null || postData.income_accno === "")
  ) {
    errors.push(t("Income account (account number) is required"));
  }
  return errors;
}

function asKeyList(keyOrKeys) {
  if (keyOrKeys == null) return [];
  return Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
}

/** Merge nested IC defaults (e.g. defaults.ic) into a flat object for lookups. */
function flattenIcDefaults(raw) {
  if (!raw || typeof raw !== "object") return {};
  return {
    ...raw,
    ...(raw.ic && typeof raw.ic === "object" ? raw.ic : {}),
    ...(raw.IC && typeof raw.IC === "object" ? raw.IC : {}),
  };
}

/** Match chart row to a default accno string (plain accno or "accno--label" combo). */
function matchAccountAccno(accountRow, rawDefault) {
  if (rawDefault == null || rawDefault === "") return false;
  const s = String(rawDefault).trim();
  const accnoFromLabel = s.includes("--") ? s.split("--")[0].trim() : s;
  const a = accountRow?.accno;
  return String(a) === s || String(a) === accnoFromLabel;
}

/**
 * Expense/COGS defaults often point at accounts listed under `accounts.cogs`;
 * merge with `accounts.expense` so the select can show the default row.
 */
function mergeItemExpenseAccountOptions(expenseList, cogsList) {
  const primary = Array.isArray(expenseList) ? expenseList : [];
  const secondary = Array.isArray(cogsList) ? cogsList : [];
  const seen = new Set();
  const out = [];
  const pushIfNew = (a) => {
    if (!a || a.accno == null || String(a.accno).trim() === "") return;
    const k = String(a.accno);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(a);
  };
  primary.forEach(pushIfNew);
  secondary.forEach(pushIfNew);
  return out;
}

function resolveDefaultAccount(accounts, defaults, keys) {
  const accnoKeys = asKeyList(keys.accnoKey);
  const idKeys = asKeyList(keys.idKey);
  if (!accounts?.length) return undefined;

  for (const k of accnoKeys) {
    const v = defaults?.[k];
    if (v == null || v === "") continue;
    const found = accounts.find((a) => matchAccountAccno(a, v));
    if (found) return found;
  }
  for (const k of idKeys) {
    const v = defaults?.[k];
    if (v == null) continue;
    const found = accounts.find((a) => a.id == v);
    if (found) return found;
  }
  return accounts[0];
}

function findAccountByStoredAccno(accounts, data, accnoField, idField) {
  if (data?.[accnoField] != null && data[accnoField] !== "") {
    return accounts.find((a) => String(a.accno) === String(data[accnoField]));
  }
  if (data?.[idField] != null) {
    return accounts.find((a) => a.id == data[idField]);
  }
  return undefined;
}

const getLinks = async () => {
  try {
    const response = await api.get("/create_links/ic");
    const links = response.data;

    const filteredTaxes = {};
    const seenAccnos = new Set();
    if (links.tax_accounts) {
      Object.keys(links.tax_accounts).forEach((key) => {
        const tax = links.tax_accounts[key];
        if (!tax?.link || seenAccnos.has(tax.accno)) return;
        const linkParts = tax.link.split(":");
        if (linkParts.includes("IC_taxservice")) {
          filteredTaxes[key] = tax;
          seenAccnos.add(tax.accno);
        }
      });
    }
    taxAccounts.value = filteredTaxes;
    Object.keys(taxAccounts.value).forEach((key) => {
      const tax = taxAccounts.value[key];
      form.value.taxes[tax.accno] = false;
    });

    expenseAccounts.value = mergeItemExpenseAccountOptions(
      links.accounts.expense,
      links.accounts.cogs,
    );
    serviceIncomeAccounts.value = links.accounts.service_income;

    const defaults = flattenIcDefaults(links.defaults);
    form.value.income = resolveDefaultAccount(
      serviceIncomeAccounts.value,
      defaults,
      {
        accnoKey: ["income_accno", "sales_accno", "ic_income_accno"],
        idKey: ["income_accno_id", "sales_accno_id"],
      },
    );
    form.value.expense = resolveDefaultAccount(
      expenseAccounts.value,
      defaults,
      {
        accnoKey: ["expense_accno", "cogs_accno", "ic_expense_accno"],
        idKey: ["expense_accno_id", "cogs_accno_id"],
      },
    );

    currencies.value = links.currencies;
    vendors.value = links.vendors;
    customers.value = links.customers;
  } catch (error) {
    Notify.create({
      message: t("Failed to fetch links"),
      type: "negative",
      position: "center",
    });
  }
};

const loadData = async (idOverride) => {
  const id = idOverride ?? componentId.value;
  if (!id) return;
  try {
    const response = await api.get(`/ic/items/${id}`);
    const data = response.data;
    if (!props.type) {
      updateTitle(`${t("Edit")} ${t("Service")}`);
    }

    form.value.partnumber = data.partnumber;
    form.value.description = data.description;

    form.value.income =
      findAccountByStoredAccno(
        serviceIncomeAccounts.value,
        data,
        "income_accno",
        "income_accno_id",
      ) || form.value.income;
    form.value.expense =
      findAccountByStoredAccno(
        expenseAccounts.value,
        data,
        "expense_accno",
        "expense_accno_id",
      ) || form.value.expense;

    Object.keys(taxAccounts.value).forEach((key) => {
      const tax = taxAccounts.value[key];
      form.value.taxes[tax.accno] = Boolean(data.amount?.[tax.accno]);
    });

    form.value.image = data.image;
    form.value.drawing = data.drawing;
    form.value.microfiche = data.microfiche;
    form.value.countryorigin = data.countryorigin;
    form.value.tariff_hscode = data.tariff_hscode;
    form.value.barcode = data.barcode;
    form.value.priceupdate = data.priceupdate;
    form.value.sellprice = data.sellprice;
    form.value.listprice = data.listprice;
    form.value.lastcost = data.lastcost;
    form.value.unit = data.unit;
    form.value.notes = data.notes;

    if (data.vendormatrix) {
      form.value.vendorLines = data.vendormatrix.map((vend) => ({
        vendor: vendors.value.find((v) => v.name === vend.name),
        vendorPartNumber: vend.partnumber,
        vendorCost: vend.lastcost,
        vendorCurrency: currencies.value.find(
          (c) => (c.curr = vend.vendorcurr),
        ),
        vendorLeadtime: vend.leadtime,
      }));
    }

    if (data.customermatrix) {
      form.value.customerLines = data.customermatrix.map((cust) => ({
        customer: customers.value.find((c) => c.name === cust.name),
        priceBreak: cust.pricebreak,
        customerPrice: cust.customerprice,
        customerCurrency: currencies.value.find(
          (c) => (c.curr = cust.customercurr),
        ),
        validFrom: cust.validfrom,
        validTo: cust.validto,
      }));
    }
  } catch (error) {
    console.log(error);
    Notify.create({
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        t("Failed to load item data"),
      type: "negative",
      position: "center",
    });
  }
};

function stripForbiddenIcKeys(obj) {
  FORBIDDEN_IC_KEYS.forEach((k) => {
    delete obj[k];
  });
}

const submitForm = async (asNew) => {
  if (typeof asNew === "boolean") {
    saveAsNew.value = asNew;
  }

  const valid = await formRef.value.validate();

  if (!valid) {
    const firstError = formRef.value.$el.querySelector(".q-field--error");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    Notify.create({
      message: t("Please fill in the required fields"),
      type: "negative",
      position: "center",
    });
    return;
  }

  const postData = { ...form.value };

  Object.keys(form.value.taxes).forEach((accno) => {
    postData[`IC_tax_${accno}`] = form.value.taxes[accno] ? "1" : "0";
  });
  postData.taxaccounts = Object.keys(form.value.taxes)
    .filter((accno) => form.value.taxes[accno])
    .join(" ");

  delete postData.taxes;

  delete postData.income;
  delete postData.expense;

  if (form.value.income?.accno != null && form.value.income.accno !== "") {
    postData.income_accno = String(form.value.income.accno);
  }
  if (form.value.expense?.accno != null && form.value.expense.accno !== "") {
    postData.expense_accno = String(form.value.expense.accno);
  }

  stripForbiddenIcKeys(postData);

  if (postData.vendorLines && Array.isArray(postData.vendorLines)) {
    postData.vendorLines = postData.vendorLines.map((line) => ({
      ...line,
      vendor:
        line.vendor && typeof line.vendor === "object"
          ? `${line.vendor.name}--${line.vendor.id}`
          : line.vendor,
      vendorCurrency: line.vendorCurrency.curr,
    }));
  }
  if (postData.customerLines && Array.isArray(postData.customerLines)) {
    postData.customerLines = postData.customerLines.map((line) => ({
      ...line,
      customer: line.customer
        ? `${line.customer.name}--${line.customer.id}`
        : line.customer,
      customerCurrency: line.customerCurrency.curr,
    }));
  }

  function convertBooleans(obj) {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "boolean") {
        obj[key] = obj[key] ? "1" : "0";
      } else if (obj[key] && typeof obj[key] === "object") {
        if (Array.isArray(obj[key])) {
          obj[key].forEach((item) => {
            if (item && typeof item === "object") {
              convertBooleans(item);
            } else if (typeof item === "boolean") {
              const index = obj[key].indexOf(item);
              obj[key][index] = item ? "1" : "0";
            }
          });
        } else {
          convertBooleans(obj[key]);
        }
      }
    });
  }

  convertBooleans(postData);

  if (postData.mocoId) {
    postData.moco_id = postData.mocoId;
    delete postData.mocoId;
  }

  const rawId = componentId.value;
  const isCreate = !rawId || saveAsNew.value;
  postData.id = isCreate ? 0 : Number(rawId);
  postData.item = "service";

  const icPayloadErrors = validateIcItemPayload(postData, { isCreate });
  if (icPayloadErrors.length) {
    Notify.create({
      message: icPayloadErrors[0],
      type: "negative",
      position: "center",
    });
    return;
  }

  try {
    const endpoint = isCreate ? "/ic/items/0" : `/ic/items/${rawId}`;
    const response = await api.post(endpoint, postData);

    Notify.create({
      message: t("Service saved successfully"),
      type: "positive",
      position: "top-right",
    });
    const fetchId = response.data.id;
    if (fetchId) {
      if (!props.type) {
        await router.replace({
          query: { ...route.query, id: fetchId },
        });
      }
      await loadData(props.type ? fetchId : undefined);
      emit("saved");
    }
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error.message ||
      t("An unexpected error occurred");

    Notify.create({
      message: `${t("Error saving service")}: ${errorMessage}`,
      type: "negative",
      position: "center",
    });
    console.error("Error:", error);
  }
};

const applyInitialData = () => {
  if (!props.initialData || componentId.value) return;

  if (props.initialData.description) {
    form.value.description = props.initialData.description;
  }

  if (props.initialData.mocoId) {
    form.value.mocoId = props.initialData.mocoId;
  }

  form.value.unit = "h";

  if (props.initialData.incomeAccno) {
    const matchedAccount = serviceIncomeAccounts.value.find(
      (acc) => String(acc.accno) === String(props.initialData.incomeAccno),
    );
    if (matchedAccount) {
      form.value.income = matchedAccount;
    }
  }
};

watch(
  () => props.initialData,
  () => {
    if (serviceIncomeAccounts.value.length) {
      applyInitialData();
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await getLinks();
  const id = componentId.value;
  if (id) {
    await loadData();
  }

  applyInitialData();
});
</script>

<style scoped lang="scss">
.add-part-form {
  width: 80%;
}

.add-part-form--full-width {
  width: 100%;
}

.add-part-tabs :deep(.q-tab) {
  border-radius: 4px;
  margin-right: 4px;
  text-transform: none;
}

.add-part-tabs :deep(.q-tab--active) {
  background: var(--q-primary);
  color: white;
}

.add-part-tabs :deep(.q-tab__indicator) {
  display: none;
}
</style>
