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
          <div class="flex-container q-mt-md container batch-gl-filters">
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
            <s-select
              v-if="departmentOptions.length"
              v-model="filters.department"
              :options="departmentOptions"
              option-label="description"
              search="description"
              option-value="id"
              :label="t('Department')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              clearable
            />
            <s-select
              v-if="lineData && projectOptions.length"
              v-model="filters.project"
              :options="projectOptions"
              option-label="description"
              search="description"
              option-value="id"
              :label="t('Project')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              clearable
            />
            <text-input
              v-if="lineData"
              v-model="filters.source"
              class="lightbg"
              :label="t('Source')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-if="lineData"
              v-model="filters.memo"
              class="lightbg"
              :label="t('Memo')"
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

    <div v-if="!linksLoading" class="batch-update-toolbar hide-print">
      <div class="batch-update-toolbar__stats">
        <div class="batch-update-toolbar__stat">
          <span class="batch-update-toolbar__stat-label">{{
            lineData ? t("Total lines") : t("Total transactions")
          }}</span>
          <span class="batch-update-toolbar__stat-value">{{
            batchTotalRowCount
          }}</span>
        </div>
        <div class="batch-update-toolbar__stat">
          <span class="batch-update-toolbar__stat-label">{{
            lineData ? t("Lines selected") : t("Transactions selected")
          }}</span>
          <span
            class="batch-update-toolbar__stat-value"
            :class="{
              'batch-update-toolbar__stat-value--accent':
                batchSelectedCount > 0,
            }"
            >{{ batchSelectedCount }}</span
          >
        </div>
      </div>
      <div class="batch-update-toolbar__actions">
        <s-btn
          type="edit"
          :label="
            lineData ? t('Batch update lines') : t('Batch update transactions')
          "
          :disable="glBatchSelectedRows.length === 0"
          @click="openGlBatchUpdateDialog"
        />
      </div>
    </div>

    <q-dialog
      v-model="glBatchUpdateDialogOpen"
      class="batch-gl-update-dialog"
      allow-focus-outside
      transition-show="scale"
      transition-hide="scale"
      :no-esc-dismiss="glBatchUpdateLoading"
      :no-backdrop-dismiss="glBatchUpdateLoading"
      @hide="onGlBatchUpdateDialogHide"
    >
      <q-card flat bordered class="lightbg">
        <q-card-section class="q-pb-none">
          <div class="row items-start no-wrap full-width">
            <div class="col min-width-0">
              <div class="text-h6 text-weight-bold maintext">
                {{
                  lineData
                    ? t("Batch update lines")
                    : t("Batch update transactions")
                }}
              </div>
              <div class="text-body2 mutedtext q-mt-xs">
                {{
                  t(
                    "Only values you enter below are sent. Leave a field blank to leave that value unchanged.",
                  )
                }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                round
                dense
                icon="close"
                :disable="glBatchUpdateLoading"
                @click="glBatchUpdateDialogOpen = false"
              />
            </div>
          </div>
          <q-separator class="q-mt-md" />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div
            class="batch-gl-select-summary rounded-borders q-pa-md q-mb-md row items-center no-wrap full-width"
            :class="
              glBatchSelectedRows.length
                ? 'batch-gl-select-summary--active'
                : 'batch-gl-select-summary--empty'
            "
          >
            <q-icon
              :name="
                glBatchSelectedRows.length
                  ? 'playlist_add_check'
                  : 'info_outline'
              "
              size="20px"
              class="q-mr-sm"
              :color="glBatchSelectedRows.length ? 'primary' : 'grey-7'"
            />
            <div class="col text-body2 maintext min-width-0">
              <template v-if="glBatchSelectedRows.length">
                <span class="text-weight-medium">
                  {{ glBatchSelectedRows.length }}
                  {{
                    lineData ? t("lines selected") : t("transactions selected")
                  }}
                </span>
              </template>
              <template v-else>
                {{
                  lineData
                    ? t(
                        "No lines selected. Close this dialog, tick rows in the table, then open batch update again.",
                      )
                    : t(
                        "No transactions selected. Close this dialog, tick rows in the table, then open batch update again.",
                      )
                }}
              </template>
            </div>
          </div>

          <div
            class="flex-container batch-filters-wrap batch-gl-dialog-fields full-width"
          >
            <!-- Transaction mode -->
            <template v-if="!lineData">
              <text-input
                v-model="glBatchUpdatePatch.transdate"
                type="date"
                class="lightbg"
                :label="t('Transaction date')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
              />
              <s-select
                v-if="
                  departmentOptions.length &&
                  !glBatchUpdatePatch.clearDepartment
                "
                v-model="glBatchUpdatePatch.department"
                :options="departmentOptions"
                option-label="description"
                search="description"
                option-value="id"
                :label="t('Department')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
              />
              <q-checkbox
                dense
                color="primary"
                class="maintext"
                :model-value="glBatchUpdatePatch.clearDepartment"
                :label="t('Clear department')"
                @update:model-value="setGlBatchClearDepartment"
              />
              <s-select
                v-if="projectOptions.length && !glBatchUpdatePatch.clearProject"
                v-model="glBatchUpdatePatch.project"
                :options="projectOptions"
                option-label="description"
                search="description"
                option-value="id"
                :label="t('Project (all lines)')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
              />
              <q-checkbox
                dense
                color="primary"
                class="maintext"
                :model-value="glBatchUpdatePatch.clearProject"
                :label="t('Clear project (all lines)')"
                @update:model-value="setGlBatchClearProject"
              />
            </template>

            <!-- Line mode -->
            <template v-else>
              <text-input
                v-model="glBatchLineUpdatePatch.transdate"
                type="date"
                class="lightbg"
                :label="t('Transaction date')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
              />
              <s-select
                v-if="
                  departmentOptions.length &&
                  !glBatchLineUpdatePatch.clearDepartment
                "
                v-model="glBatchLineUpdatePatch.department"
                :options="departmentOptions"
                option-label="description"
                search="description"
                option-value="id"
                :label="t('Department')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
              />
              <q-checkbox
                dense
                color="primary"
                class="maintext"
                :model-value="glBatchLineUpdatePatch.clearDepartment"
                :label="t('Clear department')"
                @update:model-value="setGlBatchLineClearDepartment"
              />
              <s-select
                v-if="
                  projectOptions.length &&
                  !glBatchLineUpdatePatch.clearLineProject
                "
                v-model="glBatchLineUpdatePatch.project"
                :options="projectOptions"
                option-label="description"
                search="description"
                option-value="id"
                :label="t('Project (this line)')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
              />
              <q-checkbox
                dense
                color="primary"
                class="maintext"
                :model-value="glBatchLineUpdatePatch.clearLineProject"
                :label="t('Clear project (this line)')"
                @update:model-value="setGlBatchLineClearProject"
              />
              <s-select
                v-if="glAccountOptions.length"
                v-model="glBatchLineUpdatePatch.account"
                :options="glAccountOptions"
                option-label="label"
                option-value="accno"
                :label="t('Account (this line)')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
                account
              />
            </template>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-md q-py-sm q-gutter-sm">
          <s-btn
            type="clear"
            :label="t('Cancel')"
            :disable="glBatchUpdateLoading"
            @click="glBatchUpdateDialogOpen = false"
          />
          <s-btn
            type="primary"
            :label="t('Apply update')"
            :loading="glBatchUpdateLoading"
            :disable="searchLoading || glBatchSelectedRows.length === 0"
            @click="submitGlBatchUpdate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div v-if="!linksLoading" class="document-list-table lightbg q-py-sm">
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
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th auto-width class="batch-gl-select-th">
              <q-checkbox
                dense
                color="primary"
                :model-value="glBatchSelectAll"
                @update:model-value="toggleGlBatchSelectAll"
              />
            </q-th>
            <q-th
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              :class="getBatchCellClass(col)"
            >
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>
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
          <q-tr
            v-if="glLineSplitView && props.row.isGroupHeader"
            class="group-header"
          >
            <q-td auto-width class="batch-gl-select-td" />
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
            <q-td auto-width class="batch-gl-select-td">
              <q-checkbox
                dense
                color="primary"
                :model-value="isGlBatchRowSelected(props.row)"
                @update:model-value="
                  (v) => toggleGlBatchRowSelected(props.row, v)
                "
              />
            </q-td>
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              :class="wrapTextColumnClass(col.name)"
            >
              <span v-if="col.name === 'reference'" class="wrapped-description">
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
              <span v-else-if="col.name === 'department'">
                <a
                  v-if="
                    cellRawValue(col, props.row) != null &&
                    String(cellRawValue(col, props.row)).trim() !== ''
                  "
                  href="#"
                  class="text-primary"
                  @click.prevent="filterByDepartmentFromRow(props.row)"
                >
                  {{ cellRawValue(col, props.row) }}
                </a>
                <template v-else>—</template>
              </span>
              <span v-else-if="col.name === 'project' && lineData">
                <a
                  v-if="
                    cellRawValue(col, props.row) != null &&
                    String(cellRawValue(col, props.row)).trim() !== ''
                  "
                  href="#"
                  class="text-primary"
                  @click.prevent="filterByProjectFromRow(props.row)"
                >
                  {{ cellRawValue(col, props.row) }}
                </a>
                <template v-else>—</template>
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
  batchTotalRowCount,
  batchSelectedCount,
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
  filterByProjectFromRow,
  filterByDepartmentFromRow,
  departmentOptions,
  projectOptions,
  glAccountOptions,
  glBatchSelectedRows,
  glBatchUpdatePatch,
  glBatchLineUpdatePatch,
  glBatchUpdateLoading,
  glBatchSelectAll,
  isGlBatchRowSelected,
  toggleGlBatchRowSelected,
  toggleGlBatchSelectAll,
  setGlBatchClearDepartment,
  setGlBatchClearProject,
  setGlBatchLineClearDepartment,
  setGlBatchLineClearProject,
  submitGlBatchUpdate,
  glBatchUpdateDialogOpen,
  openGlBatchUpdateDialog,
  onGlBatchUpdateDialogHide,
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

.batch-gl-filters > *:not(.batch-filter-line-data) {
  flex: 1 1 200px;
  min-width: 0;
  max-width: 100%;
}

.batch-gl-select-th,
.batch-gl-select-td {
  width: 40px;
  padding-left: 8px;
  padding-right: 4px;
}

.batch-gl-update-dialog :deep(.q-dialog__inner) {
  width: min(60%, calc(100vw - 32px));
}

.batch-gl-update-dialog :deep(.q-dialog__inner > *) {
  width: 100%;
}

.min-width-0 {
  min-width: 0;
}

.batch-gl-select-summary {
  border: 1px solid var(--q-border);
}

.batch-gl-select-summary--active {
  border-color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 8%, transparent);
}

.batch-gl-select-summary--empty {
  border-style: dashed;
}

.batch-gl-dialog-fields {
  gap: 0.75rem 1rem;
}

.batch-gl-dialog-fields > *:not(.q-checkbox) {
  flex: 1 1 200px;
  min-width: 0;
  max-width: 100%;
}

.batch-gl-dialog-fields > .q-checkbox {
  flex: 1 1 100%;
}
</style>
