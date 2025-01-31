<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar class="mainbg maintext">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          {{ t(title) }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="mainbg">
      <q-scroll-area class="fit">
        <q-list>
          <EssentialLink
            v-for="link in menuLinks"
            :key="link.title"
            v-bind="link"
          />
        </q-list>
        <div class="absolute-bottom q-pb-md">
          <SettingsPanel />
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="lightbg q-px-md-none q-py-md">
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </q-page-container>
  </q-layout>
</template>
<script setup>
import { ref, provide, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import EssentialLink from "components/EssentialLink.vue";
import SettingsPanel from "components/SettingsPanel.vue";
import { menuLinks } from "src/layouts/Menu.js";
import { Cookies } from "quasar";

const { t, locale } = useI18n();
const route = useRoute();
const leftDrawerOpen = ref(false);
const company = Cookies.get("company");
const dbname = Cookies.get("client");

// Create a function to get the default title
const getDefaultTitle = () => company || dbname || t("Neo Ledger");

const title = ref(getDefaultTitle());

// Provide title and update function to child components
provide("title", title);
provide("updateTitle", (newTitle) => {
  title.value = `${t(newTitle)} / ${getDefaultTitle()}` || getDefaultTitle();
});

defineOptions({
  name: "MainLayout",
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// Watch route changes to reset title
watch(
  () => route.fullPath,
  () => {
    title.value = getDefaultTitle();
  },
  { immediate: true }
);
</script>
