<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center lightbg q-pa-md">
        <div
          class="q-pa-xl flex column container mainbg relative-position"
          style="min-width: 45vw; max-width: 600px"
        >
          <!-- Header -->
          <div class="text-center q-mb-lg">
            <q-icon
              name="security"
              size="56px"
              color="primary"
              class="q-mb-sm"
            />
            <div class="text-h5 maintext text-weight-medium q-mb-xs">
              {{ t("Set Up Two-Factor Authentication") }}
            </div>
          </div>

          <!-- Setup Step -->
          <transition
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            mode="out-in"
          >
            <div
              v-if="!showBackupCodes"
              key="setup"
              class="flex column"
              style="width: 100%"
            >
              <!-- QR Code Section -->
              <div class="qr-section lightbg q-pa-lg q-mb-lg">
                <div class="text-center q-mb-md">
                  <div class="maintext text-body2 q-mb-sm">
                    {{ t("Scan with your authenticator app") }}
                  </div>
                </div>

                <div
                  v-if="qrCode"
                  class="qr-code-wrapper"
                  v-html="qrCode"
                ></div>

                <q-separator class="q-my-md" />

                <div>
                  <div class="maintext text-caption text-weight-medium q-mb-sm">
                    {{ t("Or enter this code manually:") }}
                  </div>
                  <q-input
                    :model-value="secret"
                    readonly
                    outlined
                    dense
                    input-class="maintext  text-weight-bold"
                  >
                    <template v-slot:append>
                      <q-btn
                        flat
                        round
                        dense
                        icon="content_copy"
                        @click="copySecret"
                        size="sm"
                        color="primary"
                      >
                        <q-tooltip>{{ t("Copy to clipboard") }}</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </div>
              </div>

              <!-- Verification Form -->
              <form
                @submit.prevent="verifySetup"
                class="flex column"
                style="width: 100%"
              >
                <div class="maintext text-body2 text-weight-medium q-mb-sm">
                  {{ t("Enter the 6-digit code from your app") }}
                </div>
                <q-input
                  v-model="totpCode"
                  :label="t('6-digit code')"
                  mask="### ###"
                  unmasked-value
                  class="lightbg q-mb-lg code-input"
                  input-class="maintext text-center text-h5 text-weight-bold"
                  label-color="secondary"
                  outlined
                  autofocus
                >
                  <template v-slot:prepend>
                    <q-icon name="dialpad" color="primary" />
                  </template>
                </q-input>
                <q-btn
                  type="submit"
                  :label="t('Verify & Enable 2FA')"
                  unelevated
                  color="primary"
                  :disable="totpCode.length !== 6"
                  class="q-py-sm"
                />
              </form>
            </div>

            <!-- Success Step with Backup Codes -->
            <div v-else key="success" class="flex column" style="width: 100%">
              <q-banner class="bg-orange-1 text-orange-9 q-mb-lg" rounded dense>
                <template v-slot:avatar>
                  <q-icon name="warning" color="orange-9" />
                </template>
                <div class="text-weight-medium">
                  {{ t("Save these backup codes") }}
                </div>
                <div class="text-caption">
                  {{
                    t(
                      "You can use these codes to login if you lose access to your authenticator app"
                    )
                  }}
                </div>
              </q-banner>

              <div class="backup-codes-container lightbg q-pa-md q-mb-lg">
                <div class="backup-codes-grid">
                  <div
                    v-for="(code, index) in backupCodes"
                    :key="index"
                    class="backup-code-item mutedbg q-pa-sm"
                  >
                    <span class="mutedtext text-caption">{{ index + 1 }}.</span>
                    <span class="maintext text-mono text-weight-medium">{{
                      code
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="flex row q-gutter-sm">
                <q-btn
                  :label="t('Copy All Codes')"
                  outline
                  color="primary"
                  @click="copyBackupCodes"
                  class="col"
                  icon="content_copy"
                  unelevated
                />
                <q-btn
                  :label="t('Continue')"
                  color="primary"
                  @click="continueToApp"
                  class="col"
                  icon-right="arrow_forward"
                  unelevated
                />
              </div>
            </div>
          </transition>

          <q-inner-loading :showing="loading">
            <q-spinner-gears size="50px" color="primary" />
          </q-inner-loading>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Notify, useQuasar, LocalStorage, copyToClipboard } from "quasar";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import axios from "axios";
import config from "../../neoledger.json";

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const qrCode = ref("");
const secret = ref("");
const otpauthUrl = ref("");
const totpCode = ref("");
const tempSessionKey = ref("");
const showBackupCodes = ref(false);
const backupCodes = ref([]);

onMounted(async () => {
  const state = history.state;
  tempSessionKey.value = state?.temp_sessionkey || "";

  if (!tempSessionKey.value) {
    Notify.create({
      message: t("Invalid session. Please login again."),
      type: "negative",
      position: "center",
    });
    router.push("/login");
    return;
  }

  await fetchSetupData();
});

const fetchSetupData = async () => {
  loading.value = true;
  try {
    const response = await axios.post(`${config.apiurl}/2fa/setup`, {
      temp_sessionkey: tempSessionKey.value,
    });

    qrCode.value = response.data.qr_svg;
    secret.value = response.data.secret;
    otpauthUrl.value = response.data.otpauth_url;
  } catch (error) {
    Notify.create({
      message: t(error.response?.data?.message || "Failed to setup 2FA"),
      type: "negative",
      position: "center",
    });
    router.push("/login");
  } finally {
    loading.value = false;
  }
};

const verifySetup = async () => {
  loading.value = true;
  try {
    const response = await axios.post(`${config.apiurl}/2fa/verify_setup`, {
      temp_sessionkey: tempSessionKey.value,
      totp_code: totpCode.value,
    });

    backupCodes.value = response.data.backup_codes;
    showBackupCodes.value = true;

    const { sessionkey, config: configData } = response.data;
    $q.cookies.set("sessionkey", sessionkey, { path: "/" });

    if (configData) {
      try {
        const parsedConfig = JSON.parse(configData);
        if (parsedConfig.number_format) {
          LocalStorage.set("numberFormat", parsedConfig.number_format);
        }
      } catch (parseError) {
        console.error("Error parsing config:", parseError);
      }
    }
  } catch (error) {
    Notify.create({
      message: t(error.response?.data?.message || "Invalid code"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const copySecret = () => {
  copyToClipboard(secret.value)
    .then(() => {
      Notify.create({
        message: t("Secret copied to clipboard"),
        type: "positive",
        position: "top-right",
      });
    })
    .catch(() => {
      Notify.create({
        message: t("Failed to copy"),
        type: "negative",
        position: "top-right",
      });
    });
};

const copyBackupCodes = () => {
  const codesText = backupCodes.value.join("\n");
  copyToClipboard(codesText)
    .then(() => {
      Notify.create({
        message: t("Backup codes copied to clipboard"),
        type: "positive",
        position: "top-right",
      });
    })
    .catch(() => {
      Notify.create({
        message: t("Failed to copy"),
        type: "negative",
        position: "top-right",
      });
    });
};

const continueToApp = () => {
  const state = history.state;
  const client = state?.client;
  if (client) {
    router.push(`/client/${client}`);
  } else {
    router.push("/");
  }
};
</script>

<style scoped>
/* Step Indicator */
.step-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

/* QR Code Section */
.qr-section {
  border-radius: 12px;
  border: 1px solid var(--q-border);
}

.qr-code-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  max-width: 280px;
}

.qr-code-wrapper :deep(svg) {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Code Input */
.code-input :deep(.q-field__control) {
  height: 60px;
}

.code-input :deep(input) {
  letter-spacing: 8px;
}

/* Backup Codes */
.backup-codes-container {
  border-radius: 12px;
  border: 1px solid var(--q-border);
}

.backup-codes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.backup-code-item {
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.text-mono {
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code",
    "Droid Sans Mono", "Source Code Pro", monospace;
  letter-spacing: 1px;
}

/* Animations */
.animated {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.fadeIn {
  animation-name: fadeIn;
}

.fadeOut {
  animation-name: fadeOut;
}
</style>
