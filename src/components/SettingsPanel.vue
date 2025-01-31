<!-- SettingsPanel.vue -->
<template>
  <q-expansion-item
    icon="settings"
    :label="$t('Settings')"
    class="settings-panel mainbg"
    dense-toggle
    expand-separator
  >
    <q-list padding>
      <!-- Dark Mode Toggle -->
      <q-item>
        <q-item-section avatar>
          <q-icon :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'" />
        </q-item-section>
        <q-item-section>
          <q-toggle
            v-model="$q.dark.isActive"
            @update:model-value="setTheme"
            :label="$t($q.dark.isActive ? 'Dark Mode' : 'Light Mode')"
            dense
          />
        </q-item-section>
      </q-item>

      <!-- Language Picker -->
      <q-item>
        <q-item-section avatar>
          <q-icon name="language" />
        </q-item-section>
        <q-item-section>
          <q-select
            v-model="selectedLanguage"
            :options="languages"
            dense
            options-dense
            @update:model-value="switchLanguage"
            outlined
            :label="$t('Language')"
            class="q-px-none"
          >
            <template v-slot:option="{ itemProps, opt }">
              <q-item v-bind="itemProps" clickable @click="switchLanguage(opt)">
                <q-item-section>{{ opt.label }}</q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-item-section>
      </q-item>

      <!-- Logout Button -->
      <q-separator spaced />
      <q-item clickable v-ripple @click="handleLogout" class="text-negative">
        <q-item-section avatar>
          <q-icon name="logout" color="negative" />
        </q-item-section>
        <q-item-section>{{ $t("Logout") }}</q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Cookies } from "quasar";
import { setTheme } from "src/boot/theme";
import { i18n, loadLanguagePack } from "src/boot/i18n";

defineOptions({
  name: "SettingsPanel",
});

const router = useRouter();
const languages = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
];

const selectedLanguage = ref(
  languages.find((lang) => lang.value === i18n.global.locale.value) ||
    languages[0]
);

function switchLanguage(lang) {
  if (i18n.global.locale.value !== lang.value) {
    loadLanguagePack(lang.value);
  }
}

async function handleLogout() {
  Cookies.remove("client");
  Cookies.remove("sessionkey");
  await router.push("/login");
}
</script>

<style scoped>
.settings-panel {
  margin-top: auto;
}
</style>
