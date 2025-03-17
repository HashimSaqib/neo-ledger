<template>
  <q-page class="lightbg q-pa-sm">
    <q-table
      :rows="roles"
      :columns="columns"
      row-key="id"
      flat
      bordered
      separator="horizontal"
      hide-bottom
    >
      <!-- Custom cell for Access Controls -->
      <template v-slot:body-cell-acs="props">
        <q-td :props="props">
          <div class="row items-center no-wrap">
            <div
              v-for="group in groupRowAcs(props.row.acs)"
              :key="group.group"
              class="q-mr-sm"
            >
              <q-chip dense flat>
                <!-- Display raw permission group (or you may enhance this lookup if needed) -->
                {{ t(group.group) }}
                <q-tooltip v-if="group.subs.length">
                  <div v-for="sub in group.subs" :key="sub" class="q-pa-xs">
                    {{ t(sub.split(".").slice(1).join(".")) }}
                  </div>
                </q-tooltip>
              </q-chip>
            </div>
          </div>
        </q-td>
      </template>

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
      :label="t('Add Role')"
      color="primary"
      @click="openAddPopup"
      size="sm"
      class="q-my-md"
    />

    <!-- Dialog for adding or editing role -->
    <q-dialog v-model="editDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">
            {{ t(isEditMode ? "Edit Role" : "Add Role") }}
          </div>
          <q-input
            v-model="selectedRole.description"
            :label="t('Description')"
            outlined
            dense
            class="q-my-md"
          />

          <div class="q-my-md">
            <div class="text-subtitle2">{{ t("Access Controls") }}</div>
            <!-- Hierarchical checkboxes for access controls -->
            <div
              v-for="group in groupedAcs"
              :key="group.group"
              class="q-ml-md q-mt-sm"
            >
              <q-checkbox
                :label="t(group.label)"
                :model-value="isGroupChecked(group)"
                @update:model-value="(val) => toggleGroup(group, val)"
              />
              <div class="q-ml-lg">
                <q-checkbox
                  v-for="subObj in group.subs"
                  :key="subObj.perm"
                  :label="t(subObj.label)"
                  :model-value="isChecked(subObj.perm)"
                  @update:model-value="
                    (val) => togglePermission(subObj.perm, val)
                  "
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-mt-none q-pt-none">
          <q-btn flat :label="t('Cancel')" color="negative" v-close-popup />
          <q-btn flat :label="t('Save')" color="positive" @click="saveRole" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, inject } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
// Import the menu links from menu.js
import { menuLinks } from "src/layouts/Menu.js";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// Set page title using injected updateTitle
const updateTitle = inject("updateTitle");
updateTitle("User Roles");

const roles = ref([]);
const editDialog = ref(false);
const isEditMode = ref(false);
const selectedRole = ref({ id: null, description: "", acs: [] });

// Build grouped access controls from menuLinks
const groupedAcs = computed(() => {
  // Helper function to recursively flatten sublinks
  const flattenSublinks = (links) => {
    return links.flatMap((link) => {
      let items = [];
      // Use either "perm" or fallback to "perl" (if present)
      if (link.perm || link.perl) {
        items.push({ perm: link.perm || link.perl, label: link.title });
      }
      if (link.sublinks) {
        items = items.concat(flattenSublinks(link.sublinks));
      }
      return items;
    });
  };

  return menuLinks.map((link) => {
    // Top-level permission (handle possible key typo: perm vs. perl)
    const groupPerm = link.perm || link.perl;
    const groupLabel = link.title;
    const subs = link.sublinks ? flattenSublinks(link.sublinks) : [];
    return {
      group: groupPerm,
      label: groupLabel,
      top: !!groupPerm,
      subs: subs,
    };
  });
});

// Define table columns (the acs column now uses a custom slot)
const columns = [
  { name: "id", label: t("ID"), field: "id", align: "left" },
  {
    name: "description",
    label: t("Description"),
    field: "description",
    align: "left",
  },
  { name: "acs", label: t("Access Controls"), field: "acs", align: "left" },
  { name: "actions", label: t("Actions"), align: "right" },
];

// Helper function to group a role's acs for table display (unchanged)
const groupRowAcs = (acsArray) => {
  const groups = {};
  acsArray.forEach((perm) => {
    const parts = perm.split(".");
    const group = parts[0];
    if (!groups[group]) {
      groups[group] = { group: group, subs: [] };
    }
    if (parts.length > 1) {
      groups[group].subs.push(perm);
    }
  });
  return Object.values(groups);
};

// Fetch roles from API and parse the acs field into an array
const getRoles = async () => {
  try {
    const response = await api.get("/system/roles");
    roles.value = response.data.map((role) => {
      return {
        ...role,
        acs: typeof role.acs === "string" ? JSON.parse(role.acs) : role.acs,
      };
    });
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("Can't fetch roles"),
      type: "negative",
      position: "center",
    });
  }
};

const openAddPopup = () => {
  selectedRole.value = { id: null, description: "", acs: [] };
  isEditMode.value = false;
  editDialog.value = true;
};

const openEditPopup = (role) => {
  // Clone the role to avoid modifying the table data directly
  selectedRole.value = { ...role };
  // Ensure acs is an array (it should already be if parsed)
  if (typeof selectedRole.value.acs === "string") {
    selectedRole.value.acs = JSON.parse(selectedRole.value.acs);
  }
  isEditMode.value = true;
  editDialog.value = true;
};

const saveRole = async () => {
  try {
    // Convert the selected acs array back to a JSON string for the API
    const payload = {
      description: selectedRole.value.description,
      acs: JSON.stringify(selectedRole.value.acs),
    };
    if (isEditMode.value) {
      await api.post(`/system/roles/${selectedRole.value.id}`, payload);
      Notify.create({
        message:
          t("Role") +
          " " +
          selectedRole.value.id +
          " " +
          t("updated successfully!"),
        type: "positive",
        position: "center",
      });
    } else {
      await api.post("/system/roles", payload);
      Notify.create({
        message: t("Role added successfully!"),
        type: "positive",
        position: "center",
      });
    }
    editDialog.value = false;
    getRoles(); // Refresh the table data after saving
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("An error occurred"),
      type: "negative",
      position: "center",
    });
  }
};

onMounted(() => {
  getRoles();
});

// Utility functions for permission toggling

// Checks if a single permission is selected
const isChecked = (permission) => {
  return selectedRole.value.acs.includes(permission);
};

// Toggle a sub permission; if checked, ensure the parent is also checked.
// If unchecked and no other sub is selected, the parent is unchecked.
const togglePermission = (permission, value) => {
  if (value) {
    if (!selectedRole.value.acs.includes(permission)) {
      selectedRole.value.acs.push(permission);
    }
    // Ensure parent is checked if available
    const parent = permission.split(".")[0];
    if (!selectedRole.value.acs.includes(parent)) {
      selectedRole.value.acs.push(parent);
    }
  } else {
    selectedRole.value.acs = selectedRole.value.acs.filter(
      (p) => p !== permission
    );
    // If a sub permission is unchecked and no others remain, uncheck parent
    const parent = permission.split(".")[0];
    // Find related group by parent and check if any sub permissions remain checked
    const group = groupedAcs.value.find((g) => g.group === parent);
    if (
      group &&
      group.subs.every(
        (permObj) => !selectedRole.value.acs.includes(permObj.perm)
      )
    ) {
      selectedRole.value.acs = selectedRole.value.acs.filter(
        (p) => p !== parent
      );
    }
  }
};

// For a given group, return true if its top permission (if available) or any sub permission is selected
const isGroupChecked = (group) => {
  const acs = selectedRole.value.acs;
  const hasTop = group.top ? acs.includes(group.group) : false;
  const hasSub = group.subs.some((permObj) => acs.includes(permObj.perm));
  return hasTop || hasSub;
};

// Toggle an entire group of permissions (both parent and sub items)
const toggleGroup = (group, value) => {
  if (value) {
    if (group.top && !selectedRole.value.acs.includes(group.group)) {
      selectedRole.value.acs.push(group.group);
    }
    group.subs.forEach((permObj) => {
      if (!selectedRole.value.acs.includes(permObj.perm)) {
        selectedRole.value.acs.push(permObj.perm);
      }
    });
  } else {
    selectedRole.value.acs = selectedRole.value.acs.filter(
      (p) => p !== group.group
    );
    group.subs.forEach((permObj) => {
      selectedRole.value.acs = selectedRole.value.acs.filter(
        (p) => p !== permObj.perm
      );
    });
  }
};
</script>
