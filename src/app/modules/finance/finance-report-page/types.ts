export interface GetReportReqBody {
  StartDate?: string;
  EndDate?: string;
  asOfDate?: string;
  paginated: boolean;
  PageNumber: number;
  PageSize: number;
  BranchIds?: number[];
  assetRegisterReportFilter?: string[]
  filter?: string;
  tenantId?: string;
  Status?:
    | "Draft"
    | "ReDraft"
    | "SentForApproval"
    | "Posted"
    | "Rejected"
    | "Approved";
}

export interface GetReportResBody {
  data: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    items: any[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  status: boolean;
}

export type GetFinanceReportUrlSegment =
  | "GetAccountTransactionsReport"
  | "GetVendorCreditNoteDetailsReport"
  | "GetCreditNoteDetailsReport"
  | "GetSalesByCustomerReport"
  | "GetSalesBySalesPersonReport"
  | "GetSalesByItemReport"
  | "GetPettyCashReport"
  | "GetPaymentsMadeReport"
  | "GetPaymentsReceivedReport"
  | "GetExpenseReport"
  | "GetExpenseByCategoryReport"
  | "GetFinanceActivityLogReport"
  | "GetInvoiceDetailsReport"
  | "GetBillAgingDetailsReport"
  | "GetBillAgingSummaryReport"
  | "GetInvoiceAgingDetailsReport"
  | "GetInvoiceAgingSummaryReport"
  | "CashAdvanceSummary"
  | "ReconciliationSummary"
  | "AccountSummary"
  | "AccountDetails"
  | "purchases/vendors"
  | "purchases/items"
  | "GetCustomerBalancesReport"
  | "GetVendorBalancesReport"
  | "GetBillDetailsReport"
  | "GetCreditRefundReport"
  | "GetAssetSchedule"
  | 'AssetRegisterReport'
  | "General_Ledger"
  | 'Trial_Balance'
  | 'profit_or_loss'
  | 'balance_sheet';

type Alignment = "left" | "center" | "right";

export interface FinanceReportTableColumns {
  [key: string]: {
    name: string;
    property: string;
    class?: string;
    type?: string;
    alignment?: Alignment;
  }[];
}
