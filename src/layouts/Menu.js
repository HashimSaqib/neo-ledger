// Import neoledger configuration
import { loadPluginConfig } from "../ai_plugin/index.js";

const getMenuLinks = async () => {
  const { pluginMenu } = await loadPluginConfig();

  const menuLinks = [
    {
      title: "Dashboard",
      icon: "dashboard",
      perm: "dashboard",
      link: "/",
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
        },
        {
          title: "Postings",
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
          ],
        },
        {
          title: "Reports",
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
        },
        {
          title: "Postings",
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
      title: "POS",
      icon: "receipt",
      perm: "pos",
      sublinks: [
        {
          title: "Sale",
          link: "/pos/sale",
          perm: "pos.sale",
        },
      ],
    },
    {
      title: "Cash",
      icon: "attach_money",
      perm: "cash",
      sublinks: [
        {
          title: "Bank Adjustment",
          link: "/bank-adjustments",
          perm: "bank.adjustments",
        },
        {
          title: "Reconciliation",
          link: "/cash/reconciliation",
          perm: "cash.recon",
        },
        {
          title: "Receipts",
          link: "/cash/payment/customer",
          perm: "cash.receipts",
        },
        {
          title: "Payments",
          link: "/cash/payment/vendor",
          perm: "cash.payments",
        },
        {
          title: "Reports",
          sublinks: [
            {
              title: "Customer Payments",
              link: "/cash/report/customer",
              perm: "cash.report.customer",
            },
            {
              title: "Vendor Payments",
              link: "/cash/report/vendor",
              perm: "cash.report.vendor",
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
        },
        {
          title: "Reports",
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
          ],
        },
      ],
    },
    {
      title: "Goods & Services",
      perm: "Goods & Services--Goods & Services",
      icon: "local_offer",
      perm: "items",
      sublinks: [
        {
          title: "Add Part",
          link: "/ic/add/part",
          perm: "items.part",
        },
        {
          title: "Add Service",
          link: "/ic/add/service",
          perm: "items.service",
        },
        {
          title: "Reports",
          sublinks: [
            {
              title: "All Items",
              perm: "Goods & Services-All Items",
              link: "/ic/search/allitems",
              perm: "items.search.allitems",
            },
            {
              title: "Parts",
              perm: "Goods & Services-Parts",
              link: "/ic/search/parts",
              perm: "items.search.parts",
            },
            {
              title: "Services",
              perm: "Goods & Services-Services",
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
        },
        {
          title: "Messages",
          link: "/system/messages",
          perm: "system.messages",
        },
        {
          title: "Projects",
          link: "/system/projects",
          perm: "system.projects",
        },
        {
          title: "Departments",
          link: "/system/departments",
          perm: "system.departments",
        },
        {
          title: "Defaults",
          link: "/system/defaults",
          perm: "system.defaults",
        },
        {
          title: "AI Prompts",
          link: "/system/ai_prompts",
          perm: "ai.prompts",
        },
        {
          title: "Templates",
          link: "/system/templates",
          perm: "system.templates",
        },
        {
          title: "Taxes",
          link: "/system/taxes",
          perm: "system.taxes",
        },
        {
          title: "Chart Of Accounts",
          perm: "system.chart",
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
          ],
        },
        {
          title: "Bank Accounts",
          link: "/system/bank",
          perm: "system.bank",
        },
        {
          title: "Audit",
          link: "/system/audit",
          perm: "system.audit",
        },
        {
          title: "Batch Jobs",
          link: "/system/batch",
          perm: "system.batch",
        },
        {
          title: "Year End",
          link: "/system/yearend",
          perm: "system.yearend",
        },
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
        },
        {
          title: "Customers",
          link: "/import/customer",
          perm: "import.customer",
        },
        {
          title: "Sales Invoice",
          link: "/import/ar_invoice",
          perm: "import.ar_invoice",
        },
        {
          title: "Customer Transactions",
          link: "/import/ar_transaction",
          perm: "import.ar_transaction",
        },
        {
          title: "Vendors",
          link: "/import/vendor",
          perm: "import.vendor",
        },
        {
          title: "Vendor Invoice",
          link: "/import/ap_invoice",
          perm: "import.ap_invoice",
        },
        {
          title: "Vendor Transactions",
          link: "/import/ap_transaction",
          perm: "import.ap_transaction",
        },
      ],
    },
    // Merge AI plugin menu items
    ...pluginMenu,
  ];

  return menuLinks;
};

export { getMenuLinks };
