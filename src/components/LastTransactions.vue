<template>
  <div class="last-transactions">
    <q-table
      :rows="transactions"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :rows-per-page="0"
      hide-bottom
      flat
      bordered
      dense
    >
      <template v-slot:body-cell-reference="props">
        <q-td :props="props">
          <router-link :to="getPath(props.row)" class="text-primary">
            {{ props.row.reference }}
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-invnumber="props">
        <q-td :props="props">
          <router-link :to="getPath(props.row)" class="text-primary">
            {{ props.row.invnumber }}
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-amount="props">
        <q-td :props="props">
          {{ formatAmount(props.row.amount) }}
        </q-td>
      </template>
      <template v-slot:body-cell-netamount="props">
        <q-td :props="props">
          {{ formatAmount(props.row.netamount) }}
        </q-td>
      </template>
      <template v-slot:body-cell-paid="props">
        <q-td :props="props">
          {{ formatAmount(props.row.paid) }}
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from "vue";
import { api } from "src/boot/axios";

const createLink = inject("createLink");
import { formatAmount } from "src/helpers/utils";
const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  invoice: {
    type: Boolean,
    default: false,
  },
});

const loading = ref(false);
const transactions = ref([]);

const columns = computed(() => {
  if (props.type === "gl") {
    return [
      {
        name: "reference",
        label: "Reference",
        field: "reference",
        align: "left",
      },
      {
        name: "description",
        label: "Description",
        field: "description",
        align: "left",
      },
      {
        name: "transdate",
        label: "Transaction Date",
        field: "transdate",
        align: "left",
      },
      { name: "notes", label: "Notes", field: "notes", align: "left" },
      {
        name: "department",
        label: "Department",
        field: "department",
        align: "left",
      },
      { name: "curr", label: "Currency", field: "curr", align: "left" },
      {
        name: "exchangerate",
        label: "Exchange Rate",
        field: "exchangerate",
        align: "right",
      },
      { name: "amount", label: "Amount", field: "amount", align: "right" },
    ];
  } else if (props.type === "ar" || props.type === "ap") {
    return [
      {
        name: "invnumber",
        label: "Invoice Number",
        field: "invnumber",
        align: "left",
      },
      { name: "name", label: "Name", field: "name", align: "left" },

      {
        name: "description",
        label: "Description",
        field: "description",
        align: "left",
      },
      {
        name: "transdate",
        label: "Transaction Date",
        field: "transdate",
        align: "left",
      },
      {
        name: "department",
        label: "Department",
        field: "department",
        align: "left",
      },
      {
        name: "netamount",
        label: "Net Amount",
        field: "netamount",
        align: "right",
      },
      { name: "paid", label: "Paid", field: "paid", align: "right" },
    ];
  }
  return [];
});

const fetchTransactions = async () => {
  loading.value = true;
  try {
    const response = await api.get(
      `/last_transactions/${props.type}?invoice=${props.invoice}`
    );
    transactions.value = response.data;
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
  } finally {
    loading.value = false;
  }
};
// Return router path based on row type
const getPath = (row) => {
  let path = "";
  if (props.type.type === "gl") {
    path = createLink("gl.transaction");
  } else if (props.type === "ar") {
    path = row.till
      ? createLink("customer.pos")
      : row.invoice
      ? createLink("customer.invoice")
      : createLink("customer.transaction");
  } else if (row.type === "ap") {
    path = row.invoice
      ? createLink("vendor.invoice")
      : createLink("vendor.transaction");
  }
  return {
    path,
    query: {
      id: row.id,
    },
  };
};
onMounted(() => {
  fetchTransactions();
});

defineExpose({
  fetchTransactions,
});
</script>
