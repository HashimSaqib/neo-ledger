<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center lightbg">
        <div
          class="q-pa-xl flex column mainbg relative-position"
          style="min-width: 40vw"
        >
          <q-img :src="logo" class="q-mb-lg" />

          <!-- Signup Form -->
          <transition name="fade">
            <form
              v-if="!otpStage"
              @submit.prevent="signupOtp"
              class="flex column"
              style="width: 100%"
            >
              <q-input
                v-model="signupData.email"
                :label="t('Email')"
                class="lightbg"
                input-class="maintext"
                label-color="secondary"
                outlined
              />
              <q-input
                v-model="signupData.password"
                :label="t('Password')"
                type="password"
                class="lightbg maintext q-my-lg"
                input-class="maintext"
                label-color="secondary"
                outlined
              />
              <q-btn
                type="submit"
                :label="t('Sign Up')"
                spread
                color="primary"
              />
            </form>
          </transition>

          <!-- OTP Input Form -->
          <transition name="fade">
            <form
              v-if="otpStage"
              @submit.prevent="confirmSignup"
              class="flex column"
              style="width: 100%"
            >
              <q-input
                v-model="signupData.otp"
                :label="t('OTP')"
                class="lightbg"
                input-class="maintext"
                label-color="secondary"
                outlined
              />
              <q-btn
                type="submit"
                :label="t('Confirm Sign Up')"
                spread
                color="primary"
                class="q-mt-lg"
              />
            </form>
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
import { ref } from "vue";
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
const otpStage = ref(false);
const signupData = ref({
  email: "",
  password: "",
  otp: "",
});

// First step: request an OTP using email & password
const signupOtp = async () => {
  loading.value = true;
  try {
    await axios.post("https://api.neo-ledger.com/central/signup_otp", {
      email: signupData.value.email,
      password: signupData.value.password,
    });
    otpStage.value = true;
    Notify.create({
      message: t("OTP sent to your email"),
      type: "positive",
      position: "center",
    });
  } catch (error) {
    Notify.create({
      message: t(`${error.response.data.message}`),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

// Second step: confirm signup with the OTP
const confirmSignup = async () => {
  loading.value = true;
  try {
    await axios.post("https://api.neo-ledger.com/central/signup", {
      email: signupData.value.email,
      password: signupData.value.password,
      otp: signupData.value.otp,
    });
    Notify.create({
      message: t("Signup successful!"),
      type: "positive",
      position: "center",
    });
    router.push("/");
  } catch (error) {
    Notify.create({
      message: t(`${error.response.data.message}`),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Simple fade transition for smooth UI */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
