<template>
  <q-page class="batch-update-page q-pa-md q-py-sm relative-position lightbg">
    <q-banner
      v-if="linksError"
      class="q-mb-md bg-negative text-white"
      rounded
      dense
    >
      {{ linksError }}
    </q-banner>

    <q-banner
      v-if="searchError"
      class="q-mb-md bg-negative text-white"
      rounded
      dense
    >
      {{ searchError }}
    </q-banner>

    <q-form
      @submit.prevent="runSearch"
      class="q-px-sm q-py-sm container hide-print"
    >
      <q-expansion-item
        v-model="filtersOpen"
        :label="t('Filters')"
        header-class="container-bg"
        expand-icon-class="maintext"
      >
        <div v-if="searchLoading" class="q-mt-xs q-py-xs text-center">
          <q-spinner-dots color="primary" size="30px" />
        </div>

        <div class="flex-container batch-filters-wrap">
          <div class="flex-container q-mt-md container">
            <text-input
              v-model="filters.datefrom"
              type="date"
              class="lightbg"
              :label="t('Date From')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.dateto"
              type="date"
              class="lightbg"
              :label="t('Date To')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.description"
              class="lightbg"
              :label="t('Description')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.reference"
              class="lightbg"
              :label="t('Reference')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <s-select
              v-if="showAccountFilter"
              v-model="filters.account"
              :options="accountFilterOptions"
              option-label="label"
              option-value="accno"
              :label="t('Account')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              clearable
              account
            />
            <q-checkbox
              v-model="lineData"
              :label="t('Line Data')"
              color="primary"
              class="maintext batch-filter-line-data"
              dense
              @update:model-value="onLineDataToggled"
            />
          </div>
        </div>

        <div class="row q-mt-sm q-gutter-x-sm justify-end">
          <s-btn
            type="clear"
            :disable="searchLoading"
            @click="resetFilters"
          />
          <s-btn
            type="search"
            :loading="searchLoading"
            @click="runSearch"
          />
        </div>
      </q-expansion-item>
    </q-form>

    <div v-if="linksLoading" class="row justify-center q-my-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-else class="document-list-table lightbg q-pa-sm">
      <q-table
        :key="batchTableKey"
        flat
        bordered
        dense
        hide-bottom
        hide-pagination
        class="batch-results-qtable"
        virtual-scroll
        :virtual-scroll-slice-size="30"
        :virtual-scroll-item-size="48"
        :rows-per-page-options="[0]"
        :rows="tableRows"
        :columns="columns"
        :row-key="tableRowKey"
        :loading="searchLoading"
        separator="horizontal"
      >
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>
        <template v-slot:no-data>
          <div
            class="full-width row flex-center q-gutter-sm q-pa-lg mutedtext"
          >
            <q-icon name="inbox" size="2em" color="primary" />
            <span>{{ t("No results. Adjust filters and search.") }}</span>
          </div>
        </template>
        <template v-slot:body="props">
          <q-tr
            v-if="glLineSplitView && props.row.isGroupHeader"
            class="group-header"
          >
            <q-td
              v-for="(col, colIndex) in columns"
              :key="col.name"
              :class="getBatchCellClass(col)"
            >
              <router-link
                v-if="colIndex === 0"
                to="#"
                class="text-primary"
                @click.prevent="filterByAccno(props.row.accno)"
              >
                <strong>{{ props.row.groupLabel }}</strong>
              </router-link>
            </q-td>
          </q-tr>
          <q-tr v-else :props="props">
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              :class="wrapTextColumnClass(col.name)"
            >
              <span
                v-if="col.name === 'reference'"
                class="wrapped-description"
              >
                <router-link
                  v-if="getDocumentPath(props.row)"
                  :to="getDocumentPath(props.row)"
                  class="text-primary"
                >
                  {{ props.row.reference }}
                </router-link>
                <template v-else>{{ props.row.reference }}</template>
              </span>
              <span v-else-if="col.name === 'posting_label'">
                <span
                  v-if="glLinePostingKind(props.row) === 'debit'"
                  class="posting-badge posting-badge--debit"
                >
                  {{ t("Debit") }}
                </span>
                <span
                  v-else-if="glLinePostingKind(props.row) === 'credit'"
                  class="posting-badge posting-badge--credit"
                >
                  {{ t("Credit") }}
                </span>
              </span>
              <span v-else-if="col.name === 'line_amount'">{{
                formatAmount(glLineAmountValue(props.row))
              }}</span>
              <span v-else-if="isDateColumn(col.name)">{{
                formatDate(cellRawValue(col, props.row))
              }}</span>
              <span v-else-if="isAmountColumn(col.name)">{{
                formatAmount(cellRawValue(col, props.row))
              }}</span>
              <span
                v-else-if="isWrapTextColumn(col.name)"
                class="wrapped-description"
                >{{ cellRawValue(col, props.row) }}</span
              >
              <span v-else>{{ cellRawValue(col, props.row) }}</span>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { useBatchUpdatePage } from "./useBatchUpdatePage";

defineOptions({
  name: "BatchUpdateGl",
});

const {
  t,
  filters,
  lineData,
  filtersOpen,
  searchLoading,
  searchError,
  batchSearchMeta,
  linksLoading,
  linksError,
  resetFilters,
  runSearch,
  onLineDataToggled,
  showAccountFilter,
  accountFilterOptions,
  columns,
  tableRows,
  tableRowKey,
  batchTableKey,
  glLineSplitView,
  filterByAccno,
  getDocumentPath,
  cellRawValue,
  formatDate,
  formatAmount,
  isDateColumn,
  isAmountColumn,
  isWrapTextColumn,
  wrapTextColumnClass,
  getBatchCellClass,
  glLinePostingKind,
  glLineAmountValue,
  customerOptions,
  vendorOptions,
  expenseAccountOptions,
  taxAccountOptions,
  filterByVendorFromRow,
  filterByRecordAccountFromRow,
  filterByLineItemAccountFromRow,
  filterByTaxAccountFromRow,
  isApDueOverdue,
} = useBatchUpdatePage("gl");
</script>

<style scoped>
.group-header {
  background-color: var(--q-mutedbg);
  color: var(--q-maintext);
  font-weight: 600;
}

.posting-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.posting-badge--debit {
  background: color-mix(in srgb, var(--q-negative) 16%, transparent);
  color: var(--q-negative);
}

.posting-badge--credit {
  background: color-mix(in srgb, var(--q-positive) 16%, transparent);
  color: var(--q-positive);
}
</style>
