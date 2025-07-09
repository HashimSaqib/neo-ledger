<template></template>

<script setup>
import { ref, inject, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "src/boot/axios";

const { t } = useI18n();
const updateTitle = inject("updateTitle");

onMounted(() => {
  updateTitle("Bank Adjustment");
});
</script>
