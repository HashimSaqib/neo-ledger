export const menuLinks = [
  {
    title: "Customers",
    icon: "people",
    perm: "customer",
    sublinks: [
      // Non-report items from AR and Customers
      {
        title: "AR Transaction",
        link: "/arap/transaction/customer",
        perm: "customer.transaction",
      },
      {
        title: "Sales Invoice",
        link: "/ar/sales-invoice",
        perm: "customer.invoice",
      },
      {
        title: "Credit Invoice",
        link: "/ar/sales-invoice?credit_invoice=1",
        perm: "customer.creditinvoice",
      },
      {
        title: "Add Customer",
        link: "/arap/customer",
        perm: "customer.addcustomer",
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
      // Non-report items from AP and Vendors
      {
        title: "AP Transaction",
        link: "/arap/transaction/vendor",
        perm: "vendor.transaction",
      },
      {
        title: "Vendor Invoice",
        link: "/ap/vendor-invoice",
        perm: "vendor.invoice",
      },
      {
        title: "Debit Invoice",
        link: "/ap/vendor-invoice?debit_invoice=1",
        perm: "vendor.debitinvoice",
      },
      {
        title: "Add Vendor",
        link: "/arap/Vendor",
        perm: "vendor.addvendor",
      },
      // Combined Reports submenu for AP & Vendors
      {
        title: "Reports",
        sublinks: [
          {
            title: "AP Transactions",
            link: "/arap/transactions/vendor",
            perm: "vendor.transactions",
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
        title: "Reconciliation",
        link: "/reconciliation",
        perm: "cash.recon",
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
        link: "/gl/reports",
        perm: "gl.transactions",
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
      { title: "Add Service", link: "/ic/add/service", perm: "items.service" },
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
    title: "Reports",
    icon: "bar_chart",
    perm: "reports",
    sublinks: [
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
        title: "Roles",
        link: "/system/roles",
        perm: "system.user.roles",
      },
      {
        title: "Employees",
        link: "/system/employees",
        perm: "system.user.employees",
      },
      {
        title: "Templates",
        link: "/system/templates",
        perm: "system.templates",
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
    ],
  },
];
