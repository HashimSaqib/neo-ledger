const MainLayout = () => import("layouts/MainLayout.vue");
const GeneralLedger = () =>
  import("src/pages/general-ledger/GeneralLedger.vue");
const GlTransactions = () =>
  import("src/pages/general-ledger/GlTransactions.vue");
const ArApTransaction = () => import("src/pages/arap/ArApTransaction.vue");
const ArApTransactions = () => import("src/pages/arap/ArApTransactions.vue");
const TaxReport = () => import("src/pages/arap/TaxReport.vue");
const PaymentsReport = () => import("src/pages/cash/PaymentsReport.vue");
const ArApBatch = () => import("src/pages/arap/ArApBatch.vue");
const ArReminder = () => import("src/pages/arap/ArReminder.vue");
const SalesInvoice = () => import("src/pages/ar/SalesInvoice.vue");
const ConsolidateInvoices = () =>
  import("src/pages/ar/ConsolidateInvoices.vue");
const AddVC = () => import("src/pages/arap/AddVC.vue");
const VcHistory = () => import("src/pages/arap/VcHistory.vue");
const SearchVC = () => import("src/pages/arap/SearchVC.vue");
const AddPart = () => import("src/pages/goodservices/AddPart.vue");
const SearchPart = () => import("src/pages/goodservices/SearchPart.vue");
const PointOfSale = () => import("src/pages/pos/PointOfSale.vue");
const VendorInvoice = () => import("src/pages/ap/VendorInvoice.vue");
const TrialBalance = () => import("src/pages/reports/TrialBalance.vue");
const TrialTransactions = () =>
  import("src/pages/reports/TrialTransactions.vue");
const IncomeStatement = () => import("src/pages/reports/IncomeStatement.vue");
const BalanceSheet = () => import("src/pages/reports/BalanceSheet.vue");
const AllTaxes = () => import("src/pages/reports/AllTaxes.vue");
const Reconciliation = () => import("src/pages/cash/Reconciliation.vue");
const Payments = () => import("src/pages/cash/Payments.vue");
const SysCurrencies = () => import("src/pages/system/Currencies.vue");
const SysDefaults = () => import("src/pages/system/Defaults.vue");
const SysAiPrompts = () => import("src/pages/system/AiPrompts.vue");
const ListAccounts = () => import("src/pages/system/chart/ListAccounts.vue");
const AddAccount = () => import("src/pages/system/chart/AddAccount.vue");
const GIFI = () => import("src/pages/system/chart/Gifi.vue");
const ListDepartments = () =>
  import("src/pages/system/department/ListDepartments.vue");
const ListProjects = () => import("src/pages/projectsjobs/ListProjects.vue");
const LoginPage = () => import("src/pages/LoginPage.vue");
const SignUp = () => import("src/pages/Signup.vue");
const TwoFactorSetup = () => import("src/components/TwoFactorSetup.vue");
const TwoFactorVerify = () => import("src/components/TwoFactorVerify.vue");
const ErrorNotFound = () => import("src/pages/ErrorNotFound.vue");
const Roles = () => import("src/pages/system/Roles.vue");
const Employees = () => import("src/pages/system/Employees.vue");
const Connections = () => import("src/pages/Connections.vue");
const Taxes = () => import("src/pages/system/Taxes.vue");
const Audit = () => import("src/pages/system/Audit.vue");
const Batch = () => import("src/pages/system/Batch.vue");
const YearEnd = () => import("src/pages/system/YearEnd.vue");
const Import = () => import("src/pages/Import.vue");
const BankAccounts = () => import("src/pages/system/BankAccounts.vue");
const BankAdjustment = () =>
  import("src/pages/cash/adjustments/BankAdjustment.vue");
const BankTransactionDetail = () =>
  import("src/pages/cash/adjustments/BankTransactionDetail.vue");
const BankAdjustmentConfirmation = () =>
  import("src/pages/cash/adjustments/Confirmation.vue");
const OrderEntry = () => import("src/pages/oe/OrderEntry.vue");
const OrderReports = () => import("src/pages/oe/OrderReports.vue");

import { loadPluginConfig } from "../ai_plugin/index.js";

const getRoutes = async () => {
  const { pluginRoutes } = await loadPluginConfig();

  return [
    {
      path: "/",
      component: () => import("src/pages/central/IndexPage.vue"),
    },
    {
      path: "/client/:client",
      component: MainLayout,
      children: [
        {
          path: "",
          component: () => import("src/pages/IndexPage.vue"),
        },
        // General Ledger
        {
          path: "gl/add-gl",
          component: GeneralLedger,
          props: (route) => ({ id: route.query.id }),
          meta: { permission: "gl.add" },
        },
        {
          path: "gl/reports",
          component: GlTransactions,
          meta: { permission: "gl.transactions" },
        },
        // ARAP
        {
          path: "arap/transaction/:type/:reverse",
          component: ArApTransaction,
          props: (route) => ({ id: route.query.id }),
          meta: {
            permission: (route) => {
              return route.params.type === "customer"
                ? "customer.transaction"
                : "vendor.transaction";
            },
          },
        },
        {
          path: "arap/transactions/:type",
          component: ArApTransactions,
          meta: {
            permission: (route) => {
              return route.params.type === "customer"
                ? "customer.transactions"
                : "vendor.transactions";
            },
          },
        },
        {
          path: "arap/taxreport/:type",
          component: TaxReport,
          meta: {
            permission: (route) => {
              return route.params.type === "customer"
                ? "customer.taxreport"
                : "vendor.taxreport";
            },
          },
        },
        {
          path: "arap/batch/:type/invoice",
          component: ArApBatch,
          meta: {
            permission: (route) => {
              return route.params.type === "customer"
                ? "customer.batch"
                : "vendor.batch";
            },
          },
        },
        {
          path: "history/:type",
          component: VcHistory,
          meta: {
            permission: (route) => {
              return route.params.type === "customer"
                ? "customer.history"
                : "vendor.history";
            },
          },
        },
        {
          path: "arap/:type",
          component: AddVC,
          props: (route) => ({ id: route.query.id }),
          meta: {
            permission: (route) => {
              return route.params.type === "customer"
                ? "customer.add"
                : "vendor.add";
            },
          },
        },
        {
          path: "arap/search/:type",
          component: SearchVC,
          meta: {
            permission: (route) => {
              return route.params.type === "customer"
                ? "customer.search"
                : "vendor.search";
            },
          },
        },
        // OE - Order Entry
        {
          path: "oe/:type/:vc",
          component: OrderEntry,
          props: (route) => ({ id: route.query.id }),
          meta: {
            permission: (route) => {
              const type = route.params.type;
              const vc = route.params.vc;
              if (type === "order") {
                return vc === "customer" ? "customer.order" : "vendor.order";
              } else {
                return vc === "customer"
                  ? "customer.quotation"
                  : "vendor.quotation";
              }
            },
          },
        },
        {
          path: "oe/:type/:vc/reports",
          component: OrderReports,
          meta: {
            permission: (route) => {
              const type = route.params.type;
              const vc = route.params.vc;
              if (type === "order") {
                return vc === "customer" ? "customer.orders" : "vendor.orders";
              } else {
                return vc === "customer"
                  ? "customer.quotations"
                  : "vendor.quotations";
              }
            },
          },
        },
        {
          path: "ar/sales-invoice/:type",
          component: SalesInvoice,
          props: (route) => ({ id: route.query.id }),
          meta: {
            permission: (route) => {
              return route.params.type === "credit_invoice"
                ? "customer.invoice_return"
                : "customer.invoice";
            },
          },
        },
        {
          path: "ar/reminder",
          component: ArReminder,
          meta: { permission: "customer.reminder" },
        },
        {
          path: "ar/consolidate-invoices",
          component: ConsolidateInvoices,
          meta: { permission: "customer.consolidate" },
        },
        {
          path: "pos/sale",
          component: PointOfSale,
          props: (route) => ({ id: route.query.id }),
          meta: { permission: "pos.sale" },
        },
        {
          path: "ap/vendor-invoice/:type",
          component: VendorInvoice,
          props: (route) => ({ id: route.query.id }),
          meta: {
            permission: (route) => {
              return route.params.type === "debit_invoice"
                ? "vendor.invoice_return"
                : "vendor.invoice";
            },
          },
        },

        // Reports
        {
          path: "reports/trial_balance",
          component: TrialBalance,
          props: (route) => ({
            from: route.query.fromdate,
            to: route.query.todate,
          }),
          meta: { permission: "reports.trial" },
        },
        {
          path: "reports/trial_transactions",
          component: TrialTransactions,
          props: (route) => ({
            accno: route.query.accno,
            from: route.query.fromdate,
            to: route.query.todate,
          }),
          meta: {
            permission: () => {
              return ["reports.income", "reports.trial"];
            },
          },
        },
        {
          path: "reports/income_statement",
          component: IncomeStatement,
          meta: { permission: "reports.income" },
        },
        {
          path: "reports/balance_sheet",
          component: BalanceSheet,
          meta: { permission: "reports.balance" },
        },
        {
          path: "reports/all_taxes",
          component: AllTaxes,
          meta: { permission: "reports.alltaxes" },
        },

        // Goods & Services
        {
          path: "ic/add/:type",
          component: AddPart,
          meta: {
            permission: (route) => {
              return route.params.type === "part"
                ? "items.part"
                : "items.service";
            },
          },
        },
        {
          path: "ic/search/:type",
          component: SearchPart,
          meta: {
            permission: (route) => {
              if (route.params.type === "allitems")
                return "items.search.allitems";
              if (route.params.type === "parts") return "items.search.parts";
              if (route.params.type === "services")
                return "items.search.services";
              return null;
            },
          },
        },
        // System Settings
        {
          path: "system/currencies",
          component: SysCurrencies,
          meta: { permission: "system.currencies" },
        },
        {
          path: "system/defaults",
          component: SysDefaults,
          meta: { permission: "system.defaults" },
        },
        {
          path: "system/ai_prompts",
          component: SysAiPrompts,
          meta: { permission: "ai.prompts" },
        },
        {
          path: "system/bank",
          component: BankAccounts,
          meta: { permission: "system.bank" },
        },
        {
          path: "system/chart/list",
          component: ListAccounts,
          meta: { permission: "system.chart.list" },
        },
        {
          path: "system/chart/addaccount",
          component: AddAccount,
          meta: { permission: "system.chart.add" },
        },
        {
          path: "system/chart/gifi",
          component: GIFI,
          meta: { permission: "system.chart.gifi" },
        },
        {
          path: "system/departments",
          component: ListDepartments,
          meta: { permission: "system.departments" },
        },
        {
          path: "system/projects",
          component: ListProjects,
          meta: { permission: "system.projects" },
        },
        {
          path: "cash/reconciliation",
          component: Reconciliation,
          meta: { permission: "cash.recon" },
        },
        {
          path: "cash/payment/:vc",
          component: Payments,
          meta: {
            permission: (route) => {
              return route.params.vc === "customer"
                ? "cash.receipts"
                : "cash.payments";
            },
          },
        },
        {
          path: "cash/report/:vc",
          component: PaymentsReport,
          meta: {
            permission: (route) => {
              return route.params.vc === "customer"
                ? "cash.report.customer"
                : "cash.report.vendor";
            },
          },
        },
        {
          path: "system/roles",
          component: Roles,
          meta: { permission: "system.user.roles" },
        },
        {
          path: "system/employees",
          component: Employees,
          meta: { permission: "system.user.employees" },
        },
        {
          path: "system/templates",
          component: () => import("src/pages/system/Templates.vue"),
          meta: { permission: "system.templates" },
        },
        {
          path: "system/taxes",
          component: Taxes,
          meta: { permission: "system.taxes" },
        },
        {
          path: "system/audit",
          component: Audit,
          meta: { permission: "system.audit" },
        },
        {
          path: "system/batch",
          component: Batch,
          meta: { permission: "system.batch" },
        },
        {
          path: "system/yearend",
          component: YearEnd,
          meta: { permission: "system.yearend" },
        },
        {
          path: "import/:type",
          component: Import,
          meta: {
            permission: (route) => {
              return ["import." + route.params.type];
            },
          },
        },
        {
          path: "bank-adjustments",
          component: BankAdjustment,
          meta: { permission: "bank.adjustments" },
          name: "BankAdjustment",
        },
        {
          path: "bank-adjustments/detail/:trans_id",
          component: BankTransactionDetail,
          meta: { permission: "bank.adjustments" },
          name: "BankAdjustmentDetail",
        },
        {
          path: "bank-adjustments/confirm/:trans_id",
          component: BankAdjustmentConfirmation,
          meta: { permission: "bank.adjustments" },
          name: "BankAdjustmentConfirmation",
        },
        // Merge AI plugin routes
        ...pluginRoutes,
      ],
    },
    {
      path: "/connection",
      component: Connections,
    },
    {
      path: "/client/:client/login",
      component: LoginPage,
    },
    {
      path: "/login",
      component: LoginPage,
    },

    {
      path: "/signup",
      component: SignUp,
    },
    {
      path: "/2fa/setup",
      component: TwoFactorSetup,
    },
    {
      path: "/2fa/verify",
      component: TwoFactorVerify,
    },
    // Catch-all for undefined routes
    {
      path: "/:catchAll(.*)*",
      component: ErrorNotFound,
    },
  ];
};

export default getRoutes;
