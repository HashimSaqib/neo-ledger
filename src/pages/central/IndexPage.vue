<template>
  <q-layout view="hHh lpR fFf">
    <!-- Fixed header with title, theme toggle, language selector and logout -->
    <q-header style="background-color: var(--q-menubg)">
      <q-toolbar class="q-px-lg">
        <q-toolbar-title>Neo-Ledger</q-toolbar-title>

        <q-space />
        <!-- Refresh Button -->
        <q-btn
          flat
          round
          icon="refresh"
          @click="getDatasets"
          aria-label="Refresh Datasets"
        >
          <q-tooltip>Refresh</q-tooltip>
        </q-btn>

        <!-- Logout Button -->
        <q-btn-dropdown flat dense icon="settings" auto-close>
          <q-list>
            <!-- Dark Mode Toggle -->
            <q-item>
              <q-item-section avatar>
                <q-icon :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'" />
              </q-item-section>
              <q-item-section>
                <q-toggle
                  v-model="$q.dark.isActive"
                  @update:model-value="setTheme"
                  :label="$t($q.dark.isActive ? 'Dark Mode' : 'Light Mode')"
                  dense
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="language" />
              </q-item-section>
              <q-item-section>
                <q-select
                  v-model="selectedLanguage"
                  :options="languages"
                  dense
                  options-dense
                  @update:model-value="switchLanguage"
                  outlined
                  :label="$t('Language')"
                  class="q-px-none"
                >
                  <template v-slot:option="{ itemProps, opt }">
                    <q-item
                      v-bind="itemProps"
                      clickable
                      @click="switchLanguage(opt)"
                    >
                      <q-item-section>{{ opt.label }}</q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </q-item-section>
            </q-item>

            <!-- Logout Button -->
            <q-separator spaced />
            <q-item
              clickable
              v-ripple
              @click="handleLogout"
              class="text-negative"
            >
              <q-item-section avatar>
                <q-icon name="logout" color="negative" />
              </q-item-section>
              <q-item-section>{{ $t("Logout") }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-md">
        <!-- Loading state -->
        <div v-if="loading" class="flex flex-center q-pa-lg">
          <q-spinner-dots size="50px" color="primary" />
        </div>

        <!-- Dismissible error banner -->
        <q-banner
          v-if="error"
          class="q-mb-md"
          color="negative"
          text-color="white"
          dismissible
          @dismiss="error = false"
        >
          Error fetching datasets. Please try again later.
        </q-banner>

        <!-- Search and Create Dataset Bar -->
        <div class="container q-mb-md">
          <div
            v-if="!loading && !error"
            class="row q-mb-none items-center q-gutter-md"
          >
            <div class="col-grow">
              <q-input
                v-model="searchQuery"
                dense
                outlined
                placeholder="Search datasets..."
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <q-btn
              v-if="allowDbCreation"
              label="Create New Dataset"
              @click="showDatasetDialog = true"
              color="primary"
              icon="add"
              unelevated
            />
          </div>
        </div>

        <!-- Pending Invites section (only shown when there are invites) -->
        <div>
          <q-card
            v-if="!loading && !error && receivedInvites.length > 0"
            class="q-mb-md"
          >
            <q-card-section class="q-pb-none">
              <div class="text-h6 flex items-center">
                <q-icon name="move_to_inbox" class="q-mr-sm" />
                Pending Invites ({{ receivedInvites.length }})
              </div>
            </q-card-section>

            <q-separator class="q-my-md" />

            <q-card-section>
              <div v-if="loadingInvites" class="flex flex-center q-pa-md">
                <q-spinner color="primary" size="md" />
              </div>
              <div v-else>
                <q-list separator>
                  <q-item
                    v-for="invite in receivedInvites"
                    :key="invite.id"
                    class="q-py-sm"
                  >
                    <q-item-section avatar>
                      <q-avatar v-if="invite.logo">
                        <img :src="invite.logo" />
                      </q-avatar>

                      <q-avatar
                        v-else
                        color="primary"
                        text-color="white"
                        icon="database"
                      />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        <span class="text-weight-medium">{{
                          invite.db_name
                        }}</span>
                      </q-item-label>
                      <q-item-label caption class="q-mt-xs">
                        <q-badge color="blue-grey" class="q-mr-sm">
                          {{ invite.access_level }}
                        </q-badge>
                        <template v-if="invite.role">
                          <q-badge color="teal">
                            {{ invite.role }}
                          </q-badge>
                        </template>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row q-gutter-sm">
                        <q-btn
                          color="positive"
                          flat
                          label="Accept"
                          @click="acceptInvite(invite.id)"
                          :loading="processingInvite === invite.id"
                        />
                        <q-btn
                          color="negative"
                          flat
                          label="Decline"
                          @click="declineInvite(invite.id)"
                          :loading="processingInvite === invite.id"
                        />
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- No results message -->
        <div class="">
          <div
            v-if="!loading && !error && filteredDatasets.length === 0"
            class="flex flex-center column q-py-xl text-grey text-center"
          >
            <q-icon name="search_off" size="64px" />
            <div class="text-h6 q-mt-md">No datasets found</div>
            <div class="text-body2">Try adjusting your search query</div>
          </div>
        </div>
        <div>
          <!-- Use v-model for two-way binding of dialog visibility -->
          <CreateDataset
            v-model="showDatasetDialog"
            @create-dataset="handleCreateDataset"
            @update:allowCreation="handleAllowCreation"
          />
        </div>

        <!-- API Keys Dialog -->
        <ApiKeys
          v-model="showApiKeysDialog"
          :datasetId="selectedDatasetForApiKeys?.id"
          :datasetName="selectedDatasetForApiKeys?.db_name"
        />

        <!-- TABLE VIEW MODE -->
        <div
          v-if="!loading && !error && filteredDatasets.length > 0"
          class="container"
        >
          <q-card flat bordered>
            <q-table
              :rows="filteredDatasets"
              :columns="datasetColumns"
              row-key="id"
              flat
              bordered
              dense
              :pagination="{ rowsPerPage: 0 }"
              hide-pagination
            >
              <!-- Name column -->
              <template v-slot:body-cell-name="props">
                <q-td
                  :props="props"
                  class="cursor-pointer"
                  @click="navigateToDataset(props.row)"
                >
                  <div class="text-weight-medium text-primary">
                    {{ props.row.db_name }}
                  </div>
                </q-td>
              </template>

              <!-- Access Level column -->
              <template v-slot:body-cell-access_level="props">
                <q-td :props="props">
                  <q-badge
                    :color="
                      props.row.access_level === 'owner'
                        ? 'positive'
                        : props.row.access_level === 'admin'
                        ? 'primary'
                        : 'blue-grey'
                    "
                  >
                    {{ props.row.access_level }}
                  </q-badge>
                </q-td>
              </template>

              <!-- Users count column -->
              <template v-slot:body-cell-users="props">
                <q-td :props="props">
                  <div class="row items-center justify-center q-gutter-xs">
                    <span>{{
                      props.row.users ? props.row.users.length : 0
                    }}</span>
                    <q-btn
                      v-if="
                        props.row.access_level === 'admin' ||
                        props.row.access_level === 'owner'
                      "
                      flat
                      round
                      dense
                      size="xs"
                      color="primary"
                      icon="add"
                      @click.stop="openInviteDialog(props.row)"
                    >
                      <q-tooltip>Invite User</q-tooltip>
                    </q-btn>
                  </div>
                </q-td>
              </template>

              <!-- Roles count column -->
              <template v-slot:body-cell-roles="props">
                <q-td :props="props">
                  {{ props.row.roles ? props.row.roles.length : 0 }}
                </q-td>
              </template>

              <!-- Pending count column (only shown if ai_plugin is enabled) -->
              <template v-slot:body-cell-pending_count="props">
                <q-td
                  :props="props"
                  :class="
                    props.row.workstations?.has_stations
                      ? 'cursor-pointer text-primary'
                      : ''
                  "
                  @click="
                    props.row.workstations?.has_stations
                      ? navigateToStation(props.row)
                      : null
                  "
                >
                  <div class="row items-center justify-center">
                    <template v-if="!props.row.workstations?.has_stations">
                      -
                    </template>
                    <template v-else>
                      {{ props.row.workstations.pending_count || 0 }} Invoices
                    </template>
                  </div>
                </q-td>
              </template>

              <!-- Actions column -->
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    v-if="props.row.admin === 1"
                    flat
                    round
                    dense
                    color="primary"
                    icon="settings"
                    @click.stop="openManageDialog(props.row)"
                    size="sm"
                  >
                    <q-tooltip>Manage Dataset</q-tooltip>
                  </q-btn>
                  <span v-else>-</span>
                </q-td>
              </template>
            </q-table>
          </q-card>
        </div>

        <!-- Manage Dataset Dialog -->
        <q-dialog v-model="manageDialog">
          <q-card
            v-if="selectedDatasetForManage"
            style="width: 90vw; max-width: 1200px"
          >
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">
                Manage Dataset: {{ selectedDatasetForManage.db_name }}
              </div>
              <q-space />
              <q-btn
                v-if="selectedDatasetForManage.access_level == 'owner'"
                flat
                round
                dense
                color="primary"
                icon="more_horiz"
              >
                <q-menu>
                  <q-list style="min-width: 150px">
                    <q-item
                      clickable
                      v-close-popup
                      @click="openDeleteDialog(selectedDatasetForManage)"
                    >
                      <q-item-section avatar>
                        <q-icon name="delete_forever" color="negative" />
                      </q-item-section>
                      <q-item-section class="text-negative"
                        >Delete Dataset</q-item-section
                      >
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
              <q-btn flat round dense icon="close" v-close-popup />
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pa-md">
              <!-- Dataset Info Header -->
              <div class="row items-center q-mb-md q-gutter-md">
                <q-avatar v-if="selectedDatasetForManage.logo" size="64px">
                  <q-img :src="`${selectedDatasetForManage.logo}`" alt="Logo" />
                </q-avatar>
                <q-avatar v-else color="primary" text-color="white" size="64px">
                  <q-icon name="database" size="32px" />
                </q-avatar>
                <div>
                  <div class="text-h5 text-primary">
                    {{ selectedDatasetForManage.db_name }}
                  </div>
                  <div class="row items-center q-mt-xs q-gutter-sm">
                    <q-badge color="primary">
                      {{
                        selectedDatasetForManage.users
                          ? selectedDatasetForManage.users.length
                          : 0
                      }}
                      Users
                    </q-badge>
                    <q-badge color="primary">
                      {{
                        selectedDatasetForManage.roles
                          ? selectedDatasetForManage.roles.length
                          : 0
                      }}
                      Roles
                    </q-badge>
                  </div>
                </div>
                <q-space />
                <div class="row q-gutter-sm">
                  <q-btn
                    flat
                    color="primary"
                    icon="person_add"
                    label="Invite User"
                    @click.stop="openInviteDialog(selectedDatasetForManage)"
                  />
                  <q-btn
                    v-if="selectedDatasetForManage.access_level == 'owner'"
                    flat
                    color="primary"
                    icon="vpn_key"
                    label="API Keys"
                    @click.stop="openApiKeysDialog(selectedDatasetForManage)"
                  />
                </div>
              </div>

              <!-- Dataset Tabs Section -->
              <q-tabs
                v-model="selectedDatasetForManage.activeTab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                align="left"
              >
                <q-tab name="users" icon="group" label="Users" />
                <q-tab name="roles" icon="security" label="Roles" />
                <q-tab
                  name="invites"
                  icon="mail"
                  label="Invites"
                  :alert="
                    getDatasetInvites(selectedDatasetForManage.id).length > 0
                  "
                />
                <q-tab
                  name="connections"
                  icon="cloud_upload"
                  label="Connections"
                  v-if="selectedDatasetForManage.access_level == 'owner'"
                />
                <q-tab
                  name="backup"
                  icon="cloud_download"
                  label="Backup"
                  v-if="selectedDatasetForManage.access_level == 'owner'"
                />
              </q-tabs>

              <q-separator class="q-my-md" />

              <q-tab-panels
                v-model="selectedDatasetForManage.activeTab"
                animated
              >
                <!-- Users Panel -->
                <q-tab-panel name="users" class="q-pa-none">
                  <div
                    v-if="
                      selectedDatasetForManage.users &&
                      selectedDatasetForManage.users.length
                    "
                  >
                    <q-table
                      :rows="selectedDatasetForManage.users"
                      :columns="userColumns"
                      row-key="email"
                      flat
                      bordered
                      dense
                      hide-pagination
                      hide-bottom
                    >
                      <!-- User Actions column -->
                      <template v-slot:body-cell-actions="props">
                        <q-td :props="props">
                          <q-btn
                            flat
                            round
                            dense
                            color="primary"
                            icon="edit"
                            @click.stop="
                              openEditUserDialog(
                                selectedDatasetForManage,
                                props.row
                              )
                            "
                          >
                            <q-tooltip>
                              {{
                                props.row.access_level === "owner"
                                  ? "Owner access cannot be modified"
                                  : "Edit Access"
                              }}
                            </q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            round
                            dense
                            color="negative"
                            icon="delete"
                            @click.stop="
                              confirmRemoveAccess(
                                selectedDatasetForManage,
                                props.row
                              )
                            "
                            :disabled="props.row.access_level === 'owner'"
                          >
                            <q-tooltip>
                              {{
                                props.row.access_level === "owner"
                                  ? "Owner access cannot be removed"
                                  : "Remove Access"
                              }}
                            </q-tooltip>
                          </q-btn>
                        </q-td>
                      </template>
                    </q-table>
                  </div>
                  <div v-else class="text-center q-pa-xl text-grey-7">
                    <q-icon name="people_alt" size="64px" />
                    <div class="text-h6 q-mt-md">No users available</div>
                  </div>
                </q-tab-panel>

                <!-- Roles Panel -->
                <q-tab-panel name="roles" class="q-pa-none">
                  <div
                    v-if="
                      selectedDatasetForManage.roles &&
                      selectedDatasetForManage.roles.length
                    "
                  >
                    <q-table
                      :rows="selectedDatasetForManage.roles"
                      :columns="roleColumns"
                      row-key="id"
                      flat
                      bordered
                      dense
                      hide-pagination
                      hide-bottom
                    >
                      <!-- Display role permissions as chips -->
                      <template v-slot:body-cell-acs="props">
                        <q-td :props="props">
                          <div class="row items-center flex-wrap q-gutter-xs">
                            <q-chip
                              v-for="group in groupRowAcs(props.row.acs)"
                              :key="group.group"
                              dense
                              size="sm"
                              color="primary"
                              text-color="white"
                            >
                              {{ t(group.group) }}
                              <q-tooltip v-if="group.subs.length">
                                <div
                                  v-for="sub in group.subs"
                                  :key="sub"
                                  class="q-pa-xs"
                                >
                                  {{ sub.split(".").slice(1).join(".") }}
                                </div>
                              </q-tooltip>
                            </q-chip>
                          </div>
                        </q-td>
                      </template>
                      <!-- Edit action -->
                      <template v-slot:body-cell-actions="props">
                        <q-td :props="props" class="q-gutter-xs">
                          <q-btn
                            icon="edit"
                            color="primary"
                            flat
                            dense
                            @click.stop="
                              openEditRolePopup(
                                selectedDatasetForManage,
                                props.row
                              )
                            "
                          >
                            <q-tooltip>Edit</q-tooltip>
                          </q-btn>
                        </q-td>
                      </template>
                    </q-table>

                    <div class="q-mt-md text-right">
                      <q-btn
                        label="Add Role"
                        color="primary"
                        icon="add"
                        @click.stop="openAddRolePopup(selectedDatasetForManage)"
                      />
                    </div>
                  </div>
                  <div v-else class="text-center q-pa-xl text-grey-7">
                    <q-icon name="security" size="64px" />
                    <div class="text-h6 q-mt-md">No roles available</div>
                    <q-btn
                      class="q-mt-md"
                      label="Add First Role"
                      color="primary"
                      icon="add"
                      @click.stop="openAddRolePopup(selectedDatasetForManage)"
                    />
                  </div>
                </q-tab-panel>

                <!-- Invites Panel -->
                <q-tab-panel name="invites" class="q-pa-none">
                  <div v-if="loadingInvites" class="flex flex-center q-pa-xl">
                    <q-spinner color="primary" size="xl" />
                  </div>

                  <div
                    v-else-if="
                      getDatasetInvites(selectedDatasetForManage.id).length ===
                      0
                    "
                    class="text-center q-pa-xl text-grey-7"
                  >
                    <q-icon name="mail" size="64px" />
                    <div class="text-h6 q-mt-md">No pending invites</div>
                    <q-btn
                      class="q-mt-md"
                      label="Invite User"
                      color="primary"
                      icon="person_add"
                      @click.stop="openInviteDialog(selectedDatasetForManage)"
                    />
                  </div>

                  <div v-else>
                    <q-list separator bordered>
                      <q-item
                        v-for="invite in getDatasetInvites(
                          selectedDatasetForManage.id
                        )"
                        :key="invite.id"
                        class="q-py-md"
                      >
                        <q-item-section>
                          <q-item-label>
                            <q-icon name="email" class="q-mr-sm" />
                            {{ invite.recipient_email }}
                          </q-item-label>
                          <q-item-label caption class="q-mt-sm">
                            <q-badge color="blue-grey" class="q-mr-sm">
                              {{ invite.access_level }}
                            </q-badge>
                            <template v-if="invite.role_id">
                              <q-badge color="teal">
                                {{ invite.role }}
                              </q-badge>
                            </template>
                          </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-btn
                            color="negative"
                            flat
                            round
                            dense
                            icon="cancel"
                            @click="cancelInvite(invite.id)"
                            :loading="processingInvite === invite.id"
                          >
                            <q-tooltip>Cancel Invite</q-tooltip>
                          </q-btn>
                        </q-item-section>
                      </q-item>
                    </q-list>

                    <div class="q-mt-md text-right">
                      <q-btn
                        label="Invite Another User"
                        color="primary"
                        icon="person_add"
                        @click.stop="openInviteDialog(selectedDatasetForManage)"
                      />
                    </div>
                  </div>
                </q-tab-panel>

                <q-tab-panel name="connections" class="q-pa-md">
                  <DatasetConnections
                    :dataset="selectedDatasetForManage"
                    :redirectUrl="redirectUrl"
                    :dropboxKey="DROPBOX_KEY"
                    :googleClientId="GOOGLE_CLIENT_ID"
                    :allDrive="ALL_DRIVE"
                  />
                </q-tab-panel>

                <q-tab-panel name="backup" class="q-pa-md">
                  <div class="text-center">
                    <q-btn
                      color="primary"
                      label="Download Database"
                      icon="cloud_download"
                      class="q-mr-sm"
                      @click="downloadDb(selectedDatasetForManage)"
                    />
                    <q-btn
                      color="accent"
                      label="Download Templates"
                      icon="folder_zip"
                      @click="downloadTemplates(selectedDatasetForManage)"
                    />
                  </div>
                </q-tab-panel>
              </q-tab-panels>
            </q-card-section>
          </q-card>
        </q-dialog>

        <!-- Dialog for Adding/Editing a Role -->
        <q-dialog v-model="roleDialog">
          <q-card>
            <q-card-section
              class="row items-center justify-between bg-primary text-white"
            >
              <div class="text-h6">
                {{ isEditMode ? "Edit Role" : "Add Role" }}
              </div>
              <q-btn
                flat
                round
                dense
                icon="close"
                v-close-popup
                text-color="white"
              />
            </q-card-section>

            <q-card-section class="scroll" style="max-height: 80vh">
              <q-input
                v-model="selectedRole.name"
                label="Role Name"
                outlined
                dense
                class="q-mb-md"
                :rules="[(val) => !!val || 'Role name is required']"
              >
                <template v-slot:prepend>
                  <q-icon name="badge" />
                </template>
              </q-input>

              <div class="q-my-md">
                <div class="text-subtitle1 q-mb-sm text-primary">
                  Access Controls
                </div>
                <q-separator class="q-mb-sm" />

                <div v-for="group in groupedAcs" :key="group.group">
                  <q-checkbox
                    :label="t(group.label)"
                    :model-value="isGroupChecked(group, selectedRole)"
                    @update:model-value="
                      (val) => toggleGroup(group, val, selectedRole)
                    "
                    color="primary"
                    class="lighttext q-mt-sm"
                  />
                  <div class="q-ml-lg">
                    <q-checkbox
                      v-for="subObj in group.subs"
                      :key="subObj.perm"
                      :label="t(subObj.label)"
                      :model-value="isChecked(subObj.perm, selectedRole)"
                      @update:model-value="
                        (val) =>
                          togglePermission(subObj.perm, val, selectedRole)
                      "
                      class="maintext q-ma-xs"
                      dense
                    />
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn
                flat
                label="Cancel"
                color="grey"
                v-close-popup
                @click="cancelRole"
              />
              <q-btn
                label="Save"
                color="primary"
                @click="saveRole"
                :loading="saving"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Dialog for Inviting a User -->
        <q-dialog v-model="inviteDialog">
          <q-card style="width: 500px; max-width: 90vw">
            <q-card-section
              class="row items-center justify-between bg-primary text-white"
            >
              <div class="text-h6">
                <q-icon name="person_add" class="q-mr-sm" />
                Invite User
              </div>
              <q-btn
                flat
                round
                dense
                icon="close"
                v-close-popup
                text-color="white"
              />
            </q-card-section>

            <q-card-section class="q-pt-md">
              <p class="text-subtitle2 q-mb-sm">
                Inviting user to
                <strong>{{ selectedDatasetForInvite?.db_name }}</strong>
              </p>

              <q-input
                v-model="inviteData.recipient_email"
                label="Email Address"
                type="email"
                outlined
                dense
                hide-bottom-space
                class="q-my-md"
                lazy-rules
                :rules="[
                  (val) => !!val || 'Email is required',
                  (val) =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
                    'Invalid email format',
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="email" />
                </template>
              </q-input>

              <q-select
                v-model="inviteData.access_level"
                :options="[
                  { label: 'Admin', value: 'admin' },
                  { label: 'User', value: 'user' },
                ]"
                label="Access Level"
                outlined
                dense
                class="q-my-md"
                emit-value
                map-options
              >
                <template v-slot:prepend>
                  <q-icon name="security" />
                </template>
              </q-select>

              <q-select
                v-if="
                  selectedDatasetForInvite && selectedDatasetForInvite.roles
                "
                v-model="inviteData.role_id"
                :options="roleOptions"
                label="Role"
                outlined
                dense
                class="q-my-md"
                emit-value
                map-options
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="assignment_ind" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No roles available
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn
                flat
                label="Cancel"
                color="grey"
                v-close-popup
                @click="cancelInviteDialog"
              />
              <q-btn
                label="Send Invite"
                color="primary"
                icon="send"
                @click="sendInvite"
                :loading="sendingInvite"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Dialog for Editing User Access -->
        <q-dialog v-model="editUserDialog">
          <q-card style="width: 500px; max-width: 90vw">
            <q-card-section
              class="row items-center justify-between bg-primary text-white"
            >
              <div class="text-h6">
                <q-icon name="edit" class="q-mr-sm" />
                Edit User Access
              </div>
              <q-btn
                flat
                round
                dense
                icon="close"
                v-close-popup
                text-color="white"
              />
            </q-card-section>

            <q-card-section class="q-pt-md">
              <p class="text-subtitle2 q-mb-sm">
                User: <strong>{{ selectedUser?.email }}</strong>
              </p>
              <p class="text-subtitle2 q-mb-md">
                Dataset:
                <strong>{{ selectedDatasetForUserEdit?.db_name }}</strong>
              </p>

              <q-select
                v-model="userEditData.access_level"
                :options="[
                  { label: 'Admin', value: 'admin' },
                  { label: 'User', value: 'user' },
                ]"
                label="Access Level"
                outlined
                dense
                class="q-my-md"
                emit-value
                map-options
                :disable="selectedUser?.access_level === 'owner'"
              >
                <template v-slot:prepend>
                  <q-icon name="security" />
                </template>
              </q-select>

              <q-select
                v-if="
                  selectedDatasetForUserEdit && selectedDatasetForUserEdit.roles
                "
                v-model="userEditData.role_id"
                :options="roleOptionsForEdit"
                label="Role"
                outlined
                dense
                class="q-my-md"
                emit-value
                map-options
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="assignment_ind" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No roles available
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn
                flat
                label="Cancel"
                color="grey"
                v-close-popup
                @click="cancelEditUserDialog"
              />
              <q-btn
                label="Save Changes"
                color="primary"
                icon="save"
                @click="saveUserAccess"
                :loading="savingUserAccess"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Confirmation Dialog for Removing Access -->
        <q-dialog v-model="removeAccessDialog">
          <q-card>
            <q-card-section class="bg-negative text-white">
              <div class="text-h6">
                <q-icon name="warning" class="q-mr-sm" />
                Remove User Access
              </div>
            </q-card-section>

            <q-card-section class="q-pt-md">
              <p>
                Are you sure you want to remove access for
                <strong>{{ selectedUser?.email }}</strong> from
                <strong>{{ selectedDatasetForUserEdit?.db_name }}</strong
                >?
              </p>
              <p class="text-caption text-negative">
                This action cannot be undone.
              </p>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn flat label="Cancel" color="primary" v-close-popup />
              <q-btn
                label="Remove Access"
                color="negative"
                @click="removeUserAccess"
                :loading="removingAccess"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Dataset deletion dialog -->
        <q-dialog v-model="deleteDialog" persistent>
          <q-card style="width: 500px; max-width: 90vw">
            <q-card-section class="bg-negative text-white">
              <div class="text-h6">
                <q-icon name="delete_forever" class="q-mr-sm" />
                Delete Dataset
              </div>
            </q-card-section>

            <q-card-section class="q-pt-md">
              <p class="text-subtitle2 q-mb-md">
                Are you sure you want to delete
                <strong>{{ datasetToDelete?.db_name }}</strong
                >?
              </p>
              <p class="q-mb-sm">
                This action will permanently delete the dataset and all
                templates and
                <strong>cannot</strong> be undone. Only the owner can perform
                this operation.
              </p>
              <p class="text-body2 text-negative q-mb-md">
                Please enter your password to confirm this irreversible action.
              </p>

              <q-input
                v-model="deletePw"
                type="password"
                dense
                input-class="maintext"
                label-color="negative"
                label="Password"
                class="q-mb-md"
                outlined
                autocomplete="current-password"
              />
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn
                flat
                label="Cancel"
                color="primary"
                v-close-popup
                @click="cancelDelete"
              />
              <q-btn
                color="negative"
                label="DELETE DATASET"
                @click="confirmDelete"
                :loading="deletingDataset"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, computed, useTemplateRef } from "vue";
import { api } from "src/boot/axios";
import { Notify, Cookies, useQuasar, LocalStorage } from "quasar";
import { useI18n } from "vue-i18n";
import { getMenuLinks } from "src/layouts/Menu.js";
import { useRouter } from "vue-router";
import { setTheme } from "src/boot/theme";
import { i18n, loadLanguagePack } from "src/boot/i18n";
import CreateDataset from "./CreateDataset.vue";
import DatasetConnections from "./DatasetConnections.vue";
import ApiKeys from "./ApiKeys.vue";
import neoledgerConfig from "../../../neoledger.json";
const showDatasetDialog = ref(false);

// API Keys dialog state
const showApiKeysDialog = ref(false);
const selectedDatasetForApiKeys = ref(null);

// Dataset menu and delete dialog
const deleteDialog = ref(false);
const datasetToDelete = ref(null);
const deletingDataset = ref(false);
const activeDataset = ref(null);

const openDeleteDialog = (dataset) => {
  datasetToDelete.value = dataset || activeDataset.value;
  deletePw.value = "";
  deleteDialog.value = true;
};

const cancelDelete = () => {
  datasetToDelete.value = null;
  deletePw.value = "";
};

const confirmDelete = async () => {
  if (!datasetToDelete.value) return;

  deletingDataset.value = true;
  try {
    await handleDelete(datasetToDelete.value);
    deleteDialog.value = false;
    datasetToDelete.value = null;
  } finally {
    deletingDataset.value = false;
  }
};

// Handle the dataset creation event emitted from the dialog component
const handleCreateDataset = async (datasetDetails) => {
  try {
    const response = await api.post("create_dataset", datasetDetails);
    getDatasets();
  } catch (error) {
    console.log(error);
    Notify.create({
      message: error.response.data.error,
      color: "negative",
      position: "center",
    });
  }
};
const allowDbCreation = ref();
const handleAllowCreation = (newVal) => {
  allowDbCreation.value = newVal;
};
// handle Deletion
const deletePw = ref("");
const handleDelete = async (dataset) => {
  try {
    const response = await api.delete(
      `dataset?id=${dataset.id}&owner_pw=${deletePw.value}`
    );
    deletePw.value = "";
    Notify.create({
      message: "Dataset succesfully deleted.",
      position: "center",
      color: "positive",
    });
    getDatasets();
    return true;
  } catch (error) {
    Notify.create({
      message: error.response.data.message,
      color: "negative",
      position: "center",
    });
    deletePw.value = "";
    return false;
  }
};
const downloadDb = async (dataset) => {
  try {
    const response = await api.get(`download_db?id=${dataset.id}`, {
      responseType: "blob", // Ensure the response is treated as binary data
    });
    // Create a blob URL for the response data
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    // Use dataset.dbName if available, otherwise fallback to dataset.id
    link.setAttribute("download", `${dataset.dbName || dataset.id}.sql`);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    // Cleanup: remove the link after initiating the download
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading SQL dump:", error);
  }
};

// Function to download the templates folder as a zip archive
const downloadTemplates = async (dataset) => {
  try {
    const response = await api.get(`download_templates?id=${dataset.id}`, {
      responseType: "blob", // Ensure the response is treated as binary data
    });
    // Create a blob URL for the response data
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    // Use dataset.dbName if available, otherwise fallback to dataset.id
    link.setAttribute(
      "download",
      `${dataset.dbName || dataset.id}_templates.zip`
    );
    link.href = url;
    document.body.appendChild(link);
    link.click();
    // Cleanup: remove the link after initiating the download
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading templates zip:", error);
  }
};
const logoInputRefs = ref({});
const triggerLogoUpload = (id) => {
  logoInputRefs.value[id].click();
};
const handleLogoUpload = async (event, id) => {
  // Get the selected file from the file input
  const file = event.target.files[0];
  if (!file) {
    console.error("No file selected");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    // Post the file to the backend route '/upload_logo'
    const response = await api.post(`/upload_logo?id=${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    Notify.create({
      message: "Logo Uploaded sucessfully.",
      position: "center",
      color: "positive",
    });
    getDatasets();
  } catch (error) {
    console.error("Error uploading logo:", error);
  }
};

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();

// View and search state
const searchQuery = ref("");

// Datasets state
const datasets = ref([]);
const loading = ref(true);
const error = ref(false);
const saving = ref(false);

// Manage dialog state
const manageDialog = ref(false);
const selectedDatasetForManage = ref(null);

// Role management state
const roleDialog = ref(false);
const isEditMode = ref(false);
const selectedDataset = ref(null);
const selectedRole = ref({ id: null, name: "", acs: [] });

// Invite management state
const inviteDialog = ref(false);
const selectedDatasetForInvite = ref(null);
const inviteData = ref({
  recipient_email: "",
  access_level: "user",
  role_id: null,
});
const sentInvites = ref([]);
const receivedInvites = ref([]);
const loadingInvites = ref(false);
const sendingInvite = ref(false);
const processingInvite = ref(null);

// User access edit state
const editUserDialog = ref(false);
const removeAccessDialog = ref(false);
const selectedDatasetForUserEdit = ref(null);
const selectedUser = ref(null);
const userEditData = ref({
  access_level: "",
  role_id: null,
});
const savingUserAccess = ref(false);
const removingAccess = ref(false);

// Theme and language settings
const languages = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
];

const selectedLanguage = ref(
  languages.find((lang) => lang.value === i18n.global.locale.value) ||
    languages[0]
);

// Columns for Roles table
const roleColumns = [
  { name: "name", label: "Name", field: "name", align: "left" },
  { name: "acs", label: "Permissions", field: "acs", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" },
];

// Columns for Datasets table
const datasetColumns = computed(() => {
  const columns = [
    {
      name: "name",
      label: "Name",
      field: "db_name",
      align: "left",
      sortable: true,
    },
    {
      name: "access_level",
      label: "Access Level",
      field: "access_level",
      align: "left",
      sortable: true,
    },
    {
      name: "users",
      label: "Users",
      field: "users",
      align: "center",
      sortable: true,
    },
  ];

  if (neoledgerConfig.ai_plugin) {
    columns.push({
      name: "pending_count",
      label: "Pending",
      field: "pending_count",
      align: "center",
      sortable: true,
    });
  }

  columns.push({
    name: "actions",
    label: "Actions",
    field: "actions",
    align: "center",
    style: "width: 120px",
  });

  return columns;
});

// Columns for Users table
const userColumns = [
  { name: "email", label: "Email", field: "email", align: "left" },
  {
    name: "access_level",
    label: "Access Level",
    field: "access_level",
    align: "left",
  },
  { name: "role", label: "Role", field: "role", align: "left" },
  {
    name: "actions",
    label: "Actions",
    field: "actions",
    align: "right",
  },
];

// Filtered datasets based on search query
const filteredDatasets = computed(() => {
  if (!searchQuery.value) {
    return datasets.value;
  }

  const query = searchQuery.value.toLowerCase();
  return datasets.value.filter((dataset) =>
    dataset.db_name.toLowerCase().includes(query)
  );
});

// Computed properties for dropdown options
const roleOptions = computed(() => {
  if (
    !selectedDatasetForInvite.value ||
    !selectedDatasetForInvite.value.roles
  ) {
    return [];
  }
  return selectedDatasetForInvite.value.roles.map((role) => ({
    label: role.name,
    value: role.id,
  }));
});

const roleOptionsForEdit = computed(() => {
  if (
    !selectedDatasetForUserEdit.value ||
    !selectedDatasetForUserEdit.value.roles
  ) {
    return [];
  }
  return selectedDatasetForUserEdit.value.roles.map((role) => ({
    label: role.name,
    value: role.id,
  }));
});

// Compute grouped access controls from menuLinks
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

// Get invites for a specific dataset
const getDatasetInvites = (datasetId) => {
  return sentInvites.value.filter((invite) => invite.dataset_id === datasetId);
};

// Process role access controls into groups for display
const groupRowAcs = (acsArray) => {
  const parsedAcs =
    typeof acsArray === "string" ? JSON.parse(acsArray) : acsArray;
  const groups = {};
  parsedAcs.forEach((perm) => {
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

// Toggle dark/light mode
const toggleDarkMode = () => {
  $q.dark.toggle();
  setTheme($q.dark.isActive ? "dark" : "light");
};

// Switch language
function switchLanguage(lang) {
  if (i18n.global.locale.value !== lang.value) {
    loadLanguagePack(lang.value);
    selectedLanguage.value = lang;
  }
}

// Logout handler
async function handleLogout() {
  Cookies.remove("sessionkey");
  await router.push("/login");
}

// Fetch datasets from the API and process roles/users data
const getDatasets = async () => {
  try {
    const response = await api.get("/db_list");
    datasets.value = response.data.map((ds) => ({
      ...ds,
      activeTab: "users", // Add active tab state for each dataset
      expanded: false, // For list view expansion
      roles:
        ds.roles?.map((role) => ({
          ...role,
          acs:
            typeof role.acs === "string"
              ? JSON.parse(role.acs)
              : role.acs || [],
        })) || [],
      users: ds.users || [],
      logo: ds.logo
        ? `${ds.logo}?rand=${Math.random().toString(36).slice(2)}`
        : ds.logo,
    }));
    if (response.data && Array.isArray(response.data)) {
      // 1. Extract all db_name values
      const dbNames = response.data.map((ds) => ds.db_name);
      // 2. Join them into a comma-separated string
      const availableDbString = dbNames.join(",");
      // 3. Store in LocalStorage using the key 'available_db'
      LocalStorage.set("available_db", availableDbString);

      // Optional: Log the stored value for verification
      console.log("Stored available_db:", availableDbString);
    } else {
      console.warn("API response data is not an array:", response.data);
    }

    // Load invites after datasets are loaded
    getInvites();
  } catch (err) {
    console.error("Error fetching datasets:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const GOOGLE_CLIENT_ID = ref("");
const DROPBOX_KEY = ref("");
const ALL_DRIVE = ref(false);
const connectionKeys = async () => {
  try {
    const response = await api.get("/connection_keys");
    DROPBOX_KEY.value = response.data.DROPBOX_KEY;
    GOOGLE_CLIENT_ID.value = response.data.GOOGLE_CLIENT_ID;
    ALL_DRIVE.value = response.data.ALL_DRIVE;
    console.log(response.data);
  } catch (err) {
    console.error("Error fetching datasets:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

// Helper to get role name from ID
const getRoleName = (roleId) => {
  for (const dataset of datasets.value) {
    if (dataset.roles) {
      const role = dataset.roles.find((r) => r.id === roleId);
      if (role) return role.name;
    }
  }
  return `Role #${roleId}`;
};

// Fetch both sent and received invites
const getInvites = async () => {
  loadingInvites.value = true;
  try {
    // Fetch sent invites
    const sentResponse = await api.get("/invites/sent");
    sentInvites.value = sentResponse.data.invites || [];

    // Fetch received invites
    const receivedResponse = await api.get("/invites/received");
    receivedInvites.value = receivedResponse.data.invites || [];
  } catch (err) {
    console.error("Error fetching invites:", err);
    Notify.create({
      message: "Failed to load invites",
      type: "negative",
      position: "center",
    });
  } finally {
    loadingInvites.value = false;
  }
};

// Accept an invite
const acceptInvite = async (inviteId) => {
  processingInvite.value = inviteId;
  try {
    await api.post(`/invite/${inviteId}/accept`);

    receivedInvites.value = receivedInvites.value.filter(
      (invite) => invite.id !== inviteId
    );

    Notify.create({
      message: "Invite accepted successfully",
      type: "positive",
      position: "top-right",
    });

    getDatasets();
  } catch (err) {
    console.error("Error accepting invite:", err);
    Notify.create({
      message: err.response?.data?.message || "Failed to accept invite",
      type: "negative",
      position: "center",
    });
  } finally {
    processingInvite.value = null;
  }
};

// Decline an invite
const declineInvite = async (inviteId) => {
  processingInvite.value = inviteId;
  try {
    await api.post(`/invite/${inviteId}/decline`);

    // Remove from received invites
    receivedInvites.value = receivedInvites.value.filter(
      (invite) => invite.id !== inviteId
    );

    Notify.create({
      message: "Invite declined",
      type: "positive",
      position: "top-right",
    });
  } catch (err) {
    console.error("Error declining invite:", err);
    Notify.create({
      message: err.response?.data?.message || "Failed to decline invite",
      type: "negative",
      position: "center",
    });
  } finally {
    processingInvite.value = null;
  }
};

// Cancel an invite
const cancelInvite = async (inviteId) => {
  processingInvite.value = inviteId;
  try {
    await api.delete(`/invite/${inviteId}`);

    // Remove from sent invites list
    sentInvites.value = sentInvites.value.filter(
      (invite) => invite.id !== inviteId
    );

    Notify.create({
      message: "Invite canceled",
      type: "positive",
      position: "top-right",
    });
  } catch (err) {
    console.error("Error canceling invite:", err);
    Notify.create({
      message: err.response?.data?.message || "Failed to cancel invite",
      type: "negative",
      position: "center",
    });
  } finally {
    processingInvite.value = null;
  }
};

// Open dialog to send an invite
const openInviteDialog = (dataset) => {
  selectedDatasetForInvite.value = dataset;
  inviteData.value = {
    recipient_email: "",
    access_level: "user",
    role_id: null,
  };
  inviteDialog.value = true;
};

// Open dialog to manage API keys
const openApiKeysDialog = (dataset) => {
  selectedDatasetForApiKeys.value = dataset;
  showApiKeysDialog.value = true;
};

// Cancel invite dialog
const cancelInviteDialog = () => {
  inviteDialog.value = false;
};

// Send an invite
const sendInvite = async () => {
  // Validate email format
  if (
    !inviteData.value.recipient_email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteData.value.recipient_email)
  ) {
    Notify.create({
      message: "Please enter a valid email address",
      type: "negative",
      position: "center",
    });
    return;
  }

  sendingInvite.value = true;
  try {
    const payload = {
      recipient_email: inviteData.value.recipient_email,
      dataset_id: selectedDatasetForInvite.value.id,
      access_level: inviteData.value.access_level,
      role_id: inviteData.value.role_id || null,
    };

    await api.post(
      `/client/${selectedDatasetForInvite.value.db_name}/invite`,
      payload
    );

    Notify.create({
      message: "Invite sent successfully",
      type: "positive",
      position: "top-right",
    });

    inviteDialog.value = false;

    // Refresh sent invites
    getInvites();
  } catch (err) {
    console.error("Error sending invite:", err);
    Notify.create({
      message: err.response?.data?.message || "Failed to send invite",
      type: "negative",
      position: "center",
    });
  } finally {
    sendingInvite.value = false;
  }
};

// Open dialog to edit user access
const openEditUserDialog = (dataset, user) => {
  selectedDatasetForUserEdit.value = dataset;
  selectedUser.value = user;
  userEditData.value = {
    access_level: user.access_level,
    role_id: user.role_id,
  };
  editUserDialog.value = true;
};

// Cancel user edit dialog
const cancelEditUserDialog = () => {
  editUserDialog.value = false;
  selectedUser.value = null;
  userEditData.value = {
    access_level: "",
    role_id: null,
  };
};

// Open confirmation dialog to remove user access
const confirmRemoveAccess = (dataset, user) => {
  if (user.access_level === "owner") {
    Notify.create({
      message: "Cannot remove owner access",
      type: "warning",
      position: "center",
    });
    return;
  }

  selectedDatasetForUserEdit.value = dataset;
  selectedUser.value = user;
  removeAccessDialog.value = true;
};

// Save user access changes
const saveUserAccess = async () => {
  if (!selectedUser.value || !selectedDatasetForUserEdit.value) {
    return;
  }

  savingUserAccess.value = true;

  try {
    const payload = {
      access_level: userEditData.value.access_level,
      role_id: userEditData.value.role_id,
    };

    await api.post(
      `/client/${selectedDatasetForUserEdit.value.db_name}/access/${selectedUser.value.profile_id}`,
      payload
    );

    Notify.create({
      message: "User access updated successfully",
      type: "positive",
      position: "top-right",
    });

    editUserDialog.value = false;

    // Update the user data in the local state
    if (
      selectedDatasetForUserEdit.value &&
      selectedDatasetForUserEdit.value.users
    ) {
      const userIndex = selectedDatasetForUserEdit.value.users.findIndex(
        (u) => u.profile_id === selectedUser.value.profile_id
      );

      if (userIndex !== -1) {
        selectedDatasetForUserEdit.value.users[userIndex].access_level =
          userEditData.value.access_level;
        selectedDatasetForUserEdit.value.users[userIndex].role_id =
          userEditData.value.role_id;
        selectedDatasetForUserEdit.value.users[userIndex].role = userEditData
          .value.role_id
          ? getRoleName(userEditData.value.role_id)
          : null;
      }
    }
  } catch (err) {
    console.error("Error updating user access:", err);
    Notify.create({
      message: err.response?.data?.message || "Failed to update user access",
      type: "negative",
      position: "center",
    });
  } finally {
    savingUserAccess.value = false;
  }
};

// Remove user access
const removeUserAccess = async () => {
  if (
    !selectedUser.value ||
    !selectedDatasetForUserEdit.value ||
    selectedUser.value.access_level === "owner"
  ) {
    removeAccessDialog.value = false;
    return;
  }

  removingAccess.value = true;

  try {
    await api.post(
      `/client/${selectedDatasetForUserEdit.value.db_name}/access/${selectedUser.value.profile_id}`,
      { delete: true }
    );

    Notify.create({
      message: "User access removed successfully",
      type: "positive",
      position: "top-right",
    });

    // Remove the user from the dataset's users array
    if (
      selectedDatasetForUserEdit.value &&
      selectedDatasetForUserEdit.value.users
    ) {
      selectedDatasetForUserEdit.value.users =
        selectedDatasetForUserEdit.value.users.filter(
          (u) => u.profile_id !== selectedUser.value.profile_id
        );
    }

    removeAccessDialog.value = false;
  } catch (err) {
    console.error("Error removing user access:", err);
    Notify.create({
      message: err.response?.data?.message || "Failed to remove user access",
      type: "negative",
      position: "center",
    });
  } finally {
    removingAccess.value = false;
  }
};

const redirectUrl = ref();
onMounted(async () => {
  getDatasets();
  connectionKeys();
  redirectUrl.value = window.location.origin;
  await computeGroupedAcs();
});

// Open dialog to add a new role
const openAddRolePopup = (dataset) => {
  selectedDataset.value = dataset;
  selectedRole.value = { id: null, name: "", acs: [] };
  isEditMode.value = false;
  roleDialog.value = true;
};

// Open dialog to edit an existing role
const openEditRolePopup = (dataset, role) => {
  selectedDataset.value = dataset;
  selectedRole.value = {
    id: role.id,
    name: role.name,
    acs: typeof role.acs === "string" ? JSON.parse(role.acs) : [...role.acs],
  };
  isEditMode.value = true;
  roleDialog.value = true;
};

// Cancel role editing/creation
const cancelRole = () => {
  roleDialog.value = false;
  selectedRole.value = { id: null, name: "", acs: [] };
};

// Save role changes (create/update) via API
const saveRole = async () => {
  if (!selectedRole.value.name.trim()) {
    Notify.create({
      message: "Role name is required",
      type: "negative",
      position: "center",
    });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: selectedRole.value.name,
      acs: JSON.stringify(selectedRole.value.acs),
    };
    const clientParam = `?client=${selectedDataset.value.db_name}`;

    if (isEditMode.value) {
      await api.post(
        `/client/${selectedDataset.value.db_name}/system/roles/${selectedRole.value.id}`,
        payload
      );
      Notify.create({
        message: "Role updated successfully",
        type: "positive",
        position: "top-right",
      });
    } else {
      await api.post(
        `/client/${selectedDataset.value.db_name}/system/roles${clientParam}`,
        payload
      );
      Notify.create({
        message: "Role added successfully",
        type: "positive",
        position: "top-right",
      });
    }

    roleDialog.value = false;
    getDatasets();
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || "An error occurred",
      type: "negative",
      position: "center",
    });
  } finally {
    saving.value = false;
  }
};

// Check if a specific permission is active
const isChecked = (permission, role) => {
  return role.acs.includes(permission);
};

// Toggle a specific permission on/off
const togglePermission = (permission, value, role) => {
  if (value) {
    if (!role.acs.includes(permission)) {
      role.acs.push(permission);
    }
    const parent = permission.split(".")[0];
    if (!role.acs.includes(parent)) {
      role.acs.push(parent);
    }
  } else {
    role.acs = role.acs.filter((p) => p !== permission);
    const parent = permission.split(".")[0];
    const group = groupedAcs.value.find((g) => g.group === parent);
    if (
      group &&
      group.subs.every((permObj) => !role.acs.includes(permObj.perm))
    ) {
      role.acs = role.acs.filter((p) => p !== parent);
    }
  }
};

// Determine if any permission within a group is active
const isGroupChecked = (group, role) => {
  const acs = role.acs;
  const hasTop = group.top ? acs.includes(group.group) : false;
  const hasSub = group.subs.some((permObj) => acs.includes(permObj.perm));
  return hasTop || hasSub;
};

// Toggle all permissions within a group on/off
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

// Open manage dialog for dataset
const openManageDialog = (dataset) => {
  selectedDatasetForManage.value = dataset;
  if (!dataset.activeTab) {
    dataset.activeTab = "users";
  }
  manageDialog.value = true;
};

// Navigate to the dataset details in a new tab
const navigateToDataset = (dataset) => {
  window.open(`/client/${dataset.db_name}`, "_blank");
};
const navigateToStation = (dataset) => {
  window.open(`/client/${dataset.db_name}/stations/user`, "_blank");
};
</script>
