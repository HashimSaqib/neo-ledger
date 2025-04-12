<template>
  <div class="connections-container q-pa-md">
    <!-- Show spinner when processing the callback -->
    <div
      v-if="isCallbackProcessing"
      class="q-mt-xl flex flex-center column text-center"
    >
      <q-spinner color="primary" size="4em" />
      <div class="q-mt-md text-h6 text-primary">
        Connecting to {{ serviceName }}...
      </div>
      <div class="q-mt-xs text-caption text-grey-7">
        Please wait while we complete the authorization.
      </div>
    </div>

    <!-- Show status (success or error) once done -->
    <div
      v-else-if="statusMessage"
      class="q-mt-xl flex flex-center column text-center"
    >
      <q-icon :name="statusIcon" :color="statusColor" size="4em" />
      <div class="q-mt-md text-h6" :class="`text-${statusColor}`">
        {{ statusMessage }}
      </div>
      <div class="q-mt-xs text-caption text-grey-7">
        This tab will close automatically.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const isCallbackProcessing = ref(false);
const statusMessage = ref(null);
const statusColor = ref("primary");
const statusIcon = ref("hourglass");
const serviceName = ref("Service"); // will be updated to "Dropbox" or "Google Drive"
let client = ""; // to be extracted from state

const closeTabAfterDelay = () => {
  setTimeout(() => {
    router.push("/");
  }, 1000);
};

const handleCallback = async (code, stateParam) => {
  isCallbackProcessing.value = true;
  try {
    // Call the unified endpoint – the state query parameter is passed along
    const response = await api.post(
      `client/${client}/connection/exchange-token?state=${encodeURIComponent(
        stateParam
      )}`,
      {
        code,
      }
    );
    if (response.data.success) {
      statusMessage.value = `${serviceName.value} connected successfully!`;
      statusColor.value = "positive";
      statusIcon.value = "check_circle";
      Notify.create({
        type: "positive",
        message: statusMessage.value,
        position: "top",
      });
    } else {
      throw new Error(response.data.message || "Unknown error occurred");
    }
  } catch (error) {
    statusMessage.value = `Failed to connect ${serviceName.value}: ${
      error.message || error
    }`;
    statusColor.value = "negative";
    statusIcon.value = "error";
    Notify.create({
      type: "negative",
      message: statusMessage.value,
      position: "top",
    });
  } finally {
    isCallbackProcessing.value = false;
    closeTabAfterDelay();
  }
};

onMounted(() => {
  // Parse URL parameters: code, error, and state (expected format: client|serviceType)
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const errorParam = urlParams.get("error");
  const stateParam = urlParams.get("state");

  if (stateParam) {
    // Expecting format: "clientName|dropbox" or "clientName|google_drive"
    const parts = stateParam.split("|");
    if (parts.length >= 2) {
      client = parts[0];
      const serviceType = parts[1].toLowerCase();
      serviceName.value =
        serviceType === "dropbox"
          ? "Dropbox"
          : serviceType === "google_drive" || serviceType === "drive"
          ? "Google Drive"
          : "Service";
    }
  }

  if (code) {
    handleCallback(code, stateParam);
  } else if (errorParam) {
    statusMessage.value = `${serviceName.value} authorization failed: ${errorParam}`;
    statusColor.value = "negative";
    statusIcon.value = "error";
    Notify.create({
      type: "negative",
      message: statusMessage.value,
      position: "top",
    });
    closeTabAfterDelay();
  }
});
</script>

<style scoped>
.connections-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
