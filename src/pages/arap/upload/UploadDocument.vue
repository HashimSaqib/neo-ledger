<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-lg">{{ t("Document Management") }}</div>

    <!-- Single Upload Section -->
    <q-card class="q-mb-lg">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">
          {{
            t(
              uploadType === "customer"
                ? "Customer Documents"
                : "Vendor Documents"
            )
          }}
        </div>
        <div class="text-caption">
          {{ t("Upload up to 5") }}
          {{ uploadType === "customer" ? t("customer") : t("vendor") }}
          {{ t("documents") }}
        </div>
      </q-card-section>

      <q-card-section>
        <div
          class="upload-zone q-pa-lg text-center"
          :class="{ 'upload-zone-active': dragOver }"
          @drop.prevent="handleDrop($event)"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @click="triggerFileInput()"
        >
          <q-icon name="cloud_upload" size="48px" class="text-grey-6 q-mb-md" />
          <div class="text-h6 text-grey-7">
            {{ t("Drag & Drop Files Here") }}
          </div>
          <div class="text-caption text-grey-6 q-mt-sm">
            {{ t("or click to browse") }}
          </div>
          <div class="text-caption text-grey-5 q-mt-xs">
            {{ t("Maximum 5 files allowed") }}
          </div>
        </div>

        <input
          ref="fileInput"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
          style="display: none"
          @change="handleFileSelect($event)"
        />

        <!-- Uploaded Files List -->
        <div v-if="files.length > 0" class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">{{ t("Uploaded Files:") }}</div>
          <q-list>
            <q-item v-for="(file, index) in files" :key="index" class="q-pa-sm">
              <q-item-section avatar>
                <q-icon name="description" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ file.name }}</q-item-label>
                <q-item-label caption>{{
                  formatFileSize(file.size)
                }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="removeFile(index)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploading" class="q-mt-md">
          <q-linear-progress :value="uploadProgress" color="primary" />
          <div class="text-caption q-mt-xs">
            {{ t("Uploading...") }}
            {{ Math.round(uploadProgress * 100) }}%
          </div>
        </div>

        <!-- Upload Button -->
        <div class="q-mt-md">
          <q-btn
            :label="
              t(
                uploadType === 'customer'
                  ? 'Upload Customer Documents'
                  : 'Upload Vendor Documents'
              )
            "
            color="primary"
            :loading="uploading"
            :disable="files.length === 0"
            @click="uploadFiles()"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Success/Error Messages -->
    <q-dialog v-model="showMessage" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ messageTitle }}</div>
        </q-card-section>
        <q-card-section>
          {{ messageText }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="t('OK')" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, inject, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";

// =====================================================
// Injection and Initial Setup
// =====================================================
const updateTitle = inject("updateTitle");
const { t } = useI18n();
const route = useRoute();

// Determine upload type from route parameter
const uploadType = computed(() => route.params.type || "customer");

// Update page title based on upload type
updateTitle(
  `Document Management - ${
    uploadType.value === "customer" ? "Customer" : "Vendor"
  } Upload`
);

// =====================================================
// Reactive Data
// =====================================================
const files = ref([]);
const dragOver = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const showMessage = ref(false);
const messageTitle = ref("");
const messageText = ref("");

// File input ref
const fileInput = ref(null);

// =====================================================
// Methods
// =====================================================
const triggerFileInput = () => {
  fileInput.value.click();
};

const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files);
  addFiles(files);
  dragOver.value = false;
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  addFiles(files);
};

const addFiles = (newFiles) => {
  const maxFiles = 5;

  // Filter valid file types
  const validFiles = newFiles.filter((file) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/tiff",
    ];
    return validTypes.includes(file.type);
  });

  // Check if adding these files would exceed the limit
  if (files.value.length + validFiles.length > maxFiles) {
    showMessageDialog(
      t("File Limit Exceeded"),
      t("You can only upload a maximum of 5 files per section.")
    );
    return;
  }

  // Add files to the array
  files.value.push(...validFiles);
};

const removeFile = (index) => {
  files.value.splice(index, 1);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const uploadFiles = async () => {
  if (files.value.length === 0) {
    showMessageDialog(t("No Files"), t("Please select files to upload."));
    return;
  }

  try {
    uploading.value = true;
    uploadProgress.value = 0;

    const formData = new FormData();

    files.value.forEach((file, index) => {
      formData.append("files", file);
    });

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 0.9) {
        uploadProgress.value += 0.1;
      }
    }, 100);

    const response = await api.post(
      `/document_upload/${uploadType.value}`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          uploadProgress.value = progressEvent.loaded / progressEvent.total;
        },
      }
    );

    clearInterval(progressInterval);
    uploadProgress.value = 1;

    // Clear files after successful upload
    files.value = [];

    // Handle the response from backend
    if (response.data.success) {
      const { count, files: uploadedFiles } = response.data.details;
      showMessageDialog(
        t("Upload Successful"),
        t(`Successfully uploaded ${count} file(s).`)
      );
    } else {
      showMessageDialog(
        t("Upload Failed"),
        t("An error occurred while uploading files. Please try again.")
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    showMessageDialog(
      t("Upload Failed"),
      t("An error occurred while uploading files. Please try again.")
    );
  } finally {
    uploading.value = false;
    setTimeout(() => {
      uploadProgress.value = 0;
    }, 1000);
  }
};

const showMessageDialog = (title, text) => {
  messageTitle.value = title;
  messageText.value = text;
  showMessage.value = true;
};
</script>

<style scoped>
.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-zone:hover {
  border-color: #1976d2;
  background-color: #f0f8ff;
}

.upload-zone-active {
  border-color: #1976d2;
  background-color: #e3f2fd;
  transform: scale(1.02);
}

.upload-zone .q-icon {
  transition: all 0.3s ease;
}

.upload-zone:hover .q-icon {
  color: #1976d2 !important;
  transform: scale(1.1);
}
</style>
