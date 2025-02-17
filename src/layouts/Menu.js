export const menuLinks = [
  {
    title: "Dashboard",
    icon: "dashboard",
    link: "/",
  },
  {
    title: "AR",
    perm: "AR--AR",
    sublinks: [
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
        title: "Reports",
        perm: "AR--Reports",
        sublinks: [
          {
            title: "Transactions",
            link: "/ar/reports/transactions",
            perm: "General Ledger--Reports--Transactions",
          },
        ],
      },
    ],
  },
  {
    title: "Customers",
    perm: "Customers--Customers",
    sublinks: [
      {
        title: "Add Customer",
        link: "/arap/customer",
        perm: "Customers--Add Customers",
      },
      {
        title: "Reports",
        perm: "Customers--Reports",
        sublinks: [
          {
            title: "Search",
            link: "/arap/search/customer",
            perm: "Customers--Reports--Search",
          },
        ],
      },
    ],
  },
  {
    title: "POS",
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
    title: "AP",
    perm: "AP--AP",
    sublinks: [
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
        title: "Vendor Invoice",
        link: "/ap/vendor-invoice?debit_invoice=1",
        perm: "AP--Dredit Invoice",
      },
      {
        title: "Reports",
        perm: "AP--Reports",
        sublinks: [
          {
            title: "Transactions",
            link: "/ap/reports/transactions",
            perm: "AP--Reports--Transactions",
          },
        ],
      },
    ],
  },
  {
    title: "Vendors",
    perm: "Vendors--Vendors",
    sublinks: [
      {
        title: "Add Vendor",
        link: "/arap/Vendor",
        perm: "Vendors--Add Vendor",
      },
      {
        title: "Reports",
        perm: "Vendors--Reports",
        sublinks: [
          {
            title: "Search",
            link: "/arap/search/vendor",
            perm: "Vendors--Reports--Search",
          },
        ],
      },
    ],
  },
  {
    title: "Cash",
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
    title: "Reports",
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
    perm: "System--System",
    sublinks: [
      {
        title: "Currencies",
        link: "/system/currencies",
        perm: "System--Currencies",
      },
      {
        title: "Defaults",
        link: "/system/defaults",
        perm: "System--Defaults",
      },
    ],
  },
];
