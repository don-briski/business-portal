export type AddEditPettyCashTransactionReqBody = {
  requestedBy: number;
  recipient: string;
  staffId: string;
  amount: number;
  paidThroughAccountId: string;
  sourceAccountId: string;
  transactionDate: string;
  paymentInformationBankName: string;
  recipientInformation: string;
  paymentInformationBankSortCode: string;
  paymentInformationBankAccountNumber: string;
  paymentInformationAccountName: string;
  description: string;
  comment: string;
  draft: boolean;
  pettyCashTransactionId?: string;
  files?: File[];
  existingFiles?: string[];
};

export interface PettyCashTransactionActivationModel {
  pettyCashTransactionId: number;
  comment: string;
  activationOption: PettyCashTransactionActivationOptions;
  transactionPin: string;
}

export interface PettyCashTransactionFetchModel {
  resultExpectedType: ResultExpectedType;
  pageNumber: number;
  pageSize: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export enum PettyCashRecipient {
  Staff = "Staff",
  Others = "Others",
}

export enum PettyCashTransactionStatus {
  Draft = "Draft",
  SentForApproval = "SentForApproval",
  ReDraft = "ReDraft",
  Posted = "Posted",
  Rejected = "Rejected",
  Reconciled = "Reconciled",
  AwaitingReconciliation = "AwaitingReconciliation",
  PartialReconciliation = "PartialReconciliation",
  AwaitingReconciliationApproval = "AwaitingReconciliationApproval",
}

export enum PettyCashTransactionActivationOptions {
  Approve = "Approve",
  ReDraft = "ReDraft",
  Reject = "Reject",
}

export enum ResultExpectedType {
  Open = "Open",
  Closed = "Closed",
  All = "All",
}

export type PettyCash = {
  accountManagerId: number;
  actualPettyCashReceiptDate: string;
  amount: number;
  appOwnerKey: string;
  balance: number;
  branchId: number;
  comments: {
    comment: string;
    dateCreated: string;
    name: string;
  }[];
  createdAt: string;
  createdBy: string;
  createdById: number;
  creditAccount: string;
  creditAccountId: number;
  currencyId: number;
  description: string;
  expenseAccount: string;
  expenseAccountId: number;
  files: [];
  modifiedAt: string;
  paidThroughAccount: string;
  paidThroughAccountId: number;
  paymentInformation: {
    bankName: string;
    bankSortCode: string;
    bankAccountNumber: string;
    accountName: string;
  };
  personId: number;
  pettyCashTransactionId: number;
  recipient: string;
  recipientInformation: string;
  reviewComments: [];
  sourceAccount: string;
  sourceAccountId: number;
  staffAccount: string;
  staffAccountId: number;
  status: string;
  transactionCode: string;
  transactionDate: string;
};
