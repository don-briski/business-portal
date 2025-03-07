import { CustomDropDown } from "src/app/model/CustomDropdown";
import { LendaFile, Pagination } from "../shared/shared.types";
import { AppActivity } from "./types/app-activity.interface";

export enum InvoiceStatus {
  Draft = "Draft",
  SentForApproval = "SentForApproval",
  Posted = "Posted",
}

export type Tax = {
  accountId: number;
  accountName: string;
  createdAt: string;
  createdByUserId: number;
  financeTaxId: number;
  isActive: boolean;
  lastModifiedByUserId: number;
  name: string;
  type: "Sales" | "Purchase" | "Both";
  value: number;
};

export type GetTaxesResBody = Pagination & {
  items: Tax[];
};

export type FinanceItem = {
  accountId?: number;
  accountName?: string;
  amount: number;
  financeTaxId?: number;
  financeTaxName?: string;
  financeTaxValue?: number;
  id: number;
  itemType?: "ExpenseItem" | "AssetItem";
  text: string;
  code: string;
};

export type COAImport = {
  AccountId: number;
  AccountName: string;
  CreditAmount: number;
  DebitAmount: number;
  Reference: number;
};

export type COAPosting = {
  accountId: number;
  accountName: string;
  creditAmount: number;
  debitAmount: number;
};

export type PostingAccount = {
  accountId: number;
  accountName: string;
  accountType: string;
  credit: number;
  debit: number;
};

export enum FinanceStatus {
  Draft = "Draft",
  Redraft = "Redraft",
  SentForApproval = "SentForApproval",
  Posted = "Posted",
  Rejected = "Rejected",
}

export type GetInvoicesQueryParams = {
  pageNumber?: number;
  pageSize?: number;
  customerId?: number;
  selectedSearchColumn?: string;
  keyword?: string;
  statusFilter?: {
    operator?: "Or" | "And";
    paymentStatuses?: string[];
    status?: string[];
  };
};

export type Invoice = {
  amount: number;
  balanceDue: number;
  code: string;
  createdAt: string;
  customer: string;
  customerId: number;
  id: number;
  invoiceDate: string;
  invoiceDueDate: string;
  status: string;
  paymentStatus: string;
  reference?: string;
};

export type GetInvoicesResBody = Pagination & {
  items: Invoice[];
};

export type InvoiceDetails = {
  invoiceId: number;
  branchId: number;
  customerId: number;
  customer: string;
  invoiceCode: string;
  invoiceDate: string;
  invoiceDueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
  subTotal: number;
  amountAfterDiscountForLineLevelDiscount: number;
  taxTotalAmount: number;
  discountAmount: number;
  currencyId: number;
  paymentTermId: number;
  salesPersonId: number;
  createdById: number;
  approvalHandlerId: number;
  discountAfterTax: false;
  discountLevel: DiscountLevel;
  taxOption: TaxOption;
  datePosted: string;
  paymentStatus: PaymentStatus;
  totalAmountPaid: number;
  totalCreditsApplied: number;
  balanceDue: number;
  isOverdue?: string;
  comments: [];
  lines: {
    invoiceLineId: number;
    invoiceId: number;
    itemId: number;
    itemName: string;
    assetId: number;
    itemType: ItemType;
    accountId: number;
    account: {
      name: string;
      accountId: number;
      reference: number;
      parentId: number;
      isAutoIncremented: boolean;
    };
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    discountAmount: number;
    discountType: string;
    subTotalAmount: number;
    amountAfterDiscount: number;
    amountAfterTax: number;
    totalAmount: number;
  }[];
  credits: [];
  payments: [];
  files: LendaFile[];
  createdAt: string;
  modifiedAt: string;
};

export enum FinancePersonType {
  FinanceCustomer = "FinanceCustomer",
  FinanceVendor = "FinanceVendor",
}
export type Payment = {
  financePaymentId: number;
  status: string;
  paymentAmount: number;
  paymentCode: string;
  paymentMadeDate: string;
  personId: number;
  personName: string;
  paidThroughAccountName: string;
  paymentModeName: string;
};


export type GetPaymentResBody = {
  data: FinancePayment;
};

export type GetPaymentsReqBody = {
  pageNumber: number;
  pageSize: number;
  filter: "Bill" | "Invoice";
  status?: string[];
};

export type GetPaymentsResBody = Pagination & {
  items: Payment[];
};

export type FinanceCustomer = {
  createdAt: string;
  financePersonCode: string;
  id: number;
  fullName: string;
  phoneNumber: string;
  branchId: number;
  isOrganisation: boolean;
  emailAddress: string;
  isActive: boolean;
};

export type GetCustomersResBody = Pagination & {
  items: FinanceCustomer[];
};

export type PaymentMadeLine = {
  amountAllocated: number;
  amountExpected: number;
  appOwnerKey: string;
  billCode: string;
  billId: number;
  createdAt: string;
  financePaymentId: number;
  financePaymentLineId: number;
  isPosted: boolean;
  whtAmount: number;
};

export type FinancePayment = {
  financePaymentId: number;
  paidThroughAccountName: string;
  paymentAmount: number;
  paymentCode: string;
  paymentMadeDate: string;
  paymentModeName: string;
  personId: number;
  personName: string;
  status: string;
  approvedOrRejectedBy: string;
  createdAt: string;
  createdBy: string;
  createdById: number;
  currencyId: number;
  files: [];
  financePaymentStatusCommentData: [];
  modifiedAt: string;
  modifiedBy: string;
  paidThroughAccountId: number;
  paymentBankCharges: number;
  paymentDeleteStatus: boolean;
  paymentModeId: number;
  personAddress: string;
  taxAccountName: string;
  paymentLines: PaymentMadeLine[];
  appActivities: AppActivity[];
};

export type GetPaymentsMadeResBody = Pagination & { items: FinancePayment[] };

export type FinancePersonImportReqBody = {
  financePersonType: FinancePersonType;
  file: File;
  isBalanceUpload?: boolean;
};

export type FinancePersonImportResBody = {
  message: string;
};

export enum FinanceTabs {
  all = "all",
  open = "open",
  closed = "closed",
}
