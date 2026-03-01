<template>
  <q-page class="q-pa-sm">
    <!-- Search Form -->
    <div class="container">
      <q-expansion-item
        :label="t('Report Parameters')"
        class="q-mb-sm"
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

            <!-- Custom Periods Section -->
            <div class="q-mt-sm">
              <div class="row items-center">
                <div class="text-subtitle1 text-weight-medium">
                  {{ t("Custom Periods") }}
                </div>
                <s-button
                  type="add-line"
                  :label="t('Add Period')"
                  @click="addPeriod"
                  class="q-ml-sm"
                  size="sm"
                />
              </div>
              <draggable
                v-model="formData.periods"
                group="periods"
                handle=".drag-handle"
              >
                <template #item="{ element, index }">
                  <div class="row q-gutter-sm q-mt-xs items-center">
                    <div class="col-auto">
                      <q-icon
                        name="drag_indicator"
                        class="cursor-move drag-handle"
                        size="xs"
                      />
                    </div>
                    <!-- Current Mode -->
                    <template v-if="formData.periodMode === 'current'">
                      <div class="col-12 col-md-2">
                        <s-select
                          v-model="element.year"
                          :options="yearOptions"
                          option-label="label"
                          option-value="value"
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
                    <!-- Monthly Mode -->
                    <template v-else-if="formData.periodMode === 'monthly'">
                      <div class="col-12 col-md-2">
                        <s-select
                          v-model="element.month"
                          :options="monthOptions"
                          option-label="label"
                          option-value="value"
                          outlined
                          dense
                          :label="t('Month')"
                          emit-value
                          map-options
                          @update:model-value="() => updatePeriod(element)"
                          search="label"
                        />
                      </div>
                      <div class="col-12 col-md-2">
                        <s-select
                          v-model="element.year"
                          :options="yearOptions"
                          option-label="label"
                          option-value="value"
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
                    <!-- Quarterly Mode -->
                    <template v-else-if="formData.periodMode === 'quarterly'">
                      <div class="col-12 col-md-2">
                        <s-select
                          v-model="element.quarter"
                          :options="quarterOptions"
                          option-label="label"
                          option-value="value"
                          outlined
                          dense
                          :label="t('Quarter')"
                          emit-value
                          map-options
                          @update:model-value="() => updatePeriod(element)"
                          search="label"
                        />
                      </div>
                      <div class="col-12 col-md-2">
                        <s-select
                          v-model="element.year"
                          :options="yearOptions"
                          option-label="label"
                          option-value="value"
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
                    <!-- Yearly Mode -->
                    <template v-else-if="formData.periodMode === 'yearly'">
                      <div class="col-12 col-md-2">
                        <s-select
                          v-model="element.year"
                          :options="yearOptions"
                          option-label="label"
                          option-value="value"
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
                    <!-- Custom Mode -->
                    <template v-else-if="formData.periodMode === 'custom'">
                      <div class="col-12 col-md-2">
                        <q-input
                          v-model="element.fromdate"
                          type="date"
                          outlined
                          dense
                          :label="t('From Date')"
                          @update:model-value="() => updatePeriod(element)"
                        />
                      </div>
                      <div class="col-12 col-md-2">
                        <q-input
                          v-model="element.todate"
                          type="date"
                          outlined
                          dense
                          :label="t('To Date')"
                          @update:model-value="() => updatePeriod(element)"
                        />
                      </div>
                    </template>
                    <div class="col-auto">
                      <q-btn
                        icon="delete"
                        color="negative"
                        flat
                        round
                        size="sm"
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
              <s-button
                type="search"
                :label="t('Generate Report')"
                @click="search"
                :loading="loading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-expansion-item>
    </div>

    <!-- Report Output -->
    <div
      v-if="results && Object.keys(results).length"
      class="report-container"
      ref="reportContent"
    >
      <div class="report-header">
        <div class="header-info">
          <span class="client-name">{{ results.company }}</span>
          <span class="separator">•</span>
          <span>{{ formattedDateRange }}</span>
        </div>
        <div class="header-actions">
          <q-btn flat :label="t('Print')" @click="downloadPDF" size="sm" />
          <q-btn
            color="primary"
            :label="t('Export')"
            @click="downloadExcel"
            size="sm"
          />
        </div>
      </div>

      <!-- Controls -->
      <div class="controls-row">
        <div class="variance-toggles">
          <q-btn
            :outline="!showVarianceDollar"
            :color="showVarianceDollar ? 'primary' : 'grey-7'"
            :label="t('Show Variance')"
            @click="showVarianceDollar = !showVarianceDollar"
            size="sm"
            :class="{ 'active-toggle': showVarianceDollar }"
            no-caps
          />
          <q-btn
            :outline="!showVariancePercent"
            :color="showVariancePercent ? 'primary' : 'grey-7'"
            :label="t('Show Variance (%)')"
            @click="showVariancePercent = !showVariancePercent"
            size="sm"
            class="q-ml-sm"
            :class="{ 'active-toggle': showVariancePercent }"
            no-caps
          />
          <q-btn-dropdown
            v-if="varianceOptions.length > 0"
            :label="selectedVarianceLabel"
            color="primary"
            size="sm"
            class="q-ml-sm"
            no-caps
            outline
            dense
            menu-anchor="bottom left"
            menu-self="top left"
          >
            <q-list dense class="variance-dropdown">
              <q-item
                v-for="option in varianceOptions"
                :key="option.value"
                clickable
                v-close-popup
                @click="selectVariance(option)"
                :active="selectedVariance === option.value"
                dense
              >
                <q-item-section>{{ option.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <div class="expand-controls">
          <q-btn-dropdown
            :label="selectedCollapseLabel"
            flat
            size="sm"
            no-caps
            dense
            icon="unfold_less"
            menu-anchor="bottom right"
            menu-self="top right"
          >
            <q-list dense class="collapse-dropdown">
              <q-item
                clickable
                v-close-popup
                @click="expandAllHeadings"
                :active="selectedCollapseLevel === -1"
                dense
              >
                <q-item-section>{{ t("Expand All") }}</q-item-section>
              </q-item>
              <q-separator />
              <q-item
                v-for="level in collapseLevelOptions"
                :key="level.value"
                clickable
                v-close-popup
                @click="collapseToLevel(level.value)"
                :active="selectedCollapseLevel === level.value"
                dense
              >
                <q-item-section>{{ level.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>

      <!-- Report Table -->
      <div class="report-table">
        <div class="table-header">
          <div class="col-account">{{ t("ACCOUNT") }}</div>
          <div
            v-for="period in results.periods"
            :key="period.label"
            class="col-amount"
          >
            {{ period.label }}
          </div>
          <div
            v-if="showVarianceDollar && results.periods?.length >= 2"
            class="col-variance"
          >
            <span class="variance-label">{{ t("VAR") }}</span>
            <span class="variance-sub">({{ getVarianceComparison() }})</span>
          </div>
          <div
            v-if="showVariancePercent && results.periods?.length >= 2"
            class="col-variance"
          >
            {{ t("VAR %") }}
          </div>
        </div>

        <!-- Income Section -->
        <div class="section">
          <div class="section-title" @click="toggleSection('income')">
            <q-icon
              :name="sectionCollapsed.income ? 'chevron_right' : 'expand_more'"
              size="sm"
              class="section-expand-icon"
            />
            {{ t("Income") }}
          </div>
          <template v-if="!sectionCollapsed.income">
            <div
              v-for="(account, index) in incomeAccounts"
              :key="'income-' + index"
              class="table-row"
              :class="{
                'heading-row': account.charttype === 'H',
                'detail-row': account.charttype === 'A',
              }"
            >
              <div class="col-account">
                <span :style="{ marginLeft: getIndentation(account.level) }">
                  <q-icon
                    v-if="account.charttype === 'H'"
                    :name="
                      isHeadingCollapsed(account.accno)
                        ? 'chevron_right'
                        : 'expand_more'
                    "
                    size="xs"
                    class="expand-arrow"
                    @click.stop="toggleHeading(account.accno)"
                  />
                  <span class="account-name">
                    <template v-if="formData.l_accno && account.accno"
                      >{{ account.accno }} -
                    </template>
                    {{ account.description }}
                  </span>
                </span>
              </div>
              <div
                v-for="period in results.periods"
                :key="period.label"
                class="col-amount"
              >
                <template v-if="account.periods[period.label] !== undefined">
                  <router-link
                    v-if="account.charttype === 'A'"
                    :to="getPath(account.accno, period)"
                    target="_blank"
                    class="amount-link"
                  >
                    {{ formatNumber(account.periods[period.label].amount) }}
                  </router-link>
                  <span v-else>{{
                    formatNumber(account.periods[period.label].amount)
                  }}</span>
                </template>
                <template v-else>-</template>
              </div>
              <div
                v-if="showVarianceDollar && results.periods?.length >= 2"
                class="col-variance"
              >
                <span :class="getVarianceClass(getAccountVariance(account))">
                  {{ formatVariance(getAccountVariance(account)) }}
                </span>
              </div>
              <div
                v-if="showVariancePercent && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="getVarianceClass(getAccountVariancePercent(account))"
                >
                  {{
                    formatVariancePercent(getAccountVariancePercent(account))
                  }}
                </span>
              </div>
            </div>
            <div class="table-row total-row">
              <div class="col-account">{{ t("Total Income") }}</div>
              <div
                v-for="period in results.periods"
                :key="'income-total-' + period.label"
                class="col-amount"
              >
                {{
                  formatNumber(
                    sumAllAccounts(completeIncomeAccounts, period.label),
                  )
                }}
              </div>
              <div
                v-if="showVarianceDollar && results.periods?.length >= 2"
                class="col-variance"
              >
                <span :class="getVarianceClass(getTotalVariance('income'))">
                  {{ formatVariance(getTotalVariance("income")) }}
                </span>
              </div>
              <div
                v-if="showVariancePercent && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="getVarianceClass(getTotalVariancePercent('income'))"
                >
                  {{ formatVariancePercent(getTotalVariancePercent("income")) }}
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- Expenses Section -->
        <div class="section">
          <div class="section-title" @click="toggleSection('expenses')">
            <q-icon
              :name="
                sectionCollapsed.expenses ? 'chevron_right' : 'expand_more'
              "
              size="sm"
              class="section-expand-icon"
            />
            {{ t("Expenses") }}
          </div>
          <template v-if="!sectionCollapsed.expenses">
            <div
              v-for="(account, index) in expenseAccounts"
              :key="'expense-' + index"
              class="table-row"
              :class="{
                'heading-row': account.charttype === 'H',
                'detail-row': account.charttype === 'A',
              }"
            >
              <div class="col-account">
                <span :style="{ marginLeft: getIndentation(account.level) }">
                  <q-icon
                    v-if="account.charttype === 'H'"
                    :name="
                      isHeadingCollapsed(account.accno)
                        ? 'chevron_right'
                        : 'expand_more'
                    "
                    size="xs"
                    class="expand-arrow"
                    @click.stop="toggleHeading(account.accno)"
                  />
                  <span class="account-name">
                    <template v-if="formData.l_accno && account.accno"
                      >{{ account.accno }} -
                    </template>
                    {{ account.description }}
                  </span>
                </span>
              </div>
              <div
                v-for="period in results.periods"
                :key="period.label"
                class="col-amount"
              >
                <template v-if="account.periods[period.label] !== undefined">
                  <router-link
                    v-if="account.charttype === 'A'"
                    :to="getPath(account.accno, period)"
                    target="_blank"
                    class="amount-link"
                  >
                    {{ formatNumber(account.periods[period.label].amount) }}
                  </router-link>
                  <span v-else>{{
                    formatNumber(account.periods[period.label].amount)
                  }}</span>
                </template>
                <template v-else>-</template>
              </div>
              <div
                v-if="showVarianceDollar && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="getVarianceClass(getAccountVariance(account), true)"
                >
                  {{ formatVariance(getAccountVariance(account)) }}
                </span>
              </div>
              <div
                v-if="showVariancePercent && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="
                    getVarianceClass(getAccountVariancePercent(account), true)
                  "
                >
                  {{
                    formatVariancePercent(getAccountVariancePercent(account))
                  }}
                </span>
              </div>
            </div>
            <div class="table-row total-row">
              <div class="col-account">{{ t("Total Expenses") }}</div>
              <div
                v-for="period in results.periods"
                :key="'expense-total-' + period.label"
                class="col-amount"
              >
                {{
                  formatExpenseTotal(
                    sumAllAccounts(completeExpenseAccounts, period.label),
                  )
                }}
              </div>
              <div
                v-if="showVarianceDollar && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="getVarianceClass(getTotalVariance('expenses'), true)"
                >
                  {{ formatVariance(getTotalVariance("expenses")) }}
                </span>
              </div>
              <div
                v-if="showVariancePercent && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="
                    getVarianceClass(getTotalVariancePercent('expenses'), true)
                  "
                >
                  {{
                    formatVariancePercent(getTotalVariancePercent("expenses"))
                  }}
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- Net Income Row -->
        <div class="table-row net-income-row">
          <div class="col-account">{{ t("Net Income/(Loss)") }}</div>
          <div
            v-for="period in results.periods"
            :key="'net-' + period.label"
            class="col-amount"
          >
            <span
              :class="
                netIncome(period.label) < 0
                  ? 'variance-negative'
                  : 'variance-positive'
              "
            >
              {{ formatNetIncome(netIncome(period.label)) }}
            </span>
          </div>
          <div
            v-if="showVarianceDollar && results.periods?.length >= 2"
            class="col-variance"
          >
            <span :class="getVarianceClass(getNetIncomeVariance())">
              {{ formatVariance(getNetIncomeVariance()) }}
            </span>
          </div>
          <div
            v-if="showVariancePercent && results.periods?.length >= 2"
            class="col-variance"
          >
            <span :class="getVarianceClass(getNetIncomeVariancePercent())">
              {{ formatVariancePercent(getNetIncomeVariancePercent()) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject, nextTick } from "vue";
import { date, LocalStorage } from "quasar";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { api } from "src/boot/axios";
import { roundAmount, formatAmount } from "src/helpers/utils.js";
import { utils, writeFile } from "xlsx";
import draggable from "vuedraggable";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Income Statement"));
const route = useRoute();
const router = useRouter();

const client = route.params.client;
const STORAGE_KEY = `${client}_income_statement_params`;
const now = new Date();
const currentYear = String(now.getFullYear());
const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

const formData = ref({
  department: route.query.department || "",
  projectnumber: route.query.projectnumber || "",
  currency: "",
  usetemplate: false,
  method: "accrual",
  l_heading: false,
  l_subtotal: false,
  l_accno: true,
  previousyear: "0",
  reversedisplay: false,
  accounttype: "standard",
  periodMode: "yearly",
  periods: [],
});

const periodModeOptions = [
  { label: t("Monthly"), value: "monthly" },
  { label: t("Quarterly"), value: "quarterly" },
  { label: t("Yearly"), value: "yearly" },
  { label: t("Custom"), value: "custom" },
];

const methodOptions = [
  { label: t("Accrual"), value: "accrual" },
  { label: t("Cash"), value: "cash" },
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
const collapsedHeadings = ref(new Set());
const showVarianceDollar = ref(true);
const showVariancePercent = ref(false);
const sectionCollapsed = ref({
  income: false,
  expenses: false,
});
const selectedVariance = ref("0-1"); // format: "currentIndex-previousIndex"
const selectedCollapseLevel = ref(-1); // -1 means fully expanded

// Generate all possible variance combinations from selected periods
const varianceOptions = computed(() => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return [];

  const options = [];
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const label1 = periods[i].label;
      const label2 = periods[j].label;
      options.push({
        value: `${i}-${j}`,
        label: `${label1} vs ${label2}`,
        currentIdx: i,
        previousIdx: j,
      });
    }
  }
  return options;
});

const selectedVarianceLabel = computed(() => {
  const option = varianceOptions.value.find(
    (o) => o.value === selectedVariance.value,
  );
  return option ? option.label : t("Select Variance");
});

// Calculate the maximum heading level from all accounts
const maxHeadingLevel = computed(() => {
  const allAccounts = [
    ...completeIncomeAccounts.value,
    ...completeExpenseAccounts.value,
  ];
  let maxLevel = 0;
  allAccounts
    .filter((a) => a.charttype === "H")
    .forEach((a) => {
      if (a.level > maxLevel) maxLevel = a.level;
    });
  return maxLevel;
});

// Generate collapse level options based on actual heading levels
const collapseLevelOptions = computed(() => {
  const options = [];
  for (let i = 0; i <= maxHeadingLevel.value; i++) {
    options.push({
      value: i,
      label: `${t("Level")} ${i + 1}`,
    });
  }
  return options;
});

const selectedCollapseLabel = computed(() => {
  if (selectedCollapseLevel.value === -1) {
    return t("Expand All");
  }
  return `${t("Level")} ${selectedCollapseLevel.value + 1}`;
});

const selectVariance = (option) => {
  selectedVariance.value = option.value;
};

// Get current and previous period indices for variance calculations
const getVarianceIndices = () => {
  const parts = selectedVariance.value.split("-");
  return {
    currentIdx: parseInt(parts[0], 10),
    previousIdx: parseInt(parts[1], 10),
  };
};

const formattedDateRange = computed(() => {
  if (formData.value.periods.length) {
    return formData.value.periods.map((p) => p.label).join(", ");
  }
  return t("N/A");
});

const buildAccountHierarchy = (
  rawAccounts,
  accountsInfo,
  type,
  respectCollapsed = true,
) => {
  const accountMap = new Map();
  const rootAccounts = [];

  Object.keys(rawAccounts).forEach((accno) => {
    const accountPeriods = rawAccounts[accno];
    const periodsData = {};

    Object.keys(accountPeriods).forEach((periodLabel) => {
      if (accountPeriods[periodLabel][type]) {
        periodsData[periodLabel] = accountPeriods[periodLabel][type];
      }
    });

    if (Object.keys(periodsData).length > 0) {
      const accountInfo = accountsInfo[accno] || {};
      accountMap.set(accno, {
        accno,
        description: accountInfo.description || "",
        charttype: accountInfo.charttype || "A",
        parent_accno: accountInfo.parent_accno || null,
        periods: periodsData,
        level: 0,
        children: [],
      });
    }
  });

  accountMap.forEach((account) => {
    if (account.parent_accno && accountMap.has(account.parent_accno)) {
      const parent = accountMap.get(account.parent_accno);
      parent.children.push(account);
      account.level = parent.level + 1;
    } else {
      rootAccounts.push(account);
    }
  });

  const flatten = (accounts, result = []) => {
    accounts.forEach((account) => {
      result.push(account);
      const shouldExpand = respectCollapsed
        ? account.children.length > 0 &&
          !collapsedHeadings.value.has(account.accno)
        : account.children.length > 0;
      if (shouldExpand) flatten(account.children, result);
    });
    return result;
  };

  return flatten(rootAccounts);
};

const getRawData = () => ({
  raw: results.value[""] || {},
  info: results.value.accounts || {},
});

const incomeAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "I");
});

const expenseAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "E");
});

const completeIncomeAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "I", false);
});

const completeExpenseAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "E", false);
});

const formatNumber = (value) => {
  const num = Number(value) || 0;
  if (num < 0) return `-${formatAmount(Math.abs(num))}`;
  return formatAmount(num);
};

const formatExpenseTotal = (value) => {
  const num = Number(value) || 0;
  if (num < 0) return formatAmount(Math.abs(num));
  if (num > 0) return `-${formatAmount(num)}`;
  return formatAmount(0);
};

const formatNetIncome = (value) => {
  const num = Number(value) || 0;
  if (num < 0) return `-${formatAmount(Math.abs(num))}`;
  return formatAmount(num);
};

const getIndentation = (level) => {
  const basePadding = 12;
  const indentPerLevel = 20;
  return `${basePadding + level * indentPerLevel}px`;
};

const toggleHeading = (accno) => {
  if (collapsedHeadings.value.has(accno)) {
    collapsedHeadings.value.delete(accno);
  } else {
    collapsedHeadings.value.add(accno);
  }
};

const isHeadingCollapsed = (accno) => {
  return collapsedHeadings.value.has(accno);
};

const expandAllHeadings = () => {
  collapsedHeadings.value.clear();
  sectionCollapsed.value = { income: false, expenses: false };
  selectedCollapseLevel.value = -1;
};

const collapseToLevel = (level) => {
  selectedCollapseLevel.value = level;
  collapsedHeadings.value.clear();
  const allAccounts = [
    ...completeIncomeAccounts.value,
    ...completeExpenseAccounts.value,
  ];
  // Collapse all headings at or above the selected level
  allAccounts
    .filter((a) => a.charttype === "H" && a.level >= level)
    .forEach((a) => collapsedHeadings.value.add(a.accno));
};

const toggleSection = (section) => {
  sectionCollapsed.value[section] = !sectionCollapsed.value[section];
};

const sumAllAccounts = (completeAccountsArray, periodLabel) => {
  return completeAccountsArray.reduce((sum, account) => {
    if (account.charttype === "H") return sum;
    const amount = account.periods[periodLabel]?.amount || 0;
    return sum + Number(amount);
  }, 0);
};

const netIncome = (periodLabel) => {
  const incomeSum = sumAllAccounts(completeIncomeAccounts.value, periodLabel);
  const expenseSum = sumAllAccounts(completeExpenseAccounts.value, periodLabel);
  return incomeSum + expenseSum;
};

// Variance calculations - using selected variance indices
const getAccountVariance = (account) => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();
  const current = account.periods[periods[currentIdx]?.label]?.amount || 0;
  const previous = account.periods[periods[previousIdx]?.label]?.amount || 0;
  return Number(current) - Number(previous);
};

const getAccountVariancePercent = (account) => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();
  const current = account.periods[periods[currentIdx]?.label]?.amount || 0;
  const previous = account.periods[periods[previousIdx]?.label]?.amount || 0;
  if (previous === 0) return current !== 0 ? 100 : 0;
  return (
    ((Number(current) - Number(previous)) / Math.abs(Number(previous))) * 100
  );
};

const getTotalVariance = (type) => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();

  const accounts =
    type === "income"
      ? completeIncomeAccounts.value
      : completeExpenseAccounts.value;
  const current = sumAllAccounts(accounts, periods[currentIdx]?.label);
  const previous = sumAllAccounts(accounts, periods[previousIdx]?.label);
  return current - previous;
};

const getTotalVariancePercent = (type) => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();

  const accounts =
    type === "income"
      ? completeIncomeAccounts.value
      : completeExpenseAccounts.value;
  const current = sumAllAccounts(accounts, periods[currentIdx]?.label);
  const previous = sumAllAccounts(accounts, periods[previousIdx]?.label);
  if (previous === 0) return current !== 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const getNetIncomeVariance = () => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();
  const current = netIncome(periods[currentIdx]?.label);
  const previous = netIncome(periods[previousIdx]?.label);
  return current - previous;
};

const getNetIncomeVariancePercent = () => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();
  const current = netIncome(periods[currentIdx]?.label);
  const previous = netIncome(periods[previousIdx]?.label);
  if (previous === 0) return current !== 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const formatVariance = (value) => {
  if (value === null) return "-";
  const absVal = Math.abs(value);
  const formatted = formatAmount(absVal);
  if (value < 0) return `-${formatted}`;
  if (value > 0) return `+${formatted}`;
  return "-";
};

const formatVariancePercent = (value) => {
  if (value === null) return "-";
  const absVal = Math.abs(value).toFixed(1);
  if (value < 0) return `-${absVal}%`;
  if (value > 0) return `+${absVal}%`;
  return "-";
};

const getVarianceClass = (value, inverted = false) => {
  if (value === null || value === 0) return "";
  // For expenses, decrease is good (inverted logic)
  const isPositive = inverted ? value < 0 : value > 0;
  return isPositive ? "variance-positive" : "variance-negative";
};

const getVarianceComparison = () => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return "";
  const { currentIdx, previousIdx } = getVarianceIndices();
  return `${periods[currentIdx]?.label} vs ${periods[previousIdx]?.label}`;
};

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
        0,
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

const addPeriod = () => {
  let newPeriod = {};
  const allowedYears = yearOptions.map((y) => parseInt(y.value, 10));
  const minYear = Math.min(...allowedYears);

  if (formData.value.periods.length > 0) {
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
      if (year < minYear) year = minYear;
      newPeriod = {
        ...lastPeriod,
        month: month.toString().padStart(2, "0"),
        year: year.toString(),
      };
    } else if (formData.value.periodMode === "quarterly") {
      let quarter = lastPeriod.quarter;
      let year = Number(lastPeriod.year);
      const qNumber = parseInt(quarter.substring(1), 10);
      if (qNumber === 1) {
        quarter = "Q4";
        year = year - 1;
      } else {
        quarter = "Q" + (qNumber - 1);
      }
      if (year < minYear) year = minYear;
      newPeriod = { ...lastPeriod, quarter, year: year.toString() };
    } else if (formData.value.periodMode === "custom") {
      newPeriod = { ...lastPeriod };
    }
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

const removePeriod = (index) => {
  formData.value.periods.splice(index, 1);
};

const search = async () => {
  try {
    loading.value = true;
    const response = await api.get("/reports/income_statement", {
      params: formData.value,
    });
    results.value = response.data;
    filtersOpen.value = false;

    // Save parameters after successful search
    saveParams();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const downloadPDF = async () => {
  try {
    loading.value = true;
    const params = { ...formData.value, usetemplate: "Y" };
    // Add heading_level if a collapse level is selected
    if (selectedCollapseLevel.value !== -1) {
      params.heading_level = selectedCollapseLevel.value + 1;
    }
    const response = await api.get("/reports/income_statement", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "income_statement.pdf");
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

const downloadExcel = () => {
  const includeAccNo = formData.value.l_accno;
  let headerRow = includeAccNo ? ["Acc No", "Account"] : ["Account"];
  const periods = results.value.periods || [];
  periods.forEach((period) => headerRow.push(period.label));
  if (periods.length >= 2) {
    headerRow.push("VAR", "VAR %");
  }

  const exportData = [];
  exportData.push(["Income Statement"]);
  exportData.push([]);
  exportData.push(headerRow);

  const addAccountRow = (account) => {
    let row = [];
    if (includeAccNo) {
      row.push(account.accno || "");
      row.push(account.description);
    } else {
      row.push(account.description);
    }
    periods.forEach((period) => {
      const amt = account.periods[period.label]?.amount || 0;
      row.push(roundAmount(amt));
    });
    if (periods.length >= 2) {
      row.push(getAccountVariance(account) || 0);
      row.push(getAccountVariancePercent(account)?.toFixed(1) + "%" || "-");
    }
    exportData.push(row);
  };

  const addLabelRow = (label) => {
    exportData.push(includeAccNo ? ["", label] : [label]);
  };

  addLabelRow("Income");
  incomeAccounts.value.forEach((a) => addAccountRow(a));

  let incomeTotalRow = includeAccNo ? ["", "Total Income"] : ["Total Income"];
  periods.forEach((p) =>
    incomeTotalRow.push(
      roundAmount(sumAllAccounts(completeIncomeAccounts.value, p.label)),
    ),
  );
  if (periods.length >= 2) {
    incomeTotalRow.push(getTotalVariance("income") || 0);
    incomeTotalRow.push(
      getTotalVariancePercent("income")?.toFixed(1) + "%" || "-",
    );
  }
  exportData.push(incomeTotalRow);

  exportData.push([]);
  addLabelRow("Expenses");
  expenseAccounts.value.forEach((a) => addAccountRow(a));

  let expenseTotalRow = includeAccNo
    ? ["", "Total Expenses"]
    : ["Total Expenses"];
  periods.forEach((p) =>
    expenseTotalRow.push(
      roundAmount(sumAllAccounts(completeExpenseAccounts.value, p.label)),
    ),
  );
  if (periods.length >= 2) {
    expenseTotalRow.push(getTotalVariance("expenses") || 0);
    expenseTotalRow.push(
      getTotalVariancePercent("expenses")?.toFixed(1) + "%" || "-",
    );
  }
  exportData.push(expenseTotalRow);

  exportData.push([]);
  let netIncomeRow = includeAccNo ? ["", "Net Income"] : ["Net Income"];
  periods.forEach((p) => netIncomeRow.push(roundAmount(netIncome(p.label))));
  if (periods.length >= 2) {
    netIncomeRow.push(getNetIncomeVariance() || 0);
    netIncomeRow.push(getNetIncomeVariancePercent()?.toFixed(1) + "%" || "-");
  }
  exportData.push(netIncomeRow);

  const worksheet = utils.aoa_to_sheet(exportData);
  worksheet["!cols"] = headerRow.map((_, colIdx) => {
    let maxLength = 10;
    exportData.forEach((row) => {
      const cellValue = row[colIdx];
      if (cellValue != null)
        maxLength = Math.max(maxLength, cellValue.toString().length);
    });
    return { wch: maxLength + 2 };
  });

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Income Statement");
  writeFile(workbook, "income_statement.xlsx", { compression: true });
};

// Flag to prevent watcher from resetting periods during load
const isLoadingParams = ref(false);

watch(
  () => formData.value.periodMode,
  () => {
    if (isLoadingParams.value) return;
    formData.value.periods = [];
    addPeriod();
  },
);

// Save report parameters to LocalStorage
const saveParams = () => {
  const params = {
    periodMode: formData.value.periodMode,
    periods: formData.value.periods,
    method: formData.value.method,
    l_accno: formData.value.l_accno,
    accounttype: formData.value.accounttype,
    showVarianceDollar: showVarianceDollar.value,
    showVariancePercent: showVariancePercent.value,
  };
  try {
    LocalStorage.set(STORAGE_KEY, params);
  } catch (error) {
    console.error("Error saving report params:", error);
  }
};

// Load report parameters from LocalStorage
const loadParams = async () => {
  try {
    const savedParams = LocalStorage.getItem(STORAGE_KEY);
    if (savedParams) {
      const params =
        typeof savedParams === "string" ? JSON.parse(savedParams) : savedParams;

      // Set flag to prevent watcher from clearing periods
      isLoadingParams.value = true;

      if (params.periodMode) {
        formData.value.periodMode = params.periodMode;
      }

      // Wait for Vue to process periodMode change before setting periods
      await nextTick();

      if (params.periods && params.periods.length > 0) {
        // Deep copy the periods to ensure all nested properties are preserved
        formData.value.periods = JSON.parse(JSON.stringify(params.periods));
      }
      if (params.method) {
        formData.value.method = params.method;
      }
      if (params.l_accno !== undefined) {
        formData.value.l_accno = params.l_accno;
      }
      if (params.accounttype) {
        formData.value.accounttype = params.accounttype;
      }
      if (params.showVarianceDollar !== undefined) {
        showVarianceDollar.value = params.showVarianceDollar;
      }
      if (params.showVariancePercent !== undefined) {
        showVariancePercent.value = params.showVariancePercent;
      }

      // Wait for Vue to process all changes before resetting flag
      await nextTick();
      isLoadingParams.value = false;
    }
  } catch (error) {
    console.error("Error loading saved params:", error);
    LocalStorage.remove(STORAGE_KEY);
    isLoadingParams.value = false;
  }
};

// Watch for changes to save parameters
watch(
  [
    () => formData.value.periodMode,
    () => formData.value.periods,
    () => formData.value.method,
    () => formData.value.l_accno,
    () => formData.value.accounttype,
    showVarianceDollar,
    showVariancePercent,
  ],
  () => {
    if (!isLoadingParams.value) {
      saveParams();
    }
  },
  { deep: true },
);

onMounted(async () => {
  await loadParams();
  fetchLinks();
  // Only add default period if none were loaded from storage
  if (formData.value.periods.length === 0) addPeriod();
  // Auto-search if query params are present
  if (route.query.fromdate || route.query.todate) search();
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

<style scoped>
.report-container {
  background: var(--q-mainbg);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--q-border);
}

.header-info {
  font-size: 0.9rem;
  color: var(--q-lighttext);
}

.client-name {
  color: var(--q-primary);
  font-weight: 600;
}

.separator {
  margin: 0 8px;
  color: var(--q-border);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--q-tint);
  border-bottom: 1px solid var(--q-border);
}

.variance-toggles {
  display: flex;
  gap: 8px;
}

.active-toggle {
  background: var(--q-primary) !important;
  color: white !important;
}

.expand-controls {
  display: flex;
  gap: 4px;
}

.report-table {
  width: 100%;
}

.table-header {
  display: flex;
  padding: 10px 20px;
  background: var(--q-tint);
  border-bottom: 2px solid var(--q-border);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--q-lighttext);
}

.col-account {
  flex: 2;
  min-width: 200px;
}

.col-amount {
  flex: 1;
  text-align: right;
  min-width: 100px;
}

.col-variance {
  flex: 0.8;
  text-align: right;
  min-width: 90px;
}

.variance-label {
  color: var(--q-primary);
  font-weight: 600;
}

.variance-sub {
  font-size: 0.65rem;
  color: var(--q-lighttext);
  display: block;
}

.section {
  border-bottom: 1px solid var(--q-border);
}

.section-title {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  background: var(--q-mainbg);
  border-bottom: 1px solid var(--q-border);
}

.section-title:hover {
  background: var(--q-tint);
}

.section-expand-icon {
  margin-right: 8px;
  color: var(--q-lighttext);
}

.table-row {
  display: flex;
  padding: 8px 20px;
  border-bottom: 1px solid var(--q-border);
  font-size: 0.875rem;
  align-items: center;
}

.table-row:hover {
  background: var(--q-tint);
}

.heading-row {
  font-weight: 600;
  background: var(--q-tint);
}

.heading-row:hover {
  background: var(--q-mutedbg);
}

.detail-row {
  font-weight: 400;
}

.expand-arrow {
  margin-right: 4px;
  cursor: pointer;
  color: var(--q-lighttext);
  vertical-align: middle;
}

.account-name {
  color: var(--q-maintext);
}

.amount-link {
  color: inherit;
  text-decoration: none;
}

.amount-link:hover {
  color: var(--q-primary);
  text-decoration: underline;
}

.total-row {
  font-weight: 600;
  background: var(--q-tint);
  border-top: 2px solid var(--q-border);
}

.net-income-row {
  font-weight: 700;
  background: var(--q-highlight);
  border-top: 3px solid var(--q-primary);
  font-size: 0.95rem;
}

.variance-positive {
  color: var(--q-positive);
  font-weight: 500;
}

.variance-negative {
  color: var(--q-negative);
  font-weight: 500;
}

.drag-handle:hover {
  cursor: grab;
}

:deep(.variance-dropdown) {
  font-size: 0.714rem;
  min-width: 120px;
}

:deep(.variance-dropdown .q-item) {
  padding: 4px 10px;
  min-height: 24px;
}

:deep(.collapse-dropdown) {
  font-size: 0.8rem;
  min-width: 110px;
}

:deep(.collapse-dropdown .q-item) {
  padding: 6px 12px;
  min-height: 28px;
}

@media print {
  .q-page {
    padding: 0 !important;
  }
  .report-container {
    box-shadow: none !important;
  }
  .controls-row,
  .header-actions {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .controls-row {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .col-account {
    min-width: 150px;
  }

  .col-amount,
  .col-variance {
    min-width: 70px;
    font-size: 0.8rem;
  }
}
</style>
