<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center lightbg q-pa-md">
        <div
          class="q-pa-xl flex column container mainbg relative-position login-container"
          style="min-width: 45vw; max-width: 500px"
        >
          <div class="text-center q-mb-lg">
            <q-img :src="logo" class="login-logo q-mb-md" />
            <div class="text-h5 maintext text-weight-medium q-mb-xs">
              {{ t("Welcome Back") }}
            </div>
            <div class="mutedtext text-body2">
              {{ t("Sign in to continue to your account") }}
            </div>
          </div>

          <form @submit.prevent="login" class="flex column" style="width: 100%">
            <q-input
              v-model="loginData.email"
              :label="t('Email')"
              type="email"
              class="lightbg q-mb-md"
              input-class="maintext"
              label-color="secondary"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="email" color="primary" />
              </template>
            </q-input>
            <q-input
              v-model="loginData.password"
              :label="t('Password')"
              type="password"
              class="lightbg maintext q-mb-lg"
              input-class="maintext"
              label-color="secondary"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="lock" color="primary" />
              </template>
            </q-input>
            <q-btn
              type="submit"
              :label="t('Login')"
              unelevated
              color="primary"
              class="q-py-sm"
            />
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
import logo from "assets/images/logo.png";
import LanguageSwitcher from "src/components/LanguageSwitcher.vue";
import config from "../../neoledger.json";
const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const loginData = ref({
  email: "",
  password: "",
  client: route.params.client || "",
});

onMounted(() => {
  LocalStorage.remove("available_db");
  $q.cookies.remove("sessionkey");

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("acs_")) {
      localStorage.removeItem(key);
    }
  });
});
const login = async () => {
  loading.value = true;
  try {
    const response = await axios.post(
      `${config.apiurl}/login`,
      loginData.value
    );

    // Check if 2FA is required
    if (response.data.requires_2fa) {
      const stateData = {
        temp_sessionkey: response.data.temp_sessionkey,
      };
      if (loginData.value.client) {
        stateData.client = loginData.value.client;
      }

      loading.value = false;
      return router.push({
        path: "/2fa/verify",
        state: stateData,
      });
    }

    // Check if 2FA setup is required
    if (response.data.requires_2fa_setup) {
      const stateData = {
        temp_sessionkey: response.data.temp_sessionkey,
      };
      if (loginData.value.client) {
        stateData.client = loginData.value.client;
      }

      loading.value = false;
      return router.push({
        path: "/2fa/setup",
        state: stateData,
      });
    }

    // Normal login without 2FA
    const { sessionkey, config: configData } = response.data;
    $q.cookies.set("sessionkey", sessionkey, { path: "/" });

    // Handle config if it exists
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

    loading.value = false;
    if (loginData.value.client) {
      return router.push(`/client/${loginData.value.client}`);
    }
    return router.push("/");
  } catch (error) {
    Notify.create({
      message: t(`${error.response.data.message}`),
      type: "negative",
      position: "center",
    });
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  animation: fadeInUp 0.4s ease-out;
}

.login-logo {
  max-width: 200px;
  margin: 0 auto;
}

.q-btn {
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.3px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
