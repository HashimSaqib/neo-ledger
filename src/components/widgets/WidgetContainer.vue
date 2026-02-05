<template>
  <div class="widget-container">
    <!-- Widget Settings Panel -->
    <div class="widget-settings-bar">
      <div class="settings-left">
        <q-btn-dropdown
          flat
          dense
          no-caps
          :label="currentPeriodLabel"
          icon="calendar_today"
          class="period-dropdown"
        >
          <q-list>
            <q-item-label header>{{ t("Period Type") }}</q-item-label>
            <q-item
              v-for="option in periodTypeOptions"
              :key="option.value"
              clickable
              v-close-popup
              @click="setPeriodType(option.value)"
              :active="config.period_type === option.value"
            >
              <q-item-section>{{ option.label }}</q-item-section>
              <q-item-section side v-if="config.period_type === option.value">
                <q-icon name="check" color="primary" />
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item-label header>{{ t("Date Range") }}</q-item-label>
            <q-item>
              <q-item-section>
                <div class="date-range-inputs">
                  <q-input
                    v-model="config.period.start"
                    type="date"
                    :label="t('From')"
                    dense
                    outlined
                    class="date-input"
                  />
                  <q-input
                    v-model="config.period.end"
                    type="date"
                    :label="t('To')"
                    dense
                    outlined
                    class="date-input"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>

      <div class="settings-right">
        <q-btn
          flat
          dense
          icon="refresh"
          :loading="refreshing"
          @click="refreshAllWidgets"
        >
          <q-tooltip>{{ t("Refresh All") }}</q-tooltip>
        </q-btn>
        <q-btn flat dense icon="settings" @click="showSettingsDialog = true">
          <q-tooltip>{{ t("Widget Settings") }}</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Widgets Grid -->
    <div class="widgets-grid" ref="gridRef">
      <div
        v-for="(widget, index) in visibleWidgets"
        :key="widget.id"
        class="widget-wrapper"
        :class="[
          `widget-wrapper--${getWidgetWidth(widget.id)}`,
          { 'widget-wrapper--dragging': draggingWidget === widget.id },
          { 'widget-wrapper--drag-over': dragOverWidget === widget.id },
        ]"
        :data-widget-id="widget.id"
        :data-index="index"
        draggable="true"
        @dragstart="onDragStart($event, widget, index)"
        @dragenter="onDragEnter($event, widget, index)"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop($event, widget, index)"
        @dragend="onDragEnd"
      >
        <overview-widget
          v-if="widget.type === 'ar_overview' || widget.type === 'ap_overview'"
          :type="widget.type === 'ar_overview' ? 'customer' : 'vendor'"
          :data="widgetData[widget.type]"
          :loading="widgetLoading[widget.type]"
          :is-dragging="draggingWidget === widget.id"
          :period-type="config.period_type"
          @refresh="refreshWidget(widget.type)"
          @toggle-visibility="toggleWidgetVisibility(widget.id)"
        />
        <bank-activity-widget
          v-else-if="widget.type === 'bank_activity'"
          :data="widgetData[widget.type]"
          :loading="widgetLoading[widget.type]"
          :is-dragging="draggingWidget === widget.id"
          :period-type="config.period_type"
          :selected-account-ids="getBankActivitySelectedIds()"
          @refresh="refreshWidget(widget.type)"
          @toggle-visibility="toggleWidgetVisibility(widget.id)"
          @update:selected-account-ids="setBankActivitySelectedIds($event)"
        />
      </div>

      <!-- Empty State -->
      <div v-if="visibleWidgets.length === 0" class="widgets-empty">
        <q-icon name="widgets" size="64px" class="empty-icon" />
        <h3>{{ t("No Widgets Available") }}</h3>
        <p>{{ t("Enable widgets from the settings panel") }}</p>
        <q-btn
          color="primary"
          :label="t('Open Settings')"
          icon="settings"
          @click="showSettingsDialog = true"
        />
      </div>
    </div>

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettingsDialog">
      <q-card class="settings-dialog">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ t("Widget Settings") }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md">
          <div class="settings-section">
            <h4>{{ t("Available Widgets") }}</h4>
            <p class="section-description">
              {{ t("Enable or disable widgets, adjust order and width") }}
            </p>

            <q-list bordered separator class="widget-list">
              <q-item
                v-for="widget in allWidgets"
                :key="widget.id"
                :class="{ 'widget-disabled': !widget.enabled }"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="widget.icon"
                    :color="widget.enabled ? 'primary' : 'grey'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ widget.label }}</q-item-label>
                  <q-item-label caption>{{ widget.description }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <!-- Width Toggle -->
                    <q-btn-toggle
                      v-model="widgetWidths[widget.id]"
                      :options="widthOptions"
                      size="sm"
                      dense
                      no-caps
                      toggle-color="primary"
                      :disable="!widget.enabled"
                      @update:model-value="updateWidgetWidth(widget.id, $event)"
                    />
                    <!-- Order Buttons -->
                    <q-btn
                      flat
                      round
                      dense
                      icon="arrow_upward"
                      size="sm"
                      :disable="widget.order <= 1 || !widget.enabled"
                      @click="moveWidget(widget.id, -1)"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      icon="arrow_downward"
                      size="sm"
                      :disable="
                        widget.order >= enabledWidgetsCount || !widget.enabled
                      "
                      @click="moveWidget(widget.id, 1)"
                    />
                    <!-- Enable Toggle -->
                    <q-toggle
                      v-model="widget.enabled"
                      :disable="!widget.hasPermission"
                      @update:model-value="
                        updateWidgetEnabled(widget.id, $event)
                      "
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-if="hasNoPermissions" class="permissions-warning q-mt-md">
              <q-icon name="info" color="warning" />
              <span>{{
                t("Some widgets are unavailable due to permission restrictions")
              }}</span>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat :label="t('Reset to Default')" @click="resetToDefaults" />
          <q-btn
            color="primary"
            :label="t('Save')"
            :loading="saving"
            @click="saveConfigManual"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { Notify, LocalStorage } from "quasar";
import { useRoute } from "vue-router";
import { api } from "src/boot/axios";
import OverviewWidget from "./OverviewWidget.vue";
import BankActivityWidget from "./BankActivityWidget.vue";

const { t } = useI18n();
const route = useRoute();
const client = route.params.client;

// Props & Emits
const props = defineProps({
  permissions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["config-loaded", "config-saved"]);

// State
const showSettingsDialog = ref(false);
const saving = ref(false);
const refreshing = ref(false);
const gridRef = ref(null);
const draggingWidget = ref(null);
const dragOverWidget = ref(null);
const draggedIndex = ref(null);

// Widget widths - reactive object to track width per widget (default is half/50%)
const widgetWidths = reactive({
  ar_overview: "half",
  ap_overview: "half",
  bank_activity: "half",
});

const widthOptions = [
  { label: "50%", value: "half" },
  { label: "100%", value: "full" },
];

// Widget Configuration
const config = ref({
  period_type: "monthly",
  period: {
    start: "",
    end: "",
  },
  widgets: {},
});

// Widget Data
const widgetData = ref({
  ar_overview: null,
  ap_overview: null,
  bank_activity: null,
});

const widgetLoading = ref({
  ar_overview: false,
  ap_overview: false,
  bank_activity: false,
});

// Period type options
const periodTypeOptions = [
  { label: t("Daily"), value: "daily" },
  { label: t("Monthly"), value: "monthly" },
  { label: t("Quarterly"), value: "quarterly" },
  { label: t("Yearly"), value: "yearly" },
];

const currentPeriodLabel = computed(() => {
  const typeLabel =
    periodTypeOptions.find((o) => o.value === config.value.period_type)
      ?.label || t("Monthly");

  if (config.value.period.start && config.value.period.end) {
    return `${typeLabel} (${config.value.period.start} - ${config.value.period.end})`;
  } else if (config.value.period.start) {
    return `${typeLabel} (${t("From")} ${config.value.period.start})`;
  } else if (config.value.period.end) {
    return `${typeLabel} (${t("To")} ${config.value.period.end})`;
  }
  return `${typeLabel} (${t("All Time")})`;
});

// Check permissions - use the props.permissions which is reactive
const hasPermission = (perm) => {
  // Use props.permissions first, fall back to localStorage
  const acs = props.permissions?.length
    ? props.permissions
    : LocalStorage.getItem(`${client}_acs`) || [];
  return acs.includes(perm);
};

// Check if permissions have been loaded
const permissionsLoaded = computed(() => {
  const acs = props.permissions?.length
    ? props.permissions
    : LocalStorage.getItem(`${client}_acs`) || [];
  return acs.length > 0;
});

// Widget definitions
const widgetDefinitions = [
  {
    id: "ar_overview",
    type: "ar_overview",
    label: t("Accounts Receivable Overview"),
    description: t("View customer invoice status and trends"),
    icon: "trending_up",
    permission: "customer.overview",
  },
  {
    id: "ap_overview",
    type: "ap_overview",
    label: t("Accounts Payable Overview"),
    description: t("View vendor invoice status and trends"),
    icon: "trending_down",
    permission: "vendor.overview",
  },
  {
    id: "bank_activity",
    type: "bank_activity",
    label: t("Bank Account Activity"),
    description: t("View bank account balance trends over time"),
    icon: "account_balance",
    permission: "gl.transactions",
  },
];

// Get widget width
const getWidgetWidth = (widgetId) => {
  return (
    config.value.widgets[widgetId]?.width || widgetWidths[widgetId] || "half"
  );
};

// Get default order for a widget based on its position in definitions
const getDefaultOrder = (widgetId) => {
  const index = widgetDefinitions.findIndex((def) => def.id === widgetId);
  return index >= 0 ? index + 1 : 999;
};

// Ensure a widget has a config entry with proper defaults
const ensureWidgetConfig = (widgetId) => {
  if (!config.value.widgets[widgetId]) {
    const defaultOrder = getDefaultOrder(widgetId);
    const base = {
      enabled: true,
      order: defaultOrder,
      width: widgetWidths[widgetId] || "half",
    };
    if (widgetId === "bank_activity") {
      base.selected_account_ids = [];
    }
    config.value.widgets[widgetId] = base;
  }
  return config.value.widgets[widgetId];
};

// Update widget width
const updateWidgetWidth = (widgetId, width) => {
  ensureWidgetConfig(widgetId);
  config.value.widgets[widgetId].width = width;
  widgetWidths[widgetId] = width;
};

// Bank activity widget: selected account ids (empty = show all)
const getBankActivitySelectedIds = () => {
  const ids = config.value.widgets.bank_activity?.selected_account_ids;
  return Array.isArray(ids) ? ids : [];
};

const setBankActivitySelectedIds = (ids) => {
  ensureWidgetConfig("bank_activity");
  config.value.widgets.bank_activity.selected_account_ids = Array.isArray(ids)
    ? ids
    : [];
  saveConfig();
};

// All widgets with current config state
const allWidgets = computed(() => {
  return widgetDefinitions.map((def, index) => {
    const widgetConfig = config.value.widgets[def.id] || {
      enabled: true,
      order: index + 1,
      width: "half",
    };
    return {
      ...def,
      enabled: widgetConfig.enabled !== false && hasPermission(def.permission),
      order: widgetConfig.order || index + 1,
      width: widgetConfig.width || "half",
      hasPermission: hasPermission(def.permission),
    };
  });
});

// Visible widgets (enabled and has permission)
const visibleWidgets = computed(() => {
  return allWidgets.value
    .filter((w) => w.enabled && w.hasPermission)
    .sort((a, b) => a.order - b.order);
});

const enabledWidgetsCount = computed(() => {
  return allWidgets.value.filter((w) => w.enabled).length;
});

const hasNoPermissions = computed(() => {
  // Only show warning if permissions have been loaded and some widgets lack permission
  if (!permissionsLoaded.value) return false;
  return allWidgets.value.some((w) => !w.hasPermission);
});

// Period functions
const setPeriodType = (value) => {
  config.value.period_type = value;
  // Don't refresh data - period type only affects how we group existing data
  // The chart will re-render automatically via the prop change
};

// Widget management
const updateWidgetEnabled = (widgetId, enabled) => {
  ensureWidgetConfig(widgetId);
  config.value.widgets[widgetId].enabled = enabled;
};

const moveWidget = (widgetId, direction) => {
  const widgets = [...visibleWidgets.value];
  const currentIndex = widgets.findIndex((w) => w.id === widgetId);
  const newIndex = currentIndex + direction;

  if (newIndex < 0 || newIndex >= widgets.length) return;

  // Get the widgets to swap
  const currentWidget = widgets[currentIndex];
  const targetWidget = widgets[newIndex];

  // Get the actual order values
  const currentOrder = currentWidget.order;
  const targetOrder = targetWidget.order;

  // Create new config object to ensure reactivity
  const newWidgets = { ...config.value.widgets };

  // Ensure config entries exist
  if (!newWidgets[currentWidget.id]) {
    newWidgets[currentWidget.id] = {
      enabled: true,
      order: currentOrder,
      width: currentWidget.width || "half",
    };
  }
  if (!newWidgets[targetWidget.id]) {
    newWidgets[targetWidget.id] = {
      enabled: true,
      order: targetOrder,
      width: targetWidget.width || "half",
    };
  }

  // Swap orders
  newWidgets[currentWidget.id] = {
    ...newWidgets[currentWidget.id],
    order: targetOrder,
  };
  newWidgets[targetWidget.id] = {
    ...newWidgets[targetWidget.id],
    order: currentOrder,
  };

  // Update config with new widgets object (triggers reactivity)
  config.value.widgets = newWidgets;
};

const toggleWidgetVisibility = (widgetId) => {
  ensureWidgetConfig(widgetId);
  config.value.widgets[widgetId].enabled = false;
  saveConfig();
};

// Drag and Drop - Fixed Implementation
const onDragStart = (event, widget, index) => {
  draggingWidget.value = widget.id;
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", widget.id);

  // Add a slight delay to apply dragging styles
  setTimeout(() => {
    event.target.classList.add("widget-wrapper--dragging");
  }, 0);
};

const onDragEnter = (event, widget, index) => {
  event.preventDefault();
  if (widget.id !== draggingWidget.value) {
    dragOverWidget.value = widget.id;
  }
};

const onDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
};

const onDragLeave = (event) => {
  // Only clear if we're actually leaving the widget wrapper
  const relatedTarget = event.relatedTarget;
  if (!event.currentTarget.contains(relatedTarget)) {
    dragOverWidget.value = null;
  }
};

const onDrop = (event, targetWidget, targetIndex) => {
  event.preventDefault();

  const draggedId = draggingWidget.value;
  const targetId = targetWidget.id;

  if (!draggedId || draggedId === targetId) {
    onDragEnd();
    return;
  }

  // Get the widgets from the computed list (which has proper order values)
  const widgets = [...visibleWidgets.value];
  const draggedWidgetData = widgets.find((w) => w.id === draggedId);
  const targetWidgetData = widgets.find((w) => w.id === targetId);

  if (!draggedWidgetData || !targetWidgetData) {
    onDragEnd();
    return;
  }

  // Get the actual order values from the computed widgets (these have fallback logic)
  const draggedOrder = draggedWidgetData.order;
  const targetOrder = targetWidgetData.order;

  // Create new config object to ensure reactivity
  const newWidgets = { ...config.value.widgets };

  // Ensure config entries exist with all properties
  if (!newWidgets[draggedId]) {
    newWidgets[draggedId] = {
      enabled: true,
      order: draggedOrder,
      width: draggedWidgetData.width || "half",
    };
  }
  if (!newWidgets[targetId]) {
    newWidgets[targetId] = {
      enabled: true,
      order: targetOrder,
      width: targetWidgetData.width || "half",
    };
  }

  // Swap the orders
  newWidgets[draggedId] = { ...newWidgets[draggedId], order: targetOrder };
  newWidgets[targetId] = { ...newWidgets[targetId], order: draggedOrder };

  // Update config with new widgets object (triggers reactivity)
  config.value.widgets = newWidgets;

  // Auto-save after reorder
  saveConfig();

  onDragEnd();
};

const onDragEnd = () => {
  draggingWidget.value = null;
  dragOverWidget.value = null;
  draggedIndex.value = null;
};

// Initialize all widget configs with proper unique orders
const initializeWidgetConfigs = () => {
  console.log(
    "initializeWidgetConfigs called, current config.value.widgets:",
    JSON.stringify(config.value.widgets, null, 2)
  );

  const newWidgets = { ...config.value.widgets };
  let needsSave = false;

  // First, ensure all widgets have config entries
  widgetDefinitions.forEach((def, index) => {
    if (!newWidgets[def.id]) {
      console.log(`Widget ${def.id} not found, creating with defaults`);
      const base = { enabled: true, order: index + 1, width: "half" };
      if (def.id === "bank_activity") base.selected_account_ids = [];
      newWidgets[def.id] = base;
      needsSave = true;
    } else {
      console.log(`Widget ${def.id} found:`, newWidgets[def.id]);
      // Ensure all properties exist
      if (newWidgets[def.id].order === undefined) {
        console.log(`Widget ${def.id} missing order, setting to ${index + 1}`);
        newWidgets[def.id].order = index + 1;
        needsSave = true;
      }
      if (newWidgets[def.id].width === undefined) {
        console.log(`Widget ${def.id} missing width, setting to half`);
        newWidgets[def.id].width = "half";
        needsSave = true;
      }
      if (newWidgets[def.id].enabled === undefined) {
        console.log(`Widget ${def.id} missing enabled, setting to true`);
        newWidgets[def.id].enabled = true;
        needsSave = true;
      }
    }
  });

  // Check for duplicate orders and fix them
  const orders = new Map();
  const widgetsToFix = [];

  widgetDefinitions.forEach((def) => {
    const widgetConfig = newWidgets[def.id];
    if (widgetConfig && widgetConfig.order !== undefined) {
      if (orders.has(widgetConfig.order)) {
        // Duplicate order found
        widgetsToFix.push(def.id);
      } else {
        orders.set(widgetConfig.order, def.id);
      }
    }
  });

  // Fix duplicate orders by assigning new unique orders
  if (widgetsToFix.length > 0) {
    let nextOrder = Math.max(...Array.from(orders.keys()), 0) + 1;
    widgetsToFix.forEach((widgetId) => {
      newWidgets[widgetId] = { ...newWidgets[widgetId], order: nextOrder };
      nextOrder++;
    });
    needsSave = true;
  }

  // Sync widget widths to reactive object
  Object.keys(newWidgets).forEach((id) => {
    if (newWidgets[id] && newWidgets[id].width) {
      widgetWidths[id] = newWidgets[id].width;
    }
  });

  config.value.widgets = newWidgets;

  console.log(
    "Initialized widget configs:",
    JSON.stringify(newWidgets, null, 2)
  );

  return needsSave;
};

// Data fetching
const fetchWidgetData = async (loadConfigFirst = false) => {
  try {
    // First, fetch to get the saved config (without date params)
    if (loadConfigFirst) {
      const configResponse = await api.get("/dashboard/widgets");

      console.log("Server response:", configResponse.data);

      // Parse config - might be a JSON string or object
      let serverConfig = configResponse.data.config;

      // If config is a string, parse it
      if (typeof serverConfig === "string" && serverConfig.length > 0) {
        try {
          serverConfig = JSON.parse(serverConfig);
          console.log("Parsed config from string:", serverConfig);
        } catch (e) {
          console.error("Failed to parse config string:", e);
          serverConfig = null;
        }
      }

      console.log("Server config:", serverConfig);

      // Update config from server
      if (
        serverConfig &&
        typeof serverConfig === "object" &&
        Object.keys(serverConfig).length > 0
      ) {
        console.log("Loading server config...");

        // Load period type
        if (serverConfig.period_type) {
          config.value.period_type = serverConfig.period_type;
          console.log("Loaded period_type:", serverConfig.period_type);
        }

        // Load period dates
        if (serverConfig.period && typeof serverConfig.period === "object") {
          config.value.period.start = serverConfig.period.start || "";
          config.value.period.end = serverConfig.period.end || "";
          console.log("Loaded period:", config.value.period);
        }

        // Load widget configs
        if (serverConfig.widgets && typeof serverConfig.widgets === "object") {
          console.log("Loading widget configs:", serverConfig.widgets);

          // Set the entire widgets object from server
          Object.keys(serverConfig.widgets).forEach((widgetId) => {
            const serverWidgetConfig = serverConfig.widgets[widgetId];
            if (serverWidgetConfig && typeof serverWidgetConfig === "object") {
              config.value.widgets[widgetId] = {
                ...serverWidgetConfig,
                enabled: serverWidgetConfig.enabled !== false,
                order:
                  typeof serverWidgetConfig.order === "number"
                    ? serverWidgetConfig.order
                    : getDefaultOrder(widgetId),
                width: serverWidgetConfig.width || "half",
              };
              // Sync width to reactive object
              widgetWidths[widgetId] = config.value.widgets[widgetId].width;
              console.log(
                `Loaded widget ${widgetId}:`,
                config.value.widgets[widgetId]
              );
            }
          });
        }

        console.log(
          "Config after loading:",
          JSON.stringify(config.value, null, 2)
        );
      } else {
        console.log("No server config found or empty config, using defaults");
      }

      // Initialize any missing widget configs (but don't overwrite loaded ones)
      const needsSave = initializeWidgetConfigs();
      if (needsSave) {
        console.log("Saving initialized config...");
        saveConfig();
      }

      // Update widget data from this response
      if (configResponse.data.customer_overview) {
        widgetData.value.ar_overview = configResponse.data.customer_overview;
      }
      if (configResponse.data.vendor_overview) {
        widgetData.value.ap_overview = configResponse.data.vendor_overview;
      }
      if (configResponse.data.bank_accounts) {
        widgetData.value.bank_activity = {
          bank_accounts: configResponse.data.bank_accounts,
        };
      }

      // If there are period dates, re-fetch with those dates
      if (config.value.period.start || config.value.period.end) {
        // Continue to fetch with date params below
      } else {
        emit("config-loaded", config.value);
        return;
      }
    }

    // Now fetch with the (possibly loaded) date params
    const params = {};
    if (config.value.period.start) {
      params.transdatefrom = config.value.period.start;
    }
    if (config.value.period.end) {
      params.transdateto = config.value.period.end;
    }

    const response = await api.get("/dashboard/widgets", { params });

    // Update widget data
    if (response.data.customer_overview) {
      widgetData.value.ar_overview = response.data.customer_overview;
    }
    if (response.data.vendor_overview) {
      widgetData.value.ap_overview = response.data.vendor_overview;
    }
    if (response.data.bank_accounts) {
      widgetData.value.bank_activity = {
        bank_accounts: response.data.bank_accounts,
      };
    }

    emit("config-loaded", config.value);
  } catch (error) {
    console.error("Error fetching widget data:", error);
    Notify.create({
      type: "negative",
      message: t("Failed to load widget data"),
      position: "top",
    });
  }
};

const refreshWidget = async (widgetType) => {
  widgetLoading.value[widgetType] = true;

  const params = {};
  if (config.value.period.start) {
    params.transdatefrom = config.value.period.start;
  }
  if (config.value.period.end) {
    params.transdateto = config.value.period.end;
  }

  try {
    const response = await api.get("/dashboard/widgets", { params });

    if (widgetType === "ar_overview" && response.data.customer_overview) {
      widgetData.value.ar_overview = response.data.customer_overview;
    }
    if (widgetType === "ap_overview" && response.data.vendor_overview) {
      widgetData.value.ap_overview = response.data.vendor_overview;
    }
    if (
      widgetType === "bank_activity" &&
      response.data.bank_accounts
    ) {
      widgetData.value.bank_activity = {
        bank_accounts: response.data.bank_accounts,
      };
    }
  } catch (error) {
    console.error("Error refreshing widget:", error);
    Notify.create({
      type: "negative",
      message: t("Failed to refresh widget"),
      position: "top",
    });
  } finally {
    widgetLoading.value[widgetType] = false;
  }
};

const refreshAllWidgets = async () => {
  refreshing.value = true;

  for (const widget of visibleWidgets.value) {
    widgetLoading.value[widget.type] = true;
  }

  // Don't reload config, just refresh data with current period
  await fetchWidgetData(false);

  for (const widget of visibleWidgets.value) {
    widgetLoading.value[widget.type] = false;
  }

  refreshing.value = false;
};

// Config management
const saveConfig = async (showNotification = false) => {
  saving.value = true;

  try {
    await api.post("/dashboard/widgets", {
      config: {
        period_type: config.value.period_type,
        period: config.value.period,
        widgets: config.value.widgets,
      },
    });

    if (showNotification) {
      Notify.create({
        type: "positive",
        message: t("Widget configuration saved"),
        position: "top",
      });
      showSettingsDialog.value = false;
    }

    emit("config-saved", config.value);
  } catch (error) {
    console.error("Error saving widget config:", error);
    if (showNotification) {
      Notify.create({
        type: "negative",
        message: t("Failed to save configuration"),
        position: "top",
      });
    }
  } finally {
    saving.value = false;
  }
};

// Manual save from settings dialog (shows notification)
const saveConfigManual = () => {
  saveConfig(true);
};

const resetToDefaults = () => {
  config.value = {
    period_type: "monthly",
    period: {
      start: "",
      end: "",
    },
    widgets: {},
  };

  // Reset widget orders and widths
  widgetDefinitions.forEach((def, index) => {
    const base = {
      enabled: hasPermission(def.permission),
      order: index + 1,
      width: "half",
    };
    if (def.id === "bank_activity") base.selected_account_ids = [];
    config.value.widgets[def.id] = base;
    widgetWidths[def.id] = "half";
  });
};

// Lifecycle
onMounted(() => {
  // Load config first, then fetch data with saved period dates
  fetchWidgetData(true);
});

// Watch for period changes (debounced refresh and auto-save)
watch(
  () => config.value.period,
  () => {
    // Debounce the refresh and save
    clearTimeout(window.periodChangeTimeout);
    window.periodChangeTimeout = setTimeout(() => {
      refreshAllWidgets();
      saveConfig();
    }, 500);
  },
  { deep: true }
);

// Watch for period type changes (auto-save)
watch(
  () => config.value.period_type,
  () => {
    // Debounce the save
    clearTimeout(window.periodTypeChangeTimeout);
    window.periodTypeChangeTimeout = setTimeout(() => {
      saveConfig();
    }, 500);
  }
);
</script>

<style lang="scss" scoped>
.widget-container {
  padding: 1rem;
}

.widget-settings-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--q-lightbg);
  border: 1px solid var(--q-border);
  border-radius: 10px;
  margin-bottom: 1rem;
}

.settings-left,
.settings-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.period-dropdown {
  font-weight: 500;
}

.date-range-inputs {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0;

  .date-input {
    width: 140px;
  }
}

.widgets-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  min-height: 300px;
}

.widget-wrapper {
  transition: all 0.3s ease;
  cursor: grab;

  &--full {
    width: 100%;
  }

  &--half {
    width: calc(50% - 0.5rem);
  }

  &--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  &--drag-over {
    transform: scale(1.02);
    box-shadow: 0 0 0 2px var(--q-primary);
    border-radius: 12px;
  }

  &:active {
    cursor: grabbing;
  }
}

@media (max-width: 1024px) {
  .widget-wrapper--half {
    width: 100%;
  }
}

.widgets-empty {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--q-mutedtext);

  .empty-icon {
    opacity: 0.5;
    margin-bottom: 1rem;
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--q-maintext);
  }

  p {
    margin: 0 0 1.5rem;
  }
}

.settings-dialog {
  min-width: 550px;
  max-width: 650px;
}

@media (max-width: 600px) {
  .settings-dialog {
    min-width: 100%;
  }
}

.settings-section {
  h4 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--q-maintext);
  }

  .section-description {
    margin: 0 0 1rem;
    font-size: 0.85rem;
    color: var(--q-mutedtext);
  }
}

.widget-list {
  border-radius: 8px;

  .widget-disabled {
    opacity: 0.6;
  }
}

.permissions-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--q-warning);
}
</style>
