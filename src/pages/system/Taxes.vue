<template>
  <q-page class="lightbg q-pa-sm">
    <q-table
      :rows="taxes"
      :columns="columns"
      row-key="id"
      flat
      bordered
      separator="horizontal"
      hide-bottom
    >
      <!-- Custom cell for closed checkbox -->
      <template v-slot:body-cell-closed="props">
        <q-td :props="props">
          <q-checkbox
            v-model="props.row.closed"
            :true-value="1"
            :false-value="0"
            @update:model-value="handleFieldUpdate(props.row, 'closed')"
          />
        </q-td>
      </template>

      <!-- Custom cell for rate input -->
      <template v-slot:body-cell-rate="props">
        <q-td :props="props">
          <q-input
            v-model.number="props.row.rate"
            type="number"
            dense
            bg-color="input"
            outlined
            label-color="secondary"
            @blur="handleFieldUpdate(props.row, 'rate')"
          />
        </q-td>
      </template>

      <!-- Custom cell for taxnumber input -->
      <template v-slot:body-cell-taxnumber="props">
        <q-td :props="props">
          <q-input
            v-model="props.row.taxnumber"
            dense
            bg-color="input"
            outlined
            label-color="secondary"
            @blur="handleFieldUpdate(props.row, 'taxnumber')"
          />
        </q-td>
      </template>

      <!-- Custom cell for validto date -->
      <template v-slot:body-cell-validto="props">
        <q-td :props="props">
          <q-input
            v-model="props.row.validto"
            type="date"
            bg-color="input"
            outlined
            label-color="secondary"
            @blur="handleFieldUpdate(props.row, 'validto')"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";

const { t } = useI18n();

const taxes = ref([]);

const columns = [
  {
    name: "accno",
    label: t("Account"),
    field: "accno",
    align: "left",
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  {
    name: "closed",
    label: t("Closed"),
    field: "closed",
    align: "center",
  },
  {
    name: "rate",
    label: t("Rate (%)"),
    field: "rate",
    align: "right",
  },
  {
    name: "taxnumber",
    label: t("Tax Number"),
    field: "taxnumber",
    align: "left",
  },
  {
    name: "validto",
    label: t("Valid To"),
    field: "validto",
    align: "left",
  },
];

// Fetch taxes from API
const getTaxes = async () => {
  try {
    const response = await api.get("/system/taxes");
    taxes.value = response.data;
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("Can't fetch taxes"),
      type: "negative",
      position: "center",
    });
  }
};

// Handle field updates
const handleFieldUpdate = async (row, field) => {
  try {
    // Format all taxes for the payload
    const payload = {
      taxes: taxes.value.map((tax) => ({
        chart_id: tax.id,
        rate: tax.rate,
        taxnumber: tax.taxnumber,
        validto: tax.validto,
        closed: tax.closed === 1,
      })),
    };

    await api.post("/system/taxes", payload);
    Notify.create({
      message: t("Tax updated successfully!"),
      type: "positive",
      position: "center",
    });
    getTaxes();
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("An error occurred"),
      type: "negative",
      position: "center",
    });
    getTaxes();
  }
};

onMounted(() => {
  getTaxes();
});
</script>
