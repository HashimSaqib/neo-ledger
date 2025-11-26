<template>
  <q-page class="q-pa-md">
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
    </div>

    <!-- Report Output -->
    <q-card
      v-if="results && Object.keys(results).length"
      class="shadow-2"
      ref="reportContent"
    >
      <q-card-actions class="q-pa-sm no-print">
        <q-btn :label="t('Export')" @click="downloadExcel" color="accent" />

        <!-- Print button with toggle option -->
        <q-btn
          :label="t('Print')"
          :icon="formData.heading_only === '1' ? 'print' : 'print'"
          color="info"
          @click="getPDF"
        >
          <q-tooltip>
            {{
              formData.heading_only === "1"
                ? t("Print Headings Only")
                : t("Print Full Report")
            }}
          </q-tooltip>
        </q-btn>

        <!-- Toggle button for heading only option -->
        <q-btn
          :icon="formData.heading_only === '1' ? 'view_headline' : 'view_list'"
          :color="formData.heading_only === '1' ? 'primary' : 'grey-6'"
          flat
          round
          dense
          @click="toggleHeadingOnly"
        >
          <q-tooltip>
            {{
              formData.heading_only === "1"
                ? t("Headings Only")
                : t("Full Report")
            }}
          </q-tooltip>
        </q-btn>

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
          <div class="section-header">
            <q-icon name="account_balance_wallet" class="q-mr-sm" />
            {{ t("Assets") }}
          </div>
          <q-separator />
          <q-list bordered separator>
            <!-- Iterate over asset accounts -->
            <template v-for="(account, index) in assetAccounts" :key="index">
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
                v-if="shouldShowSeparator(account, index, assetAccounts)"
              />
            </template>
          </q-list>
          <!-- Assets Subtotal Row -->
          <q-item class="q-pa-sm items-center total-row">
            <q-item-section v-if="formData.l_accno" avatar>
              <q-icon name="calculate" color="primary" />
            </q-item-section>
            <q-item-section class="text-bold">{{
              t("Total Assets")
            }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(
                  sumAllAccounts(completeAssetAccounts, period.label)
                )
              }}
            </q-item-section>
          </q-item>
        </div>

        <!-- Liabilities Section -->
        <div class="q-mt-sm">
          <div class="section-header">
            <q-icon name="account_balance" class="q-mr-sm" />
            {{ t("Liabilities") }}
          </div>
          <q-separator />
          <q-list bordered separator>
            <!-- Iterate over liability accounts -->
            <template
              v-for="(account, index) in liabilityAccounts"
              :key="index"
            >
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
                v-if="shouldShowSeparator(account, index, liabilityAccounts)"
              />
            </template>
          </q-list>
          <!-- Liabilities Subtotal Row -->
          <q-item class="q-pa-sm items-center total-row">
            <q-item-section v-if="formData.l_accno" avatar>
              <q-icon name="calculate" color="primary" />
            </q-item-section>
            <q-item-section class="text-bold">{{
              t("Total Liabilities")
            }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(
                  sumAllAccounts(completeLiabilityAccounts, period.label)
                )
              }}
            </q-item-section>
          </q-item>
        </div>

        <!-- Equity Section -->
        <div class="q-mt-md">
          <div class="section-header">
            <q-icon name="trending_up" class="q-mr-sm" />
            {{ t("Equity") }}
          </div>
          <q-separator />
          <q-list bordered separator>
            <!-- Iterate over equity accounts -->
            <template v-for="(account, index) in equityAccounts" :key="index">
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
                v-if="shouldShowSeparator(account, index, equityAccounts)"
              />
            </template>
          </q-list>
          <!-- Current Earnings Row -->
          <q-item class="q-pa-sm items-center total-row">
            <q-item-section v-if="formData.l_accno" avatar>
              <q-icon name="calculate" color="primary" />
            </q-item-section>
            <q-item-section class="text-bold">{{
              t("Current Earnings")
            }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(
                  sumAllAccounts(completeAssetAccounts, period.label) -
                    sumAllAccounts(completeLiabilityAccounts, period.label) -
                    sumAllAccounts(completeEquityAccounts, period.label)
                )
              }}
            </q-item-section>
          </q-item>
          <!-- Updated Total Equity Row -->
          <q-item class="q-pa-sm items-center total-row">
            <q-item-section v-if="formData.l_accno" avatar>
              <q-icon name="calculate" color="primary" />
            </q-item-section>
            <q-item-section class="text-bold">{{
              t("Total Equity")
            }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(
                  sumAllAccounts(completeAssetAccounts, period.label) -
                    sumAllAccounts(completeLiabilityAccounts, period.label)
                )
              }}
            </q-item-section>
          </q-item>
          <!-- New: Total Liabilities + Equity Row -->
          <q-item class="q-pa-sm items-center net-income-row">
            <q-item-section v-if="formData.l_accno" avatar>
              <q-icon name="account_balance" color="primary" size="sm" />
            </q-item-section>
            <q-item-section class="text-bold">{{
              t("Total Liabilities + Equity")
            }}</q-item-section>
            <q-item-section
              v-for="period in results.periods"
              :key="period.label"
              class="col text-right text-bold"
            >
              {{
                formatAmountCustom(
                  sumAllAccounts(completeLiabilityAccounts, period.label) +
                    (sumAllAccounts(completeAssetAccounts, period.label) -
                      sumAllAccounts(completeLiabilityAccounts, period.label))
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
updateTitle(t("Balance Sheet"));
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
  heading_only: "0",
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
const collapsedHeadings = ref(new Set()); // Track collapsed heading account numbers

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
 * @param {string} type - 'A' for assets, 'L' for liabilities, 'Q' for equity
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
 * @param {string} type - 'A' for assets, 'L' for liabilities, 'Q' for equity
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

/* ============================================================================
   Computed properties for each account group.
============================================================================ */
const assetAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildAccountHierarchy(rawAccounts, accountsInfo, "A");
});

const liabilityAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildAccountHierarchy(rawAccounts, accountsInfo, "L");
});

const equityAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildAccountHierarchy(rawAccounts, accountsInfo, "Q");
});

// Complete account hierarchies for total calculations (includes all accounts regardless of collapsed state)
const completeAssetAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildCompleteAccountHierarchy(rawAccounts, accountsInfo, "A");
});

const completeLiabilityAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildCompleteAccountHierarchy(rawAccounts, accountsInfo, "L");
});

const completeEquityAccounts = computed(() => {
  const rawAccounts = results.value[""] || {};
  const accountsInfo = results.value.accounts || {};
  return buildCompleteAccountHierarchy(rawAccounts, accountsInfo, "Q");
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
  // Get all heading account numbers from all account types
  const allAccounts = [
    ...assetAccounts.value,
    ...liabilityAccounts.value,
    ...equityAccounts.value,
  ];
  const headingAccounts = allAccounts.filter(
    (account) => account.charttype === "H"
  );
  headingAccounts.forEach((account) => {
    collapsedHeadings.value.add(account.accno);
  });
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
    params.l_accno = formData.value.l_accno ? 1 : 0;

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
    params.l_accno = formData.value.l_accno ? 1 : 0;

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

const toggleHeadingOnly = () => {
  formData.value.heading_only = formData.value.heading_only === "1" ? "0" : "1";
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
    const total = sumAllAccounts(completeAssetAccounts.value, period.label);
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
    const total = sumAllAccounts(completeLiabilityAccounts.value, period.label);
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
      sumAllAccounts(completeAssetAccounts.value, period.label) -
      sumAllAccounts(completeLiabilityAccounts.value, period.label) -
      sumAllAccounts(completeEquityAccounts.value, period.label);
    currentEarningsRow.push(roundAmountCustom(currentEarnings));
  });
  exportData.push(currentEarningsRow);

  let equityTotalRow = ["Total Equity"];
  periods.forEach((period) => {
    const totalEquity =
      sumAllAccounts(completeAssetAccounts.value, period.label) -
      sumAllAccounts(completeLiabilityAccounts.value, period.label);
    equityTotalRow.push(roundAmountCustom(totalEquity));
  });
  exportData.push(equityTotalRow);

  // New row: Total Liabilities + Equity
  let liabEquityTotalRow = ["Total Liabilities + Equity"];
  periods.forEach((period) => {
    const totalLiabEquity =
      sumAllAccounts(completeLiabilityAccounts.value, period.label) +
      (sumAllAccounts(completeAssetAccounts.value, period.label) -
        sumAllAccounts(completeLiabilityAccounts.value, period.label));
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
  border-top: 2px solid #1976d2;
  font-weight: 600;
  color: #000 !important;
}

.net-income-row {
  background-color: #e3f2fd;
  border-top: 3px solid #1976d2;
  font-weight: 700;
  font-size: 1.1em;
  color: #000 !important;
}

/* Heading row styling */
.heading-row {
  user-select: none;
}

.cursor-pointer {
  cursor: pointer;
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
