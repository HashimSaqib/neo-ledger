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
                v-for="(link, index) in filteredMenu"
                :key="link.title"
                v-bind="link"
                :index="index"
                :depth="0"
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
import { ref, provide, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import EssentialLink from "components/EssentialLink.vue";
import SettingsPanel from "components/SettingsPanel.vue";
import { menuLinks } from "src/layouts/Menu.js";
import { Cookies, Dark } from "quasar"; // import Dark plugin

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
console.log("Providing title:", title);
provide("updateTitle", (newTitle) => {
  title.value = `${t(newTitle)} / ${getDefaultTitle()}` || getDefaultTitle();
});

// Reactive printMode variable
const printMode = ref(false);

// Keep track of original theme state
let wasDarkMode = Dark.isActive;

// Function to toggle print mode
const togglePrintMode = () => {
  printMode.value = !printMode.value;
};

const printPDF = async () => {
  // Save current dark mode state
  wasDarkMode = Dark.isActive;

  // If in dark mode, switch to light mode for printing
  if (wasDarkMode) {
    Dark.set(false); // switch to light mode
  }

  // Toggle print mode and trigger print
  await togglePrintMode();
  window.print();
};

provide("triggerPrint", printPDF);
provide("printToggle", printMode);

defineOptions({
  name: "MainLayout",
});

// Listen for the afterprint event to restore the original theme
window.addEventListener("afterprint", () => {
  if (wasDarkMode && !Dark.isActive) {
    Dark.set(true); // revert back to dark mode if it was originally active
  }
  if (printMode.value) {
    togglePrintMode();
  }
});
const filteredMenu = ref();
onMounted(async () => {
  let acs = Cookies.get("acs");

  try {
    acs = acs ? acs : [];
    if (!Array.isArray(acs)) throw new Error("Invalid permissions format");
  } catch (error) {
    console.error("Error parsing permissions:", error);
    acs = []; // Fallback to an empty array
  }

  const filterMenu = (menu) => {
    return menu
      .map((item) => {
        // Recursively filter sublinks if they exist
        const sublinks = item.sublinks ? filterMenu(item.sublinks) : [];

        // Include the item if it has a valid permission OR has valid sublinks
        if (acs.includes(item.perm) || sublinks.length) {
          return { ...item, sublinks };
        }
        return null;
      })
      .filter(Boolean);
  };

  filteredMenu.value = filterMenu(menuLinks);
  console.log(filteredMenu.value);
});

// active dropdown
const activeDropdownIndex = ref(null);
provide("activeDropdownIndex", activeDropdownIndex);
provide("setActiveDropdownIndex", (index) => {
  activeDropdownIndex.value = index;
});
</script>
