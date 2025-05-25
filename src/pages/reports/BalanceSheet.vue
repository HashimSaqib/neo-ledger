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
            <div class="col-12 col-md-3" v-if="departments.length > 0">
              <s-select
                v-model="formData.department"
                :options="departments"
                :label="t('Department')"
                option-value="value"
                option-label="description"
                outlined
                dense
                clearable
                emit-value
                map-options
                search="description"
              />
            </div>
            <div class="col-12 col-md-3" v-if="projects.length > 0">
              <s-select
                v-model="formData.projectnumber"
                :options="projects"
                option-label="description"
                option-value="value"
                :label="t('Project')"
                outlined
                dense
                clearable
                emit-value
                map-options
                search="description"
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
            <div class="row">
              <div class="text-h6">{{ t("As Of") }}</div>
              <q-btn
                :label="t('Add Date')"
                @click="addPeriod"
                class="q-ml-sm"
                color="primary"
              />
            </div>
            <!-- Draggable component wraps the period list -->
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
                      size="sm"
                    />
                  </div>
                  <!-- Current Mode: only current date -->
                  <template v-if="formData.periodMode === 'current'">
                    <div class="col-12 col-md-3">
                      <q-input
                        v-model="element.todate"
                        type="date"
                        outlined
                        dense
                        :label="t('As of Date')"
                        @update:model-value="() => updatePeriod(element)"
                      />
                    </div>
                  </template>
                  <!-- Monthly Mode: specific month-end -->
                  <template v-else-if="formData.periodMode === 'monthly'">
                    <div class="col-12 col-md-3">
                      <q-input
                        v-model="element.todate"
                        type="date"
                        outlined
                        dense
                        :label="t('Date')"
                        @update:model-value="() => updatePeriod(element)"
                      />
                    </div>
                  </template>
                  <!-- Quarterly Mode: quarter-end date -->
                  <template v-else-if="formData.periodMode === 'quarterly'">
                    <div class="col-12 col-md-3">
                      <q-input
                        v-model="element.todate"
                        type="date"
                        outlined
                        dense
                        :label="t('Date')"
                        @update:model-value="() => updatePeriod(element)"
                      />
                    </div>
                  </template>
                  <!-- Yearly Mode: year-end date -->
                  <template v-else-if="formData.periodMode === 'yearly'">
                    <div class="col-12 col-md-3">
                      <q-input
                        v-model="element.todate"
                        type="date"
                        outlined
                        dense
                        :label="t('Date')"
                        @update:model-value="() => updatePeriod(element)"
                      />
                    </div>
                  </template>
                  <!-- Custom Mode: specific date -->
                  <template v-else-if="formData.periodMode === 'custom'">
                    <div class="col-12 col-md-3">
                      <q-input
                        v-model="element.todate"
                        type="date"
                        outlined
                        dense
                        :label="t('As of Date')"
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
          </div>

          <!-- Report Formatting -->
          <div class="row items-center q-mb-sm" v-if="false">
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
          <div class="row q-gutter-md q-mt-sm">
            <q-checkbox
              v-model="formData.l_accno"
              :label="t('Show Account Numbers')"
              color="primary"
              dense
            />
            <q-checkbox
              v-model="formData.accounttype"
              :label="t('GIFI')"
              color="primary"
              dense
              true-value="gifi"
              false-value="standard"
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
        <q-btn :label="t('Print')" @click="getPDF" color="info" />
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
          <div class="text-h5 q-mt-sm">{{ t("Balance Sheet") }}</div>
          <div class="text-caption q-mt-sm">
            {{ formattedDateRange }}
          </div>
        </div>
      </q-card-section>
      <q-card-section>
        <!-- Assets Section -->
        <div>
          <!-- Header Row -->
          <q-item class="q-pa-xs q-my-none">
            <q-item-section>
              <strong>
                {{
                  formData.l_accno
                    ? t("Acc No - Description")
                    : t("Description")
                }}
              </strong>
            </q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right"
            >
              <strong>{{ period.label }}</strong>
            </q-item-section>
          </q-item>
          <div class="text-h5 text-primary q-my-none q-mb-md">
            {{ t("Assets") }}
          </div>
          <q-separator />
          <q-list bordered separator>
            <!-- Iterate over asset accounts (hidden accounts already excluded) -->
            <template v-for="(account, index) in assetAccounts" :key="index">
              <q-item>
                <q-item-section>
                  <div :style="{ marginLeft: `${account.level * 20}px` }">
                    <template v-if="account.charttype === 'H'">
                      <strong>{{ account.description }}</strong>
                    </template>
                    <template v-else>
                      {{
                        formData.l_accno
                          ? account.accno + " - " + account.description
                          : account.description
                      }}
                    </template>
                  </div>
                </q-item-section>
                <q-item-section
                  v-for="period in results.periods"
                  :key="period.label"
                  class="col text-right"
                >
                  <template v-if="account.periods[period.label] !== undefined">
                    <template v-if="account.charttype === 'A'">
                      <router-link
                        :to="getPath(account.accno, period)"
                        target="_blank"
                        style="text-decoration: none"
                        class="maintext"
                      >
                        {{
                          formatAmountCustom(
                            account.periods[period.label].amount
                          )
                        }}
                      </router-link>
                    </template>
                    <template v-else>
                      {{
                        formatAmountCustom(account.periods[period.label].amount)
                      }}
                    </template>
                  </template>
                  <template v-else>-</template>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
          <!-- Assets Subtotal Row -->
          <q-item class="q-pa-xs items-center">
            <q-item-section>{{ t("Total Assets") }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{ formatAmountCustom(sumAccounts(assetAccounts, period.label)) }}
            </q-item-section>
          </q-item>
        </div>

        <!-- Liabilities Section -->
        <div class="q-mt-sm">
          <div class="text-h5 text-primary q-mb-sm">{{ t("Liabilities") }}</div>
          <q-separator />
          <q-list bordered separator>
            <!-- Iterate over liability accounts (hidden accounts already excluded) -->
            <template
              v-for="(account, index) in liabilityAccounts"
              :key="index"
            >
              <q-item>
                <q-item-section>
                  <div :style="{ marginLeft: `${account.level * 20}px` }">
                    <template v-if="account.charttype === 'H'">
                      <strong>{{ account.description }}</strong>
                    </template>
                    <template v-else>
                      {{
                        formData.l_accno
                          ? account.accno + " - " + account.description
                          : account.description
                      }}
                    </template>
                  </div>
                </q-item-section>
                <q-item-section
                  v-for="period in results.periods"
                  :key="period.label"
                  class="col text-right"
                >
                  <template v-if="account.periods[period.label] !== undefined">
                    <template v-if="account.charttype === 'A'">
                      <router-link
                        :to="getPath(account.accno, period)"
                        target="_blank"
                        style="text-decoration: none"
                        class="maintext"
                      >
                        {{
                          formatAmountCustom(
                            account.periods[period.label].amount
                          )
                        }}
                      </router-link>
                    </template>
                    <template v-else>
                      {{
                        formatAmountCustom(account.periods[period.label].amount)
                      }}
                    </template>
                  </template>
                  <template v-else>-</template>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
          <!-- Liabilities Subtotal Row -->
          <q-item class="q-pa-xs items-center">
            <q-item-section>{{ t("Total Liabilities") }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(sumAccounts(liabilityAccounts, period.label))
              }}
            </q-item-section>
          </q-item>
        </div>

        <!-- Equity Section -->
        <div class="q-mt-md">
          <div class="text-h5 text-primary q-mb-md">{{ t("Equity") }}</div>
          <q-separator />
          <q-list bordered separator>
            <!-- Iterate over equity accounts (hidden accounts already excluded) -->
            <template v-for="(account, index) in equityAccounts" :key="index">
              <q-item>
                <q-item-section>
                  <div :style="{ marginLeft: `${account.level * 20}px` }">
                    <template v-if="account.charttype === 'H'">
                      <strong>{{ account.description }}</strong>
                    </template>
                    <template v-else>
                      {{
                        formData.l_accno
                          ? account.accno + " - " + account.description
                          : account.description
                      }}
                    </template>
                  </div>
                </q-item-section>
                <q-item-section
                  v-for="period in results.periods"
                  :key="period.label"
                  class="col text-right"
                >
                  <template v-if="account.periods[period.label] !== undefined">
                    <template v-if="account.charttype === 'A'">
                      <router-link
                        :to="getPath(account.accno, period)"
                        target="_blank"
                        style="text-decoration: none"
                        class="maintext"
                      >
                        {{
                          formatAmountCustom(
                            account.periods[period.label].amount
                          )
                        }}
                      </router-link>
                    </template>
                    <template v-else>
                      {{
                        formatAmountCustom(account.periods[period.label].amount)
                      }}
                    </template>
                  </template>
                  <template v-else>-</template>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
          <!-- Current Earnings Row -->
          <q-item class="q-pa-xs items-center">
            <q-item-section>{{ t("Current Earnings") }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(
                  sumAccounts(assetAccounts, period.label) -
                    sumAccounts(liabilityAccounts, period.label) -
                    sumAccounts(equityAccounts, period.label)
                )
              }}
            </q-item-section>
          </q-item>
          <!-- Updated Total Equity Row -->
          <q-item class="q-pa-xs items-center">
            <q-item-section>{{ t("Total Equity") }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(
                  sumAccounts(assetAccounts, period.label) -
                    sumAccounts(liabilityAccounts, period.label)
                )
              }}
            </q-item-section>
          </q-item>
          <!-- New: Total Liabilities + Equity Row -->
          <q-item class="q-pa-xs items-center">
            <q-item-section>{{
              t("Total Liabilities + Equity")
            }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(
                  sumAccounts(liabilityAccounts, period.label) +
                    (sumAccounts(assetAccounts, period.label) -
                      sumAccounts(liabilityAccounts, period.label))
                )
              }}
            </q-item-section>
          </q-item>
        </div>
        <!-- (Removed the previous note about "Total Liabilities and Equity" being removed.) -->
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from "vue";
import { date } from "quasar";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { formatAmount, roundAmount } from "src/helpers/utils.js";
import { utils, writeFile } from "xlsx";
import draggable from "vuedraggable";

const updateTitle = inject("updateTitle");
updateTitle("Balance Sheet");
const printToggle = inject("printToggle");
const { t } = useI18n();
const route = useRoute();
const now = new Date();
const currentYear = String(now.getFullYear());
const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
const today = date.formatDate(new Date(), "YYYY-MM-DD");

const formData = ref({
  department: route.query.department || "",
  projectnumber: route.query.projectnumber || "",
  currency: "",
  decimalplaces: "2",
  usetemplate: false,
  l_accno: true,
  previousyear: false,
  accounttype: "standard",
  periodMode: "current", // Options: current, monthly, quarterly, yearly, custom
  periods: [],
});

const periodModeOptions = [
  { label: t("Current"), value: "current" },
  { label: t("Monthly"), value: "monthly" },
  { label: t("Quarterly"), value: "quarterly" },
  { label: t("Yearly"), value: "yearly" },
  { label: t("Custom"), value: "custom" },
];

const accountTypeOptions = [
  { label: t("Standard"), value: "standard" },
  { label: t("Manufacturing"), value: "manufacturing" },
];

const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const yr = String(now.getFullYear() - i);
  return { value: yr, label: yr };
});

const departments = ref([]);
const projects = ref([]);
const currencies = ref([]);
const filtersOpen = ref(true);
const loading = ref(false);
const results = ref({});

const formattedDateRange = computed(() => {
  if (formData.value.periods.length) {
    return formData.value.periods.map((p) => p.label).join(", ");
  }
  return t("N/A");
});

/* ============================================================================
   Computed properties for each account group.
============================================================================ */
const assetAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accounts = [];

  // First, collect all accounts and their data
  Object.keys(rawAccounts)
    .sort((a, b) => a.localeCompare(b))
    .forEach((accno) => {
      const periodsRaw = rawAccounts[accno];
      const charttype = results.value.accounts?.[accno]?.charttype;
      const periods = {};
      const level = results.value.accounts?.[accno]?.level || 0;

      Object.keys(periodsRaw).forEach((label) => {
        const entry = periodsRaw[label].A;
        if (entry) {
          periods[label] = {
            ...entry,
            amount: -Number(entry.amount),
            charttype,
          };
        }
      });

      if (Object.keys(periods).length) {
        accounts.push({
          accno,
          description: results.value.accounts?.[accno]?.description,
          charttype,
          level,
          periods,
        });
      }
    });

  // Sort accounts by level and then by account number
  return accounts.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.accno.localeCompare(b.accno);
  });
});

const liabilityAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accounts = [];

  Object.keys(rawAccounts)
    .sort((a, b) => a.localeCompare(b))
    .forEach((accno) => {
      const accountPeriods = rawAccounts[accno];
      const charttype = results.value.accounts?.[accno]?.charttype;
      const level = results.value.accounts?.[accno]?.level || 0;

      const periodsData = {};
      Object.keys(accountPeriods).forEach((periodLabel) => {
        if (accountPeriods[periodLabel].L) {
          periodsData[periodLabel] = accountPeriods[periodLabel].L;
        }
      });

      if (Object.keys(periodsData).length) {
        accounts.push({
          accno,
          description: results.value.accounts?.[accno]?.description,
          charttype,
          level,
          periods: periodsData,
        });
      }
    });

  return accounts.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.accno.localeCompare(b.accno);
  });
});

const equityAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accounts = [];

  Object.keys(rawAccounts)
    .sort((a, b) => a.localeCompare(b))
    .forEach((accno) => {
      const accountPeriods = rawAccounts[accno];
      const charttype = results.value.accounts?.[accno]?.charttype;
      const level = results.value.accounts?.[accno]?.level || 0;

      const periodsData = {};
      Object.keys(accountPeriods).forEach((periodLabel) => {
        if (accountPeriods[periodLabel].Q) {
          periodsData[periodLabel] = accountPeriods[periodLabel].Q;
        }
      });

      if (Object.keys(periodsData).length) {
        accounts.push({
          accno,
          description: results.value.accounts?.[accno]?.description,
          charttype,
          level,
          periods: periodsData,
        });
      }
    });

  return accounts.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.accno.localeCompare(b.accno);
  });
});

/* ============================================================================
   Helper Functions for Formatting
   - Negative values now use the default minus sign rather than wrapping with parentheses.
============================================================================ */
const formatAmountCustom = (value) => {
  return formatAmount(value);
};

const roundAmountCustom = (value) => {
  return roundAmount(value);
};

/* ============================================================================
   Sum accounts for a given period.
============================================================================ */
const sumAccounts = (accountsArray, periodLabel) => {
  return accountsArray.reduce((sum, account) => {
    // Skip heading accounts (charttype 'H') when calculating totals
    if (account.charttype === "H") return sum;
    const amount = account.periods[periodLabel]?.amount || 0;
    return sum + Number(amount);
  }, 0);
};

/* ============================================================================
   Period-related functions and report generation.
============================================================================ */
const updatePeriod = (period) => {
  if (formData.value.periodMode === "current") {
    if (period.todate) {
      period.label = period.todate;
    }
  } else if (formData.value.periodMode === "monthly") {
    if (period.todate) {
      period.label = period.todate;
    }
  } else if (formData.value.periodMode === "quarterly") {
    if (period.todate) {
      period.label = period.todate;
    }
  } else if (formData.value.periodMode === "yearly") {
    if (period.todate) {
      period.label = period.todate;
    }
  } else if (formData.value.periodMode === "custom") {
    if (period.todate) {
      period.label = period.todate;
    }
  }
};

const addPeriod = () => {
  let newPeriod = {};
  // Calculate minYear from the provided yearOptions
  const allowedYears = yearOptions.map((y) => parseInt(y.value, 10));
  const minYear = Math.min(...allowedYears);

  // Helper function to format date (e.g., YYYY-MM-DD)
  const formatDate = (date) => {
    if (typeof date === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      try {
        date = new Date(date);
        if (isNaN(date.getTime())) throw new Error("Invalid date string");
      } catch (e) {
        console.error("Invalid date format provided:", date);
        return new Date().toISOString().split("T")[0];
      }
    } else if (!(date instanceof Date)) {
      console.error("Invalid date type provided:", date);
      date = new Date();
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Helper to parse date string (assuming YYYY-MM-DD) into a Date object
  const parseDate = (dateString) => {
    try {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      }
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) throw new Error("Invalid date string");
      return parsed;
    } catch (e) {
      console.error("Could not parse date string:", dateString, e);
      return new Date();
    }
  };

  if (formData.value.periods.length > 0) {
    const lastPeriod =
      formData.value.periods[formData.value.periods.length - 1];
    const lastDate = parseDate(lastPeriod.todate);
    const day = lastDate.getUTCDate();

    if (formData.value.periodMode === "current") {
      lastDate.setUTCFullYear(lastDate.getUTCFullYear() - 1);
      if (lastDate.getUTCFullYear() < minYear) {
        console.warn(
          `Cannot add period before minimum allowed year (${minYear}).`
        );
        return;
      }
      const newDateStr = formatDate(lastDate);
      newPeriod = { todate: newDateStr, label: newDateStr };
    } else if (formData.value.periodMode === "monthly") {
      // Move to previous month while keeping the same day
      lastDate.setUTCMonth(lastDate.getUTCMonth() - 1);
      // Ensure we don't exceed the last day of the month
      const lastDayOfMonth = new Date(
        lastDate.getUTCFullYear(),
        lastDate.getUTCMonth() + 1,
        0
      ).getDate();
      lastDate.setUTCDate(Math.min(day, lastDayOfMonth));

      if (lastDate.getUTCFullYear() < minYear) {
        console.warn(
          `Cannot add period before minimum allowed year (${minYear}).`
        );
        return;
      }
      const newDateStr = formatDate(lastDate);
      newPeriod = { todate: newDateStr, label: newDateStr };
    } else if (formData.value.periodMode === "quarterly") {
      // Move to previous quarter while keeping the same day
      lastDate.setUTCMonth(lastDate.getUTCMonth() - 3);
      // Ensure we don't exceed the last day of the month
      const lastDayOfMonth = new Date(
        lastDate.getUTCFullYear(),
        lastDate.getUTCMonth() + 1,
        0
      ).getDate();
      lastDate.setUTCDate(Math.min(day, lastDayOfMonth));

      if (lastDate.getUTCFullYear() < minYear) {
        console.warn(
          `Cannot add period before minimum allowed year (${minYear}).`
        );
        return;
      }
      const newDateStr = formatDate(lastDate);
      newPeriod = { todate: newDateStr, label: newDateStr };
    } else if (formData.value.periodMode === "yearly") {
      // Move to previous year while keeping the same day
      lastDate.setUTCFullYear(lastDate.getUTCFullYear() - 1);
      // Ensure we don't exceed the last day of the month
      const lastDayOfMonth = new Date(
        lastDate.getUTCFullYear(),
        lastDate.getUTCMonth() + 1,
        0
      ).getDate();
      lastDate.setUTCDate(Math.min(day, lastDayOfMonth));

      if (lastDate.getUTCFullYear() < minYear) {
        console.warn(
          `Cannot add period before minimum allowed year (${minYear}).`
        );
        return;
      }
      const newDateStr = formatDate(lastDate);
      newPeriod = { todate: newDateStr, label: newDateStr };
    } else if (formData.value.periodMode === "custom") {
      newPeriod = { ...lastPeriod };
    }
  } else {
    const today = formatDate(now);
    if (formData.value.periodMode === "current") {
      newPeriod = { todate: today, label: today };
    } else if (formData.value.periodMode === "monthly") {
      newPeriod = { todate: today, label: today };
    } else if (formData.value.periodMode === "quarterly") {
      newPeriod = { todate: today, label: today };
    } else if (formData.value.periodMode === "yearly") {
      newPeriod = { todate: today, label: today };
    } else if (formData.value.periodMode === "custom") {
      newPeriod = { todate: today, label: today };
    }
  }

  if (Object.keys(newPeriod).length > 0) {
    formData.value.periods.push(newPeriod);
    updatePeriod(newPeriod);
  }
};

const removePeriod = (index) => {
  formData.value.periods.splice(index, 1);
};

const search = async () => {
  try {
    loading.value = true;
    const params = { ...formData.value };
    delete params.periods;
    formData.value.periods.forEach((period, index) => {
      Object.keys(period).forEach((key) => {
        params[`periods[${index}][${key}]`] = period[key];
      });
    });

    const response = await api.get("/reports/balance_sheet", {
      params: params,
    });
    results.value = response.data;
    filtersOpen.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const getPDF = async () => {
  try {
    loading.value = true;
    const params = { ...formData.value, usetemplate: "Y" };
    delete params.periods;
    formData.value.periods.forEach((period, index) => {
      Object.keys(period).forEach((key) => {
        params[`periods[${index}][${key}]`] = period[key];
      });
    });

    const response = await api.get("/reports/balance_sheet", {
      params: params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "balance_sheet.pdf");
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const createLink = inject("createLink");

const getPath = (accno, period) => {
  let todate = period.todate;
  if (todate && todate.includes("/")) {
    const parts = todate.split("/");
    todate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(
      2,
      "0"
    )}`;
  }
  const project = formData.value.projectnumber || "";
  const department = formData.value.department || "";
  const params = new URLSearchParams({
    accno,
    todate,
    project,
    department,
  });
  return createLink("trial.transactions") + `?${params.toString()}`;
};

const downloadExcel = () => {
  const includeAccNo = formData.value.l_accno;
  let headerRow = includeAccNo ? ["Acc No - Description"] : ["Description"];
  const periods = results.value.periods || [];
  periods.forEach((period) => {
    headerRow.push(period.label);
  });

  const exportData = [];
  const groupHeaderIndices = [];

  exportData.push(["Balance Sheet"]);
  groupHeaderIndices.push(0);
  exportData.push([]);
  exportData.push(headerRow);
  exportData.push(["Assets"]);
  groupHeaderIndices.push(exportData.length - 1);

  assetAccounts.value.forEach((account) => {
    let row = [];
    if (includeAccNo) {
      row.push(account.accno + " - " + account.description);
    } else {
      row.push(account.description);
    }
    periods.forEach((period) => {
      const amt = account.periods[period.label]
        ? account.periods[period.label].amount
        : 0;
      row.push(roundAmountCustom(amt));
    });
    exportData.push(row);
  });

  let assetsTotalRow = ["Total Assets"];
  periods.forEach((period) => {
    const total = sumAccounts(assetAccounts.value, period.label);
    assetsTotalRow.push(roundAmountCustom(total));
  });
  exportData.push(assetsTotalRow);
  exportData.push([]);
  exportData.push(["Liabilities"]);
  groupHeaderIndices.push(exportData.length - 1);

  liabilityAccounts.value.forEach((account) => {
    let row = [];
    if (includeAccNo) {
      row.push(account.accno + " - " + account.description);
    } else {
      row.push(account.description);
    }
    periods.forEach((period) => {
      const amt = account.periods[period.label]
        ? account.periods[period.label].amount
        : 0;
      row.push(roundAmountCustom(amt));
    });
    exportData.push(row);
  });

  let liabilitiesTotalRow = ["Total Liabilities"];
  periods.forEach((period) => {
    const total = sumAccounts(liabilityAccounts.value, period.label);
    liabilitiesTotalRow.push(roundAmountCustom(total));
  });
  exportData.push(liabilitiesTotalRow);
  exportData.push([]);
  exportData.push(["Equity"]);
  groupHeaderIndices.push(exportData.length - 1);

  equityAccounts.value.forEach((account) => {
    let row = [];
    if (includeAccNo) {
      row.push(account.accno + " - " + account.description);
    } else {
      row.push(account.description);
    }
    periods.forEach((period) => {
      const amt = account.periods[period.label]
        ? account.periods[period.label].amount
        : 0;
      row.push(roundAmountCustom(amt));
    });
    exportData.push(row);
  });

  let currentEarningsRow = ["Current Earnings"];
  periods.forEach((period) => {
    const currentEarnings =
      sumAccounts(assetAccounts.value, period.label) -
      sumAccounts(liabilityAccounts.value, period.label) -
      sumAccounts(equityAccounts.value, period.label);
    currentEarningsRow.push(roundAmountCustom(currentEarnings));
  });
  exportData.push(currentEarningsRow);

  let equityTotalRow = ["Total Equity"];
  periods.forEach((period) => {
    const totalEquity =
      sumAccounts(assetAccounts.value, period.label) -
      sumAccounts(liabilityAccounts.value, period.label);
    equityTotalRow.push(roundAmountCustom(totalEquity));
  });
  exportData.push(equityTotalRow);

  // New row: Total Liabilities + Equity
  let liabEquityTotalRow = ["Total Liabilities + Equity"];
  periods.forEach((period) => {
    const totalLiabEquity =
      sumAccounts(liabilityAccounts.value, period.label) +
      (sumAccounts(assetAccounts.value, period.label) -
        sumAccounts(liabilityAccounts.value, period.label));
    liabEquityTotalRow.push(roundAmountCustom(totalLiabEquity));
  });
  exportData.push(liabEquityTotalRow);

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
  utils.book_append_sheet(workbook, worksheet, "Balance Sheet");
  writeFile(workbook, "balance_sheet.xlsx", { compression: true });
};

watch(
  () => formData.value.periodMode,
  () => {
    formData.value.periods = [];
    addPeriod();
  }
);

onMounted(() => {
  if (route.query.todate) {
    search();
  }
  fetchLinks();
  if (formData.value.periods.length === 0) {
    addPeriod();
  }
});

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
</script>
