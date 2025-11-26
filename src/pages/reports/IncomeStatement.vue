<template>
  <q-page class="q-pa-sm">
    <!-- Search Form Card -->
    <div class="container">
      <q-expansion-item
        :label="t('Report Parameters')"
        class="q-mb-md"
        header-class="container-bg"
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
              <div class="col-12 col-md-3" v-if="currencies.length > 0">
                <s-select
                  v-model="formData.currency"
                  :options="currencies"
                  option-value="curr"
                  option-label="curr"
                  emit-value
                  map-options
                  outlined
                  dense
                  :label="t('Currency')"
                  search="curr"
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
              <div class="row">
                <div class="text-h6">{{ t("Custom Periods") }}</div>
                <q-btn
                  icon="add"
                  :label="t('Add Period')"
                  @click="addPeriod"
                  color="primary"
                  class="q-ml-sm"
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
    </div>
    <!-- Report Output -->
    <q-card v-if="results && Object.keys(results).length" ref="reportContent">
      <q-card-actions class="q-pa-sm no-print">
        <s-button type="export-xl" @click="downloadExcel" />
        <s-button type="export-pdf" @click="downloadPDF" />
        <q-space />
        <q-btn
          :label="t('Expand All')"
          @click="expandAllHeadings"
          color="secondary"
          flat
          icon="expand_less"
        />
        <q-btn
          :label="t('Collapse All')"
          @click="collapseAllHeadings"
          color="secondary"
          flat
          icon="expand_more"
        />
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
          <!-- Header Row -->
          <q-item class="q-pa-xs q-my-none">
            <!-- Display static header text instead of account.accno -->
            <q-item-section v-if="formData.l_accno" avatar>
              {{ t("Acc No") }}
            </q-item-section>
            <q-item-section>{{ t("Description") }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right"
            >
              <strong>{{ period.label }}</strong>
            </q-item-section>
          </q-item>
          <div class="section-header">
            <q-icon name="trending_up" class="q-mr-sm" />
            {{ t("Income") }}
          </div>
          <q-separator />
          <q-list bordered separator>
            <!-- Iterate over income accounts -->
            <template v-for="(account, index) in incomeAccounts" :key="index">
              <q-item
                :class="{
                  'mutedbg text-bold': account.charttype === 'H',
                  'account-row': true,
                  'heading-account': account.charttype === 'H',
                  'detail-account': account.charttype === 'A',
                  'heading-row': account.charttype === 'H',
                }"
              >
                <!-- Show account number as plain text with indentation -->
                <q-item-section v-if="formData.l_accno" avatar>
                  <div :style="{ paddingLeft: getIndentation(account.level) }">
                    <q-icon
                      :name="getAccountIcon(account)"
                      :color="account.charttype === 'H' ? 'primary' : 'grey-6'"
                      size="sm"
                      class="q-mr-xs"
                    />
                    {{ account.accno }}
                  </div>
                </q-item-section>
                <!-- Description with indentation and clickable for headings -->
                <q-item-section>
                  <div
                    :style="{
                      paddingLeft:
                        account.level > 0
                          ? getIndentation(account.level)
                          : '0px',
                    }"
                    :class="{ 'cursor-pointer': account.charttype === 'H' }"
                    @click="
                      account.charttype === 'H'
                        ? toggleHeading(account.accno)
                        : null
                    "
                  >
                    <div class="row items-center">
                      <span>{{ account.description }}</span>
                      <q-icon
                        v-if="account.charttype === 'H'"
                        :name="getHeadingIcon(account.accno)"
                        size="sm"
                        class="q-ml-xs"
                        color="primary"
                      />
                    </div>
                  </div>
                </q-item-section>
                <!-- For each period, render the amount as a clickable link if applicable -->
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
              <q-separator
                v-if="shouldShowSeparator(account, index, incomeAccounts)"
              />
            </template>
          </q-list>
          <!-- Income Subtotal Row -->
          <q-item class="q-pa-sm items-center total-row">
            <q-item-section v-if="formData.l_accno" avatar>
              <q-icon name="calculate" color="primary" />
            </q-item-section>
            <q-item-section class="text-bold">{{
              t("Total Income")
            }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              <span class="amount-positive">
                {{
                  formatAmount(
                    sumAllAccounts(completeIncomeAccounts, period.label)
                  )
                }}
              </span>
            </q-item-section>
          </q-item>
        </div>

        <!-- Expenses Section -->
        <div>
          <div class="section-header">
            <q-icon name="trending_down" class="q-mr-sm" />
            {{ t("Expenses") }}
          </div>
          <q-list bordered separator>
            <!-- Iterate over expense accounts -->
            <template v-for="(account, index) in expenseAccounts" :key="index">
              <q-item
                :class="{
                  'mutedbg text-bold': account.charttype === 'H',
                  'account-row': true,
                  'heading-account': account.charttype === 'H',
                  'detail-account': account.charttype === 'A',
                  'heading-row': account.charttype === 'H',
                }"
              >
                <!-- Show account number as plain text with indentation -->
                <q-item-section v-if="formData.l_accno" avatar>
                  <div :style="{ paddingLeft: getIndentation(account.level) }">
                    <q-icon
                      :name="getAccountIcon(account)"
                      :color="account.charttype === 'H' ? 'primary' : 'grey-6'"
                      size="sm"
                      class="q-mr-xs"
                    />
                    {{ account.accno }}
                  </div>
                </q-item-section>
                <!-- Description with indentation and clickable for headings -->
                <q-item-section>
                  <div
                    :style="{
                      paddingLeft:
                        account.level > 0
                          ? getIndentation(account.level)
                          : '0px',
                    }"
                    :class="{ 'cursor-pointer': account.charttype === 'H' }"
                    @click="
                      account.charttype === 'H'
                        ? toggleHeading(account.accno)
                        : null
                    "
                  >
                    <div class="row items-center">
                      <span>{{ account.description }}</span>
                      <q-icon
                        v-if="account.charttype === 'H'"
                        :name="getHeadingIcon(account.accno)"
                        size="sm"
                        class="q-ml-xs"
                        color="primary"
                      />
                    </div>
                  </div>
                </q-item-section>
                <!-- For each period, render the expense amount as a clickable link if applicable -->
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
              <q-separator
                v-if="shouldShowSeparator(account, index, expenseAccounts)"
              />
            </template>
          </q-list>
          <!-- Expense Subtotal Row -->
          <q-item class="q-pa-sm items-center total-row">
            <q-item-section v-if="formData.l_accno" avatar>
              <q-icon name="calculate" color="primary" />
            </q-item-section>
            <q-item-section class="text-bold">{{
              t("Total Expenses")
            }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              <span class="amount-negative">
                <template
                  v-if="
                    sumAllAccounts(completeExpenseAccounts, period.label) < 0
                  "
                >
                  {{
                    formatAmount(
                      Math.abs(
                        sumAllAccounts(completeExpenseAccounts, period.label)
                      )
                    )
                  }}
                </template>
                <template
                  v-else-if="
                    sumAllAccounts(completeExpenseAccounts, period.label) > 0
                  "
                >
                  {{
                    formatAmount(
                      -sumAllAccounts(completeExpenseAccounts, period.label)
                    )
                  }}
                </template>
                <template v-else>
                  {{ formatAmount(0) }}
                </template>
              </span>
            </q-item-section>
          </q-item>
        </div>

        <!-- Net Income Section -->
        <q-separator />
        <q-item class="items-center q-my-none q-py-none net-income-row">
          <q-item-section v-if="formData.l_accno" avatar>
            <q-icon name="account_balance" color="primary" size="sm" />
          </q-item-section>
          <q-item-section class="q-pa-sm">
            {{ t("Net Income/(Loss)") }}:
          </q-item-section>
          <q-item-section
            v-for="period in results.periods"
            :key="period.label"
            class="col text-right"
          >
            <template v-if="netIncome(period.label) < 0">
              <span class="amount-negative">
                ({{ formatAmount(Math.abs(netIncome(period.label))) }})
              </span>
            </template>
            <template v-else>
              <span class="amount-positive">
                {{ formatAmount(netIncome(period.label)) }}
              </span>
            </template>
          </q-item-section>
        </q-item>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
// =====================================================
// Imports and Dependency Registration
// =====================================================
import { ref, computed, onMounted, watch, inject } from "vue";
import { date } from "quasar";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { formatAmount, roundAmount } from "src/helpers/utils.js";
import { utils, writeFile } from "xlsx";
import draggable from "vuedraggable";

// =====================================================
// Injection and Initial Setup
// =====================================================

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Income Statement"));
const printToggle = inject("printToggle");
const route = useRoute();
const now = new Date();
const currentYear = String(now.getFullYear());
const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

// =====================================================
// Reactive Data and Options
// =====================================================
const formData = ref({
  department: route.query.department || "",
  projectnumber: route.query.projectnumber || "",
  currency: "",
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

const periodModeOptions = [
  { label: t("Current"), value: "current" },
  { label: t("Monthly"), value: "monthly" },
  { label: t("Quarterly"), value: "quarterly" },
  { label: t("Yearly"), value: "yearly" },
  { label: t("Custom"), value: "custom" },
];

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: date.formatDate(new Date(2000, i, 1), "MMMM"),
}));

const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const yr = String(now.getFullYear() - i);
  return { value: yr, label: yr };
});

const quarterOptions = [
  { label: t("Q1"), value: "Q1" },
  { label: t("Q2"), value: "Q2" },
  { label: t("Q3"), value: "Q3" },
  { label: t("Q4"), value: "Q4" },
];

const departments = ref([]);
const projects = ref([]);
const currencies = ref([]);
const filtersOpen = ref(true);
const loading = ref(false);
const results = ref({});
const collapsedHeadings = ref(new Set()); // Track collapsed heading account numbers

// =====================================================
// Computed Properties
// =====================================================

// Formats the date range by joining period labels
const formattedDateRange = computed(() => {
  if (formData.value.periods.length) {
    return formData.value.periods.map((p) => p.label).join(", ");
  }
  return t("N/A");
});

/**
 * Builds a hierarchical structure of accounts based on parent_accno relationships
 * @param {Object} rawAccounts - Raw account data from API
 * @param {Object} accountsInfo - Account metadata from API
 * @param {string} type - 'I' for income, 'E' for expenses
 * @returns {Array} Hierarchical array of accounts with levels
 */
const buildAccountHierarchy = (rawAccounts, accountsInfo, type) => {
  const accountMap = new Map();
  const rootAccounts = [];

  // First pass: create account objects and store in map
  Object.keys(rawAccounts).forEach((accno) => {
    const accountPeriods = rawAccounts[accno];
    let periodsData = {};

    Object.keys(accountPeriods).forEach((periodLabel) => {
      if (accountPeriods[periodLabel][type]) {
        periodsData[periodLabel] = accountPeriods[periodLabel][type];
      }
    });

    if (Object.keys(periodsData).length > 0) {
      const accountInfo = accountsInfo[accno] || {};
      const account = {
        accno,
        description: accountInfo.description || "",
        charttype: accountInfo.charttype || "A",
        parent_accno: accountInfo.parent_accno || null,
        periods: periodsData,
        level: 0,
        children: [],
      };
      accountMap.set(accno, account);
    }
  });

  // Second pass: build parent-child relationships
  accountMap.forEach((account) => {
    if (account.parent_accno && accountMap.has(account.parent_accno)) {
      const parent = accountMap.get(account.parent_accno);
      parent.children.push(account);
      account.level = parent.level + 1;
    } else {
      rootAccounts.push(account);
    }
  });

  // Third pass: flatten the hierarchy while preserving order and levels
  const flattenHierarchy = (accounts, result = []) => {
    accounts.forEach((account) => {
      result.push(account);
      // Only include children if the heading is not collapsed
      if (
        account.children.length > 0 &&
        !collapsedHeadings.value.has(account.accno)
      ) {
        flattenHierarchy(account.children, result);
      }
    });
    return result;
  };

  return flattenHierarchy(rootAccounts);
};

/**
 * Builds a complete hierarchical structure of accounts for total calculations
 * This includes ALL accounts regardless of collapsed state
 * @param {Object} rawAccounts - Raw account data from API
 * @param {Object} accountsInfo - Account metadata from API
 * @param {string} type - 'I' for income, 'E' for expenses
 * @returns {Array} Complete hierarchical array of accounts with levels
 */
const buildCompleteAccountHierarchy = (rawAccounts, accountsInfo, type) => {
  const accountMap = new Map();
  const rootAccounts = [];

  // First pass: create account objects and store in map
  Object.keys(rawAccounts).forEach((accno) => {
    const accountPeriods = rawAccounts[accno];
    let periodsData = {};

    Object.keys(accountPeriods).forEach((periodLabel) => {
      if (accountPeriods[periodLabel][type]) {
        periodsData[periodLabel] = accountPeriods[periodLabel][type];
      }
    });

    if (Object.keys(periodsData).length > 0) {
      const accountInfo = accountsInfo[accno] || {};
      const account = {
        accno,
        description: accountInfo.description || "",
        charttype: accountInfo.charttype || "A",
        parent_accno: accountInfo.parent_accno || null,
        periods: periodsData,
        level: 0,
        children: [],
      };
      accountMap.set(accno, account);
    }
  });

  // Second pass: build parent-child relationships
  accountMap.forEach((account) => {
    if (account.parent_accno && accountMap.has(account.parent_accno)) {
      const parent = accountMap.get(account.parent_accno);
      parent.children.push(account);
      account.level = parent.level + 1;
    } else {
      rootAccounts.push(account);
    }
  });

  // Third pass: flatten the hierarchy while preserving order and levels
  // This version includes ALL accounts regardless of collapsed state
  const flattenHierarchy = (accounts, result = []) => {
    accounts.forEach((account) => {
      result.push(account);
      // Include all children regardless of collapsed state
      if (account.children.length > 0) {
        flattenHierarchy(account.children, result);
      }
    });
    return result;
  };

  return flattenHierarchy(rootAccounts);
};

// Compute income accounts from results with hierarchy
const incomeAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildAccountHierarchy(rawAccounts, accountsInfo, "I");
});

// Compute expense accounts from results with hierarchy
const expenseAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildAccountHierarchy(rawAccounts, accountsInfo, "E");
});

// Complete account hierarchies for total calculations (includes all accounts regardless of collapsed state)
const completeIncomeAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildCompleteAccountHierarchy(rawAccounts, accountsInfo, "I");
});

const completeExpenseAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildCompleteAccountHierarchy(rawAccounts, accountsInfo, "E");
});

// =====================================================
// Helper Functions
// =====================================================

/**
 * Generates CSS padding based on account level for indentation
 * @param {number} level - Account hierarchy level
 * @returns {string} CSS padding value
 */
const getIndentation = (level) => {
  const basePadding = 16; // Base padding in pixels
  const indentPerLevel = 24; // Additional padding per level
  return `${basePadding + level * indentPerLevel}px`;
};

/**
 * Determines if an account should show a separator line
 * @param {Object} account - Account object
 * @param {number} index - Account index in the list
 * @param {Array} accounts - Full accounts array
 * @returns {boolean} Whether to show separator
 */
const shouldShowSeparator = (account, index, accounts) => {
  // Show separator after heading accounts
  if (account.charttype === "H") {
    return true;
  }

  // Show separator if next account is at a lower level (end of a group)
  if (index < accounts.length - 1) {
    const nextAccount = accounts[index + 1];
    return nextAccount.level < account.level;
  }

  return false;
};

/**
 * Gets the appropriate icon for an account based on its type and level
 * @param {Object} account - Account object
 * @returns {string} Icon name
 */
const getAccountIcon = (account) => {
  if (account.charttype === "H") {
    return "folder";
  }
  return "description";
};

/**
 * Calculates the total for a specific account group (parent and its children)
 * @param {Array} accounts - All accounts array
 * @param {string} parentAccno - Parent account number
 * @param {string} periodLabel - Period label
 * @returns {number} Total amount for the group
 */
const getGroupTotal = (accounts, parentAccno, periodLabel) => {
  return accounts.reduce((total, account) => {
    if (account.parent_accno === parentAccno || account.accno === parentAccno) {
      const amount = account.periods[periodLabel]?.amount || 0;
      return total + amount;
    }
    return total;
  }, 0);
};

/**
 * Toggles the collapsed state of a heading account
 * @param {string} accno - Account number to toggle
 */
const toggleHeading = (accno) => {
  if (collapsedHeadings.value.has(accno)) {
    collapsedHeadings.value.delete(accno);
  } else {
    collapsedHeadings.value.add(accno);
  }
};

/**
 * Checks if a heading account is collapsed
 * @param {string} accno - Account number to check
 * @returns {boolean} Whether the heading is collapsed
 */
const isHeadingCollapsed = (accno) => {
  return collapsedHeadings.value.has(accno);
};

/**
 * Gets the appropriate icon for a heading based on its collapsed state
 * @param {string} accno - Account number
 * @returns {string} Icon name
 */
const getHeadingIcon = (accno) => {
  return isHeadingCollapsed(accno) ? "expand_more" : "expand_less";
};

/**
 * Expands all heading accounts
 */
const expandAllHeadings = () => {
  collapsedHeadings.value.clear();
};

/**
 * Collapses all heading accounts
 */
const collapseAllHeadings = () => {
  // Get all heading account numbers from both income and expense accounts
  const allAccounts = [...incomeAccounts.value, ...expenseAccounts.value];
  const headingAccounts = allAccounts.filter(
    (account) => account.charttype === "H"
  );
  headingAccounts.forEach((account) => {
    collapsedHeadings.value.add(account.accno);
  });
};

/**
 * Updates a period object based on the current period mode.
 * This sets the fromdate, todate, and label properties accordingly.
 */
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

/**
 * Adds a new period line.
 * If a period exists, its values are cloned; otherwise, default values are set.
 */
const addPeriod = () => {
  let newPeriod = {};
  // Get allowed years as numbers from the yearOptions array.
  const allowedYears = yearOptions.map((y) => parseInt(y.value, 10));
  const minYear = Math.min(...allowedYears);

  if (formData.value.periods.length > 0) {
    // Compute the "before" period based on the last period and current mode.
    const lastPeriod =
      formData.value.periods[formData.value.periods.length - 1];

    if (
      formData.value.periodMode === "current" ||
      formData.value.periodMode === "yearly"
    ) {
      let newYear = Number(lastPeriod.year) - 1;
      if (newYear < minYear) newYear = minYear;
      newPeriod = { ...lastPeriod, year: newYear.toString() };
    } else if (formData.value.periodMode === "monthly") {
      let month = Number(lastPeriod.month);
      let year = Number(lastPeriod.year);
      if (month === 1) {
        month = 12;
        year = year - 1;
      } else {
        month = month - 1;
      }
      if (year < minYear) {
        year = minYear;
      }
      newPeriod = {
        ...lastPeriod,
        month: month.toString().padStart(2, "0"),
        year: year.toString(),
      };
    } else if (formData.value.periodMode === "quarterly") {
      let quarter = lastPeriod.quarter; // Expected format: "Q1", "Q2", etc.
      let year = Number(lastPeriod.year);
      const qNumber = parseInt(quarter.substring(1), 10);
      if (qNumber === 1) {
        quarter = "Q4";
        year = year - 1;
      } else {
        quarter = "Q" + (qNumber - 1);
      }
      if (year < minYear) {
        year = minYear;
      }
      newPeriod = { ...lastPeriod, quarter, year: year.toString() };
    } else if (formData.value.periodMode === "custom") {
      // For custom, simply copy the current period.
      newPeriod = { ...lastPeriod };
    }
  } else {
    // No period exists yet; create one with the current values.
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

/**
 * Removes a period line based on its index.
 */
const removePeriod = (index) => {
  formData.value.periods.splice(index, 1);
};

/**
 * Sums the amounts for a given period label from an array of accounts.
 * Filters out heading accounts (charttype === 'H') when calculating totals.
 */
const sumAccounts = (accountsArray, periodLabel) => {
  return accountsArray.reduce((sum, account) => {
    // Skip heading accounts when calculating totals
    if (account.charttype === "H") {
      return sum;
    }
    const amount = account.periods[periodLabel]?.amount || 0;
    return sum + Number(amount);
  }, 0);
};

/**
 * Sums all accounts for a given period label, including collapsed accounts
 * This is used for total calculations that should include all accounts regardless of display state
 */
const sumAllAccounts = (completeAccountsArray, periodLabel) => {
  return completeAccountsArray.reduce((sum, account) => {
    // Skip heading accounts (charttype 'H') when calculating totals
    if (account.charttype === "H") return sum;
    const amount = account.periods[periodLabel]?.amount || 0;
    return sum + Number(amount);
  }, 0);
};

/**
 * Custom amount formatting function to match Balance Sheet styling
 */
const formatAmountCustom = (value) => {
  return formatAmount(value);
};

/**
 * Calculates net income (income + expenses) for a given period label.
 */
const netIncome = (periodLabel) => {
  const incomeSum = sumAllAccounts(completeIncomeAccounts.value, periodLabel);
  const expenseSum = sumAllAccounts(completeExpenseAccounts.value, periodLabel);
  return incomeSum + expenseSum;
};

/**
 * Generates the report by calling the API with formData parameters.
 */
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
const getPDF = async () => {
  try {
    loading.value = true;
    const params = { ...formData.value, usetemplate: "Y" };
    const response = await api.get("/reports/income_statement", {
      params: params,
      responseType: "blob",
    });
    // Create a Blob from the response data
    const blob = new Blob([response.data], { type: "application/pdf" });
    // Generate a URL for the Blob
    const url = window.URL.createObjectURL(blob);
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "income_statement.pdf");
    document.body.appendChild(link);
    // Trigger the download by simulating a click
    link.click();
    // Cleanup: remove the link and revoke the Blob URL
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

/**
 * Returns the path to the trial transactions report.
 * Accepts an account number and a specific period.
 * Formats the fromdate and todate from the period and includes other query parameters.
 */
const createLink = inject("createLink");

const getPath = (accno, period) => {
  // Helper to format "YYYYMMDD" to "YYYY-MM-DD"
  const formatDateStr = (dateStr) =>
    `${dateStr.substr(0, 4)}-${dateStr.substr(4, 2)}-${dateStr.substr(6, 2)}`;

  const fromdate = formatDateStr(period.fromdate);
  const todate = formatDateStr(period.todate);
  const project = formData.value.projectnumber || "";
  const department = formData.value.department || "";

  const params = new URLSearchParams({
    accno,
    fromdate,
    todate,
    project,
    department,
  });
  return createLink("trial.transactions") + `?${params.toString()}`;
};

/**
 * Exports the report data to an Excel file.
 */
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
    const total = sumAllAccounts(completeIncomeAccounts.value, period.label);
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
    const total = sumAllAccounts(completeExpenseAccounts.value, period.label);
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

// =====================================================
// Watchers and Lifecycle Hooks
// =====================================================

// When period mode changes, clear periods and add a new one.
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

// =====================================================
// Fetch Lookup Data for Links and Select Options
// =====================================================
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

.drag-handle:hover {
  cursor: grab;
}

/* Account hierarchy styling */
.account-row {
  transition: background-color 0.2s ease;
}

.account-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.heading-account {
  border-left: 4px solid var(--q-primary);
  background-color: rgba(var(--q-primary), 0.05);
  transition: background-color 0.2s ease;
}

.heading-account:hover {
  background-color: rgba(var(--q-primary), 0.1);
}

.cursor-pointer {
  cursor: pointer;
}

/* Expand/collapse icon styling */
.expand-icon {
  transition: transform 0.2s ease;
}

.expand-icon:hover {
  transform: scale(1.1);
}

/* Target the expand/collapse icons specifically */
.q-icon.expand-icon {
  transition: transform 0.2s ease;
}

.q-icon.expand-icon:hover {
  transform: scale(1.1);
}

/* Heading row styling */
.heading-row {
  user-select: none;
}

.heading-row:hover .expand-icon {
  opacity: 1;
}

/* Target all icons in heading rows for expand/collapse effect */
.heading-row .q-icon {
  transition: transform 0.2s ease;
}

.heading-row:hover .q-icon {
  transform: scale(1.1);
}

.detail-account {
  border-left: 2px solid #e0e0e0;
}

.detail-account:hover {
  border-left-color: #1976d2;
  background-color: rgba(25, 118, 210, 0.02);
}

/* Indentation styling */
.account-indent {
  position: relative;
}

.account-indent::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 12px;
  height: 1px;
  background-color: #e0e0e0;
  transform: translateY(-50%);
}

/* Amount styling - removed colors for better dark mode compatibility */
.amount-positive {
  font-weight: 500;
}

.amount-negative {
  font-weight: 500;
}

.amount-zero {
  color: #757575;
}

/* Section headers */
.section-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 12px 16px;
  margin: 16px 0 8px 0;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Totals styling */
.total-row {
  background-color: #f5f5f5;
  border-top: 2px solid var(--q-primary);
  font-weight: 600;
  color: #000 !important;
}

.net-income-row {
  background-color: #e3f2fd;
  border-top: 3px solid var(--q-primary);
  font-weight: 700;
  font-size: 1.1em;
  color: #000 !important;
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

  .account-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .q-item-section {
    margin-bottom: 4px;
  }
}
</style>
