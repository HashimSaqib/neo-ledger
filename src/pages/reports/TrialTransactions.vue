<template>
  <q-page class="lightbg q-px-md q-py-md relative-position">
    <router-link
      :to="{ path: `/reports/trial_balance`, query: formData }"
      class="text-primary q-pa-sm"
    >
      <template v-if="formData.fromdate || formData.todate">
        <span v-if="formData.fromdate">{{
          displayDate(formData.fromdate)
        }}</span>
        <span v-if="formData.fromdate && formData.todate"> - </span>
        <span v-if="formData.todate">{{ displayDate(formData.todate) }}</span>
      </template>
    </router-link>
    <div v-if="filteredResults.length > 0" class="q-mt-sm">
      <q-table
        table-class="mainbg maintext "
        :rows="filteredResults"
        row-key="rowKey"
        :columns="columns"
        flat
        bordered
        dense
        hide-bottom
        rows-per-page-options="0"
      >
        <template v-slot:top="props" class="row">
          <h6 class="q-my-none q-py-none">
            {{ `Account ${accno} - ${description}` }}
          </h6>
          <q-btn
            flat
            round
            dense
            :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            @click="props.toggleFullscreen"
          />
        </template>
        <template v-slot:body="props">
          <q-tr
            :props="props"
            :class="[
              props.row.isTotalRow
                ? 'total-row'
                : props.rowIndex % 2 === 0
                ? 'lightbg'
                : 'mainbg',
            ]"
          >
            <q-td v-for="col in columns" :key="col.name" :props="props">
              <!-- Total Row -->
              <template v-if="props.row.isTotalRow">
                <template v-if="col.name === 'description'">
                  <strong>{{ props.row.description }}</strong>
                </template>
                <template
                  v-else-if="
                    col.name === 'debit' ||
                    col.name === 'credit' ||
                    col.name === 'balance'
                  "
                >
                  <strong>{{ formatAmount(props.row[col.field]) }}</strong>
                </template>
                <template v-else>
                  <!-- Empty cell for other columns -->
                </template>
              </template>

              <!-- Normal Rows -->
              <template v-if="col.name === 'reference'">
                <router-link :to="getPath(props.row)" class="text-primary">
                  {{ props.row.reference }}
                </router-link>
              </template>
              <template v-else>
                <template
                  v-if="
                    col.name === 'debit' ||
                    col.name === 'credit' ||
                    col.name === 'balance'
                  "
                >
                  {{ formatAmount(props.row[col.field]) }}
                </template>
                <template v-else>
                  {{ props.row[col.field] }}
                </template>
              </template>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { api } from "src/boot/axios";
import { formatAmount } from "src/helpers/utils";
import { useRoute } from "vue-router";
import { displayDate } from "src/helpers/utils";
const route = useRoute();

const formData = ref({
  accno: route.query.accno,
  todate: route.query.todate,
  fromdate: route.query.fromdate,
});
const filtersOpen = ref(true);
const results = ref([]);

const showHeadings = ref(false);
const allAccounts = ref(false);

const baseColumns = ref([
  {
    name: "transdate",
    align: "left",
    label: "Date",
    field: "transdate",
    sortable: true,
    slot: true,
    default: true,
  },
  {
    name: "reference",
    align: "left",
    label: "Reference",
    field: "reference",
    default: true,
  },
  {
    name: "description",
    align: "left",
    label: "Description",
    field: "description",
    default: true,
  },
  {
    name: "source",
    align: "left",
    label: "Source",
    field: "source",
    default: true,
  },
  {
    name: "cleared",
    align: "left",
    label: "R",
    field: "cleared",
    default: true,
  },
  {
    name: "debit",
    align: "left",
    label: "Debit",
    field: "debit",
    default: true,
  },
  {
    name: "credit",
    align: "left",
    label: "Credit",
    field: "credit",
    default: true,
  },
  {
    name: "balance",
    align: "left",
    label: "Balance",
    field: "balance",
    default: true,
  },
]);

const selectedColumns = ref(
  baseColumns.value.reduce((acc, column) => {
    acc[column.name] = column.default;
    return acc;
  }, {})
);

// Filtered columns based on selected checkboxes
const columns = computed(() => {
  return baseColumns.value.filter(
    (column) => selectedColumns.value[column.name]
  );
});

function formatRow(result) {
  const formatted = {};

  // Include selected columns
  Object.keys(selectedColumns.value).forEach((key) => {
    if (selectedColumns.value[key]) {
      formatted[key] = result[key];
    }
  });

  // Always include necessary fields for rendering
  formatted.charttype = result.charttype;
  formatted.type = result.module;
  formatted.id = result.id;
  formatted.till = result.till;
  formatted.accno = result.accno;
  formatted.rowKey = result.id;

  return formatted;
}

// Computed property to process results using formatRow
const filteredResults = computed(() => {
  let balance = 0;
  let totalDebits = 0;
  let totalCredits = 0;

  const processedResults = results.value.map((result) => {
    const formatted = formatRow(result);

    // Parse debit and credit as numbers
    const debit = parseFloat(formatted.debit) || 0;
    const credit = parseFloat(formatted.credit) || 0;

    // Update totals
    totalDebits += debit;
    totalCredits += credit;

    // Update balance
    balance += debit - credit;
    formatted.balance = balance;

    return formatted;
  });

  // Add total row at the end
  processedResults.push({
    description: "Total",
    debit: totalDebits,
    credit: totalCredits,
    balance: balance,
    isTotalRow: true,
    rowKey: "total-row",
  });

  return processedResults;
});

const accno = ref("");
const description = ref("");
const search = async () => {
  try {
    const response = await api.get("/reports/transactions", {
      params: formData.value,
    });
    filtersOpen.value = false;
    results.value = response.data.transactions;
    accno.value = response.data.accno;
    description.value = response.data.description;
    console.log(results.value);
  } catch (error) {
    console.error(error);
  }
};

const getPath = (row) => {
  let path = "";

  if (row.type === "gl") {
    path = "/gl/add-gl";
  } else if (row.type === "is") {
    if (row.till) {
      path = "/pos/sale";
    } else {
      path = "/ar/sales-invoice";
    }
  } else if (row.type === "ir") {
    path = "/ap/vendor-invoice";
  }

  return { path, query: { id: row.id } };
};

onMounted(() => {
  search();
});
</script>
