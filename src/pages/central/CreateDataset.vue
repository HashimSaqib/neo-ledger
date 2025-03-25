<template>
  <q-dialog v-model="localDialog" persistent>
    <q-card style="min-width: 60vw">
      <q-card-section class="q-pb-none">
        <div class="text-h6 q-mt-none">Create Dataset</div>
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <q-input
          v-model="datasetName"
          dense
          label="Dataset Name"
          outlined
          bg-color="input"
          label-color="secondary"
        />

        <!-- Template Language select using the "charts" array -->
        <s-select
          v-model="selectedChart"
          :options="chartsOptions"
          label="Chart of Accounts"
          outlined
        />

        <!-- Template select using the "templates" array -->
        <s-select
          v-model="selectedTemplate"
          :options="templateOptions"
          label="Template"
          outlined
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="cancel" />
        <q-btn flat label="Create" color="primary" @click="createDataset" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";

// Define props for controlling dialog visibility
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

// Define emits for updating the parent state and passing dataset data back
const emit = defineEmits(["update:modelValue", "create-dataset"]);

// Local state for dialog visibility (sync with prop)
const localDialog = ref(props.modelValue);
watch(
  () => props.modelValue,
  (newVal) => {
    localDialog.value = newVal;
  }
);
watch(localDialog, (newVal) => {
  emit("update:modelValue", newVal);
});

// Internal component state
const datasetName = ref("");
const chartsOptions = ref([]);
const templateOptions = ref([]);
const selectedChart = ref(null);
const selectedTemplate = ref(null);

// Fetch options for charts (template languages) and templates
const fetchOptions = async () => {
  try {
    const { data } = await api.get("/create_dataset");

    chartsOptions.value = data.charts;
    templateOptions.value = data.templates;
  } catch (error) {
    Notify.create({
      message: "Failed to load dataset options.",
      color: "negative",
    });
  }
};

onMounted(() => {
  fetchOptions();
});

// Emit an event when dataset creation is confirmed
const createDataset = () => {
  if (!datasetName.value || !selectedChart.value || !selectedTemplate.value) {
    Notify.create({
      message: "Please fill in all fields.",
      color: "warning",
    });
    return;
  }

  // Emit the created dataset details to the parent component
  emit("create-dataset", {
    dataset: datasetName.value,
    chart: selectedChart.value,
    templates: selectedTemplate.value,
  });

  // Close the dialog
  localDialog.value = false;
};

// Cancel and close the dialog without emitting
const cancel = () => {
  localDialog.value = false;
};
</script>
