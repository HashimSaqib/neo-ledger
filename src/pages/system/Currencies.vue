<template>
  <q-page class="lightbg q-pa-sm">
    <q-table
      :rows="currencies"
      :columns="columns"
      row-key="rn"
      flat
      bordered
      separator="horizontal"
      hide-bottom
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            :label="t('Edit')"
            color="primary"
            @click="openEditPopup(props.row)"
            flat
            size="sm"
          />
        </q-td>
      </template>
    </q-table>
    <q-btn
      :label="t('Add Currency')"
      color="primary"
      @click="openAddPopup"
      size="sm"
      class="q-my-md"
    />

    <!-- Popup for adding or editing currency -->
    <q-dialog v-model="editDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">
            {{ isEditMode ? t("Edit") : t("Add") }} {{ t("Currency") }}
          </div>

          <q-input
            v-model="selectedCurrency.curr"
            :label="t('Currency')"
            outlined
            dense
            class="q-my-md"
            maxlength="3"
            minlength="3"
          />
          <q-input
            v-model="selectedCurrency.prec"
            :label="t('Precision')"
            outlined
            dense
            type="number"
            class="q-my-md"
            :min="0"
            :max="10"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-mt-none q-pt-none">
          <q-btn flat :label="t('Cancel')" color="negative" v-close-popup />
          <q-btn
            flat
            :label="t('Save')"
            color="positive"
            @click="saveCurrency"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Currencies"));
const currencies = ref([]);
const editDialog = ref(false);
const isEditMode = ref(false);
const selectedCurrency = ref({ curr: "", prec: 0, rn: 0 });

const columns = computed(() => [
  { name: "curr", label: t("Currency"), field: "curr", align: "left" },
  { name: "prec", label: t("Precision"), field: "prec", align: "left" },
  { name: "rn", label: t("RN"), field: "rn", align: "left" },
  { name: "actions", label: t("Actions"), align: "right" },
]);

const getCurrencies = async () => {
  try {
    const response = await api.get("/system/currencies");
    currencies.value = response.data;
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("Can't fetch currencies"),
      type: "negative",
      position: "center",
    });
  }
};

const openAddPopup = () => {
  selectedCurrency.value = { curr: "", prec: 2 };
  isEditMode.value = false;
  editDialog.value = true;
};

const openEditPopup = (currency) => {
  selectedCurrency.value = { ...currency };
  isEditMode.value = true;
  editDialog.value = true;
};

const saveCurrency = async () => {
  try {
    if (isEditMode.value) {
      // PUT request to update the currency
      await api.put(
        `/system/currencies/
      `,
        {
          curr: selectedCurrency.value.curr,
          prec: selectedCurrency.value.prec,
        }
      );
      Notify.create({
        message: t("Currency {0} updated successfully!", [
          selectedCurrency.value.curr,
        ]),
        type: "positive",
        position: "top-right",
      });
    } else {
      // POST request to create a new currency
      await api.post("/system/currencies", {
        curr: selectedCurrency.value.curr,
        prec: selectedCurrency.value.prec,
      });
      Notify.create({
        message: t("Currency {0} added successfully!", [
          selectedCurrency.value.curr,
        ]),
        type: "positive",
        position: "top-right",
      });
    }
    editDialog.value = false;
    getCurrencies(); // Refresh the table data
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("An error occurred"),
      type: "negative",
      position: "center",
    });
  }
};

onMounted(() => {
  getCurrencies();
});
</script>
