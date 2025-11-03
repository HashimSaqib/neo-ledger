<template>
  <q-page class="q-pa-sm">
    <div class="row q-mb-sm hide-print">
      <s-button type="export-xl" @click="downloadExcel" class="q-mr-sm" />
      <s-button type="export-pdf" @click="triggerPrint" class="q-mr-sm" />
    </div>
    <q-table
      :rows="results"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      virtual-scroll
      :rows-per-page-options="[0]"
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <template v-if="col.name === 'accno'">
              <a
                href="#"
                @click.prevent="openEditDialog(props.row.id)"
                class="text-primary"
              >
                {{ props.row.accno }}
              </a>
            </template>
            <template v-else-if="col.name === 'closed'">
              {{ props.row.closed === 1 ? t("Yes") : "" }}
            </template>
            <template v-else>
              {{ props.row[col.field] }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Edit Bank Account Dialog -->
    <q-dialog v-model="editDialog">
      <q-card class="q-pa-sm" style="max-width: 600px">
        <q-card-section class="q-pa-xs">
          <div class="text-h6">{{ t("Edit Bank Account") }}</div>
        </q-card-section>
        <q-separator />

        <q-card-section class="q-pa-xs">
          <q-form @submit.prevent="saveBankAccount" class="q-gutter-xs">
            <!-- Bank Information -->
            <div class="text-subtitle2 q-mb-xs">
              {{ t("Bank Information") }}
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.name"
                  :label="t('Bank Name *')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <q-checkbox
                  dense
                  v-model="selectedBank.closed"
                  :label="t('Closed')"
                  true-value="1"
                  false-value="0"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.iban"
                  :label="t('IBAN')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.qriban"
                  :label="t('QR IBAN')"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.bic"
                  :label="t('BIC/SWIFT')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.strdbkginf"
                  :label="t('Structured Bank Info')"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.invdescriptionqr"
                  :label="t('Invoice Description QR')"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.membernumber"
                  :label="t('Member Number')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.clearingnumber"
                  :label="t('Clearing Number')"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.dcn"
                  :label="t('DCN')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.rvc"
                  :label="t('RVC')"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <!-- Address Information -->
            <div class="text-subtitle2 q-mt-md q-mb-xs">
              {{ t("Address Information") }}
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.street"
                  :label="t('Street Number')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.address1"
                  :label="t('Street Name')"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.address2"
                  :label="t('Address 2')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.post_office"
                  :label="t('Postal Office')"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.city"
                  :label="t('City')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.state"
                  :label="t('State/Province')"
                  class="q-pa-xs"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  dense
                  outlined
                  v-model="selectedBank.zipcode"
                  :label="t('ZIP/Postal Code')"
                  class="q-pa-xs"
                />
              </div>
              <div class="col-6">
                <country-input
                  dense
                  outlined
                  v-model="selectedBank.country"
                  :label="t('Country')"
                  class="q-pa-xs"
                />
              </div>
            </div>
            <!-- Form actions -->
            <div class="row justify-end q-mt-sm q-gutter-x-sm">
              <q-btn
                flat
                :label="t('Cancel')"
                color="primary"
                @click="editDialog = false"
              />
              <s-button type="save" @click="saveBankAccount" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify, Dialog } from "quasar";
import { utils, writeFile } from "xlsx";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Bank Accounts"));
const triggerPrint = inject("triggerPrint");
const results = ref([]);
const chartAccounts = ref([]);

const columns = [
  { name: "accno", label: t("Account"), field: "accno", align: "left" },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  { name: "name", label: t("Bank Name"), field: "name", align: "left" },
  { name: "iban", label: t("IBAN"), field: "iban", align: "left" },
  { name: "qriban", label: t("QR IBAN"), field: "qriban", align: "left" },
  { name: "bic", label: t("BIC/SWIFT"), field: "bic", align: "left" },
  {
    name: "membernumber",
    label: t("Member Number"),
    field: "membernumber",
    align: "left",
  },
  {
    name: "clearingnumber",
    label: t("Clearing Number"),
    field: "clearingnumber",
    align: "left",
  },
  { name: "dcn", label: t("DCN"), field: "dcn", align: "left" },
  { name: "rvc", label: t("RVC"), field: "rvc", align: "left" },
  {
    name: "strdbkginf",
    label: t("Structured Bank Info"),
    field: "strdbkginf",
    align: "left",
  },
  {
    name: "invdescriptionqr",
    label: t("Invoice Description QR"),
    field: "invdescriptionqr",
    align: "left",
  },
  { name: "closed", label: t("Closed"), field: "closed", align: "center" },
];

const fetchData = async () => {
  try {
    const response = await api.get("/system/bank/accounts");
    results.value = response.data;
  } catch (error) {
    console.error(error);
    Notify.create({
      message: t("Failed to fetch bank accounts"),
      color: "negative",
      position: "center",
    });
  }
};

const fetchChartAccounts = async () => {
  try {
    const response = await api.get("/system/chart/accounts");
    chartAccounts.value = response.data
      .filter((account) => account.charttype === "A")
      .map((account) => ({
        label: `${account.accno} - ${account.description}`,
        account: `${account.accno}--${account.description}`,
      }));
  } catch (error) {
    console.error(error);
  }
};

const editDialog = ref(false);
const selectedBank = ref({});

async function openEditDialog(bankId) {
  try {
    const response = await api.get(`/system/bank/accounts/${bankId}`);

    if (!response.data) {
      throw new Error(t("Failed to fetch bank account details"));
    }

    const bank = response.data;
    selectedBank.value = { ...bank };

    // Standardize checkbox values as strings
    selectedBank.value.closed = String(bank.closed);

    editDialog.value = true;
  } catch (error) {
    console.error("Error fetching bank account:", error);
    Notify.create({
      message: t("Failed to fetch bank account details. Please try again."),
      color: "negative",
      position: "center",
    });
  }
}

async function saveBankAccount() {
  // Validate mandatory fields
  if (!selectedBank.value.name) {
    Notify.create({
      message: t("Bank Name is required!"),
      color: "negative",
      position: "center",
    });
    return;
  }

  try {
    const bankData = { ...selectedBank.value };

    await api.post(`/system/bank/accounts/${selectedBank.value.id}`, bankData);
    Notify.create({
      message: t("Bank account saved successfully"),
      color: "positive",
      position: "top-right",
    });
    await fetchData();
    editDialog.value = false;
  } catch (error) {
    Notify.create({
      message: t("Failed to save bank account"),
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
}

const downloadExcel = () => {
  const headerRow = [
    "Account",
    "Bank Name",
    "IBAN",
    "QR IBAN",
    "BIC/SWIFT",
    "Description",
    "Closed",
    "Member Number",
    "Clearing Number",
    "DCN",
    "RVC",
    "Structured Bank Info",
    "Invoice Description QR",
    "Address",
  ];

  const exportData = [];

  exportData.push(["Bank Accounts"]);
  exportData.push([]);
  exportData.push(headerRow);

  results.value.forEach((bank) => {
    const row = [
      bank.accno,
      bank.name,
      bank.iban || "",
      bank.qriban || "",
      bank.bic || "",
      bank.description,
      bank.closed === 1 ? t("Yes") : "",
      bank.membernumber || "",
      bank.clearingnumber || "",
      bank.dcn || "",
      bank.rvc || "",
      bank.strdbkginf || "",
      bank.invdescriptionqr || "",
      bank.address || "",
    ];

    exportData.push(row);
  });

  const worksheet = utils.aoa_to_sheet(exportData);

  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: headerRow.length - 1 },
    },
  ];

  const titleCell = utils.encode_cell({ r: 0, c: 0 });
  worksheet[titleCell].s = {
    alignment: { horizontal: "center", vertical: "center" },
  };

  worksheet["!cols"] = headerRow.map((header, colIdx) => {
    let maxLength = header.length;
    exportData.forEach((row) => {
      const cellValue = row[colIdx];
      if (cellValue != null) {
        maxLength = Math.max(maxLength, cellValue.toString().length);
      }
    });
    return { wch: maxLength + 2 };
  });

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Bank Accounts");
  writeFile(workbook, "bank_accounts.xlsx", { compression: true });
};

onMounted(() => {
  fetchChartAccounts();
  fetchData();
});
</script>

<style scoped>
:deep(.q-table thead tr th) {
  position: sticky;
  top: 0;
  z-index: 2;
  font-weight: bold;
  background-color: var(--q-maintext);
  color: var(--q-mainbg);
}
</style>
