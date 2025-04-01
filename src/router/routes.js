const MainLayout = () => import("layouts/MainLayout.vue");
const GeneralLedger = () =>
  import("src/pages/general-ledger/GeneralLedger.vue");
const GlTransactions = () =>
  import("src/pages/general-ledger/GlTransactions.vue");
const ArApTransaction = () => import("src/pages/arap/ArApTransaction.vue");
const ArApTransactions = () => import("src/pages/arap/ArApTransactions.vue");
const SalesInvoice = () => import("src/pages/ar/SalesInvoice.vue");
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
const Reconciliation = () => import("src/pages/cash/Reconciliation.vue");
const SysCurrencies = () => import("src/pages/system/Currencies.vue");
const SysDefaults = () => import("src/pages/system/Defaults.vue");
const ListAccounts = () => import("src/pages/system/chart/ListAccounts.vue");
const AddAccount = () => import("src/pages/system/chart/AddAccount.vue");
const GIFI = () => import("src/pages/system/chart/Gifi.vue");
const ListDepartments = () =>
  import("src/pages/system/department/ListDepartments.vue");
const ListProjects = () => import("src/pages/projectsjobs/ListProjects.vue");
const LoginPage = () => import("src/pages/LoginPage.vue");
const SignUp = () => import("src/pages/Signup.vue");
const ErrorNotFound = () => import("src/pages/ErrorNotFound.vue");
const Roles = () => import("src/pages/system/Roles.vue");
const Employees = () => import("src/pages/system/Employees.vue");

const routes = [
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
        path: "arap/transaction/:type",
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
      {
        path: "ar/sales-invoice",
        component: SalesInvoice,
        props: (route) => ({ id: route.query.id }),
        meta: {
          permission: (route) => {
            return route.query.credit_invoice === "1"
              ? "customer.creditinvoice"
              : "customer.invoice";
          },
        },
      },
      {
        path: "pos/sale",
        component: PointOfSale,
        props: (route) => ({ id: route.query.id }),
        meta: { permission: "pos.sale" },
      },
      {
        path: "ap/vendor-invoice",
        component: VendorInvoice,
        props: (route) => ({ id: route.query.id }),
        meta: { permission: "vendor.invoice" },
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
        path: "reconciliation",
        component: Reconciliation,
        meta: { permission: "cash.recon" },
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
    ],
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
  // Catch-all for undefined routes
  {
    path: "/:catchAll(.*)*",
    component: ErrorNotFound,
  },
];

export default routes;
