<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm mainbg">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <div class="row q-mt-none q-gutter-md">
          <s-select
            :label="t('Customer')"
            :options="customers"
            v-model="formData.customer"
            class="lightbg col-6 col-md-3"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            emit-value
            map-options
            option-value="id"
            search="label"
          />
          <s-select
            :label="t('Department')"
            :options="departments"
            v-model="formData.department"
            class="lightbg col-6 col-md-3"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
            option-label="description"
            option-value="id"
            emit-value
            map-options
            search="description"
          />
          <q-btn :label="t('Search')" color="primary" @click.prevent="search" />
        </div>
      </q-expansion-item>
    </q-form>

    <!-- Bulk Update Buttons (visible when one or more rows are selected) -->
    <div class="row q-mb-sm hide-print" v-if="selected.length">
      <q-btn
        :label="t('One Level Up')"
        @click="bulkUpdate('up')"
        class="q-mr-sm"
        color="accent"
      />
      <q-btn
        :label="t('One Level Down')"
        @click="bulkUpdate('down')"
        class="q-mr-sm"
        color="info"
      />
      <q-btn
        :label="t('Email')"
        @click="openEmailDialog"
        class="q-mr-sm"
        color="primary"
      />
    </div>

    <!-- Export Buttons -->
    <div class="row q-mb-sm hide-print" v-if="results.length > 0">
      <q-btn
        :label="t('Export')"
        @click="downloadExcel"
        class="q-mr-sm"
        color="accent"
      />
      <q-btn
        :label="t('Print')"
        @click="downloadPDF"
        class="q-mr-sm"
        color="info"
      />
    </div>

    <!-- Transactions Table with Selection -->
    <q-table
      :rows="results"
      dense
      :columns="columns"
      row-key="id"
      flat
      bordered
      class="q-mt-md"
      v-if="results"
      :rows-per-page-options="[0]"
      virtual-scroll-sticky-end
      hide-bottom
      selection="multiple"
      v-model:selected="selected"
      :row-class="(row) => (row.highlightMissingEmail ? 'bg-red-1' : '')"
    >
      <!-- Level Column with Inline QSelect -->
      <template v-slot:body-cell-level="props">
        <q-td :props="props">
          <q-select
            v-model="props.row.level"
            :options="[1, 2, 3]"
            dense
            outlined
            size="sm"
            @update:model-value="(val) => updateLevel(props.row, val)"
          />
        </q-td>
      </template>
      <!-- Customer Column (with clickable link) -->
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <router-link :to="getVcPath(props.row)" class="text-primary">
            {{ props.row.name }}
          </router-link>
        </q-td>
      </template>
      <!-- Invoice Column (with clickable link) -->
      <template v-slot:body-cell-invoice="props">
        <q-td :props="props">
          <router-link :to="getPath(props.row)" class="text-primary">
            {{ props.row.invnumber }}
          </router-link>
        </q-td>
      </template>
      <!-- Due Amount Column -->
      <template v-slot:body-cell-due="props">
        <q-td :props="props">{{ formatAmount(props.row.due) }}</q-td>
      </template>
      <!-- Actions Column (Print Button) -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            dense
            flat
            color="primary"
            icon="print"
            :label="t('Print')"
            @click="printReminder(props.row)"
            :loading="props.row.printing"
          />
        </q-td>
      </template>
    </q-table>

    <!-- Email Dialog -->
    <q-dialog v-model="emailDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ t("Email Reminders") }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="emailData.adminemail"
            :label="t('Admin Email')"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
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
          <q-input
            v-model="emailData.message"
            :label="t('Message')"
            type="textarea"
            outlined
            autogrow
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
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
import { formatAmount, downloadReport, createPDF } from "src/helpers/utils";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle("Reminder");

const route = useRoute();
const router = useRouter();

const customers = ref([]);
const departments = ref([]);
const results = ref([]);
const selected = ref([]); // for selected rows in the table
const formData = ref({});
const loading = ref(false);
const filtersOpen = ref(true);
const emailDialog = ref(false);
const emailData = ref({
  adminemail: "",
  jobtype: "Reminder Batch",
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

// Search function to fetch transactions based on search criteria
const search = async () => {
  loading.value = true;
  try {
    const params = formData.value;
    const response = await api.get(`/arap/reminder/customer`, { params });
    filtersOpen.value = false;
    if (!response.data.transactions) {
      Notify.create({
        message: t("No results found"),
        position: "center",
        color: "negative",
      });
      results.value = [];
    } else {
      // Reset any highlight flags when loading new results
      results.value = response.data.transactions.map((transaction) => ({
        ...transaction,
        highlightMissingEmail: false,
      }));
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// Fetch customer and department links for the search params
const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/reminder`);
    departments.value = response.data.departments;
    customers.value = response.data.customers;
  } catch (error) {
    console.log(error);
  }
};

// On mounted, fetch the links and if the query parameter "search" equals "1",
// map the remaining query parameters back to the form data and trigger a search.
onMounted(async () => {
  await fetchLinks();
  if (route.query.search === "1") {
    // Create a copy of the query parameters excluding the "search" key.
    const queryParams = { ...route.query };
    delete queryParams.search;
    formData.value = queryParams;
    search();
  }
});

// Function to update a single row's level using the new API which expects an items array
const updateLevel = async (row, newLevel) => {
  try {
    await api.post(`/arap/reminder/customer`, {
      client: formData.value.customer,
      items: [{ id: row.id, level: newLevel }],
    });
    row.level = newLevel;
    Notify.create({
      message: t("Level Updated"),
      position: "center",
      color: "positive",
    });
  } catch (error) {
    console.error("Error updating level:", error);
  }
};

// Bulk update function for selected rows to either increase or decrease their levels
const bulkUpdate = async (direction) => {
  if (!selected.value.length) return;

  // Map each selected row to a new level that is clamped between 1 and 3.
  const items = selected.value.map((row) => {
    const newLevel =
      direction === "up"
        ? Math.min(row.level + 1, 3)
        : Math.max(row.level - 1, 1);
    return { id: row.id, level: newLevel };
  });

  try {
    await api.post(`/arap/reminder/customer`, {
      client: formData.value.customer,
      items,
    });
    // Update the local levels for the selected items, ensuring the level stays within 1-3.
    selected.value.forEach((row) => {
      if (direction === "up" && row.level < 3) {
        row.level = Math.min(row.level + 1, 3);
      } else if (direction === "down" && row.level > 1) {
        row.level = Math.max(row.level - 1, 1);
      }
    });
    Notify.create({
      message: t(
        `Levels Updated (${direction === "up" ? "Increased" : "Decreased"})`
      ),
      position: "center",
      color: "positive",
    });
  } catch (error) {
    console.error("Error bulk updating levels:", error);
  }
};

// Function to print reminder for a given row
const printReminder = async (row) => {
  row.printing = true;
  try {
    const template = `reminder${row.level}`;
    const response = await api.get(
      `/print_invoice?id=${row.id}&vc=customer&template=${template}&format=tex`,
      { responseType: "blob" }
    );
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template}_${row.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error printing reminder:", error);
  } finally {
    row.printing = false;
  }
};

// Table columns configuration
const columns = [
  {
    name: "name",
    label: t("Customer"),
    field: "name",
    align: "left",
  },
  {
    name: "customernumber",
    label: t("Customer Number"),
    field: "customernumber",
    align: "left",
  },
  {
    name: "email ",
    label: t("Email"),
    field: "email",
    align: "left",
  },
  {
    name: "level",
    label: t("Level"),
    field: "level",
    align: "left",
    style: "width: 100px",
  },
  {
    name: "invoice",
    label: t("Invoice"),
    field: "invnumber",
    align: "left",
    style: "width: 150px",
  },
  {
    name: "transdate",
    label: t("Date"),
    field: "transdate",
    align: "left",
  },
  {
    name: "duedate",
    label: t("Date Due"),
    field: "duedate",
    align: "left",
  },
  {
    name: "due",
    label: t("Due"),
    field: "due",
    align: "right",
  },
  {
    name: "actions",
    label: t("Actions"),
    field: "actions",
    align: "center",
    style: "width: 120px",
  },
];

const exportColumns = columns.filter((col) => col.name !== "actions");

const downloadExcel = () => {
  downloadReport(results.value, exportColumns);
};

const downloadPDF = () => {
  const params = {};
  const title = "Customer Reminders";
  createPDF(results.value, exportColumns, null, title, params);
};

const createLink = inject("createLink");

// Build a router link for the invoice depending on the row attributes
const getPath = (row) => {
  let path = "";
  if (row.till) {
    path = createLink("ar.till");
  } else if (row.invoice) {
    path = createLink("customer.invoice");
  } else {
    path = createLink("customer.transaction");
  }
  const flatParams = formData.value;
  return {
    path,
    query: {
      id: row.id,
      ...flatParams,
      // Append callback link with search flag set to 1.
      callback: createLink("base") + `/ar/reminder/?search=1`,
    },
  };
};

// Build a link for the customer view page
function getVcPath(row) {
  const base = createLink("customer");
  return { path: base, query: { id: row.customer_id } };
}

// Open email dialog
const openEmailDialog = () => {
  if (!selected.value.length) {
    Notify.create({
      message: t("Please select at least one transaction"),
      position: "center",
      color: "negative",
    });
    return;
  }

  // Check for missing emails in selected transactions
  const missingEmails = selected.value.filter(
    (row) => !row.email || row.email.trim() === ""
  );

  if (missingEmails.length > 0) {
    // Reset highlight on all rows first
    results.value.forEach((row) => {
      row.highlightMissingEmail = false;
    });

    // Highlight rows with missing emails
    missingEmails.forEach((row) => {
      const resultRow = results.value.find((r) => r.id === row.id);
      if (resultRow) {
        resultRow.highlightMissingEmail = true;
      }
    });

    // Create notification message
    const invoiceList = missingEmails
      .map((row) => {
        const name = row.name || "";
        const invnumber = row.invnumber || row.id;
        return `${name}/${invnumber}`;
      })
      .join(", ");
    Notify.create({
      message: t(`Missing email address for: ${invoiceList}`),
      position: "center",
      color: "negative",
      timeout: 5000,
    });
    return;
  }

  emailDialog.value = true;
};

// Send email batch
const sendEmailBatch = async () => {
  try {
    // Create emails array from selected transactions
    const emails = selected.value.map((row) => ({
      id: row.id,
      type: `reminder${row.level}`,
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
      vc: "customer",
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
</script>
