<!-- SettingsPanel.vue -->
<template>
  <q-expansion-item
    icon="settings"
    :label="$t('Settings')"
    class="settings-panel mainbg"
    dense-toggle
    expand-separator
  >
    <q-list padding>
      <!-- Dark Mode Toggle -->
      <q-item>
        <q-item-section avatar>
          <q-icon :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'" />
        </q-item-section>
        <q-item-section>
          <q-toggle
            v-model="$q.dark.isActive"
            @update:model-value="setTheme"
            :label="$t($q.dark.isActive ? 'Dark Mode' : 'Light Mode')"
            dense
          />
        </q-item-section>
      </q-item>

      <!-- Language Picker -->
      <q-item>
        <q-item-section avatar>
          <q-icon name="language" />
        </q-item-section>
        <q-item-section>
          <q-select
            v-model="selectedLanguage"
            :options="languages"
            dense
            options-dense
            @update:model-value="switchLanguage"
            outlined
            :label="$t('Language')"
            class="q-px-none"
          >
            <template v-slot:option="{ itemProps, opt }">
              <q-item v-bind="itemProps" clickable @click="switchLanguage(opt)">
                <q-item-section>{{ opt.label }}</q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-item-section>
      </q-item>

      <!-- Number Format Picker -->
      <q-item>
        <q-item-section avatar>
          <q-icon name="format_list_numbered" />
        </q-item-section>
        <q-item-section>
          <q-select
            v-model="selectedNumberFormat"
            :options="numberFormats"
            dense
            options-dense
            @update:model-value="handleNumberFormatChange"
            outlined
            :label="$t('Number Format')"
            class="q-px-none"
          >
            <template v-slot:option="{ itemProps, opt }">
              <q-item
                v-bind="itemProps"
                clickable
                @click="handleNumberFormatChange(opt)"
              >
                <q-item-section>
                  <q-item-label>{{ opt.label }}</q-item-label>
                  <q-item-label caption>{{ opt.example }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-item-section>
      </q-item>

      <div>
        <s-select
          v-model="selectedDb"
          :options="dbOptions"
          dense
          options-dense
          @update:model-value="switchDatabase"
          outlined
          :label="$t('Switch Database')"
          class="q-px-none"
        >
          <!-- No emit-value/map-options needed if options are just strings -->
          <template v-slot:prepend>
            <q-icon name="open_in_new" size="xs" class="q-mr-xs" />
            <!-- Hint that it opens a new tab -->
          </template>
        </s-select>
      </div>

      <!-- Logout Button -->
      <q-separator spaced />
      <q-item clickable v-ripple @click="handleLogout" class="text-negative">
        <q-item-section avatar>
          <q-icon name="logout" color="negative" />
        </q-item-section>
        <q-item-section>{{ $t("Logout") }}</q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Cookies, LocalStorage } from "quasar";
import { setTheme } from "src/boot/theme";
import { i18n, loadLanguagePack } from "src/boot/i18n";
import axios from "axios";
import config from "../../neoledger.json";

defineOptions({
  name: "SettingsPanel",
});

const router = useRouter();
const languages = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
];

const selectedLanguage = ref(
  languages.find((lang) => lang.value === i18n.global.locale.value) ||
    languages[0]
);

function switchLanguage(lang) {
  if (i18n.global.locale.value !== lang.value) {
    loadLanguagePack(lang.value);
  }
}

// Number format options
const numberFormats = [
  {
    value: "1,000.00",
    label: "1,000.00",
    example: "Comma thousands, dot decimal",
  },
  {
    value: "1'000.00",
    label: "1'000.00",
    example: "Apostrophe thousands, dot decimal",
  },
  {
    value: "1.000,00",
    label: "1.000,00",
    example: "Dot thousands, comma decimal",
  },
  {
    value: "1000,00",
    label: "1000,00",
    example: "No thousands separator, comma decimal",
  },
  {
    value: "1000.00",
    label: "1000.00",
    example: "No thousands separator, dot decimal",
  },
];

const selectedNumberFormat = ref(null);

const handleNumberFormatChange = async (format) => {
  if (format) {
    selectedNumberFormat.value = format;
    LocalStorage.set("numberFormat", format.value);

    try {
      const sessionkey = Cookies.get("sessionkey");
      const axiosConfig = {
        headers: {
          Authorization: sessionkey,
          "Content-Type": "application/json",
        },
      };

      const response = await axios.post(
        `${config.apiurl}/update_config`,
        {
          number_format: format.value,
        },
        axiosConfig
      );

      if (response.data.success) {
        // Optional: Show success message
        console.log("Number format updated successfully");
      }
    } catch (error) {
      console.error("Error updating number format:", error);
      // Optional: Show error message to user
      if (error.response?.data?.error) {
        console.error("Server error:", error.response.data.error);
      }
    }
  }
};

const dbOptions = ref([]);
const selectedDb = ref(null);
const loadDbOptions = () => {
  const availableDbString = LocalStorage.getItem("available_db");
  if (availableDbString) {
    dbOptions.value = availableDbString.split(",");
  } else {
    dbOptions.value = []; // Ensure it's empty if nothing in storage
  }
};
function switchDatabase(dbName) {
  if (!dbName) return; // Avoid issues if null is somehow selected

  const url = `/client/${dbName}`;
  window.open(url, "_blank"); // Open in new tab

  selectedDb.value = null;
}
onMounted(() => {
  loadDbOptions();

  // Load saved number format from localStorage
  const savedFormat = LocalStorage.getItem("numberFormat");
  if (savedFormat) {
    const format = numberFormats.find((f) => f.value === savedFormat);
    if (format) {
      selectedNumberFormat.value = format;
    }
  } else {
    // Default to first format
    selectedNumberFormat.value = numberFormats[0];
  }
});

async function handleLogout() {
  Cookies.remove("client");
  Cookies.remove("sessionkey");
  await router.push("/login");
}
</script>
