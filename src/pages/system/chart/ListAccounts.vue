<template>
  <q-page class="q-pa-sm">
    <div class="row q-mb-sm hide-print">
      <q-btn
        :label="t('Export')"
        @click="downloadExcel"
        class="q-mr-sm"
        color="accent"
      />
      <q-btn
        :label="t('Print')"
        @click="triggerPrint"
        class="q-mr-sm"
        color="info"
      />
    </div>
    <q-table
      :rows="results"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      virtual-scroll
      :rows-per-page-options="[0]"
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
                @click.prevent="openEditDialog(props.row.id)"
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
    <q-dialog v-model="editDialog">
      <q-card class="q-pa-sm" style="max-width: 500px">
        <q-card-section class="q-pa-xs">
          <div class="text-h6">{{ t("Edit Account") }}</div>
        </q-card-section>
        <q-separator />

        <q-card-section class="q-pa-xs">
          <q-form @submit.prevent="saveAccount(false)" class="q-gutter-xs">
            <!-- Row 1: Account Number and Closed -->
            <div class="row q-col-gutter-sm items-center">
              <div class="col-7">
                <q-input
                  dense
                  outlined
                  v-model="selectedAccount.accno"
                  :label="t('Account Number *')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-5">
                <q-checkbox
                  dense
                  v-model="selectedAccount.closed"
                  :label="t('Closed')"
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
              :label="t('Description')"
              class="q-mt-xs"
            />

            <!-- Row 3: Account Type, Contra and Chart Type -->
            <div class="row q-col-gutter-sm items-center q-mt-xs">
              <div class="col-6">
                <div class="text-subtitle2">{{ t("Account Type *") }}</div>
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
                  :label="t('Contra')"
                  true-value="1"
                  false-value="0"
                />
              </div>
              <div class="col-3">
                <div class="text-subtitle2">{{ t("Chart Type") }}</div>
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
                <div class="text-subtitle2">{{ t("Summary Account:") }}</div>
                <q-checkbox
                  dense
                  v-model="selectedAccount.AR"
                  :label="t('AR')"
                  true-value="AR"
                  false-value=""
                  class="q-mr-sm"
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.AP"
                  :label="t('AP')"
                  true-value="AP"
                  false-value=""
                  class="q-mr-sm"
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.IC"
                  :label="t('Inventory')"
                  true-value="IC"
                  false-value=""
                />
              </div>
            </div>

            <!-- Row 5: Drop-down Menu Options -->
            <div v-if="selectedAccount.charttype === 'A'" class="q-mt-xs">
              <div class="text-subtitle2">
                {{ t("Include in drop-down menus:") }}
              </div>
              <div class="row q-col-gutter-sm">
                <!-- AR Options -->
                <div class="col">
                  <div class="text-caption">{{ t("AR") }}</div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AR_amount"
                    :label="t('Lineitem')"
                    true-value="AR_amount"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AR_paid"
                    :label="t('Payment')"
                    true-value="AR_paid"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AR_discount"
                    :label="t('Discount')"
                    true-value="AR_discount"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AR_tax"
                    :label="t('Tax')"
                    true-value="AR_tax"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                </div>
                <!-- AP Options -->
                <div class="col">
                  <div class="text-caption">{{ t("AP") }}</div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AP_amount"
                    :label="t('Lineitem')"
                    true-value="AP_amount"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AP_paid"
                    :label="t('Payment')"
                    true-value="AP_paid"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AP_discount"
                    :label="t('Discount')"
                    true-value="AP_discount"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.AP_tax"
                    :label="t('Tax')"
                    true-value="AP_tax"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                </div>
                <!-- Tracking Items -->
                <div class="col">
                  <div class="text-caption">{{ t("Tracking") }}</div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_sale"
                    :label="t('Income')"
                    true-value="IC_sale"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_cogs"
                    :label="t('COGS')"
                    true-value="IC_cogs"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <div></div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_taxpart"
                    :label="t('Tax')"
                    true-value="IC_taxpart"
                    false-value=""
                    class="col-auto"
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                </div>
                <!-- Non-tracking Items -->
                <div class="col">
                  <div class="text-caption">{{ t("Non-tracking Items") }}</div>
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_income"
                    :label="t('Income')"
                    true-value="IC_income"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_expense"
                    :label="t('Expense')"
                    true-value="IC_expense"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                  <q-checkbox
                    dense
                    v-model="selectedAccount.IC_taxservice"
                    :label="t('Tax')"
                    true-value="IC_taxservice"
                    false-value=""
                    :disable="
                      selectedAccount.has_transactions ||
                      selectedAccount.has_parts ||
                      selectedAccount.has_defaults
                    "
                  />
                </div>
              </div>
            </div>

            <!-- Row 6: GIFI -->
            <s-select
              v-if="gifi && gifi.length > 0"
              :options="gifi"
              map-options
              emit-value
              option-label="label"
              option-value="accno"
              dense
              outlined
              v-model="selectedAccount.gifi_accno"
              :label="t('GIFI')"
              class="q-mt-xs"
              account
            />

            <!-- Form actions -->
            <div class="row justify-end q-mt-sm q-gutter-x-sm">
              <q-btn
                flat
                :label="t('Cancel')"
                color="primary"
                @click="editDialog = false"
              />
              <q-btn
                color="negative"
                :label="t('Delete')"
                v-if="
                  !selectedAccount.has_transactions &&
                  !selectedAccount.has_parts &&
                  !selectedAccount.has_defaults
                "
                @click.prevent="deleteAccount(selectedAccount.id)"
              />

              <q-btn label="Save" color="primary" type="submit" />
              <q-btn label="Save As New" @click.prevent="saveAccount(true)" />
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
import { Notify, Dialog } from "quasar";
import { utils, writeFile } from "xlsx";
const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Chart Of Accounts"));
const triggerPrint = inject("triggerPrint");
const results = ref([]);

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

const categoryMapping = {
  A: t("Asset"),
  L: t("Liability"),
  Q: t("Equity"),
  I: t("Income"),
  E: t("Expense"),
};

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
const gifi = ref([]);
const fetchGifi = async () => {
  try {
    const response = await api.get("/create_links/chart");
    gifi.value = response.data.gifi;
    gifi.value = gifi.value.map((account) => {
      return { ...account, label: `${account.accno}--${account.description}` };
    });
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
  { label: t("Heading"), value: "H" },
  { label: t("Account"), value: "A" },
];

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

async function openEditDialog(accountId) {
  try {
    // Fetch account data from API
    const response = await api.get(`/system/chart/accounts/${accountId}`);

    if (!response.data) {
      throw new Error(t("Failed to fetch account details"));
    }

    const account = response.data;

    // Clone account to avoid direct mutations
    selectedAccount.value = { ...account };

    // Standardize checkbox values as strings
    selectedAccount.value.closed = String(account.closed);
    selectedAccount.value.contra = String(account.contra);
    selectedAccount.value.charttype = account.charttype || "A";

    // Initialize drop-down options
    possibleLinks.forEach((code) => {
      selectedAccount.value[code] = "";
    });

    if (account.link) {
      const links = account.link.split(":");
      possibleLinks.forEach((code) => {
        selectedAccount.value[code] = links.includes(code) ? code : "";
      });
    }

    // Open edit dialog
    editDialog.value = true;
  } catch (error) {
    console.error("Error fetching account:", error);
    Notify.create({
      message: t("Failed to fetch account details. Please try again."),
      color: "negative",
      position: "center",
    });
  }
}

async function saveAccount(isNew = false) {
  // Validate mandatory fields using Quasar Notify with centered alerts
  if (!selectedAccount.value.accno) {
    Notify.create({
      message: t("Account Number missing!"),
      color: "negative",
      position: "center",
    });
    return;
  }
  if (!selectedAccount.value.category) {
    Notify.create({
      message: t("Account Type missing!"),
      color: "negative",
      position: "center",
    });
    return;
  }

  const summaryCount = ["AR", "AP", "IC"].reduce(
    (acc, key) => acc + (selectedAccount.value[key] ? 1 : 0),
    0
  );
  if (summaryCount > 1) {
    Notify.create({
      message: t("Cannot set account for more than one of AR, AP or IC"),
      color: "negative",
      position: "center",
    });
    return;
  }

  const countSelected = (options) =>
    options.reduce(
      (count, opt) => count + (selectedAccount.value[opt] ? 1 : 0),
      0
    );

  const arOptions = ["AR_amount", "AR_paid", "AR_discount", "AR_tax"];
  if (countSelected(arOptions) > 1) {
    Notify.create({
      message: t("Cannot set multiple options for AR"),
      color: "negative",
      position: "center",
    });
    return;
  }

  const apOptions = ["AP_amount", "AP_paid", "AP_discount", "AP_tax"];
  if (countSelected(apOptions) > 1) {
    Notify.create({
      message: t("Cannot set multiple options for AP"),
      color: "negative",
      position: "center",
    });
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
    if (dropDownOptions.some((opt) => selectedAccount.value[opt])) {
      Notify.create({
        message: t(
          "Account cannot be set to any other type of account if AR, AP or IC is selected"
        ),
        color: "negative",
        position: "center",
      });
      return;
    }
  }

  // Compile selected drop-down links
  const links = [];
  possibleLinks.forEach((code) => {
    if (selectedAccount.value[code]) links.push(code);
  });
  selectedAccount.value.link = links.join(":");
  try {
    const apiUrl = isNew
      ? `/system/chart/accounts/` // Save as new (no id)
      : `/system/chart/accounts/${selectedAccount.value.id}`;

    // Remove id when saving as new
    const accountData = { ...selectedAccount.value };
    if (isNew) {
      delete accountData.id;
    }

    await api.post(apiUrl, accountData);
    Notify.create({
      message: t("Account saved successfully"),
      color: "positive",
      position: "center",
    });
    await fetchData();
    editDialog.value = false;
  } catch (error) {
    Notify.create({
      message: t("Failed to save account"),
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
}
async function deleteAccount(accountId) {
  if (!accountId) {
    Notify.create({
      message: t("Invalid account ID"),
      color: "negative",
      position: "center",
    });
    return;
  }

  try {
    // Show confirmation dialog and handle response directly
    Dialog.create({
      title: t("Confirm Deletion"),
      message: t(
        "Are you sure you want to delete this account? This action cannot be undone."
      ),
      cancel: true,
      persistent: true,
    })
      .onOk(async () => {
        // Only proceed if user confirmed
        await api.delete(`/system/chart/accounts/${accountId}`);

        Notify.create({
          message: t("Account deleted successfully"),
          color: "positive",
          position: "center",
        });

        await fetchData();
      })
      .onCancel(() => {
        Notify.create({
          message: t("Account deletion canceled"),
          color: "warning",
          position: "center",
        });
      });
  } catch (error) {
    Notify.create({
      message: t("Failed to delete account") + error,
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
}

const downloadExcel = () => {
  const headerRow = [
    "Account",
    "GIFI",
    "Description",
    "Type",
    "Contra",
    "Drop-down",
    "Closed",
    "Chart Type",
  ];

  const exportData = [];

  exportData.push(["Chart Of Accounts"]);
  exportData.push([]);
  exportData.push(headerRow);

  results.value.forEach((account) => {
    const row = [
      account.accno,
      account.gifi_accno || "",
      account.description,
      mapCategory(account.category),
      account.contra === 1 ? "*" : "",
      account.link
        ? splitLink(account.link)
            .map((code) => mapLink(code))
            .join(", ")
        : "",
      account.closed === 1 ? t("Yes") : "",
      account.charttype,
    ];

    exportData.push(row);
  });

  const worksheet = utils.aoa_to_sheet(exportData);

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: headerRow.length - 1 },
    },
  ];

  const titleCell = utils.encode_cell({ r: 0, c: 0 });
  worksheet[titleCell].s = {
    alignment: { horizontal: "center", vertical: "center" },
  };

  worksheet["!cols"] = headerRow.map((header, colIdx) => {
    let maxLength = header.length;
    exportData.forEach((row) => {
      const cellValue = row[colIdx];
      if (cellValue != null) {
        maxLength = Math.max(maxLength, cellValue.toString().length);
      }
    });
    return { wch: maxLength + 2 };
  });

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Chart of Accounts");
  writeFile(workbook, "chart_of_accounts.xlsx", { compression: true });
};

onMounted(() => {
  fetchGifi();
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
