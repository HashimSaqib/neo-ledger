<template>
  <q-btn-dropdown label="Language" color="primary" size="sm">
    <q-list>
      <q-item clickable v-ripple @click="switchLanguage('en')">
        <q-item-section>English</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="switchLanguage('de')">
        <q-item-section>Deutsch</q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup>
import { i18n } from "src/boot/i18n";

import { loadLanguagePack } from "src/boot/i18n";

function switchLanguage(lang) {
  if (i18n.global.locale.value !== lang) {
    loadLanguagePack(lang);
  }
}
</script>
