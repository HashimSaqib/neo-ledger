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
              v-model="filters.createdfrom"
              type="date"
              class="lightbg"
              :label="t('Created From')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.createdto"
              type="date"
              class="lightbg"
              :label="t('Created To')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.updatedfrom"
              type="date"
              class="lightbg"
              :label="t('Updated From')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.updatedto"
              type="date"
              class="lightbg"
              :label="t('Updated To')"
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
              v-model="filters.invnumber"
              class="lightbg"
              :label="t('Invoice Number')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <s-select
              v-if="customerOptions.length"
              v-model="filters.customer"
              :options="customerOptions"
              option-label="label"
              search="label"
              option-value="id"
              :label="t('Customer')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              clearable
            />
            <text-input
              v-if="lineData"
              v-model="filters.partnumber"
              class="lightbg"
              :label="t('Part Number')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
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
          <s-btn type="clear" :disable="searchLoading" @click="resetFilters" />
          <s-btn type="search" :loading="searchLoading" @click="runSearch" />
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
          <div class="full-width row flex-center q-gutter-sm q-pa-lg mutedtext">
            <q-icon name="inbox" size="2em" color="primary" />
            <span>{{ t("No results. Adjust filters and search.") }}</span>
          </div>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              :class="wrapTextColumnClass(col.name)"
            >
              <span v-if="col.name === 'invnumber'" class="wrapped-description">
                <router-link
                  v-if="getDocumentPath(props.row)"
                  :to="getDocumentPath(props.row)"
                  class="text-primary"
                >
                  {{ props.row.invnumber }}
                </router-link>
                <template v-else>{{ props.row.invnumber }}</template>
              </span>
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
  name: "BatchUpdateAr",
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
} = useBatchUpdatePage("ar");
</script>
