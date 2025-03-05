<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <div class="flex q-pa-sm mainbg column">
      <div class="row q-gutter-sm q-mb-sm">
        <q-input
          :label="t('Reference')"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          v-model="formData.reference"
        />
        <q-select
          v-if="currencies"
          outlined
          v-model="formData.currency"
          :options="currencies"
          option-value="curr"
          option-label="curr"
          :label="t('Currency')"
          dense
          class="col-2"
          bg-color="input"
          label-color="secondary"
        />
        <div class="col-2">
          <q-select
            v-if="departments.length > 0"
            outlined
            v-model="formData.selectedDepartment"
            :options="departments"
            option-value="description"
            option-label="description"
            :label="t('Department')"
            dense
            bg-color="input"
            label-color="secondary"
            clearable
            autogrow
            hide-bottom-space
          />
        </div>
        <q-input
          v-if="formData.currency.rn != 1"
          class="col-2"
          :label="t('Exchange Rate')"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          v-model="formData.exchangeRate"
        />
        <q-input
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

      <div class="row q-mb-sm">
        <q-input
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
      <div class="row">
        <q-input
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
    </div>

    <div class="flex q-pa-sm mainbg column q-mt-sm">
      <div v-for="(line, index) in lines" :key="index" class="column q-mb-sm">
        <div class="row q-gutter-x-xs">
          <!-- Account s-select with a ref for auto-focus -->
          <s-select
            outlined
            v-model="line.account"
            :options="accounts"
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
          />

          <!-- Tax fields if Linetax is enabled -->
          <template v-if="lineTax">
            <s-select
              outlined
              v-model="line.taxAccount"
              :options="taxAccounts"
              option-value="accno"
              option-label="label"
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
            v-if="!line.showExtra"
          />
        </div>

        <!-- Extra Fields for Source and Memo -->
        <transition name="fade">
          <div v-if="line.showExtra" class="row q-gutter-x-xs q-mt-xs">
            <q-input
              v-model="line.source"
              :label="t('Source')"
              class="col-3"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              @keydown.enter="handleEnter($event, index)"
            />
            <q-input
              v-model="line.memo"
              :label="t('Memo')"
              class="col-3"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              @keydown.enter="handleEnter($event, index)"
            />
            <q-btn
              color="negative"
              icon="delete"
              dense
              flat
              @click="removeLine(index)"
              v-if="line.showExtra"
            />
          </div>
        </transition>
      </div>

      <div class="row q-py-xs q-gutter-x-xs">
        <div class="q-pa-sm lightbg maintext col-3 text-center">
          {{ t("Total") }}
        </div>
        <div class="q-pa-sm lightbg maintext col-2">
          {{ formatAmount(totalDebit) }}
        </div>
        <div class="q-pa-sm lightbg maintext col-2">
          {{ formatAmount(totalCredit) }}
        </div>
        <div
          class="q-pa-sm col-2 lightbg text-bold"
          :class="
            totalDebit - totalCredit == 0 ? 'text-positive' : 'text-negative'
          "
        >
          {{ formatAmount(totalDebit - totalCredit) }}
        </div>
      </div>

      <div class="row justify-end">
        <q-btn
          color="primary"
          icon="add"
          dense
          flat
          :label="t('Add Line')"
          @click="addLine"
        />
      </div>
    </div>

    <!-- Two buttons: Save and Post -->
    <div class="row q-my-sm q-px-sm">
      <q-btn
        color="primary"
        :label="t('Post')"
        @click="submitTransaction(true)"
        :loading="loading"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from "vue";
import { api } from "src/boot/axios";
import { date, Notify } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { formatAmount } from "src/helpers/utils";
import { useI18n } from "vue-i18n";

const updateTitle = inject("updateTitle");
const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const { formatDate } = date;

const getTodayDate = () => formatDate(new Date(), "YYYY-MM-DD");

// Initial form and line data for reset
const initialFormData = {
  reference: "",
  currency: "",
  exchangeRate: "",
  description: "",
  notes: "",
  transdate: getTodayDate(),
  id: null,
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

// -- Lines state includes showExtra to control visibility of source & memo --
const lines = ref([{ ...initialLine }, { ...initialLine }]);

const transactionTitle = computed(() =>
  formData.value.id
    ? "Update General Ledger Transaction"
    : "Add General Ledger Transaction"
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
  if (lines.value.length > 1) {
    const emptyIndex = lines.value.findIndex((line) => isEmptyLine(line));
    if (emptyIndex > -1) {
      lines.value.splice(emptyIndex, 1);
    }
  }
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
  if (lines.value.length > 2) {
    lines.value.splice(index, 1);
  }
};

const toggleExtra = (index) => {
  lines.value[index].showExtra = !lines.value[index].showExtra;
};

const totalDebit = computed(() =>
  lines.value.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0)
);

const totalCredit = computed(() =>
  lines.value.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0)
);

const lineTax = ref(false);
const taxAccounts = ref([]);
const departments = ref([]);

const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/gl");
    lineTax.value = response.data.linetax;
    taxAccounts.value = response.data.tax_accounts;
    departments.value = response.data.departments;
    accounts.value = response.data.accounts.all;
    currencies.value = response.data.currencies;
    if (currencies.value.length > 0) {
      formData.value.currency = currencies.value[0];
    }
  } catch (error) {
    console.log(error);
  }
};

const loading = ref(false);

/**
 * submitTransaction handles both saving and posting.
 * @param {boolean} clearAfter - When true, clear the form after posting.
 */
const submitTransaction = async (clearAfter = false) => {
  // Validate at least two lines exist
  if (lines.value.length < 2) {
    Notify.create({
      message: t("At least two lines are required to post a transaction."),
      type: "negative",
      position: "center",
    });
    return;
  }

  // Validate that total debit and credit amounts are balanced
  if (totalDebit.value !== totalCredit.value) {
    Notify.create({
      message: t("The total debit and credit amounts must be balanced."),
      type: "negative",
      position: "center",
    });
    return;
  }

  loading.value = true;
  const transactionData = {
    curr:
      typeof formData.value.currency === "object"
        ? formData.value.currency.curr
        : formData.value.currency,
    exchangeRate: formData.value.exchangeRate
      ? parseFloat(formData.value.exchangeRate)
      : 0,
    description: formData.value.description,
    lines: lines.value.map((line) => {
      let lineObj = {
        accno:
          line.account && line.account.accno
            ? line.account.accno
            : line.account,
        credit: parseFloat(line.credit) || 0,
        debit: parseFloat(line.debit) || 0,
        memo: line.memo,
        source: line.source,
      };
      if (lineTax.value) {
        lineObj.taxAccount =
          line.taxAccount && typeof line.taxAccount === "object"
            ? line.taxAccount.label
            : line.taxAccount || null;
        lineObj.linetaxamount = parseFloat(line.linetaxamount) || 0;
      }
      return lineObj;
    }),
    notes: formData.value.notes,
    reference: formData.value.reference,
    transdate: formData.value.transdate,
  };
  const { selectedDepartment } = formData.value;
  if (selectedDepartment) {
    transactionData.department = `${selectedDepartment.description}--${selectedDepartment.id}`;
  }
  try {
    let response;
    if (formData.value.id) {
      response = await api.put(
        `/gl/transactions/${formData.value.id}`,
        transactionData
      );
    } else {
      response = await api.post("/gl/transactions/", transactionData);
    }

    Notify.create({
      message: t("Transaction Posted Successfully."),
      type: "positive",
      position: "center",
    });

    if (clearAfter) {
      // Clear the form and lines for a new entry
      const prevDate = formData.value.transdate;
      formData.value = { ...initialFormData, transdate: prevDate };
      if (currencies.value.length > 0) {
        formData.value.currency = currencies.value[0];
      }
      formData.value.selectedDepartment = null;
      lines.value = [{ ...initialLine }, { ...initialLine }];
    } else {
      // For Save, load the transaction data if an ID is returned
      if (response.data?.id) {
        await loadTransaction(response.data.id);
      }
    }
  } catch (error) {
    console.log("Failed to submit transaction:", error);
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

const loadTransaction = async (id) => {
  if (id) {
    try {
      const response = await api.get(`/gl/transactions/${id}`);
      const transactionData = response.data;

      formData.value = {
        id: transactionData.id,
        reference: transactionData.reference,
        description: transactionData.description,
        notes: transactionData.notes,
        transdate: transactionData.transdate,
        exchangeRate: transactionData.exchangeRate,
      };
      if (departments.value?.length) {
        formData.value.selectedDepartment = departments.value.find(
          (dpt) => dpt.id === transactionData.department_id
        );
      }
      formData.value.currency = currencies.value.find(
        (curr) => curr.curr === transactionData.curr
      );

      lines.value = transactionData.lines.map((line) => {
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
          showExtra: line.source || line.memo ? true : false,
        };
      });
    } catch (error) {
      console.log("Failed to load transaction:", error);
    }
  }
};

const currencies = ref([]);

const updateTaxAmount = (val, index) => {
  if (!val || !val.accno) {
    console.warn("Invalid value provided:", val);
    return;
  }
  if (!taxAccounts || !taxAccounts.value) {
    console.warn("taxAccounts is not available");
    return;
  }
  const taxAcc = taxAccounts.value.find((item) => item.accno === val.accno);
  if (!taxAcc || !taxAcc.rate) {
    lines.value[index].linetaxamount = 0;
    return;
  }
  let debit = parseFloat(lines.value[index].debit);
  let credit = parseFloat(lines.value[index].credit);
  if (isNaN(debit)) debit = 0;
  if (isNaN(credit)) credit = 0;
  let baseAmount = debit > 0 ? debit : credit;
  lines.value[index].linetaxamount = baseAmount ? baseAmount * taxAcc.rate : 0;
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
