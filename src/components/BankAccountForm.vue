<template>
  <q-dialog
    v-model="isOpen"
    persistent
    @update:model-value="$emit('update:model-value', $event)"
  >
    <q-card style="min-width: 500px; max-width: 600px">
      <q-card-section class="row items-center">
        <div class="text-h6 text-weight-medium col">
          {{ editingBank ? "Edit Bank Account" : "Add Bank Account" }}
        </div>
        <q-btn icon="close" flat round dense @click="handleClose" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form @submit.prevent="handleSave" class="q-gutter-md">
          <!-- Basic Information -->
          <div class="text-subtitle2 text-weight-medium">Basic Information</div>
          <text-input
            v-model="bankForm.name"
            name="bank_name"
            label="Bank Name"
            outlined
            dense
            class="q-mb-lg"
          />
          <bank-input
            v-model="bankForm.iban"
            type="iban"
            label="IBAN"
            outlined
            dense
          />
          <bank-input
            v-model="bankForm.qriban"
            type="qriban"
            label="QR-IBAN"
            outlined
            dense
          />
          <div class="text-caption text-grey-7">
            * Either IBAN or QR-IBAN is required
          </div>
          <bank-input
            v-model="bankForm.bic"
            type="bic"
            label="BIC/SWIFT"
            outlined
            dense
          />

          <!-- Address Information -->
          <div class="text-subtitle2 text-weight-medium q-mt-md">Address</div>
          <text-input
            v-model="bankForm.address1"
            name="address1"
            label="Street Name"
            outlined
            dense
          />
          <text-input
            v-model="bankForm.street"
            name="street"
            label="Street Number"
            outlined
            dense
          />
          <text-input
            v-model="bankForm.address2"
            name="address2"
            label="Address 2"
            outlined
            dense
          />
          <text-input
            v-model="bankForm.post_office"
            name="post_office"
            label="Postal Office"
            outlined
            dense
          />
          <text-input
            v-model="bankForm.city"
            name="city"
            label="City"
            outlined
            dense
          />
          <div class="row">
            <text-input
              v-model="bankForm.zipcode"
              name="zipcode"
              label="Zip/Postal Code"
              outlined
              dense
              class="col-5 q-mr-sm"
            />
            <country-input
              v-model="bankForm.country"
              name="country"
              label="Country"
              outlined
              dense
              class="col-6"
            />
          </div>

          <!-- Additional Information -->
          <div class="text-subtitle2 text-weight-medium q-mt-md">
            Additional Information
          </div>
          <text-input
            v-model="bankForm.dcn"
            name="dcn"
            label="DCN"
            outlined
            dense
          />
          <text-input
            v-model="bankForm.rvc"
            name="rvc"
            label="RVC"
            outlined
            dense
          />
          <text-input
            v-model="bankForm.membernumber"
            name="membernumber"
            label="Member Number"
            outlined
            dense
          />
          <text-input
            v-model="bankForm.clearingnumber"
            name="clearingnumber"
            label="BC Number"
            outlined
            dense
          />

          <!-- Default Setting -->
          <q-checkbox
            v-model="bankForm.is_primary"
            label="Set as Default Bank Account"
            :true-value="1"
            :false-value="0"
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="grey-7" @click="handleClose" />
        <q-btn
          label="Save"
          color="primary"
          unelevated
          @click="handleSave"
          :loading="loading"
          :disable="loading"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import BankInput from "src/components/inputs/BankInput.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  editingBank: {
    type: Object,
    default: null,
  },
  transId: {
    type: [String, Number],
    default: null,
  },
  vcType: {
    type: String,
    required: true,
    validator: (value) => ["customer", "vendor"].includes(value),
  },
  requireExistingRecord: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:model-value", "saved", "close"]);

const isOpen = ref(props.modelValue);
const loading = ref(false);

const bankForm = ref({
  id: null,
  name: "",
  iban: "",
  qriban: "",
  bic: "",
  street: "",
  address1: "",
  address2: "",
  post_office: "",
  city: "",
  zipcode: "",
  country: "",
  dcn: "",
  rvc: "",
  membernumber: "",
  clearingnumber: "",
  is_primary: 0,
});

// Reset form to initial state
const resetForm = () => {
  bankForm.value = {
    id: null,
    name: "",
    iban: "",
    qriban: "",
    bic: "",
    street: "",
    address1: "",
    address2: "",
    post_office: "",
    city: "",
    zipcode: "",
    country: "",
    dcn: "",
    rvc: "",
    membernumber: "",
    clearingnumber: "",
    is_primary: 0,
  };
};

// Watch for dialog open/close
watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue;
  }
);

// Watch isOpen to sync with parent
watch(isOpen, (newValue) => {
  emit("update:model-value", newValue);
});

// Watch editingBank to populate form when editing
watch(
  () => props.editingBank,
  (newBank) => {
    if (newBank && props.modelValue) {
      bankForm.value = {
        id: newBank.id || null,
        name: newBank.name || "",
        iban: newBank.iban || "",
        qriban: newBank.qriban || "",
        bic: newBank.bic || "",
        street: newBank.street || "",
        address1: newBank.address1 || "",
        address2: newBank.address2 || "",
        post_office: newBank.post_office || "",
        city: newBank.city || "",
        zipcode: newBank.zipcode || "",
        country: newBank.country || "",
        dcn: newBank.dcn || "",
        rvc: newBank.rvc || "",
        membernumber: newBank.membernumber || "",
        clearingnumber: newBank.clearingnumber || "",
        is_primary: newBank.is_primary ? 1 : 0,
      };
    } else if (!newBank && props.modelValue) {
      resetForm();
    }
  },
  { immediate: true }
);

const handleClose = () => {
  resetForm();
  isOpen.value = false;
  emit("close");
};

const handleSave = async () => {
  // Validate that at least one of IBAN or QRIBAN is provided
  const hasIban = bankForm.value.iban && bankForm.value.iban.trim() !== "";
  const hasQriban =
    bankForm.value.qriban && bankForm.value.qriban.trim() !== "";

  if (!hasIban && !hasQriban) {
    Notify.create({
      message: "Either IBAN or QR-IBAN is required",
      type: "negative",
    });
    return;
  }

  // Check if we need an existing record
  if (props.requireExistingRecord && !props.transId) {
    Notify.create({
      message: "Please save the customer/vendor first",
      type: "negative",
    });
    return;
  }

  try {
    loading.value = true;

    const payload = {
      ...bankForm.value,
      trans_id: props.transId,
    };

    console.log("Saving bank account with payload:", payload);

    await api.post(`/vc/${props.vcType}/bank`, payload);

    Notify.create({
      message: "Bank account saved successfully",
      type: "positive",
    });

    resetForm();
    isOpen.value = false;
    emit("saved");
    emit("close");
  } catch (error) {
    console.error("Failed to save bank account:", error);
    Notify.create({
      message: "Failed to save bank account",
      type: "negative",
    });
  } finally {
    loading.value = false;
  }
};
</script>
