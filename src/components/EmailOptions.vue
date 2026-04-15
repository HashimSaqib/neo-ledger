<template>
  <div class="email-options relative-position">
    <div class="row q-col-gutter-sm">
      <div class="col-12">
        <text-input
          v-model="emailData.email"
          outlined
          dense
          :label="t('Email')"
          bg-color="input"
          label-color="secondary"
          :placeholder="t('Single Email')"
        />
      </div>
      <div class="col-12">
        <text-input
          v-model="emailData.subject"
          outlined
          dense
          :label="t('Subject')"
          bg-color="input"
          label-color="secondary"
          :placeholder="t('Subject')"
        />
      </div>
      <div class="col-12">
        <text-input
          v-model="emailData.cc"
          outlined
          dense
          :label="t('CC')"
          bg-color="input"
          label-color="secondary"
          :placeholder="t('Comma seperated list')"
        />
      </div>
      <div class="col-12">
        <text-input
          v-model="emailData.bcc"
          outlined
          dense
          :label="t('BCC')"
          bg-color="input"
          label-color="secondary"
          :placeholder="t('Comma seperated list ')"
        />
      </div>
      <div class="col-12">
        <text-input
          v-model="emailData.message"
          outlined
          type="textarea"
          :label="t('Message')"
          bg-color="input"
          label-color="secondary"
          rows="4"
          :placeholder="t('Email Message')"
        />
      </div>
      <div
        v-if="isReminderEmailType"
        class="col-12 text-caption text-grey-7 q-px-xs"
      >
        {{ t("Leave blank to use the customer or vendor template and company defaults.") }}
      </div>
      <div class="col-12">
        <s-button
          color="primary"
          :label="t('Send Email')"
          @click="sendEmail"
          class="full-width"
          type="primary"
          icon="send"
        />
      </div>
    </div>
  </div>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="50px" color="primary" />
  </q-inner-loading>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({
  vc: {
    type: String,
    default: "customer",
  },
  invId: {
    type: String,
    required: true,
  },
  selectedCustomer: {
    type: Object,
    default: () => ({}),
  },
  selectedVendor: {
    type: Object,
    default: () => ({}),
  },
  invNumber: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "invoice",
  },
  email_message: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close"]);
const loading = ref(false);

const contactParty = computed(() =>
  props.vc === "vendor"
    ? props.selectedVendor || {}
    : props.selectedCustomer || {},
);

const isReminderEmailType = computed(() =>
  /^reminder[123]$/.test(props.type || ""),
);

const emailData = ref({
  email: "",
  subject: "",
  cc: "",
  bcc: "",
  message: "",
  inline: 0,
  attachment: "tex",
  vc: props.vc,
  invId: props.invId,
});

function syncPartyFields() {
  const party = contactParty.value;
  if (!party || typeof party !== "object") return;
  emailData.value.email = party.email || "";
  emailData.value.cc = party.cc || "";
  emailData.value.bcc = party.bcc || "";
}

function syncPrefilledMessage() {
  emailData.value.message = props.email_message || "";
}

function syncSubject() {
  const num = props.invNumber;
  if (!num) return;
  const typ = props.type || "invoice";
  const m = /^reminder([123])$/.exec(typ);
  if (m) {
    emailData.value.subject = `${t("Reminder")} ${m[1]} — ${num}`;
    return;
  }
  if (typ === "credit_invoice") {
    emailData.value.subject = `${t("Credit Invoice")} ${num}`;
    return;
  }
  if (typ === "debit_invoice") {
    emailData.value.subject = `${t("Debit Invoice")} ${num}`;
    return;
  }
  emailData.value.subject = `${t("Invoice")} ${num}`;
}

watch(
  contactParty,
  () => {
    syncPartyFields();
    syncPrefilledMessage();
  },
  { immediate: true, deep: true },
);

watch(
  () => props.email_message,
  () => {
    syncPrefilledMessage();
  },
  { immediate: true },
);

watch(
  () => [props.type, props.invNumber],
  () => {
    syncSubject();
  },
  { immediate: true },
);

watch(
  () => props.invId,
  (newId) => {
    if (newId) {
      emailData.value.invId = newId;
    }
  },
  { immediate: true },
);

watch(
  () => props.vc,
  (v) => {
    emailData.value.vc = v;
  },
);

// Send Email function
const sendEmail = async () => {
  loading.value = true;
  try {
    const emailPayload = {
      vc: emailData.value.vc,
      id: emailData.value.invId,
      type: props.type,
      attachment: emailData.value.attachment,
      inline: emailData.value.inline,
      email: emailData.value.email,
      cc: emailData.value.cc,
      bcc: emailData.value.bcc,
      message: emailData.value.message,
    };

    const response = await api.post("/send_email", emailPayload);

    if (response.data.success) {
      Notify.create({
        message: response.data.message || "Email sent successfully",
        type: "positive",
        position: "top-right",
      });
      emit("close");
    } else {
      throw new Error(response.data.message || "Unknown error occurred");
    }
  } catch (error) {
    console.error("Error sending email:", error);
    Notify.create({
      message: error.response?.data?.message || "Failed to send email",
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  syncPartyFields();
  emailData.value.vc = props.vc;
  emailData.value.invId = props.invId;
  syncPrefilledMessage();
  syncSubject();
});
</script>
