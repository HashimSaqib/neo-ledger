// Import neoledger configuration
import { loadPluginConfig } from "../ai_plugin/index.js";

const getMenuLinks = async () => {
  const { pluginMenu } = await loadPluginConfig();

  // Find plugin sections by title
  const stationsMenu = pluginMenu.find((m) => m.title === "Stations");
  const docMgmtMenu = pluginMenu.find((m) => m.title === "Document Management");
  const integrationsMenu = pluginMenu.find((m) => m.title === "Integrations");

  // Safely extract a named sublink from a plugin section (returns null if not found)
  const getPluginSublink = (menu, title) =>
    menu?.sublinks?.find((s) => s.title === title) ?? null;

  const inbox = getPluginSublink(docMgmtMenu, "Inbox");
  const approvals = getPluginSublink(stationsMenu, "My Workstations");
  const payments = getPluginSublink(stationsMenu, "Bank Payments");
  const bankMatching = getPluginSublink(stationsMenu, "Bank Transactions");
  const emailNotif = getPluginSublink(stationsMenu, "Email Notifications");
  const manageStations = getPluginSublink(stationsMenu, "Manage Stations");
  const camtImport = getPluginSublink(docMgmtMenu, "Bank Import");

  const menuLinks = [
    {
      title: "Cockpit",
      icon: "speed",
      perm: "cockpit",
      sublinks: [
        { title: "Dashboard", link: "/", perm: "dashboard", icon: "grid_view" },
        ...(inbox ? [{ ...inbox, title: "Inbox", icon: "move_to_inbox" }] : []),
        ...(approvals ? [{ ...approvals, title: "Approvals", icon: "task_alt" }] : []),
        ...(payments ? [{ ...payments, title: "Payments", icon: "payments" }] : []),
        ...(bankMatching ? [{ ...bankMatching, title: "Bank Matching", icon: "compare_arrows" }] : []),
        ...(emailNotif ? [{ ...emailNotif, icon: "notifications" }] : []),
      ],
    },
    {
      title: "Customers",
      icon: "people",
      perm: "customer",
      sublinks: [
        {
          title: "Overview",
          link: "/arap/overview/customer",
          perm: "customer.overview",
          icon: "visibility",
        },
        {
          title: "Postings",
          icon: "edit_note",
          sublinks: [
            {
              title: "Customer Transaction",
              link: "/arap/transaction/customer/transaction",
              perm: "customer.transaction",
            },
            {
              title: "Sales Invoice",
              link: "/ar/sales-invoice/invoice",
              perm: "customer.invoice",
            },
            {
              title: "Credit Transaction",
              link: "/arap/transaction/customer/reverse",
              perm: "customer.transaction_return",
            },
            {
              title: "Credit Invoice",
              link: "/ar/sales-invoice/credit_invoice",
              perm: "customer.invoice_return",
            },
            {
              title: "Add Customer",
              link: "/arap/customer",
              perm: "customer.add",
            },
          ],
        },
        {
          title: "Batch",
          icon: "dynamic_feed",
          sublinks: [
            {
              title: "Batch Email Invoices",
              link: "/arap/batch/customer/invoice",
              perm: "customer.batch",
            },
            {
              title: "Reminder",
              link: "/ar/reminder",
              perm: "customer.reminder",
            },
            {
              title: "Consolidate Invoices",
              link: "/ar/consolidate-invoices",
              perm: "customer.consolidate",
            },
            {
              title: "Recurring Invoices",
              link: "/ar/recurring-invoices",
              perm: "customer.transactions",
            },
          ],
        },
        {
          title: "Reports",
          icon: "assessment",
          sublinks: [
            {
              title: "AR Transactions",
              link: "/arap/transactions/customer",
              perm: "customer.transactions",
            },
            {
              title: "Tax Collected",
              link: "/arap/taxreport/customer",
              perm: "customer.taxreport",
            },
            {
              title: "Customer Search",
              link: "/arap/search/customer",
              perm: "customer.search",
            },
            {
              title: "Customer History",
              link: "/history/customer",
              perm: "customer.history",
            },
          ],
        },
      ],
    },
    {
      title: "Vendors",
      icon: "storefront",
      perm: "vendor",
      sublinks: [
        {
          title: "Overview",
          link: "/arap/overview/vendor",
          perm: "vendor.overview",
          icon: "visibility",
        },
        {
          title: "Postings",
          icon: "edit_note",
          sublinks: [
            {
              title: "Vendor Transaction",
              link: "/arap/transaction/vendor/transaction",
              perm: "vendor.transaction",
            },
            {
              title: "Vendor Invoice",
              link: "/ap/vendor-invoice/invoice",
              perm: "vendor.invoice",
            },
            {
              title: "Debit Transaction",
              link: "/arap/transaction/vendor/reverse",
              perm: "vendor.transaction_return",
            },
            {
              title: "Debit Invoice",
              link: "/ap/vendor-invoice/debit_invoice",
              perm: "vendor.invoice_return",
            },
            {
              title: "Add Vendor",
              link: "/arap/Vendor",
              perm: "vendor.add",
            },
          ],
        },
        {
          title: "Reports",
          icon: "assessment",
          sublinks: [
            {
              title: "AP Transactions",
              link: "/arap/transactions/vendor",
              perm: "vendor.transactions",
            },
            {
              title: "Tax Paid",
              link: "/arap/taxreport/vendor",
              perm: "vendor.taxreport",
            },
            {
              title: "Vendor Search",
              link: "/arap/search/vendor",
              perm: "vendor.search",
            },
            {
              title: "Vendor History",
              link: "/history/vendor",
              perm: "vendor.history",
            },
          ],
        },
      ],
    },
    {
      title: "Orders & Quotations",
      icon: "shopping_cart",
      perm: "oe",
      sublinks: [
        {
          title: "Postings",
          icon: "edit_note",
          sublinks: [
            {
              title: "Sales Order",
              link: "/oe/order/customer",
              perm: "customer.order",
            },
            {
              title: "Purchase Order",
              link: "/oe/order/vendor",
              perm: "vendor.order",
            },
            {
              title: "Quotation",
              link: "/oe/quotation/customer",
              perm: "customer.quotation",
            },
            {
              title: "Request For Quotation",
              link: "/oe/quotation/vendor",
              perm: "vendor.quotation",
            },
          ],
        },
        {
          title: "Reports",
          icon: "assessment",
          sublinks: [
            {
              title: "Sales Order Reports",
              link: "/oe/order/customer/reports",
              perm: "customer.orders",
            },
            {
              title: "Purchase Order Reports",
              link: "/oe/order/vendor/reports",
              perm: "vendor.orders",
            },
            {
              title: "Quotation Reports",
              link: "/oe/quotation/customer/reports",
              perm: "customer.quotations",
            },
            {
              title: "RFQ Reports",
              link: "/oe/quotation/vendor/reports",
              perm: "vendor.quotations",
            },
          ],
        },
      ],
    },
    {
      title: "General Ledger",
      icon: "account_balance",
      perm: "gl",
      sublinks: [
        {
          title: "Add Transaction",
          link: "/gl/add-gl",
          perm: "gl.add",
          icon: "post_add",
        },
        {
          title: "Year End",
          link: "/system/yearend",
          perm: "system.yearend",
          icon: "event",
        },
        {
          title: "Audit",
          link: "/system/audit",
          perm: "system.audit",
          icon: "policy",
        },
        {
          title: "Reports",
          icon: "assessment",
          sublinks: [
            {
              title: "Journal",
              link: "/gl/reports",
              perm: "gl.transactions",
            },
            {
              title: "Trial Balance",
              link: "/reports/trial_balance",
              perm: "reports.trial",
            },
            {
              title: "Income Statement",
              link: "/reports/income_statement",
              perm: "reports.income",
            },
            {
              title: "Balance Sheet",
              link: "/reports/balance_sheet",
              perm: "reports.balance",
            },
            {
              title: "All Taxes",
              link: "/reports/all_taxes",
              perm: "reports.alltaxes",
            },
            {
              title: "Reconciliation",
              link: "/cash/reconciliation",
              perm: "cash.recon",
            },
          ],
        },
      ],
    },
    {
      title: "Goods & Services",
      icon: "local_offer",
      perm: "items",
      sublinks: [
        {
          title: "Add Part",
          link: "/ic/add/part",
          perm: "items.part",
          icon: "inventory_2",
        },
        {
          title: "Add Service",
          link: "/ic/add/service",
          perm: "items.service",
          icon: "miscellaneous_services",
        },
        {
          title: "Reports",
          icon: "assessment",
          sublinks: [
            {
              title: "All Items",
              link: "/ic/search/allitems",
              perm: "items.search.allitems",
            },
            {
              title: "Parts",
              link: "/ic/search/parts",
              perm: "items.search.parts",
            },
            {
              title: "Services",
              link: "/ic/search/services",
              perm: "items.search.services",
            },
          ],
        },
      ],
    },
    {
      title: "System",
      icon: "settings",
      perm: "system",
      sublinks: [
        {
          title: "Currencies",
          link: "/system/currencies",
          perm: "system.currencies",
          icon: "currency_exchange",
        },
        {
          title: "Messages",
          link: "/system/messages",
          perm: "system.messages",
          icon: "chat",
        },
        {
          title: "Projects",
          link: "/system/projects",
          perm: "system.projects",
          icon: "work",
        },
        {
          title: "Departments",
          link: "/system/departments",
          perm: "system.departments",
          icon: "corporate_fare",
        },
        {
          title: "Defaults",
          link: "/system/defaults",
          perm: "system.defaults",
          icon: "tune",
        },
        {
          title: "AI Prompts",
          link: "/system/ai_prompts",
          perm: "ai.prompts",
          icon: "psychology",
        },
        {
          title: "Templates",
          link: "/system/templates",
          perm: "system.templates",
          icon: "article",
        },
        {
          title: "Taxes",
          link: "/system/taxes",
          perm: "system.taxes",
          icon: "percent",
        },
        {
          title: "Chart Of Accounts",
          perm: "system.chart",
          icon: "account_tree",
          sublinks: [
            {
              title: "List Accounts",
              link: "/system/chart/list",
              perm: "system.chart.list",
            },
            {
              title: "Add Account",
              link: "/system/chart/addaccount",
              perm: "system.chart.add",
            },
            {
              title: "GIFI",
              link: "/system/chart/gifi",
              perm: "system.chart.gifi",
            },
            {
              title: "Categories",
              link: "/system/chart/categories",
              perm: "system.chart.categories",
            },
          ],
        },
        {
          title: "Bank Accounts",
          link: "/system/bank",
          perm: "system.bank",
          icon: "savings",
        },
        {
          title: "Batch Jobs",
          link: "/system/batch",
          perm: "system.batch",
          icon: "pending_actions",
        },
        ...(manageStations ? [{ ...manageStations, icon: "computer" }] : []),
      ],
    },
    {
      title: "Import",
      perm: "import",
      icon: "file_present",
      sublinks: [
        {
          title: "General Ledger",
          link: "/import/gl",
          perm: "import.gl",
          icon: "account_balance",
        },
        {
          title: "Customers",
          link: "/import/customer",
          perm: "import.customer",
          icon: "people",
        },
        {
          title: "Sales Invoice",
          link: "/import/ar_invoice",
          perm: "import.ar_invoice",
          icon: "receipt_long",
        },
        {
          title: "Customer Transactions",
          link: "/import/ar_transaction",
          perm: "import.ar_transaction",
          icon: "compare_arrows",
        },
        {
          title: "Vendors",
          link: "/import/vendor",
          perm: "import.vendor",
          icon: "storefront",
        },
        {
          title: "Vendor Invoice",
          link: "/import/ap_invoice",
          perm: "import.ap_invoice",
          icon: "receipt_long",
        },
        {
          title: "Vendor Transactions",
          link: "/import/ap_transaction",
          perm: "import.ap_transaction",
          icon: "compare_arrows",
        },
        ...(camtImport ? [{ ...camtImport, title: "CAMT Import", icon: "upload_file" }] : []),
      ],
    },
    ...(integrationsMenu ? [integrationsMenu] : []),
  ];

  return menuLinks;
};

export { getMenuLinks };
