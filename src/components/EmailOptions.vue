<template>
  <div class="email-options relative-position">
    <div class="row q-col-gutter-sm">
      <div class="col-12">
        <q-input
          v-model="emailData.email"
          outlined
          dense
          :label="t('Email')"
          bg-color="input"
          label-color="secondary"
        />
      </div>
      <div class="col-12">
        <q-input
          v-model="emailData.subject"
          outlined
          dense
          :label="t('Subject')"
          bg-color="input"
          label-color="secondary"
        />
      </div>
      <div class="col-12">
        <q-input
          v-model="emailData.cc"
          outlined
          dense
          :label="t('CC')"
          bg-color="input"
          label-color="secondary"
        />
      </div>
      <div class="col-12">
        <q-input
          v-model="emailData.bcc"
          outlined
          dense
          :label="t('BCC')"
          bg-color="input"
          label-color="secondary"
        />
      </div>
      <div class="col-12">
        <q-input
          v-model="emailData.message"
          outlined
          type="textarea"
          :label="t('Message')"
          bg-color="input"
          label-color="secondary"
          rows="4"
        />
      </div>
      <div class="col-6">
        <q-checkbox
          v-model="emailData.inline"
          :true-value="1"
          :false-value="0"
          :label="t('Inline (HTML)')"
        />
      </div>
      <div class="col-6">
        <q-select
          v-model="emailData.attachment"
          :options="attachmentOptions"
          :label="t('Attachment (PDF)')"
          outlined
          dense
          bg-color="input"
          label-color="secondary"
          emit-value
          map-options
        />
      </div>
      <div class="col-12">
        <q-btn
          color="primary"
          :label="t('Send Email')"
          @click="sendEmail"
          class="full-width"
        />
      </div>
    </div>
  </div>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="50px" color="primary" />
  </q-inner-loading>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";

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
  invNumber: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "invoice",
  },
});

const emit = defineEmits(["close"]);
const loading = ref(false);

const attachmentOptions = [
  { label: t("TEX"), value: "tex" },
  { label: t("HTML"), value: "html" },
  { label: t("None"), value: "" },
];

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

// Watch for changes in selectedCustomer
watch(
  () => props.selectedCustomer,
  (newCustomer) => {
    if (newCustomer) {
      emailData.value.email = newCustomer.email || "";
      emailData.value.cc = newCustomer.cc || "";
      emailData.value.bcc = newCustomer.bcc || "";
    }
  },
  { immediate: true, deep: true }
);

// Watch for changes in invId
watch(
  () => props.invId,
  (newId) => {
    if (newId) {
      emailData.value.invId = newId;
    }
  },
  { immediate: true }
);

// Watch for changes in invNumber and invType
watch(
  [() => props.invNumber, () => props.invType],
  ([newInvNumber, newInvType]) => {
    if (newInvNumber) {
      const type =
        newInvType === "credit_invoice" ? "Credit Invoice" : "Invoice";
      emailData.value.subject = `${type} ${newInvNumber}`;
    }
  },
  { immediate: true }
);

// Send Email function
const sendEmail = async () => {
  loading.value = true;
  try {
    // Prepare the email data according to the backend API requirements
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

    // Send the email via API
    const response = await api.post("/send_email", emailPayload);

    if (response.data.success) {
      Notify.create({
        message: response.data.message || "Email sent successfully",
        type: "positive",
        position: "center",
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
  // Set initial values from props
  if (props.selectedCustomer) {
    emailData.value.email = props.selectedCustomer.email || "";
    emailData.value.cc = props.selectedCustomer.cc || "";
    emailData.value.bcc = props.selectedCustomer.bcc || "";
  }
  emailData.value.vc = props.vc;
  emailData.value.invId = props.invId;
});
</script>
