<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm container hide-print">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="container-bg"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <!-- Loading indicator shown inside params section when fetching -->
        <div v-if="loading" class="q-mt-xs q-py-xs text-center">
          <q-spinner-dots color="primary" size="30px" />
        </div>

        <!-- Basic Info Section -->
        <div class="flex-container q-mt-md">
          <s-select
            v-model="formData.customer"
            :label="partyListLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            :options="customers"
            search="label"
            option-label="label"
          />
          <text-input
            v-model="formData.customernumber"
            class="lightbg"
            :label="partyNumberLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <text-input
            v-model="formData.invnumber"
            class="lightbg"
            :label="t('Invoice Number')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <text-input
            v-model="formData.description"
            class="lightbg col-5"
            :label="t('Description')"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
          <text-input
            v-model="formData.transdatefrom"
            type="date"
            :label="t('Transaction Date From')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-4"
            outlined
            dense
          />
          <text-input
            v-model="formData.transdateto"
            type="date"
            :label="t('Transaction Date To')"
            input-class="maintext"
            label-color="secondary"
            class="lightbg col-4"
            outlined
            dense
          />
        </div>

        <!-- Status Toggles -->
        <div class="row q-mt-sm q-gutter-sm">
          <q-toggle
            :model-value="formData.open === 1"
            @update:model-value="(val) => (formData.open = val ? 1 : 0)"
            :label="t('Open')"
            color="primary"
          />
          <q-toggle
            :model-value="formData.closed === 1"
            @update:model-value="(val) => (formData.closed = val ? 1 : 0)"
            :label="t('Closed')"
            color="primary"
          />

          <q-toggle
            :model-value="formData.emailed === 1"
            @update:model-value="(val) => (formData.emailed = val ? 1 : 0)"
            :label="t('Emailed')"
            color="primary"
          />
          <q-toggle
            :model-value="formData.notemailed === 1"
            @update:model-value="(val) => (formData.notemailed = val ? 1 : 0)"
            :label="t('Not Emailed')"
            color="primary"
          />
        </div>

        <div class="row justify-end">
          <s-button type="clear" @click="clearForm" class="q-mr-sm" />

          <s-button type="search" @click="search" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Results Table -->
    <div v-if="results.length > 0">
      <!-- Bulk Actions (visible when one or more rows are selected) -->
      <div class="row q-mb-sm hide-print" v-if="selected.length"></div>

      <div class="row q-mb-sm hide-print">
        <q-btn
          :label="t('Email')"
          @click="openEmailDialog"
          class="q-mr-sm"
          color="primary"
        />
        <q-btn
          :label="t('Print')"
          @click="openPrintDialog"
          class="q-mr-sm"
          color="secondary"
        />
        <q-btn
          :label="t('Mark As Sent')"
          @click="updateStatus('sent')"
          class="q-mr-sm"
          color="positive"
          :disable="selected.length === 0"
        />
        <q-btn
          :label="t('Mark As Unsent')"
          @click="updateStatus('unsent')"
          class="q-mr-sm"
          color="warning"
          :disable="selected.length === 0"
        />
      </div>
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
        selection="multiple"
        v-model:selected="selected"
      >
        <!-- Invoice Number Column -->
        <template v-slot:body-cell-invnumber="props">
          <q-td :props="props">
            <router-link :to="getPath(props.row)" class="text-primary">
              {{ props.row.invnumber }}
            </router-link>
          </q-td>
        </template>

        <!-- Description Column -->
        <template v-slot:body-cell-description="props">
          <q-td :props="props">
            <div class="wrapped-description">
              {{ props.row.description }}
            </div>
          </q-td>
        </template>

        <!-- Amount Column -->
        <template v-slot:body-cell-amount="props">
          <q-td :props="props">{{ formatAmount(props.row.amount) }}</q-td>
        </template>
      </q-table>
    </div>

    <!-- Email Dialog -->
    <q-dialog v-model="emailDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ t("Email Invoices") }}</div>
        </q-card-section>
        <q-card-section>
          <text-input
            v-model="emailData.adminemail"
            :label="t('Admin Email')"
            outlined
            dense
            class="q-mb-md"
          />
          <text-input
            v-model="emailData.jobtype"
            :label="t('Batch Name')"
            outlined
            dense
            class="q-mb-md"
          />
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-select
                v-model="emailData.attachment"
                :label="t('Attachment')"
                :options="attachmentOptions"
                outlined
                dense
                map-options
                emit-value
              />
            </div>
            <div class="col-6">
              <q-checkbox v-model="emailData.inline" :label="t('Inline')" />
            </div>
          </div>
          <text-input
            v-model="emailData.message"
            :label="t('Message')"
            type="textarea"
            outlined
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="t('Cancel')" color="negative" v-close-popup />
          <q-btn
            flat
            :label="t('Send')"
            color="primary"
            @click="sendEmailBatch"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Print Dialog -->
    <q-dialog v-model="printDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ t("Batch Print Invoices") }}</div>
        </q-card-section>
        <q-card-section>
          <text-input
            v-model="printData.jobtype"
            :label="t('Batch Name')"
            outlined
            dense
            class="q-mb-md"
          />
          <text-input
            v-model="printData.adminemail"
            :label="t('Admin Email')"
            outlined
            dense
            class="q-mb-md"
          />
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-select
                v-model="printData.attachment"
                :label="t('Attachment')"
                :options="formatOptions"
                outlined
                dense
                map-options
                emit-value
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="t('Cancel')" color="negative" v-close-popup />
          <q-btn
            flat
            :label="t('Print')"
            color="primary"
            @click="sendPrintBatch"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from "vue";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { LocalStorage, Notify } from "quasar";
import { useI18n } from "vue-i18n";
import { formatAmount, downloadReport, createPDF } from "src/helpers/utils";
const createLink = inject("createLink");

const { t } = useI18n();
const updateTitle = inject("updateTitle");
const route = useRoute();

// Initialize the type based on route param ("customer" or "vendor")
const type = ref(route.params.type || "customer");

// Computed labels for party selection and number
const partyListLabel = computed(() =>
  type.value === "customer" ? t("Customers") : t("Vendors")
);
const partyNumberLabel = computed(() =>
  type.value === "customer" ? t("Customer Number") : t("Vendor Number")
);

// Form data (with defaults)
const formData = ref({
  customer: "",
  customer_id: "",
  invnumber: "",
  description: "",
  transdatefrom: "",
  transdateto: "",
  open: 1,
  closed: 0,
  onhold: 0,
  emailed: 0,
  notemailed: 1,
});

const filtersOpen = route.query.search == 1 ? ref(false) : ref(true);
const results = ref([]);
const totals = ref({});
const loading = ref(false);

const columns = ref([
  {
    name: "transdate",
    label: t("Date"),
    field: "transdate",
    align: "left",
    sortable: true,
  },
  {
    name: "invnumber",
    label: t("Invoice"),
    field: "invnumber",
    align: "left",
    sortable: true,
  },
  {
    name: "emailed",
    label: t("Emailed"),
    field: "emailed",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: t("Name"),
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "vcnumber",
    label: t("Number"),
    field: "vcnumber",
    align: "left",
    sortable: true,
  },
  {
    name: "email",
    label: t("Email"),
    field: "email",
    align: "left",
    sortable: true,
  },
  {
    name: "city",
    label: t("City"),
    field: "city",
    align: "left",
    sortable: true,
  },
  {
    name: "amount",
    label: t("Amount"),
    field: "amount",
    align: "right",
    sortable: true,
  },
]);

const customers = ref([]);
const fetchCustomers = async () => {
  try {
    const response = await api.get(`/arap/list/${type.value}`);
    customers.value = response.data;
  } catch (error) {
    console.error(error);
    Notify.create({
      message:
        error.response?.data?.message || t("Error fetching") + " " + type.value,
      type: "negative",
      position: "center",
    });
  }
};

const flattenParams = (obj, prefix = "") => {
  const flattened = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (key === "customer" && typeof value === "object") {
      if (value.id) {
        flattened["customer_id"] = value.id;
      }
    } else if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenParams(value, prefix ? `${prefix}[${key}]` : key)
      );
    } else {
      const paramKey = prefix ? `${prefix}[${key}]` : key;
      flattened[paramKey] = value;
    }
  });
  return flattened;
};

const loadParams = () => {
  const query = route.query;

  if (query.customernumber) {
    const cust = customers.value.find(
      (c) =>
        c.customernumber.toLowerCase() === query.customernumber.toLowerCase()
    );
    formData.value.customer = cust || query.customer;
  }

  const simpleParams = [
    "invnumber",
    "description",
    "transdatefrom",
    "transdateto",
  ];

  simpleParams.forEach((key) => {
    if (query[key]) {
      formData.value[key] = query[key];
    }
  });

  if (query.search === "1") {
    search();
  }
};

const search = async () => {
  loading.value = true;
  try {
    const params = flattenParams(formData.value);
    const response = await api.get(`/arap/batch/${type.value}/invoice`, {
      params,
    });
    filtersOpen.value = false;
    results.value = response.data;
  } catch (error) {
    console.error(error);
    Notify.create({
      message: error.response?.data?.message || t("Error performing search"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const clearForm = () => {
  Object.keys(formData.value).forEach((key) => {
    if (key === "open") {
      formData.value[key] = 1;
    } else if (key === "closed" || key === "onhold" || key === "emailed") {
      formData.value[key] = 0;
    } else if (key === "notemailed") {
      formData.value[key] = 1;
    } else {
      formData.value[key] = "";
    }
  });
};

const getPath = (row) => {
  let path = "";
  if (row.invoice) {
    path =
      type.value === "customer"
        ? createLink("customer.invoice")
        : createLink("vendor.invoice");
  } else {
    path = createLink(`${type.value}.transaction`);
  }
  const flatParams = flattenParams(formData.value);
  return {
    path,
    query: {
      id: row.id,
      ...flatParams,
      callback: createLink("base") + `/arap/batch/${type.value}/invoice/`,
    },
  };
};

const downloadExcel = () => {
  downloadReport(results.value, columns.value, totals.value);
};

const title = inject("title");
const downloadPDF = () => {
  const params = {};
  createPDF(results.value, columns.value, totals.value, title.value, params);
};

const emailDialog = ref(false);
const printDialog = ref(false);
const emailData = ref({
  adminemail: "",
  jobtype: "",
  attachment: "tex",
  inline: false,
  message: "",
});

// Attachment options for the email dialog
const attachmentOptions = [
  { label: t("None"), value: "none" },
  { label: t("TEX"), value: "tex" },
  { label: t("HTML"), value: "html" },
];

// Format options for the print dialog
const formatOptions = [
  { label: t("TEX"), value: "tex" },
  { label: t("HTML"), value: "html" },
];

const printData = ref({
  jobtype: "",
  attachment: "tex",
  adminemail: "",
});

const selected = ref([]);

const openEmailDialog = () => {
  const rowsToEmail =
    selected.value.length > 0 ? selected.value : results.value;

  if (rowsToEmail.length === 0) {
    Notify.create({
      message: t("No transactions to email."),
      position: "center",
      color: "negative",
    });
    return;
  }

  // Check for missing emails in transactions
  const missingEmails = rowsToEmail.filter(
    (row) => !row.email || row.email.trim() === ""
  );

  if (missingEmails.length > 0) {
    // Create notification message
    const invoiceList = missingEmails
      .map((row) => {
        const name = row.name || "";
        const invnumber = row.invnumber || row.id;
        return `${name}/${invnumber}`;
      })
      .join(", ");
    Notify.create({
      message: t("Missing email address for: {invoiceList}.", { invoiceList }),
      position: "center",
      color: "negative",
      timeout: 5000,
    });
    return;
  }

  // Set default jobtype with today's date
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  emailData.value.jobtype = t("Invoice Batch {date}", { date: formattedDate });

  emailDialog.value = true;
};

// Send email batch
const sendEmailBatch = async () => {
  try {
    const rowsToEmail =
      selected.value.length > 0 ? selected.value : results.value;

    // Create emails array from transactions
    const emails = rowsToEmail.map((row) => ({
      id: row.id,
      type: "invoice",
      email: row.email,
      name: row.name,
      invnumber: row.invnumber,
    }));

    // Create the final object
    const batchData = {
      attachment: emailData.value.attachment,
      inline: emailData.value.inline,
      message: emailData.value.message,
      jobtype: emailData.value.jobtype,
      adminemail: emailData.value.adminemail,
      emails: emails,
      vc: type.value,
    };

    // Post to create_email_batch endpoint
    const response = await api.post("/create_email_batch", batchData);

    // Close the dialog
    emailDialog.value = false;

    // Show success notification
    Notify.create({
      message: t("Email batch created successfully"),
      position: "center",
      color: "positive",
    });
  } catch (error) {
    console.error("Error creating email batch:", error);
    Notify.create({
      message: t("Error creating email batch"),
      position: "center",
      color: "negative",
    });
  }
};

// Open print dialog
const openPrintDialog = () => {
  const rowsToPrint =
    selected.value.length > 0 ? selected.value : results.value;

  if (rowsToPrint.length === 0) {
    Notify.create({
      message: t("No transactions to print"),
      position: "center",
      color: "negative",
    });
    return;
  }

  // Set default jobtype with today's date
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];
  printData.value.jobtype = t("Invoice Batch Print {date}", {
    date: formattedDate,
  });

  printDialog.value = true;
};

// Send print batch
const sendPrintBatch = async () => {
  try {
    const rowsToPrint =
      selected.value.length > 0 ? selected.value : results.value;

    // Create emails array from transactions
    const emails = rowsToPrint.map((row) => ({
      id: row.id,
      type: "invoice",
      email: row.email,
      name: row.name,
      invnumber: row.invnumber,
    }));

    // Create the final object
    const batchData = {
      attachment: printData.value.attachment,
      jobtype: printData.value.jobtype,
      adminemail: printData.value.adminemail,
      emails: emails,
      vc: type.value,
    };

    // Post to create_pdf_batch endpoint
    const response = await api.post("/create_pdf_batch", batchData);

    // Close the dialog
    printDialog.value = false;

    // Show success notification
    Notify.create({
      message: t("Print batch created successfully"),
      position: "center",
      color: "positive",
    });
  } catch (error) {
    console.error("Error creating print batch:", error);
    Notify.create({
      message: t("Error creating print batch"),
      position: "center",
      color: "negative",
    });
  }
};

// Watch for changes in selection and reset highlighting when selection is cleared
watch(
  selected,
  (newVal) => {
    if (newVal.length === 0) {
      // Reset highlight on all rows when selection is cleared
      results.value.forEach((row) => {
        row.highlightMissingEmail = false;
      });
    }
  },
  { deep: true }
);

const updateStatus = async (status) => {
  try {
    const rowsToUpdate =
      selected.value.length > 0 ? selected.value : results.value;

    if (rowsToUpdate.length === 0) {
      Notify.create({
        message: t("No transactions to update"),
        position: "center",
        color: "negative",
      });
      return;
    }

    // Create invoices object with status
    const invoices = {};
    rowsToUpdate.forEach((row) => {
      invoices[row.id] = status;
    });

    // Make API request
    await api.post("/invoice_status", { invoices });

    // Show success notification
    Notify.create({
      message: t("Status updated successfully"),
      position: "center",
      color: "positive",
    });

    // Refresh the results
    await search();
  } catch (error) {
    console.error("Error updating status:", error);
    Notify.create({
      message: t("Error updating status"),
      position: "center",
      color: "negative",
    });
  }
};

onMounted(async () => {
  await fetchCustomers();
  updateTitle(
    type.value === "customer"
      ? "Customer Batch Invoices"
      : "Vendor Batch Invoices"
  );
  loadParams();
});
</script>
