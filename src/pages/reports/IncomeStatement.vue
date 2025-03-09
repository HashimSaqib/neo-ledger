<template>
  <q-page class="q-pa-sm">
    <!-- Search Form Card -->
    <q-expansion-item
      :label="t('Report Parameters')"
      class="q-mb-md"
      header-class="mainbg maintext"
      expand-icon-class="maintext"
      v-model="filtersOpen"
    >
      <q-card-section class="mainbg">
        <q-form @submit.prevent="search" class="q-gutter-y-sm">
          <!-- Date Range Section -->
          <div class="row q-gutter-sm">
            <div class="col-12 col-md-3">
              <q-input
                v-model="formData.fromdate"
                type="date"
                :label="t('From Date')"
                outlined
                stack-label
                dense
                clearable
              />
            </div>
            <div class="col-12 col-md-3">
              <q-input
                v-model="formData.todate"
                type="date"
                :label="t('To Date')"
                outlined
                stack-label
                dense
                clearable
              />
            </div>
            <div class="row col-12 items-center">
              <q-select
                v-model="formData.frommonth"
                :options="monthOptions"
                outlined
                dense
                :label="t('Start Month')"
                emit-value
                map-options
                class="col-3 q-mr-sm"
              />
              <q-select
                v-model="formData.fromyear"
                :options="yearOptions"
                outlined
                dense
                :label="t('Start Year')"
                emit-value
                map-options
                class="col-3 q-mr-sm"
              />
              <q-option-group
                v-model="formData.interval"
                :options="includePeriodOptions"
                inline
                dense
                type="radio"
                :label="t('Period Granularity')"
              />
            </div>
          </div>

          <!-- Filters Section -->
          <div class="row q-gutter-sm q-mt-none">
            <div class="col-12 col-md-3">
              <q-select
                v-if="departments.length > 0"
                v-model="formData.department"
                :options="departments"
                :label="t('Department')"
                option-label="description"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="formData.projectnumber"
                :options="projects"
                option-label="description"
                :label="t('Project')"
                outlined
                dense
                clearable
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="formData.currency"
                :options="currencies"
                option-value="curr"
                option-label="curr"
                emit-value
                map-options
                outlined
                dense
                :label="t('Currency')"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="formData.interval"
                :options="intervalOptions"
                outlined
                dense
                :label="t('Reporting Period')"
                emit-value
                map-options
              />
            </div>
            <q-input
              v-model="formData.decimalplaces"
              type="number"
              min="0"
              max="4"
              :label="t('Decimal Places')"
              outlined
              dense
              class="col-1"
            />
          </div>

          <div class="q-pa-sm">
            <!-- Accounting Method -->
            <div class="row items-center q-mb-sm">
              <div class="col-12 col-md-4">
                <q-option-group
                  v-model="formData.method"
                  :options="methodOptions"
                  inline
                  dense
                  :label="t('Accounting Method')"
                />
              </div>
            </div>

            <!-- Report Formatting -->
            <div class="row items-center q-mb-sm">
              <div class="col-12 col-md-4">
                <q-option-group
                  v-model="formData.accounttype"
                  :options="accountTypeOptions"
                  inline
                  dense
                  :label="t('Account Type')"
                  type="radio"
                />
              </div>
            </div>

            <!-- Display Options -->
            <div class="row q-gutter-md">
              <q-checkbox
                v-model="formData.l_accno"
                :label="t('Show Account Numbers')"
                color="primary"
                dense
              />
              <q-checkbox
                v-model="formData.previousyear"
                :label="t('Include Previous Year')"
                color="primary"
                dense
                true-value="Y"
                false-value="0"
              />
              <q-checkbox
                v-model="formData.reversedisplay"
                :label="t('Reverse Display')"
                color="primary"
                dense
              />
            </div>

            <!-- Period Options -->
            <div class="row"></div>
          </div>

          <!-- Submit Button -->
          <div class="row q-mt-sm">
            <q-btn
              type="submit"
              :label="t('Generate Report')"
              color="primary"
              icon="description"
              :loading="loading"
            >
              <template v-slot:loading>
                <q-spinner-hourglass class="on-left" />
                {{ t("Generating...") }}
              </template>
            </q-btn>
          </div>
        </q-form>
      </q-card-section>
    </q-expansion-item>

    <!-- Report Output -->
    <q-card v-if="results && Object.keys(results).length" class="shadow-2">
      <!-- Report Header -->
      <q-card-section v-if="results.company" class="mutedbg">
        <div class="text-center q-pa-sm">
          <div class="text-h4 text-primary q-mb-sm">{{ results.company }}</div>
          <div class="maintext">
            <div v-if="results.address">{{ results.address }}</div>
            <div v-if="results.companyemail">{{ results.companyemail }}</div>
            <div v-if="results.companywebsite">
              {{ results.companywebsite }}
            </div>
          </div>
          <div class="text-caption q-mt-sm">
            {{ formattedDateRange }}
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <!-- Income Section -->
        <div>
          <!-- Column Headers (only shown if comparing with previous year) -->
          <q-item
            v-if="formData.previousyear === 'Y'"
            class="q-pa-xs q-my-none"
          >
            <q-item-section v-if="formData.l_accno" avatar></q-item-section>
            <q-item-section></q-item-section>
            <q-item-section class="col-3 text-right">
              <strong>{{ t("Previous Period") }}</strong>
            </q-item-section>
            <q-item-section class="col-3 text-right">
              <strong>{{ t("This Period") }}</strong>
            </q-item-section>
          </q-item>
          <div class="text-h5 text-primary q-my-none q-mb-md">
            {{ t("Income") }}
          </div>

          <q-separator v-if="formData.previousyear === 'Y'" />

          <!-- Income Items List -->
          <q-list bordered separator>
            <template v-for="(account, key) in results.I" :key="key">
              <q-item
                :class="{
                  'mutedbg text-bold': account.this[0].charttype === 'H',
                  'q-pl-xl': account.this[0].charttype !== 'H',
                }"
              >
                <q-item-section v-if="formData.l_accno" avatar>
                  <q-badge color="primary">{{ account.this[0].accno }}</q-badge>
                </q-item-section>
                <q-item-section>{{
                  account.this[0].description
                }}</q-item-section>

                <q-item-section
                  v-if="formData.previousyear === 'Y'"
                  class="col-3 text-right"
                >
                  <template v-if="account.previous?.[0]?.amount !== undefined">
                    <template v-if="account.previous[0].amount < 0">
                      ({{ formatAmount(Math.abs(account.previous[0].amount)) }})
                    </template>
                    <template v-else>
                      {{ formatAmount(account.previous[0].amount) }}
                    </template>
                  </template>
                  <template v-else>-</template>
                </q-item-section>

                <!-- Current period amount - right-aligned with special formatting -->
                <q-item-section
                  :class="[
                    formData.previousyear === 'Y' ? 'col-3' : 'col-6',
                    'text-right',
                  ]"
                >
                  <template v-if="account.this[0].amount < 0">
                    ({{ formatAmount(Math.abs(account.this[0].amount)) }})
                  </template>
                  <template v-else>
                    {{ formatAmount(account.this[0].amount) }}
                  </template>
                </q-item-section>
              </q-item>
              <q-separator v-if="account.this[0].charttype === 'H'" />
            </template>
          </q-list>

          <!-- Income Subtotal -->
          <div class="row q-pa-sm text-h6 items-center">
            <div
              :class="[formData.previousyear === 'Y' ? 'col-6' : 'col-6']"
            ></div>
            <div v-if="formData.previousyear === 'Y'" class="col-3 text-right">
              <template v-if="previousIncomeSubtotal < 0">
                ({{ formatAmount(Math.abs(previousIncomeSubtotal)) }})
              </template>
              <template v-else>
                {{ formatAmount(previousIncomeSubtotal) }}
              </template>
            </div>
            <div
              :class="[
                formData.previousyear === 'Y' ? 'col-3' : 'col-6',
                'text-right',
              ]"
            >
              <template v-if="incomeSubtotal < 0">
                ({{ formatAmount(Math.abs(incomeSubtotal)) }})
              </template>
              <template v-else>
                {{ formatAmount(incomeSubtotal) }}
              </template>
            </div>
          </div>
        </div>

        <!-- Expenses Section -->
        <div>
          <div class="text-h5 text-primary q-mb-md">{{ t("Expenses") }}</div>

          <!-- Expenses Items List -->
          <q-list bordered separator>
            <template v-for="(account, key) in results.E" :key="key">
              <q-item
                :class="{
                  'mutedbg text-bold': account.this[0].charttype === 'H',
                  'q-pl-xl': account.this[0].charttype !== 'H',
                }"
              >
                <q-item-section v-if="formData.l_accno" avatar>
                  <q-badge color="primary">{{ account.this[0].accno }}</q-badge>
                </q-item-section>
                <q-item-section>{{
                  account.this[0].description
                }}</q-item-section>

                <!-- Previous period amount - right-aligned with special formatting for expenses -->
                <q-item-section
                  v-if="formData.previousyear === 'Y'"
                  class="col-3 text-right"
                >
                  <template v-if="account.previous?.[0]?.amount !== undefined">
                    <template v-if="account.previous[0].amount > 0">
                      ({{ formatAmount(account.previous[0].amount) }})
                    </template>
                    <template v-else>
                      {{ formatAmount(Math.abs(account.previous[0].amount)) }}
                    </template>
                  </template>
                  <template v-else>-</template>
                </q-item-section>

                <!-- Current period amount - right-aligned with special formatting for expenses -->
                <q-item-section
                  :class="[
                    formData.previousyear === 'Y' ? 'col-3' : 'col-6',
                    'text-right',
                  ]"
                >
                  <template v-if="account.this[0].amount > 0">
                    ({{ formatAmount(account.this[0].amount) }})
                  </template>
                  <template v-else>
                    {{ formatAmount(Math.abs(account.this[0].amount)) }}
                  </template>
                </q-item-section>
              </q-item>
              <q-separator v-if="account.this[0].charttype === 'H'" />
            </template>
          </q-list>

          <!-- Expenses Subtotal -->
          <div class="row q-pa-sm text-h6 items-center">
            <div
              :class="[formData.previousyear === 'Y' ? 'col-6' : 'col-6']"
            ></div>
            <div v-if="formData.previousyear === 'Y'" class="col-3 text-right">
              <template v-if="previousExpenseSubtotal > 0">
                ({{ formatAmount(previousExpenseSubtotal) }})
              </template>
              <template v-else>
                {{ formatAmount(Math.abs(previousExpenseSubtotal)) }}
              </template>
            </div>
            <div
              :class="[
                formData.previousyear === 'Y' ? 'col-3' : 'col-6',
                'text-right',
              ]"
            >
              <template v-if="expenseSubtotal > 0">
                ({{ formatAmount(expenseSubtotal) }})
              </template>
              <template v-else>
                {{ formatAmount(Math.abs(expenseSubtotal)) }}
              </template>
            </div>
          </div>
        </div>

        <!-- Net Income -->
        <q-separator />
        <div class="row justify-between items-center q-my-none q-py-none">
          <div
            :class="[
              formData.previousyear === 'Y' ? 'col-6' : 'col-6',
              'text-h6 q-pa-sm',
            ]"
          >
            {{ t("Income/(Loss)") }}:
          </div>
          <div
            v-if="formData.previousyear === 'Y'"
            class="col-3 text-right text-h6"
          >
            <template v-if="previousNetIncome < 0">
              ({{ formatAmount(Math.abs(previousNetIncome)) }})
            </template>
            <template v-else>
              {{ formatAmount(previousNetIncome) }}
            </template>
          </div>
          <div
            :class="[
              formData.previousyear === 'Y' ? 'col-3' : 'col-6',
              'text-right text-h6',
            ]"
          >
            <template v-if="currentNetIncome < 0">
              ({{ formatAmount(Math.abs(currentNetIncome)) }})
            </template>
            <template v-else>
              {{ formatAmount(currentNetIncome) }}
            </template>
          </div>
        </div>
      </q-card-section>

      <!-- Report Actions -->
      <q-card-actions class="q-pa-sm">
        <q-btn icon="print" :label="t('Download PDF')" @click="printPDF" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { date } from "quasar";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { formatAmount } from "src/helpers/utils.js";
import html2pdf from "html2pdf.js";
const { t } = useI18n();
const route = useRoute();

// Form Data & Initial Values
const formData = ref({
  department: route.query.department || "",
  projectnumber: route.query.projectnumber || "",
  fromdate: route.query.fromdate || "",
  todate: route.query.todate || "",
  frommonth: "",
  fromyear: "",
  interval: "0",
  currency: "PKR",
  decimalplaces: "2",
  usetemplate: false,
  method: "accrual",
  l_heading: false,
  l_subtotal: false,
  l_accno: false,
  interval: "0",
  previousyear: "0",
  reversedisplay: false,
  accounttype: "standard",
});

// Report data and loading state
const results = ref({});
const loading = ref(false);
const departments = ref([]);
const projects = ref([]);
const filtersOpen = ref(true);
// Select Options
const currencies = ref([]);
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: date.formatDate(new Date(2000, i, 1), "MMMM"),
}));

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

const intervalOptions = [
  { label: t("Custom Date Range"), value: "0" },
  { label: t("Current Month"), value: "1" },
  { label: t("Current Quarter"), value: "3" },
  { label: t("Current Year"), value: "12" },
];

const methodOptions = [
  { label: t("Accrual "), value: "accrual" },
  { label: t("Cash "), value: "cash" },
];

const includePeriodOptions = ref([
  { label: t("Current"), value: "0" },
  { label: t("Monthly"), value: "1" },
  { label: t("Quarterly"), value: "3" },
  { label: t("Annual"), value: "12" },
]);

const accountTypeOptions = [
  { label: t("Standard Accounts"), value: "standard" },
  { label: t("GIFI Accounts"), value: "gifi" },
];

const parseYyyyMmDd = (dateStr) => {
  console.log(dateStr);
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  return new Date(year, month, day);
};

const formattedDateRange = computed(() => {
  const from = results.value.fromdate
    ? date.formatDate(parseYyyyMmDd(results.value.fromdate), "MMM D, YYYY")
    : t("N/A");
  const to = results.value.todate
    ? date.formatDate(parseYyyyMmDd(results.value.todate), "MMM D, YYYY")
    : t("N/A");
  return `${t("Report Period")}: ${from} - ${to}`;
});

const incomeSubtotal = computed(() => sumAccounts(results.value.I, "this"));
const previousIncomeSubtotal = computed(() =>
  sumAccounts(results.value.I, "previous")
);
const expenseSubtotal = computed(() => sumAccounts(results.value.E, "this"));
const previousExpenseSubtotal = computed(() =>
  sumAccounts(results.value.E, "previous")
);

const currentNetIncome = computed(
  () => incomeSubtotal.value + expenseSubtotal.value
);
const previousNetIncome = computed(
  () => previousIncomeSubtotal.value + previousExpenseSubtotal.value
);

const formatNetAmount = (value) => {
  if (value < 0) return `(${formatAmount(Math.abs(value))})`;
  return formatAmount(value);
};

const sumAccounts = (accounts, period = "this") => {
  if (!accounts) return 0;
  return Object.values(accounts).reduce((sum, account) => {
    const amount = account[period]?.[0]?.amount || 0;
    return sum + Number(amount);
  }, 0);
};

const search = async () => {
  try {
    loading.value = true;
    const response = await api.get("/reports/income_statement", {
      params: formData.value,
    });
    results.value = response.data;
    filtersOpen.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const printPDF = async () => {
  try {
    const paramData = { ...formData.value, usetemplate: "Y" };
    const response = await api.get("/reports/income_statement", {
      params: paramData,
    });
    const container = document.createElement("div");
    container.innerHTML = response.data.html_content;

    // Add a style element to modify h4 font size
    const style = document.createElement("style");
    style.textContent = `
    h4 {
      font-size: 1.2rem;
    }
  `;
    container.prepend(style);

    document.body.appendChild(container);

    const options = {
      margin: 0.5, // inches
      filename: `income-statement-${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    // Generate and download the PDF
    html2pdf()
      .set(options)
      .from(container)
      .save()
      .then(() => {
        // Remove the temporary container after PDF generation
        document.body.removeChild(container);
      });
  } catch (error) {
    console.log(error);
  }
};

const exportReport = async (format = "pdf") => {
  try {
    loading.value = true;
    const response = await api.post("/export/report", {
      format,
      data: results.value,
      config: formData.value,
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `income-statement-${Date.now()}.${format}`);
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    console.error("Export failed:", error);
  } finally {
    loading.value = false;
  }
};

const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/incomestatement");
    departments.value = response.data.departments;
    projects.value = response.data.projects;
    currencies.value = response.data.currencies;
  } catch (error) {
    console.error(error);
  }
};

// Lifecycle Hooks
onMounted(() => {
  if (route.query.fromdate || route.query.todate) {
    search();
  }
  fetchLinks();
});
</script>

<style scoped>
/* Improved print styles */
@media print {
  .q-page {
    padding: 0 !important;
  }
  .q-card,
  .q-card-section {
    box-shadow: none !important;
    border: none !important;
  }
  .q-btn,
  .q-expansion-item {
    display: none !important;
  }
  .text-primary {
    color: #000 !important;
  }
  .q-list--bordered {
    border: none !important;
  }
}

.border-top {
  border-top: 2px solid #eee;
  padding-top: 1rem;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.5rem;
  }
  .text-h5 {
    font-size: 1.2rem;
  }
  .q-item {
    padding: 8px 16px;
  }
}
</style>
