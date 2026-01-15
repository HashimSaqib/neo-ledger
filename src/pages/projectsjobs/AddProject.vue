<template>
  <q-card style="min-width: 50vw">
    <q-card-section>
      <div class="text-h6">
        {{ isEditMode ? t("Edit Project") : t("Add Project") }}
      </div>

      <q-input
        v-model="project.projectnumber"
        :label="t('Number')"
        outlined
        dense
        class="q-my-sm"
      />
      <q-input
        v-model="project.description"
        :label="t('Description')"
        outlined
        dense
        class="q-my-sm"
      />

      <s-select
        search="label"
        :options="customers"
        option-label="label"
        v-model="project.selectedCustomer"
        :label="t('Customer')"
        outlined
        dense
        class="q-my-sm"
      />

      <div class="row">
        <q-input
          v-model="project.startdate"
          :label="t('Start Date')"
          type="date"
          outlined
          dense
          class="q-my-sm col-5 q-mr-sm"
        />

        <q-input
          v-model="project.enddate"
          :label="t('End Date')"
          type="date"
          outlined
          dense
          class="q-my-sm col-5"
        />
      </div>
    </q-card-section>

    <q-card-actions align="right" class="q-mt-none q-pt-none">
      <s-button
        type="secondary"
        icon="close"
        :label="t('Cancel')"
        @click="emit('cancel')"
      />
      <s-button type="save" @click="saveProject" :loading="saving" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
  projectId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["saved", "cancel"]);

const saving = ref(false);
const customers = ref([]);
const isEditMode = ref(false);

const project = ref({
  projectnumber: "",
  description: "",
  selectedCustomer: null,
  startdate: null,
  enddate: null,
  id: null,
  mocoId: null,
});

const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/projects");
    customers.value = response.data.customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
};

const fetchProject = async (id) => {
  try {
    const response = await api.get(`/projects/${id}`);
    project.value = {
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
  saving.value = true;
  try {
    const data = {
      ...project.value,
      customer_id: project.value.selectedCustomer?.id,
    };

    // Include moco_project_id if provided
    if (project.value.mocoId) {
      data.moco_project_id = project.value.mocoId;
    }

    if (isEditMode.value) {
      await api.post(`/projects/${project.value.id}`, data);
      Notify.create({
        message: t("Project updated successfully!"),
        type: "positive",
        position: "top-right",
      });
    } else {
      const response = await api.post("/projects", data);
      Notify.create({
        message: t("Project added successfully!"),
        type: "positive",
        position: "top-right",
      });
      // Return the new project id if available
      emit("saved", response.data?.id || true);
      return;
    }
    emit("saved", project.value.id);
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("An error occurred"),
      type: "negative",
      position: "center",
    });
  } finally {
    saving.value = false;
  }
};

// Initialize with initial data if provided
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      project.value = {
        projectnumber: newData.projectnumber || "",
        description: newData.description || "",
        selectedCustomer: null,
        startdate: newData.startdate || null,
        enddate: newData.enddate || null,
        id: null,
        mocoId: newData.mocoId || null,
      };
      isEditMode.value = false;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await fetchLinks();

  // If projectId is provided, fetch the project for editing
  if (props.projectId) {
    await fetchProject(props.projectId);
  }
});
</script>
