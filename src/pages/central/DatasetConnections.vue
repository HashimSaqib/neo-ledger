<template>
  <div class="q-pa-md text-center">
    <!-- If there is a connection (active or error) -->
    <div v-if="dataset.connections && dataset.connections.length > 0">
      <!-- Display active connection -->
      <div v-if="dataset.connections[0].status === 'active'" class="q-pa-md">
        <q-icon name="check_circle" color="green" size="3em" />
        <div class="text-h5 q-mt-sm">
          {{
            dataset.connections[0].type === "dropbox"
              ? t("Dropbox")
              : t("Google Drive")
          }}
          {{ t("Connection Active") }}
        </div>

        <div
          v-if="dataset.connections[0].drive_id"
          class="text-subtitle1 q-mt-sm"
        >
          {{ t("Using Shared Drive") }}
        </div>

        <!-- Get Drives button for active connections -->
        <q-btn
          v-if="allDrive && dataset.connections[0].type === 'google_drive'"
          dense
          :label="t('Get Drives')"
          color="secondary"
          icon="storage"
          class="q-mt-md"
          @click="getDrives"
          :loading="loading"
        />

        <!-- Display drives list -->
        <div v-if="drives.length > 0" class="q-mt-md">
          <div class="text-subtitle1">{{ t("Available Drives") }}:</div>

          <div v-if="driveError" class="text-negative q-mb-sm">
            <q-icon name="warning" /> {{ driveError }}
          </div>

          <div class="q-pa-sm">
            <q-radio
              v-for="drive in drives"
              :key="drive.id"
              v-model="selectedDrive"
              :val="drive.id"
              :label="drive.name"
              dense
              class="q-mr-md"
            />
          </div>

          <q-btn
            dense
            :label="t('Attach Drive')"
            color="primary"
            class="q-mt-md"
            :disable="!selectedDrive"
            :loading="attachLoading"
            @click="attachDrive"
          />
        </div>
      </div>

      <!-- Display connection with error and reconnect button -->
      <div
        v-else-if="dataset.connections[0].status === 'error'"
        class="q-pa-md"
      >
        <q-icon name="error_outline" color="red" size="3em" />
        <div class="text-h5 q-mt-sm">{{ t("Connection Disabled") }}</div>
        <div class="q-mt-sm text-subtitle2">
          {{ t("Error") }}: {{ dataset.connections[0].error }}
        </div>
        <q-btn
          dense
          :label="`${t('Reconnect')} ${
            dataset.connections[0].type === 'dropbox'
              ? t('Dropbox')
              : t('Google Drive')
          }`"
          color="primary"
          icon="folder"
          :href="
            dataset.connections[0].type === 'dropbox'
              ? `https://www.dropbox.com/oauth2/authorize?client_id=${dropboxKey}&response_type=code&state=${
                  dataset.db_name
                }|dropbox&token_access_type=offline&redirect_uri=${encodeURIComponent(
                  redirectUrl
                )}/connection`
              : `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&response_type=code&access_type=offline&prompt=consent&scope=${
                  allDrive
                    ? 'https://www.googleapis.com/auth/drive'
                    : 'https://www.googleapis.com/auth/drive.file'
                }&state=${
                  dataset.db_name
                }|google_drive&redirect_uri=${encodeURIComponent(
                  redirectUrl
                )}/connection`
          "
        />
      </div>
    </div>

    <!-- If no connection exists, provide options for both services -->
    <div v-else class="q-pa-md">
      <q-btn
        dense
        :label="t('Connect Dropbox')"
        color="primary"
        icon="folder"
        :href="`https://www.dropbox.com/oauth2/authorize?client_id=${dropboxKey}&response_type=code&state=${
          dataset.db_name
        }|dropbox&token_access_type=offline&redirect_uri=${encodeURIComponent(
          redirectUrl
        )}/connection`"
        v-if="dropboxKey"
        class="q-mr-md"
      />
      <q-btn
        dense
        :label="t('Connect Google Drive')"
        color="primary"
        icon="folder"
        :href="`https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&access_type=offline&prompt=consent&response_type=code&scope=${
          allDrive
            ? 'https://www.googleapis.com/auth/drive'
            : 'https://www.googleapis.com/auth/drive.file'
        }&state=${
          dataset.db_name
        }|google_drive&redirect_uri=${encodeURIComponent(
          redirectUrl
        )}/connection`"
        v-if="googleClientId"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  dataset: {
    type: Object,
    required: true,
  },
  redirectUrl: {
    type: String,
    required: true,
  },
  dropboxKey: {
    type: String,
    default: "",
  },
  googleClientId: {
    type: String,
    default: "",
  },
  allDrive: {
    type: Number,
    default: 0,
  },
});

const drives = ref([]);
const loading = ref(false);
const selectedDrive = ref(null);
const attachLoading = ref(false);
const driveError = ref(null);

const getDrives = async () => {
  loading.value = true;
  driveError.value = null;
  try {
    const response = await api.get(
      `/client/${props.dataset.db_name}/get_drives`
    );
    drives.value = response.data.drives;

    // Check if connection has a drive_id to pre-select
    if (
      props.dataset.connections &&
      props.dataset.connections.length > 0 &&
      props.dataset.connections[0].drive_id
    ) {
      const existingDriveId = props.dataset.connections[0].drive_id;
      const driveExists = drives.value.some(
        (drive) => drive.id === existingDriveId
      );

      if (driveExists) {
        selectedDrive.value = existingDriveId;
      } else {
        driveError.value = t(
          "Previously selected drive not found in available drives"
        );
      }
    }
  } catch (error) {
    console.error("Error fetching drives:", error);
    driveError.value = t("Failed to fetch drives");
  } finally {
    loading.value = false;
  }
};

const attachDrive = async () => {
  if (!selectedDrive.value) return;

  attachLoading.value = true;
  try {
    await api.post(`/client/${props.dataset.db_name}/select_drive`, {
      drive_id: selectedDrive.value,
    });
    // Refresh the dataset or update UI as needed
  } catch (error) {
    console.error("Error attaching drive:", error);
  } finally {
    attachLoading.value = false;
  }
};
</script>
