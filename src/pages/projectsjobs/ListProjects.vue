<template>
  <q-page class="lightbg q-pa-sm">
    <q-table
      :rows="projects"
      :columns="columns"
      row-key="id"
      flat
      bordered
      separator="horizontal"
      hide-bottom
    >
      <!-- Actions column: Edit button is always visible. -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            :label="t('Edit')"
            color="primary"
            @click="openEditPopup(props.row)"
            flat
            size="sm"
          />
        </q-td>
      </template>
    </q-table>

    <q-btn
      :label="t('Add Project')"
      color="primary"
      @click="openAddPopup"
      size="sm"
      class="q-my-sm"
    />

    <!-- Dialog for adding or editing a project -->
    <q-dialog v-model="editDialog">
      <q-card style="min-width: 50vw">
        <q-card-section>
          <div class="text-h6">
            {{ isEditMode ? t("Edit Project") : t("Add Project") }}
          </div>

          <q-input
            v-model="selectedProject.projectnumber"
            :label="t('projectnumber')"
            outlined
            dense
            class="q-my-sm"
          />
          <q-input
            v-model="selectedProject.description"
            :label="t('Description')"
            outlined
            dense
            class="q-my-sm"
          />

          <s-select
            search="label"
            :options="customers"
            option-label="label"
            v-model="selectedProject.selectedCustomer"
            :label="t('Customer')"
            outlined
            dense
            class="q-my-sm"
          />

          <div class="row">
            <q-input
              v-model="selectedProject.startdate"
              :label="t('Start Date')"
              type="date"
              outlined
              dense
              class="q-my-sm col-5 q-mr-sm"
            />

            <q-input
              v-model="selectedProject.enddate"
              :label="t('End Date')"
              type="date"
              outlined
              dense
              class="q-my-sm col-5"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-mt-none q-pt-none">
          <q-btn flat :label="t('Cancel')" color="negative" v-close-popup />
          <q-btn
            flat
            :label="t('Save')"
            color="positive"
            @click="saveProject"
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
const projects = ref([]);
const editDialog = ref(false);
const isEditMode = ref(false);

const selectedProject = ref({
  description: "",
  customer: "",
  selectedCustomer: "",
  startdate: null,
  enddate: null,
  id: null,
});

const columns = [
  {
    name: "projectnumber",
    label: t("Number"),
    field: "projectnumber",
    align: "left",
  },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  { name: "customer", label: t("Customer"), field: "customer", align: "left" },
  {
    name: "startdate",
    label: t("Start Date"),
    field: "startdate",
    align: "center",
  },
  { name: "enddate", label: t("End Date"), field: "enddate", align: "center" },
  { name: "actions", label: t("Actions"), align: "right" },
];

const getProjects = async () => {
  try {
    const response = await api.get("/projects");
    projects.value = response.data.map((project) => ({
      id: project.id,
      projectnumber: project.projectnumber,
      description: project.description,
      customer: project.name,
      startdate: project.startdate,
      enddate: project.enddate,
    }));
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("Can't fetch projects"),
      type: "negative",
      position: "center",
    });
  }
};
const customers = ref([]);
const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/projects");
    customers.value = response.data.customers;
  } catch (error) {
    console.log(error);
  }
};
const openAddPopup = () => {
  selectedProject.value = {
    projectnumber: "",
    description: "",
    customer: "",
    startdate: null,
    enddate: null,
    id: null,
  };
  isEditMode.value = false;
  editDialog.value = true;
};

const openEditPopup = async (project) => {
  try {
    const response = await api.get(`/projects/${project.id}`);
    selectedProject.value = {
      id: response.data.id,
      projectnumber: response.data.projectnumber,
      description: response.data.description,
      selectedCustomer: customers.value.find(
        (cus) => cus.id === response.data.customer_id
      ),
      startdate: response.data.startdate,
      enddate: response.data.enddate,
    };
    isEditMode.value = true;
    editDialog.value = true;
  } catch (error) {
    Notify.create({
      message:
        error.response?.data?.message || t("Failed to fetch project details"),
      type: "negative",
      position: "center",
    });
  }
};
const saveProject = async () => {
  try {
    if (isEditMode.value) {
      const data = {
        ...selectedProject.value,
        customer_id: selectedProject.value.selectedCustomer?.id,
      };
      await api.post(`/projects/${selectedProject.value.id}`, data);
      Notify.create({
        message: t("Project updated successfully!"),
        type: "positive",
        position: "center",
      });
    } else {
      await api.post("/projects", selectedProject.value);
      Notify.create({
        message: t("Project added successfully!"),
        type: "positive",
        position: "center",
      });
    }
    editDialog.value = false;
    getProjects();
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("An error occurred"),
      type: "negative",
      position: "center",
    });
  }
};

onMounted(() => {
  fetchLinks();
  getProjects();
});
</script>
