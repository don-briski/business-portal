export interface CreatePettyCashTransactionModel {
  personId?: number;
  recipientInformation: string;
  amount: number;
  description: string;
  comment: string;
  paymentInformationBankName?: string;
  paymentInformationBankAccountNumber?: string;
  paymentInformationAccountName?: string;
  draft: boolean;
  recipient: PettyCashPaymentRecipient
  files: any[]
}

export interface UpdatePettyCashTransactionModel {
  pettyCashTransactionId: number;
  personId?: number;
  recipientInformation: string;
  amount: number;
  description: string;
  comment: string;
  paymentInformationBankName?: string;
  paymentInformationBankAccountNumber?: string;
  paymentInformationAccountName?: string;
  draft: boolean;
  recipient: PettyCashPaymentRecipient
  files: any[]
}

export interface PettyCashTransactionActivationModel {
  pettyCashTransactionId: number;
  comment: string;
  activationOption: PettyCashTransactionActivationOptions
}

export interface PettyCashTransactionFetchModel {
  pageNumber: number;
  pageSize: number;
  pettyCashCode?: string;
  startDate?: string;
  endDate?: string;
}

export enum PettyCashPaymentRecipient {
  Staff = "Staff", ThirdParty = "ThirdParty"
}

export enum PettyCashTransactionStatus {
  Draft = "Draft",
  SentForApproval = "SentForApproval",
  ReDraft = "ReDraft",
  Approved = "Approved",
  Rejected = "Rejected"
}

export enum PettyCashTransactionActivationOptions {
  Approve = "Approve", ReDraft = "ReDraft", Reject = "Reject"
}
