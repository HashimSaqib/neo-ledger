<template>
  <q-page class="lightbg q-px-sm q-py-sm relative-position">
    <q-form @submit.prevent class="q-px-sm q-py-sm mainbg">
      <q-expansion-item
        :label="t('Search Params')"
        header-class="lightbg maintext"
        expand-icon-class="maintext"
        v-model="filtersOpen"
      >
        <div class="row q-mt-md q-gutter-md">
          <q-input
            v-model="formData.name"
            class="lightbg col-6 col-md-3"
            :label="nameLabel"
            input-class="maintext"
            label-color="secondary"
            outlined
            dense
          />
        </div>
      </q-expansion-item>
    </q-form>
  </q-page>
</template>
<script setup>
import { ref, computed, onMounted, watch, inject } from "vue";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { formatAmount } from "src/helpers/utils";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle("Reminder");
const route = useRoute();

const customers = ref([]);
const departments = ref([]);

const fetchLinks = async () => {
  try {
    const response = await api.get(`/create_links/reminder`);
    departments.value = response.data.departments;
  } catch (error) {
    console.log(error);
  }
};
</script>
