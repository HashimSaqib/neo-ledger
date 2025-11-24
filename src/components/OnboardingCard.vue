<template>
  <q-card
    class="onboarding-card"
    :class="{ completed: item.completed }"
    flat
    bordered
  >
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="col">
          <div class="card-title" :class="{ strikethrough: item.completed }">
            {{ item.title }}
          </div>
          <div
            class="card-description"
            :class="{ strikethrough: item.completed }"
          >
            {{ item.description }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="item.completed"
            flat
            dense
            round
            icon="check_circle"
            color="positive"
            size="md"
          >
            <q-tooltip>{{ t("Completed") }}</q-tooltip>
          </q-btn>
          <div v-else class="button-group">
            <q-btn
              flat
              dense
              class="action-btn action-btn--outlined"
              :label="t('Mark as Done')"
              icon="check"
              size="sm"
              @click="handleMarkAsDone"
            />
            <q-btn
              v-if="item.link"
              flat
              dense
              class="action-btn action-btn--primary"
              :label="t('Open')"
              icon="arrow_forward"
              size="sm"
              @click="handleOpen"
            />
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["markAsDone"]);

const handleMarkAsDone = () => {
  emit("markAsDone", props.item);
};

const handleOpen = () => {
  if (props.item.link) {
    window.open(props.item.link, "_blank");
  }
};
</script>

<style lang="scss" scoped>
.onboarding-card {
  background-color: var(--q-mainbg);
  border: 1px solid var(--q-border);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--q-border) 70%, var(--q-primary) 30%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  &.completed {
    opacity: 0.6;
    background-color: var(--q-lightbg);
  }
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--q-maintext);
  margin-bottom: 0.25rem;
  transition: all 0.3s ease;

  &.strikethrough {
    text-decoration: line-through;
    color: var(--q-lighttext);
  }
}

.card-description {
  font-size: 0.875rem;
  color: var(--q-lighttext);
  transition: all 0.3s ease;

  &.strikethrough {
    text-decoration: line-through;
    opacity: 0.7;
  }
}

.button-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-btn {
  font-weight: 600;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;

  &--primary {
    background-color: #3c83f6;
    border: 1px solid #3c83f6;
    color: white;

    &:hover {
      background-color: color-mix(in srgb, #3c83f6 80%, black 5%);
    }
  }

  &--outlined {
    color: var(--q-maintext);
    border: 1px solid var(--q-border);

    &:hover {
      background-color: var(--q-highlight);
    }
  }
}
</style>
