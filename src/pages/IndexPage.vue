<template>
  <q-page class="flex flex-col lightbg q-pa-md">
    <MainDashboard />
  </q-page>
</template>

<script setup>
import MainDashboard from "src/components/MainDashboard.vue";

defineOptions({
  name: "IndexPage",
});
</script>
