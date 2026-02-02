<template>
  <div class="main-dashboard">
    <widget-container
      :permissions="userPermissions"
      @config-loaded="onConfigLoaded"
      @config-saved="onConfigSaved"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { LocalStorage } from "quasar";
import { useRoute } from "vue-router";
import WidgetContainer from "./widgets/WidgetContainer.vue";

const route = useRoute();
const client = route.params.client;

// Get user permissions
const userPermissions = computed(() => {
  return LocalStorage.getItem(`${client}_acs`) || [];
});

// Widget events
const onConfigLoaded = (config) => {
  console.log("Widget config loaded:", config);
};

const onConfigSaved = (config) => {
  console.log("Widget config saved:", config);
};
</script>

<style lang="scss" scoped>
.main-dashboard {
  padding: 0.5rem;
}
</style>
