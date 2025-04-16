<template>
  <q-list :bordered="!report" :separator="!report">
    <q-item v-for="(file, index) in files" :key="index" :dense="report">
      <q-item-section>
        <a :href="file.link" target="_blank">{{ file.name }}</a>
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
});

const emit = defineEmits(["file-deleted"]);

const handleDelete = async (file, index) => {
  try {
    // Use the provided module prop to construct the endpoint.
    await api.delete(`files/${props.module}/${file.id}`);
    Notify.create({
      message: "File deleted successfully.",
      type: "positive",
      position: "center",
    });
    // Let the parent know which file was deleted
    emit("file-deleted", index);
  } catch (error) {
    console.error("Failed to delete file:", error);
    Notify.create({
      message: "Failed to delete file.",
      type: "negative",
      position: "center",
    });
  }
};
</script>
