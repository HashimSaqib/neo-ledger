<template>
  <q-btn-dropdown :label="t('Language')" color="primary" size="sm">
    <q-list>
      <q-item clickable v-ripple @click="switchLanguage('en')">
        <q-item-section>{{ t("English") }}</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="switchLanguage('de')">
        <q-item-section>{{ t("Deutsch") }}</q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup>
import { useQuasar } from "quasar";
import { i18n, useI18n } from "src/boot/i18n";
import { loadLanguagePack } from "src/boot/i18n";

const $q = useQuasar();
const { t } = useI18n();

function switchLanguage(lang) {
  // Map locale codes to match available locales
  const localeMap = {
    de: "de-CH",
  };
  const mappedLang = localeMap[lang] || lang;

  if (i18n.global.locale.value !== mappedLang) {
    loadLanguagePack(lang, $q);
  }
}
</script>
