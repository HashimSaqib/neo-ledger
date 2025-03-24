<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <q-form @submit.prevent class="q-px-lg q-py-md mainbg q-mb-md">
      <div class="row items-center q-gutter-md q-mb-md">
        <q-input
          v-model="formData.fromdate"
          type="date"
          :label="t('Date From')"
          input-class="maintext"
          label-color="secondary"
          class="lightbg col-4"
          outlined
          dense
        />
        <q-input
          v-model="formData.todate"
          type="date"
          :label="t('Date To')"
          input-class="maintext"
          label-color="secondary"
          class="lightbg col-4"
          outlined
          dense
        />
        <q-btn
          type="submit"
          :label="t('Search')"
          color="primary"
          class="col-2"
          @click="search"
        />
      </div>
      <div class="row q-gutter-md items-center">
        <q-checkbox
          size="2rem"
          v-model="showHeadings"
          :label="t('Headings')"
          color="primary"
          class="maintext"
        />
        <q-checkbox
          size="2rem"
          v-model="allAccounts"
          :label="t('All Accounts')"
          color="primary"
          class="maintext"
        />
      </div>
    </q-form>

    <div v-if="filteredResults.length > 0">
      <q-table
        table-class="mainbg maintext"
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
              props.row.charttype === 'H' || props.row.charttype === 'S'
                ? 'mutedbg text-bold'
                : '',
              props.row.charttype !== 'H' && props.row.charttype !== 'S'
                ? props.rowIndex % 2 === 0
                  ? 'lightbg'
                  : 'mainbg'
                : '',
            ]"
          >
            <q-td v-for="col in columns" :key="col.name" :props="props">
              <!-- Heading and Subtotal Rows -->
              <template
                v-if="
                  props.row.charttype === 'H' || props.row.charttype === 'S'
                "
              >
                <template v-if="col.name === 'description'">
                  {{ props.row.description }}
                </template>
                <template
                  v-else-if="
                    col.name === 'debit' ||
                    col.name === 'credit' ||
                    col.name === 'amount' ||
                    col.name === 'balance'
                  "
                >
                  <template v-if="props.row.charttype === 'S'">
                    {{ formatAmount(props.row[col.field]) }}
                  </template>
                </template>
                <template v-else>
                  <!-- Empty cell for other columns -->
                </template>
              </template>

              <!-- Normal Rows -->
              <template v-else>
                <template v-if="col.name === 'accno'">
                  <router-link :to="getPath(props.row)" class="text-primary">
                    {{ props.row.accno }}
                  </router-link>
                </template>
                <template
                  v-else-if="
                    col.name === 'debit' ||
                    col.name === 'credit' ||
                    col.name === 'amount' ||
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
import { ref, computed, onMounted, inject } from "vue";
import { api } from "src/boot/axios";
import { formatAmount } from "src/helpers/utils";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const route = useRoute();
const formData = ref({
  fromdate: route.query.fromdate,
  todate: route.query.todate,
});
const filtersOpen = ref(true);
const results = ref([]);

const showHeadings = ref(false);
const allAccounts = ref(false);

const baseColumns = ref([
  {
    name: "accno",
    align: "left",
    label: "Account",
    field: "accno",
    sortable: true,
    slot: true,
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
    name: "balance",
    align: "left",
    label: "Beginning Balance",
    field: "balance",
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
    name: "amount",
    align: "left",
    label: "Ending Balance",
    field: "amount",
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
  return baseColumns.value
    .filter((column) => selectedColumns.value[column.name])
    .map((column) => ({
      ...column,
      label: t(column.label),
    }));
});
const filteredResults = computed(() => {
  let filtered = [];

  if (showHeadings.value) {
    // Process results with headings
    let currentHeading = null;
    let accountsUnderHeading = [];

    for (let i = 0; i < results.value.length; i++) {
      const item = results.value[i];

      if (item.charttype === "H") {
        // Process the previous heading and its accounts
        if (currentHeading) {
          // Include headings if 'allAccounts' is true or if accounts exist
          if (allAccounts.value || accountsUnderHeading.length > 0) {
            filtered.push(formatRow(currentHeading)); // Add heading
            filtered.push(...accountsUnderHeading.map(formatRow)); // Add accounts

            // Compute and include subtotal
            const subtotal = computeSubtotal(
              accountsUnderHeading,
              currentHeading.accno
            );
            filtered.push(formatRow(subtotal));
          }
          accountsUnderHeading = []; // Reset for the next heading
        }
        currentHeading = item; // Set the new heading
      } else if (item.charttype === "A") {
        const hasNonZeroValues =
          (item.debit != null && item.debit != 0) ||
          (item.credit != null && item.credit != 0);

        if (allAccounts.value || hasNonZeroValues) {
          accountsUnderHeading.push(item); // Include account based on allAccounts
        }
      }
    }

    // Process the last heading and its accounts
    if (currentHeading) {
      // Include headings if 'allAccounts' is true or if accounts exist
      if (allAccounts.value || accountsUnderHeading.length > 0) {
        filtered.push(formatRow(currentHeading)); // Add heading
        filtered.push(...accountsUnderHeading.map(formatRow)); // Add accounts

        // Compute and include subtotal
        const subtotal = computeSubtotal(
          accountsUnderHeading,
          currentHeading.accno
        );
        filtered.push(formatRow(subtotal));
      }
    }
  } else {
    // Process results without headings
    for (let i = 0; i < results.value.length; i++) {
      const item = results.value[i];

      if (item.charttype === "A") {
        const hasNonZeroValues =
          (item.debit != null && item.debit != 0) ||
          (item.credit != null && item.credit != 0);

        if (allAccounts.value || hasNonZeroValues) {
          filtered.push(formatRow(item)); // Include account directly
        }
      }
    }
  }

  return filtered;
});

function computeSubtotal(accounts, headingAccno) {
  let subtotal = {
    charttype: "S", // 'S' denotes a subtotal row
    description: "Subtotal",
    accno: "subtotal_" + headingAccno, // Unique accno for the subtotal
    debit: 0,
    credit: 0,
    amount: 0,
  };

  accounts.forEach((acc) => {
    subtotal.debit += acc.debit || 0;
    subtotal.credit += acc.credit || 0;
    subtotal.amount += acc.amount || 0;
  });

  return subtotal;
}

function formatRow(result) {
  const formatted = {};

  // Include selected columns
  Object.keys(selectedColumns.value).forEach((key) => {
    if (selectedColumns.value[key]) {
      // Switch sign of 'amount'
      if (key === "amount") {
        formatted[key] = -result[key];
      } else {
        formatted[key] = result[key];
      }
    }
  });

  // Always include necessary fields for rendering
  formatted.charttype = result.charttype;
  formatted.description = result.description;
  formatted.accno = result.accno;
  formatted.rowKey = result.id; // Ensure unique row key

  return formatted;
}

const createLink = inject("createLink");
const getPath = (row) => {
  let path = "";

  path = createLink("trail.transactions");

  return {
    path,
    query: {
      accno: row.accno,
      fromdate: formData.value.fromdate,
      todate: route.query.todate || new Date().toISOString().split("T")[0],
    },
  };
};

onMounted(() => {
  if (route.query.fromdate || route.query.todate) {
    search();
  }
});
const search = async () => {
  try {
    const response = await api.get("/reports/trial_balance", {
      params: formData.value,
    });
    filtersOpen.value = false;
    results.value = response.data;
    console.log(results.value);
  } catch (error) {
    console.error(error);
  }
};
</script>
