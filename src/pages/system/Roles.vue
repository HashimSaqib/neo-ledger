<template>
  <div class="container">
    <h1>Datasets</h1>

    <!-- Loading Spinner -->
    <div v-if="loading" class="spinner">{{ t("Loading...") }}</div>

    <!-- Error Message -->
    <div v-if="error" class="error">
      {{ t("Error fetching datasets. Please try again later.") }}
    </div>

    <!-- Datasets Grid -->
    <div v-if="!loading && !error" class="datasets-grid">
      <div
        v-for="dataset in datasets"
        :key="dataset.db_name"
        class="dataset-card"
      >
        <div class="dataset-header">
          <!-- Logo Image -->
          <img
            v-if="dataset.logo"
            :src="'data:image/png;base64,' + dataset.logo"
            alt="Logo"
            class="dataset-logo"
          />
          <h2 class="dataset-title">{{ dataset.db_name }}</h2>
        </div>
        <p class="dataset-description">{{ dataset.description }}</p>
        <p class="dataset-access">
          <strong>{{ t("Access") }}:</strong>
          <em>{{ dataset.access_level }}</em>
        </p>

        <!-- Additional details for owner/admin -->
        <div
          v-if="
            dataset.access_level === 'owner' || dataset.access_level === 'admin'
          "
          class="admin-details"
        >
          <div class="users" v-if="dataset.users && dataset.users.length">
            <h3>{{ t("Users") }}</h3>
            <ul>
              <li v-for="user in dataset.users" :key="user.email">
                {{ user.email }} - {{ user.access_level }}
              </li>
            </ul>
          </div>
          <!-- Improved Roles Display -->
          <div class="roles" v-if="dataset.roles && dataset.roles.length">
            <h3>{{ t("Roles") }}</h3>
            <div class="roles-list">
              <div
                v-for="role in dataset.roles"
                :key="role.id"
                class="role-item"
              >
                <!-- Using q-chip to display role description and grouped permissions -->
                <q-chip dense flat class="q-mr-sm">
                  {{ role.description || role.name }}
                  <q-tooltip v-if="role.acs && role.acs.length">
                    <div
                      v-for="group in groupRowAcs(role.acs)"
                      :key="group.group"
                      class="q-pa-xs"
                    >
                      <strong>{{ t(group.group) }}</strong>
                      <span v-if="group.subs.length">
                        : {{ group.subs.map(formatSub).join(", ") }}
                      </span>
                    </div>
                  </q-tooltip>
                </q-chip>
                <!-- Edit button for each role -->
                <q-btn
                  :label="t('Edit')"
                  color="primary"
                  flat
                  size="sm"
                  @click="openEditRolePopup(dataset, role)"
                />
              </div>
            </div>
          </div>
          <!-- Button to add a new role -->
          <q-btn
            :label="t('Add Role')"
            color="primary"
            size="sm"
            @click="openAddRolePopup(dataset)"
          />
        </div>
      </div>
    </div>

    <!-- Global Dialog for Adding/Editing a Role -->
    <q-dialog v-model="roleDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">
            {{ t(isEditMode ? "Edit Role" : "Add Role") }}
          </div>
          <!-- Now using description (you can adjust field names as needed) -->
          <q-input
            v-model="selectedRole.description"
            :label="t('Description')"
            outlined
            dense
            class="q-my-md"
          />
          <div class="q-my-md">
            <div class="text-subtitle2">{{ t("Access Controls") }}</div>
            <!-- Render hierarchical checkboxes based on groupedAcs -->
            <div
              v-for="group in groupedAcs"
              :key="group.group"
              class="q-ml-md q-mt-sm"
            >
              <q-checkbox
                :label="t(group.label)"
                :model-value="isGroupChecked(group, selectedRole)"
                @update:model-value="
                  (val) => toggleGroup(group, val, selectedRole)
                "
              />
              <div class="q-ml-lg">
                <q-checkbox
                  v-for="subObj in group.subs"
                  :key="subObj.perm"
                  :label="t(subObj.label)"
                  :model-value="isChecked(subObj.perm, selectedRole)"
                  @update:model-value="
                    (val) => togglePermission(subObj.perm, val, selectedRole)
                  "
                />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-mt-none q-pt-none">
          <q-btn
            flat
            :label="t('Cancel')"
            color="negative"
            v-close-popup
            @click="cancelRole"
          />
          <q-btn flat :label="t('Save')" color="positive" @click="saveRole" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";
import { getMenuLinks } from "src/layouts/Menu.js";
const { t } = useI18n();

const datasets = ref([]);
const loading = ref(true);
const error = ref(false);

// Global state for role creation/editing
const roleDialog = ref(false);
const isEditMode = ref(false);
const selectedDataset = ref(null);
// Now using a description field instead of just a name
const selectedRole = ref({ id: null, description: "", acs: [] });

// Build grouped access controls from menuLinks (recursive flattening for sublinks)
const groupedAcs = ref([]);

const computeGroupedAcs = async () => {
  const menuLinks = await getMenuLinks();

  const flattenSublinks = (links) => {
    return links.flatMap((link) => {
      let items = [];
      if (link.perm || link.perl) {
        items.push({ perm: link.perm || link.perl, label: link.title });
      }
      if (link.sublinks) {
        items = items.concat(flattenSublinks(link.sublinks));
      }
      return items;
    });
  };

  groupedAcs.value = menuLinks.map((link) => {
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
};

// Group an array of access controls for display (chips with tooltips)
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

// Optional formatter for subpermissions (remove group prefix if desired)
const formatSub = (perm) => {
  const parts = perm.split(".");
  return parts.slice(1).join(".");
};

// Fetch datasets from the central API
const getDatasets = async () => {
  try {
    const response = await api.get("/central/db_list");
    datasets.value = response.data.map((ds) => ({
      ...ds,
      roles: ds.roles || [],
      users: ds.users || [],
    }));
  } catch (err) {
    console.error("Error fetching datasets:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  getDatasets();
  await computeGroupedAcs();
});

// Open the role creation dialog for a given dataset
const openAddRolePopup = (dataset) => {
  selectedDataset.value = dataset;
  selectedRole.value = { id: null, description: "", acs: [] };
  isEditMode.value = false;
  roleDialog.value = true;
};

// Open the role edit dialog for an existing role
const openEditRolePopup = (dataset, role) => {
  selectedDataset.value = dataset;
  // Clone the role to avoid directly modifying dataset data
  selectedRole.value = { ...role };
  if (typeof selectedRole.value.acs === "string") {
    selectedRole.value.acs = JSON.parse(selectedRole.value.acs);
  }
  isEditMode.value = true;
  roleDialog.value = true;
};

// Cancel role creation/editing
const cancelRole = () => {
  roleDialog.value = false;
  selectedRole.value = { id: null, description: "", acs: [] };
};

// Save the role via API call
const saveRole = async () => {
  try {
    const payload = {
      // Using "description" now; adjust if you need both name/description
      description: selectedRole.value.description,
      acs: JSON.stringify(selectedRole.value.acs),
    };
    if (isEditMode.value) {
      // For editing, use the role id endpoint
      await api.post(`/system/roles/${selectedRole.value.id}`, payload);
      Notify.create({
        message:
          t("Role") +
          " " +
          selectedRole.value.id +
          " " +
          t("updated successfully!"),
        type: "positive",
        position: "top-right",
      });
    } else {
      // For creation, send client info as before
      await api.post(
        `/system/roles?client=${selectedDataset.value.db_name}`,
        payload
      );
      Notify.create({
        message: t("Role added successfully!"),
        type: "positive",
        position: "top-right",
      });
    }
    roleDialog.value = false;
    // Refresh the datasets to update roles
    getDatasets();
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("An error occurred"),
      type: "negative",
      position: "center",
    });
  }
};

// Utility functions for toggling permissions in the role's acs array
const isChecked = (permission, role) => {
  return role.acs.includes(permission);
};

const togglePermission = (permission, value, role) => {
  if (value) {
    if (!role.acs.includes(permission)) {
      role.acs.push(permission);
    }
    // Ensure the parent permission is also added
    const parent = permission.split(".")[0];
    if (!role.acs.includes(parent)) {
      role.acs.push(parent);
    }
  } else {
    role.acs = role.acs.filter((p) => p !== permission);
    const parent = permission.split(".")[0];
    // If no subpermissions remain checked for the group, remove the parent
    const group = groupedAcs.value.find((g) => g.group === parent);
    if (
      group &&
      group.subs.every((permObj) => !role.acs.includes(permObj.perm))
    ) {
      role.acs = role.acs.filter((p) => p !== parent);
    }
  }
};

const isGroupChecked = (group, role) => {
  const acs = role.acs;
  const hasTop = group.top ? acs.includes(group.group) : false;
  const hasSub = group.subs.some((permObj) => acs.includes(permObj.perm));
  return hasTop || hasSub;
};

const toggleGroup = (group, value, role) => {
  if (value) {
    if (group.top && !role.acs.includes(group.group)) {
      role.acs.push(group.group);
    }
    group.subs.forEach((permObj) => {
      if (!role.acs.includes(permObj.perm)) {
        role.acs.push(permObj.perm);
      }
    });
  } else {
    role.acs = role.acs.filter((p) => p !== group.group);
    group.subs.forEach((permObj) => {
      role.acs = role.acs.filter((p) => p !== permObj.perm);
    });
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.spinner {
  text-align: center;
  font-size: 1.2em;
  color: #555;
}

.error {
  text-align: center;
  color: #b00020;
  background: #fddede;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.datasets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.dataset-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dataset-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dataset-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.dataset-logo {
  max-width: 50px;
  margin-right: 10px;
}

.dataset-title {
  margin: 0;
  font-size: 1.25em;
  color: #333;
}

.dataset-description {
  font-size: 1em;
  color: #666;
  margin-bottom: 10px;
}

.dataset-access {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 10px;
}

.admin-details {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.admin-details h3 {
  margin: 0 0 5px;
  font-size: 1em;
  color: #333;
}

.admin-details ul {
  list-style-type: none;
  padding: 0;
}

.admin-details li {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 3px;
}

/* Roles list styling */
.roles-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.role-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
</style>
