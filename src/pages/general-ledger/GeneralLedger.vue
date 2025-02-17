<template>
  <q-page class="lightbg q-px-md q-py-md relative-position">
    <div class="flex q-px-lg q-py-md mainbg column">
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

    <div class="flex q-px-lg q-py-md mainbg column q-mt-lg">
      <div
        v-for="(line, index) in lines"
        :key="index"
        class="row justify-space-between q-mb-sm"
      >
        <s-select
          outlined
          v-model="line.account"
          :options="accounts"
          :label="t('Account')"
          dense
          class="lightbg col-4"
          popup-content-class="mainbg maintext"
          input-class="maintext"
          label-color="secondary"
          search="label"
        />

        <fn-input
          v-model="line.debit"
          :label="t('Debit')"
          class="lightbg col-1 q-ml-md"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <fn-input
          v-model="line.credit"
          :label="t('Credit')"
          class="lightbg col-1 q-ml-md"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="line.source"
          :label="t('Source')"
          class="lightbg col-2 q-ml-md"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="line.memo"
          :label="t('Memo')"
          class="lightbg col-2 q-ml-md"
          input-class="maintext"
          label-color="secondary"
          outlined
          dense
        />
        <q-btn
          color="negative"
          icon="delete"
          dense
          flat
          class="q-ml-md"
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
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from "vue";
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

const getTodayDate = () => {
  return formatDate(new Date(), "YYYY-MM-DD");
};

const formData = ref({
  reference: "",
  currency: "",
  exchangeRate: "",
  description: "",
  notes: "",
  transdate: getTodayDate(),
  id: null,
});

const lines = ref([
  {
    account: "",
    debit: 0,
    credit: 0,
    source: "",
    memo: "",
  },
  {
    account: "",
    debit: 0,
    credit: 0,
    source: "",
    memo: "",
  },
]);

const transactionTitle = computed(() => {
  return formData.value.id
    ? "Update General Ledger Transaction"
    : "Add General Ledger Transaction";
});
updateTitle(transactionTitle.value);

const buttonLabel = computed(() => {
  return formData.value.id ? t("Update") : t("Post");
});

const addLine = () => {
  lines.value.push({
    account: "",
    debit: 0,
    credit: "",
    source: "",
    memo: "",
  });
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
  loading.value = true;
  const transactionData = {
    curr:
      typeof formData.value.currency === "object"
        ? formData.value.currency.curr
        : formData.value.currency,
    exchangeRate: formData.value.exchangeRate,
    departmentid: 0,
    description: formData.value.description,
    lines: lines.value.map((line) => ({
      accno: line.account.accno,
      credit: parseFloat(line.credit) || 0,
      debit: parseFloat(line.debit) || 0,
      memo: line.memo,
      source: line.source,
    })),
    notes: formData.value.notes,
    reference: formData.value.reference,
    transdate: formData.value.transdate,
  };

  try {
    if (formData.value.id) {
      await api.put(`/gl/transactions/${formData.value.id}`, transactionData);
    } else {
      await api.post("/gl/transactions/", transactionData);
    }
    Notify.create({
      message: "Transaction Posted Successfully.",
      type: "positive",
      position: "center",
    });
  } catch (error) {
    console.log("Failed to submit transaction:", error);
    Notify.create({
      message: error.response.data.message,
      type: "negative",
      position: "center",
    });
    loading.value = false;
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

      lines.value = transactionData.lines.map((line) => {
        const account =
          accounts.value.find((acc) => acc.accno === line.accno) || {};
        return {
          account: account,
          debit: line.debit.toString(),
          credit: line.credit.toString(),
          source: line.source,
          memo: line.memo,
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
  } catch (error) {
    console.log("Failed to submit Currencies:", error);
    Notify.create({
      message: error.response.data.message,
      type: "negative",
      position: "center",
    });
  }
};

onMounted(() => {
  fetchAccounts();
  fetchCurrencies();
  loadTransaction(route.query.id);
});
</script>
