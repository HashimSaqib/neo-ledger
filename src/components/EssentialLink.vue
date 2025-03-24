<template>
  <div>
    <!-- For links without sublinks -->
    <q-item
      clickable
      tag="a"
      :to="props.link"
      v-if="!hasDropdown"
      class="q-pa-none"
    >
      <!-- Inner wrapper applies left padding without shifting on hover -->
      <div :style="innerStyle" class="row items-center">
        <q-item-section avatar v-if="props.icon" class="maintext">
          <q-icon :name="props.icon" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="maintext">
            {{ props.title }}
          </q-item-label>
        </q-item-section>
      </div>
    </q-item>

    <!-- For links with sublinks -->
    <q-expansion-item
      v-if="hasDropdown"
      v-model="isExpanded"
      expand-separator
      header-class="maintext"
      :icon="props.icon"
      :label="t(props.title)"
    >
      <!-- Loop through sublinks -->
      <template v-for="(sublink, index) in props.sublinks" :key="index">
        <!-- Sublink without further sublinks -->
        <q-item
          v-if="!hasSubDropdown(sublink)"
          clickable
          tag="a"
          :to="sublink.link"
          class="q-pa-none"
        >
          <div
            :style="computeInnerStyle(props.depth + 1)"
            class="row items-center"
          >
            <q-item-section class="maintext">
              {{ sublink.title }}
            </q-item-section>
          </div>
        </q-item>

        <!-- Sublink with further sublinks -->
        <q-expansion-item
          v-if="hasSubDropdown(sublink)"
          :key="'dropdown-' + index"
          expand-separator
          header-class="maintext q-pa-none"
          content-class="q-pa-none"
          class="q-pa-none"
        >
          <template v-slot:header>
            <q-item class="q-pa-none">
              <div
                :style="computeInnerStyle(props.depth + 1)"
                class="row items-center"
              >
                <q-item-section>
                  {{ t(sublink.title) }}
                </q-item-section>
              </div>
            </q-item>
          </template>

          <!-- Recursively render sub-sublinks -->
          <EssentialLink
            v-for="(nestedLink, nestedIndex) in sublink.sublinks"
            :key="nestedIndex"
            :title="t(nestedLink.title)"
            :link="nestedLink.link"
            :sublinks="nestedLink.sublinks"
            :depth="props.depth + 2"
          />
        </q-expansion-item>
      </template>
    </q-expansion-item>
  </div>
</template>

<script setup>
import { computed, inject, ref } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

defineOptions({
  name: "EssentialLink",
});

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: "#",
  },
  icon: {
    type: String,
    default: "",
  },
  sublinks: {
    type: Array,
    default: () => [],
  },
  depth: {
    type: Number,
    default: 0,
  },
  index: {
    type: Number,
    default: -1,
  },
});
// Inject from MainLayout
const activeDropdownIndex = inject("activeDropdownIndex");
const setActiveDropdownIndex = inject("setActiveDropdownIndex");

// State management
const isTopLevel = computed(() => props.depth === 0);
const localExpanded = ref(false);

const isExpanded = computed({
  get() {
    return isTopLevel.value
      ? activeDropdownIndex.value === props.index
      : localExpanded.value;
  },
  set(value) {
    if (isTopLevel.value) {
      setActiveDropdownIndex(value ? props.index : null);
    } else {
      localExpanded.value = value;
    }
  },
});
// Check if this link has sublinks (dropdown)
const hasDropdown = computed(() => props.sublinks && props.sublinks.length > 0);
const hasSubDropdown = (sublink) =>
  sublink.sublinks && sublink.sublinks.length > 0;

// Inner wrapper style applies left padding to the entire content.
// This remains unchanged for top-level links.
const innerStyle = computed(() => ({
  paddingLeft: `${(props.depth + 1) * 1.7}rem`,
}));

// For sublinks, compute an inner style based on the passed depth.
function computeInnerStyle(depth) {
  return {
    paddingLeft: `${(depth + 1) * 2.1}rem`,
  };
}
</script>
