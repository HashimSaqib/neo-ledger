<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Only render header if printMode is false -->
    <q-header v-if="!printMode">
      <q-toolbar class="mainbg maintext">
        <q-toolbar-title class="q-ml-xs">
          {{ t(title) }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- Only render drawer if printMode is false -->
    <q-drawer
      v-if="!printMode"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="mainbg column"
      :mini="miniState"
      @mouseenter="miniState = false"
      @mouseleave="miniState = true"
      style="height: 100%"
    >
      <div class="column no-wrap" style="height: 100%">
        <q-scroll-area class="col">
          <div>
            <q-list>
              <EssentialLink
                v-for="link in menuLinks"
                :key="link.title"
                v-bind="link"
              />
            </q-list>
          </div>
        </q-scroll-area>

        <div class="q-pa-md">
          <SettingsPanel />
        </div>
      </div>
    </q-drawer>

    <q-page-container class="lightbg q-px-md-none q-py-md">
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, provide } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import EssentialLink from "components/EssentialLink.vue";
import SettingsPanel from "components/SettingsPanel.vue";
import { menuLinks } from "src/layouts/Menu.js";
import { Cookies } from "quasar";

const miniState = ref(false);
const { t } = useI18n();
const route = useRoute();
const leftDrawerOpen = ref(false);
const company = Cookies.get("company");
const dbname = Cookies.get("client");

const getDefaultTitle = () => company || dbname || t("Neo Ledger");
const title = ref(getDefaultTitle());

// Provide title and update function to child components
provide("title", title);
provide("updateTitle", (newTitle) => {
  title.value = `${t(newTitle)} / ${getDefaultTitle()}` || getDefaultTitle();
});

// Reactive printMode variable
const printMode = ref(false);
// Function to toggle print mode
const togglePrintMode = () => {
  printMode.value = !printMode.value;
};
const printPDF = async () => {
  await togglePrintMode();
  window.print();
};

provide("triggerPrint", printPDF);
provide("printToggle", printMode);
defineOptions({
  name: "MainLayout",
});

window.addEventListener("afterprint", () => {
  if (printMode.value) {
    togglePrintMode();
  }
});
</script>
<style>
@media print {
  .hide-print {
    display: none;
  }
}
</style>
