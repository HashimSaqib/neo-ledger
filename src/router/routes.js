import MainLayout from "layouts/MainLayout.vue";
import IndexPage from "src/pages/IndexPage.vue";
import GeneralLedger from "src/pages/general-ledger/GeneralLedger.vue";
import GlTransactions from "src/pages/general-ledger/GlTransactions.vue";
import ArApTransaction from "src/pages/arap/ArApTransaction.vue";
import SalesInvoice from "src/pages/ar/SalesInvoice.vue";
import ArTransactions from "src/pages/ar/ArTransactions.vue";
import AddVC from "src/pages/arap/AddVC.vue";
import VcHistory from "src/pages/arap/VcHistory.vue";
import SearchVC from "src/pages/arap/SearchVC.vue";
import AddPart from "src/pages/goodservices/AddPart.vue";
import SearchPart from "src/pages/goodservices/SearchPart.vue";
import PointOfSale from "src/pages/pos/PointOfSale.vue";
import ApTransactions from "src/pages/ap/ApTransactions.vue";
import VendorInvoice from "src/pages/ap/VendorInvoice.vue";
import TrialBalance from "src/pages/reports/TrialBalance.vue";
import TrialTransactions from "src/pages/reports/TrialTransactions.vue";
import Reconciliation from "src/pages/cash/Reconciliation.vue";
import SysCurrencies from "src/pages/system/Currencies.vue";
import SysDefaults from "src/pages/system/Defaults.vue";
import ListAccounts from "src/pages/system/chart/ListAccounts.vue";
import AddAccount from "src/pages/system/chart/AddAccount.vue";
import ListDepartments from "src/pages/system/department/ListDepartments.vue";
import LoginPage from "src/pages/LoginPage.vue";
import ErrorNotFound from "src/pages/ErrorNotFound.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      { path: "", component: IndexPage },
      // General Ledger
      {
        path: "/gl/add-gl",
        component: GeneralLedger,
        props: (route) => ({ id: route.query.id }),
      },
      {
        path: "/gl/reports",
        component: GlTransactions,
      },
      // ARAP
      {
        path: "/arap/transaction/:type",
        component: ArApTransaction,
        props: (route) => ({ id: route.query.id }),
      },
      {
        path: "/history/:type",
        component: VcHistory,
      },
      {
        path: "/arap/:type",
        component: AddVC,
        props: (route) => ({ id: route.query.id }),
      },
      {
        path: "/arap/search/:type",
        component: SearchVC,
      },
      {
        path: "/ar/sales-invoice",
        component: SalesInvoice,
        props: (route) => ({ id: route.query.id }),
      },
      {
        path: "/ar/reports/transactions",
        component: ArTransactions,
      },
      // Point Of Sale
      {
        path: "/pos/sale",
        component: PointOfSale,
        props: (route) => ({ id: route.query.id }),
      },
      // Account Payables
      {
        path: "/ap/reports/transactions",
        component: ApTransactions,
      },
      {
        path: "/ap/vendor-invoice",
        component: VendorInvoice,
        props: (route) => ({ id: route.query.id }),
      },
      // Reports
      {
        path: "/reports/trial_balance",
        component: TrialBalance,
        props: (route) => ({
          from: route.query.fromdate,
          to: route.query.todate,
        }),
      },
      {
        path: "/reports/trial_transactions",
        component: TrialTransactions,
        props: (route) => ({
          accno: route.query.accno,
          from: route.query.fromdate,
          to: route.query.todate,
        }),
      },
      // Goods & Serivices
      {
        path: "/ic/add/:type",
        component: AddPart,
      },
      {
        path: "/ic/search/:type",
        component: SearchPart,
      },
      // System Settings
      {
        path: "/system/currencies",
        component: SysCurrencies,
      },
      {
        path: "/system/defaults",
        component: SysDefaults,
      },
      {
        path: "/system/chart/list",
        component: ListAccounts,
      },
      {
        path: "/system/chart/addaccount",
        component: AddAccount,
      },
      {
        path: "/system/departments",
        component: ListDepartments,
      },
      {
        path: "/reconciliation",
        component: Reconciliation,
      },
    ],
  },
  {
    path: "/login",
    component: LoginPage,
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: ErrorNotFound,
  },
];

export default routes;
