import { FinanceReportTypes } from "./finance-type.enum";

export const FinanceReportLists = {
  allReports: [
    { 
      parent: 'Business Overview',
      children: [
        {
          name: 'Profit or Loss',
          type: FinanceReportTypes.ProfitLossReport
        },
        {
          name: 'Balance Sheet',
          type: FinanceReportTypes.BalanceSheetReport
        }
      ]
    },
    {
      parent: "Sales",
      children: [
        {
          name: "Sales By Customer",
          type: FinanceReportTypes.SalesByCustomerReport,
        },
        {
          name: "Sales By Salesperson",
          type: FinanceReportTypes.SalesBySalespersonReport,
        },
        {
          name: "Sales By Item",
          type: FinanceReportTypes.SalesByItemReport,
        },
      ],
    },
    {
      parent: "Purchases and Expenses",
      children: [
        {
          name: "Expenses Report",
          type: FinanceReportTypes.ExpensesReport,
        },
        {
          name: "Expenses By Category",
          type: FinanceReportTypes.ExpensesByCategoryReport,
        },
        {
          name: "Purchases By Vendor",
          type: FinanceReportTypes.PurchasesByVendorReport,
        },
        {
          name: "Purchases By Item",
          type: FinanceReportTypes.PurchasesByItemReport,
        },
      ],
    },
    {
      parent: "Receivables",
      children: [
        {
          name: "Customer Balances",
          type: FinanceReportTypes.CustomerBalancesReport,
        },
        {
          name: "Invoice Details",
          type: FinanceReportTypes.InvoiceDetailsReport,
        },
        {
          name: "Invoice Aging Details",
          type: FinanceReportTypes.InvoiceAgingDetailsReport,
        },
        {
          name: "Invoice Aging Summary",
          type: FinanceReportTypes.InvoiceAgingSummaryReport,
        },
      ],
    },
    {
      parent: "Payables",
      children: [
        {
          name: "Vendor Balances",
          type: FinanceReportTypes.VendorBalancesReport,
        },
        {
          name: "Vendor Credit Note Details",
          type: FinanceReportTypes.VendorCreditNoteDetails,
        },
        {
          name: "Bill Aging Details Report",
          type: FinanceReportTypes.BillAgingDetailsReport,
        },
        {
          name: "Bill Aging Summary",
          type: FinanceReportTypes.BillAgingSummaryReport,
        },
        {
          name: "Bills Details",
          type: FinanceReportTypes.BillDetailsReport,
        },
      ],
    },
    {
      parent: "Payment",
      children: [
        { name: "Payment Made", type: FinanceReportTypes.PaymentsMadeReport },
        {
          name: "Payment Received",
          type: FinanceReportTypes.PaymentsReceivedReport,
        },
        {
          name: "Credit Note Details",
          type: FinanceReportTypes.CreditNoteDetails,
        },
        { name: "Credit Refund", type: FinanceReportTypes.CreditRefundReport },
      ],
    },
    {
      parent: "Accountant",
      children: [
        {
          name: "Trial Balance",
          type: FinanceReportTypes.TrialBalanceReport,
        },
        {
          name: "Account Transactions",
          type: FinanceReportTypes.AccountTransactionsReport,
        },
        {
          name: "Account Summary",
          type: FinanceReportTypes.AccountSummary,
        },
        {
          name: "General Ledger",
          type: FinanceReportTypes.GeneralLedgerReport,
        },
        {
          name: "Cash Advance",
          type: FinanceReportTypes.CashAdvanceReport,
        },
        {
          name: "Cash Advance Reconciliation Summary",
          type: FinanceReportTypes.ReconciliationSummary,
        },
        {
          name: "Petty Cash",
          type: FinanceReportTypes.PettyCashReport,
        },
      ],
    },
    {
      parent: "Assets",
      children: [
        {
          name: "Assets Schedule Report",
          type: FinanceReportTypes.AssetScheduleReport,
        },
        {
          name: "Asset Register Report",
          type: FinanceReportTypes.AssetRegisterReport,
        },
      ],
    },
    {
      parent: "Activity",
      children: [
        {
          name: "Activity Log Report",
          type: FinanceReportTypes.ActivityLogReport,
        }
      ],
    },
  ],
};
