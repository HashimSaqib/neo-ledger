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
          <s-button
            type="edit"
            :label="t('Edit')"
            @click="openEditPopup(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <s-button
      type="add"
      :label="t('Add Project')"
      @click="openAddPopup"
      class="q-my-sm"
    />

    <!-- Dialog for adding or editing a project -->
    <q-dialog v-model="editDialog">
      <AddProject
        :projectId="editProjectId"
        :initialData="initialData"
        @saved="onProjectSaved"
        @cancel="editDialog = false"
      />
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";
import AddProject from "./AddProject.vue";

const updateTitle = inject("updateTitle");
const { t } = useI18n();

updateTitle(t("Projects"));

// State variables
const projects = ref([]);
const editDialog = ref(false);
const editProjectId = ref(null);
const initialData = ref(null);

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
    if (
      response.data === null ||
      response.data === undefined ||
      !Array.isArray(response.data)
    ) {
      Notify.create({
        message: t("No projects found"),
        type: "negative",
        position: "center",
      });
      projects.value = [];
      return;
    }
    projects.value = response.data.map((project) => ({
      id: project.id,
      projectnumber: project.projectnumber,
      description: project.description,
      customer: project.name,
      startdate: project.startdate,
      enddate: project.enddate,
    }));
  } catch (error) {
    if (error.response?.status === 404) {
      Notify.create({
        message: t("No projects found"),
        type: "negative",
        position: "center",
      });
    } else {
      Notify.create({
        message: error.response?.data?.message || t("Can't fetch projects"),
        type: "negative",
        position: "center",
      });
    }
  }
};

const openAddPopup = () => {
  editProjectId.value = null;
  initialData.value = null;
  editDialog.value = true;
};

const openEditPopup = (project) => {
  editProjectId.value = project.id;
  initialData.value = null;
  editDialog.value = true;
};

const onProjectSaved = () => {
  editDialog.value = false;
  getProjects();
};

onMounted(() => {
  getProjects();
});
</script>
