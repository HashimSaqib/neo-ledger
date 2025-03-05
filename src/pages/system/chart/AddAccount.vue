<template>
  <q-page class="q-pa-sm">
    <q-card class="q-pa-sm" style="max-width: 600px">
      <q-card-section class="q-pa-xs">
        <q-form @submit.prevent="saveAccount(true)" class="q-gutter-xs">
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

          <!-- Row 5: Drop-down Menu Options (only if Chart Type is Account) -->
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
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.AR_paid"
                  :label="t('Payment')"
                  true-value="AR_paid"
                  false-value=""
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.AR_discount"
                  :label="t('Discount')"
                  true-value="AR_discount"
                  false-value=""
                />
                <div />
                <q-checkbox
                  dense
                  v-model="selectedAccount.AR_tax"
                  :label="t('Tax')"
                  true-value="AR_tax"
                  false-value=""
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
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.AP_paid"
                  :label="t('Payment')"
                  true-value="AP_paid"
                  false-value=""
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.AP_discount"
                  :label="t('Discount')"
                  true-value="AP_discount"
                  false-value=""
                />
                <div />

                <q-checkbox
                  dense
                  v-model="selectedAccount.AP_tax"
                  :label="t('Tax')"
                  true-value="AP_tax"
                  false-value=""
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
                />
                <div />

                <q-checkbox
                  dense
                  v-model="selectedAccount.IC_cogs"
                  :label="t('COGS')"
                  true-value="IC_cogs"
                  false-value=""
                />
                <div />

                <q-checkbox
                  dense
                  v-model="selectedAccount.IC_taxpart"
                  :label="t('Tax')"
                  true-value="IC_taxpart"
                  false-value=""
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
                />
                <q-checkbox
                  dense
                  v-model="selectedAccount.IC_expense"
                  :label="t('Expense')"
                  true-value="IC_expense"
                  false-value=""
                />
                <div />
                <q-checkbox
                  dense
                  v-model="selectedAccount.IC_taxservice"
                  :label="t('Tax')"
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
            :label="t('GIFI')"
            class="q-mt-xs"
          />

          <!-- Form Action: Only Save button -->
          <div class="row justify-end q-mt-sm">
            <q-btn label="Save" color="primary" type="submit" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, inject } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
const updateTitle = inject("updateTitle");
updateTitle("Add Chart");
const { t } = useI18n();

// Initialize a reactive object with default values for a new account
const selectedAccount = ref({
  accno: "",
  description: "",
  category: "",
  closed: "0",
  contra: "0",
  charttype: "A", // default to Account
  AR: "",
  AP: "",
  IC: "",
  // Drop-down options (initialize as empty strings)
  AR_amount: "",
  AR_paid: "",
  AR_discount: "",
  AR_tax: "",
  AP_amount: "",
  AP_paid: "",
  AP_discount: "",
  AP_tax: "",
  IC_sale: "",
  IC_cogs: "",
  IC_taxpart: "",
  IC_income: "",
  IC_expense: "",
  IC_taxservice: "",
  gifi_accno: "",
  link: "",
});

// Options for account type and chart type
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

// All possible link codes for drop-down menus
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

function countSelected(options) {
  return options.reduce(
    (count, opt) => count + (selectedAccount.value[opt] ? 1 : 0),
    0
  );
}

async function saveAccount(isNew = true) {
  // Validate required fields
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

  // Ensure only one of AR, AP or IC is selected
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

  // Validate drop-down options for AR and AP
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

  // Compile selected drop-down links into one string
  const links = [];
  possibleLinks.forEach((code) => {
    if (selectedAccount.value[code]) links.push(code);
  });
  selectedAccount.value.link = links.join(":");

  try {
    // Save as new account
    await api.post(`/system/chart/accounts/`, selectedAccount.value);
    Notify.create({
      message: t("Account saved successfully"),
      color: "positive",
      position: "center",
    });

    // Reset the form (if desired)
    resetForm();
  } catch (error) {
    Notify.create({
      message: t("Failed to save account"),
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
}

function resetForm() {
  selectedAccount.value = {
    accno: "",
    description: "",
    category: "",
    closed: "0",
    contra: "0",
    charttype: "A",
    AR: "",
    AP: "",
    IC: "",
    AR_amount: "",
    AR_paid: "",
    AR_discount: "",
    AR_tax: "",
    AP_amount: "",
    AP_paid: "",
    AP_discount: "",
    AP_tax: "",
    IC_sale: "",
    IC_cogs: "",
    IC_taxpart: "",
    IC_income: "",
    IC_expense: "",
    IC_taxservice: "",
    gifi_accno: "",
    link: "",
  };
}
</script>

<style scoped>
/* Optional styling for sticky table headers or any custom styles */
</style>
