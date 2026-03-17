<template>
  <q-page class="q-pa-sm">
    <div class="row q-mb-sm hide-print items-center q-gutter-sm">
      <q-btn :label="t('Add New')" @click="openEditDialog()" color="primary" />
      <q-btn-dropdown
        :label="selectedCollapseLabel"
        flat
        size="sm"
        no-caps
        dense
        icon="unfold_less"
        menu-anchor="bottom left"
        menu-self="top left"
        class="expand-controls"
      >
        <q-list dense class="collapse-dropdown">
          <q-item
            clickable
            v-close-popup
            @click="expandAllHeadings"
            :active="selectedCollapseLevel === -1"
            dense
          >
            <q-item-section>{{ t("Expand All") }}</q-item-section>
          </q-item>
          <q-separator />
          <q-item
            v-for="opt in collapseLevelOptions"
            :key="opt.value"
            clickable
            v-close-popup
            @click="collapseToLevel(opt.value)"
            :active="selectedCollapseLevel === opt.value"
            dense
          >
            <q-item-section>{{ opt.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>

    <q-card v-if="treeNodes.length > 0" flat bordered class="categories-tree-card">
      <q-tree
        :nodes="treeNodes"
        node-key="nodeKey"
        :expanded="expandedKeys"
        @update:expanded="expandedKeys = $event"
        dense
      >
        <template #default-header="prop">
          <div class="row items-center q-gutter-x-sm no-wrap">
            <q-icon
              v-if="prop.node.categoryId != null"
              name="category"
              size="18px"
              color="primary"
            />
            <q-icon v-else name="account_tree" size="18px" color="grey-7" />
            <a
              v-if="prop.node.categoryId != null"
              href="#"
              class="text-primary text-body2"
              @click.prevent="openEditDialog(prop.node.categoryId)"
            >
              {{ prop.node.label }}
            </a>
            <span v-else class="text-body2 text-grey-9">{{ prop.node.label }}</span>
            <q-badge
              v-if="prop.node.isCycle"
              color="warning"
              :label="t('cycle')"
              class="q-ml-xs"
            />
          </div>
        </template>
      </q-tree>
    </q-card>

    <div v-else class="text-grey q-mt-md">{{ t("No categories found.") }}</div>

    <!-- Edit / Add Category Dialog -->
    <q-dialog v-model="editDialog">
      <q-card class="q-pa-sm" style="min-width: 360px; max-width: 480px">
        <q-card-section class="q-pa-xs">
          <div class="text-h6">{{ editDialogTitle }}</div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pa-xs">
          <q-form @submit.prevent="saveCategory">
            <q-input
              dense
              outlined
              v-model="selectedCategory.accno"
              :label="t('Category Code *')"
              class="q-mt-xs"
            />
            <q-input
              dense
              outlined
              v-model="selectedCategory.description"
              :label="t('Description')"
              class="q-mt-xs"
            />
            <div class="row justify-end q-mt-sm q-gutter-x-sm">
              <q-btn
                flat
                :label="t('Cancel')"
                color="primary"
                @click="editDialog = false"
              />
              <q-btn
                color="negative"
                :label="t('Delete')"
                v-if="selectedCategory.id"
                @click.prevent="deleteCategory(selectedCategory.id)"
              />
              <q-btn :label="t('Save')" color="primary" type="submit" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject, computed, watch, nextTick } from "vue";
import { api } from "src/boot/axios";
import { useI18n } from "vue-i18n";
import { Notify, Dialog } from "quasar";

const { t } = useI18n();
const updateTitle = inject("updateTitle");
updateTitle(t("Chart Categories"));

const results = ref([]);
const expandedKeys = ref([]);

function collectTreeCategoryIds(nodes, set) {
  for (const n of nodes) {
    if (n.categoryId != null) set.add(n.categoryId);
    if (n.children?.length) collectTreeCategoryIds(n.children, set);
  }
}

/** Tree from API: `charts[]` is child categories (by accno) or leaf accounts. */
function buildCategoryTree(categories) {
  if (!categories?.length) return [];

  const byAccno = {};
  for (const c of categories) {
    byAccno[String(c.accno)] = c;
  }

  const referenced = new Set();
  for (const c of categories) {
    for (const ch of c.charts || []) {
      if (ch?.accno != null) referenced.add(String(ch.accno));
    }
  }

  let roots = categories.filter((c) => !referenced.has(String(c.accno)));

  function toNode(cat, pathIds, depth) {
    if (pathIds.has(cat.id)) {
      return {
        label: `${cat.accno} - ${cat.description}`,
        nodeKey: `cat-${cat.id}-cycle`,
        categoryId: cat.id,
        depth,
        isCycle: true,
        children: [],
      };
    }
    const nextPath = new Set(pathIds);
    nextPath.add(cat.id);

    const children = [];
    for (const ch of cat.charts || []) {
      if (!ch || ch.accno == null) continue;
      const sub = byAccno[String(ch.accno)];
      if (sub && sub.id !== cat.id) {
        children.push(toNode(sub, nextPath, depth + 1));
      } else {
        children.push({
          label: `${ch.accno} - ${ch.description || ""}`,
          nodeKey: `chart-${cat.id}-${ch.accno}`,
          categoryId: null,
          depth: depth + 1,
        });
      }
    }
    return {
      label: `${cat.accno} - ${cat.description}`,
      nodeKey: `cat-${cat.id}`,
      categoryId: cat.id,
      depth,
      children,
    };
  }

  let tree;
  if (roots.length) {
    tree = roots.map((r) => toNode(r, new Set(), 0));
    const seen = new Set();
    collectTreeCategoryIds(tree, seen);
    const orphans = categories.filter((c) => !seen.has(c.id));
    for (const o of orphans) {
      tree.push(toNode(o, new Set(), 0));
    }
  } else {
    /* Every accno appears under some parent — avoid duplicating full subtrees */
    tree = categories.map((c) => ({
      label: `${c.accno} - ${c.description}`,
      nodeKey: `cat-${c.id}`,
      categoryId: c.id,
      depth: 0,
      children: (c.charts || []).map((ch) => {
        if (!ch?.accno) return null;
        const sub = byAccno[String(ch.accno)];
        return sub
          ? {
              label: `${ch.accno} - ${ch.description}`,
              nodeKey: `cat-${c.id}-ref-${sub.id}`,
              categoryId: sub.id,
              depth: 1,
            }
          : {
              label: `${ch.accno} - ${ch.description || ""}`,
              nodeKey: `chart-${c.id}-${ch.accno}`,
              categoryId: null,
              depth: 1,
            };
      }).filter(Boolean),
    }));
  }

  return tree;
}

/** All node keys that have children (fully expanded tree). */
function collectAllExpandableKeys(nodes, keys = []) {
  for (const n of nodes) {
    if (n.children?.length) {
      keys.push(n.nodeKey);
      collectAllExpandableKeys(n.children, keys);
    }
  }
  return keys;
}

/**
 * Expand nodes with depth < levelIndex (levelIndex 0 = roots only, no expansion).
 * levelIndex -1 = expand all.
 */
function keysExpandedToLevel(nodes, levelIndex) {
  const keys = [];
  function walk(arr) {
    for (const n of arr) {
      if (!n.children?.length) continue;
      if (levelIndex === -1) {
        keys.push(n.nodeKey);
        walk(n.children);
      } else if (n.depth < levelIndex) {
        keys.push(n.nodeKey);
        walk(n.children);
      }
    }
  }
  walk(nodes);
  return keys;
}

function maxInternalDepth(nodes) {
  let m = -1;
  function walk(arr) {
    for (const n of arr) {
      if (n.children?.length) {
        m = Math.max(m, n.depth);
        walk(n.children);
      }
    }
  }
  walk(nodes);
  return m;
}

const treeNodes = computed(() => buildCategoryTree(results.value));

const maxHeadingLevel = computed(() => maxInternalDepth(treeNodes.value));

const collapseLevelOptions = computed(() => {
  const maxL = maxHeadingLevel.value;
  if (maxL < 0) return [];
  const options = [];
  for (let i = 0; i <= maxL + 1; i++) {
    options.push({
      value: i,
      label: `${t("Level")} ${i + 1}`,
    });
  }
  return options;
});

const selectedCollapseLevel = ref(-1);

const selectedCollapseLabel = computed(() => {
  if (selectedCollapseLevel.value === -1) {
    return t("Expand All");
  }
  return `${t("Level")} ${selectedCollapseLevel.value + 1}`;
});

function applyExpansionFromSelection() {
  const nodes = treeNodes.value;
  if (!nodes.length) {
    expandedKeys.value = [];
    return;
  }
  if (selectedCollapseLevel.value === -1) {
    expandedKeys.value = collectAllExpandableKeys(nodes);
  } else {
    expandedKeys.value = keysExpandedToLevel(
      nodes,
      selectedCollapseLevel.value,
    );
  }
}

function expandAllHeadings() {
  selectedCollapseLevel.value = -1;
  applyExpansionFromSelection();
}

function collapseToLevel(level) {
  selectedCollapseLevel.value = level;
  applyExpansionFromSelection();
}

watch(
  treeNodes,
  () => {
    applyExpansionFromSelection();
  },
  { immediate: true },
);

const fetchData = async () => {
  try {
    const response = await api.get("/system/chart/categories");
    results.value = response.data;
    await nextTick();
    applyExpansionFromSelection();
  } catch (error) {
    console.error(error);
  }
};

const editDialog = ref(false);
const selectedCategory = ref({ accno: "", description: "" });

const editDialogTitle = computed(() =>
  selectedCategory.value.id ? t("Edit Category") : t("Add New Category")
);

function categoryPayloadForSave() {
  const { charts: _c, ...rest } = selectedCategory.value;
  return rest;
}

async function openEditDialog(id) {
  if (id != null && id !== "") {
    let row = results.value.find((r) => String(r.id) === String(id));
    if (!row) {
      await fetchData();
      row = results.value.find((r) => String(r.id) === String(id));
    }
    if (!row) {
      Notify.create({
        message: t("Category not found."),
        color: "negative",
        position: "center",
      });
      return;
    }
    selectedCategory.value = { ...row };
  } else {
    selectedCategory.value = { accno: "", description: "" };
  }
  editDialog.value = true;
}

async function saveCategory() {
  if (!selectedCategory.value.accno) {
    Notify.create({
      message: t("Category code is required!"),
      color: "negative",
      position: "center",
    });
    return;
  }

  const id = selectedCategory.value.id;
  const url = id
    ? `/system/chart/categories/${id}`
    : `/system/chart/categories/`;

  try {
    await api.post(url, categoryPayloadForSave());
    Notify.create({
      message: t("Category saved successfully"),
      color: "positive",
      position: "top-right",
    });
    await fetchData();
    editDialog.value = false;
  } catch (error) {
    Notify.create({
      message: t("Failed to save category"),
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
}

async function deleteCategory(id) {
  if (!id) return;
  Dialog.create({
    title: t("Confirm Deletion"),
    message: t(
      "Are you sure you want to delete this category? This action cannot be undone."
    ),
    cancel: true,
    persistent: true,
  })
    .onOk(async () => {
      try {
        await api.delete(`/system/chart/categories/${id}`);
        Notify.create({
          message: t("Category deleted successfully"),
          color: "positive",
          position: "top-right",
        });
        await fetchData();
        editDialog.value = false;
      } catch (error) {
        Notify.create({
          message: t("Failed to delete category"),
          color: "negative",
          position: "center",
        });
        console.error(error);
      }
    })
    .onCancel(() => {
      Notify.create({
        message: t("Deletion canceled"),
        color: "warning",
        position: "center",
      });
    });
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.categories-tree-card {
  max-height: calc(100vh - 140px);
  overflow: auto;
}
:deep(.q-tree__node-header) {
  padding: 4px 8px;
}
</style>
