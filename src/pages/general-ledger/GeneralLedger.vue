<template>
  <q-page class="lightbg q-pa-sm relative-position">
    <div class="flex q-pa-sm mainbg column">
      <div class="row q-gutter-sm q-mb-sm">
        <q-input
          :label="t('Reference')"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          v-model="formData.reference"
          :disable="lockNumber"
        />
        <q-select
          v-if="currencies"
          outlined
          v-model="formData.currency"
          :options="currencies"
          option-value="curr"
          option-label="curr"
          :label="t('Currency')"
          dense
          class="col-2"
          bg-color="input"
          label-color="secondary"
        />
        <div class="col-2">
          <q-select
            v-if="departments.length > 0"
            outlined
            v-model="formData.selectedDepartment"
            :options="departments"
            option-value="description"
            option-label="description"
            :label="t('Department')"
            dense
            bg-color="input"
            label-color="secondary"
            clearable
            autogrow
            hide-bottom-space
          />
        </div>
        <q-input
          v-if="formData.currency.rn != 1"
          class="col-2"
          :label="t('Exchange Rate')"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          v-model="formData.exchangeRate"
        />
        <q-input
          v-model="formData.transdate"
          :label="t('Date')"
          class="col-2"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          type="date"
        />
      </div>

      <div class="row q-mb-sm">
        <q-input
          v-model="formData.description"
          :label="t('Description')"
          class="col-6"
          bg-color="input"
          label-color="secondary"
          outlined
          dense
          type="textarea"
          autogrow
          rows="1"
        />
      </div>
      <div class="row q-mb-sm">
        <q-input
          v-model="formData.notes"
          :label="t('Notes')"
          class="col-6"
          bg-color="input"
          label-color="secondary"
          outlined
          autogrow
          dense
          rows="1"
        />
      </div>
      <div class="row">
        <q-file
          bg-color="input"
          label-color="secondary"
          filled
          dense
          outlined
          v-model="formData.files"
          label="Reference Documents"
          multiple
          append
          use-chips
        >
          <template v-slot:prepend>
            <q-icon name="attachment" />
          </template>
        </q-file>
      </div>
      <div class="row q-mt-sm">
        <FileList
          :files="existingFiles"
          module="gl"
          @file-deleted="handleFileDeletion"
          :report="!canPost"
        />
      </div>
    </div>

    <div class="flex q-pa-sm mainbg column q-mt-sm">
      <div v-for="(line, index) in lines" :key="index" class="column q-mb-sm">
        <div class="row q-gutter-x-xs">
          <!-- Account s-select with a ref for auto-focus -->
          <s-select
            outlined
            v-model="line.account"
            :options="accounts"
            :label="t('Account')"
            dense
            class="col-3"
            popup-content-class="mainbg maintext"
            bg-color="input"
            label-color="secondary"
            search="label"
            account
            :ref="(el) => setAccountRef(el, index)"
          />
          <!-- Debit input -->
          <fn-input
            v-model="line.debit"
            :label="t('Debit')"
            class="col-2"
            bg-color="input"
            label-color="secondary"
            outlined
            dense
            @keydown.enter="handleEnter($event, index)"
          />
          <!-- Credit input -->
          <fn-input
            v-model="line.credit"
            :label="t('Credit')"
            class="col-2"
            bg-color="input"
            label-color="secondary"
            outlined
            dense
            @keydown.enter="handleEnter($event, index)"
          />
          <!-- Tax fields if Linetax is enabled -->
          <template v-if="lineTax">
            <s-select
              outlined
              v-model="line.taxAccount"
              :options="filteredTaxAccounts"
              option-value="accno"
              option-label="label"
              :label="t('Tax Accno')"
              dense
              class="col-2"
              popup-content-class="mainbg maintext"
              bg-color="input"
              label-color="secondary"
              account
              search="label"
              @update:model-value="(val) => updateTaxAmount(val, index)"
            />
            <fn-input
              v-model="line.linetaxamount"
              :label="t('Tax Amount')"
              class="col-2"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              @keydown.enter="handleEnter($event, index)"
            />
          </template>
          <!-- Toggle Extra Fields Button -->
          <q-btn
            flat
            dense
            icon="keyboard_arrow_down"
            :class="line.showExtra ? 'rotate-180' : ''"
            @click="toggleExtra(index)"
          />
          <!-- Delete Line Button -->
          <q-btn
            color="negative"
            icon="delete"
            dense
            flat
            @click="removeLine(index)"
            v-if="!line.showExtra"
          />
        </div>

        <!-- Extra Fields for Source and Memo -->
        <transition name="fade">
          <div v-if="line.showExtra" class="row q-gutter-x-xs q-mt-xs">
            <s-select
              v-if="filteredProjects.length > 0"
              outlined
              :options="filteredProjects"
              :label="t('Project')"
              option-label="description"
              option-value="description"
              v-model="line.project"
              class="col-3"
              bg-color="input"
              label-color="secondary"
              dense
              search="description"
            />
            <q-input
              v-model="line.source"
              :label="t('Source')"
              class="col-3"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              @keydown.enter="handleEnter($event, index)"
            />
            <q-input
              v-model="line.memo"
              :label="t('Memo')"
              class="col-3"
              bg-color="input"
              label-color="secondary"
              outlined
              dense
              @keydown.enter="handleEnter($event, index)"
            />
            <q-btn
              color="negative"
              icon="delete"
              dense
              flat
              @click="removeLine(index)"
              v-if="line.showExtra"
            />
          </div>
        </transition>
      </div>

      <div class="row q-py-xs q-gutter-x-xs">
        <div class="q-pa-sm lightbg maintext col-3 text-center">
          {{ t("Total") }}
        </div>
        <div class="q-pa-sm lightbg maintext col-2">
          {{ formatAmount(totalDebit) }}
        </div>
        <div class="q-pa-sm lightbg maintext col-2">
          {{ formatAmount(totalCredit) }}
        </div>
        <div
          class="q-pa-sm col-2 lightbg text-bold"
          :class="
            totalDebit - totalCredit == 0 ? 'text-positive' : 'text-negative'
          "
        >
          {{ formatAmount(totalDebit - totalCredit) }}
        </div>
      </div>

      <div class="row justify-end">
        <q-btn
          color="primary"
          icon="add"
          dense
          flat
          :label="t('Add Line')"
          @click="addLine"
        />
      </div>
    </div>

    <!-- Two buttons: Save and Post -->
    <div class="row q-my-sm q-px-sm q-gutter-x-sm">
      <q-btn
        color="primary"
        :label="t('Post')"
        @click="submitTransaction(true)"
        :loading="loading"
        v-if="canPost"
      />
      <q-btn
        color="primary"
        :label="t('Post As New')"
        @click="submitTransaction(false, true)"
        :loading="loading"
        v-if="canPostAsNew"
      />
      <q-btn
        :label="t('Delete')"
        color="warning"
        @click="deleteTransaction"
        v-if="canDelete"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick, watch } from "vue";
import { api } from "src/boot/axios";
import { date, Notify } from "quasar";
import { useRoute, useRouter } from "vue-router";
import { formatAmount, confirmDelete } from "src/helpers/utils";
import { useI18n } from "vue-i18n";
import FileList from "src/components/FileList.vue";
import { jsonToFormData } from "src/helpers/formDataHelper.js";

const updateTitle = inject("updateTitle");
const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const { formatDate } = date;

const getTodayDate = () => formatDate(new Date(), "YYYY-MM-DD");
const lockNumber = ref(false);

// Initial form and line data for reset
const initialFormData = {
  reference: "",
  currency: "",
  exchangeRate: "",
  description: "",
  notes: "",
  transdate: getTodayDate(),
  originaldate: null,
  id: null,
  files: [],
};

const initialLine = {
  account: "",
  debit: 0,
  credit: 0,
  source: "",
  memo: "",
  taxAccount: "",
  linetaxamount: 0,
  showExtra: false,
};

const formData = ref({ ...initialFormData });
// -- Lines state includes showExtra to control visibility of source & memo --
const lines = ref([{ ...initialLine }, { ...initialLine }]);

const transactionTitle = computed(() =>
  formData.value.id
    ? "Update General Ledger Transaction"
    : "Add General Ledger Transaction"
);
updateTitle(transactionTitle.value);

const accounts = ref([]);
const accountRefs = ref([]);
const setAccountRef = (el, index) => {
  accountRefs.value[index] = el;
};

const isEmptyLine = (line) => {
  const accountEmpty =
    !line.account ||
    (typeof line.account === "string" && line.account.trim() === "");
  return (
    accountEmpty &&
    Number(line.debit) === 0 &&
    Number(line.credit) === 0 &&
    (!line.source || line.source.trim() === "") &&
    (!line.memo || line.memo.trim() === "") &&
    (!line.taxAccount ||
      (typeof line.taxAccount === "string" && line.taxAccount.trim() === "")) &&
    Number(line.linetaxamount) === 0
  );
};

const addLine = () => {
  if (lines.value.length > 1) {
    const emptyIndex = lines.value.findIndex((line) => isEmptyLine(line));
    if (emptyIndex > -1) {
      lines.value.splice(emptyIndex, 1);
    }
  }
  lines.value.push({ ...initialLine });
};

const addLineAt = (index) => {
  if (lines.value.length > 1) {
    const emptyIndex = lines.value.findIndex((line) => isEmptyLine(line));
    if (emptyIndex > -1) {
      lines.value.splice(emptyIndex, 1);
      if (emptyIndex < index) {
        index--;
      }
    }
  }
  lines.value.splice(index + 1, 0, { ...initialLine });
  nextTick(() => {
    if (accountRefs.value[index + 1] && accountRefs.value[index + 1].focus) {
      accountRefs.value[index + 1].focus();
    }
  });
};

const handleEnter = (event, index) => {
  event.preventDefault();
  addLineAt(index);
};

const removeLine = (index) => {
  if (lines.value.length > 2) {
    lines.value.splice(index, 1);
  }
};

const toggleExtra = (index) => {
  lines.value[index].showExtra = !lines.value[index].showExtra;
};

const totalDebit = computed(() =>
  lines.value.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0)
);
const totalCredit = computed(() =>
  lines.value.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0)
);

// Computed properties for conditional visibility
const canPost = computed(
  () =>
    (!closedto.value ||
      !formData.value.originaldate ||
      formData.value.originaldate > closedto.value) &&
    (!closedto.value || formData.value.transdate > closedto.value)
);

const canPostAsNew = computed(
  () => !closedto.value || formData.value.transdate > closedto.value
);

const canDelete = computed(
  () =>
    formData.value.id &&
    (!closedto.value ||
      !formData.value.originaldate ||
      formData.value.originaldate > closedto.value) &&
    revtrans.value != 1
);

const lineTax = ref(false);
const taxAccounts = ref([]);
const departments = ref([]);
const revtrans = ref(null);
const closedto = ref(null);

// Add new ref for filtered tax accounts
const filteredTaxAccounts = ref([]);

// Add function to filter taxes based on transaction date
const filterTaxAccounts = () => {
  if (!formData.value.transdate) return;

  const transDate = new Date(formData.value.transdate);

  // Group taxes by chart_id
  const groupedTaxes = taxAccounts.value.reduce((acc, tax) => {
    if (!acc[tax.chart_id]) {
      acc[tax.chart_id] = [];
    }
    acc[tax.chart_id].push(tax);
    return acc;
  }, {});

  // For each group, find the valid tax for the transaction date
  filteredTaxAccounts.value = Object.values(groupedTaxes).map((taxes) => {
    // Sort taxes by validto date (null dates come last)
    const sortedTaxes = taxes.sort((a, b) => {
      if (!a.validto) return 1;
      if (!b.validto) return -1;
      return new Date(a.validto) - new Date(b.validto);
    });

    // Find the first tax that is valid for the transaction date
    return (
      sortedTaxes.find((tax) => {
        if (!tax.validto) return true;
        const validToDate = new Date(tax.validto);
        return transDate <= validToDate;
      }) || sortedTaxes[0]
    ); // Fallback to the first tax if none are valid
  });

  // Check and remove invalid taxes from line items
  let removedTaxes = false;
  lines.value.forEach((line) => {
    if (line.taxAccount) {
      const taxAccNo =
        typeof line.taxAccount === "object"
          ? line.taxAccount.accno
          : line.taxAccount;
      const isValidTax = filteredTaxAccounts.value.some(
        (tax) => tax.accno === taxAccNo
      );

      if (!isValidTax) {
        line.taxAccount = null;
        line.linetaxamount = 0;
        removedTaxes = true;
      }
    }
  });

  if (removedTaxes) {
    Notify.create({
      message: t(
        "Some line taxes have been removed as they are no longer valid for the selected date."
      ),
      type: "warning",
      position: "center",
    });
  }
};

// Add watch on transaction date
watch(
  () => formData.value.transdate,
  () => {
    filterTaxAccounts();
  }
);

const projects = ref([]);
const filteredProjects = ref([]);

const filterProjects = () => {
  if (!formData.value.transdate) return;

  filteredProjects.value = projects.value.filter((project) => {
    const start = project.startdate ? new Date(project.startdate) : null;
    const end = project.enddate ? new Date(project.enddate) : null;
    const invDateObj = new Date(formData.value.transdate);

    if (!start && !end) return true; // Include if both are null
    if (!start) return invDateObj <= end; // Include if only end date exists
    if (!end) return invDateObj >= start; // Include if only start date exists

    return invDateObj >= start && invDateObj <= end; // Include if within range
  });
};

const currencies = ref([]);

const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/gl");
    lineTax.value = response.data.linetax;
    taxAccounts.value = response.data.tax_accounts;
    departments.value = response.data.departments;
    accounts.value = response.data.accounts.all;
    projects.value = response.data.projects;
    revtrans.value = response.data.revtrans;
    closedto.value = response.data.closedto;
    filterProjects();
    currencies.value = response.data.currencies;
    if (currencies.value.length > 0) {
      formData.value.currency = currencies.value[0];
    }
    lockNumber.value = response.data.locknumber ? true : false;
    // Initialize filtered tax accounts
    filterTaxAccounts();
  } catch (error) {
    console.log(error);
  }
};

const loading = ref(false);

/**
 * submitTransaction handles both saving and posting.
 * @param {boolean} clearAfter - When true, clear the form after posting.
 * @param {boolean} isNew - When true, post as a new transaction regardless of existing ID.
 */
const submitTransaction = async (clearAfter = false, isNew = false) => {
  // Validate at least two lines exist
  if (lines.value.length < 2) {
    Notify.create({
      message: t("At least two lines are required to post a transaction."),
      type: "negative",
      position: "center",
    });
    return;
  }

  // Validate that total debit and credit amounts are balanced
  if (totalDebit.value !== totalCredit.value) {
    Notify.create({
      message: t("The total debit and credit amounts must be balanced."),
      type: "negative",
      position: "center",
    });
    return;
  }

  loading.value = true;

  const linesData = lines.value.map((line) => {
    let lineObj = {
      accno:
        line.account && line.account.accno ? line.account.accno : line.account,
      credit: parseFloat(line.credit) || 0,
      debit: parseFloat(line.debit) || 0,
      memo: line.memo || "",
      source: line.source || "",
      cleared: line.cleared || false,
    };

    // Handle project if present
    if (line.project) {
      lineObj.project =
        typeof line.project === "object"
          ? `${line.project.projectnumber}--${line.project.id}`
          : line.project;
    }

    // Handle tax information if present
    if (lineTax.value) {
      lineObj.taxAccount =
        line.taxAccount && typeof line.taxAccount === "object"
          ? line.taxAccount.label
          : line.taxAccount || null;
      lineObj.linetaxamount = parseFloat(line.linetaxamount) || 0;
    }

    return lineObj;
  });

  // Prepare payload for multipart conversion
  const payload = {
    curr:
      typeof formData.value.currency === "object"
        ? formData.value.currency.curr
        : formData.value.currency,
    exchangeRate: formData.value.exchangeRate
      ? parseFloat(formData.value.exchangeRate)
      : undefined,
    description: formData.value.description || "",
    notes: formData.value.notes || "",
    reference: formData.value.reference || "",
    transdate: formData.value.transdate,
    lines: JSON.stringify(linesData),
    department: formData.value.selectedDepartment
      ? typeof formData.value.selectedDepartment === "object"
        ? `${formData.value.selectedDepartment.description}--${formData.value.selectedDepartment.id}`
        : formData.value.selectedDepartment
      : undefined,
    files: formData.value.files,
  };

  const formDataObj = jsonToFormData(payload);

  try {
    let response;
    if (formData.value.id && !isNew) {
      response = await api.put(
        `/gl/transactions/${formData.value.id}`,
        formDataObj,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } else {
      response = await api.post("/gl/transactions", formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    Notify.create({
      message: t("Transaction Posted Successfully."),
      type: "positive",
      position: "center",
    });

    if (clearAfter) {
      const prevDate = formData.value.transdate;
      formData.value = { ...initialFormData, transdate: prevDate };
      if (currencies.value.length > 0) {
        formData.value.currency = currencies.value[0];
      }
      formData.value.selectedDepartment = null;
      lines.value = [{ ...initialLine }, { ...initialLine }];
      existingFiles.value = [];
    } else {
      // For Save, load the transaction data if an ID is returned
      if (response.data?.id) {
        await loadTransaction(response.data.id);
      }
    }
  } catch (error) {
    console.error("Failed to submit transaction:", error);
    Notify.create({
      message:
        error.response?.data?.message || t("Failed to submit transaction."),
      type: "negative",
      position: "center",
    });
  } finally {
    loading.value = false;
  }
};

const existingFiles = ref([]);
const loadTransaction = async (id) => {
  if (id) {
    try {
      const response = await api.get(`/gl/transactions/${id}`);
      const transactionData = response.data;

      formData.value = {
        id: transactionData.id,
        reference: transactionData.reference,
        description: transactionData.description,
        notes: transactionData.notes,
        transdate: transactionData.transdate,
        originaldate: transactionData.transdate,
        exchangeRate: transactionData.exchangeRate,
      };
      if (departments.value?.length) {
        formData.value.selectedDepartment = departments.value.find(
          (dpt) => dpt.id === transactionData.department_id
        );
      }
      formData.value.currency = currencies.value.find(
        (curr) => curr.curr === transactionData.curr
      );

      lines.value = transactionData.lines.map((line) => {
        const foundAccount =
          accounts.value.find((acc) => acc.accno === line.accno) || "";
        return {
          account: foundAccount,
          debit: line.debit.toString(),
          credit: line.credit.toString(),
          source: line.source,
          memo: line.memo,
          taxAccount: line.taxAccount
            ? taxAccounts.value.find((t) => t.chart_id === line.taxAccount) ||
              ""
            : "",
          linetaxamount: line.linetaxamount
            ? line.linetaxamount.toString()
            : "0",
          project:
            projects.value.length > 0 && line.project
              ? projects.value.find((proj) => proj.id === line.project)
              : null,
          showExtra: line.source || line.memo || line.project ? true : false,
        };
      });
      existingFiles.value = transactionData.files;
    } catch (error) {
      console.log("Failed to load transaction:", error);
    }
  }
};

// Handler for file deletion event from the FileList component.
const handleFileDeletion = (index) => {
  existingFiles.value.splice(index, 1);
};

const deleteTransaction = async () => {
  try {
    const confirmed = await confirmDelete({
      title: t("Confirm Deletion"),
      message: t(
        "Are you sure you want to delete this transaction? This action cannot be undone."
      ),
    });

    if (confirmed) {
      await api.delete(`/gl/transactions/${formData.value.id}`);

      Notify.create({
        message: t("Transaction deleted successfully"),
        color: "positive",
        position: "center",
      });

      if (route.query.callback) {
        const query = { ...route.query, search: 1 };
        router.push({ path: route.query.callback, query: query });
      } else {
        resetForm();
      }
    } else {
      Notify.create({
        message: t("Transaction Delete canceled"),
        color: "warning",
        position: "center",
      });
    }
  } catch (error) {
    Notify.create({
      message: t("Unable to delete Transaction") + error,
      color: "negative",
      position: "center",
    });
    console.error(error);
  }
};

const resetForm = () => {
  formData.value = { ...initialFormData };
  if (currencies.value.length > 0) {
    formData.value.currency = currencies.value[0];
  }
  formData.value.selectedDepartment = null;
  formData.value.originaldate = null;
  lines.value = [{ ...initialLine }, { ...initialLine }];
  existingFiles.value = [];
};
const updateTaxAmount = (val, index) => {
  if (!val || !val.accno) {
    console.warn("Invalid value provided:", val);
    return;
  }
  if (!taxAccounts || !taxAccounts.value) {
    console.warn("taxAccounts is not available");
    return;
  }
  const taxAcc = filteredTaxAccounts.value.find(
    (item) => item.accno === val.accno
  );
  if (!taxAcc || !taxAcc.rate) {
    lines.value[index].linetaxamount = 0;
    return;
  }
  let debit = parseFloat(lines.value[index].debit);
  let credit = parseFloat(lines.value[index].credit);
  if (isNaN(debit)) debit = 0;
  if (isNaN(credit)) credit = 0;
  let baseAmount = debit > 0 ? debit : credit;
  lines.value[index].linetaxamount = baseAmount ? baseAmount * taxAcc.rate : 0;
};
onMounted(async () => {
  try {
    await Promise.all([fetchLinks()]);
    loadTransaction(route.query.id);
  } catch (error) {
    console.log("Error in loading initial data:", error);
  }
});
</script>
