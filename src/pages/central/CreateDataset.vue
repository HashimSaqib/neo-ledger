<template>
  <q-dialog
    v-model="localDialog"
    v-if="allowCreation && chartsOptions.length > 0"
  >
    <q-card style="min-width: 60vw">
      <q-card-section class="q-pb-none">
        <div class="text-h6 q-mt-none">{{ t("Create Dataset") }}</div>
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <!-- Wrap inputs and buttons inside the q-form -->
        <q-form ref="datasetForm" @submit.prevent="createDataset">
          <q-input
            v-model="companyName"
            dense
            :label="t('Company Name')"
            outlined
            bg-color="input"
            label-color="secondary"
            class="q-mb-sm"
            hide-bottom-space
            :rules="[(val) => !!val || t('Company Name is required')]"
          />

          <q-input
            v-model="datasetName"
            dense
            :label="t('Dataset Name')"
            outlined
            bg-color="input"
            label-color="secondary"
            :rules="[
              (val) => !!val || t('Dataset Name is required'),
              (val) =>
                /^[a-z0-9]+$/.test(val) ||
                t('Only lowercase alphabets and numbers allowed'),
            ]"
            class="q-mb-sm"
            hide-bottom-space
          />
          <!-- Template Language select using the "charts" array -->
          <s-select
            v-model="selectedChart"
            :options="chartsOptions"
            :label="t('Chart of Accounts')"
            outlined
            :rules="[(val) => !!val || t('Chart of Accounts is required')]"
            class="q-mb-sm"
            hide-bottom-space
          />

          <!-- Template Language select -->
          <s-select
            v-model="selectedTemplateLanguage"
            :options="templateLanguageOptions"
            :label="t('Template Language')"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            search="label"
            outlined
            :rules="[(val) => !!val || t('Template Language is required')]"
            class="q-mb-sm"
            hide-bottom-space
          />

          <!-- Moved submit button inside the form -->
          <q-card-actions align="right">
            <q-btn flat :label="t('Cancel')" @click="cancel" />
            <q-btn flat :label="t('Create')" color="primary" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card-section> </q-card
    >∂
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

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
const companyName = ref("");
const chartsOptions = ref([]);
const selectedChart = ref(null);
const selectedTemplateLanguage = ref("en-US");

// Template language options with labels
const templateLanguageOptions = ref([
  { label: "German (Switzerland)", value: "de-CH" },
  { label: "German (Germany)", value: "de-DE" },
  { label: "English (US)", value: "en-US" },
  { label: "French (Switzerland)", value: "fr-CH" },
  { label: "Italian (Switzerland)", value: "it-CH" },
]);

// Reference to the q-form component for validation
const datasetForm = ref(null);

const allowCreation = ref(false);
// Fetch options for charts
const fetchOptions = async () => {
  try {
    const { data } = await api.get("/create_dataset");
    allowCreation.value = data.db_creation;
    if (allowCreation.value) {
      chartsOptions.value = data.charts;
    }
  } catch (error) {
    Notify.create({
      message: response.data.error,
      color: "negative",
      position: "center",
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
      message: t("Please fill in all fields."),
      color: "warning",
    });
    return;
  }

  // Emit the created dataset details to the parent component
  emit("create-dataset", {
    company: companyName.value,
    dataset: datasetName.value,
    chart: selectedChart.value,
    template_language: selectedTemplateLanguage.value,
  });
  // Close the dialog
  localDialog.value = false;
};

// Cancel and close the dialog without emitting
const cancel = () => {
  localDialog.value = false;
};
watch(allowCreation, (newVal) => {
  emit("update:allowCreation", newVal);
});
</script>
