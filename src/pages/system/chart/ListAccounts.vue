<template>
  <q-page class="q-pa-sm">
    <q-table
      :rows="results"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      virtual-scroll
      :rows-per-page-options="[0]"
      hide-bottom
    >
      <template v-slot:body="props">
        <q-tr
          :props="props"
          :class="props.row.charttype === 'H' ? 'header-row' : ''"
        >
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <template v-if="col.name === 'accno'">
              <a
                href="#"
                @click.prevent="openEditDialog(props.row)"
                class="text-primary"
              >
                {{ props.row.accno }}
              </a>
            </template>
            <template v-else-if="col.name === 'type'">
              {{ mapCategory(props.row.category) }}
            </template>
            <template v-else-if="col.name === 'contra'">
              {{ props.row.contra === 1 ? "*" : "" }}
            </template>
            <template v-else-if="col.name === 'dropdown'">
              <div v-if="props.row.link">
                <div
                  v-for="(code, index) in splitLink(props.row.link)"
                  :key="index"
                >
                  {{ mapLink(code) }}
                </div>
              </div>
            </template>
            <template v-else-if="col.name === 'closed'">
              {{ props.row.closed === 1 ? t("Yes") : "" }}
            </template>
            <template v-else>
              {{ props.row[col.field] }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Edit Account Dialog -->
    <q-dialog v-model="editDialog" persistent>
      <q-card class="q-pa-sm" style="max-width: 500px">
        <q-card-section class="q-pa-xs">
          <div class="text-h6">Edit Account</div>
        </q-card-section>
        <q-separator />

        <q-card-section class="q-pa-xs">
          <q-form @submit.prevent="saveAccount" class="q-gutter-xs">
            <!-- Row 1: Account Number and Closed -->
            <div class="row q-col-gutter-sm items-center">
              <div class="col-7">
                <q-input
                  dense
                  outlined
                  v-model="selectedAccount.accno"
                  label="Account Number *"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-5">
                <q-checkbox
                  dense
                  v-model="selectedAccount.closed"
                  label="Closed"
                  true-value="1"
                  false-value="0"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <!-- Row 2: Description -->
            <q-input
              dense
              outlined
              v-model="selectedAccount.description"
              label="Description"
              class="q-mt-xs"
            />

            <!-- Row 3: Account Type, Contra and Chart Type -->
            <div class="row q-col-gutter-sm items-center q-mt-xs">
              <div class="col-6">
                <div class="text-subtitle2">Account Type *</div>
                <q-option-group
                  dense
                  v-model="selectedAccount.category"
                  :options="categoryOptions"
                  type="radio"
                  inline
                />
              </div>
              <div class="col-3">
                <q-checkbox
                  dense
                  v-model="selectedAccount.contra"
                  label="Contra"
                  true-value="1"
                  false-value="0"
                />
              </div>
              <div class="col-3">
                <div class="text-subtitle2">Chart Type</div>
                <q-option-group
                  dense
                  v-model="selectedAccount.charttype"
                  :options="chartTypeOptions"
                  type="radio"
                  inline
                />
              </div>
            </div>

            <!-- Row 4: Summary Account Checkboxes -->
            <div class="row items-center q-mt-xs">
              <div class="col">
                <div class="text-subtitle2">Summary Account:</div>
                <q-checkbox
                  dense
                  v-model="selectedAccount.AR"
                  label="AR"
                  true-value="AR"
                  false-value=""
                  class="q-mr-sm"
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.AP"
                  label="AP"
                  true-value="AP"
                  false-value=""
                  class="q-mr-sm"
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.IC"
                  label="Inventory"
                  true-value="IC"
                  false-value=""
                />
              </div>
            </div>

            <!-- Row 5: Drop-down Menu Options -->
            <div v-if="selectedAccount.charttype === 'A'" class="q-mt-xs">
              <div class="text-subtitle2">Include in drop-down menus:</div>
              <div class="row q-col-gutter-sm">
                <!-- AR Options -->
                <div class="col">
                  <div class="text-caption">AR</div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AR_amount"
                    label="Lineitem"
                    true-value="AR_amount"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AR_paid"
                    label="Payment"
                    true-value="AR_paid"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AR_discount"
                    label="Discount"
                    true-value="AR_discount"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AR_tax"
                    label="Tax"
                    true-value="AR_tax"
                    false-value=""
                  />
                </div>
                <!-- AP Options -->
                <div class="col">
                  <div class="text-caption">AP</div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AP_amount"
                    label="Lineitem"
                    true-value="AP_amount"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AP_paid"
                    label="Payment"
                    true-value="AP_paid"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AP_discount"
                    label="Discount"
                    true-value="AP_discount"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AP_tax"
                    label="Tax"
                    true-value="AP_tax"
                    false-value=""
                  />
                </div>
                <!-- Tracking Items -->
                <div class="col">
                  <div class="text-caption">Tracking</div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_sale"
                    label="Income"
                    true-value="IC_sale"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_cogs"
                    label="COGS"
                    true-value="IC_cogs"
                    false-value=""
                  />
                  <div></div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_taxpart"
                    label="Tax"
                    true-value="IC_taxpart"
                    false-value=""
                    class="col-auto"
                  />
                </div>
                <!-- Non-tracking Items -->
                <div class="col">
                  <div class="text-caption">Non-tracking</div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_income"
                    label="Income"
                    true-value="IC_income"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_expense"
                    label="Expense"
                    true-value="IC_expense"
                    false-value=""
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_taxservice"
                    label="Tax"
                    true-value="IC_taxservice"
                    false-value=""
                  />
                </div>
              </div>
            </div>

            <!-- Row 6: GIFI -->
            <q-input
              dense
              outlined
              v-model="selectedAccount.gifi_accno"
              label="GIFI"
              class="q-mt-xs"
            />

            <!-- Form actions -->
            <div class="row justify-end q-mt-xs">
              <q-btn
                flat
                label="Cancel"
                color="primary"
                @click="editDialog = false"
              />
              <q-btn flat label="Save" color="primary" type="submit" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
const updateTitle = inject("updateTitle");
updateTitle("Chart Of Accounts");
const { t } = useI18n();

// Store the fetched chart data here
const results = ref([]);

// Define the hardcoded columns
const columns = [
  { name: "accno", label: t("Account"), field: "accno", align: "left" },
  { name: "gifi", label: t("GIFI"), field: "gifi_accno", align: "left" },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  { name: "type", label: t("Type"), field: "category", align: "left" },
  { name: "contra", label: t("Contra"), field: "contra", align: "center" },
  { name: "dropdown", label: t("Drop-down"), field: "link", align: "left" },
  { name: "closed", label: t("Closed"), field: "closed", align: "center" },
];

// Mapping for account category values
const categoryMapping = {
  A: t("Asset"),
  L: t("Liability"),
  Q: t("Equity"),
  I: t("Income"),
  E: t("Expense"),
};

// Mapping for link (drop-down) values
const linkMapping = {
  AR: t("AR"),
  AP: t("AP"),
  AR_paid: t("AR Payment"),
  AR_amount: t("AR Amount"),
  AR_tax: t("Tax collected"),
  AR_discount: t("Early Payment Discount given"),
  AP_paid: t("AP Payment"),
  AP_amount: t("AP Amount"),
  AP_tax: t("Tax paid"),
  AP_discount: t("Early Payment Discount received"),
  IC: t("Inventory"),
  IC_sale: t("Tracking Item Income"),
  IC_income: t("Non-tracking Item Income"),
  IC_cogs: t("COGS"),
  IC_expense: t("Non-tracking Item Expense"),
  IC_taxpart: t("Tracking Item Tax"),
  IC_taxservice: t("Non-tracking Item Tax"),
};

function mapCategory(cat) {
  return categoryMapping[cat] || cat;
}

function mapLink(code) {
  return linkMapping[code] || code;
}

function splitLink(link) {
  return link.split(":");
}

const fetchData = async () => {
  try {
    const response = await api.get("/system/chart/accounts");
    results.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const editDialog = ref(false);
const selectedAccount = ref({});

const categoryOptions = [
  { label: t("Asset"), value: "A" },
  { label: t("Liability"), value: "L" },
  { label: t("Equity"), value: "Q" },
  { label: t("Income"), value: "I" },
  { label: t("Expense"), value: "E" },
];

const chartTypeOptions = [
  { label: "Heading", value: "H" },
  { label: "Account", value: "A" },
];

// All possible link values for summary and drop-down options
const possibleLinks = [
  "AR",
  "AR_amount",
  "AR_paid",
  "AR_discount",
  "AR_tax",
  "AP",
  "AP_amount",
  "AP_paid",
  "AP_discount",
  "AP_tax",
  "IC",
  "IC_sale",
  "IC_cogs",
  "IC_taxpart",
  "IC_income",
  "IC_expense",
  "IC_taxservice",
];

function openEditDialog(account) {
  selectedAccount.value = { ...account };

  selectedAccount.value.closed =
    selectedAccount.value.closed === "1" ? "1" : "0";
  selectedAccount.value.contra =
    selectedAccount.value.contra === "1" ? "1" : "0";
  selectedAccount.value.charttype = selectedAccount.value.charttype || "A";

  possibleLinks.forEach((code) => {
    selectedAccount.value[code] = "";
  });

  if (account.link) {
    const links = account.link.split(":");
    possibleLinks.forEach((code) => {
      selectedAccount.value[code] = links.includes(code) ? code : "";
    });
  }

  editDialog.value = true;
}

function saveAccount() {
  if (!selectedAccount.value.accno) {
    alert("Account Number missing!");
    return;
  }
  if (!selectedAccount.value.category) {
    alert("Account Type missing!");
    return;
  }

  let summarySelected = "";
  ["AR", "AP", "IC"].forEach((key) => {
    if (selectedAccount.value[key])
      summarySelected += selectedAccount.value[key];
  });
  if (
    (selectedAccount.value.AR ||
      selectedAccount.value.AP ||
      selectedAccount.value.IC) &&
    summarySelected.length > 2
  ) {
    alert("Cannot set account for more than one of AR, AP or IC");
    return;
  }

  const arOptions = ["AR_amount", "AR_paid", "AR_discount", "AR_tax"];
  let arCount = 0;
  arOptions.forEach((opt) => {
    if (selectedAccount.value[opt]) arCount++;
  });
  if (arCount > 1) {
    alert("Cannot set multiple options for AR");
    return;
  }

  const apOptions = ["AP_amount", "AP_paid", "AP_discount", "AP_tax"];
  let apCount = 0;
  apOptions.forEach((opt) => {
    if (selectedAccount.value[opt]) apCount++;
  });
  if (apCount > 1) {
    alert("Cannot set multiple options for AP");
    return;
  }

  if (
    selectedAccount.value.AR ||
    selectedAccount.value.AP ||
    selectedAccount.value.IC
  ) {
    const dropDownOptions = [
      "AR_amount",
      "AR_paid",
      "AR_discount",
      "AR_tax",
      "AP_amount",
      "AP_paid",
      "AP_discount",
      "AP_tax",
      "IC_sale",
      "IC_cogs",
      "IC_taxpart",
      "IC_income",
      "IC_expense",
      "IC_taxservice",
    ];
    for (let opt of dropDownOptions) {
      if (selectedAccount.value[opt]) {
        alert(
          "Account cannot be set to any other type of account if AR, AP or IC is selected"
        );
        return;
      }
    }
  }

  let links = [];
  possibleLinks.forEach((code) => {
    if (selectedAccount.value[code]) links.push(code);
  });
  selectedAccount.value.link = links.join(":");

  console.log("Saving account:", selectedAccount.value);
  editDialog.value = false;
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
:deep(.q-table thead tr th) {
  position: sticky;
  top: 0;
  z-index: 2;
  font-weight: bold;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
  font-size: 1.1rem;
}
.header-row {
  font-weight: bold;
  color: var(--q-lightbg);
  background-color: var(--q-maintext);
}
</style>
