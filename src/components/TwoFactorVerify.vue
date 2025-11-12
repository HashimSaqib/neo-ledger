<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center lightbg q-pa-md">
        <div
          class="q-pa-xl flex column container mainbg relative-position"
          style="min-width: 45vw; max-width: 500px"
        >
          <div class="text-center q-mb-xl">
            <div class="icon-wrapper q-mb-md">
              <q-icon name="security" size="56px" color="primary" />
            </div>
            <div class="text-h5 maintext text-weight-medium q-mb-xs">
              {{ t("Two-Factor Authentication") }}
            </div>
            <div class="mutedtext text-body2">
              {{ t("Enter the code from your authenticator app") }}
            </div>
          </div>

          <q-banner class="info-banner lightbg q-mb-lg" rounded dense>
            <template v-slot:avatar>
              <q-icon name="info" color="primary" />
            </template>
            <div class="maintext text-caption">
              {{
                t(
                  "Open your authenticator app to view your current verification code"
                )
              }}
            </div>
          </q-banner>

          <form
            @submit.prevent="verifyCode"
            class="flex column"
            style="width: 100%"
          >
            <div class="code-input-container q-mb-lg">
              <q-input
                v-model="totpCode"
                :label="t('Enter 6-digit code')"
                mask="### ###"
                unmasked-value
                class="lightbg code-input"
                input-class="maintext text-center text-h5 text-weight-bold"
                label-color="secondary"
                outlined
                autofocus
              >
                <template v-slot:prepend>
                  <q-icon name="dialpad" color="primary" size="24px" />
                </template>
              </q-input>
            </div>

            <q-btn
              type="submit"
              :label="t('Verify Code')"
              unelevated
              color="primary"
              :disable="totpCode.length !== 6"
              class="q-py-sm q-mb-md"
              icon-right="check_circle"
            />

            <div class="text-center">
              <q-btn
                flat
                dense
                :label="t('Back to login')"
                color="secondary"
                @click="backToLogin"
                size="sm"
                icon="arrow_back"
              />
            </div>
          </form>

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
import { Notify, useQuasar, LocalStorage } from "quasar";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import axios from "axios";
import config from "../../neoledger.json";

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const totpCode = ref("");
const tempSessionKey = ref("");
const client = ref("");

onMounted(() => {
  const state = history.state;
  tempSessionKey.value = state?.temp_sessionkey || "";
  client.value = state?.client || "";

  if (!tempSessionKey.value) {
    Notify.create({
      message: t("Invalid session. Please login again."),
      type: "negative",
      position: "center",
    });
    router.push("/login");
  }
});

const verifyCode = async () => {
  loading.value = true;
  try {
    const response = await axios.post(`${config.apiurl}/2fa/verify_login`, {
      temp_sessionkey: tempSessionKey.value,
      totp_code: totpCode.value,
    });

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

    Notify.create({
      message: t("Login successful"),
      type: "positive",
      position: "top-right",
      icon: "check_circle",
    });

    if (client.value) {
      router.push(`/client/${client.value}`);
    } else {
      router.push("/");
    }
  } catch (error) {
    Notify.create({
      message: t(error.response?.data?.message || "Invalid code"),
      type: "negative",
      position: "center",
    });
    totpCode.value = "";
  } finally {
    loading.value = false;
  }
};

const backToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.info-banner {
  border: 1px solid var(--q-border);
}

.code-input :deep(.q-field__control) {
  height: 70px;
}

.code-input :deep(input) {
  letter-spacing: 12px;
  padding: 0 20px;
}
</style>
