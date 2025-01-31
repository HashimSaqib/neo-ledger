<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center lightbg">
        <div
          class="q-pa-xl flex column mainbg relative-position"
          style="width: 40vw"
        >
          <div class="q-mb-md text-right">
            <LanguageSwitcher />
          </div>
          <q-img :src="logo" class="q-mb-lg" />
          <q-input
            v-model="loginData.username"
            :label="t('Username')"
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
          <q-btn @click="login" :label="t('Login')" spread color="primary" />
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
import { Notify, useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import axios from "axios";
import logo from "assets/images/logo.png";
import LanguageSwitcher from "src/components/LanguageSwitcher.vue";

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const loading = ref(false);
const loginData = ref({
  username: "",
  password: "",
});

onMounted(() => {
  $q.cookies.remove("client");
  $q.cookies.remove("sessionkey");
  $q.cookies.remove("company");
});

const login = async () => {
  loading.value = true;
  try {
    const response = await axios.post(
      "https://api.neo-ledger.com/client/neoledger/auth/login",
      loginData.value
    );
    const { client, sessionkey, company } = response.data;
    $q.cookies.set("client", client, { path: "/" });
    $q.cookies.set("sessionkey", sessionkey, { path: "/" });
    $q.cookies.set("company", company, { path: "/" });
    loading.value = false;
    router.push("/");
  } catch (error) {
    Notify.create({
      message: t("login.error") || "Login failed",
      type: "negative",
      position: "center",
    });
    loading.value = false;
  }
};
</script>
