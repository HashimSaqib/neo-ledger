<template>
  <q-page class="lightbg q-pa-sm">
    <q-table
      :rows="taxes"
      :columns="columns"
      :row-key="(row, index) => `${row.id}-${index}`"
      flat
      bordered
      separator="horizontal"
      hide-bottom
      :rows-per-page-options="[0]"
    >
      <!-- Custom cell for account number -->
      <template v-slot:body-cell-accno="props">
        <q-td :props="props">
          <span v-if="!isDuplicateAccno(props.rowIndex)">
            {{ props.row.accno }}
          </span>
        </q-td>
      </template>

      <!-- Custom cell for description -->
      <template v-slot:body-cell-description="props">
        <q-td :props="props">
          <span v-if="!isDuplicateAccno(props.rowIndex)">
            {{ props.row.description }}
          </span>
        </q-td>
      </template>

      <!-- Custom cell for closed checkbox -->
      <template v-slot:body-cell-closed="props">
        <q-td :props="props">
          <q-checkbox
            v-if="!isDuplicateAccno(props.rowIndex)"
            v-model="props.row.closed"
            :true-value="1"
            :false-value="0"
            @update:model-value="syncAccountChanges(props.row)"
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
          />
        </q-td>
      </template>
    </q-table>
    <q-btn
      color="primary"
      :label="t('Save')"
      @click="saveTaxes"
      class="q-my-md"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";

const { t } = useI18n();

const taxes = ref([]);

// Watch for changes in validto field
watch(
  () => taxes.value,
  (newTaxes) => {
    newTaxes.forEach((tax, index) => {
      if (index < newTaxes.length - 1) {
        const nextTax = newTaxes[index + 1];

        // Case 1: validto is set and next line has different accno
        if (tax.validto && tax.accno !== nextTax.accno) {
          // Create a copy of the current tax without validto
          const newTax = { ...tax };
          delete newTax.validto;
          // Insert the new tax before the next line
          taxes.value.splice(index + 1, 0, newTax);
        }

        // Case 2: validto is removed and next line has same accno
        if (!tax.validto && tax.accno === nextTax.accno) {
          // Remove the next line
          taxes.value.splice(index + 1, 1);
        }
      }
    });
  },
  { deep: true }
);

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

// Check if the current row's accno is the same as the previous row
const isDuplicateAccno = (rowIndex) => {
  if (rowIndex === 0) return false;
  return taxes.value[rowIndex]?.accno === taxes.value[rowIndex - 1]?.accno;
};

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
const saveTaxes = async () => {
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
      position: "top-right",
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

// Function to sync changes across items with the same ID
const syncAccountChanges = (changedRow) => {
  taxes.value = taxes.value.map((row) => {
    if (row.id === changedRow.id) {
      return {
        ...row,
        accno: changedRow.accno,
        description: changedRow.description,
        closed: changedRow.closed,
      };
    }
    return row;
  });
};

onMounted(() => {
  getTaxes();
});
</script>
