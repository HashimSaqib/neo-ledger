<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center lightbg q-pa-md">
        <div
          class="q-pa-xl flex column container mainbg relative-position signup-container"
          style="min-width: 45vw; max-width: 500px"
        >
          <div class="text-center q-mb-lg">
            <q-img :src="logo" class="signup-logo q-mb-md" />
            <div class="text-h5 maintext text-weight-medium q-mb-xs">
              {{ t("Create Account") }}
            </div>
            <div class="mutedtext text-body2">
              {{ t("Sign up to get started") }}
            </div>
          </div>

          <!-- Message for when signups are not allowed -->
          <q-banner
            v-if="!otpStage && !signupAllowed"
            class="bg-negative text-white q-mb-lg"
            rounded
            dense
          >
            <template v-slot:avatar>
              <q-icon name="block" color="white" />
            </template>
            <div class="text-weight-medium">
              {{ t("Signup is not allowed") }}
            </div>
            <div class="text-caption">
              {{
                t(
                  "Please contact an administrator or use a valid invite code to create an account"
                )
              }}
            </div>
          </q-banner>

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
              v-model="signupData.password"
              :label="t('Password')"
              type="password"
              class="lightbg maintext q-mb-md"
              input-class="maintext"
              label-color="secondary"
              outlined
            >
              <template v-slot:prepend>
                <q-icon name="lock" color="primary" />
              </template>
            </q-input>
            <q-input
              v-if="signupData.invite"
              v-model="signupData.invite"
              :label="t('Invite Code')"
              class="lightbg q-mb-lg"
              input-class="maintext"
              label-color="secondary"
              outlined
              readonly
            >
              <template v-slot:prepend>
                <q-icon name="card_giftcard" color="primary" />
              </template>
            </q-input>
            <q-btn
              type="submit"
              :label="signupData.invite ? t('Sign Up') : t('Send OTP')"
              unelevated
              color="primary"
              class="q-py-sm q-mb-md"
            />
            <div class="text-center">
              <q-btn
                flat
                dense
                :label="t('Already have an account? Login')"
                color="secondary"
                @click="router.push('/login')"
                size="sm"
              />
            </div>
          </form>

          <!-- OTP Input Form -->
          <transition
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
            mode="out-in"
          >
            <form
              v-if="otpStage"
              @submit.prevent="confirmSignup"
              class="flex column"
              style="width: 100%"
            >
              <q-banner class="info-banner lightbg q-mb-lg" rounded dense>
                <template v-slot:avatar>
                  <q-icon name="mark_email_read" color="primary" />
                </template>
                <div class="maintext text-caption">
                  {{ t("We've sent a verification code to your email") }}
                </div>
              </q-banner>

              <q-input
                v-model="signupData.otp"
                :label="t('Enter OTP')"
                class="lightbg q-mb-lg"
                input-class="maintext"
                label-color="secondary"
                outlined
                autofocus
              >
                <template v-slot:prepend>
                  <q-icon name="key" color="primary" />
                </template>
              </q-input>
              <q-btn
                type="submit"
                :label="t('Verify & Sign Up')"
                unelevated
                color="primary"
                class="q-py-sm q-mb-md"
                icon-right="check_circle"
              />
              <div class="text-center">
                <q-btn
                  flat
                  dense
                  :label="t('Back')"
                  color="secondary"
                  @click="otpStage = false"
                  size="sm"
                  icon="arrow_back"
                />
              </div>
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
import { Notify, useQuasar, LocalStorage } from "quasar";
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
    if (signupData.value.invite) {
      // If invite code is present, directly call signup
      await confirmSignup();
    } else {
      // Request OTP first
      await axios.post(`${config.apiurl}/signup_otp`, {
        email: signupData.value.email,
        password: signupData.value.password,
      });

      otpStage.value = true;
      Notify.create({
        message: t("OTP sent to your email"),
        type: "positive",
        position: "top-right",
        icon: "mark_email_read",
      });
    }
  } catch (error) {
    Notify.create({
      message: t(error.response?.data?.message || "Failed to send OTP"),
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
    const payload = {
      email: signupData.value.email,
      password: signupData.value.password,
    };

    if (signupData.value.invite) {
      payload.invite = signupData.value.invite;
    } else if (signupData.value.otp) {
      payload.otp = signupData.value.otp;
    }

    const response = await axios.post(`${config.apiurl}/signup`, payload);

    // Check if 2FA setup is required
    if (response.data.requires_2fa_setup) {
      loading.value = false;
      return router.push({
        path: "/2fa/setup",
        state: {
          temp_sessionkey: response.data.temp_sessionkey,
        },
      });
    }

    // Normal signup without 2FA
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
      message: t("Signup successful!"),
      type: "positive",
      position: "top-right",
      icon: "check_circle",
    });

    router.push("/");
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
</script>

<style scoped>
.signup-container {
  animation: fadeInUp 0.4s ease-out;
}

.signup-logo {
  max-width: 200px;
  margin: 0 auto;
}

.info-banner {
  border: 1px solid var(--q-border);
}

.q-btn {
  border-radius: 8px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.3px;
}

.animated {
  animation-duration: 0.3s;
  animation-fill-mode: both;
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
