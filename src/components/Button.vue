<template>
  <q-btn
    v-bind="$attrs"
    :class="buttonClasses"
    :outline="isOutline"
    class="button"
    :size="size"
    flat
  >
    <q-icon v-if="buttonIcon" :name="buttonIcon" class="icon-color" />
    <div class="text-color" style="margin-left: 0.5rem; margin-top: 0.1rem">
      {{ displayLabel }}
    </div>
  </q-btn>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  type: {
    type: String,
    default: "default",
  },
  label: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "sm",
  },
  icon: {
    type: String,
    default: null,
  },
});

const buttonClasses = computed(() => {
  const directStyleTypes = ["primary", "secondary", "outlined", "destructive"];

  if (directStyleTypes.includes(props.type)) {
    return {
      [`button--${props.type}`]: true,
    };
  }

  const styleMap = {
    "add-line": "outlined",
    post: "primary",
    "post-as-new": "outlined",
    "new-number": "outlined",
    "add-part": "secondary",
    "add-service": "secondary",
    email: "outlined",
    print: "outlined",
    "export-xl": "secondary",
    "export-pdf": "secondary",
    delete: "destructive",
    save: "outlined",
    search: "primary",
    clear: "secondary",
    edit: "primary",
    add: "primary",
    download: "secondary",
    reversal: "outlined",
    default: "primary",
  };

  return {
    [`button--${styleMap[props.type] || "primary"}`]: true,
  };
});

const buttonIcon = computed(() => {
  if (props.icon) {
    return props.icon;
  }

  const directStyleTypes = ["primary", "secondary", "outlined", "destructive"];
  if (directStyleTypes.includes(props.type)) {
    return null;
  }

  const iconMap = {
    "add-line": "add",
    post: "send",
    "post-as-new": "content_copy",
    "new-number": "refresh",
    "add-part": "add",
    "add-service": "add",
    email: "email",
    print: "print",
    "export-xl": "table_chart",
    "export-pdf": "picture_as_pdf",
    delete: "delete_outline",
    save: "save",
    search: "search",
    clear: "clear",
    download: "download",
    edit: "edit",
    add: "add",
    reversal: "swap_horiz",
    "view-file": "picture_as_pdf",
    "more-actions": "more_vert",
    close: "close",
    default: null,
  };
  return iconMap[props.type] || null;
});

const displayLabel = computed(() => {
  if (props.label) {
    return props.label;
  }

  const directStyleTypes = ["primary", "secondary", "outlined", "destructive"];
  if (directStyleTypes.includes(props.type)) {
    return "";
  }

  const labelMap = {
    "add-line": t("Add Line"),
    post: t("Post"),
    "post-as-new": t("Post as New"),
    "new-number": t("New Number"),
    "add-part": t("Add Part"),
    "add-service": t("Add Service"),
    email: t("Email"),
    print: t("Print"),
    "export-xl": t("Export XL"),
    "export-pdf": t("Export PDF"),
    delete: t("Delete"),
    save: t("Save"),
    search: t("Search"),
    clear: t("Clear"),
    edit: t("Edit"),
    add: t("Add"),
    download: t("Download"),
    reversal: t("Reversal"),
    default: "",
  };
  return labelMap[props.type] || "";
});

const isOutline = computed(() => {
  const outlineTypes = [
    "add-line",
    "outlined",
    "save",
    "new-number",
    "print",
    "email",
    "reversal",
    "post-as-new",
    "delete",
  ];
  return outlineTypes.includes(props.type);
});
</script>

<style lang="scss" scoped>
.button {
  font-weight: 700;
  border-radius: 10px;
  padding: 0.5rem 1rem;

  &--primary {
    background-color: #06cee0;
    border: 1px solid #06cee0;
    color: white;

    &:hover {
      background-color: color-mix(in srgb, #06cee0 80%, black 5%);
      border-color: color-mix(in srgb, #06cee0 80%, black 5%);
    }

    .text-color {
      color: white;
    }

    &:hover .text-color {
      color: white;
    }

    .icon-color {
      color: white;
    }

    &:hover .icon-color {
      color: white;
    }
  }

  &--outlined {
    color: var(--q-border);
    border: 1px solid var(--q-border);

    &:hover {
      background-color: var(--q-highlight);
    }

    .text-color {
      color: var(--q-maintext);
    }

    &:hover .text-color {
      color: var(--q-maintext);
    }

    .icon-color {
      color: var(--q-maintext);
    }

    &:hover .icon-color {
      color: var(--q-maintext);
    }
  }

  &--secondary {
    background-color: var(--q-secondarybtn);
    border: 1px solid var(--q-secondarybtn);
    color: var(--q-maintext);

    &:hover {
      background-color: color-mix(in srgb, var(--q-secondarybtn) 80%, black 5%);
      border-color: color-mix(in srgb, var(--q-secondarybtn) 80%, black 5%);
    }

    .text-color {
      color: var(--q-maintext);
    }

    &:hover .text-color {
      color: var(--q-maintext);
    }

    .icon-color {
      color: var(--q-maintext);
    }

    &:hover .icon-color {
      color: var(--q-maintext);
    }
  }

  &--destructive {
    background-color: transparent;
    border: 2px solid #ef4343;
    color: #ef4343;

    &:hover {
      background-color: color-mix(in srgb, #ef4343 12%, transparent);
      border-color: #ef4343;
    }

    .text-color {
      color: #ef4343;
    }

    &:hover .text-color {
      color: #ef4343;
    }

    .icon-color {
      color: #ef4343;
    }

    &:hover .icon-color {
      color: #ef4343;
    }
  }
}
</style>
