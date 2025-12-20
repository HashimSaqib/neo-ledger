<template>
  <q-page class="lightbg">
    <div v-if="showOnboarding" class="onboarding-wrapper">
      <OnboardingList :client="client" @completed="showOnboarding = false" />
    </div>
    <div v-else class="q-pa-md">
      <MainDashboard />
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, inject, ref } from "vue";
import { useRoute } from "vue-router";
import MainDashboard from "src/components/MainDashboard.vue";
import OnboardingList from "src/components/OnboardingList.vue";
import { LocalStorage } from "quasar";
import { api } from "src/boot/axios";

defineOptions({
  name: "IndexPage",
});

const route = useRoute();
const client = route.params.client || "default";
const filterMenu = inject("filterMenu");
const showOnboarding = ref(route.query.onboarding === "1");
const updateTitle = inject("updateTitle");

onMounted(async () => {
  try {
    const response = await api.get("get_acs");
    const acs = response.data.acs;
    const company = response.data.company || "";
    if (company) {
      LocalStorage.set(`${client}_company`, company);
      updateTitle("");
    }
    const hidden = response.data.hidden || [];
    LocalStorage.set(`${client}_acs`, acs);
    LocalStorage.set(`${client}_hidden`, JSON.stringify(hidden));
    filterMenu();
  } catch (error) {
    console.error("Error fetching ACS data:", error);
  }
});
</script>

<style scoped>
.onboarding-wrapper {
  display: flex;
  justify-content: center;
  padding: 2rem;
}
</style>
