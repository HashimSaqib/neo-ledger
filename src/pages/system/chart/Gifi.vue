<template>
  <q-page class="q-pa-sm">
    <!-- Action buttons -->
    <div class="row q-mb-sm hide-print">
      <q-btn
        :label="t('Export')"
        @click="downloadExcel"
        class="q-mr-sm"
        color="accent"
      />
      <q-btn
        :label="t('Print')"
        @click="triggerPrint"
        class="q-mr-sm"
        color="info"
      />
      <q-btn :label="t('Add New')" @click="openEditDialog()" color="primary" />
    </div>

    <!-- GIFI Table -->
    <q-table
      v-if="results && results.length > 0"
      :rows="results"
      :columns="columns"
      row-key="accno"
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
                @click.prevent="openEditDialog(props.row.accno)"
                class="text-primary"
              >
                {{ props.row.accno }}
              </a>
            </template>
            <template v-else>
              {{ props.row[col.field] }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- Edit / Add GIFI Dialog -->
    <q-dialog v-model="editDialog">
      <q-card class="q-pa-sm" style="max-width: 400px">
        <q-card-section class="q-pa-xs">
          <div class="text-h6">{{ editDialogTitle }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-xs">
          <q-form @submit.prevent="saveGifi">
            <q-input
              dense
              outlined
              v-model="selectedGifi.accno"
              :label="t('Account Number *')"
              class="q-mt-xs"
            />
            <q-input
              dense
              outlined
              v-model="selectedGifi.description"
              :label="t('Description')"
              class="q-mt-xs"
            />
            <div class="row justify-end q-mt-sm q-gutter-x-sm">
              <q-btn
                flat
                :label="t('Cancel')"
                color="primary"
                @click="editDialog = false"
              />
              <q-btn
                color="negative"
                :label="t('Delete')"
                v-if="selectedGifi.accno"
                @click.prevent="deleteGifi(selectedGifi.accno)"
              />
              <q-btn label="Save" color="primary" type="submit" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify, Dialog } from "quasar";
import { utils, writeFile } from "xlsx";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("GIFI"));
const triggerPrint = inject("triggerPrint");

const results = ref([]);
const columns = [
  { name: "accno", label: t("Account"), field: "accno", align: "left" },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
];

// Fetch all GIFI entries
const fetchData = async () => {
  try {
    const response = await api.get("/system/chart/gifi");
    results.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const editDialog = ref(false);
const selectedGifi = ref({
  accno: "",
  description: "",
});

// Computed title for the edit dialog based on whether we're editing or adding new
const editDialogTitle = computed(() =>
  selectedGifi.value.accno ? t("Edit GIFI") : t("Add New GIFI")
);

// Open dialog to add new or edit an existing GIFI entry
async function openEditDialog(accno) {
  if (accno) {
    try {
      const response = await api.get(`/system/chart/gifi/${accno}`);
      if (!response.data) {
        throw new Error(t("Failed to fetch GIFI details"));
      }
      // Clone the returned data
      selectedGifi.value = { ...response.data };
    } catch (error) {
      console.error(error);
      Notify.create({
        message: t("Failed to fetch GIFI details. Please try again."),
        color: "negative",
        position: "center",
      });
      return;
    }
  } else {
    // Prepare a new GIFI object for creation
    selectedGifi.value = {
      accno: "",
      description: "",
    };
  }
  editDialog.value = true;
}

// Save (create/update) the GIFI entry
async function saveGifi() {
  if (!selectedGifi.value.accno) {
    Notify.create({
      message: t("Account Number missing!"),
      color: "negative",
      position: "center",
    });
    return;
  }

  // Determine API endpoint: if this accno exists in our table, update it; otherwise create new.
  let apiUrl = "";
  // Check if the accno already exists in the results (indicating an update)
  if (
    results &&
    results.value.length > 0 &&
    results.value.find((item) => item.accno === selectedGifi.value.accno)
  ) {
    apiUrl = `/system/chart/gifi/${selectedGifi.value.accno}?id=${selectedGifi.value.accno}`;
  } else {
    apiUrl = `/system/chart/gifi/${selectedGifi.value.accno}`;
  }

  try {
    await api.post(apiUrl, { ...selectedGifi.value });
    Notify.create({
      message: t("GIFI saved successfully"),
      color: "positive",
      position: "center",
    });
    await fetchData();
    editDialog.value = false;
  } catch (error) {
    Notify.create({
      message: t("Failed to save GIFI"),
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
}

// Delete a GIFI entry
async function deleteGifi(accno) {
  if (!accno) {
    Notify.create({
      message: t("Invalid GIFI account number"),
      color: "negative",
      position: "center",
    });
    return;
  }
  try {
    Dialog.create({
      title: t("Confirm Deletion"),
      message: t(
        "Are you sure you want to delete this GIFI entry? This action cannot be undone."
      ),
      cancel: true,
      persistent: true,
    })
      .onOk(async () => {
        await api.delete(`/system/chart/gifi/${accno}`);
        Notify.create({
          message: t("GIFI deleted successfully"),
          color: "positive",
          position: "top-right",
        });
        await fetchData();
        editDialog.value = false;
      })
      .onCancel(() => {
        Notify.create({
          message: t("GIFI deletion canceled"),
          color: "warning",
          position: "center",
        });
      });
  } catch (error) {
    Notify.create({
      message: t("Failed to delete GIFI"),
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
}

// Export the table data to Excel
const downloadExcel = () => {
  const headerRow = ["Account", "Description"];
  const exportData = [];
  exportData.push(["GIFI Chart"]);
  exportData.push([]);
  exportData.push(headerRow);

  results.value.forEach((gifi) => {
    const row = [gifi.accno, gifi.description || ""];
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
  utils.book_append_sheet(workbook, worksheet, "GIFI");
  writeFile(workbook, "gifi_chart.xlsx", { compression: true });
};

onMounted(() => {
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
  font-size: 1.1rem;
}
</style>
