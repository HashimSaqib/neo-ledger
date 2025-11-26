<template>
  <q-page class="lightbg q-pa-sm">
    <div class="q-pa-md">
      <div class="q-gutter-y-md">
        <q-checkbox
          v-model="revtrans"
          :label="t('Enforce Transaction Reversal for all Dates')"
          dense
        />

        <q-input
          v-model="closedto"
          :label="t('Close Books up to')"
          type="date"
          outlined
          dense
          bg-color="input"
          label-color="secondary"
          style="width: 25%"
        />

        <q-checkbox
          v-model="audittrail"
          :label="t('Activate Audit Trail')"
          dense
        />

        <div class="q-mt-lg">
          <q-btn :label="t('Save')" color="primary" @click="save" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
const updateTitle = inject("updateTitle");
updateTitle(t("Audit"));

const { t } = useI18n();

// Form values
const revtrans = ref(false);
const closedto = ref(null);
const audittrail = ref(false);

// Mounted function to fetch initial data
const fetchData = async () => {
  try {
    console.log("Fetching audit settings data...");
    const response = await api.get("/system/audit");
    console.log("Audit settings response:", response.data);

    // Update form values with response data - convert 1/0 to boolean
    revtrans.value = response.data.revtrans == 1;
    closedto.value = response.data.closedto;
    audittrail.value = response.data.audittrail == 1;
  } catch (error) {
    console.error("Error fetching audit settings:", error);
    Notify.create({
      message:
        error.response?.data?.message || t("Failed to load audit settings"),
      type: "negative",
      position: "center",
    });
  }
};

// Save function to update settings
const save = async () => {
  try {
    console.log("Saving audit settings:", Math.random());
    const payload = {
      revtrans: revtrans.value ? 1 : 0,
      closedto: closedto.value,
      audittrail: audittrail.value ? 1 : 0,
    };

    // Uncomment when API is ready
    await api.post("/system/audit", payload);

    Notify.create({
      message: t("Audit settings saved successfully"),
      type: "positive",
      position: "top-right",
    });
  } catch (error) {
    Notify.create({
      message:
        error.response?.data?.message || t("Failed to save audit settings"),
      type: "negative",
      position: "center",
    });
  }
};

onMounted(() => {
  fetchData();
});
</script>
