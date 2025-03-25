import MainLayout from "layouts/MainLayout.vue";
import GeneralLedger from "src/pages/general-ledger/GeneralLedger.vue";
import GlTransactions from "src/pages/general-ledger/GlTransactions.vue";
import ArApTransaction from "src/pages/arap/ArApTransaction.vue";
import ArApTransactions from "src/pages/arap/ArApTransactions.vue";
import SalesInvoice from "src/pages/ar/SalesInvoice.vue";
import AddVC from "src/pages/arap/AddVC.vue";
import VcHistory from "src/pages/arap/VcHistory.vue";
import SearchVC from "src/pages/arap/SearchVC.vue";
import AddPart from "src/pages/goodservices/AddPart.vue";
import SearchPart from "src/pages/goodservices/SearchPart.vue";
import PointOfSale from "src/pages/pos/PointOfSale.vue";
import VendorInvoice from "src/pages/ap/VendorInvoice.vue";
import TrialBalance from "src/pages/reports/TrialBalance.vue";
import TrialTransactions from "src/pages/reports/TrialTransactions.vue";
import IncomeStatement from "src/pages/reports/IncomeStatement.vue";
import Reconciliation from "src/pages/cash/Reconciliation.vue";
import SysCurrencies from "src/pages/system/Currencies.vue";
import SysDefaults from "src/pages/system/Defaults.vue";
import ListAccounts from "src/pages/system/chart/ListAccounts.vue";
import AddAccount from "src/pages/system/chart/AddAccount.vue";
import GIFI from "src/pages/system/chart/Gifi.vue";
import ListDepartments from "src/pages/system/department/ListDepartments.vue";
import ListProjects from "src/pages/projectsjobs/ListProjects.vue";
import LoginPage from "src/pages/LoginPage.vue";
import SignUp from "src/pages/Signup.vue";
import ErrorNotFound from "src/pages/ErrorNotFound.vue";
import Roles from "src/pages/system/Roles.vue";
import Employees from "src/pages/system/Employees.vue";
import LedgerTemplates from "src/pages/system/Templates.vue";
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
              ? "customer.addcustomer"
              : "vendor.addvendor";
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
        component: LedgerTemplates,
        meta: { permission: "system.user.templates" },
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
