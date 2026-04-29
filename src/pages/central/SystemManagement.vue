<template>
  <div v-if="managementLoading" class="flex flex-center q-pa-xl">
    <q-spinner-dots size="50px" color="primary" />
  </div>

  <template v-else-if="managementSettings">
    <div class="row q-col-gutter-md">
      <!-- User Access -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="settings-card">
          <div class="settings-card__header">
            <q-icon name="manage_accounts" size="18px" color="primary" />
            <span>{{ t("User Access") }}</span>
          </div>
          <q-separator />

          <q-list>
            <q-item class="toggle-row">
              <q-item-section>
                <q-item-label class="text-weight-medium">{{
                  t("Public Signup")
                }}</q-item-label>
                <q-item-label caption>{{
                  t("Allow anyone to register without an invite")
                }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="managementSettings.public_signup"
                  color="primary"
                />
              </q-item-section>
            </q-item>

            <q-separator inset />

            <q-item class="toggle-row">
              <q-item-section>
                <q-item-label class="text-weight-medium">{{
                  t("Allow Dataset Creation")
                }}</q-item-label>
                <q-item-label caption>{{
                  t("Allow any authenticated user to create a dataset")
                }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="managementSettings.allow_db_creation"
                  color="primary"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Dataset Creation Rules -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="settings-card">
          <div class="settings-card__header">
            <q-icon name="rule" size="18px" color="primary" />
            <span>{{ t("Dataset Creation Rules") }}</span>
            <q-chip
              v-if="managementSettings.allow_db_creation"
              dense
              color="positive"
              text-color="white"
              size="xs"
              class="q-ml-xs"
            >
              {{ t("Unrestricted") }}
            </q-chip>
          </div>
          <q-separator />

          <div class="q-pa-md">
            <p class="text-caption text-grey q-mb-md q-mt-none">
              {{ t("Applied when free dataset creation is disabled") }}
            </p>

            <!-- Allowed Emails -->
            <div class="q-mb-lg">
              <div class="field-label">{{ t("Allowed Emails") }}</div>
              <div
                v-if="
                  managementSettings.db_creation_rules.allowed_emails.length
                "
                class="chip-list q-mb-sm"
              >
                <q-chip
                  v-for="email in managementSettings.db_creation_rules
                    .allowed_emails"
                  :key="email"
                  removable
                  dense
                  color="primary"
                  text-color="white"
                  size="sm"
                  :disable="managementSettings.allow_db_creation"
                  @remove="
                    removeFromArray(
                      managementSettings.db_creation_rules.allowed_emails,
                      email,
                    )
                  "
                >
                  {{ email }}
                </q-chip>
              </div>
              <div v-else class="text-caption text-grey q-mb-sm">
                {{ t("No emails added") }}
              </div>
              <div class="row items-center q-gutter-xs">
                <q-input
                  v-model="newAllowedEmail"
                  dense
                  outlined
                  :placeholder="t('Add email...')"
                  class="col-grow"
                  :disable="managementSettings.allow_db_creation"
                  @keyup.enter="addAllowedEmail"
                />
                <q-btn
                  icon="add"
                  color="primary"
                  unelevated
                  dense
                  :disable="
                    managementSettings.allow_db_creation || !newAllowedEmail
                  "
                  @click="addAllowedEmail"
                  style="height: 40px; width: 40px"
                />
              </div>
            </div>

            <!-- Allowed Domains -->
            <div>
              <div class="field-label">{{ t("Allowed Domains") }}</div>
              <div
                v-if="
                  managementSettings.db_creation_rules.allowed_domains.length
                "
                class="chip-list q-mb-sm"
              >
                <q-chip
                  v-for="domain in managementSettings.db_creation_rules
                    .allowed_domains"
                  :key="domain"
                  removable
                  dense
                  color="secondary"
                  text-color="white"
                  size="sm"
                  :disable="managementSettings.allow_db_creation"
                  @remove="
                    removeFromArray(
                      managementSettings.db_creation_rules.allowed_domains,
                      domain,
                    )
                  "
                >
                  {{ domain }}
                </q-chip>
              </div>
              <div v-else class="text-caption text-grey q-mb-sm">
                {{ t("No domains added") }}
              </div>
              <div class="row items-center q-gutter-xs">
                <q-input
                  v-model="newAllowedDomain"
                  dense
                  outlined
                  :placeholder="t('Add domain...')"
                  class="col-grow"
                  :disable="managementSettings.allow_db_creation"
                  @keyup.enter="addAllowedDomain"
                />
                <q-btn
                  icon="add"
                  color="primary"
                  unelevated
                  dense
                  :disable="
                    managementSettings.allow_db_creation || !newAllowedDomain
                  "
                  @click="addAllowedDomain"
                  style="height: 40px; width: 40px"
                />
              </div>
            </div>
          </div>
        </q-card>
      </div>

      <!-- Global Dataset Admins -->
      <div class="col-12">
        <q-card flat bordered class="settings-card">
          <div class="settings-card__header">
            <q-icon name="shield" size="18px" color="primary" />
            <span>{{ t("Global Dataset Admins") }}</span>
          </div>
          <q-separator />

          <div class="q-pa-md">
            <p class="text-caption text-grey q-mb-md q-mt-none">
              {{
                t(
                  "Emails automatically granted admin on every newly created dataset",
                )
              }}
            </p>

            <div
              v-if="managementSettings.global_dataset_admins.length"
              class="chip-list q-mb-sm"
            >
              <q-chip
                v-for="admin in managementSettings.global_dataset_admins"
                :key="admin"
                removable
                dense
                color="accent"
                text-color="white"
                size="sm"
                @remove="
                  removeFromArray(
                    managementSettings.global_dataset_admins,
                    admin,
                  )
                "
              >
                {{ admin }}
              </q-chip>
            </div>
            <div v-else class="text-caption text-grey q-mb-sm">
              {{ t("No global admins added") }}
            </div>

            <div class="row items-center q-gutter-xs" style="max-width: 480px">
              <q-input
                v-model="newGlobalAdmin"
                dense
                outlined
                :placeholder="t('Add admin email...')"
                class="col-grow"
                @keyup.enter="addGlobalAdmin"
              />
              <q-btn
                icon="add"
                color="primary"
                unelevated
                dense
                :disable="!newGlobalAdmin"
                @click="addGlobalAdmin"
                style="height: 40px; width: 40px"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <div class="row justify-end q-mt-md">
      <q-btn
        :label="t('Save Settings')"
        color="primary"
        icon="save"
        unelevated
        @click="saveManagementSettings"
        :loading="managementSaving"
      />
    </div>
  </template>

  <!-- Empty / error state -->
  <div v-else class="flex flex-center column q-py-xl text-grey text-center">
    <q-icon name="admin_panel_settings" size="64px" />
    <div class="text-h6 q-mt-md">{{ t("System Management") }}</div>
    <div class="text-body2 q-mb-md">
      {{ t("Configure system-wide settings") }}
    </div>
    <q-btn
      :label="t('Load Settings')"
      color="primary"
      icon="refresh"
      unelevated
      @click="loadManagementSettings"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const managementSettings = ref(null);
const managementLoading = ref(false);
const managementSaving = ref(false);
const newAllowedEmail = ref("");
const newAllowedDomain = ref("");
const newGlobalAdmin = ref("");

const loadManagementSettings = async () => {
  managementLoading.value = true;
  try {
    const response = await api.get("/management/settings");
    managementSettings.value = response.data;
  } catch (err) {
    Notify.create({
      message: err.response?.data?.message || t("Failed to load settings"),
      type: "negative",
      position: "center",
    });
  } finally {
    managementLoading.value = false;
  }
};

const saveManagementSettings = async () => {
  managementSaving.value = true;
  try {
    const response = await api.put(
      "/management/settings",
      managementSettings.value,
    );
    managementSettings.value = response.data;
    Notify.create({
      message: t("Settings saved successfully"),
      type: "positive",
      position: "top-right",
    });
  } catch (err) {
    Notify.create({
      message: err.response?.data?.message || t("Failed to save settings"),
      type: "negative",
      position: "center",
    });
  } finally {
    managementSaving.value = false;
  }
};

const addAllowedEmail = () => {
  const val = newAllowedEmail.value.trim();
  if (
    val &&
    !managementSettings.value.db_creation_rules.allowed_emails.includes(val)
  ) {
    managementSettings.value.db_creation_rules.allowed_emails.push(val);
    newAllowedEmail.value = "";
  }
};

const addAllowedDomain = () => {
  const val = newAllowedDomain.value.trim();
  if (
    val &&
    !managementSettings.value.db_creation_rules.allowed_domains.includes(val)
  ) {
    managementSettings.value.db_creation_rules.allowed_domains.push(val);
    newAllowedDomain.value = "";
  }
};

const addGlobalAdmin = () => {
  const val = newGlobalAdmin.value.trim();
  if (val && !managementSettings.value.global_dataset_admins.includes(val)) {
    managementSettings.value.global_dataset_admins.push(val);
    newGlobalAdmin.value = "";
  }
};

const removeFromArray = (arr, item) => {
  const idx = arr.indexOf(item);
  if (idx !== -1) arr.splice(idx, 1);
};

onMounted(() => {
  loadManagementSettings();
});
</script>

<style scoped>
.settings-card {
  height: 100%;
}

.settings-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.toggle-row {
  padding-top: 12px;
  padding-bottom: 12px;
}

.field-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--q-lighttext, #888);
  margin-bottom: 6px;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
