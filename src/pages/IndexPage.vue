<template>
  <q-page class="flex flex-col lightbg q-pa-md">
    <MainDashboard />
  </q-page>
</template>

<script setup>
import { onMounted, inject } from "vue";
import { useRoute } from "vue-router";
import MainDashboard from "src/components/MainDashboard.vue";
import { LocalStorage } from "quasar";
import { api } from "src/boot/axios";
defineOptions({
  name: "IndexPage",
});

const route = useRoute();
const client = route.params.client || "default";
const filterMenu = inject("filterMenu");
onMounted(async () => {
  try {
    const response = await api.get("get_acs");
    const acs = response.data.acs;
    LocalStorage.set(`${client}_acs`, acs);
    filterMenu();
  } catch (error) {
    console.error("Error fetching ACS data:", error);
  }
});
</script>
