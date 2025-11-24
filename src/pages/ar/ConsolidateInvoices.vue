<template>
  <q-page class="q-pa-md relative-position">
    <!-- Loading state -->
    <div v-if="loading" class="full-width flex justify-center q-pa-lg">
      <q-spinner color="primary" size="3em" />
      <span class="q-ml-sm text-primary text-h6">Loading invoices...</span>
    </div>

    <!-- Main content when data is loaded -->
    <div v-else-if="result" class="">
      <!-- Summary card for selected invoices -->
      <q-card v-if="selectedInvoices.length" class="q-mb-md shadow-2">
        <q-card-section class="row items-center">
          <div class="col">
            <div class="text-h6">{{ t("Selected Invoices") }}</div>
            <div class="text-body2">
              {{ selectedInvoices.length }} {{ t("invoice(s)") }}
              {{ t("selected") }}
            </div>
          </div>
          <div class="col text-right">
            <div class="text-subtitle1">{{ t("Total Amount") }}</div>
            <div class="text-h6">{{ formatAmount(selectedTotal) }}</div>
          </div>
          <div class="col-auto q-ml-md">
            <q-btn
              color="primary"
              :label="t('Consolidate Selected')"
              @click="confirmConsolidation"
              :disable="selectedInvoices.length < 2"
              class="q-mr-sm"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Invoices grouped by currency, account, and customer -->
      <div
        v-for="(currencyData, currency) in result"
        :key="currency"
        class="q-mb-lg q-pa-none"
      >
        <q-card class="shadow-1">
          <q-card-section class="lightbg">
            <div class="text-h6 textmain">{{ currency }}</div>
          </q-card-section>

          <div v-for="(accountData, account) in currencyData" :key="account">
            <q-card-section>
              <div
                v-for="(customerInvoices, customerName) in accountData"
                :key="customerName"
                class="q-mb-lg"
              >
                <q-expansion-item
                  expand-separator
                  default-opened
                  class="shadow-1"
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-checkbox
                        :model-value="
                          isAllSelected(currency, account, customerName)
                        "
                        :indeterminate="
                          isPartiallySelected(
                            currency,
                            account,
                            customerName,
                            customerInvoices
                          )
                        "
                        @update:model-value="
                          handleCustomerSelectionToggle(
                            currency,
                            account,
                            customerName,
                            customerInvoices
                          )
                        "
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-subtitle1">{{
                        customerName
                      }}</q-item-label>
                      <q-item-label caption
                        >{{ customerInvoices.length }} invoice(s)</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side>
                      <div class="text-bold text-primary">
                        {{ formatTotalAmount(customerInvoices) }}
                      </div>
                    </q-item-section>
                  </template>

                  <q-card class="q-mt-sm">
                    <q-table
                      :rows="customerInvoices"
                      :columns="columns"
                      row-key="id"
                      :pagination="{ rowsPerPage: 0 }"
                      :rows-per-page-options="[0]"
                      hide-bottom
                      flat
                      dense
                    >
                      <template v-slot:body-cell-select="props">
                        <q-td :props="props">
                          <q-checkbox
                            v-model="selectedInvoices"
                            :val="props.row"
                            color="primary"
                          />
                        </q-td>
                      </template>
                      <template v-slot:body-cell-amount="props">
                        <q-td :props="props" class="text-right">
                          {{ formatAmount(props.value) }}
                        </q-td>
                      </template>
                    </q-table>
                  </q-card>
                </q-expansion-item>
              </div>
            </q-card-section>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="q-pa-lg text-center">
      <q-icon name="inventory_2" size="4rem" color="grey-5" />
      <p class="text-h6 q-mt-md text-grey-7">
        {{ t("No invoices available for consolidation") }}
      </p>
    </div>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirmDialog" persistent>
      <q-card style="min-width: 400px" class="shadow-3">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ t("Confirm Consolidation") }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <p>
            {{ t("Are you sure you want to consolidate") }}
            {{ selectedInvoices.length }} invoices?
          </p>
          <p class="text-bold text-primary">
            {{ t("Total amount") }}: {{ formatAmount(selectedTotal) }}
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Consolidate"
            color="primary"
            @click="handleConsolidateSelected"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "src/boot/axios";
import { formatAmount } from "src/helpers/utils";
import { useQuasar, Notify } from "quasar";

const updateTitle = inject("updateTitle");
updateTitle("Consolidate Invoices");
const { t } = useI18n();
const $q = useQuasar();

// Variables
const loading = ref(false);
const result = ref(null);
const selectedInvoices = ref([]);
const confirmDialog = ref(false);

// Computed properties
const selectedTotal = computed(() => {
  return selectedInvoices.value.reduce(
    (sum, invoice) => sum + invoice.amount,
    0
  );
});

// Table columns
const columns = [
  { name: "select", label: "", field: "select", align: "left" },
  { name: "transdate", label: t("Date"), field: "transdate", align: "left" },
  {
    name: "invnumber",
    label: t("Invoice #"),
    field: "invnumber",
    align: "left",
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  { name: "amount", label: t("Amount"), field: "amount", align: "right" },
];

// Methods
const consolidateInvoices = async () => {
  loading.value = true;
  try {
    const response = await api.get("/invoice/consolidate");
    result.value = response.data;
  } catch (error) {
    console.error("Error loading invoices:", error);
  } finally {
    loading.value = false;
  }
};

const getInvoiceIds = (invoices) => invoices.map((inv) => inv.id);

const isAllSelected = (currency, account, customerName) => {
  if (!result.value?.[currency]?.[account]?.[customerName]) return false;

  const customerInvoices = result.value[currency][account][customerName];
  const customerIds = getInvoiceIds(customerInvoices);
  const selectedIds = getInvoiceIds(selectedInvoices.value);

  return (
    customerInvoices.length > 0 &&
    customerIds.every((id) => selectedIds.includes(id))
  );
};

const isPartiallySelected = (
  currency,
  account,
  customerName,
  customerInvoices
) => {
  const selectedIds = getInvoiceIds(selectedInvoices.value);
  const customerIds = getInvoiceIds(customerInvoices);

  const hasSelected = customerIds.some((id) => selectedIds.includes(id));
  return hasSelected && !isAllSelected(currency, account, customerName);
};

const handleCustomerSelectionToggle = (
  currency,
  account,
  customerName,
  customerInvoices
) => {
  if (isAllSelected(currency, account, customerName)) {
    // Deselect all customer invoices
    selectedInvoices.value = selectedInvoices.value.filter(
      (invoice) => !customerInvoices.some((inv) => inv.id === invoice.id)
    );
  } else {
    // Select all customer invoices
    const currentSelectedIds = new Set(getInvoiceIds(selectedInvoices.value));
    const newSelectedInvoices = [...selectedInvoices.value];

    customerInvoices.forEach((invoice) => {
      if (!currentSelectedIds.has(invoice.id)) {
        newSelectedInvoices.push(invoice);
      }
    });

    selectedInvoices.value = newSelectedInvoices;
  }
};

const formatTotalAmount = (invoices) => {
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  return formatAmount(total);
};

const confirmConsolidation = () => {
  if (selectedInvoices.value.length < 2) {
    Notify.create({
      type: "warning",
      message: "Select at least 2 invoices to consolidate",
      position: "top",
    });
    return;
  }
  confirmDialog.value = true;
};

const handleConsolidateSelected = async () => {
  try {
    const response = await api.post("/invoice/consolidate", {
      ids: selectedInvoices.value.map((inv) => inv.id),
    });

    Notify.create({
      type: "positive",
      message: `Successfully consolidated ${selectedInvoices.value.length} invoices`,
      position: "center",
    });

    // Reset selection and refresh data
    selectedInvoices.value = [];
    await consolidateInvoices();
  } catch (error) {}
};

onMounted(() => {
  consolidateInvoices();
});
</script>

<style lang="scss" scoped></style>
