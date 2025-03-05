export const menuLinks = [
  {
    title: "Customers",
    icon: "people",
    sublinks: [
      // Non-report items from AR and Customers
      {
        title: "AR Transaction",
        link: "/arap/transaction/customer",
        perm: "AR--Transaction",
      },
      {
        title: "Sales Invoice",
        link: "/ar/sales-invoice",
        perm: "AR--Sales Invoice",
      },
      {
        title: "Credit Invoice",
        link: "/ar/sales-invoice?credit_invoice=1",
        perm: "AR--Credit Invoice",
      },
      {
        title: "Add Customer",
        link: "/arap/customer",
        perm: "Customers--Add Customers",
      },

      {
        title: "Reports",
        sublinks: [
          {
            title: "AR Transactions",
            link: "/ar/reports/transactions",
            perm: "General Ledger--Reports--Transactions",
          },
          {
            title: "Customer Search",
            link: "/arap/search/customer",
            perm: "Customers--Reports--Search",
          },
          {
            title: "Customer History",
            link: "/history/customer",
            perm: "Customers--Reports--History",
          },
        ],
      },
    ],
  },
  {
    title: "Vendors",
    icon: "storefront",
    sublinks: [
      // Non-report items from AP and Vendors
      {
        title: "Add Transaction",
        link: "/arap/transaction/vendor",
        perm: "AP--Add Transaction",
      },
      {
        title: "Vendor Invoice",
        link: "/ap/vendor-invoice",
        perm: "AP--Vendor Invoice",
      },
      {
        title: "Debit Invoice",
        link: "/ap/vendor-invoice?debit_invoice=1",
        perm: "AP--Debit Invoice",
      },
      {
        title: "Add Vendor",
        link: "/arap/Vendor",
        perm: "Vendors--Add Vendor",
      },
      // Combined Reports submenu for AP & Vendors
      {
        title: "Reports",
        sublinks: [
          {
            title: "AP Transactions",
            link: "/ap/reports/transactions",
            perm: "AP--Reports--Transactions",
          },
          {
            title: "Vendor Search",
            link: "/arap/search/vendor",
            perm: "Vendors--Reports--Search",
          },
          {
            title: "Vendor History",
            link: "/history/vendor",
            perm: "Vendors--Reports--History",
          },
        ],
      },
    ],
  },
  {
    title: "POS",
    icon: "shopping_cart",
    perm: "POS--POS",
    sublinks: [
      {
        title: "Sale",
        link: "/pos/sale",
        perm: "POS--Sale",
      },
    ],
  },
  {
    title: "Cash",
    icon: "attach_money",
    perm: "Cash--Cash",
    sublinks: [
      {
        title: "Reconciliation",
        link: "/reconciliation",
        perm: "System--Reconciliation",
      },
    ],
  },
  {
    title: "General Ledger",
    icon: "account_balance",
    perm: "General Ledger--General Ledger",
    sublinks: [
      {
        title: "Add Transaction",
        link: "/gl/add-gl",
        perm: "General Ledger--Add Transaction",
      },
      {
        title: "Reports",
        link: "/gl/reports",
        perm: "General Ledger--Reports",
      },
    ],
  },
  {
    title: "Goods & Services",
    perm: "Goods & Services--Goods & Services",
    sublinks: [
      {
        title: "Add Part",
        link: "/ic/add/part",
      },
      { title: "Add Service", link: "/ic/add/service" },
      {
        title: "Reports",
        sublinks: [
          {
            title: "All Items",
            perm: "Goods & Services-All Items",
            link: "/ic/search/allitems",
          },
          {
            title: "Parts",
            perm: "Goods & Services-Parts",
            link: "/ic/search/parts",
          },
          {
            title: "Services",
            perm: "Goods & Services-Services",
            link: "/ic/search/services",
          },
        ],
      },
    ],
  },
  {
    title: "Reports",
    icon: "bar_chart",
    perm: "Reports--Reports",
    sublinks: [
      {
        title: "Trial Balance",
        link: "/reports/trial_balance",
        perm: "Reports--Trial Balance",
      },
    ],
  },
  {
    title: "System",
    icon: "settings",
    perm: "System--System",
    sublinks: [
      {
        title: "Currencies",
        link: "/system/currencies",
        perm: "System--Currencies",
      },
      {
        title: "Projects",
        link: "/system/projects",
        perm: "System--projects",
      },
      {
        title: "Departments",
        link: "/system/departments",
        perm: "System--Departments",
      },
      {
        title: "Defaults",
        link: "/system/defaults",
        perm: "System--Defaults",
      },
      {
        title: "Chart Of Accounts",
        perm: "System--Chart Of accounts",
        sublinks: [
          {
            title: "List Accounts",
            link: "/system/chart/list",
            perl: "System--Chart Of Accounts--List Accounts",
          },
          {
            title: "Add Account",
            link: "/system/chart/addaccount",
            perl: "System--Chart Of Accounts--Add Account",
          },
        ],
      },
    ],
  },
];
