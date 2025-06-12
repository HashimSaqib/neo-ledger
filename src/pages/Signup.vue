<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center lightbg">
        <div
          class="q-pa-xl flex column mainbg card-style relative-position"
          style="min-width: 40vw"
        >
          <q-img :src="logo" class="q-mb-lg" />

          <!-- Message for when signups are not allowed -->
          <div
            v-if="!otpStage && !signupAllowed"
            class="flex column text-center message-box"
          >
            <p>
              {{ t("Signup is not allowed") }}
            </p>
          </div>

          <!-- Signup Form -->
          <form
            v-if="!otpStage && signupAllowed"
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
              class="lightbg maintext q-mt-sm"
              input-class="maintext"
              label-color="secondary"
              outlined
            />
            <q-input
              v-if="signupData.invite"
              v-model="signupData.invite"
              :label="t('Invite Code')"
              class="lightbg q-my-sm"
              input-class="maintext"
              label-color="secondary"
              outlined
              readonly
            />
            <q-btn
              type="submit"
              :label="signupData.invite ? t('Sign Up') : t('Sign Up & Get OTP')"
              spread
              class="q-my-sm"
              color="primary"
            />
          </form>

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
import { ref, onMounted } from "vue";
import { Notify, useQuasar } from "quasar";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import axios from "axios";
import logo from "assets/images/logo.png";
import config from "../../neoledger.json";
const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const otpStage = ref(false);
const signupAllowed = ref(false);
const signupData = ref({
  email: "",
  password: "",
  otp: "",
  invite: "",
});

onMounted(async () => {
  $q.cookies.remove("sessionkey");
  if (route.query.invite) {
    signupData.value.invite = route.query.invite;
  }

  try {
    const { data } = await axios.get(`${config.apiurl}/check_signup`, {
      params: { invite: signupData.value.invite },
    });

    const pubSignup = data.public_signup;
    const inviteCode = data.invite_code;

    if (pubSignup === 0) {
      // Public signup disabled
      if (inviteCode === 1) {
        // Valid invite code
        signupAllowed.value = true;
      } else {
        // No valid invite
        signupAllowed.value = false;
        Notify.create({
          message: t("Signup requires a valid invite code"),
          type: "negative",
          position: "center",
        });
      }
    } else {
      // Public signup enabled
      signupAllowed.value = true;
      if (inviteCode === 0 && signupData.value.invite) {
        // Invalid invite with public signup
        Notify.create({
          message: t("Invalid invite code - using public signup"),
          type: "warning",
          position: "center",
        });
        signupData.value.invite = "";
      }
    }
  } catch (error) {
    signupAllowed.value = false;
    Notify.create({
      message: t(error.response?.data?.message || "Signup check failed"),
      type: "negative",
      position: "center",
    });
  }
});

const signupOtp = async () => {
  loading.value = true;
  try {
    const endpoint = signupData.value.invite ? "signup" : "signup_otp";
    const response = await axios.post(`${config.apiurl}/${endpoint}`, {
      email: signupData.value.email,
      password: signupData.value.password,
      ...(signupData.value.invite && { invite: signupData.value.invite }),
    });

    if (signupData.value.invite) {
      Notify.create({
        message: t("Signup successful!"),
        type: "positive",
        position: "top-right",
      });
      const { sessionkey } = response.data;
      $q.cookies.set("sessionkey", sessionkey, { path: "/" });
      router.push("/");
    } else {
      otpStage.value = true;
      Notify.create({
        message: t("OTP sent to your email"),
        type: "positive",
        position: "top-right",
      });
    }
  } catch (error) {
    Notify.create({
      message: t(error.response?.data?.message || "Signup failed"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const confirmSignup = async () => {
  loading.value = true;
  try {
    const response = await axios.post(`${config.apiurl}/signup`, {
      email: signupData.value.email,
      password: signupData.value.password,
      otp: signupData.value.otp,
    });
    const { sessionkey } = response.data;
    $q.cookies.set("sessionkey", sessionkey, { path: "/" });
    router.push("/");
  } catch (error) {
    Notify.create({
      message: t(error.response?.data?.message || "Confirmation failed"),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<!-- Keep existing styles unchanged -->
