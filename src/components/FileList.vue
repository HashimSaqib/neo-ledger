<template>
  <q-list
    :separator="!report"
    style="background-color: var(--q-highlight); border-radius: 10px"
  >
    <q-item
      v-for="(file, index) in files"
      :key="index"
      :dense="report"
      :class="report ? 'q-pa-none' : ''"
    >
      <q-item-section>
        <a
          :href="preview ? '#' : file.link"
          :target="preview ? '_self' : '_blank'"
          @click="preview ? handlePreview(file.link) : null"
        >
          <q-icon
            v-if="report"
            name="picture_as_pdf"
            size="sm"
            color="primary"
          />
          <template v-else>{{ file.name }}</template>
        </a>
      </q-item-section>
      <q-item-section side v-if="!report">
        <q-btn
          dense
          flat
          icon="delete"
          @click="handleDelete(file, index)"
          color="negative"
          round
        />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { Notify } from "quasar";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  files: {
    type: Array,
    required: true,
  },
  module: {
    type: String,
    required: true,
  },
  report: {
    type: Boolean,
    default: false,
  },
  preview: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["file-deleted", "file-preview"]);

const handlePreview = (link) => {
  emit("file-preview", link);
};

const handleDelete = async (file, index) => {
  try {
    // Use the provided module prop to construct the endpoint.
    await api.delete(`files/${props.module}/${file.id}`);
    Notify.create({
      message: t("File deleted successfully."),
      type: "positive",
      position: "top-right",
    });
    // Let the parent know which file was deleted
    emit("file-deleted", index);
  } catch (error) {
    console.error("Failed to delete file:", error);
    Notify.create({
      message: t("Failed to delete file."),
      type: "negative",
      position: "center",
    });
  }
};
</script>

<style scoped>
a {
  color: var(--q-maintext);
  text-decoration: none;
}

a:visited {
  color: var(--q-secondary);
}

a:hover {
  color: var(--q-maintext);
  text-decoration: underline;
}
</style>
