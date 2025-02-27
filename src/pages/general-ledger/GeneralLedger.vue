<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <div class="flex q-pa-sm mainbg column">
      <div class="row justify-space-between q-mb-sm">
        <q-input
          :label="t('Reference')"
          class="lightbg"
          input-class="maintext"
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
          class="lightbg col-2 q-ml-md"
          input-class="maintext"
          label-color="secondary"
        />
        <q-input
          v-if="formData.currency.rn != 1"
          class="lightbg col-2 q-ml-md"
          :label="t('Exchange Rate')"
          outlined
          dense
          v-model="formData.exchangeRate"
        />
        <q-input
          v-model="formData.transdate"
          :label="t('Date')"
          class="lightbg col-2 q-ml-md"
          input-class="maintext"
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
          class="lightbg col-6"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
          type="textarea"
          rows="1"
        />
      </div>
      <div class="row">
        <q-input
          v-model="formData.notes"
          :label="t('Notes')"
          class="lightbg col-6"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
          type="textarea"
          rows="1"
        />
      </div>
    </div>

    <div class="flex q-pa-sm mainbg column q-mt-sm">
      <div
        v-for="(line, index) in lines"
        :key="index"
        class="row q-gutter-x-sm q-mb-sm"
      >
        <!-- Account s-select with a ref for auto-focus -->
        <s-select
          outlined
          v-model="line.account"
          :options="accounts"
          :label="t('Account')"
          dense
          class="lightbg col-3"
          popup-content-class="mainbg maintext"
          input-class="maintext"
          label-color="secondary"
          search="label"
          account
          :ref="(el) => setAccountRef(el, index)"
        />

        <!-- Debit input -->
        <fn-input
          v-model="line.debit"
          :label="t('Debit')"
          class="lightbg col-1"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
          @keydown.enter="handleEnter($event, index)"
        />

        <!-- Credit input -->
        <fn-input
          v-model="line.credit"
          :label="t('Credit')"
          class="lightbg col-1 m"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
          @keydown.enter="handleEnter($event, index)"
        />

        <!-- Source input -->
        <q-input
          v-model="line.source"
          :label="t('Source')"
          class="lightbg col-2"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
          @keydown.enter="handleEnter($event, index)"
        />
        <!-- Memo input -->
        <q-input
          v-model="line.memo"
          :label="t('Memo')"
          class="lightbg col-2"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
          @keydown.enter="handleEnter($event, index)"
        />

        <!-- Conditionally show Tax fields if Linetax is enabled -->
        <template v-if="lineTax">
          <s-select
            outlined
            v-model="line.taxAccount"
            :options="taxAccounts"
            option-value="accno"
            option-label="label"
            :label="t('Tax Accno')"
            dense
            class="lightbg col-1"
            popup-content-class="mainbg maintext"
            input-class="maintext"
            label-color="secondary"
            account
            search="label"
          />
          <fn-input
            v-model="line.linetaxamount"
            :label="t('Tax Amount')"
            class="lightbg col-1"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            @keydown.enter="handleEnter($event, index)"
          />
        </template>

        <q-btn
          color="negative"
          icon="delete"
          dense
          flat
          @click="removeLine(index)"
        />
      </div>

      <div class="row justify-space-between q-py-md">
        <div class="q-pa-sm lightbg maintext col-4 text-center">
          {{ t("Total") }}
        </div>
        <div class="q-ml-md q-pa-sm lightbg maintext col-1 text-center">
          {{ formatAmount(totalDebit) }}
        </div>
        <div class="q-ml-md q-pa-sm lightbg col-1 maintext text-center">
          {{ formatAmount(totalCredit) }}
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

    <q-btn
      color="primary"
      :label="buttonLabel"
      class="q-my-md q-px-xl"
      @click="submitTransaction"
      :loading="loading"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject, nextTick } from "vue";
import { api } from "src/boot/axios";
import { date, Notify } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { formatAmount, filter } from "src/helpers/utils";
import { useI18n } from "vue-i18n";

const updateTitle = inject("updateTitle");
const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const { formatDate } = date;

const getTodayDate = () => formatDate(new Date(), "YYYY-MM-DD");

const formData = ref({
  reference: "",
  currency: "",
  exchangeRate: "",
  description: "",
  notes: "",
  transdate: getTodayDate(),
  id: null,
});

// -- Lines state uses taxAccount and linetaxamount --
const lines = ref([
  {
    account: "",
    debit: 0,
    credit: 0,
    source: "",
    memo: "",
    taxAccount: "",
    linetaxamount: 0,
  },
  {
    account: "",
    debit: 0,
    credit: 0,
    source: "",
    memo: "",
    taxAccount: "",
    linetaxamount: 0,
  },
]);

const transactionTitle = computed(() =>
  formData.value.id
    ? "Update General Ledger Transaction"
    : "Add General Ledger Transaction"
);
updateTitle(transactionTitle.value);

const buttonLabel = computed(() => {
  return formData.value.id ? t("Update") : t("Post");
});

// To auto-focus the first field in a new line
const accountRefs = ref([]);
const setAccountRef = (el, index) => {
  accountRefs.value[index] = el;
};

const addLine = () => {
  lines.value.push({
    account: "",
    debit: 0,
    credit: 0,
    source: "",
    memo: "",
    taxAccount: "",
    linetaxamount: 0,
  });
};

const addLineAt = (index) => {
  lines.value.splice(index + 1, 0, {
    account: "",
    debit: 0,
    credit: 0,
    source: "",
    memo: "",
    taxAccount: "",
    linetaxamount: 0,
  });
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

const totalDebit = computed(() => {
  return lines.value.reduce(
    (sum, line) => sum + parseFloat(line.debit || 0),
    0
  );
});

const totalCredit = computed(() => {
  return lines.value.reduce(
    (sum, line) => sum + parseFloat(line.credit || 0),
    0
  );
});

const accounts = ref([]);
const filteredAccounts = ref([]);

const fetchAccounts = async () => {
  try {
    const response = await api.get("/charts");
    const accountsData = response.data;
    accounts.value = accountsData;
    filteredAccounts.value = accountsData;
  } catch (error) {
    console.log(error);
  }
};

const lineTax = ref(false);
const taxAccounts = ref([]);

const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/gl");
    lineTax.value = response.data.linetax;
    taxAccounts.value = response.data.tax_accounts;
  } catch (error) {
    console.log(error);
  }
};

// For s-select filtering
const filterAccounts = (val, update) => {
  if (val === "") {
    update(() => {
      filteredAccounts.value = accounts.value;
    });
    return;
  }
  update(() => {
    const needle = val.toLowerCase();
    filteredAccounts.value = accounts.value.filter(
      (v) => v.label.toLowerCase().indexOf(needle) > -1
    );
  });
};

const loading = ref(false);
const submitTransaction = async () => {
  // Check if at least two lines are provided
  if (lines.value.length < 2) {
    Notify.create({
      message: t("At least two lines are required to post a transaction."),
      type: "negative",
      position: "center",
    });
    return;
  }

  // Check if total debit and credit are balanced
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
    departmentid: 0,
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
      // Only include tax info if linetax is enabled
      if (lineTax.value) {
        // taxAccount is an object or string, only send the accno (id)
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

    // If the response returns an ID, load the transaction details
    if (response.data?.id) {
      await loadTransaction(response.data.id);
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
        currency: transactionData.curr,
        description: transactionData.description,
        notes: transactionData.notes,
        transdate: transactionData.transdate,
        exchangeRate: transactionData.exchangeRate,
      };

      // Map the lines, hooking up the correct accounts and converting linetaxamount
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
        };
      });
    } catch (error) {
      console.log("Failed to load transaction:", error);
    }
  }
};

const currencies = ref([]);
const fetchCurrencies = async () => {
  try {
    const response = await api.get("/system/currencies");
    currencies.value = response.data;
    if (currencies.value.length > 0) {
      formData.value.currency = currencies.value[0];
    }
  } catch (error) {
    console.log("Failed to fetch Currencies:", error);
    Notify.create({
      message: error.response.data.message,
      type: "negative",
      position: "center",
    });
  }
};

onMounted(async () => {
  try {
    // Wait for all data to load before loading the transaction
    await Promise.all([fetchAccounts(), fetchCurrencies(), fetchLinks()]);

    // Now safely load the transaction
    loadTransaction(route.query.id);
  } catch (error) {
    console.log("Error in loading initial data:", error);
  }
});
</script>
