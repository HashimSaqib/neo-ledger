<template>
  <div v-if="client" class="ds">
    <q-btn flat no-caps class="ds__trigger">
      <div class="ds__inner row items-center no-wrap full-width">
        <div class="ds__av-section">
          <q-avatar
            square
            font-size="12px"
            size="30px"
            color="primary"
            text-color="white"
            class="ds__avatar"
          >
            {{ currentInitials }}
          </q-avatar>
        </div>
        <div class="ds__text">
          <div class="ds__name">{{ currentTitle }}</div>
          <div class="ds__sub">{{ currentSubtitle }}</div>
        </div>
        <q-icon name="swap_vert" size="15px" class="ds__caret" />
      </div>

      <q-menu
        anchor="bottom middle"
        self="top middle"
        :offset="[0, 6]"
        content-class="ds__popup"
      >
        <div class="ds__search-wrap">
          <q-input
            v-model="search"
            dense
            outlined
            clearable
            hide-bottom-space
            :placeholder="t('Search company...')"
            class="ds__search"
          >
            <template #prepend>
              <q-icon name="search" size="18px" class="ds__search-icon" />
            </template>
          </q-input>
        </div>

        <q-separator />

        <q-scroll-area
          class="ds__scroll"
          :thumb-style="thumbStyle"
          :bar-style="barStyle"
        >
          <q-list class="ds__list">
            <q-item
              v-for="row in filteredDatasets"
              :key="row.db_name"
              clickable
              v-close-popup
              :active="row.db_name === client"
              active-class="ds__item--active"
              class="ds__item"
              @click="switchTo(row.db_name)"
            >
              <q-item-section avatar class="ds__item-av">
                <q-avatar
                  square
                  font-size="12px"
                  size="34px"
                  color="primary"
                  text-color="white"
                  class="ds__avatar"
                >
                  {{ initialsFromName(row.name) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="ds__item-name">{{
                  row.name
                }}</q-item-label>
                <q-item-label class="ds__item-sub">{{
                  row.db_name
                }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!filteredDatasets.length" dense class="ds__empty">
              <q-item-section>{{ t("No Results Found") }}</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <q-separator />

        <div class="ds__footer">
          <q-btn
            flat
            no-caps
            dense
            color="primary"
            class="ds__footer-btn full-width justify-start"
            :label="t('View All Datasets')"
            icon="open_in_new"
            v-close-popup
            @click="goToCentral"
          />
        </div>
      </q-menu>
    </q-btn>

    <q-separator class="ds__divider" />
  </div>
</template>

<script setup>
import { computed, ref, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { LocalStorage } from "quasar";
import { initialsFromName } from "src/helpers/sessionDatasets";

defineOptions({ name: "DatasetSwitcher" });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const sessionDatasets = inject("sessionDatasets");
const client = computed(() => route.params.client);

const sessionList = computed(() => {
  const v = sessionDatasets?.value;
  return Array.isArray(v) && v.length ? v : [];
});

const displayDatasets = computed(() => {
  if (sessionList.value.length) return sessionList.value;
  const c = client.value;
  if (!c) return [];
  const raw = LocalStorage.getItem("available_db");
  if (raw) {
    const names = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length)
      return names.map((db_name) => ({
        db_name,
        name: db_name,
        access_level: "",
      }));
  }
  return [
    {
      db_name: c,
      name: LocalStorage.getItem(`${c}_company`) || c,
      access_level: "",
    },
  ];
});

const search = ref("");

const thumbStyle = {
  right: "2px",
  borderRadius: "4px",
  width: "4px",
  opacity: 0.3,
};
const barStyle = { right: "2px", width: "6px", opacity: 0 };

const currentRow = computed(() => {
  const c = client.value;
  return (
    displayDatasets.value.find((d) => d.db_name === c) || {
      db_name: c,
      name: LocalStorage.getItem(`${c}_company`) || c || "",
      access_level: "",
    }
  );
});

const currentTitle = computed(() => currentRow.value.name);
const currentInitials = computed(() => initialsFromName(currentRow.value.name));
const currentSubtitle = computed(() => currentRow.value.db_name || "");

const filteredDatasets = computed(() => {
  const q = search.value.trim().toLowerCase();
  const src = displayDatasets.value;
  if (!q) return src;
  return src.filter(
    (d) =>
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.db_name && d.db_name.toLowerCase().includes(q)),
  );
});

function switchTo(dbName) {
  if (!dbName) return;
  window.open(`/client/${dbName}`, "_blank");
}

function goToCentral() {
  window.open(router.resolve({ path: "/" }).href, "_blank");
}
</script>

<style scoped>
.ds {
  flex-shrink: 0;
}

.ds__trigger {
  width: 100%;
  display: flex !important;
  padding: 8px 12px !important;
  justify-content: flex-start !important;
  text-align: left;
  min-height: 0 !important;
  border-radius: 0;
}
.ds__trigger:hover {
  background-color: var(--q-menuactive) !important;
}

.ds__inner {
  min-height: 34px;
  gap: 10px;
}

.ds__av-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ds__avatar {
  border-radius: 6px !important;
  overflow: hidden;
  flex-shrink: 0;
}

.ds__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.ds__name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--q-menutext);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds__sub {
  font-size: 11px;
  line-height: 1.3;
  margin-top: 1px;
  color: var(--q-menuheader);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds__caret {
  color: var(--q-menuheader);
  flex-shrink: 0;
  margin-right: 8px;
}

.ds__divider {
  margin: -1px 0 10px;
  background: var(--q-border);
}

/* ── dropdown items ────────────────────────────────── */
.ds__item {
  border-radius: 6px;
  min-height: 44px;
  padding: 6px 8px;
  margin-bottom: 1px;
}

.ds__item:hover:not(.ds__item--active) {
  background-color: rgba(0, 0, 0, 0.04);
}

.ds__item--active {
  background-color: var(--q-menuactive) !important;
}

.ds__item-av {
  min-width: 46px;
}

.ds__item-av .ds__avatar {
  border-radius: 6px !important;
  overflow: hidden;
}

.ds__item-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--q-maintext);
}

.ds__item-sub {
  font-size: 11px;
  line-height: 1.3;
  margin-top: 1px;
  color: var(--q-menuheader);
}

.ds__search-wrap {
  padding: 12px 12px 10px;
}

.ds__search :deep(.q-field__control) {
  border-radius: 7px;
  min-height: 34px;
  border: 1px solid var(--q-border);
}

.ds__search :deep(.q-field__control:before) {
  border-color: transparent !important;
}

.ds__search-icon {
  color: var(--q-menuheader);
}

.ds__scroll {
  height: min(280px, 42vh);
}

.ds__list {
  padding: 6px 10px;
}

.ds__empty {
  color: var(--q-menuheader);
  font-size: 12px;
  padding: 12px 10px;
}

.ds__footer {
  padding: 8px 10px 10px;
}

.ds__footer-btn {
  font-weight: 500;
  font-size: 13px;
}

.ds__footer-btn :deep(.q-icon) {
  font-size: 16px;
  margin-right: 5px;
}
</style>

<style>
/* Teleported popup */
.ds__popup {
  border-radius: 12px !important;
  overflow: hidden;
  min-width: 288px;
  max-width: 320px;
  background: var(--q-mainbg) !important;
  border: 1px solid var(--q-border);
  box-shadow:
    0 8px 32px rgba(15, 23, 42, 0.1),
    0 2px 8px rgba(15, 23, 42, 0.06);
}

/* Mini drawer – only hide text/caret; no layout changes so avatar
   stays put and nothing flashes. The drawer's own overflow clips. */
.q-drawer--mini .ds__text,
.q-drawer--mini .ds__caret {
  display: none;
}

.q-drawer--mini .ds__divider {
  margin: -1px 0 10px;
}
</style>
