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
              v-if="vendorOptions.length"
              v-model="filters.vendor"
              :options="vendorOptions"
              option-label="label"
              search="label"
              option-value="id"
              :label="t('Vendor')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              clearable
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
              v-if="lineData"
              v-model="filters.lineItemAccount"
              :options="expenseAccountOptions"
              option-label="label"
              option-value="accno"
              :label="t('Expense line account')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              clearable
              account
            />
            <s-select
              v-if="lineData"
              v-model="filters.lineItemTaxAccount"
              :options="taxAccountOptions"
              option-label="label"
              option-value="accno"
              :label="t('Tax account')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
              clearable
              account
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
            <q-checkbox
              v-model="lineData"
              :label="t('Line Data')"
              color="primary"
              class="maintext batch-filter-line-data"
              dense
              @update:model-value="onLineDataToggled"
            />
            <text-input
              v-model="filters.morethanamount"
              type="number"
              step="any"
              class="lightbg"
              :label="t('Amount greater than')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.lessthanamount"
              type="number"
              step="any"
              class="lightbg"
              :label="t('Amount less than')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.equaltoamount"
              type="number"
              step="any"
              class="lightbg"
              :label="t('Amount equal to')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-if="lineData"
              v-model="filters.morethantaxamount"
              type="number"
              step="any"
              class="lightbg"
              :label="t('Tax amount greater than')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-if="lineData"
              v-model="filters.lessthantaxamount"
              type="number"
              step="any"
              class="lightbg"
              :label="t('Tax amount less than')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
          </div>

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
              v-model="filters.duedatefrom"
              type="date"
              class="lightbg"
              :label="t('Due date from')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
            />
            <text-input
              v-model="filters.duedateto"
              type="date"
              class="lightbg"
              :label="t('Due date to')"
              input-class="maintext"
              label-color="secondary"
              outlined
              dense
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

    <div
      v-if="!linksLoading"
      class="batch-update-toolbar hide-print"
    >
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
      <div class="batch-update-toolbar__actions row q-gutter-sm items-center">
        <s-btn
          v-if="!lineData"
          type="delete"
          :label="t('Batch delete')"
          :disable="apBatchSelectedRows.length === 0"
          @click="openApBatchDeleteDialog"
        />
        <s-btn
          type="edit"
          :label="
            lineData
              ? t('Batch update lines')
              : t('Batch update transactions')
          "
          :disable="apBatchSelectedRows.length === 0"
          @click="openApBatchUpdateDialog"
        />
      </div>
    </div>

    <q-dialog
      v-model="apBatchUpdateDialogOpen"
      class="batch-ap-update-dialog"
      allow-focus-outside
      transition-show="scale"
      transition-hide="scale"
      :no-esc-dismiss="apBatchUpdateLoading"
      :no-backdrop-dismiss="apBatchUpdateLoading"
      @hide="onApBatchUpdateDialogHide"
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
                :disable="apBatchUpdateLoading"
                @click="apBatchUpdateDialogOpen = false"
              />
            </div>
          </div>
          <q-separator class="q-mt-md" />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div
            class="batch-ap-select-summary rounded-borders q-pa-md q-mb-md row items-center no-wrap full-width"
            :class="
              apBatchSelectedRows.length
                ? 'batch-ap-select-summary--active'
                : 'batch-ap-select-summary--empty'
            "
          >
            <q-icon
              :name="
                apBatchSelectedRows.length
                  ? 'playlist_add_check'
                  : 'info_outline'
              "
              size="20px"
              class="q-mr-sm"
              :color="apBatchSelectedRows.length ? 'primary' : 'grey-7'"
            />
            <div class="col text-body2 maintext min-width-0">
              <template v-if="apBatchSelectedRows.length">
                <span class="text-weight-medium">
                  {{ apBatchSelectedRows.length }}
                  {{
                    lineData
                      ? t("lines selected")
                      : t("transactions selected")
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

          <div class="flex-container batch-filters-wrap batch-ap-dialog-fields full-width">
            <template v-if="!lineData">
              <text-input
                v-model="apBatchUpdatePatch.transdate"
                type="date"
                class="lightbg"
                :disable="apBatchUpdatePatch.transdateYearOnly"
                :label="t('Transaction date')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
              />
              <q-checkbox
                v-model="apBatchUpdatePatch.transdateYearOnly"
                dense
                color="primary"
                class="maintext"
                :label="
                  t('Set transaction year only (keep month and day per row)')
                "
              />
              <text-input
                v-if="apBatchUpdatePatch.transdateYearOnly"
                v-model="apBatchUpdatePatch.transdateTargetYear"
                type="number"
                class="lightbg"
                :label="t('Target year')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
              />
              <text-input
                v-model="apBatchUpdatePatch.duedate"
                type="date"
                class="lightbg"
                :label="t('Due date')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
              />
              <s-select
                v-if="vendorOptions.length"
                v-model="apBatchUpdatePatch.vendor"
                :options="vendorOptions"
                option-label="label"
                search="label"
                option-value="id"
                :label="t('Vendor')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
              />
              <s-select
                v-if="apRecordAccountOptions.length"
                v-model="apBatchUpdatePatch.recordAccount"
                :options="apRecordAccountOptions"
                option-label="label"
                option-value="accno"
                :label="t('Payable (record) account')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
                account
              />
              <s-select
                v-if="
                  departmentOptions.length &&
                  !apBatchUpdatePatch.clearDepartment
                "
                v-model="apBatchUpdatePatch.department"
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
                :model-value="apBatchUpdatePatch.clearDepartment"
                :label="t('Clear department')"
                @update:model-value="setApBatchClearDepartment"
              />
              <s-select
                v-if="projectOptions.length && !apBatchUpdatePatch.clearProject"
                v-model="apBatchUpdatePatch.project"
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
              <q-checkbox
                dense
                color="primary"
                class="maintext"
                :model-value="apBatchUpdatePatch.clearProject"
                :label="t('Clear project')"
                @update:model-value="setApBatchClearProject"
              />
            </template>
            <template v-else>
              <text-input
                v-model="apBatchLineUpdatePatch.transdate"
                type="date"
                class="lightbg"
                :disable="apBatchLineUpdatePatch.transdateYearOnly"
                :label="t('Transaction date')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
              />
              <q-checkbox
                v-model="apBatchLineUpdatePatch.transdateYearOnly"
                dense
                color="primary"
                class="maintext"
                :label="
                  t('Set transaction year only (keep month and day per row)')
                "
              />
              <text-input
                v-if="apBatchLineUpdatePatch.transdateYearOnly"
                v-model="apBatchLineUpdatePatch.transdateTargetYear"
                type="number"
                class="lightbg"
                :label="t('Target year')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
              />
              <text-input
                v-model="apBatchLineUpdatePatch.duedate"
                type="date"
                class="lightbg"
                :label="t('Due date')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
              />
              <s-select
                v-if="vendorOptions.length"
                v-model="apBatchLineUpdatePatch.vendor"
                :options="vendorOptions"
                option-label="label"
                search="label"
                option-value="id"
                :label="t('Vendor')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
              />
              <s-select
                v-if="
                  departmentOptions.length &&
                  !apBatchLineUpdatePatch.clearDepartment
                "
                v-model="apBatchLineUpdatePatch.department"
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
                :model-value="apBatchLineUpdatePatch.clearDepartment"
                :label="t('Clear department')"
                @update:model-value="setApBatchLineClearDepartment"
              />
              <s-select
                v-if="apRecordAccountOptions.length"
                v-model="apBatchLineUpdatePatch.recordAccount"
                :options="apRecordAccountOptions"
                option-label="label"
                option-value="accno"
                :label="t('Payable (record) account')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
                account
              />
              <s-select
                v-if="expenseAccountOptions.length"
                v-model="apBatchLineUpdatePatch.expenseAccount"
                :options="expenseAccountOptions"
                option-label="label"
                option-value="accno"
                :label="t('Expense account (line)')"
                input-class="maintext"
                label-color="secondary"
                outlined
                dense
                clearable
                account
              />
              <s-select
                v-if="
                  projectOptions.length && !apBatchLineUpdatePatch.clearLineProject
                "
                v-model="apBatchLineUpdatePatch.project"
                :options="projectOptions"
                option-label="description"
                search="description"
                option-value="id"
                :label="t('Project (line)')"
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
                :model-value="apBatchLineUpdatePatch.clearLineProject"
                :label="t('Clear project (line)')"
                @update:model-value="setApBatchClearLineProject"
              />
            </template>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-md q-py-sm q-gutter-sm">
          <s-btn
            type="clear"
            :label="t('Cancel')"
            :disable="apBatchUpdateLoading"
            @click="apBatchUpdateDialogOpen = false"
          />
          <s-btn
            type="primary"
            :label="t('Apply update')"
            :loading="apBatchUpdateLoading"
            :disable="searchLoading || apBatchSelectedRows.length === 0"
            @click="submitApBatchUpdate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="apBatchDeleteDialogOpen"
      class="batch-ap-delete-dialog"
      allow-focus-outside
      transition-show="scale"
      transition-hide="scale"
      :no-esc-dismiss="apBatchDeleteLoading"
      :no-backdrop-dismiss="apBatchDeleteLoading"
      @hide="onApBatchDeleteDialogHide"
    >
      <q-card flat bordered class="lightbg">
        <q-card-section class="q-pb-none">
          <div class="row items-start no-wrap full-width">
            <div class="col min-width-0">
              <div class="text-h6 text-weight-bold maintext">
                {{ t("Delete transactions?") }}
              </div>
              <div class="text-body2 mutedtext q-mt-xs">
                {{
                  t(
                    "This permanently removes the selected AP transactions. This cannot be undone.",
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
                :disable="apBatchDeleteLoading"
                @click="apBatchDeleteDialogOpen = false"
              />
            </div>
          </div>
          <q-separator class="q-mt-md" />
        </q-card-section>

        <q-card-section class="q-pt-md q-pb-sm">
          <div
            class="batch-delete-confirm-banner rounded-borders q-pa-md row items-center no-wrap full-width"
            :class="
              apBatchDeleteTransactionCount > 0
                ? 'batch-delete-confirm-banner--active'
                : 'batch-delete-confirm-banner--empty'
            "
          >
            <q-icon
              name="warning_amber"
              size="20px"
              class="q-mr-sm"
              color="warning"
            />
            <div class="col text-body2 maintext min-width-0">
              <span class="text-weight-medium">
                {{ apBatchDeleteTransactionCount }}
                {{ t("transaction(s) will be deleted.") }}
              </span>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-px-md q-py-sm q-gutter-sm">
          <s-btn
            type="clear"
            :label="t('Cancel')"
            :disable="apBatchDeleteLoading"
            @click="apBatchDeleteDialogOpen = false"
          />
          <s-btn
            type="destructive"
            :label="t('Delete transactions')"
            :loading="apBatchDeleteLoading"
            :disable="searchLoading || apBatchDeleteTransactionCount === 0"
            @click="submitApBatchDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div v-if="!linksLoading" class="document-list-table lightbg q-pa-sm">
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
            <q-th auto-width class="batch-ap-select-th">
              <q-checkbox
                dense
                color="primary"
                :model-value="apBatchSelectAll"
                @update:model-value="toggleApBatchSelectAll"
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
          <div
            class="full-width row flex-center q-gutter-sm q-pa-lg mutedtext"
          >
            <q-icon name="inbox" size="2em" color="primary" />
            <span>{{ t("No results. Adjust filters and search.") }}</span>
          </div>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td auto-width class="batch-ap-select-td">
              <q-checkbox
                dense
                color="primary"
                :model-value="isApBatchRowSelected(props.row)"
                @update:model-value="
                  (v) => toggleApBatchRowSelected(props.row, v)
                "
              />
            </q-td>
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              :class="wrapTextColumnClass(col.name)"
            >
              <span
                v-if="col.name === 'invnumber'"
                class="wrapped-description"
              >
                <a
                  v-if="getDocumentUrl(props.row)"
                  :href="getDocumentUrl(props.row)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary"
                >
                  {{ props.row.invnumber }}
                </a>
                <template v-else>{{ props.row.invnumber }}</template>
              </span>
              <span
                v-else-if="
                  col.name === 'vendor' || col.name === 'vendor_name'
                "
              >
                <a
                  v-if="
                    cellRawValue(col, props.row) != null &&
                    String(cellRawValue(col, props.row)).trim() !== ''
                  "
                  href="#"
                  class="text-primary"
                  @click.prevent="filterByVendorFromRow(props.row)"
                >
                  {{ cellRawValue(col, props.row) }}
                </a>
                <template v-else>—</template>
              </span>
              <span v-else-if="col.name === 'duedate'">
                <span
                  v-if="cellRawValue(col, props.row)"
                  :class="{ 'text-negative': isApDueOverdue(props.row) }"
                >{{ formatBatchTableDate(cellRawValue(col, props.row)) }}</span>
                <template v-else>—</template>
              </span>
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
              <span
                v-else-if="(col.name === 'record_accno' || col.name === 'recordaccount') && lineData"
              >
                <a
                  v-if="formatAccountListValue(props.row.record_accno ?? props.row.recordaccount) !== ''"
                  href="#"
                  class="text-primary"
                  @click.prevent="
                    filterByRecordAccountFromRow(props.row.record_accno ?? props.row.recordaccount)
                  "
                >
                  {{ formatAccountListValue(props.row.record_accno ?? props.row.recordaccount) }}
                </a>
                <template v-else>—</template>
              </span>
              <span v-else-if="(col.name === 'expense_accno' || col.name === 'item_account') && lineData">
                <a
                  v-if="formatAccountListValue(props.row.expense_accno ?? props.row.item_account) !== ''"
                  href="#"
                  class="text-primary"
                  @click.prevent="
                    filterByLineItemAccountFromRow(props.row.expense_accno ?? props.row.item_account)
                  "
                >
                  {{ formatAccountListValue(props.row.expense_accno ?? props.row.item_account) }}
                </a>
                <template v-else>—</template>
              </span>
              <span v-else-if="col.name === 'tax_account' && lineData">
                <a
                  v-if="formatAccountListValue(props.row.tax_account) !== ''"
                  href="#"
                  class="text-primary"
                  @click.prevent="
                    filterByTaxAccountFromRow(props.row.tax_account)
                  "
                >
                  {{ formatAccountListValue(props.row.tax_account) }}
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
                formatBatchTableDate(cellRawValue(col, props.row))
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
  name: "BatchUpdateAp",
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
  getDocumentUrl,
  cellRawValue,
  formatBatchTableDate,
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
  departmentOptions,
  projectOptions,
  expenseAccountOptions,
  taxAccountOptions,
  filterByVendorFromRow,
  filterByRecordAccountFromRow,
  filterByLineItemAccountFromRow,
  filterByTaxAccountFromRow,
  filterByProjectFromRow,
  filterByDepartmentFromRow,
  isApDueOverdue,
  formatAccountListValue,
  apBatchUpdatePatch,
  apBatchLineUpdatePatch,
  apRecordAccountOptions,
  apBatchUpdateLoading,
  apBatchSelectAll,
  isApBatchRowSelected,
  toggleApBatchRowSelected,
  toggleApBatchSelectAll,
  setApBatchClearDepartment,
  setApBatchClearProject,
  setApBatchClearLineProject,
  setApBatchLineClearDepartment,
  submitApBatchUpdate,
  apBatchUpdateDialogOpen,
  openApBatchUpdateDialog,
  onApBatchUpdateDialogHide,
  apBatchSelectedRows,
  apBatchDeleteDialogOpen,
  apBatchDeleteLoading,
  openApBatchDeleteDialog,
  onApBatchDeleteDialogHide,
  submitApBatchDelete,
  apBatchDeleteTransactionCount,
} = useBatchUpdatePage("ap");
</script>

<style scoped>
.batch-ap-line-dates {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.batch-ap-line-dates__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.5rem;
}

.batch-ap-line-dates__label {
  flex: 0 0 auto;
  min-width: 3.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.batch-ap-select-th,
.batch-ap-select-td {
  width: 40px;
  padding-left: 8px;
  padding-right: 4px;
}

.batch-ap-update-dialog :deep(.q-dialog__inner) {
  width: min(60%, calc(100vw - 32px));
}

.batch-ap-delete-dialog :deep(.q-dialog__inner) {
  width: min(440px, calc(100vw - 32px));
}

.batch-ap-delete-dialog :deep(.q-dialog__inner > *) {
  width: 100%;
}

.batch-ap-update-dialog :deep(.q-dialog__inner > *) {
  width: 100%;
}

.min-width-0 {
  min-width: 0;
}

.batch-ap-select-summary {
  border: 1px solid var(--q-border);
}

.batch-ap-select-summary--active {
  border-color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 8%, transparent);
}

.batch-ap-select-summary--empty {
  border-style: dashed;
}

.batch-ap-dialog-fields {
  gap: 0.75rem 1rem;
}

.batch-ap-dialog-fields > *:not(.q-checkbox) {
  flex: 1 1 200px;
  min-width: 0;
  max-width: 100%;
}

.batch-ap-dialog-fields > .q-checkbox {
  flex: 1 1 100%;
}
</style>
