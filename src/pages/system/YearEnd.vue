<template>
  <q-page class="lightbg q-pa-sm">
    <div class="q-pa-md row">
      <div class="q-gutter-y-md col-12 col-lg-3 col-md-6">
        <q-input
          v-model="todate"
          :label="t('Year End Date')"
          type="date"
          outlined
          dense
          bg-color="input"
          label-color="secondary"
          class="col col-12 col-lg-6"
        />

        <s-select
          v-model="accno"
          emit-value
          map-options
          :label="t('Retained Earnings Account')"
          outlined
          dense
          bg-color="input"
          label-color="secondary"
          :options="accounts"
          option-label="label"
          option-value="accno"
          search="label"
          account
        />

        <q-input
          v-model="description"
          :label="t('Description')"
          outlined
          dense
          bg-color="input"
          label-color="secondary"
        />

        <q-input
          v-model="reference"
          :label="t('Reference')"
          outlined
          dense
          bg-color="input"
          label-color="secondary"
        />

        <q-option-group
          v-model="method"
          :options="[
            { label: t('Cash'), value: 'cash' },
            { label: t('Accrual'), value: 'accrual' },
          ]"
          inline
          dense
          class="q-mb-md"
        />

        <div class="q-mt-lg">
          <q-btn
            :label="t('Process Year End')"
            color="primary"
            @click="processYearEnd"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <LastTransactions
        type="yearend"
        class="col-12 col-lg-6"
        ref="lastTransactionsRef"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, inject, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
import LastTransactions from "src/components/LastTransactions.vue";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Year End"));

// Form values
const todate = ref(null);
const accno = ref("");
const description = ref("");
const notes = ref("");
const reference = ref("");
const method = ref("accrual"); // Default to accrual method
const accounts = ref([]); // Store year end accounts
const lastTransactionsRef = ref(null);

// Fetch year end accounts
const fetchYearEndAccounts = async () => {
  try {
    const response = await api.get("/system/yearend");
    accounts.value = response.data;
  } catch (error) {
    Notify.create({
      message:
        error.response?.data?.message || t("Failed to fetch year end accounts"),
      type: "negative",
      position: "center",
    });
  }
};

// Load accounts when component is mounted
onMounted(() => {
  fetchYearEndAccounts();
});

// Process year end function
const processYearEnd = async () => {
  try {
    const payload = {
      todate: todate.value,
      accno: accno.value,
      description: description.value,
      notes: notes.value,
      reference: reference.value,
      method: method.value,
    };

    const response = await api.post("/system/yearend", payload);

    if (response.data.status === "success") {
      Notify.create({
        message: response.data.message,
        type: "positive",
        position: "top-right",
      });
      lastTransactionsRef.value.fetchTransactions();
    } else {
      Notify.create({
        message: response.data.message,
        type: "negative",
        position: "center",
      });
    }
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("Failed to process year end"),
      type: "negative",
      position: "center",
    });
  }
};
</script>
