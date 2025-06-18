<template>
  <q-page class="q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm hide-print">
      <q-expansion-item :label="t('Search Params')" v-model="filtersOpen">
        <!-- Loading indicator shown inside params section when fetching -->
        <div v-if="loading" class="q-mt-xs q-py-xs text-center">
          <q-spinner-dots color="primary" size="30px" />
        </div>

        <!-- Search Parameters Section -->
        <div class="row q-my-xs q-gutter-sm">
          <s-select
            v-if="departments.length > 0"
            v-model="formData.department"
            emit-value
            map-options
            class="col-3"
            :label="t('Department')"
            option-label="description"
            search="description"
            option-value="value"
            :options="departments"
            outlined
            dense
          />
          <s-select
            v-if="vcOptions.length > 0"
            v-model="
              formData[route.params.vc === 'customer' ? 'customer' : 'vendor']
            "
            emit-value
            map-options
            class="col-3"
            :label="vcLabel"
            option-label="label"
            option-value="value"
            :options="vcOptions"
            outlined
            dense
            search="label"
          />
          <q-select
            v-if="accounts.length > 0"
            v-model="formData.account"
            emit-value
            map-options
            class="col-3"
            :label="t('Account')"
            option-label="label"
            option-value="value"
            :options="accounts"
            outlined
            dense
          />
          <q-select
            v-if="currencies.length > 0"
            v-model="formData.currency"
            emit-value
            map-options
            class="col-3"
            :label="t('Currency')"
            option-label="curr"
            option-value="curr"
            :options="currencies"
            outlined
            dense
          />
          <q-input
            v-model="formData.fromdate"
            type="date"
            :label="t('From Date')"
            label-color="secondary"
            class="col-3"
            outlined
            dense
          />
          <q-input
            v-model="formData.todate"
            type="date"
            :label="t('To Date')"
            label-color="secondary"
            class="col-3"
            outlined
            dense
          />
        </div>

        <div class="row q-mt-sm q-gutter-x-sm">
          <q-btn
            type="submit"
            :label="t('Search')"
            color="primary"
            @click="search"
          />
          <q-btn :label="t('Clear')" @click="clearForm" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Results Table -->
    <div v-if="results.length > 0">
      <!-- Table for results -->
      <q-table
        class="q-mt-sm"
        :rows="results"
        row-key="id"
        :columns="columns"
        flat
        bordered
        dense
        :rows-per-page-options="[0]"
        virtual-scroll-sticky-end
        hide-bottom
      >
        <!-- Invoice Number Column -->
        <template v-slot:body-cell-invnumber="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.invnumber }}
            </router-link>
          </q-td>
        </template>

        <!-- Name Column -->
        <template v-slot:body-cell-name="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.name }}
            </router-link>
          </q-td>
        </template>

        <!-- Amount Column -->
        <template v-slot:body-cell-amount="props">
          <q-td :props="props" class="text-right">
            {{ formatAmount(props.row.amount) }}
          </q-td>
        </template>

        <!-- Paid Column -->
        <template v-slot:body-cell-paid="props">
          <q-td :props="props">
            <fn-input
              v-model="props.row.paid"
              dense
              outlined
              :label="t('Paid')"
            />
          </q-td>
        </template>

        <!-- Due Column -->
        <template v-slot:body-cell-due="props">
          <q-td :props="props" class="text-right">
            {{ formatAmount(props.row.due) }}
          </q-td>
        </template>

        <!-- Select Column -->
        <template v-slot:body-cell-select="props">
          <q-td :props="props">
            <q-checkbox v-model="selectedRows" :val="props.row" />
          </q-td>
        </template>

        <!-- Memo Column -->
        <template v-slot:body-cell-memo="props">
          <q-td :props="props">
            <q-input v-model="props.row.memo" dense outlined />
          </q-td>
        </template>

        <!-- Source Column -->
        <template v-slot:body-cell-source="props">
          <q-td :props="props">
            <q-input v-model="props.row.source" dense outlined />
          </q-td>
        </template>

        <!-- Select All Column -->
        <template v-slot:header-cell-select="props">
          <q-th :props="props">
            <q-checkbox v-model="allSelected" />
          </q-th>
        </template>
      </q-table>

      <!-- Add Post Button -->
      <div class="row q-mt-md q-gutter-x-sm">
        <q-input
          v-if="!paymentsMode"
          v-model="formData.paymentSource"
          :label="t('Source')"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-if="!paymentsMode"
          v-model="formData.paymentMemo"
          :label="t('Memo')"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
        />
        <q-input
          v-model="formData.paymentDate"
          :label="t('Payment Date')"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          type="date"
          :min="
            closedto
              ? new Date(new Date(closedto).getTime() + 86400000)
                  .toISOString()
                  .split('T')[0]
              : undefined
          "
        />
        <s-select
          v-if="paymentAccounts.length > 0"
          v-model="formData.paymentAccount"
          :label="t('Payment Account')"
          :options="paymentAccounts"
          outlined
          label-color="secondary"
          dense
        />
        <q-btn
          color="primary"
          :label="t('Post')"
          @click="postPayments"
          :disable="selectedRows.length === 0"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, inject, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { formatAmount } from "src/helpers/utils";

const route = useRoute();
const { t } = useI18n();
const $q = useQuasar();
const updateTitle = inject("updateTitle");
const createLink = inject("createLink");

// State
const loading = ref(false);
const filtersOpen = ref(true);
const departments = ref([]);
const customers = ref([]);
const vendors = ref([]);
const accounts = ref([]);
const paymentAccounts = ref([]);
const currencies = ref([]);
const results = ref([]);
const closedto = ref(null);
const formData = ref({
  department: null,
  fromdate: null,
  todate: null,
  customer: null,
  vendor: null,
  account: null,
  currency: null,
  paymentAccount: null,
  paymentDate: new Date().toISOString().split("T")[0],
  paymentSource: null,
  paymentMemo: null,
});
const paymentsMode = ref(false);
// Computed
const pageTitle = computed(() => {
  return route.params.vc === "customer" ? "Receipts" : "Payments";
});

// Computed for party selection based on vc
const vcOptions = computed(() => {
  return route.params.vc === "customer" ? customers.value : vendors.value;
});

const vcLabel = computed(() => {
  return route.params.vc === "customer" ? t("Customer") : t("Vendor");
});

// Add new state for selected rows
const selectedRows = ref([]);

// Add computed for select all
const allSelected = computed({
  get: () => selectedRows.value.length === results.value.length,
  set: (val) => {
    if (val) {
      selectedRows.value = [...results.value];
      // Copy due to paid for rows that don't have paid amount
      results.value.forEach((row) => {
        if (!row.paid) {
          row.paid = row.due;
        }
      });
    } else {
      selectedRows.value = [];
      // Clear paid amounts for all rows
      results.value.forEach((row) => {
        row.paid = null;
      });
    }
  },
});

// Columns definition
const columns = ref([]);

const updateColumns = () => {
  const baseColumns = [
    {
      name: "name",
      label: t(route.params.vc === "customer" ? "Customer" : "Vendor"),
      field: "name",
      align: "left",
    },
    {
      name: "customernumber",
      label: t(
        route.params.vc === "customer" ? "Customer Number" : "Vendor Number"
      ),
      field: "customernumber",
      align: "left",
    },
    {
      name: "amount",
      label: t("Amount"),
      field: "amount",
      align: "right",
    },
    {
      name: "due",
      label: t("Due"),
      field: "due",
      align: "right",
    },
    {
      name: "select",
      label: "",
      field: "select",
      align: "center",
      style: "width: 50px",
    },
    {
      name: "paid",
      label: t("Paid"),
      field: "paid",
      align: "left",
    },
    {
      name: "memo",
      label: t("Memo"),
      field: "memo",
      align: "left",
    },
    {
      name: "source",
      label: t("Source"),
      field: "source",
      align: "left",
    },
  ];

  const noSelectionColumns = [
    {
      name: "invnumber",
      label: t("Invoice #"),
      field: "invnumber",
      align: "left",
    },
    {
      name: "invdescription",
      label: t("Description"),
      field: "invdescription",
      align: "left",
    },
    {
      name: "transdate",
      label: t("Date"),
      field: "transdate",
      align: "left",
    },
    {
      name: "duedate",
      label: t("Due Date"),
      field: "duedate",
      align: "left",
    },
    {
      name: "amount",
      label: t("Amount"),
      field: "amount",
      align: "right",
    },
    {
      name: "due",
      label: t("Due"),
      field: "due",
      align: "right",
    },
    {
      name: "select",
      label: "",
      field: "select",
      align: "center",
      style: "width: 50px",
    },
    {
      name: "paid",
      label: t("Paid"),
      field: "paid",
      align: "left",
    },
  ];

  columns.value =
    formData.value.customer || formData.value.vendor
      ? noSelectionColumns
      : baseColumns;
};

// Add watch for selectedRows changes
watch(
  selectedRows,
  (newVal, oldVal) => {
    // Handle newly selected rows
    newVal.forEach((row) => {
      if (!oldVal.includes(row) && !row.paid) {
        row.paid = row.due;
      }
    });

    // Handle newly unselected rows
    oldVal.forEach((row) => {
      if (!newVal.includes(row)) {
        row.paid = null;
      }
    });
  },
  { deep: true }
);

// Methods
const create_links = async () => {
  try {
    const response = await api.get("/create_links/payments");
    departments.value = response.data.departments || [];
    customers.value = response.data.customers || [];
    vendors.value = response.data.vendors || [];
    currencies.value = response.data.currencies || [];
    closedto.value = response.data.closedto || null;
    const ARAP = route.params.vc === "customer" ? "AR" : "AP";
    paymentAccounts.value = response.data.accounts.all.filter((account) =>
      account.link?.split(":").includes(`${ARAP}_paid`)
    );
    // Set default currency if available
    if (currencies.value.length > 0) {
      formData.value.currency =
        currencies.value.find((c) => c.rn === 1)?.id || null;
    }
  } catch (error) {
    console.error("Error fetching initial data:", error);
    $q.notify({
      message: error.response?.data?.message || "Error fetching initial data",
      type: "negative",
      position: "center",
    });
    ok;
  }
};

const getPath = (row) => {
  const path =
    route.params.vc === "customer"
      ? createLink(
          row.invoice === 1 ? "customer.invoice" : "customer.transaction"
        )
      : createLink(row.invoice === 1 ? "vendor.invoice" : "vendor.transaction");

  return {
    path,
    query: {
      id: row.id,
    },
  };
};

const search = async () => {
  try {
    loading.value = true;
    // Create params object with only the needed fields
    const params = {
      department: formData.value.department,
    };

    // Add customer or vendor based on VC type
    if (route.params.vc === "customer" && formData.value.customer) {
      params.customer_id = formData.value.customer.id;
    } else if (route.params.vc === "vendor" && formData.value.vendor) {
      params.vendor_id = formData.value.vendor.id;
    }
    if (params.vendor_id || params.customer_id) {
      paymentsMode.value = false;
      params.payment = "";
    } else {
      paymentsMode.value = true;
      params.payment = "payments";
    }
    const response = await api.get(`/open_invoices/${route.params.vc}`, {
      params,
    });

    if (params.vendor_id || params.customer_id) {
      // If specific customer/vendor selected, show individual transactions
      results.value = response.data.map((row) => {
        row.due = row.amount - (row.paid || 0); // Calculate due correctly
        row.paid = null; // Clear paid amount for UI
        return row;
      });
    } else {
      // Group by customer/vendor when no specific selection
      const groupedResults = response.data.reduce((acc, row) => {
        console.log(row);
        const key = row.name;
        const isCustomer = route.params.vc === "customer";
        const numberField = isCustomer ? "customernumber" : "vendornumber";
        const idField = isCustomer ? "customer_id" : "vendor_id";

        if (!acc[key]) {
          acc[key] = {
            name: row.name,
            vc_number: row[numberField],
            vc_id: row[idField],
            amount: 0,
            due: 0,
            paid: null, // Initialize paid as null for UI
            memo: "",
            source: "",
            invoices: [], // Add array to store individual invoice details
          };
        }
        acc[key].amount += parseFloat(row.amount) || 0;
        acc[key].due += parseFloat(row.amount - (row.paid || 0)) || 0; // Calculate due correctly
        // Store individual invoice details
        acc[key].invoices.push({
          id: row.id,
          invnumber: row.invnumber,
          transdate: row.transdate,
          amount: parseFloat(row.amount) || 0,
          paid: null, // Don't show paid amount in UI
        });
        return acc;
      }, {});

      results.value = Object.values(groupedResults);
    }

    updateColumns();
  } catch (error) {
    console.error("Error fetching data:", error);
    $q.notify({
      type: "negative",
      message: t("Error fetching data"),
    });
  } finally {
    loading.value = false;
  }
};

const clearForm = () => {
  formData.value = {
    department: null,
    fromdate: null,
    todate: null,
    customer: null,
    vendor: null,
    account: null,
    currency: null,
  };
};
// Update postPayments method
const postPayments = async () => {
  try {
    const payments = [];

    if (!paymentsMode.value) {
      // Scenario 1: Individual transactions (payments = false)
      selectedRows.value.forEach((row) => {
        payments.push({
          id: row.id,
          invnumber: row.invnumber,
          paid: row.paid,
          source: formData.value.paymentSource || "",
          memo: formData.value.paymentMemo || "",
        });
      });
    } else {
      // Scenario 2: Grouped transactions (payments = true)
      selectedRows.value.forEach((group) => {
        const customerPayments = {
          vc_id: group.vc_id,
          vc_number: group.vc_number,
          total_amount: group.paid,
          source: group.source || "",
          memo: group.memo || "",
          invoices: [],
        };

        // Add all invoices for this customer
        if (group.invoices && Array.isArray(group.invoices)) {
          group.invoices.forEach((invoice) => {
            customerPayments.invoices.push({
              id: invoice.id,
              invnumber: invoice.invnumber,
              paid: invoice.amount,
            });
          });
        }

        payments.push(customerPayments);
      });
    }

    const method = paymentsMode.value ? "group" : "individual";
    const paymentData = {
      account: formData.value.paymentAccount.label,
      date: formData.value.paymentDate,
      method: method,
      payments: payments,
      // Add optional fields if they exist
      ...(formData.value.currency && { currency: formData.value.currency }),
      ...(formData.value.exchangerate && {
        exchangerate: formData.value.exchangerate,
      }),
      ...(formData.value.paymentmethod && {
        paymentmethod: formData.value.paymentmethod,
      }),
      ...(formData.value.paymentSource && {
        source: formData.value.paymentSource,
      }),
      ...(formData.value.paymentMemo && { memo: formData.value.paymentMemo }),
    };

    console.log("Posting payment data:", paymentData);

    // Make the actual API call
    const response = await api.post(
      `/open_invoices/${route.params.vc}`,
      paymentData
    );

    // Show success notification
    $q.notify({
      message: response.data.message || "Payment(s) posted successfully",
      type: "positive",
      position: "center",
      timeout: 3000,
    });

    // Log success details
    console.log("Payment posted successfully:", response.data);

    // Clear selected rows
    selectedRows.value = [];

    // Clear paid, source, and memo fields in all rows
    results.value.forEach((row) => {
      row.paid = null;
      if (row.source) row.source = "";
      if (row.memo) row.memo = "";
    });

    // Refresh the data by calling search again
    await search();
  } catch (error) {
    console.error("Error posting payments:", error);

    // Extract error message from response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Error posting payments";

    $q.notify({
      message: errorMessage,
      type: "negative",
      position: "center",
      timeout: 5000,
    });
  }
};

// Lifecycle hooks
onMounted(async () => {
  updateTitle(pageTitle.value);
  await create_links();
  updateColumns(); // Initialize columns on mount
});
</script>

<style scoped>
.lightbg {
  background-color: var(--q-primary-light);
}
.mainbg {
  background-color: var(--q-primary);
}
.maintext {
  color: var(--q-primary-text);
}
</style>
