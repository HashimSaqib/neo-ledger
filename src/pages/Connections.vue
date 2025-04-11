<template>
  <div class="connections-container q-pa-md">
    <div
      v-if="isCallbackProcessing"
      class="q-mt-xl flex flex-center column text-center"
    >
      <q-spinner color="primary" size="4em" />
      <div class="q-mt-md text-h6 text-primary">Connecting to Dropbox...</div>
      <div class="q-mt-xs text-caption text-grey-7">
        Please wait while we complete the authorization.
      </div>
    </div>

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
const router = useRouter();
const route = useRoute();
const client = route.query.state;

const isCallbackProcessing = ref(false);
const statusMessage = ref(null);
const statusColor = ref("primary");
const statusIcon = ref("hourglass");

const closeTabAfterDelay = () => {
  setTimeout(() => {
    router.push("/");
  }, 3000);
};

const handleDropboxCallback = async (code) => {
  isCallbackProcessing.value = true;

  try {
    const response = await api.post(`client/${client}/dropbox/exchange-token`, {
      code,
    });

    if (response.data.success) {
      statusMessage.value = "Dropbox connected successfully!";
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
    statusMessage.value = `Failed to connect Dropbox: ${
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
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const errorParam = urlParams.get("error");

  if (code) {
    handleDropboxCallback(code);
  } else if (errorParam) {
    statusMessage.value = `Dropbox authorization failed: ${errorParam}`;
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
