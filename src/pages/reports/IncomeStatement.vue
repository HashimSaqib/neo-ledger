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
          </div>

          <!-- Period Type Selection -->
          <div class="row q-gutter-sm">
            <div class="col-12">
              <q-option-group
                v-model="formData.periodMode"
                :options="periodModeOptions"
                inline
                dense
                :label="t('Period Type')"
              />
            </div>
          </div>

          <!-- Custom Periods Section with Drag & Drop -->
          <div class="q-mt-md">
            <div class="text-h6">{{ t("Custom Periods") }}</div>
            <!-- draggable component wraps the period list -->
            <draggable
              v-model="formData.periods"
              group="periods"
              handle=".drag-handle"
            >
              <template #item="{ element, index }">
                <div class="row q-gutter-sm q-mt-xs items-center">
                  <!-- Drag handle icon for rearranging -->
                  <div class="col-auto">
                    <q-icon
                      name="drag_indicator"
                      class="cursor-move drag-handle"
                    />
                  </div>
                  <!-- Current Mode: only year -->
                  <template v-if="formData.periodMode === 'current'">
                    <div class="col-12 col-md-3">
                      <s-select
                        v-model="element.year"
                        :options="yearOptions"
                        outlined
                        dense
                        :label="t('Year')"
                        emit-value
                        map-options
                        @update:model-value="() => updatePeriod(element)"
                        search="label"
                      />
                    </div>
                  </template>
                  <!-- Monthly Mode: month and year -->
                  <template v-else-if="formData.periodMode === 'monthly'">
                    <div class="col-12 col-md-3">
                      <s-select
                        v-model="element.month"
                        :options="monthOptions"
                        outlined
                        dense
                        :label="t('Month')"
                        emit-value
                        map-options
                        @update:model-value="() => updatePeriod(element)"
                        search="label"
                      />
                    </div>
                    <div class="col-12 col-md-3">
                      <s-select
                        v-model="element.year"
                        :options="yearOptions"
                        outlined
                        dense
                        :label="t('Year')"
                        emit-value
                        map-options
                        @update:model-value="() => updatePeriod(element)"
                        search="label"
                      />
                    </div>
                  </template>
                  <!-- Quarterly Mode: quarter and year -->
                  <template v-else-if="formData.periodMode === 'quarterly'">
                    <div class="col-12 col-md-3">
                      <s-select
                        v-model="element.quarter"
                        :options="quarterOptions"
                        outlined
                        dense
                        :label="t('Quarter')"
                        emit-value
                        map-options
                        @update:model-value="() => updatePeriod(element)"
                        search="label"
                      />
                    </div>
                    <div class="col-12 col-md-3">
                      <s-select
                        v-model="element.year"
                        :options="yearOptions"
                        outlined
                        dense
                        :label="t('Year')"
                        emit-value
                        map-options
                        @update:model-value="() => updatePeriod(element)"
                        search="label"
                      />
                    </div>
                  </template>
                  <!-- Yearly Mode: only year -->
                  <template v-else-if="formData.periodMode === 'yearly'">
                    <div class="col-12 col-md-3">
                      <s-select
                        v-model="element.year"
                        :options="yearOptions"
                        outlined
                        dense
                        :label="t('Year')"
                        emit-value
                        map-options
                        @update:model-value="() => updatePeriod(element)"
                        search="label"
                      />
                    </div>
                  </template>
                  <!-- Custom Mode: date pickers for fromdate & todate -->
                  <template v-else-if="formData.periodMode === 'custom'">
                    <div class="col-12 col-md-3">
                      <q-input
                        v-model="element.fromdate"
                        type="date"
                        outlined
                        dense
                        :label="t('From Date')"
                        @update:model-value="() => updatePeriod(element)"
                      />
                    </div>
                    <div class="col-12 col-md-3">
                      <q-input
                        v-model="element.todate"
                        type="date"
                        outlined
                        dense
                        :label="t('To Date')"
                        @update:model-value="() => updatePeriod(element)"
                      />
                    </div>
                    <!-- Hidden input to store the automatic label -->
                    <div style="display: none">
                      <q-input v-model="element.label" readonly />
                    </div>
                  </template>

                  <!-- Delete Button -->
                  <div class="col-12 col-md-1">
                    <q-btn
                      icon="delete"
                      color="negative"
                      flat
                      round
                      @click="removePeriod(index)"
                    />
                  </div>
                </div>
              </template>
            </draggable>
            <q-btn
              icon="add"
              :label="t('Add Period')"
              flat
              @click="addPeriod"
              class="q-mt-sm"
            />
          </div>

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
    <q-card
      v-if="results && Object.keys(results).length"
      class="shadow-2"
      ref="reportContent"
    >
      <q-card-actions class="q-pa-sm no-print">
        <q-btn :label="t('Export')" @click="downloadExcel" color="accent" />
        <q-btn :label="t('Print')" @click="triggerPrint" color="info" />
      </q-card-actions>
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
          <q-item class="q-pa-xs q-my-none">
            <q-item-section v-if="formData.l_accno" avatar></q-item-section>
            <q-item-section>{{ t("Description") }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right"
            >
              <strong>{{ period.label }}</strong>
            </q-item-section>
          </q-item>
          <div class="text-h5 text-primary q-my-none q-mb-md">
            {{ t("Income") }}
          </div>
          <q-separator />
          <q-list bordered separator>
            <template v-for="(account, index) in incomeAccounts" :key="index">
              <q-item
                :class="{
                  'mutedbg text-bold': account.charttype === 'H',
                }"
              >
                <q-item-section v-if="formData.l_accno" avatar>
                  <router-link
                    :to="getPath(account.accno)"
                    target="_blank"
                    v-if="account.charttype === 'A'"
                  >
                    <q-badge color="primary">{{ account.accno }}</q-badge>
                  </router-link>
                  <q-badge color="primary" v-else>{{ account.accno }}</q-badge>
                </q-item-section>
                <q-item-section>{{ account.description }}</q-item-section>
                <q-item-section
                  v-for="period in results.periods"
                  :key="period.label"
                  class="col text-right"
                >
                  <template v-if="account.periods[period.label] !== undefined">
                    <template v-if="account.periods[period.label].amount < 0">
                      ({{
                        formatAmount(
                          Math.abs(account.periods[period.label].amount)
                        )
                      }})
                    </template>
                    <template v-else>
                      {{ formatAmount(account.periods[period.label].amount) }}
                    </template>
                  </template>
                  <template v-else>-</template>
                </q-item-section>
              </q-item>
              <q-separator v-if="account.charttype === 'H'" />
            </template>
          </q-list>
          <!-- Income Subtotal Row -->
          <q-item class="q-pa-sm items-center">
            <q-item-section v-if="formData.l_accno" avatar></q-item-section>
            <q-item-section>
              {{ t("Total Income") }}
            </q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{ formatAmount(sumAccounts(incomeAccounts, period.label)) }}
            </q-item-section>
          </q-item>
        </div>

        <!-- Expenses Section -->
        <div>
          <div class="text-h5 text-primary q-mb-md">{{ t("Expenses") }}</div>
          <q-list bordered separator>
            <template v-for="(account, index) in expenseAccounts" :key="index">
              <q-item
                :class="{
                  'mutedbg text-bold': account.charttype === 'H',
                }"
              >
                <q-item-section v-if="formData.l_accno" avatar>
                  <router-link
                    :to="getPath(account.accno)"
                    target="_blank"
                    v-if="account.charttype === 'A'"
                  >
                    <q-badge color="primary">{{ account.accno }}</q-badge>
                  </router-link>
                  <q-badge color="primary" v-else>{{ account.accno }}</q-badge>
                </q-item-section>
                <q-item-section>{{ account.description }}</q-item-section>
                <q-item-section
                  v-for="period in results.periods"
                  :key="period.label"
                  class="col text-right"
                >
                  <template v-if="account.periods[period.label] !== undefined">
                    <template v-if="account.periods[period.label].amount < 0">
                      ({{
                        formatAmount(
                          Math.abs(account.periods[period.label].amount)
                        )
                      }})
                    </template>
                    <template v-else>
                      {{ formatAmount(account.periods[period.label].amount) }}
                    </template>
                  </template>
                  <template v-else>-</template>
                </q-item-section>
              </q-item>
              <q-separator v-if="account.charttype === 'H'" />
            </template>
          </q-list>
          <!-- Expense Subtotal Row -->
          <q-item class="q-pa-sm items-center">
            <q-item-section v-if="formData.l_accno" avatar></q-item-section>
            <q-item-section>
              {{ t("Total Expenses") }}
            </q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{ formatAmount(sumAccounts(expenseAccounts, period.label)) }}
            </q-item-section>
          </q-item>
        </div>

        <!-- Net Income -->
        <q-separator />
        <q-item class="items-center q-my-none q-py-none text-bold">
          <q-item-section v-if="formData.l_accno" avatar></q-item-section>
          <q-item-section class="q-pa-sm">
            {{ t("Income/(Loss)") }}:
          </q-item-section>
          <q-item-section
            v-for="period in results.periods"
            :key="period.label"
            class="col text-right"
          >
            <template v-if="netIncome(period.label) < 0">
              ({{ formatAmount(Math.abs(netIncome(period.label))) }})
            </template>
            <template v-else>
              {{ formatAmount(netIncome(period.label)) }}
            </template>
          </q-item-section>
        </q-item>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
// Imports and dependency registration
import { ref, computed, onMounted, watch, inject } from "vue";
import { date } from "quasar";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { formatAmount, roundAmount } from "src/helpers/utils.js";
import { utils, writeFile } from "xlsx";
// Import draggable for drag & drop functionality
import draggable from "vuedraggable";

const triggerPrint = inject("triggerPrint");
const updateTitle = inject("updateTitle");
updateTitle("Income Statement");
const printToggle = inject("printToggle");

const { t } = useI18n();
const route = useRoute();
const now = new Date();
const currentYear = String(now.getFullYear());
const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

// Main form data
const formData = ref({
  department: route.query.department || "",
  projectnumber: route.query.projectnumber || "",
  currency: "PKR",
  decimalplaces: "2",
  usetemplate: false,
  method: "accrual",
  l_heading: false,
  l_subtotal: false,
  l_accno: true,
  previousyear: "0",
  reversedisplay: false,
  accounttype: "standard",
  periodMode: "current", // Options: current, monthly, quarterly, yearly, custom
  periods: [],
});

// Options for period modes, including the new "custom" option
const periodModeOptions = [
  { label: t("Current"), value: "current" },
  { label: t("Monthly"), value: "monthly" },
  { label: t("Quarterly"), value: "quarterly" },
  { label: t("Yearly"), value: "yearly" },
  { label: t("Custom"), value: "custom" },
];

// Options for months, years, and quarters
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: date.formatDate(new Date(2000, i, 1), "MMMM"),
}));

const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const yr = String(now.getFullYear() - i);
  return { value: yr, label: yr };
});

const quarterOptions = [
  { label: "Q1", value: "Q1" },
  { label: "Q2", value: "Q2" },
  { label: "Q3", value: "Q3" },
  { label: "Q4", value: "Q4" },
];

const departments = ref([]);
const projects = ref([]);
const currencies = ref([]);
const filtersOpen = ref(true);
const loading = ref(false);
const results = ref({});

// Computed property to format the date range from periods
const formattedDateRange = computed(() => {
  if (formData.value.periods.length) {
    return formData.value.periods.map((p) => p.label).join(", ");
  }
  return t("N/A");
});

// Update period details based on current mode
const updatePeriod = (period) => {
  if (formData.value.periodMode === "current") {
    if (period.year) {
      const selectedYear = parseInt(period.year, 10);
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      period.fromdate = String(selectedYear - 1) + "1231";
      period.todate = period.year + month + day;
      period.label = t("Current") + " " + period.year;
    }
  } else if (formData.value.periodMode === "monthly") {
    if (period.month && period.year) {
      const selectedYear = period.year;
      const selectedMonth = period.month;
      const lastDay = new Date(
        parseInt(selectedYear, 10),
        parseInt(selectedMonth, 10),
        0
      ).getDate();
      period.fromdate = period.year + selectedMonth + "01";
      period.todate =
        period.year + selectedMonth + String(lastDay).padStart(2, "0");
      const monthObj = monthOptions.find((m) => m.value === selectedMonth);
      period.label = monthObj
        ? monthObj.label + " " + period.year
        : period.month + " " + period.year;
    }
  } else if (formData.value.periodMode === "quarterly") {
    if (period.quarter && period.year) {
      if (period.quarter === "Q1") {
        period.fromdate = period.year + "0101";
        period.todate = period.year + "0331";
      } else if (period.quarter === "Q2") {
        period.fromdate = period.year + "0401";
        period.todate = period.year + "0630";
      } else if (period.quarter === "Q3") {
        period.fromdate = period.year + "0701";
        period.todate = period.year + "0930";
      } else if (period.quarter === "Q4") {
        period.fromdate = period.year + "1001";
        period.todate = period.year + "1231";
      }
      period.label = period.quarter + " " + period.year;
    }
  } else if (formData.value.periodMode === "yearly") {
    if (period.year) {
      period.fromdate = period.year + "0101";
      period.todate = period.year + "1231";
      period.label = period.year;
    }
  } else if (formData.value.periodMode === "custom") {
    if (period.fromdate && period.todate) {
      period.label = period.fromdate + " - " + period.todate;
    }
  }
};

// Add a new period line
// If a period already exists, clone its values; otherwise, set defaults.
const addPeriod = () => {
  let newPeriod = {};
  if (formData.value.periods.length > 0) {
    const lastPeriod =
      formData.value.periods[formData.value.periods.length - 1];
    newPeriod = { ...lastPeriod };
  } else {
    if (formData.value.periodMode === "current") {
      newPeriod = { year: currentYear, fromdate: "", todate: "", label: "" };
    } else if (formData.value.periodMode === "monthly") {
      newPeriod = {
        month: currentMonth,
        year: currentYear,
        fromdate: "",
        todate: "",
        label: "",
      };
    } else if (formData.value.periodMode === "quarterly") {
      newPeriod = {
        quarter: "Q1",
        year: currentYear,
        fromdate: "",
        todate: "",
        label: "",
      };
    } else if (formData.value.periodMode === "yearly") {
      newPeriod = { year: currentYear, fromdate: "", todate: "", label: "" };
    } else if (formData.value.periodMode === "custom") {
      const today = date.formatDate(new Date(), "YYYY-MM-DD");
      newPeriod = {
        fromdate: today,
        todate: today,
        label: today + " - " + today,
      };
    }
  }
  formData.value.periods.push(newPeriod);
  updatePeriod(newPeriod);
};

// Remove a period line
const removePeriod = (index) => {
  formData.value.periods.splice(index, 1);
};

// Sum amounts for a given period label from an array of accounts
const sumAccounts = (accountsArray, periodLabel) => {
  return accountsArray.reduce((sum, account) => {
    const amount = account.periods[periodLabel]?.amount || 0;
    return sum + Number(amount);
  }, 0);
};

// Calculate net income from income and expense accounts for a period
const netIncome = (periodLabel) => {
  const incomeSum = sumAccounts(incomeAccounts.value, periodLabel);
  const expenseSum = sumAccounts(expenseAccounts.value, periodLabel);
  return incomeSum + expenseSum;
};

// Execute search/report generation
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

// Helper function to build the trial transaction URL from the first period
const getPath = (accno) => {
  if (!formData.value.periods || formData.value.periods.length === 0) {
    return "";
  }
  const formatDateStr = (dateStr) =>
    `${dateStr.substr(0, 4)}-${dateStr.substr(4, 2)}-${dateStr.substr(6, 2)}`;
  const period = formData.value.periods[0];
  const fromdate = formatDateStr(period.fromdate);
  const todate = formatDateStr(period.todate);
  return `/reports/trial_transactions?accno=${encodeURIComponent(
    accno
  )}&fromdate=${encodeURIComponent(fromdate)}&todate=${encodeURIComponent(
    todate
  )}`;
};

// Compute income accounts from results
const incomeAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  return Object.keys(rawAccounts).reduce((acc, accno) => {
    const accountPeriods = rawAccounts[accno];
    let periodsData = {};
    Object.keys(accountPeriods).forEach((periodLabel) => {
      if (accountPeriods[periodLabel].I) {
        periodsData[periodLabel] = accountPeriods[periodLabel].I;
      }
    });
    if (Object.keys(periodsData).length > 0) {
      acc.push({
        accno,
        description: results.value.accounts?.[accno]?.description,
        charttype: results.value.accounts?.[accno]?.charttype,
        periods: periodsData,
      });
    }
    return acc;
  }, []);
});

// Compute expense accounts from results
const expenseAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  return Object.keys(rawAccounts).reduce((acc, accno) => {
    const accountPeriods = rawAccounts[accno];
    let periodsData = {};
    Object.keys(accountPeriods).forEach((periodLabel) => {
      if (accountPeriods[periodLabel].E) {
        periodsData[periodLabel] = accountPeriods[periodLabel].E;
      }
    });
    if (Object.keys(periodsData).length > 0) {
      acc.push({
        accno,
        description: results.value.accounts?.[accno]?.description,
        charttype: results.value.accounts?.[accno]?.charttype,
        periods: periodsData,
      });
    }
    return acc;
  }, []);
});

// Fetch lookup data for links and select options
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

const downloadExcel = () => {
  const includeAccNo = formData.value.l_accno;
  let headerRow = includeAccNo ? ["Acc No", "Description"] : ["Description"];
  const periods = results.value.periods || [];
  periods.forEach((period) => {
    headerRow.push(period.label);
  });

  const exportData = [];
  const groupHeaderIndices = [];

  exportData.push(["Income Statement"]);
  groupHeaderIndices.push(0);
  exportData.push([]);
  exportData.push(headerRow);
  exportData.push(["Income"]);
  groupHeaderIndices.push(exportData.length - 1);

  incomeAccounts.value.forEach((account) => {
    let row = [];
    if (includeAccNo) {
      row.push(account.accno, account.description);
    } else {
      row.push(account.description);
    }
    periods.forEach((period) => {
      const amt = account.periods[period.label]
        ? account.periods[period.label].amount
        : 0;
      row.push(roundAmount(amt));
    });
    exportData.push(row);
  });

  let incomeTotalRow = includeAccNo ? ["", "Total Income"] : ["Total Income"];
  periods.forEach((period) => {
    const total = sumAccounts(incomeAccounts.value, period.label);
    incomeTotalRow.push(roundAmount(total));
  });
  exportData.push(incomeTotalRow);
  exportData.push([]);
  exportData.push(["Expenses"]);
  groupHeaderIndices.push(exportData.length - 1);

  expenseAccounts.value.forEach((account) => {
    let row = [];
    if (includeAccNo) {
      row.push(account.accno, account.description);
    } else {
      row.push(account.description);
    }
    periods.forEach((period) => {
      const amt = account.periods[period.label]
        ? account.periods[period.label].amount
        : 0;
      row.push(roundAmount(amt));
    });
    exportData.push(row);
  });

  let expenseTotalRow = includeAccNo
    ? ["", "Total Expenses"]
    : ["Total Expenses"];
  periods.forEach((period) => {
    const total = sumAccounts(expenseAccounts.value, period.label);
    expenseTotalRow.push(roundAmount(total));
  });
  exportData.push(expenseTotalRow);
  exportData.push([]);
  let netIncomeRow = includeAccNo ? ["", "Net Income"] : ["Net Income"];
  periods.forEach((period) => {
    const net = netIncome(period.label);
    netIncomeRow.push(roundAmount(net));
  });
  exportData.push(netIncomeRow);

  const worksheet = utils.aoa_to_sheet(exportData);
  worksheet["!merges"] = worksheet["!merges"] || [];
  groupHeaderIndices.forEach((rowIdx) => {
    worksheet["!merges"].push({
      s: { r: rowIdx, c: 0 },
      e: { r: rowIdx, c: headerRow.length - 1 },
    });
    const cellRef = utils.encode_cell({ r: rowIdx, c: 0 });
    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  });

  worksheet["!cols"] = headerRow.map((header, colIdx) => {
    let maxLength = header ? header.toString().length : 0;
    exportData.forEach((row) => {
      const cellValue = row[colIdx];
      if (cellValue != null) {
        maxLength = Math.max(maxLength, cellValue.toString().length);
      }
    });
    return { wch: maxLength + 2 };
  });

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Income Statement");
  writeFile(workbook, "income_statement.xlsx", { compression: true });
};

// Watch for changes in period mode and reset periods accordingly
watch(
  () => formData.value.periodMode,
  () => {
    formData.value.periods = [];
    addPeriod();
  }
);

onMounted(() => {
  if (route.query.fromdate || route.query.todate) {
    search();
  }
  fetchLinks();
  if (formData.value.periods.length === 0) {
    addPeriod();
  }
});
</script>

<style scoped>
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
