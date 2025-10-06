<template>
  <q-btn
    v-bind="$attrs"
    :class="buttonClasses"
    :outline="isOutline"
    v-on="$listeners"
    class="button"
    size="11px"
    flat
  >
    <q-icon v-if="buttonIcon" :name="buttonIcon" class="icon-color" />
    <div class="text-color" style="margin-left: 0.5rem; margin-top: 0.1rem">
      {{ displayLabel }}
    </div>
  </q-btn>
</template>

<script>
export default {
  name: "Button",
  props: {
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
      default: "md",
    },
  },
  computed: {
    buttonClasses() {
      const styleMap = {
        "add-line": "outlined",
        post: "primary",
        "post-as-new": "primary",
        "new-number": "secondary",
        "add-part": "secondary",
        "add-service": "secondary",
        email: "secondary",
        print: "secondary",
        "export-xl": "secondary",
        "export-pdf": "secondary",
        delete: "destructive",
        save: "primary",
        search: "primary",
        clear: "secondary",
        default: "primary",
      };

      return {
        [`button--${styleMap[this.type] || "primary"}`]: true,
      };
    },
    buttonIcon() {
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
        default: null,
      };
      return iconMap[this.type] || null;
    },
    displayLabel() {
      if (this.label) {
        return this.label;
      }

      const labelMap = {
        "add-line": "Add Line",
        post: "Post",
        "post-as-new": "Post as New",
        "new-number": "New Number",
        "add-part": "Add Part",
        "add-service": "Add Service",
        email: "Email",
        print: "Print",
        "export-xl": "Export XL",
        "export-pdf": "Export PDF",
        delete: "Delete",
        save: "Save",
        search: "Search",
        clear: "Clear",
        default: "",
      };
      return labelMap[this.type] || "";
    },
    isOutline() {
      return this.type === "add-line";
    },
    isFlat() {
      return false;
    },
    isRound() {
      return this.type === "add-line";
    },
  },
};
</script>

<style lang="scss" scoped>
.button {
  font-weight: 700;
  border-radius: 10px;
  padding: 0.5rem 1rem;

  // Primary button styles (for post and post-as-new)
  &--primary {
    background-color: #3c83f6;
    border: 1px solid #3c83f6;
    color: white;

    &:hover {
      background-color: color-mix(in srgb, #3c83f6 80%, black 5%);
      border-color: color-mix(in srgb, #3c83f6 80%, black 5%);
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

  // Outlined button styles (for add-line)
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

    // Style the icon with the same color as text
    .icon-color {
      color: var(--q-maintext);
    }

    &:hover .icon-color {
      color: var(--q-maintext);
    }
  }

  // Secondary button styles (for new-number)
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

  // Destructive button styles (for delete)
  &--destructive {
    background-color: #ef4343;
    border: 1px solid #ef4343;
    color: white;

    &:hover {
      background-color: color-mix(in srgb, #ef4343 80%, black 5%);
      border-color: color-mix(in srgb, #ef4343 80%, black 5%);
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
}
</style>
