<template>
  <q-dialog v-model="localDialog" persistent>
    <q-card style="min-width: 60vw">
      <q-card-section class="q-pb-none">
        <div class="text-h6 q-mt-none">Create Dataset</div>
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <!-- Wrap inputs and buttons inside the q-form -->
        <q-form ref="datasetForm" @submit.prevent="createDataset">
          <q-input
            v-model="datasetName"
            dense
            label="Dataset Name"
            outlined
            bg-color="input"
            label-color="secondary"
            :rules="[(val) => !!val || 'Dataset Name is required']"
          />

          <!-- Template Language select using the "charts" array -->
          <s-select
            v-model="selectedChart"
            :options="chartsOptions"
            label="Chart of Accounts"
            outlined
            :rules="[(val) => !!val || 'Chart of Accounts is required']"
          />

          <!-- Template select using the "templates" array -->
          <s-select
            v-model="selectedTemplate"
            :options="templateOptions"
            label="Template"
            outlined
            :rules="[(val) => !!val || 'Template is required']"
          />

          <!-- Moved submit button inside the form -->
          <q-card-actions align="right">
            <q-btn flat label="Cancel" @click="cancel" />
            <q-btn flat label="Create" color="primary" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card-section>
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

// Reference to the q-form component for validation
const datasetForm = ref(null);

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

// Called when the form is submitted
const createDataset = () => {
  // Check form validity
  if (datasetForm.value && !datasetForm.value.validate()) {
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
