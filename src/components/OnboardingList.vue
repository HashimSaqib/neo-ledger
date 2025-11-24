<template>
  <q-card v-if="showOnboarding" flat bordered class="onboarding-list-card">
    <q-card-section>
      <div class="section-header">
        <div class="header-content">
          <q-icon name="task_alt" size="sm" color="primary" class="q-mr-sm" />
          <div>
            <div class="section-title">{{ t("Getting Started") }}</div>
          </div>
        </div>
        <q-btn
          flat
          dense
          round
          icon="close"
          size="sm"
          class="close-btn"
          @click="handleDismiss"
        >
          <q-tooltip>{{ t("Dismiss") }}</q-tooltip>
        </q-btn>
      </div>

      <q-linear-progress
        :value="progress"
        color="primary"
        class="q-mt-md q-mb-md"
        size="8px"
        rounded
      />

      <div class="progress-text q-mb-md">
        {{ completedCount }} {{ t("of") }} {{ totalCount }}
        {{ t("tasks completed") }}
      </div>

      <transition-group name="list" tag="div" class="cards-container">
        <onboarding-card
          v-for="item in sortedOnboardingItems"
          :key="item.id"
          :item="item"
          @mark-as-done="handleMarkAsDone"
        />
      </transition-group>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import OnboardingCard from "./OnboardingCard.vue";

const { t } = useI18n();
const $q = useQuasar();

const props = defineProps({
  client: {
    type: String,
    required: true,
  },
});

const onboardingData = ref({ onboarding: 1, incomplete: [], completed: [] });
const onboardingItems = ref([
  {
    id: "defaults",
    title: t("Configure Defaults"),
    description: t("Set up system defaults."),
    completed: false,
    link: `/client/${props.client}/system/defaults`,
    fieldName: "defaults",
  },
  {
    id: "coa",
    title: t("Set Up Chart of Accounts"),
    description: t("Configure your accounting structure and account hierarchy"),
    completed: false,
    link: `/client/${props.client}/system/chart/list`,
    fieldName: "coa",
  },
  {
    id: "departments",
    title: t("Create Departments"),
    description: t("Organize your business by departments"),
    completed: false,
    link: `/client/${props.client}/system/departments`,
    fieldName: "departments",
  },
  {
    id: "projects",
    title: t("Create Projects"),
    description: t("Track income and expenses by project"),
    completed: false,
    link: `/client/${props.client}/system/projects`,
    fieldName: "projects",
  },
  {
    id: "bank_accounts",
    title: t("Set Up Bank Accounts"),
    description: t("Set up bank accounts."),
    completed: false,
    link: `/client/${props.client}/system/bank`,
    fieldName: "bank_accounts",
  },
  {
    id: "services",
    title: t("Add Services"),
    description: t("Set up services for sale invoices."),
    completed: false,
    link: `/client/${props.client}/ic/add/service`,
    fieldName: "services",
  },
  {
    id: "stations",
    title: t("Manage Stations"),
    description: t("Configure workstations for automated processing."),
    completed: false,
    link: `/client/${props.client}/stations/manage`,
    fieldName: "stations",
  },
]);

const emit = defineEmits(["completed"]);

const showOnboarding = computed(() => {
  return onboardingData.value?.onboarding === 1;
});

const completedCount = computed(() => {
  return onboardingItems.value.filter((item) => item.completed).length;
});

const totalCount = computed(() => {
  return onboardingItems.value.length;
});

const progress = computed(() => {
  if (totalCount.value === 0) return 0;
  return completedCount.value / totalCount.value;
});

const sortedOnboardingItems = computed(() => {
  return [...onboardingItems.value].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
});

const fetchOnboardingData = async () => {
  try {
    const response = await api.get("/onboarding", {
      params: { client: props.client },
    });

    onboardingData.value = response.data;

    if (response.data.onboarding === 0) {
      emit("completed");
      return;
    }

    if (response.data.incomplete) {
      const incompleteList = response.data.incomplete;

      onboardingItems.value = onboardingItems.value.map((item) => ({
        ...item,
        completed: !incompleteList.includes(item.fieldName),
      }));
    }
  } catch (error) {
    console.error("Error fetching onboarding data:", error);
  }
};

const handleMarkAsDone = async (item) => {
  try {
    await api.post("/onboarding", {
      client: props.client,
      fldname: item.fieldName,
      fldvalue: 1,
    });

    const itemIndex = onboardingItems.value.findIndex((i) => i.id === item.id);
    if (itemIndex !== -1) {
      onboardingItems.value[itemIndex].completed = true;
    }

    $q.notify({
      type: "positive",
      message: t("Task marked as completed"),
      position: "top",
    });

    await fetchOnboardingData();
  } catch (error) {
    console.error("Error marking task as done:", error);
    $q.notify({
      type: "negative",
      message: t("Failed to update task status"),
      position: "top",
    });
  }
};

const handleDismiss = () => {
  onboardingData.value = { ...onboardingData.value, onboarding: 0 };
  emit("completed");
};

onMounted(async () => {
  await fetchOnboardingData();
});
</script>

<style lang="scss" scoped>
.onboarding-list-card {
  background-color: var(--q-mainbg);
  border: 1px solid var(--q-border);
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  display: flex;
  align-items: center;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--q-maintext);
  margin-bottom: 0.25rem;
}

.close-btn {
  color: var(--q-mutedtext);

  &:hover {
    color: var(--q-maintext);
    background-color: var(--q-highlight);
  }
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--q-maintext);
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
