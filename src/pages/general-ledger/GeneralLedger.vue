<template>
  <q-page class="lightbg q-pa-md relative-position">
    <div class="column container">
      <h5 class="container-title title-margin">
        {{ t("Transaction Details") }}
      </h5>

      <div class="row q-gutter-sm q-mb-sm">
        <text-input
          :label="t('Reference')"
          outlined
          dense
          v-model="formData.reference"
          :disable="lockNumber"
        />

        <s-select
          v-if="currencies"
          outlined
          v-model="formData.currency"
          :options="currencies"
          option-label="curr"
          search="curr"
          :label="t('Currency')"
          dense
          class="col-2"
          bg-color="input"
          label-color="secondary"
        />
        <text-input
          v-if="formData.currency.rn != 1"
          class="col-2"
          :label="t('Exchange Rate')"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          v-model="formData.exchangeRate"
        />
        <s-select
          v-if="departments.length > 0"
          outlined
          v-model="formData.selectedDepartment"
          :options="departments"
          class="col-2"
          option-value="description"
          search="description"
          option-label="description"
          :label="t('Department')"
          dense
          bg-color="input"
          label-color="secondary"
          clearable
          autogrow
          hide-bottom-space
        />

        <date-input
          v-model="formData.transdate"
          :label="t('Date')"
          class="col-2"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          type="date"
        />
      </div>

      <!-- Offset Account Section -->
      <div class="row q-gutter-sm">
        <s-select
          outlined
          v-model="formData.offsetAccount"
          :options="openAccounts"
          :label="t('Offset Account')"
          dense
          class="col-3"
          popup-content-class="mainbg maintext"
          bg-color="input"
          label-color="secondary"
          search="label"
          option-label="label"
          account
          clearable
          @update:model-value="handleOffsetAccountChange"
        />
        <!-- Offset Tax Account (when offset account is selected) -->
        <s-select
          v-if="formData.offsetAccount && lineTax"
          outlined
          v-model="formData.offsetTaxAccount"
          :options="filteredTaxAccounts"
          option-label="label"
          :label="t('Offset Tax Account')"
          dense
          class="col-3"
          popup-content-class="mainbg maintext"
          bg-color="input"
          label-color="secondary"
          search="label"
          clearable
          :error="offsetTaxAccountError"
          :error-message="
            offsetTaxAccountError
              ? t(
                  'Offset Tax Account is required when offset account is selected, tax is excluded, and lines have tax.',
                )
              : undefined
          "
        />
        <!-- Offset Account Totals -->
        <template v-if="formData.offsetAccount" class="q-my-none">
          <text-input
            :model-value="formatAmount(offsetDebit)"
            :label="t('Debit')"
            class="col-2"
            outlined
            dense
            readonly
          />
          <text-input
            :model-value="formatAmount(offsetCredit)"
            :label="t('Credit')"
            class="col-2"
            outlined
            dense
            readonly
          />
          <text-input
            v-if="lineTax"
            :model-value="formatAmount(offsetTaxAmount)"
            :label="t('Tax Amount')"
            class="col-2"
            outlined
            dense
            readonly
          />
        </template>
      </div>

      <div class="row q-my-sm">
        <text-input
          v-model="formData.description"
          :label="t('Description')"
          class="col-6"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          type="textarea"
          autogrow
          rows="1"
        />
      </div>
      <div class="row q-mb-sm">
        <text-input
          v-model="formData.notes"
          :label="t('Notes')"
          class="col-6"
          bg-color="input"
          label-color="secondary"
          outlined
          autogrow
          dense
          rows="1"
        />
      </div>
      <div class="row q-pb-none">
        <q-file
          :disable="connection.error ? true : false"
          :error="connection.error ? true : false"
          bg-color="input"
          label-color="secondary"
          filled
          dense
          outlined
          v-model="formData.files"
          :label="t('Reference Documents')"
          multiple
          append
          use-chips
          :error-message="connection.error"
          :hint="connection"
          class="q-pb-none"
        >
          <template v-slot:prepend>
            <q-icon name="attachment" />
          </template>
        </q-file>
      </div>
      <div class="row items-center">
        <FileList
          :files="existingFiles"
          module="gl"
          @file-deleted="handleFileDeletion"
          :report="!canPost"
        />
      </div>
    </div>

    <div class="flex column container">
      <div class="row justify-between">
        <h5 class="container-title" style="margin-bottom: 0">
          Journal Entries
        </h5>

        <s-button type="add-line" @click="addLine" />
      </div>

      <div
        v-for="(line, index) in lines"
        :key="index"
        class="column q-mb-md q-pa-md line-bg"
      >
        <div class="row q-gutter-x-xs">
          <!-- Account s-select with a ref for auto-focus -->
          <s-select
            outlined
            v-model="line.account"
            option-label="label"
            :options="filteredOpenAccounts"
            :label="t('Account')"
            dense
            class="col-3"
            popup-content-class="mainbg maintext"
            bg-color="input"
            label-color="secondary"
            search="label"
            account
            :ref="(el) => setAccountRef(el, index)"
          />
          <!-- Debit input -->
          <fn-input
            v-model="line.debit"
            :label="t('Debit')"
            class="col-2"
            bg-color="input"
            label-color="secondary"
            outlined
            dense
            @keydown.enter="handleEnter($event, index)"
            @update:model-value="
              () =>
                lineTax &&
                line.taxAccount &&
                updateTaxAmount(line.taxAccount, index)
            "
          />
          <!-- Credit input -->
          <fn-input
            v-model="line.credit"
            :label="t('Credit')"
            class="col-2"
            bg-color="input"
            label-color="secondary"
            outlined
            dense
            @keydown.enter="handleEnter($event, index)"
            @update:model-value="
              () =>
                lineTax &&
                line.taxAccount &&
                updateTaxAmount(line.taxAccount, index)
            "
          />
          <!-- Tax fields if Linetax is enabled -->
          <template v-if="lineTax">
            <s-select
              outlined
              v-model="line.taxAccount"
              :options="filteredTaxAccounts"
              option-value="accno"
              option-label="label"
              L
              :label="t('Tax Accno')"
              dense
              class="col-2"
              popup-content-class="mainbg maintext"
              bg-color="input"
              label-color="secondary"
              account
              search="label"
              @update:model-value="(val) => updateTaxAmount(val, index)"
            />
            <fn-input
              v-model="line.linetaxamount"
              :label="t('Tax Amount')"
              class="col-2"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              @keydown.enter="handleEnter($event, index)"
            />
          </template>
          <!-- Toggle Extra Fields Button -->

          <q-btn
            flat
            dense
            icon="keyboard_arrow_down"
            :class="line.showExtra ? 'rotate-180' : ''"
            @click="toggleExtra(index)"
          />
          <!-- Delete Line Button -->
          <q-btn
            color="negative"
            icon="delete"
            dense
            flat
            @click="removeLine(index)"
          />
        </div>

        <!-- Extra Fields for Source and Memo -->
        <div v-if="line.showExtra" class="row q-gutter-x-xs q-mt-md">
          <s-select
            v-if="filteredProjects.length > 0"
            outlined
            :options="filteredProjects"
            :label="t('Project')"
            option-label="description"
            option-value="description"
            v-model="line.project"
            class="col-3"
            bg-color="input"
            label-color="secondary"
            dense
            search="description"
          />
          <text-input
            v-model="line.source"
            :label="t('Source')"
            class="col-3"
            outlined
            dense
            @keydown.enter="handleEnter($event, index)"
          />
          <text-input
            v-model="line.memo"
            :label="t('Memo')"
            class="col-3"
            outlined
            dense
            @keydown.enter="handleEnter($event, index)"
          />
        </div>
      </div>

      <div class="row q-py-xs q-gutter-x-xs total-row">
        <div class="q-pa-sm col-3 text-center">
          {{ t("Total") }}
        </div>
        <div class="q-pa-sm col-2">
          {{ formatAmount(displayTotalDebit) }}
        </div>
        <div class="q-pa-sm col-2">
          {{ formatAmount(displayTotalCredit) }}
        </div>
        <div
          class="q-pa-sm col-2 text-bold"
          :class="isTotalBalanced ? 'text-positive' : 'text-negative'"
        >
          {{ formatAmount(displayTotalDebit - displayTotalCredit) }}
        </div>
      </div>

      <div class="row justify-end"></div>
    </div>

    <div class="row q-my-sm q-px-sm q-gutter-x-sm justify-between">
      <q-checkbox
        v-model="pending"
        :label="t('Pending')"
        :true-value="1"
        :false-value="0"
      />
      <div class="q-gutter-x-sm">
        <q-checkbox
          v-if="lineTax"
          v-model="formData.taxIncluded"
          :label="t('Tax Included')"
          @update:model-value="recalculateAllLineTaxAmounts"
        />
        <s-button type="delete" v-if="canDelete" @click="deleteTransaction" />
        <s-button
          type="secondary"
          :label="t('Reversal')"
          icon="swap_horiz"
          v-if="formData.id"
          @click="reverseTransaction"
        />
        <s-button
          type="secondary"
          :label="t('Reverse charge')"
          icon="account_balance"
          v-if="showReverseChargeButton"
          @click="applyReverseCharge"
        />

        <s-button type="new-number" v-if="canPostAsNew" @click="newNumber" />
        <s-button
          type="post-as-new"
          v-if="canPostAsNew"
          @click="submitTransaction(false, true)"
        />
        <s-button type="post" v-if="canPost" @click="submitTransaction(true)" />
      </div>
    </div>

    <div class="q-mt-md q-px-md">
      <h6 class="q-my-md q-pa-none text-secondary">
        {{ t("Last 5 Transactions") }}
      </h6>
      <LastTransactions type="gl" ref="lastTransactionsRef" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick, watch } from "vue";
import { api } from "src/boot/axios";
import { date, Notify } from "quasar";
import { useRoute, useRouter } from "vue-router";
import {
  formatAmount,
  roundAmount,
  confirmDelete,
  convertFilesToBase64,
} from "src/helpers/utils";
import { useI18n } from "vue-i18n";
import FileList from "src/components/FileList.vue";
import LastTransactions from "src/components/LastTransactions.vue";
const lastTransactionsRef = ref(null);
const updateTitle = inject("updateTitle");
const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const { formatDate } = date;

const getTodayDate = () => formatDate(new Date(), "YYYY-MM-DD");
const lockNumber = ref(false);

// Initial form and line data for reset
const initialFormData = {
  reference: "",
  currency: "",
  exchangeRate: "",
  description: "",
  notes: "",
  transdate: getTodayDate(),
  originaldate: null,
  id: null,
  files: [],
  offsetAccount: null,
  offsetTaxAccount: null,
  pending: 0,
  taxIncluded: false,
};

const initialLine = {
  account: "",
  debit: 0,
  credit: 0,
  source: "",
  memo: "",
  taxAccount: "",
  linetaxamount: 0,
  showExtra: false,
};

const formData = ref({ ...initialFormData });

const pending = ref(0);
const lines = ref([{ ...initialLine }, { ...initialLine }]);

const transactionTitle = computed(() =>
  formData.value.id
    ? t("Update General Ledger Transaction")
    : t("Add General Ledger Transaction"),
);
updateTitle(transactionTitle.value);

const accounts = ref([]);
const accountRefs = ref([]);
const setAccountRef = (el, index) => {
  accountRefs.value[index] = el;
};

const isEmptyLine = (line) => {
  const accountEmpty =
    !line.account ||
    (typeof line.account === "string" && line.account.trim() === "");
  return (
    accountEmpty &&
    Number(line.debit) === 0 &&
    Number(line.credit) === 0 &&
    (!line.source || line.source.trim() === "") &&
    (!line.memo || line.memo.trim() === "") &&
    (!line.taxAccount ||
      (typeof line.taxAccount === "string" && line.taxAccount.trim() === "")) &&
    Number(line.linetaxamount) === 0
  );
};

const addLine = () => {
  lines.value.push({ ...initialLine });
};

const addLineAt = (index) => {
  if (lines.value.length > 1) {
    const emptyIndex = lines.value.findIndex((line) => isEmptyLine(line));
    if (emptyIndex > -1) {
      lines.value.splice(emptyIndex, 1);
      if (emptyIndex < index) {
        index--;
      }
    }
  }
  lines.value.splice(index + 1, 0, { ...initialLine });
  nextTick(() => {
    if (accountRefs.value[index + 1] && accountRefs.value[index + 1].focus) {
      accountRefs.value[index + 1].focus();
    }
  });
};

const handleEnter = (event, index) => {
  event.preventDefault();
  addLineAt(index);
};

const removeLine = (index) => {
  lines.value.splice(index, 1);
};

const toggleExtra = (index) => {
  lines.value[index].showExtra = !lines.value[index].showExtra;
};

const totalDebit = computed(() => {
  const sumDebits = lines.value.reduce(
    (sum, line) => sum + parseFloat(line.debit || 0),
    0,
  );
  if (!formData.value.taxIncluded && lineTax.value) {
    const taxOnDebits = lines.value.reduce(
      (sum, line) =>
        sum +
        (parseFloat(line.debit || 0) > 0
          ? parseFloat(line.linetaxamount || 0)
          : 0),
      0,
    );
    return roundAmount(sumDebits + taxOnDebits);
  }
  return roundAmount(sumDebits);
});
const totalCredit = computed(() => {
  const sumCredits = lines.value.reduce(
    (sum, line) => sum + parseFloat(line.credit || 0),
    0,
  );
  if (!formData.value.taxIncluded && lineTax.value) {
    const taxOnCredits = lines.value.reduce(
      (sum, line) =>
        sum +
        (parseFloat(line.credit || 0) > 0
          ? parseFloat(line.linetaxamount || 0)
          : 0),
      0,
    );
    return roundAmount(sumCredits + taxOnCredits);
  }
  return roundAmount(sumCredits);
});

// Line tax sums (tax on debit lines vs credit lines) for offset tax calculation
const taxOnDebits = computed(() =>
  roundAmount(
    lines.value.reduce(
      (sum, line) =>
        sum +
        (parseFloat(line.debit || 0) > 0
          ? parseFloat(line.linetaxamount || 0)
          : 0),
      0,
    ),
  ),
);
const taxOnCredits = computed(() =>
  roundAmount(
    lines.value.reduce(
      (sum, line) =>
        sum +
        (parseFloat(line.credit || 0) > 0
          ? parseFloat(line.linetaxamount || 0)
          : 0),
      0,
    ),
  ),
);

// Offset tax amount: total of line tax amounts attributed to the offset side (proportional to debit/credit difference)
const offsetTaxAmount = computed(() => {
  if (!formData.value.offsetAccount || !lineTax.value) return 0;
  const debits = totalDebit.value;
  const credits = totalCredit.value;
  if (debits > credits) {
    // Offset is credit; attribute proportion of debit-side tax to offset
    if (debits <= 0) return 0;
    return roundAmount(((debits - credits) / debits) * taxOnDebits.value);
  }
  if (credits > debits) {
    // Offset is debit; attribute proportion of credit-side tax to offset
    if (credits <= 0) return 0;
    return roundAmount(((credits - debits) / credits) * taxOnCredits.value);
  }
  return 0;
});

// Offset account entry: debit and credit sides (include offset tax on debit side so transaction balances)
const offsetDebit = computed(() => {
  if (!formData.value.offsetAccount) return 0;
  return roundAmount(
    totalCredit.value +
      (formData.value.offsetTaxAccount && lineTax.value
        ? offsetTaxAmount.value
        : 0),
  );
});

const offsetCredit = computed(() => {
  if (!formData.value.offsetAccount) return 0;
  return roundAmount(totalDebit.value);
});

// Display totals: when offset selected, include offset + offset tax so the total row shows balanced
const displayTotalDebit = computed(() => {
  if (!formData.value.offsetAccount) return totalDebit.value;
  return roundAmount(totalDebit.value + offsetDebit.value);
});

const displayTotalCredit = computed(() => {
  if (!formData.value.offsetAccount) return totalCredit.value;
  const offsetTax =
    formData.value.offsetTaxAccount && lineTax.value
      ? offsetTaxAmount.value
      : 0;
  return roundAmount(totalCredit.value + offsetCredit.value + offsetTax);
});

const isTotalBalanced = computed(() => {
  if (formData.value.offsetAccount) {
    return displayTotalDebit.value === displayTotalCredit.value;
  }
  return totalDebit.value === totalCredit.value;
});

// Offset tax account is required when: offset selected, tax excluded, and any line has a tax account
const anyLineHasTaxAccount = computed(() =>
  lines.value.some((line) => {
    if (!line.taxAccount) return false;
    const accno =
      typeof line.taxAccount === "object"
        ? line.taxAccount?.accno
        : String(line.taxAccount).trim();
    return !!accno;
  }),
);

const offsetTaxAccountRequired = computed(
  () =>
    formData.value.offsetAccount &&
    !formData.value.taxIncluded &&
    lineTax.value &&
    anyLineHasTaxAccount.value,
);

const offsetTaxAccountError = computed(
  () => offsetTaxAccountRequired.value && !formData.value.offsetTaxAccount,
);

// Reverse charge: tax accnos for debit side and credit/offset side
const REVERSE_CHARGE_DEBIT_ACCNO = "11760";
const REVERSE_CHARGE_CREDIT_ACCNO = "22040";

const reverseChargeAccountsAvailable = computed(() => {
  if (!filteredTaxAccounts.value?.length) {
    console.log(
      "[Reverse charge] reverseChargeAccountsAvailable: false (no filteredTaxAccounts)",
    );
    return false;
  }
  const accnos = filteredTaxAccounts.value.map((t) => t.accno);
  console.log("[Reverse charge] reverseChargeAccountsAvailable:", accnos);
  const hasDebit = accnos.includes(REVERSE_CHARGE_DEBIT_ACCNO);
  const hasCredit = accnos.includes(REVERSE_CHARGE_CREDIT_ACCNO);
  const result = hasDebit && hasCredit;
  console.log("[Reverse charge] reverseChargeAccountsAvailable:", {
    accnos,
    requiredDebit: REVERSE_CHARGE_DEBIT_ACCNO,
    requiredCredit: REVERSE_CHARGE_CREDIT_ACCNO,
    hasDebit,
    hasCredit,
    result,
  });
  return result;
});

// Case 1: exactly two lines, one debit and one credit
const isReverseChargeTwoLines = computed(() => {
  if (lines.value.length !== 2) {
    console.log(
      "[Reverse charge] isReverseChargeTwoLines: false (line count !== 2)",
      {
        lineCount: lines.value.length,
      },
    );
    return false;
  }
  const [a, b] = lines.value;
  const aDebit = parseFloat(a.debit || 0) > 0;
  const aCredit = parseFloat(a.credit || 0) > 0;
  const bDebit = parseFloat(b.debit || 0) > 0;
  const bCredit = parseFloat(b.credit || 0) > 0;
  const result =
    (aDebit && !aCredit && !bDebit && bCredit) ||
    (bDebit && !bCredit && !aDebit && aCredit);
  console.log("[Reverse charge] isReverseChargeTwoLines:", {
    a: { debit: a.debit, credit: a.credit, aDebit, aCredit },
    b: { debit: b.debit, credit: b.credit, bDebit, bCredit },
    result,
  });
  return result;
});

// Case 2: multiple lines, all debit, and offset account selected
const isReverseChargeOffsetCase = computed(() => {
  if (lines.value.length < 2 || !formData.value.offsetAccount) {
    console.log("[Reverse charge] isReverseChargeOffsetCase: false", {
      lineCount: lines.value.length,
      hasOffsetAccount: !!formData.value.offsetAccount,
    });
    return false;
  }
  const allDebitNoCredit = lines.value.every(
    (line) =>
      parseFloat(line.debit || 0) > 0 && parseFloat(line.credit || 0) === 0,
  );
  console.log("[Reverse charge] isReverseChargeOffsetCase:", {
    lineCount: lines.value.length,
    lines: lines.value.map((l) => ({ debit: l.debit, credit: l.credit })),
    allDebitNoCredit,
  });
  return allDebitNoCredit;
});

const showReverseChargeButton = computed(() => {
  const lineTaxOk = !!lineTax.value;
  const accountsOk = reverseChargeAccountsAvailable.value;
  const twoLines = isReverseChargeTwoLines.value;
  const offsetCase = isReverseChargeOffsetCase.value;
  const result = lineTaxOk && accountsOk && (twoLines || offsetCase);
  console.log("[Reverse charge] showReverseChargeButton:", {
    lineTax: lineTaxOk,
    reverseChargeAccountsAvailable: accountsOk,
    isReverseChargeTwoLines: twoLines,
    isReverseChargeOffsetCase: offsetCase,
    result,
  });
  return result;
});

// Computed properties for conditional visibility
const canPost = computed(
  () =>
    (!closedto.value ||
      !formData.value.originaldate ||
      formData.value.originaldate > closedto.value) &&
    (!closedto.value || formData.value.transdate > closedto.value),
);

const canPostAsNew = computed(
  () => !closedto.value || formData.value.transdate > closedto.value,
);

const canDelete = computed(
  () =>
    formData.value.id &&
    (!closedto.value ||
      !formData.value.originaldate ||
      formData.value.originaldate > closedto.value) &&
    revtrans.value != 1,
);

const lineTax = ref(false);
const taxAccounts = ref([]);
const departments = ref([]);
const revtrans = ref(null);
const closedto = ref(null);

// Add new ref for filtered tax accounts
const filteredTaxAccounts = ref([]);

// Add function to filter taxes based on transaction date
const filterTaxAccounts = () => {
  if (!formData.value.transdate) return;

  const transDate = new Date(formData.value.transdate);

  // Group taxes by chart_id
  const groupedTaxes = taxAccounts.value.reduce((acc, tax) => {
    if (!acc[tax.chart_id]) {
      acc[tax.chart_id] = [];
    }
    acc[tax.chart_id].push(tax);
    return acc;
  }, {});

  // For each group, find the valid tax for the transaction date
  filteredTaxAccounts.value = Object.values(groupedTaxes).map((taxes) => {
    // Sort taxes by validto date (null dates come last)
    const sortedTaxes = taxes.sort((a, b) => {
      if (!a.validto) return 1;
      if (!b.validto) return -1;
      return new Date(a.validto) - new Date(b.validto);
    });

    // Find the first tax that is valid for the transaction date
    return (
      sortedTaxes.find((tax) => {
        if (!tax.validto) return true;
        const validToDate = new Date(tax.validto);
        return transDate <= validToDate;
      }) || sortedTaxes[0]
    ); // Fallback to the first tax if none are valid
  });

  // Check and remove invalid taxes from line items
  let removedTaxes = false;
  lines.value.forEach((line) => {
    if (line.taxAccount) {
      const taxAccNo =
        typeof line.taxAccount === "object"
          ? line.taxAccount.accno
          : line.taxAccount;
      const isValidTax = filteredTaxAccounts.value.some(
        (tax) => tax.accno === taxAccNo,
      );

      if (!isValidTax) {
        line.taxAccount = null;
        line.linetaxamount = 0;
        removedTaxes = true;
      }
    }
  });

  if (removedTaxes) {
    Notify.create({
      message: t(
        "Some line taxes have been removed as they are no longer valid for the selected date.",
      ),
      type: "warning",
      position: "center",
    });
  }
};

// Add watch on transaction date
watch(
  () => formData.value.transdate,
  () => {
    filterTaxAccounts();
  },
);

// When offset account is selected, we do NOT remove lines that use that account.
// filteredOpenAccounts already excludes the offset account, so it cannot be
// chosen for new or edited lines. Existing lines keep their accounts; if one
// already has the offset account, the user can change it manually.

const projects = ref([]);
const filteredProjects = ref([]);

const filterProjects = () => {
  if (!formData.value.transdate) return;

  filteredProjects.value = projects.value.filter((project) => {
    const start = project.startdate ? new Date(project.startdate) : null;
    const end = project.enddate ? new Date(project.enddate) : null;
    const invDateObj = new Date(formData.value.transdate);

    if (!start && !end) return true; // Include if both are null
    if (!start) return invDateObj <= end; // Include if only end date exists
    if (!end) return invDateObj >= start; // Include if only start date exists

    return invDateObj >= start && invDateObj <= end; // Include if within range
  });
};

const currencies = ref([]);
const connection = ref({});
const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/gl");
    lineTax.value = response.data.linetax;
    taxAccounts.value = response.data.tax_accounts;
    departments.value = response.data.departments;
    accounts.value = response.data.accounts.all;
    projects.value = response.data.projects;
    revtrans.value = response.data.revtrans;
    closedto.value = response.data.closedto;
    connection.value = response.data.connection;
    filterProjects();
    currencies.value = response.data.currencies;
    if (currencies.value.length > 0) {
      formData.value.currency = currencies.value[0];
    }
    lockNumber.value = response.data.locknumber ? true : false;
    // Initialize filtered tax accounts
    filterTaxAccounts();
  } catch (error) {
    console.log(error);
  }
};
const openAccounts = computed(() =>
  accounts.value.filter((account) => account.closed === 0),
);

const filteredOpenAccounts = computed(() => {
  if (!formData.value.offsetAccount) {
    return openAccounts.value;
  }
  return openAccounts.value.filter(
    (account) => account.accno !== formData.value.offsetAccount.accno,
  );
});

const loading = ref(false);

/**
 * submitTransaction handles both saving and posting.
 * @param {boolean} clearAfter - When true, clear the form after posting.
 * @param {boolean} isNew - When true, post as a new transaction regardless of existing ID.
 */
const submitTransaction = async (clearAfter = false, isNew = false) => {
  // Validate at least two lines exist
  if (lines.value.length < 2) {
    Notify.create({
      message: t("At least two lines are required to post a transaction."),
      type: "negative",
      position: "center",
    });
    return;
  }

  // Validate that total debit and credit amounts are balanced (only when no offset account is selected)
  if (!formData.value.offsetAccount && totalDebit.value !== totalCredit.value) {
    Notify.create({
      message: t("The total debit and credit amounts must be balanced."),
      type: "negative",
      position: "center",
    });
    return;
  }

  // When offset is selected, tax is excluded, and any line has tax: offset tax account is required
  if (offsetTaxAccountRequired.value && !formData.value.offsetTaxAccount) {
    Notify.create({
      message: t(
        "Offset Tax Account is required when offset account is selected, tax is excluded, and lines have tax.",
      ),
      type: "negative",
      position: "center",
    });
    return;
  }

  loading.value = true;

  const linesData = lines.value.map((line) => {
    let lineObj = {
      accno:
        line.account && line.account.accno ? line.account.accno : line.account,
      credit: parseFloat(line.credit) || 0,
      debit: parseFloat(line.debit) || 0,
      memo: line.memo || "",
      source: line.source || "",
      cleared: line.cleared || false,
    };

    // Handle project if present
    if (line.project) {
      lineObj.project =
        typeof line.project === "object"
          ? `${line.project.projectnumber}--${line.project.id}`
          : line.project;
    }

    // Handle tax information if present
    if (lineTax.value) {
      lineObj.taxAccount =
        line.taxAccount && typeof line.taxAccount === "object"
          ? line.taxAccount.label
          : line.taxAccount || null;
      lineObj.linetaxamount = parseFloat(line.linetaxamount) || 0;
    }

    return lineObj;
  });

  try {
    // Convert files to base64
    const base64Files = await convertFilesToBase64(formData.value.files || []);

    // Prepare JSON payload
    const payload = {
      curr:
        typeof formData.value.currency === "object"
          ? formData.value.currency.curr
          : formData.value.currency,
      exchangeRate: formData.value.exchangeRate
        ? parseFloat(formData.value.exchangeRate)
        : undefined,
      description: formData.value.description || "",
      notes: formData.value.notes || "",
      reference: formData.value.reference || "",
      transdate: formData.value.transdate,
      lines: linesData,
      department: formData.value.selectedDepartment
        ? typeof formData.value.selectedDepartment === "object"
          ? `${formData.value.selectedDepartment.description}--${formData.value.selectedDepartment.id}`
          : formData.value.selectedDepartment
        : undefined,
      files: base64Files,
      pending: pending.value,
      taxincluded: formData.value.taxIncluded,
      offset_accno: formData.value.offsetAccount
        ? formData.value.offsetAccount.accno
        : undefined,
      offset_tax_accno: formData.value.offsetTaxAccount
        ? typeof formData.value.offsetTaxAccount === "object"
          ? formData.value.offsetTaxAccount.accno
          : formData.value.offsetTaxAccount
        : undefined,
      offset_tax_amount:
        formData.value.offsetAccount && formData.value.offsetTaxAccount
          ? offsetTaxAmount.value
          : undefined,
    };
    let response;
    if (formData.value.id && !isNew) {
      response = await api.put(
        `/gl/transactions/${formData.value.id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } else {
      response = await api.post("/gl/transactions", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    Notify.create({
      message: t("Transaction Posted Successfully"),
      type: "positive",
      position: "top-right",
    });

    if (clearAfter) {
      const prevDate = formData.value.transdate;
      formData.value = { ...initialFormData, transdate: prevDate };
      if (currencies.value.length > 0) {
        formData.value.currency = currencies.value[0];
      }
      formData.value.selectedDepartment = null;
      formData.value.offsetAccount = null;
      formData.value.offsetTaxAccount = null;
      formData.value.taxIncluded = false;
      lines.value = [{ ...initialLine }, { ...initialLine }];
      existingFiles.value = [];
      pending.value = 0;
      lastTransactionsRef.value.fetchTransactions();

      // Remove ID from URL when posting
      if (route.query.id) {
        const query = { ...route.query };
        delete query.id;
        router.replace({ query });
      }
    } else {
      // For Save, load the transaction data if an ID is returned
      if (response.data?.id) {
        await loadTransaction(response.data.id);
        lastTransactionsRef.value.fetchTransactions();
      }
    }
  } catch (error) {
    console.error("Failed to submit transaction:", error);
    Notify.create({
      message:
        error.response?.data?.message || t("Failed to submit transaction."),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const existingFiles = ref([]);
const loadTransaction = async (id) => {
  if (id) {
    loading.value = true;

    try {
      const response = await api.get(`/gl/transactions/${id}`);
      const transactionData = response.data;

      formData.value = {
        id: transactionData.id,
        reference: transactionData.reference,
        description: transactionData.description,
        notes: transactionData.notes,
        transdate: transactionData.transdate,
        originaldate: transactionData.transdate,
        exchangeRate: transactionData.exchangeRate,
        pending: transactionData.pending ? 1 : 0,
        taxIncluded:
          transactionData.taxincluded !== undefined
            ? !!transactionData.taxincluded
            : false,
        offsetAccount: transactionData.offset_accno
          ? accounts.value.find(
              (acc) => acc.accno === transactionData.offset_accno,
            )
          : null,
        offsetTaxAccount: transactionData.offset_tax_accno
          ? (taxAccounts.value.find(
              (t) => t.accno === transactionData.offset_tax_accno,
            ) ?? null)
          : null,
      };
      pending.value = transactionData.pending ? 1 : 0;
      if (departments.value?.length) {
        formData.value.selectedDepartment = departments.value.find(
          (dpt) => dpt.id === transactionData.department_id,
        );
      }
      formData.value.currency = currencies.value.find(
        (curr) => curr.curr === transactionData.curr,
      );

      // Filter out lines that use the offset account if it exists
      const filteredLines = transactionData.offset_accno
        ? transactionData.lines.filter(
            (line) => line.accno !== transactionData.offset_accno,
          )
        : transactionData.lines;

      lines.value = filteredLines.map((line) => {
        const foundAccount =
          accounts.value.find((acc) => acc.accno === line.accno) || "";
        return {
          account: foundAccount,
          debit: line.debit.toString(),
          credit: line.credit.toString(),
          source: line.source,
          memo: line.memo,
          taxAccount: line.taxAccount
            ? taxAccounts.value.find((t) => t.chart_id === line.taxAccount) ||
              ""
            : "",
          linetaxamount: line.linetaxamount
            ? line.linetaxamount.toString()
            : "0",
          project:
            projects.value.length > 0 && line.project
              ? projects.value.find((proj) => proj.id === line.project)
              : null,
          showExtra: line.source || line.memo || line.project ? true : false,
        };
      });
      existingFiles.value = transactionData.files;
      await nextTick();
    } catch (error) {
      console.log("Failed to load transaction:", error);
    } finally {
      loading.value = false;
    }
  }
};

// Handler for file deletion event from the FileList component.
const handleFileDeletion = (index) => {
  existingFiles.value.splice(index, 1);
};

const reverseTransaction = () => {
  lines.value.forEach((line) => {
    const temp = line.debit;
    line.debit = line.credit;
    line.credit = temp;
  });

  formData.value.id = null;
  formData.value.reference = `REVERSE-${formData.value.reference || ""}`;
  formData.value.transdate = getTodayDate();

  Notify.create({
    message: t("Transaction reversed. Please review and post."),
    type: "positive",
    position: "top-right",
  });
};

const applyReverseCharge = () => {
  const debitTax = filteredTaxAccounts.value.find(
    (t) => t.accno === REVERSE_CHARGE_DEBIT_ACCNO,
  );
  const creditTax = filteredTaxAccounts.value.find(
    (t) => t.accno === REVERSE_CHARGE_CREDIT_ACCNO,
  );
  if (!debitTax || !creditTax) {
    Notify.create({
      message: t("Reverse charge tax accounts not found."),
      type: "negative",
      position: "top-right",
    });
    return;
  }

  if (isReverseChargeTwoLines.value) {
    const [a, b] = lines.value;
    const aIsDebit =
      parseFloat(a.debit || 0) > 0 && parseFloat(a.credit || 0) === 0;
    if (aIsDebit) {
      a.taxAccount = debitTax;
      b.taxAccount = creditTax;
    } else {
      b.taxAccount = debitTax;
      a.taxAccount = creditTax;
    }
  } else if (isReverseChargeOffsetCase.value) {
    lines.value.forEach((line) => {
      line.taxAccount = debitTax;
    });
    formData.value.offsetTaxAccount = creditTax;
  }

  recalculateAllLineTaxAmounts();
  Notify.create({
    message: t("Reverse charge applied. Please review tax amounts and post."),
    type: "positive",
    position: "top-right",
  });
};

const deleteTransaction = async () => {
  try {
    const confirmed = await confirmDelete({
      title: t("Confirm Deletion"),
      message: t(
        "Are you sure you want to delete this transaction? This action cannot be undone.",
      ),
    });

    if (confirmed) {
      await api.delete(`/gl/transactions/${formData.value.id}`);

      Notify.create({
        message: t("Transaction deleted successfully"),
        color: "positive",
        position: "center",
      });

      if (route.query.callback) {
        const query = { ...route.query, search: 1 };
        router.push({ path: route.query.callback, query: query });
      } else {
        resetForm();
      }
    } else {
      Notify.create({
        message: t("Transaction Delete canceled"),
        color: "warning",
        position: "center",
      });
    }
  } catch (error) {
    Notify.create({
      message: t("Unable to delete Transaction") + error,
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
};
const newNumber = async () => {
  try {
    const response = await api.get("next_number/gl");
    formData.value.reference = response.data.number;
  } catch (error) {
    console.error(error);
  }
};
const resetForm = () => {
  formData.value = { ...initialFormData };
  if (currencies.value.length > 0) {
    formData.value.currency = currencies.value[0];
  }
  formData.value.selectedDepartment = null;
  formData.value.originaldate = null;
  formData.value.offsetAccount = null;
  formData.value.offsetTaxAccount = null;
  formData.value.taxIncluded = false;
  lines.value = [{ ...initialLine }, { ...initialLine }];
  existingFiles.value = [];
  pending.value = 0;
};
const updateTaxAmount = (val, index) => {
  if (loading.value) return;
  if (!val || !val.accno) {
    console.warn("Invalid value provided:", val);
    return;
  }
  if (!taxAccounts || !taxAccounts.value) {
    console.warn("taxAccounts is not available");
    return;
  }
  const taxAcc = filteredTaxAccounts.value.find(
    (item) => item.accno === val.accno,
  );
  if (!taxAcc || !taxAcc.rate) {
    lines.value[index].linetaxamount = 0;
    return;
  }

  let debit = parseFloat(lines.value[index].debit);
  let credit = parseFloat(lines.value[index].credit);
  if (isNaN(debit)) debit = 0;
  if (isNaN(credit)) credit = 0;

  let grossAmount = debit > 0 ? debit : credit;

  if (!grossAmount) {
    lines.value[index].linetaxamount = 0;
    return;
  }

  const rate = taxAcc.rate;
  if (formData.value.taxIncluded) {
    // Tax included: amount already contains tax → tax = amount - amount/(1+rate) = amount * rate / (1+rate)
    lines.value[index].linetaxamount = roundAmount(
      grossAmount - grossAmount / (1 + rate),
    );
  } else {
    // Tax excluded: amount is before tax → tax = amount * rate
    lines.value[index].linetaxamount = roundAmount(grossAmount * rate);
  }
};

const recalculateAllLineTaxAmounts = () => {
  lines.value.forEach((line, index) => {
    if (line.taxAccount) {
      const val =
        typeof line.taxAccount === "object"
          ? line.taxAccount
          : filteredTaxAccounts.value.find(
              (t) => t.accno === line.taxAccount || t.label === line.taxAccount,
            );
      if (val) updateTaxAmount(val, index);
    }
  });
};

const handleOffsetAccountChange = (val) => {
  if (!val) {
    formData.value.offsetAccount = null;
    formData.value.offsetTaxAccount = null;
    return;
  }
  const foundAccount = accounts.value.find((acc) => acc.accno === val.accno);
  if (foundAccount) {
    formData.value.offsetAccount = foundAccount;
  } else {
    formData.value.offsetAccount = null;
    formData.value.offsetTaxAccount = null;
  }
};

onMounted(async () => {
  try {
    await Promise.all([fetchLinks()]);
    loadTransaction(route.query.id);
  } catch (error) {
    console.log("Error in loading initial data:", error);
  }
});
</script>
<style>
.total-row {
  background-color: var(--q-highlight);
  border-radius: 10px;
  border: 1px solid var(--q-border);
  font-weight: 600;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
}
</style>
