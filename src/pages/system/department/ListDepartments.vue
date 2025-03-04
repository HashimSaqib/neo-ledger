<template>
  <q-page class="lightbg q-pa-sm">
    <q-table
      :rows="departments"
      :columns="columns"
      row-key="id"
      flat
      bordered
      separator="horizontal"
      hide-bottom
    >
      <!-- Cost Center column: show tick if role === 'C' -->
      <template v-slot:body-cell-cost_center="props">
        <q-td :props="props">
          <q-icon v-if="isCostCenter(props.row)" name="check" color="green" />
        </q-td>
      </template>

      <!-- Profit Center column: show tick if role === 'P' -->
      <template v-slot:body-cell-profit_center="props">
        <q-td :props="props">
          <q-icon v-if="isProfitCenter(props.row)" name="check" color="green" />
        </q-td>
      </template>

      <!-- Actions column: Edit button is always visible. Delete is shown only when transactions is 0 -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            :label="t('Edit')"
            color="primary"
            @click="openEditPopup(props.row)"
            flat
            size="sm"
          />
          <q-btn
            v-if="props.row.transactions === 0"
            :label="t('Delete')"
            color="negative"
            @click="deleteDepartment(props.row)"
            flat
            size="sm"
            class="q-ml-sm"
          />
        </q-td>
      </template>
    </q-table>

    <q-btn
      :label="t('Add Department')"
      color="primary"
      @click="openAddPopup"
      size="sm"
      class="q-my-sm"
    />

    <!-- Dialog for adding or editing a department -->
    <q-dialog v-model="editDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">
            {{ isEditMode ? t("Edit Department") : t("Add Department") }}
          </div>

          <q-input
            v-model="selectedDepartment.description"
            :label="t('Description')"
            outlined
            dense
            class="q-my-sm"
          />

          <!-- Radio group for Cost Center / Profit Center.
               Disable the option group if transactions is 1 -->
          <q-option-group
            v-model="selectedDepartment.roleType"
            :options="roleOptions"
            type="radio"
            inline
            class="q-my-sm"
            :disable="selectedDepartment.transactions === 1"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-mt-none q-pt-none">
          <q-btn flat :label="t('Cancel')" color="negative" v-close-popup />
          <q-btn
            flat
            :label="t('Save')"
            color="positive"
            @click="saveDepartment"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// State variables
const departments = ref([]);
const editDialog = ref(false);
const isEditMode = ref(false);

// Store department data, including transactions property.
// For new department, transactions is not used.
const selectedDepartment = ref({
  description: "",
  roleType: "", // Will be 'C' or 'P'
  id: null,
  transactions: 0,
});

// Table columns configuration
const columns = [
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  {
    name: "cost_center",
    label: t("Cost Center"),
    align: "center",
  },
  {
    name: "profit_center",
    label: t("Profit Center"),
    align: "center",
  },
  {
    name: "actions",
    label: t("Actions"),
    align: "right",
  },
];

// Define radio options for the department "role" field
const roleOptions = [
  { label: t("Cost Center"), value: "C" },
  { label: t("Profit Center"), value: "P" },
];

// Fetch departments from API
const getDepartments = async () => {
  try {
    const response = await api.get("/system/departments/");
    departments.value = response.data;
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("Can't fetch departments"),
      type: "negative",
      position: "center",
    });
  }
};

// Helper functions to determine if a row should show a tick
const isCostCenter = (row) => row.role === "C";
const isProfitCenter = (row) => row.role === "P";

// Open the add department dialog
const openAddPopup = () => {
  selectedDepartment.value = {
    description: "",
    roleType: "",
    id: null,
    transactions: 0,
  };
  isEditMode.value = false;
  editDialog.value = true;
};

// Open the edit dialog with the department's data.
// Also store the transactions property so we can disable role editing if needed.
const openEditPopup = (department) => {
  let roleType = "";
  if (department.role?.includes("C")) {
    roleType = "C";
  } else if (department.role?.includes("P")) {
    roleType = "P";
  }

  selectedDepartment.value = {
    description: department.description,
    roleType,
    id: department.id,
    transactions: department.transactions,
  };
  isEditMode.value = true;
  editDialog.value = true;
};

// Save the department (POST for add, POST for update)
// For editing, if transactions is 1, the role remains unchanged.
const saveDepartment = async () => {
  try {
    const role = selectedDepartment.value.roleType || "";

    if (isEditMode.value) {
      // Update existing department: send id, description, and role
      await api.post(`/system/departments`, {
        id: selectedDepartment.value.id,
        description: selectedDepartment.value.description,
        role: role,
      });
      Notify.create({
        message:
          t("Department") +
          " " +
          selectedDepartment.value.description +
          " " +
          t("updated successfully!"),
        type: "positive",
        position: "center",
      });
    } else {
      // Add new department: POST to /system/departments without id
      await api.post("/system/departments", {
        description: selectedDepartment.value.description,
        role: role,
      });
      Notify.create({
        message:
          t("Department") +
          " " +
          selectedDepartment.value.description +
          " " +
          t("added successfully!"),
        type: "positive",
        position: "center",
      });
    }
    editDialog.value = false;
    getDepartments(); // Refresh the table data
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("An error occurred"),
      type: "negative",
      position: "center",
    });
  }
};

// Delete a department with no transactions
const deleteDepartment = async (department) => {
  try {
    await api.delete(`/system/departments/${department.id}`);
    Notify.create({
      message:
        t("Department") +
        " " +
        department.description +
        " " +
        t("deleted successfully!"),
      type: "positive",
      position: "center",
    });
    getDepartments(); // Refresh the table data
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("An error occurred"),
      type: "negative",
      position: "center",
    });
  }
};

onMounted(() => {
  getDepartments();
});
</script>
