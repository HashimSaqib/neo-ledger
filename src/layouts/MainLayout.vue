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
import { Cookies, Dark, LocalStorage } from "quasar";

const miniState = ref(false);
const { t } = useI18n();
const route = useRoute();
const leftDrawerOpen = ref(false);
const company = Cookies.get("company");

// Extract client from the route instead of from Cookies
const client = route.params.client;
const getDefaultTitle = () => company || client || t("Neo Ledger");
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

const createLink = (link) => {
  const base = `/client/${client}`;
  let path;

  if (link === "gl.transaction") {
    path = `${base}/gl/add-gl`;
  } else if (link === "customer.pos") {
    path = `${base}/pos/sale`;
  } else if (link === "customer.invoice") {
    path = `${base}/ar/sales-invoice`;
  } else if (link === "customer.transaction") {
    path = `${base}/arap/transaction/customer`;
  } else if (link === "vendor.invoice") {
    path = `${base}/ap/vendor-invoice`;
  } else if (link === "customer.transaction") {
    path = `${base}/arap/transaction/vendor`;
  } else if (link === "base") {
    path = `${base}`;
  } else if (link === "trial.transactions") {
    path = `${base}/reports/trial_transactions`;
  } else if (link === "vendor") {
    path = `${base}/arap/vendor`;
  } else if (link === "customer") {
    path = `${base}/arap/customer`;
  } else if (link === "part.add") {
    path = `${base}/ic/add/part`;
  } else if (link === "service.add") {
    path = `${base}/ic/add/service`;
  }

  return path;
};
provide("createLink", createLink);

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

// Create a filtering function to process menu links based on permissions.

// Define the filterMenu function without parameters.
const filterMenu = () => {
  let acs = LocalStorage.getItem(`${client}_acs`);
  try {
    acs = acs ? acs : [];
  } catch (error) {
    console.error("Error parsing permissions:", error);
    acs = [];
  }

  // A helper function for recursive filtering.
  const recursiveFilter = (menu) => {
    return menu
      .map((item) => {
        const sublinks = item.sublinks ? recursiveFilter(item.sublinks) : [];
        if (acs.includes(item.perm) || sublinks.length) {
          const updatedItem = { ...item, sublinks };
          if (updatedItem.link) {
            const normalizedLink = updatedItem.link.replace(/^\/+/, "");
            updatedItem.link = `/client/${client}/${normalizedLink}`;
          }
          return updatedItem;
        }
        return null;
      })
      .filter(Boolean);
  };

  filteredMenu.value = recursiveFilter(menuLinks);
};

provide("filterMenu", filterMenu);

onMounted(() => {
  filterMenu();
});

// active dropdown
const activeDropdownIndex = ref(null);
provide("activeDropdownIndex", activeDropdownIndex);
provide("setActiveDropdownIndex", (index) => {
  activeDropdownIndex.value = index;
});
</script>
