<template>
  <div>
    <q-item clickable tag="a" :to="props.link" v-if="!hasDropdown">
      <q-item-section>
        <q-item-label class="maintext q-py-md">{{ displayTitle }}</q-item-label>
      </q-item-section>
    </q-item>

    <!-- For items with sublinks -->
    <q-expansion-item
      v-if="hasDropdown"
      :label="t(displayTitle)"
      expand-separator
      header-class="maintext"
      expand-icon-class="maintext"
      class="q-py-none"
    >
      <!-- Loop through sublinks -->
      <template v-for="(sublink, index) in props.sublinks">
        <!-- Sublink without further sub-sublinks -->
        <q-item
          v-if="!hasSubDropdown(sublink)"
          :key="index"
          clickable
          tag="a"
          :to="sublink.link"
        >
          <q-item-section class="maintext">
            {{ getPrefixedTitle(sublink.title, props.depth + 1) }}
          </q-item-section>
        </q-item>

        <!-- Sublink with further sub-sublinks -->
        <q-expansion-item
          v-if="hasSubDropdown(sublink)"
          :key="'dropdown-' + index"
          :label="t(getPrefixedTitle(sublink.title, props.depth + 1))"
          expand-separator
          header-class="maintext"
          expand-icon-class="maintext"
        >
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
import { computed } from "vue";
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
  sublinks: {
    type: Array,
    default: () => [],
  },
  depth: {
    type: Number,
    default: 0,
  },
});

const hasDropdown = computed(() => props.sublinks && props.sublinks.length > 0);
const hasSubDropdown = (sublink) =>
  sublink.sublinks && sublink.sublinks.length > 0;

// Computed property for the display title
const displayTitle = computed(() => "─ ".repeat(props.depth) + props.title);

// Helper function to prefix titles
function getPrefixedTitle(title, depth) {
  return "─ ".repeat(depth) + title;
}
</script>
