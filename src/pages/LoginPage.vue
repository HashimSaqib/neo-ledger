<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center lightbg">
        <div
          class="q-pa-xl flex column mainbg relative-position"
          style="min-width: 40vw"
        >
          <div class="q-mb-md text-right">
            <LanguageSwitcher />
          </div>
          <q-img :src="logo" class="q-mb-lg" />
          <form @submit.prevent="login" class="flex column" style="width: 100%">
            <q-input
              v-model="loginData.email"
              :label="t('Email')"
              class="lightbg"
              input-class="maintext"
              label-color="secondary"
              outlined
            />
            <q-input
              v-model="loginData.password"
              :label="t('Password')"
              type="password"
              class="lightbg maintext q-my-lg"
              input-class="maintext"
              label-color="secondary"
              outlined
            />
            <q-btn type="submit" :label="t('Login')" spread color="primary" />
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
