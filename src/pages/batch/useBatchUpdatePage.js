import { ref, computed, inject, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { formatAmount, formatDate } from "src/helpers/utils";

/** Account-shaped cells: objects may carry `{ accno, label }`; tables show `accno` only. */
const ACCOUNT_OBJECT_KEYS = new Set([
  "accno",
  "recordaccount",
  "record_accno",
  "item_account",
  "expense_accno",
  "tax_account",
  "account",
]);

export function accountFieldAccno(val) {
  if (val == null) return "";
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    return val.accno != null ? String(val.accno) : "";
  }
  return String(val).trim();
}

/** Display string for account columns / filter chips — always `accno` (or plain string). */
export function formatAccountListValue(val) {
  if (val == null) return "";
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    return accountFieldAccno(val);
  }
  return String(val).trim();
}

/** Parse batch row date to YYYY-MM-DD; tries line/invoice fields used across modules. */
function batchRowTransdateISO(row) {
  const candidates = [
    row?.transdate,
    row?.document_transdate,
    row?.invoicedate,
  ];
  for (const raw of candidates) {
    if (raw == null) continue;
    const s = String(raw).trim();
    if (!s) continue;
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) {
      const dd = m[1].padStart(2, "0");
      const mm = m[2].padStart(2, "0");
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return null;
}

function parseTargetYear(value) {
  const n = parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n < 1000 || n > 9999) return null;
  return n;
}

/** Same month/day as YYYY-MM-DD, new year; clamps day if invalid in target year (e.g. Feb 29). */
function transdateWithYear(isoDate, newYear) {
  const m = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  const y = newYear;
  const lastDay = new Date(Date.UTC(y, month, 0)).getUTCDate();
  const d = Math.min(day, lastDay);
  return `${y}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function transdateFromRowWithNewYear(row, newYear) {
  const iso = batchRowTransdateISO(row);
  if (iso == null) return null;
  return transdateWithYear(iso, newYear);
}

/**
 * Shared batch-update logic for GL / AR / AP pages (separate routes).
 * @param {"gl" | "ar" | "ap"} module
 */
export function useBatchUpdatePage(module) {
  if (module !== "gl" && module !== "ar" && module !== "ap") {
    throw new Error("useBatchUpdatePage: module must be gl, ar, or ap");
  }

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const updateTitle = inject("updateTitle");
const createLink = inject("createLink");

const lineData = ref(false);

function syncLineDataDefault() {
  lineData.value = false;
}

const granularity = computed(() => (lineData.value ? "line" : "transaction"));

const glLineSplitView = computed(
  () => module === "gl" && lineData.value,
);

/** Force q-table virtual scroll to remount after data/search mode changes (same pattern as GlTransactions). */
const batchTableKey = ref(0);

const filtersOpen = ref(true);

const defaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { datefrom: iso(start), dateto: iso(end) };
};

const filters = ref({
  ...defaultDateRange(),
  createdfrom: "",
  createdto: "",
  updatedfrom: "",
  updatedto: "",
  description: "",
  reference: "",
  invnumber: "",
  partnumber: "",
  customer: null,
  vendor: null,
  account: null,
  duedatefrom: "",
  duedateto: "",
  morethanamount: "",
  lessthanamount: "",
  equaltoamount: "",
  morethantaxamount: "",
  lessthantaxamount: "",
  lineItemAccount: null,
  lineItemTaxAccount: null,
  department: null,
  project: null,
  source: "",
  memo: "",
});

const linkPayload = ref({});
const linksLoading = ref(true);
const linksError = ref("");

const searchResults = ref([]);
const searchLoading = ref(false);
const searchError = ref("");

/** Last GET /batch/search envelope (module, granularity, closed-period hints). */
const batchSearchMeta = ref({
  module: null,
  granularity: null,
  transdate_after: null,
  closed_period_applied: false,
});

/** AP: POST /batch/update — always granularity=transaction; line edits use items[].lines[]. */
const apBatchSelectedRows = ref([]);
const apBatchUpdatePatch = ref({
  transdate: "",
  transdateYearOnly: false,
  transdateTargetYear: "",
  duedate: "",
  vendor: null,
  department: null,
  clearDepartment: false,
  project: null,
  clearProject: false,
  recordAccount: null,
});
/** Line mode: POST items omit ap id; each lines[] object includes entry_id (and optional record_accno, etc.). */
const apBatchLineUpdatePatch = ref({
  recordAccount: null,
  expenseAccount: null,
  project: null,
  clearLineProject: false,
  transdate: "",
  transdateYearOnly: false,
  transdateTargetYear: "",
  duedate: "",
  vendor: null,
  department: null,
  clearDepartment: false,
});
const apBatchUpdateLoading = ref(false);
const apBatchUpdateDialogOpen = ref(false);
/** After a successful batch update, refresh runs in @hide so the table does not remount while the dialog/popups tear down. */
const apBatchRefreshAfterDialogClose = ref(false);

/** GL: POST /batch/update */
const glBatchSelectedRows = ref([]);
const glBatchUpdatePatch = ref({
  transdate: "",
  transdateYearOnly: false,
  transdateTargetYear: "",
  department: null,
  clearDepartment: false,
  project: null,
  clearProject: false,
});
const glBatchLineUpdatePatch = ref({
  transdate: "",
  transdateYearOnly: false,
  transdateTargetYear: "",
  department: null,
  clearDepartment: false,
  project: null,
  clearLineProject: false,
  account: null,
});
const glBatchUpdateLoading = ref(false);
const glBatchUpdateDialogOpen = ref(false);
const glBatchRefreshAfterDialogClose = ref(false);

/** POST /batch/delete — transaction granularity only (same permissions as batch update). */
const apBatchDeleteDialogOpen = ref(false);
const apBatchDeleteLoading = ref(false);
const apBatchDeleteRefreshAfterDialogClose = ref(false);

const glBatchDeleteDialogOpen = ref(false);
const glBatchDeleteLoading = ref(false);
const glBatchDeleteRefreshAfterDialogClose = ref(false);

function groupGlBatchByAccount(data) {
  const withAccno = [];
  const withoutAccno = [];
  for (const row of data) {
    if (accountFieldAccno(row.accno) !== "") withAccno.push(row);
    else withoutAccno.push(row);
  }

  const groupOrder = [];
  const groups = {};
  for (const row of withAccno) {
    const acc = accountFieldAccno(row.accno);
    if (!groups[acc]) {
      groups[acc] = [];
      groupOrder.push(acc);
    }
    groups[acc].push(row);
  }

  const finalRows = [];
  for (const acc of groupOrder) {
    const group = groups[acc];
    group.sort((a, b) => {
      const dateCompare = (a.transdate || "").localeCompare(b.transdate || "");
      if (dateCompare !== 0) return dateCompare;
      const idA =
        Number(a.entry_id) || Number(a.line_id) || Number(a.trans_id) || 0;
      const idB =
        Number(b.entry_id) || Number(b.line_id) || Number(b.trans_id) || 0;
      return idA - idB;
    });

    const desc = (group[0].account_description || "").trim();
    const groupLabel = desc ? `${acc} -- ${desc}` : acc;
    finalRows.push({
      isGroupHeader: true,
      accno: acc,
      account_description: group[0].account_description,
      groupLabel,
    });

    for (const row of group) {
      finalRows.push(row);
    }
  }

  return finalRows.concat(withoutAccno);
}

const tableRows = computed(() => {
  if (glLineSplitView.value && searchResults.value.length) {
    return groupGlBatchByAccount(searchResults.value);
  }
  return searchResults.value;
});

/** Rows in the results table (excludes GL line group headers). */
const batchTotalRowCount = computed(() => {
  const rows = tableRows.value;
  if (!rows.length) return 0;
  if (module === "gl" && glLineSplitView.value) {
    return rows.filter((r) => !r.isGroupHeader).length;
  }
  return rows.length;
});

/** AP / GL batch selection count (0 for AR). */
const batchSelectedCount = computed(() => {
  if (module === "ap") return apBatchSelectedRows.value.length;
  if (module === "gl") return glBatchSelectedRows.value.length;
  return 0;
});

const customerOptions = computed(() => linkPayload.value.customers || []);
const vendorOptions = computed(() => linkPayload.value.vendors || []);
const departmentOptions = computed(
  () => linkPayload.value.departments || [],
);
const projectOptions = computed(() => linkPayload.value.projects || []);

const showAccountFilter = computed(() => {
  if (module === "gl") return true;
  if (module === "ap" && lineData.value) return true;
  return false;
});

function mergeAccountsByAccno(lists) {
  const map = new Map();
  for (const list of lists) {
    for (const row of list || []) {
      if (!row || row.accno == null) continue;
      const key = accountFieldAccno(row.accno);
      if (key && !map.has(key)) {
        map.set(key, row);
      }
    }
  }
  return [...map.values()].sort((a, b) =>
    accountFieldAccno(a.accno).localeCompare(accountFieldAccno(b.accno)),
  );
}

const accountFilterOptions = computed(() => {
  const p = linkPayload.value;
  if (module === "gl") {
    return p.gl_accounts || [];
  }
  if (module === "ap") {
    return mergeAccountsByAccno([p.expense_accounts, p.ap_record_accounts]);
  }
  return [];
});

/** GET /batch/create_links?module=ap includes expense_accounts, departments, projects (when backend supplies them). */
const expenseAccountOptions = computed(() => {
  if (module !== "ap") return [];
  return linkPayload.value.expense_accounts || [];
});

/** AP record (payable) accounts for batch line update `record_accno`. */
const apRecordAccountOptions = computed(() => {
  if (module !== "ap") return [];
  return linkPayload.value.ap_record_accounts || [];
});

const taxAccountOptions = computed(() => {
  if (module !== "ap") return [];
  const p = linkPayload.value;
  return p.expense_tax_accounts || p.tax_accounts || [];
});

const glAccountOptions = computed(() => {
  if (module !== "gl") return [];
  return linkPayload.value.gl_accounts || [];
});

const COLUMN_LABELS = {
  reference: "Reference",
  transdate: "Date",
  document_transdate: "Document date",
  description: "Description",
  document_description: "Document description",
  amount: "Amount",
  debit: "Debit",
  credit: "Credit",
  memo: "Memo",
  source: "Source",
  accno: "Account",
  account_description: "Account name",
  curr: "Currency",
  approved: "Approved",
  department: "Department",
  invnumber: "Invoice #",
  duedate: "Due date",
  customer_name: "Customer",
  vendor_name: "Vendor",
  vendor: "Vendor",
  paid: "Paid",
  invoice: "Invoice",
  line_description: "Line description",
  qty: "Qty",
  sellprice: "Sell price",
  fxsellprice: "FX sell price",
  discount: "Discount",
  partnumber: "Part number",
  invoicedate: "Invoice date",
  ap_line_dates: "Dates",
  recordaccount: "Record account",
  record_accno: "Record account",
  item_description: "Item description",
  item_account: "Expense account",
  expense_accno: "Expense account",
  tax_account: "Tax account",
  tax_amount: "Tax amount",
  project: "Project",
  projectnumber: "Project #",
  project_description: "Project description",
};

const HIDDEN_COLUMN_KEYS = new Set([
  "id",
  "ap_id",
  "trans_id",
  "entry_id",
  "line_id",
  "parts_id",
  "customer_id",
  "vendor_id",
  "department_id",
]);

function isHiddenColumnKey(key) {
  if (HIDDEN_COLUMN_KEYS.has(key)) return true;
  if (key.endsWith("_id")) return true;
  return false;
}

/** Preferred column order — matches GET /batch/search rows[] by module + granularity. */
const GL_TRANSACTION_COLUMN_ORDER = [
  "reference",
  "transdate",
  "description",
  "amount",
  "department",
  "curr",
];

const GL_LINE_COLUMN_ORDER = [
  "reference",
  "transdate",
  "document_description",
  "department",
  "memo",
  "source",
  "project",
  "curr",
];

const AR_TRANSACTION_COLUMN_ORDER = [
  "invnumber",
  "transdate",
  "duedate",
  "customer_name",
  "amount",
  "paid",
  "description",
  "invoice",
  "curr",
];

const AR_LINE_COLUMN_ORDER = [
  "line_description",
  "partnumber",
  "qty",
  "sellprice",
  "fxsellprice",
  "discount",
  "invnumber",
  "customer_name",
  "document_description",
  "curr",
];

const AP_TRANSACTION_COLUMN_ORDER = [
  "invnumber",
  "transdate",
  "duedate",
  "vendor_name",
  "department",
  "amount",
  "paid",
  "description",
  "curr",
];

/** AP line: vendor invoice lines (GET /batch/search module=ap&granularity=line); rows use entry_id. */
const AP_LINE_COLUMN_ORDER = [
  "invnumber",
  "vendor_name",
  "invoicedate",
  "duedate",
  "department",
  "item_description",
  "expense_accno",
  "record_accno",
  "amount",
  "project",
  "tax_account",
  "tax_amount",
];

function orderedVisibleKeys(sample, module, granularity) {
  const keys = Object.keys(sample).filter((k) => !isHiddenColumnKey(k));
  const keySet = new Set(keys);
  const ordered = [];
  if (keySet.has("reference")) ordered.push("reference");
  if (keySet.has("invnumber")) ordered.push("invnumber");

  let preferred = null;
  if (module === "gl" && granularity === "transaction") {
    preferred = GL_TRANSACTION_COLUMN_ORDER;
  } else if (module === "gl" && granularity === "line") {
    preferred = GL_LINE_COLUMN_ORDER;
  } else if (module === "ar" && granularity === "transaction") {
    preferred = AR_TRANSACTION_COLUMN_ORDER;
  } else if (module === "ap" && granularity === "transaction") {
    preferred = AP_TRANSACTION_COLUMN_ORDER;
  } else if (module === "ar" && granularity === "line") {
    preferred = AR_LINE_COLUMN_ORDER;
  } else if (module === "ap" && granularity === "line") {
    preferred = AP_LINE_COLUMN_ORDER;
  }

  if (preferred) {
    for (const k of preferred) {
      if (k === "project") {
        const hasProject =
          keySet.has("project") ||
          (module === "ap" && granularity === "line" && keySet.has("project_id")) ||
          (module === "gl" &&
            granularity === "line" &&
            (keySet.has("project_id") ||
              keySet.has("projectnumber") ||
              keySet.has("project_description")));
        if (hasProject && !ordered.includes("project")) {
          ordered.push("project");
        }
        continue;
      }
      if (keySet.has(k) && !ordered.includes(k)) ordered.push(k);
    }
  }

  for (const k of keys) {
    if (ordered.includes(k)) continue;
    if (module === "ap" && k === "invoice") continue;
    if (
      module === "ap" &&
      granularity === "line" &&
      k === "executiondate"
    ) {
      continue;
    }
    if (k === "document_transdate") continue;
    if (k === "approved") continue;
    if (
      module === "gl" &&
      granularity === "transaction" &&
      (k === "document_description" || k === "memo" || k === "source")
    ) {
      continue;
    }
    if (
      module === "gl" &&
      granularity === "line" &&
      (k === "accno" || k === "account_description")
    ) {
      continue;
    }
    if (
      module === "gl" &&
      granularity === "line" &&
      (k === "projectnumber" || k === "project_description") &&
      ordered.includes("project")
    ) {
      continue;
    }
    ordered.push(k);
  }
  return ordered;
}

const DATE_COLUMN_NAMES = new Set([
  "transdate",
  "document_transdate",
  "duedate",
  "invoicedate",
]);

const AMOUNT_COLUMN_NAMES = new Set([
  "amount",
  "debit",
  "credit",
  "sellprice",
  "fxsellprice",
  "discount",
  "paid",
  "tax_amount",
]);

const WRAP_TEXT_COLUMN_NAMES = new Set([
  "description",
  "document_description",
  "line_description",
  "memo",
  "item_description",
]);

function isDateColumn(name) {
  if (DATE_COLUMN_NAMES.has(name)) return true;
  if (typeof name === "string" && name.endsWith("_date")) return true;
  return false;
}

function isAmountColumn(name) {
  return AMOUNT_COLUMN_NAMES.has(name);
}

function isWrapTextColumn(name) {
  return WRAP_TEXT_COLUMN_NAMES.has(name);
}

function wrapTextColumnClass(name) {
  return isWrapTextColumn(name) ? "description-cell" : "";
}

/**
 * AP/other batch tables: consistent dd.mm.yyyy from ISO (with optional time) or already-localized dates.
 */
function formatBatchTableDate(val) {
  if (val == null || val === "") return "";
  const s = String(val).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return formatDate(`${iso[1]}-${iso[2]}-${iso[3]}`);
  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    return `${dd}.${mm}.${dmy[3]}`;
  }
  return formatDate(s);
}

/** AP line combined dates cell: highlight overdue due date (same idea as ArapOverview). */
function isApDueOverdue(row) {
  const d = row?.duedate;
  if (d == null || d === "") return false;
  const s = String(d).trim();
  const today = new Date().toISOString().slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}` < today;
  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (dmy) {
    const iso = `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    return iso < today;
  }
  return s < today;
}

function getBatchCellClass(col) {
  const numericNames = ["amount", "debit", "credit", "line_amount", "tax_amount"];
  if (col.align === "right" || numericNames.includes(col.name)) {
    return "text-right";
  }
  return "text-left";
}

function columnAlign(name) {
  if (
    name === "amount" ||
    name === "debit" ||
    name === "credit" ||
    name === "line_amount" ||
    name === "tax_amount"
  ) {
    return "right";
  }
  return "left";
}

/** GL line: non‑negative debit XOR credit from API — one posting per line. */
function glLinePostingKind(row) {
  if (Number(row.debit) > 0) return "debit";
  if (Number(row.credit) > 0) return "credit";
  return null;
}

function glLinePostingLabel(row) {
  const k = glLinePostingKind(row);
  if (k === "debit") return t("Debit");
  if (k === "credit") return t("Credit");
  return "";
}

function glLineAmountValue(row) {
  const d = Number(row.debit);
  const c = Number(row.credit);
  if (d > 0) return d;
  if (c > 0) return c;
  return 0;
}

function projectIdFromRow(row) {
  const p = row.project;
  if (p != null && typeof p === "object" && !Array.isArray(p)) {
    if (p.id != null && p.id !== "") return p.id;
    return null;
  }
  if (p != null && p !== "") return p;
  const pid = row.project_id;
  if (pid != null && pid !== "") return pid;
  return null;
}

/** Scalar project id → label via create_links projects; object project uses label/description. */
function projectDisplayLabelFromRow(row) {
  const idRaw = projectIdFromRow(row);
  const p = row.project;
  if (p != null && typeof p === "object" && !Array.isArray(p)) {
    const lbl = p.label ?? p.description;
    if (lbl != null && String(lbl).trim() !== "") return String(lbl);
  }
  if (
    row.project_description != null &&
    String(row.project_description).trim() !== ""
  ) {
    return String(row.project_description).trim();
  }
  if (row.projectnumber != null && String(row.projectnumber).trim() !== "") {
    return String(row.projectnumber).trim();
  }
  if (idRaw == null || idRaw === "") return "";
  const list = projectOptions.value;
  const found = list.find((x) => String(x.id) === String(idRaw));
  if (found) {
    const d = found.description ?? found.label;
    if (d != null && String(d).trim() !== "") return String(d);
  }
  return String(idRaw);
}

function departmentNumericIdIsZero(row) {
  const did = row.department_id;
  if (did != null && did !== "" && Number(did) + 0 === 0) return true;
  const d = row.department;
  if (
    d != null &&
    typeof d === "object" &&
    !Array.isArray(d) &&
    d.id != null &&
    d.id !== ""
  ) {
    if (Number(d.id) + 0 === 0) return true;
  }
  return false;
}

function departmentIdFromRow(row) {
  const d = row.department;
  let raw = null;
  if (d != null && typeof d === "object" && !Array.isArray(d)) {
    if (d.id != null && d.id !== "") raw = d.id;
  }
  if (raw == null) {
    const did = row.department_id;
    if (did != null && did !== "") raw = did;
  }
  if (raw == null || raw === "") return null;
  const n = Number(raw) + 0;
  if (!Number.isNaN(n) && n === 0) return null;
  return raw;
}

/** AP row may include `department` description string, object, or only `department_id`. */
function departmentDisplayLabelFromRow(row) {
  if (departmentNumericIdIsZero(row)) return "";
  const d = row.department;
  if (typeof d === "string") {
    const s = d.trim();
    if (s !== "") return d;
  }
  if (d != null && typeof d === "object" && !Array.isArray(d)) {
    const lbl = d.label ?? d.description;
    if (lbl != null && String(lbl).trim() !== "") return String(lbl);
  }
  const idRaw = departmentIdFromRow(row);
  if (idRaw == null || idRaw === "") return "";
  const list = departmentOptions.value;
  const found = list.find((x) => String(x.id) === String(idRaw));
  if (found?.description != null && String(found.description).trim() !== "") {
    return String(found.description);
  }
  return String(idRaw);
}

function cellRawValue(col, row) {
  if (typeof col.field === "function") {
    return col.field(row);
  }
  const v = row[col.field];
  if (col.name === "department") {
    return departmentDisplayLabelFromRow(row);
  }
  if (col.name === "project") {
    return projectDisplayLabelFromRow(row);
  }
  if (ACCOUNT_OBJECT_KEYS.has(col.name)) {
    return formatAccountListValue(v);
  }
  return v;
}

/**
 * Transaction id for opening the editor.
 * GL line: trans_id (document). AP line: id (document; trans_id may be absent after totals).
 * AR line: trans_id then id.
 */
function getEditorTransactionId(row) {
  if (lineData.value) {
    if (module === "gl" && row.trans_id != null && row.trans_id !== "") {
      return row.trans_id;
    }
    if (module === "ap") {
      if (row.id != null && row.id !== "") return row.id;
      if (row.ap_id != null && row.ap_id !== "") return row.ap_id;
    }
    if (row.trans_id != null && row.trans_id !== "") return row.trans_id;
  }
  if (row.id != null && row.id !== "") return row.id;
  if (row.trans_id != null && row.trans_id !== "") return row.trans_id;
  return null;
}

/** Ledger line id from GET /batch/search (GL/AP line rows): entry_id. */
function ledgerLineEntryIdFromRow(row) {
  if (row?.entry_id == null || row.entry_id === "") return null;
  const n = parseInt(String(row.entry_id), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Router target for reference / invoice # — mirrors GlTransactions getPath (createLink + query.id + callback).
 */
function getDocumentPath(row) {
  const id = getEditorTransactionId(row);
  if (id == null || id === "") return null;

  const m = module;
  let path = "";
  if (m === "gl") {
    path = createLink("gl.transaction");
  } else if (m === "ar") {
    path = row.till
      ? createLink("customer.pos")
      : row.invoice
        ? createLink("customer.invoice")
        : createLink("customer.transaction");
  } else if (m === "ap") {
    path = row.invoice
      ? createLink("vendor.invoice")
      : createLink("vendor.transaction");
  } else {
    return null;
  }

  const defaultCallback =
    createLink("base") +
    `/batch-update/${module}`;

  return {
    path,
    query: {
      id,
      callback: route.query.callback || route.fullPath || defaultCallback,
    },
  };
}

function getDocumentUrl(row) {
  const loc = getDocumentPath(row);
  if (!loc) return null;
  return router.resolve(loc).href;
}

/**
 * Unique key for AP line rows (q-table row-key + batch selection).
 * If two lines share the same key, checking one row checks every row with that key.
 */
function apLineRowSelectionKey(row) {
  const e = ledgerLineEntryIdFromRow(row);
  if (e != null) return `entry:${e}`;
  if (row?.line_id != null && row.line_id !== "") {
    return `line:${String(row.line_id)}`;
  }
  if (row?.parts_id != null && row.parts_id !== "") {
    const tid = row.trans_id != null ? String(row.trans_id) : "";
    return `parts:${String(row.parts_id)}:${tid}`;
  }
  const pr = projectIdFromRow(row);
  const dept = departmentIdFromRow(row);
  const parts = [
    row.trans_id,
    row.invnumber,
    accountFieldAccno(row.expense_accno ?? row.item_account),
    accountFieldAccno(row.record_accno ?? row.recordaccount),
    dept != null && dept !== "" ? String(dept) : "",
    pr != null && pr !== "" ? String(pr) : "",
    row.invoicedate,
    row.executiondate,
    row.amount,
    row.item_description,
    row.tax_amount,
    accountFieldAccno(row.tax_account),
  ]
    .map((x) => (x != null ? String(x) : ""))
    .join("|");
  return `fb:${parts}`;
}

function tableRowKey(row) {
  if (row.isGroupHeader) {
    return `gh:${row.accno}`;
  }
  if (module === "ap" && lineData.value) {
    return `apln:${apLineRowSelectionKey(row)}`;
  }
  if (module === "gl" && lineData.value) {
    const e = ledgerLineEntryIdFromRow(row);
    if (e != null) return `glln:entry:${e}`;
  }
  if (row.line_id != null && row.line_id !== "") {
    return `line:${row.line_id}`;
  }
  if (row.id != null && row.id !== "") {
    return `id:${row.id}`;
  }
  if (row.trans_id != null && row.trans_id !== "") {
    return `trans:${row.trans_id}`;
  }
  return `row:${JSON.stringify(row)}`;
}

function isApBatchRowSelected(row) {
  const k = tableRowKey(row);
  return apBatchSelectedRows.value.some((r) => tableRowKey(r) === k);
}

function toggleApBatchRowSelected(row, add) {
  const k = tableRowKey(row);
  if (add) {
    if (!apBatchSelectedRows.value.some((r) => tableRowKey(r) === k)) {
      apBatchSelectedRows.value = [...apBatchSelectedRows.value, row];
    }
  } else {
    apBatchSelectedRows.value = apBatchSelectedRows.value.filter(
      (r) => tableRowKey(r) !== k,
    );
  }
}

function toggleApBatchSelectAll(val) {
  if (module !== "ap") return;
  apBatchSelectedRows.value = val ? tableRows.value.slice() : [];
}

const apBatchSelectAll = computed(() => {
  if (module !== "ap") return false;
  const rows = tableRows.value;
  if (!rows.length) return false;
  return rows.every((r) => isApBatchRowSelected(r));
});

function resetApBatchUpdatePatchForm() {
  apBatchUpdatePatch.value = {
    transdate: "",
    transdateYearOnly: false,
    transdateTargetYear: "",
    duedate: "",
    vendor: null,
    department: null,
    clearDepartment: false,
    project: null,
    clearProject: false,
    recordAccount: null,
  };
  apBatchLineUpdatePatch.value = {
    recordAccount: null,
    expenseAccount: null,
    project: null,
    clearLineProject: false,
    transdate: "",
    transdateYearOnly: false,
    transdateTargetYear: "",
    duedate: "",
    vendor: null,
    department: null,
    clearDepartment: false,
  };
}

function setApBatchClearDepartment(clear) {
  apBatchUpdatePatch.value.clearDepartment = clear;
  if (clear) apBatchUpdatePatch.value.department = null;
}

function setApBatchClearProject(clear) {
  apBatchUpdatePatch.value.clearProject = clear;
  if (clear) apBatchUpdatePatch.value.project = null;
}

function setApBatchClearLineProject(clear) {
  apBatchLineUpdatePatch.value.clearLineProject = clear;
  if (clear) apBatchLineUpdatePatch.value.project = null;
}

function setApBatchLineClearDepartment(clear) {
  apBatchLineUpdatePatch.value.clearDepartment = clear;
  if (clear) apBatchLineUpdatePatch.value.department = null;
}

/**
 * Key to match AP line rows to transaction rows so rows get ap.id for links / editor (line search may omit id).
 */
function apInvoiceVendorMergeKey(row) {
  const inv = String(row?.invnumber ?? "").trim();
  const vid = vendorIdFromRow(row);
  if (inv === "" && (vid == null || vid === "")) return null;
  return `${inv}\0${vid != null && vid !== "" ? String(vid) : ""}`;
}

function buildApTransactionSearchParamsForLineMerge() {
  const params = {
    module: "ap",
    granularity: "transaction",
  };
  if (filters.value.datefrom) params.datefrom = filters.value.datefrom;
  if (filters.value.dateto) params.dateto = filters.value.dateto;
  if (filters.value.createdfrom) params.createdfrom = filters.value.createdfrom;
  if (filters.value.createdto) params.createdto = filters.value.createdto;
  if (filters.value.updatedfrom) params.updatedfrom = filters.value.updatedfrom;
  if (filters.value.updatedto) params.updatedto = filters.value.updatedto;
  if (filters.value.description?.trim()) {
    params.description = filters.value.description.trim();
  }
  if (filters.value.invnumber?.trim()) {
    params.invnumber = filters.value.invnumber.trim();
  }
  if (filters.value.vendor?.id != null) {
    params.vendor_id = filters.value.vendor.id;
  }
  appendApNumericIdParam(
    params,
    "department_id",
    filters.value.department?.id,
  );
  if (filters.value.duedatefrom) params.duedatefrom = filters.value.duedatefrom;
  if (filters.value.duedateto) params.duedateto = filters.value.duedateto;
  return params;
}

/**
 * Build POST /batch/update items for AP line mode (granularity transaction).
 * No top-level ap id: backend resolves the document from entry_id. One item per distinct entry_id.
 * @returns {{ items?: object[], error?: string }}
 */
function buildApLineBatchUpdateItems(selectedRows) {
  const lp = apBatchLineUpdatePatch.value;
  const recordAccno =
    lp.recordAccount != null
      ? accountFieldAccno(lp.recordAccount.accno)
      : "";
  const expenseAccno =
    lp.expenseAccount != null
      ? accountFieldAccno(lp.expenseAccount.accno)
      : "";
  const hasRecord = recordAccno !== "";
  const hasExpense = expenseAccno !== "";
  const hasProjectSet = lp.project != null && lp.project.id != null;
  const hasProjectOp = lp.clearLineProject || hasProjectSet;
  const yearLine = lp.transdateYearOnly
    ? parseTargetYear(lp.transdateTargetYear)
    : null;
  if (lp.transdateYearOnly && yearLine == null) {
    return { error: t("Enter a valid year (1000-9999).") };
  }
  const useTransdateYearOnly = Boolean(lp.transdateYearOnly && yearLine != null);
  const hasTransdateExplicit =
    !useTransdateYearOnly &&
    lp.transdate != null &&
    String(lp.transdate).trim() !== "";
  const hasTransdate = hasTransdateExplicit || useTransdateYearOnly;
  const hasDuedate = lp.duedate != null && String(lp.duedate).trim() !== "";
  const hasVendor = lp.vendor != null && lp.vendor.id != null;
  const hasDepartment = lp.clearDepartment || (lp.department != null && lp.department.id != null);

  if (!hasRecord && !hasExpense && !hasProjectOp && !hasTransdate && !hasDuedate && !hasVendor && !hasDepartment) {
    return {
      error: t(
        "Choose at least one field to update.",
      ),
    };
  }

  const seenEntry = new Set();
  const items = [];
  for (const row of selectedRows) {
    const entryId = ledgerLineEntryIdFromRow(row);
    if (entryId == null) {
      return {
        error: t(
          "Each selected line needs entry_id. Refresh search if this field is missing.",
        ),
      };
    }
    if (seenEntry.has(entryId)) continue;
    seenEntry.add(entryId);

    const item = { entry_id: entryId };
    if (hasRecord) item.record_accno = recordAccno;
    if (hasExpense) item.expense_accno = expenseAccno;
    if (hasProjectOp) {
      if (lp.clearLineProject) {
        item.project_id = null;
      } else if (hasProjectSet) {
        const pr = Number(lp.project.id) + 0;
        if (Number.isFinite(pr) && pr > 0) item.project_id = pr;
      }
    }
    if (hasTransdateExplicit) {
      item.transdate = String(lp.transdate).trim();
    } else if (useTransdateYearOnly) {
      const td = transdateFromRowWithNewYear(row, yearLine);
      if (td == null) {
        return {
          error: t(
            "One or more selected rows are missing a usable transaction date.",
          ),
        };
      }
      item.transdate = td;
    }
    if (hasDuedate) item.duedate = String(lp.duedate).trim();
    if (hasVendor) {
      const v = Number(lp.vendor.id) + 0;
      if (Number.isFinite(v) && v > 0) item.vendor_id = v;
    }
    if (lp.clearDepartment) {
      item.department_id = null;
    } else if (lp.department != null && lp.department.id != null) {
      const d = Number(lp.department.id) + 0;
      if (Number.isFinite(d) && d > 0) item.department_id = d;
    }
    items.push(item);
  }

  if (items.length === 0) {
    return {
      error: t("No update payload could be built from the selection."),
    };
  }

  return { items };
}

function buildApTransactionUpdatePatch() {
  const p = apBatchUpdatePatch.value;
  const patch = {};
  const useTransdateYearOnly =
    p.transdateYearOnly &&
    parseTargetYear(p.transdateTargetYear) != null;
  if (
    !useTransdateYearOnly &&
    p.transdate != null &&
    String(p.transdate).trim() !== ""
  ) {
    patch.transdate = String(p.transdate).trim();
  }
  if (p.duedate != null && String(p.duedate).trim() !== "") {
    patch.duedate = String(p.duedate).trim();
  }
  if (p.vendor != null && p.vendor.id != null) {
    const v = Number(p.vendor.id) + 0;
    if (Number.isFinite(v) && v > 0) patch.vendor_id = v;
  }
  if (p.clearDepartment) {
    patch.department_id = null;
  } else if (p.department != null && p.department.id != null) {
    const d = Number(p.department.id) + 0;
    if (Number.isFinite(d) && d > 0) patch.department_id = d;
  }
  if (p.clearProject) {
    patch.project_id = null;
  } else if (p.project != null && p.project.id != null) {
    const pr = Number(p.project.id) + 0;
    if (Number.isFinite(pr) && pr > 0) patch.project_id = pr;
  }
  const recordAccno =
    p.recordAccount != null
      ? accountFieldAccno(p.recordAccount.accno ?? p.recordAccount)
      : "";
  if (recordAccno !== "") {
    patch.lines = [{ record_accno: recordAccno }];
  }
  return patch;
}

function apTransactionIdFromRow(row) {
  const raw =
    row?.id != null && row.id !== ""
      ? row.id
      : row?.ap_id != null && row.ap_id !== ""
        ? row.ap_id
        : null;
  if (raw == null) return null;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseApBatchUpdateResults(data, opts = {}) {
  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    return null;
  }
  const failures = [];
  let okCount = 0;
  const fallbackMsg =
    String(opts.fallbackError || "").trim() ||
    String(data.error || "").trim() ||
    t("Update failed");
  for (const r of data.results) {
    const ok = r?.ok;
    const errStr = r?.error != null ? String(r.error).trim() : "";
    const explicitFail =
      ok === false || Number(ok) === 0 || String(ok) === "0";
    if (explicitFail || errStr) {
      failures.push({
        id: r?.id,
        error: errStr || fallbackMsg,
      });
    } else {
      okCount++;
    }
  }
  return { failures, okCount };
}

function applyApBatchUpdateOutcome(data, items, opts = {}) {
  const parsed = parseApBatchUpdateResults(data);
  const closeAndRefresh = () => {
    apBatchSelectedRows.value = [];
    resetApBatchUpdatePatchForm();
    apBatchRefreshAfterDialogClose.value = true;
    apBatchUpdateDialogOpen.value = false;
  };

  const lineItemsNoApId = Boolean(opts.lineItemsNoApId);
  const okMsg = (count) =>
    lineItemsNoApId
      ? t("Update applied to {count} line(s).", { count })
      : t("Update applied to {count} transaction(s).", { count });

  if (parsed == null) {
    Notify.create({
      type: "positive",
      message: okMsg(items.length),
      position: "center",
    });
    closeAndRefresh();
    return;
  }

  const { failures, okCount } = parsed;
  const failDetail = failures
    .map((f) => `id ${f.id}: ${f.error}`)
    .join("\n");

  if (failures.length === 0) {
    Notify.create({
      type: "positive",
      message: okMsg(okCount || items.length),
      position: "center",
    });
    closeAndRefresh();
    return;
  }

  if (okCount > 0) {
    Notify.create({
      type: "warning",
      message: lineItemsNoApId
        ? t("{ok} line(s) updated; {fail} could not be updated.", {
            ok: okCount,
            fail: failures.length,
          })
        : t("{ok} transaction(s) updated; {fail} could not be updated.", {
            ok: okCount,
            fail: failures.length,
          }),
      caption: failDetail,
      multiLine: true,
      timeout: 12000,
      position: "center",
    });
    closeAndRefresh();
    return;
  }

  Notify.create({
    type: "negative",
    multiLine: true,
    message:
      failures.length === 1
        ? failures[0].error
        : `${t(
            lineItemsNoApId
              ? "batch_ap_n_lines_could_not_update"
              : "batch_ap_n_transactions_could_not_update",
            { n: failures.length },
          )}\n\n${failDetail}`,
    position: "center",
    timeout: 0,
  });
}

async function submitApBatchUpdate() {
  if (module !== "ap") return;
  const selected = apBatchSelectedRows.value;
  if (!selected.length) {
    Notify.create({
      type: "negative",
      message: t(
        lineData.value
          ? "Select one or more lines."
          : "Select one or more transactions.",
      ),
      position: "center",
    });
    return;
  }

  if (lineData.value) {
    const built = buildApLineBatchUpdateItems(selected);
    if (built.error) {
      Notify.create({
        type: "negative",
        message: built.error,
        position: "center",
      });
      return;
    }
    const items = built.items;
    apBatchUpdateLoading.value = true;
    try {
      const { data } = await api.post("/batch/update", {
        module: "ap",
        granularity: "line",
        items,
      });
      applyApBatchUpdateOutcome(data, items, { lineItemsNoApId: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        applyApBatchUpdateOutcome(data, items, { lineItemsNoApId: true });
      } else {
        Notify.create({
          type: "negative",
          message:
            data?.error ||
            data?.message ||
            err.message ||
            t("Update failed"),
          position: "center",
        });
      }
    } finally {
      apBatchUpdateLoading.value = false;
    }
    return;
  }

  const pTx = apBatchUpdatePatch.value;
  const yearTx = pTx.transdateYearOnly
    ? parseTargetYear(pTx.transdateTargetYear)
    : null;
  if (pTx.transdateYearOnly && yearTx == null) {
    Notify.create({
      type: "negative",
      message: t("Enter a valid year (1000-9999)."),
      position: "center",
    });
    return;
  }
  const hasTransdateYearOnlyTx = Boolean(
    pTx.transdateYearOnly && yearTx != null,
  );
  const patch = buildApTransactionUpdatePatch();
  if (Object.keys(patch).length === 0 && !hasTransdateYearOnlyTx) {
    Notify.create({
      type: "negative",
      message: t(
        "Choose at least one field to apply (transaction date, transaction year, due date, vendor, department, project, or record account).",
      ),
      position: "center",
    });
    return;
  }
  const items = [];
  for (const row of selected) {
    const id = apTransactionIdFromRow(row);
    if (id == null) continue;
    const item = { id, ...patch };
    if (hasTransdateYearOnlyTx) {
      const td = transdateFromRowWithNewYear(row, yearTx);
      if (td == null) {
        Notify.create({
          type: "negative",
          message: t(
            "One or more selected rows are missing a usable transaction date.",
          ),
          position: "center",
        });
        return;
      }
      item.transdate = td;
    }
    items.push(item);
  }
  if (!items.length) {
    Notify.create({
      type: "negative",
      message: t("Selected rows are missing a valid transaction id."),
      position: "center",
    });
    return;
  }
  apBatchUpdateLoading.value = true;
  try {
    const { data } = await api.post("/batch/update", {
      module: "ap",
      granularity: "transaction",
      items,
    });
    applyApBatchUpdateOutcome(data, items);
  } catch (err) {
    const data = err.response?.data;
    if (data && Array.isArray(data.results) && data.results.length > 0) {
      applyApBatchUpdateOutcome(data, items);
    } else {
      Notify.create({
        type: "negative",
        message:
          data?.error ||
          data?.message ||
          err.message ||
          t("Update failed"),
        position: "center",
      });
    }
  } finally {
    apBatchUpdateLoading.value = false;
  }
}

function openApBatchUpdateDialog() {
  apBatchUpdateDialogOpen.value = true;
}

function onApBatchUpdateDialogHide() {
  if (!apBatchRefreshAfterDialogClose.value) return;
  apBatchRefreshAfterDialogClose.value = false;
  void runSearch();
}

// ─── GL batch update ────────────────────────────────────────────────────────

function glTransactionIdFromRow(row) {
  const raw =
    row?.id != null && row.id !== ""
      ? row.id
      : row?.gl_id != null && row.gl_id !== ""
        ? row.gl_id
        : row?.trans_id != null && row.trans_id !== ""
          ? row.trans_id
          : null;
  if (raw == null) return null;
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function isGlBatchRowSelected(row) {
  const k = tableRowKey(row);
  return glBatchSelectedRows.value.some((r) => tableRowKey(r) === k);
}

function toggleGlBatchRowSelected(row, add) {
  const k = tableRowKey(row);
  if (add) {
    if (!glBatchSelectedRows.value.some((r) => tableRowKey(r) === k)) {
      glBatchSelectedRows.value = [...glBatchSelectedRows.value, row];
    }
  } else {
    glBatchSelectedRows.value = glBatchSelectedRows.value.filter(
      (r) => tableRowKey(r) !== k,
    );
  }
}

function toggleGlBatchSelectAll(val) {
  if (module !== "gl") return;
  glBatchSelectedRows.value = val
    ? tableRows.value.filter((r) => !r.isGroupHeader)
    : [];
}

const glBatchSelectAll = computed(() => {
  if (module !== "gl") return false;
  const rows = tableRows.value.filter((r) => !r.isGroupHeader);
  if (!rows.length) return false;
  return rows.every((r) => isGlBatchRowSelected(r));
});

function resetGlBatchUpdatePatchForm() {
  glBatchUpdatePatch.value = {
    transdate: "",
    transdateYearOnly: false,
    transdateTargetYear: "",
    department: null,
    clearDepartment: false,
    project: null,
    clearProject: false,
  };
  glBatchLineUpdatePatch.value = {
    transdate: "",
    transdateYearOnly: false,
    transdateTargetYear: "",
    department: null,
    clearDepartment: false,
    project: null,
    clearLineProject: false,
    account: null,
  };
}

function setGlBatchClearDepartment(clear) {
  glBatchUpdatePatch.value.clearDepartment = clear;
  if (clear) glBatchUpdatePatch.value.department = null;
}

function setGlBatchClearProject(clear) {
  glBatchUpdatePatch.value.clearProject = clear;
  if (clear) glBatchUpdatePatch.value.project = null;
}

function setGlBatchLineClearDepartment(clear) {
  glBatchLineUpdatePatch.value.clearDepartment = clear;
  if (clear) glBatchLineUpdatePatch.value.department = null;
}

function setGlBatchLineClearProject(clear) {
  glBatchLineUpdatePatch.value.clearLineProject = clear;
  if (clear) glBatchLineUpdatePatch.value.project = null;
}

function buildGlTransactionBatchUpdateItems(selectedRows) {
  const p = glBatchUpdatePatch.value;
  const patch = {};
  const year = p.transdateYearOnly ? parseTargetYear(p.transdateTargetYear) : null;
  if (p.transdateYearOnly && year == null) {
    return { error: t("Enter a valid year (1000-9999).") };
  }
  const useTransdateYearOnly = Boolean(p.transdateYearOnly && year != null);
  if (
    !useTransdateYearOnly &&
    p.transdate != null &&
    String(p.transdate).trim() !== ""
  ) {
    patch.transdate = String(p.transdate).trim();
  }
  if (p.clearDepartment) {
    patch.department_id = null;
  } else if (p.department != null && p.department.id != null) {
    const d = Number(p.department.id) + 0;
    if (Number.isFinite(d) && d > 0) patch.department_id = d;
  }
  if (p.clearProject) {
    patch.project_id = null;
  } else if (p.project != null && p.project.id != null) {
    const pr = Number(p.project.id) + 0;
    if (Number.isFinite(pr) && pr > 0) patch.project_id = pr;
  }
  if (Object.keys(patch).length === 0 && !useTransdateYearOnly) {
    return { error: t("No updatable fields provided.") };
  }
  const items = [];
  for (const row of selectedRows) {
    const id = glTransactionIdFromRow(row);
    if (id == null) continue;
    const item = { id, ...patch };
    if (useTransdateYearOnly) {
      const td = transdateFromRowWithNewYear(row, year);
      if (td == null) {
        return {
          error: t(
            "One or more selected rows are missing a usable transaction date.",
          ),
        };
      }
      item.transdate = td;
    }
    items.push(item);
  }
  if (!items.length) {
    return { error: t("Selected rows are missing a valid transaction id.") };
  }
  return { items };
}

function buildGlLineBatchUpdateItems(selectedRows) {
  const lp = glBatchLineUpdatePatch.value;
  const year = lp.transdateYearOnly
    ? parseTargetYear(lp.transdateTargetYear)
    : null;
  if (lp.transdateYearOnly && year == null) {
    return { error: t("Enter a valid year (1000-9999).") };
  }
  const useTransdateYearOnly = Boolean(lp.transdateYearOnly && year != null);
  const hasTransdateExplicit =
    !useTransdateYearOnly &&
    lp.transdate != null &&
    String(lp.transdate).trim() !== "";
  const hasTransdate = hasTransdateExplicit || useTransdateYearOnly;
  const hasDepartment =
    lp.clearDepartment || (lp.department != null && lp.department.id != null);
  const hasProject =
    lp.clearLineProject || (lp.project != null && lp.project.id != null);
  const hasAccount =
    lp.account?.accno != null &&
    String(lp.account.accno).trim() !== "";

  if (!hasTransdate && !hasDepartment && !hasProject && !hasAccount) {
    return { error: t("No updatable fields provided.") };
  }

  const seenEntry = new Set();
  const items = [];
  for (const row of selectedRows) {
    const entryId = ledgerLineEntryIdFromRow(row);
    if (entryId == null) {
      return {
        error: t(
          "Each selected line needs entry_id. Refresh search if this field is missing.",
        ),
      };
    }
    if (seenEntry.has(entryId)) continue;
    seenEntry.add(entryId);

    const item = { entry_id: entryId };
    if (hasTransdateExplicit) {
      item.transdate = String(lp.transdate).trim();
    } else if (useTransdateYearOnly) {
      const td = transdateFromRowWithNewYear(row, year);
      if (td == null) {
        return {
          error: t(
            "One or more selected rows are missing a usable transaction date.",
          ),
        };
      }
      item.transdate = td;
    }
    if (lp.clearDepartment) {
      item.department_id = null;
    } else if (lp.department != null && lp.department.id != null) {
      const d = Number(lp.department.id) + 0;
      if (Number.isFinite(d) && d > 0) item.department_id = d;
    }
    if (lp.clearLineProject) {
      item.project_id = null;
    } else if (lp.project != null && lp.project.id != null) {
      const pr = Number(lp.project.id) + 0;
      if (Number.isFinite(pr) && pr > 0) item.project_id = pr;
    }
    if (hasAccount) {
      item.accno = String(lp.account.accno).trim();
    }
    items.push(item);
  }

  if (!items.length) {
    return { error: t("No update payload could be built from the selection.") };
  }
  return { items };
}

function applyGlBatchUpdateOutcome(data, items) {
  const isLine = lineData.value;
  const parsed = parseApBatchUpdateResults(data);

  const closeAndRefresh = () => {
    glBatchSelectedRows.value = [];
    resetGlBatchUpdatePatchForm();
    glBatchRefreshAfterDialogClose.value = true;
    glBatchUpdateDialogOpen.value = false;
  };

  const okMsg = (count) =>
    isLine
      ? t("Update applied to {count} line(s).", { count })
      : t("Update applied to {count} transaction(s).", { count });

  if (parsed == null) {
    Notify.create({ type: "positive", message: okMsg(items.length), position: "center" });
    closeAndRefresh();
    return;
  }

  const { failures, okCount } = parsed;
  const failDetail = failures.map((f) => `id ${f.id}: ${f.error}`).join("\n");

  if (failures.length === 0) {
    Notify.create({ type: "positive", message: okMsg(okCount || items.length), position: "center" });
    closeAndRefresh();
    return;
  }

  if (okCount > 0) {
    Notify.create({
      type: "warning",
      message: isLine
        ? t("{ok} line(s) updated; {fail} could not be updated.", {
            ok: okCount,
            fail: failures.length,
          })
        : t("{ok} transaction(s) updated; {fail} could not be updated.", {
            ok: okCount,
            fail: failures.length,
          }),
      caption: failDetail,
      multiLine: true,
      timeout: 12000,
      position: "center",
    });
    closeAndRefresh();
    return;
  }

  Notify.create({
    type: "negative",
    multiLine: true,
    message:
      failures.length === 1
        ? failures[0].error
        : `${t("{n} transaction(s) could not be updated.", { n: failures.length })}\n\n${failDetail}`,
    position: "center",
    timeout: 0,
  });
}

async function submitGlBatchUpdate() {
  if (module !== "gl") return;
  const selected = glBatchSelectedRows.value;
  if (!selected.length) {
    Notify.create({
      type: "negative",
      message: t(
        lineData.value ? "Select one or more lines." : "Select one or more transactions.",
      ),
      position: "center",
    });
    return;
  }

  const built = lineData.value
    ? buildGlLineBatchUpdateItems(selected)
    : buildGlTransactionBatchUpdateItems(selected);

  if (built.error) {
    Notify.create({ type: "negative", message: built.error, position: "center" });
    return;
  }

  const items = built.items;
  glBatchUpdateLoading.value = true;
  try {
    const { data } = await api.post("/batch/update", {
      module: "gl",
      granularity: lineData.value ? "line" : "transaction",
      items,
    });
    applyGlBatchUpdateOutcome(data, items);
  } catch (err) {
    const data = err.response?.data;
    if (data && Array.isArray(data.results) && data.results.length > 0) {
      applyGlBatchUpdateOutcome(data, items);
    } else {
      Notify.create({
        type: "negative",
        message:
          data?.error ||
          data?.message ||
          err.message ||
          t("Update failed"),
        position: "center",
      });
    }
  } finally {
    glBatchUpdateLoading.value = false;
  }
}

function openGlBatchUpdateDialog() {
  glBatchUpdateDialogOpen.value = true;
}

function onGlBatchUpdateDialogHide() {
  if (!glBatchRefreshAfterDialogClose.value) return;
  glBatchRefreshAfterDialogClose.value = false;
  void runSearch();
}

// ─── Batch delete (AP / GL, transaction ids only) ───────────────────────────

function buildApBatchDeleteTransactionIds() {
  const seen = new Set();
  const ids = [];
  for (const row of apBatchSelectedRows.value) {
    const id = apTransactionIdFromRow(row);
    if (id == null || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function buildGlBatchDeleteTransactionIds() {
  const seen = new Set();
  const ids = [];
  for (const row of glBatchSelectedRows.value) {
    const id = glTransactionIdFromRow(row);
    if (id == null || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

const apBatchDeleteTransactionCount = computed(() => {
  if (module !== "ap") return 0;
  return buildApBatchDeleteTransactionIds().length;
});

const glBatchDeleteTransactionCount = computed(() => {
  if (module !== "gl") return 0;
  return buildGlBatchDeleteTransactionIds().length;
});

function applyBatchDeleteOutcome(data, ids, closeAndRefresh, failAllLabel) {
  const parsed = parseApBatchUpdateResults(data, {
    fallbackError: t("Delete failed"),
  });
  const okMsg = (count) =>
    t("Deleted {count} transaction(s).", { count });

  if (parsed == null) {
    Notify.create({
      type: "positive",
      message: okMsg(ids.length),
      position: "center",
    });
    closeAndRefresh();
    return;
  }

  const { failures, okCount } = parsed;
  const failDetail = failures
    .map((f) => `id ${f.id}: ${f.error}`)
    .join("\n");

  if (failures.length === 0) {
    Notify.create({
      type: "positive",
      message: okMsg(okCount || ids.length),
      position: "center",
    });
    closeAndRefresh();
    return;
  }

  if (okCount > 0) {
    Notify.create({
      type: "warning",
      message: t("{ok} transaction(s) deleted; {fail} could not be deleted.", {
        ok: okCount,
        fail: failures.length,
      }),
      caption: failDetail,
      multiLine: true,
      timeout: 12000,
      position: "center",
    });
    closeAndRefresh();
    return;
  }

  Notify.create({
    type: "negative",
    multiLine: true,
    message:
      failures.length === 1
        ? failures[0].error
        : `${failAllLabel}\n\n${failDetail}`,
    position: "center",
    timeout: 0,
  });
}

async function submitApBatchDelete() {
  if (module !== "ap") return;
  if (lineData.value) {
    Notify.create({
      type: "negative",
      message: t(
        "Batch delete applies to whole transactions. Turn off Line Data, select transactions, then try again.",
      ),
      position: "center",
    });
    return;
  }
  const ids = buildApBatchDeleteTransactionIds();
  if (!ids.length) {
    Notify.create({
      type: "negative",
      message: t("Selected rows are missing a valid transaction id."),
      position: "center",
    });
    return;
  }

  apBatchDeleteLoading.value = true;
  try {
    const { data } = await api.post("/batch/delete", {
      module: "ap",
      granularity: "transaction",
      ids,
    });
    const closeAndRefresh = () => {
      apBatchSelectedRows.value = [];
      apBatchDeleteRefreshAfterDialogClose.value = true;
      apBatchDeleteDialogOpen.value = false;
    };
    applyBatchDeleteOutcome(
      data,
      ids,
      closeAndRefresh,
      t("{n} transaction(s) could not be deleted.", { n: ids.length }),
    );
  } catch (err) {
    const data = err.response?.data;
    if (data && Array.isArray(data.results) && data.results.length > 0) {
      const closeAndRefresh = () => {
        apBatchSelectedRows.value = [];
        apBatchDeleteRefreshAfterDialogClose.value = true;
        apBatchDeleteDialogOpen.value = false;
      };
      applyBatchDeleteOutcome(
        data,
        ids,
        closeAndRefresh,
        t("{n} transaction(s) could not be deleted.", { n: ids.length }),
      );
    } else {
      Notify.create({
        type: "negative",
        message:
          data?.error ||
          data?.message ||
          err.message ||
          t("Delete failed"),
        position: "center",
      });
    }
  } finally {
    apBatchDeleteLoading.value = false;
  }
}

async function submitGlBatchDelete() {
  if (module !== "gl") return;
  if (lineData.value) {
    Notify.create({
      type: "negative",
      message: t(
        "Batch delete applies to whole transactions. Turn off Line Data, select transactions, then try again.",
      ),
      position: "center",
    });
    return;
  }
  const ids = buildGlBatchDeleteTransactionIds();
  if (!ids.length) {
    Notify.create({
      type: "negative",
      message: t("Selected rows are missing a valid transaction id."),
      position: "center",
    });
    return;
  }

  glBatchDeleteLoading.value = true;
  try {
    const { data } = await api.post("/batch/delete", {
      module: "gl",
      granularity: "transaction",
      ids,
    });
    const closeAndRefresh = () => {
      glBatchSelectedRows.value = [];
      glBatchDeleteRefreshAfterDialogClose.value = true;
      glBatchDeleteDialogOpen.value = false;
    };
    applyBatchDeleteOutcome(
      data,
      ids,
      closeAndRefresh,
      t("{n} transaction(s) could not be deleted.", { n: ids.length }),
    );
  } catch (err) {
    const data = err.response?.data;
    if (data && Array.isArray(data.results) && data.results.length > 0) {
      const closeAndRefresh = () => {
        glBatchSelectedRows.value = [];
        glBatchDeleteRefreshAfterDialogClose.value = true;
        glBatchDeleteDialogOpen.value = false;
      };
      applyBatchDeleteOutcome(
        data,
        ids,
        closeAndRefresh,
        t("{n} transaction(s) could not be deleted.", { n: ids.length }),
      );
    } else {
      Notify.create({
        type: "negative",
        message:
          data?.error ||
          data?.message ||
          err.message ||
          t("Delete failed"),
        position: "center",
      });
    }
  } finally {
    glBatchDeleteLoading.value = false;
  }
}

function openApBatchDeleteDialog() {
  apBatchDeleteDialogOpen.value = true;
}

function onApBatchDeleteDialogHide() {
  if (!apBatchDeleteRefreshAfterDialogClose.value) return;
  apBatchDeleteRefreshAfterDialogClose.value = false;
  void runSearch();
}

function openGlBatchDeleteDialog() {
  glBatchDeleteDialogOpen.value = true;
}

function onGlBatchDeleteDialogHide() {
  if (!glBatchDeleteRefreshAfterDialogClose.value) return;
  glBatchDeleteRefreshAfterDialogClose.value = false;
  void runSearch();
}

// ────────────────────────────────────────────────────────────────────────────

function filterByAccno(accnoStr) {
  const acc = accountFieldAccno(accnoStr);
  if (acc === "") return;
  const list = accountFilterOptions.value;
  const found = list.find((a) => accountFieldAccno(a.accno) === acc);
  filters.value.account = found || { accno: acc, label: acc };
  runSearch();
}

function accountOptionFromAccno(accnoStr, lists) {
  const acc = accountFieldAccno(accnoStr);
  if (acc === "") return undefined;
  const merged = mergeAccountsByAccno(lists);
  return merged.find((a) => accountFieldAccno(a.accno) === acc);
}

function vendorIdFromRow(row) {
  const raw =
    row.vendor_id != null && row.vendor_id !== ""
      ? row.vendor_id
      : row.vc_id != null && row.vc_id !== ""
        ? row.vc_id
        : null;
  if (raw != null) return raw;
  const v = row.vendor;
  if (v != null && typeof v === "object" && v.id != null) return v.id;
  return null;
}

function vendorDisplayNameFromRow(row) {
  const v = row.vendor;
  if (v != null && typeof v === "object") {
    return String(v.label ?? v.name ?? v.description ?? "").trim();
  }
  return String(row.vendor_name ?? row.vendor ?? "").trim();
}

function filterByVendorFromRow(row) {
  const list = vendorOptions.value;
  const idRaw = vendorIdFromRow(row);
  const displayName = vendorDisplayNameFromRow(row);

  let found = null;
  if (idRaw != null && idRaw !== "") {
    const idNum = Number(idRaw);
    found = list.find((v) => {
      if (v.id === idRaw || String(v.id) === String(idRaw)) return true;
      if (!Number.isNaN(idNum) && Number(v.id) === idNum) return true;
      return false;
    });
  }
  if (!found && displayName) {
    const n = displayName.toLowerCase();
    found = list.find(
      (v) => String(v.label).trim().toLowerCase() === n,
    );
  }
  if (!found && displayName) {
    const n = displayName.toLowerCase();
    found = list.find((v) =>
      String(v.label).toLowerCase().includes(n),
    );
  }
  if (!found && idRaw != null && idRaw !== "") {
    const idNum = Number(idRaw);
    found = {
      id: Number.isNaN(idNum) ? idRaw : idNum,
      label: displayName || String(idRaw),
    };
  }
  if (!found) return;
  filters.value.vendor = found;
  runSearch();
}

function filterByRecordAccountFromRow(accnoStr) {
  const acc = accountFieldAccno(accnoStr);
  if (acc === "") return;
  const p = linkPayload.value;
  const found = accountOptionFromAccno(acc, [
    p.ap_record_accounts || [],
    p.expense_accounts || [],
  ]);
  filters.value.lineItemAccount = null;
  filters.value.lineItemTaxAccount = null;
  filters.value.account = found || { accno: acc, label: acc };
  runSearch();
}

function filterByLineItemAccountFromRow(accnoStr) {
  const acc = accountFieldAccno(accnoStr);
  if (acc === "") return;
  const p = linkPayload.value;
  const found = accountOptionFromAccno(acc, [p.expense_accounts || []]);
  filters.value.account = null;
  filters.value.lineItemAccount = found || { accno: acc, label: acc };
  runSearch();
}

function filterByTaxAccountFromRow(accnoStr) {
  const acc = accountFieldAccno(accnoStr);
  if (acc === "") return;
  const p = linkPayload.value;
  const found = accountOptionFromAccno(acc, [
    p.expense_tax_accounts || [],
    p.tax_accounts || [],
  ]);
  filters.value.lineItemTaxAccount = found || { accno: acc, label: acc };
  runSearch();
}

function filterByProjectFromRow(row) {
  const idRaw = projectIdFromRow(row);
  if (idRaw == null || idRaw === "") return;
  const n = Number(idRaw) + 0;
  if (Number.isNaN(n)) return;
  const list = projectOptions.value;
  const foundOpt = list.find((x) => String(x.id) === String(idRaw));
  filters.value.project = foundOpt || {
    id: n,
    description: projectDisplayLabelFromRow(row),
  };
  runSearch();
}

function filterByDepartmentFromRow(row) {
  if (departmentNumericIdIsZero(row)) return;
  const list = departmentOptions.value;
  const idRaw = departmentIdFromRow(row);
  if (idRaw != null && idRaw !== "") {
    const n = Number(idRaw) + 0;
    if (Number.isNaN(n)) return;
    const foundOpt = list.find((x) => String(x.id) === String(idRaw));
    filters.value.department = foundOpt || {
      id: n,
      description: departmentDisplayLabelFromRow(row),
    };
    runSearch();
    return;
  }
  const label =
    typeof row.department === "string" ? row.department.trim() : "";
  if (!label) return;
  const n = label.toLowerCase();
  const foundOpt = list.find(
    (x) => String(x.description).trim().toLowerCase() === n,
  );
  if (!foundOpt) return;
  filters.value.department = foundOpt;
  runSearch();
}

function humanizeKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatColumnLabel(key) {
  return t(COLUMN_LABELS[key] || humanizeKey(key));
}

const columns = computed(() => {
  const sample = searchResults.value[0];
  if (!sample) return [];
  let names = orderedVisibleKeys(sample, module, granularity.value);
  if (module === "gl" && granularity.value === "line") {
    names = names.filter(
      (k) =>
        k !== "debit" &&
        k !== "credit" &&
        k !== "accno" &&
        k !== "account_description",
    );
    let anchor = null;
    if (names.includes("source")) anchor = "source";
    else if (names.includes("memo")) anchor = "memo";
    else if (names.includes("document_description")) anchor = "document_description";
    else if (names.includes("description")) anchor = "description";
    const idx = anchor ? names.indexOf(anchor) : -1;
    if (idx >= 0) {
      names.splice(idx + 1, 0, "posting_label", "line_amount");
    } else {
      names.push("posting_label", "line_amount");
    }
  }
  return names.map((name) => {
    if (name === "posting_label") {
      return {
        name,
        label: t("Posting"),
        field: glLinePostingLabel,
        align: "left",
        sortable: true,
      };
    }
    if (name === "line_amount") {
      return {
        name,
        label: t("Amount"),
        field: glLineAmountValue,
        align: "right",
        sortable: true,
      };
    }
    if (name === "ap_line_dates") {
      return {
        name,
        label: t("Dates"),
        field: (row) => row.invoicedate || row.duedate || "",
        align: "left",
        sortable: true,
      };
    }
    return {
      name,
      label: formatColumnLabel(name),
      field: name,
      align: columnAlign(name),
      sortable: true,
    };
  });
});

function appendApAmountParam(params, key, val) {
  if (val === "" || val === null || val === undefined) return;
  const n = Number(val);
  if (!Number.isNaN(n)) params[key] = n;
}

/** AP batch search: coerce with +0, ignore empty string (matches API). */
function appendApNumericIdParam(params, key, raw) {
  if (raw === "" || raw === null || raw === undefined) return;
  const n = Number(raw) + 0;
  if (Number.isNaN(n)) return;
  params[key] = n;
}

function buildSearchParams() {
  const m = module;
  const g = granularity.value; // 'line' | 'transaction'
  const params = {
    module: m,
    granularity: g,
  };
  if (filters.value.datefrom) params.datefrom = filters.value.datefrom;
  if (filters.value.dateto) params.dateto = filters.value.dateto;
  if (filters.value.createdfrom) params.createdfrom = filters.value.createdfrom;
  if (filters.value.createdto) params.createdto = filters.value.createdto;
  if (filters.value.updatedfrom) params.updatedfrom = filters.value.updatedfrom;
  if (filters.value.updatedto) params.updatedto = filters.value.updatedto;
  if (filters.value.description?.trim()) {
    params.description = filters.value.description.trim();
  }
  if (m === "gl" && filters.value.reference?.trim()) {
    params.reference = filters.value.reference.trim();
  }
  if ((m === "ar" || m === "ap") && filters.value.invnumber?.trim()) {
    params.invnumber = filters.value.invnumber.trim();
  }
  if (m === "ar" && filters.value.customer?.id != null) {
    params.customer_id = filters.value.customer.id;
  }
  if (m === "ap" && filters.value.vendor?.id != null) {
    params.vendor_id = filters.value.vendor.id;
  }

  if (m === "ap") {
    appendApNumericIdParam(
      params,
      "department_id",
      filters.value.department?.id,
    );
    if (g === "line") {
      appendApNumericIdParam(
        params,
        "project_id",
        filters.value.project?.id,
      );
    }
    if (filters.value.duedatefrom) params.duedatefrom = filters.value.duedatefrom;
    if (filters.value.duedateto) params.duedateto = filters.value.duedateto;
    appendApAmountParam(params, "morethanamount", filters.value.morethanamount);
    appendApAmountParam(params, "lessthanamount", filters.value.lessthanamount);
    appendApAmountParam(params, "equaltoamount", filters.value.equaltoamount);

    if (g === "line") {
      if (
        filters.value.lineItemAccount?.accno != null &&
        String(filters.value.lineItemAccount.accno) !== ""
      ) {
        params.line_item_account = filters.value.lineItemAccount.accno;
      } else if (
        filters.value.account?.accno != null &&
        String(filters.value.account.accno) !== ""
      ) {
        params.accno = filters.value.account.accno;
      }
      if (
        filters.value.lineItemTaxAccount?.accno != null &&
        String(filters.value.lineItemTaxAccount.accno) !== ""
      ) {
        params.line_item_tax_account = filters.value.lineItemTaxAccount.accno;
      }
      appendApAmountParam(
        params,
        "morethantaxamount",
        filters.value.morethantaxamount,
      );
      appendApAmountParam(
        params,
        "lessthantaxamount",
        filters.value.lessthantaxamount,
      );
    }
  } else {
    if (m === "gl") {
      appendApNumericIdParam(
        params,
        "department_id",
        filters.value.department?.id,
      );
      if (g === "line") {
        appendApNumericIdParam(
          params,
          "project_id",
          filters.value.project?.id,
        );
        if (filters.value.source?.trim()) {
          params.source = filters.value.source.trim();
        }
        if (filters.value.memo?.trim()) {
          params.memo = filters.value.memo.trim();
        }
      }
      if (
        filters.value.account?.accno != null &&
        String(filters.value.account.accno) !== ""
      ) {
        params.accno = filters.value.account.accno;
      }
    }
  }
  if (m === "ar" && g === "line" && filters.value.partnumber?.trim()) {
    params.partnumber = filters.value.partnumber.trim();
  }
  return params;
}

async function loadCreateLinks() {
  linksLoading.value = true;
  linksError.value = "";
  try {
    const { data } = await api.get("/batch/create_links", {
      params: { module, sections: "all" },
    });
    linkPayload.value = data && typeof data === "object" ? data : {};
  } catch (err) {
    linkPayload.value = {};
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      t("Could not load reference data");
    linksError.value = msg;
  } finally {
    linksLoading.value = false;
  }
}

async function runSearch() {
  searchLoading.value = true;
  searchError.value = "";
  try {
    const params = buildSearchParams();
    const { data } = await api.get("/batch/search", { params });
    let rows = Array.isArray(data?.rows) ? data.rows : [];

    batchSearchMeta.value = {
      module: data?.module ?? module,
      granularity: data?.granularity ?? granularity.value,
      transdate_after:
        data?.transdate_after != null && data.transdate_after !== ""
          ? data.transdate_after
          : null,
      closed_period_applied: Boolean(data?.closed_period_applied),
    };

    if (
      module === "ap" &&
      granularity.value === "line" &&
      rows.length > 0 &&
      rows.some((r) => apTransactionIdFromRow(r) == null)
    ) {
      try {
        const { data: txData } = await api.get("/batch/search", {
          params: buildApTransactionSearchParamsForLineMerge(),
        });
        const txRows = Array.isArray(txData?.rows) ? txData.rows : [];
        const lookup = new Map();
        for (const tr of txRows) {
          const tid = apTransactionIdFromRow(tr);
          if (tid == null) continue;
          const k = apInvoiceVendorMergeKey(tr);
          if (k != null) lookup.set(k, tid);
        }
        rows = rows.map((row) => {
          if (apTransactionIdFromRow(row) != null) return row;
          const k = apInvoiceVendorMergeKey(row);
          const id = k != null ? lookup.get(k) : undefined;
          return id != null ? { ...row, id } : row;
        });
      } catch {
        /* keep rows without merged id */
      }
    }

    searchResults.value = rows;
  } catch (err) {
    searchResults.value = [];
    batchSearchMeta.value = {
      module,
      granularity: granularity.value,
      transdate_after: null,
      closed_period_applied: false,
    };
    const msg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      t("Search failed");
    searchError.value = msg;
  } finally {
    batchTableKey.value++;
    searchLoading.value = false;
  }
}

function resetFilters() {
  filters.value = {
    ...defaultDateRange(),
    createdfrom: "",
    createdto: "",
    updatedfrom: "",
    updatedto: "",
    description: "",
    reference: "",
    invnumber: "",
    partnumber: "",
    customer: null,
    vendor: null,
    account: null,
    duedatefrom: "",
    duedateto: "",
    morethanamount: "",
    lessthanamount: "",
    equaltoamount: "",
    morethantaxamount: "",
    lessthantaxamount: "",
    lineItemAccount: null,
    lineItemTaxAccount: null,
    department: null,
    project: null,
    source: "",
    memo: "",
  };
  runSearch();
}

function onLineDataToggled(checked) {
  if (module === "ap" && checked === false) {
    filters.value.project = null;
  }
  if (module === "gl" && checked === false) {
    filters.value.project = null;
    filters.value.source = "";
    filters.value.memo = "";
  }
  runSearch();
}

watch(lineData, () => {
  if (module === "ap") {
    apBatchSelectedRows.value = [];
    apBatchUpdateDialogOpen.value = false;
    apBatchDeleteDialogOpen.value = false;
  }
  if (module === "gl") {
    glBatchSelectedRows.value = [];
    glBatchUpdateDialogOpen.value = false;
    glBatchDeleteDialogOpen.value = false;
  }
});

onMounted(async () => {
    syncLineDataDefault();
    updateTitle(t("Batch Update"));
    await loadCreateLinks();
    if (!linksError.value) {
      await runSearch();
    }
  });

  return {
    t,
    filters,
    lineData,
    filtersOpen,
    searchLoading,
    searchError,
    batchSearchMeta,
    linksLoading,
    linksError,
    linkPayload,
    customerOptions,
    vendorOptions,
    departmentOptions,
    projectOptions,
    accountFilterOptions,
    expenseAccountOptions,
    taxAccountOptions,
    showAccountFilter,
    columns,
    tableRows,
    batchTotalRowCount,
    batchSelectedCount,
    tableRowKey,
    batchTableKey,
    glLineSplitView,
    runSearch,
    resetFilters,
    onLineDataToggled,
    filterByVendorFromRow,
    filterByRecordAccountFromRow,
    filterByLineItemAccountFromRow,
    filterByTaxAccountFromRow,
    filterByProjectFromRow,
    filterByDepartmentFromRow,
    filterByAccno,
    getDocumentPath,
    getDocumentUrl,
    cellRawValue,
    formatAccountListValue,
    accountFieldAccno,
    formatDate,
    formatBatchTableDate,
    formatAmount,
    isDateColumn,
    isAmountColumn,
    isWrapTextColumn,
    wrapTextColumnClass,
    getBatchCellClass,
    glLinePostingKind,
    glLinePostingLabel,
    glLineAmountValue,
    isApDueOverdue,
    apBatchSelectedRows,
    apBatchUpdatePatch,
    apBatchLineUpdatePatch,
    apRecordAccountOptions,
    apBatchUpdateLoading,
    apBatchSelectAll,
    isApBatchRowSelected,
    toggleApBatchRowSelected,
    toggleApBatchSelectAll,
    setApBatchClearDepartment,
    setApBatchClearProject,
    setApBatchClearLineProject,
    setApBatchLineClearDepartment,
    submitApBatchUpdate,
    apBatchUpdateDialogOpen,
    openApBatchUpdateDialog,
    onApBatchUpdateDialogHide,
    apBatchDeleteDialogOpen,
    apBatchDeleteLoading,
    openApBatchDeleteDialog,
    onApBatchDeleteDialogHide,
    submitApBatchDelete,
    apBatchDeleteTransactionCount,
    glAccountOptions,
    glBatchSelectedRows,
    glBatchUpdatePatch,
    glBatchLineUpdatePatch,
    glBatchUpdateLoading,
    glBatchSelectAll,
    isGlBatchRowSelected,
    toggleGlBatchRowSelected,
    toggleGlBatchSelectAll,
    setGlBatchClearDepartment,
    setGlBatchClearProject,
    setGlBatchLineClearDepartment,
    setGlBatchLineClearProject,
    submitGlBatchUpdate,
    glBatchUpdateDialogOpen,
    openGlBatchUpdateDialog,
    onGlBatchUpdateDialogHide,
    glBatchDeleteDialogOpen,
    glBatchDeleteLoading,
    openGlBatchDeleteDialog,
    onGlBatchDeleteDialogHide,
    submitGlBatchDelete,
    glBatchDeleteTransactionCount,
  };
}
