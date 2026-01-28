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
                  {{ t("As Of") }}
                </div>
                <s-button
                  type="add-line"
                  :label="t('Add Date')"
                  @click="addPeriod"
                  class="q-ml-sm"
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
                    <div class="col-12 col-md-2">
                      <q-input
                        v-model="element.todate"
                        type="date"
                        outlined
                        dense
                        :label="t('Date')"
                        @update:model-value="() => updatePeriod(element)"
                      />
                    </div>
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
          <q-btn flat :label="t('Print')" @click="getPDF" size="sm" />
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
          <q-btn
            flat
            size="sm"
            @click="collapseAllHeadings"
            no-caps
            icon="unfold_less"
          >
            {{ t("Collapse") }}
          </q-btn>
          <q-btn
            flat
            size="sm"
            @click="expandAllHeadings"
            no-caps
            icon="unfold_more"
          >
            {{ t("Expand") }}
          </q-btn>
        </div>
      </div>

      <!-- Report Table -->
      <div class="report-table">
        <!-- Table Header -->
        <div class="table-header">
          <div class="col-account">{{ t("ACCOUNT") }}</div>
          <div
            v-for="period in results.periods"
            :key="period.label"
            class="col-amount"
          >
            {{ formatPeriodLabel(period.label) }}
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

        <!-- Assets Section -->
        <div class="section">
          <div class="section-title" @click="toggleSection('assets')">
            <q-icon
              :name="sectionCollapsed.assets ? 'chevron_right' : 'expand_more'"
              size="sm"
              class="section-expand-icon"
            />
            {{ t("Assets") }}
          </div>
          <template v-if="!sectionCollapsed.assets">
            <div
              v-for="(account, index) in assetAccounts"
              :key="'asset-' + index"
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
            <!-- Assets Total -->
            <div class="table-row total-row">
              <div class="col-account">{{ t("Total Assets") }}</div>
              <div
                v-for="period in results.periods"
                :key="'asset-total-' + period.label"
                class="col-amount"
              >
                {{
                  formatNumber(
                    sumAllAccounts(completeAssetAccounts, period.label),
                  )
                }}
              </div>
              <div
                v-if="showVarianceDollar && results.periods?.length >= 2"
                class="col-variance"
              >
                <span :class="getVarianceClass(getTotalVariance('assets'))">
                  {{ formatVariance(getTotalVariance("assets")) }}
                </span>
              </div>
              <div
                v-if="showVariancePercent && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="getVarianceClass(getTotalVariancePercent('assets'))"
                >
                  {{ formatVariancePercent(getTotalVariancePercent("assets")) }}
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- Liabilities Section -->
        <div class="section">
          <div class="section-title" @click="toggleSection('liabilities')">
            <q-icon
              :name="
                sectionCollapsed.liabilities ? 'chevron_right' : 'expand_more'
              "
              size="sm"
              class="section-expand-icon"
            />
            {{ t("Liabilities") }}
          </div>
          <template v-if="!sectionCollapsed.liabilities">
            <div
              v-for="(account, index) in liabilityAccounts"
              :key="'liability-' + index"
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
            <!-- Liabilities Total -->
            <div class="table-row total-row">
              <div class="col-account">{{ t("Total Liabilities") }}</div>
              <div
                v-for="period in results.periods"
                :key="'liability-total-' + period.label"
                class="col-amount"
              >
                {{
                  formatNumber(
                    sumAllAccounts(completeLiabilityAccounts, period.label),
                  )
                }}
              </div>
              <div
                v-if="showVarianceDollar && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="
                    getVarianceClass(getTotalVariance('liabilities'), true)
                  "
                >
                  {{ formatVariance(getTotalVariance("liabilities")) }}
                </span>
              </div>
              <div
                v-if="showVariancePercent && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="
                    getVarianceClass(
                      getTotalVariancePercent('liabilities'),
                      true,
                    )
                  "
                >
                  {{
                    formatVariancePercent(
                      getTotalVariancePercent("liabilities"),
                    )
                  }}
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- Equity Section -->
        <div class="section">
          <div class="section-title" @click="toggleSection('equity')">
            <q-icon
              :name="sectionCollapsed.equity ? 'chevron_right' : 'expand_more'"
              size="sm"
              class="section-expand-icon"
            />
            {{ t("Equity") }}
          </div>
          <template v-if="!sectionCollapsed.equity">
            <div
              v-for="(account, index) in equityAccounts"
              :key="'equity-' + index"
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
            <!-- Current Year Result -->
            <div class="table-row subtotal-row">
              <div class="col-account">{{ t("Current Earnings") }}</div>
              <div
                v-for="period in results.periods"
                :key="'earnings-' + period.label"
                class="col-amount"
              >
                {{ formatNumber(getCurrentEarnings(period.label)) }}
              </div>
              <div
                v-if="showVarianceDollar && results.periods?.length >= 2"
                class="col-variance"
              >
                <span :class="getVarianceClass(getEarningsVariance())">
                  {{ formatVariance(getEarningsVariance()) }}
                </span>
              </div>
              <div
                v-if="showVariancePercent && results.periods?.length >= 2"
                class="col-variance"
              >
                <span :class="getVarianceClass(getEarningsVariancePercent())">
                  {{ formatVariancePercent(getEarningsVariancePercent()) }}
                </span>
              </div>
            </div>
            <!-- Total Equity -->
            <div class="table-row total-row">
              <div class="col-account">{{ t("Total Equity") }}</div>
              <div
                v-for="period in results.periods"
                :key="'equity-total-' + period.label"
                class="col-amount"
              >
                {{ formatNumber(getTotalEquity(period.label)) }}
              </div>
              <div
                v-if="showVarianceDollar && results.periods?.length >= 2"
                class="col-variance"
              >
                <span :class="getVarianceClass(getTotalVariance('equity'))">
                  {{ formatVariance(getTotalVariance("equity")) }}
                </span>
              </div>
              <div
                v-if="showVariancePercent && results.periods?.length >= 2"
                class="col-variance"
              >
                <span
                  :class="getVarianceClass(getTotalVariancePercent('equity'))"
                >
                  {{ formatVariancePercent(getTotalVariancePercent("equity")) }}
                </span>
              </div>
            </div>
          </template>
        </div>

        <!-- Total Liabilities + Equity -->
        <div class="table-row grand-total-row">
          <div class="col-account">{{ t("Total Liabilities + Equity") }}</div>
          <div
            v-for="period in results.periods"
            :key="'liabilities-equity-total-' + period.label"
            class="col-amount"
          >
            {{ formatNumber(getTotalLiabilitiesAndEquity(period.label)) }}
          </div>
          <div
            v-if="showVarianceDollar && results.periods?.length >= 2"
            class="col-variance"
          >
            <span
              :class="getVarianceClass(getTotalVariance('liabilitiesEquity'))"
            >
              {{ formatVariance(getTotalVariance("liabilitiesEquity")) }}
            </span>
          </div>
          <div
            v-if="showVariancePercent && results.periods?.length >= 2"
            class="col-variance"
          >
            <span
              :class="
                getVarianceClass(getTotalVariancePercent('liabilitiesEquity'))
              "
            >
              {{
                formatVariancePercent(
                  getTotalVariancePercent("liabilitiesEquity"),
                )
              }}
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
updateTitle(t("Balance Sheet"));
const route = useRoute();
const router = useRouter();

const client = route.params.client;
const STORAGE_KEY = `${client}_balance_sheet_params`;
const now = new Date();

const formData = ref({
  department: route.query.department || "",
  projectnumber: route.query.projectnumber || "",
  usetemplate: false,
  l_accno: true,
  previousyear: false,
  accounttype: "standard",
  heading_only: "0",
  periodMode: "current",
  periods: [],
});

const periodModeOptions = [
  { label: t("Current"), value: "current" },
  { label: t("Monthly"), value: "monthly" },
  { label: t("Quarterly"), value: "quarterly" },
  { label: t("Yearly"), value: "yearly" },
  { label: t("Custom"), value: "custom" },
];

const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const yr = String(now.getFullYear() - i);
  return { value: yr, label: yr };
});

const departments = ref([]);
const projects = ref([]);
const filtersOpen = ref(true);
const loading = ref(false);
const results = ref({});
const collapsedHeadings = ref(new Set());
const showVarianceDollar = ref(true);
const showVariancePercent = ref(false);
const sectionCollapsed = ref({
  assets: false,
  liabilities: false,
  equity: false,
});
const selectedVariance = ref("0-1"); // format: "currentIndex-previousIndex"

// Generate all possible variance combinations from selected periods
const varianceOptions = computed(() => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return [];

  const options = [];
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const label1 = formatPeriodLabel(periods[i].label);
      const label2 = formatPeriodLabel(periods[j].label);
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
  if (results.value.periods?.length) {
    return formatPeriodLabel(results.value.periods[0].label);
  }
  return t("N/A");
});

const formatPeriodLabel = (label) => {
  if (!label) return "";
  // Convert YYYY-MM-DD to DD.MM.YYYY format
  if (label.includes("-")) {
    const parts = label.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
  }
  return label;
};

const buildAccountHierarchy = (
  rawAccounts,
  accountsInfo,
  type,
  respectCollapsed = true,
) => {
  const accountMap = new Map();
  const rootAccounts = [];
  const multiplier = type === "A" ? -1 : 1; // Negate assets

  Object.keys(rawAccounts).forEach((accno) => {
    const accountPeriods = rawAccounts[accno];
    const periodsData = {};

    Object.keys(accountPeriods).forEach((periodLabel) => {
      if (accountPeriods[periodLabel][type]) {
        const periodData = { ...accountPeriods[periodLabel][type] };
        periodData.amount = (Number(periodData.amount) || 0) * multiplier;
        periodsData[periodLabel] = periodData;
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

const assetAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "A");
});

const liabilityAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "L");
});

const equityAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "Q");
});

const completeAssetAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "A", false);
});

const completeLiabilityAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "L", false);
});

const completeEquityAccounts = computed(() => {
  const { raw, info } = getRawData();
  return buildAccountHierarchy(raw, info, "Q", false);
});

const formatNumber = (value) => {
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
  sectionCollapsed.value = { assets: false, liabilities: false, equity: false };
};

const collapseAllHeadings = () => {
  const allAccounts = [
    ...assetAccounts.value,
    ...liabilityAccounts.value,
    ...equityAccounts.value,
  ];
  allAccounts
    .filter((a) => a.charttype === "H")
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

const getCurrentEarnings = (periodLabel) => {
  return (
    sumAllAccounts(completeAssetAccounts.value, periodLabel) -
    sumAllAccounts(completeLiabilityAccounts.value, periodLabel) -
    sumAllAccounts(completeEquityAccounts.value, periodLabel)
  );
};

const getTotalEquity = (periodLabel) => {
  return (
    sumAllAccounts(completeAssetAccounts.value, periodLabel) -
    sumAllAccounts(completeLiabilityAccounts.value, periodLabel)
  );
};

const getTotalLiabilitiesAndEquity = (periodLabel) => {
  return (
    sumAllAccounts(completeLiabilityAccounts.value, periodLabel) +
    getTotalEquity(periodLabel)
  );
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

  let accounts;
  if (type === "assets") accounts = completeAssetAccounts.value;
  else if (type === "liabilities") accounts = completeLiabilityAccounts.value;
  else if (type === "equity") {
    const current = getTotalEquity(periods[currentIdx]?.label);
    const previous = getTotalEquity(periods[previousIdx]?.label);
    return current - previous;
  } else if (type === "liabilitiesEquity") {
    const current = getTotalLiabilitiesAndEquity(periods[currentIdx]?.label);
    const previous = getTotalLiabilitiesAndEquity(periods[previousIdx]?.label);
    return current - previous;
  }

  const current = sumAllAccounts(accounts, periods[currentIdx]?.label);
  const previous = sumAllAccounts(accounts, periods[previousIdx]?.label);
  return current - previous;
};

const getTotalVariancePercent = (type) => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();

  let current, previous;
  if (type === "assets") {
    current = sumAllAccounts(
      completeAssetAccounts.value,
      periods[currentIdx]?.label,
    );
    previous = sumAllAccounts(
      completeAssetAccounts.value,
      periods[previousIdx]?.label,
    );
  } else if (type === "liabilities") {
    current = sumAllAccounts(
      completeLiabilityAccounts.value,
      periods[currentIdx]?.label,
    );
    previous = sumAllAccounts(
      completeLiabilityAccounts.value,
      periods[previousIdx]?.label,
    );
  } else if (type === "equity") {
    current = getTotalEquity(periods[currentIdx]?.label);
    previous = getTotalEquity(periods[previousIdx]?.label);
  } else if (type === "liabilitiesEquity") {
    current = getTotalLiabilitiesAndEquity(periods[currentIdx]?.label);
    previous = getTotalLiabilitiesAndEquity(periods[previousIdx]?.label);
  }

  if (previous === 0) return current !== 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const getEarningsVariance = () => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();
  const current = getCurrentEarnings(periods[currentIdx]?.label);
  const previous = getCurrentEarnings(periods[previousIdx]?.label);
  return current - previous;
};

const getEarningsVariancePercent = () => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return null;
  const { currentIdx, previousIdx } = getVarianceIndices();
  const current = getCurrentEarnings(periods[currentIdx]?.label);
  const previous = getCurrentEarnings(periods[previousIdx]?.label);
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
  // For liabilities, decrease is good (inverted logic)
  const isPositive = inverted ? value < 0 : value > 0;
  return isPositive ? "variance-positive" : "variance-negative";
};

const getVarianceComparison = () => {
  const periods = results.value.periods || [];
  if (periods.length < 2) return "";
  const { currentIdx, previousIdx } = getVarianceIndices();
  const p1 = formatPeriodLabel(periods[currentIdx]?.label);
  const p2 = formatPeriodLabel(periods[previousIdx]?.label);
  const year1 = p1.split(".")[2] || p1;
  const year2 = p2.split(".")[2] || p2;
  return `${year1} vs ${year2}`;
};

const updatePeriod = (period) => {
  if (period.todate) {
    period.label = period.todate;
  }
};

const addPeriod = () => {
  const allowedYears = yearOptions.map((y) => parseInt(y.value, 10));
  const minYear = Math.min(...allowedYears);

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const parseDate = (dateString) => {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }
    return new Date();
  };

  let newPeriod = {};

  if (formData.value.periods.length > 0) {
    const lastPeriod =
      formData.value.periods[formData.value.periods.length - 1];
    const lastDate = parseDate(lastPeriod.todate);

    if (
      formData.value.periodMode === "yearly" ||
      formData.value.periodMode === "current"
    ) {
      lastDate.setUTCFullYear(lastDate.getUTCFullYear() - 1);
    } else if (formData.value.periodMode === "quarterly") {
      lastDate.setUTCMonth(lastDate.getUTCMonth() - 3);
    } else {
      lastDate.setUTCMonth(lastDate.getUTCMonth() - 1);
    }

    if (lastDate.getUTCFullYear() < minYear) return;
    const newDateStr = formatDate(lastDate);
    newPeriod = { todate: newDateStr, label: newDateStr };
  } else {
    const today = formatDate(now);
    newPeriod = { todate: today, label: today };
  }

  formData.value.periods.push(newPeriod);
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
    params.l_accno = formData.value.l_accno ? 1 : 0;

    const response = await api.get("/reports/balance_sheet", { params });
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
    params.l_accno = formData.value.l_accno ? 1 : 0;

    const response = await api.get("/reports/balance_sheet", {
      params,
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
  let todate = period.todate || period.label;
  if (todate && todate.includes("/")) {
    const parts = todate.split("/");
    todate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(
      2,
      "0",
    )}`;
  }
  const project = formData.value.projectnumber || "";
  const department = formData.value.department || "";
  const params = new URLSearchParams({ accno, todate, project, department });
  return createLink("trial.transactions") + `?${params.toString()}`;
};

const downloadExcel = () => {
  const includeAccNo = formData.value.l_accno;
  let headerRow = ["Account"];
  const periods = results.value.periods || [];
  periods.forEach((period) => headerRow.push(formatPeriodLabel(period.label)));
  if (periods.length >= 2) {
    headerRow.push("VAR", "VAR %");
  }

  const exportData = [];
  exportData.push(["Balance Sheet"]);
  exportData.push([]);
  exportData.push(headerRow);

  const addAccountRow = (account, type) => {
    let row = [];
    const name =
      includeAccNo && account.accno
        ? `${account.accno} - ${account.description}`
        : account.description;
    row.push(name);
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

  exportData.push(["Assets"]);
  assetAccounts.value.forEach((a) => addAccountRow(a, "A"));

  let assetsTotalRow = ["Total Assets"];
  periods.forEach((p) =>
    assetsTotalRow.push(
      roundAmount(sumAllAccounts(completeAssetAccounts.value, p.label)),
    ),
  );
  if (periods.length >= 2) {
    assetsTotalRow.push(getTotalVariance("assets") || 0);
    assetsTotalRow.push(
      getTotalVariancePercent("assets")?.toFixed(1) + "%" || "-",
    );
  }
  exportData.push(assetsTotalRow);

  exportData.push([]);
  exportData.push(["Liabilities"]);
  liabilityAccounts.value.forEach((a) => addAccountRow(a, "L"));

  let liabTotalRow = ["Total Liabilities"];
  periods.forEach((p) =>
    liabTotalRow.push(
      roundAmount(sumAllAccounts(completeLiabilityAccounts.value, p.label)),
    ),
  );
  if (periods.length >= 2) {
    liabTotalRow.push(getTotalVariance("liabilities") || 0);
    liabTotalRow.push(
      getTotalVariancePercent("liabilities")?.toFixed(1) + "%" || "-",
    );
  }
  exportData.push(liabTotalRow);

  exportData.push([]);
  exportData.push(["Equity"]);
  equityAccounts.value.forEach((a) => addAccountRow(a, "Q"));

  let earningsRow = ["Current Earnings"];
  periods.forEach((p) =>
    earningsRow.push(roundAmount(getCurrentEarnings(p.label))),
  );
  if (periods.length >= 2) {
    earningsRow.push(getEarningsVariance() || 0);
    earningsRow.push(getEarningsVariancePercent()?.toFixed(1) + "%" || "-");
  }
  exportData.push(earningsRow);

  let equityTotalRow = ["Total Equity"];
  periods.forEach((p) =>
    equityTotalRow.push(roundAmount(getTotalEquity(p.label))),
  );
  if (periods.length >= 2) {
    equityTotalRow.push(getTotalVariance("equity") || 0);
    equityTotalRow.push(
      getTotalVariancePercent("equity")?.toFixed(1) + "%" || "-",
    );
  }
  exportData.push(equityTotalRow);

  let liabilitiesEquityTotalRow = ["Total Liabilities + Equity"];
  periods.forEach((p) =>
    liabilitiesEquityTotalRow.push(
      roundAmount(getTotalLiabilitiesAndEquity(p.label)),
    ),
  );
  if (periods.length >= 2) {
    liabilitiesEquityTotalRow.push(getTotalVariance("liabilitiesEquity") || 0);
    liabilitiesEquityTotalRow.push(
      getTotalVariancePercent("liabilitiesEquity")?.toFixed(1) + "%" || "-",
    );
  }
  exportData.push(liabilitiesEquityTotalRow);

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
  utils.book_append_sheet(workbook, worksheet, "Balance Sheet");
  writeFile(workbook, "balance_sheet.xlsx", { compression: true });
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
  if (route.query.todate) search();
});

const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/incomestatement");
    departments.value = response.data.departments;
    projects.value = response.data.projects;
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

.grand-total-row {
  font-weight: 700;
  background: var(--q-tint);
  border-top: 3px double var(--q-border);
}

.subtotal-row {
  font-weight: 500;
  font-style: italic;
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
