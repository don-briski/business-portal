import { FormControl } from "@angular/forms";

export type PaystackInfo = {
  integrationName: string;
  apiPublicKey: string;
  apiSecretKey: string;
  appOwnerId: number;
  isActive: boolean;
  financeAccountId: number;
};

export type PaystackFormReqBody = {
  secretKey: string;
  publicKey: string;
};

export type DisbursementPartnersResBody = {
  items: {
    integrationName: string;
    financeAccountId: number;
    financeAccount: {
      accountId: number;
      name: string;
      reference: number;
      isReferenceAutoIncremented: boolean;
      transactionType: number;
      heirarchyLevel: number;
      accountType: number;
      isPostingAccount: true;
      createdById: number;
      parentId: number;
      isGroupAccount: boolean;
      isSystemAccount: boolean;
      isActive: boolean;
      accountClassifications: [];
      ledgerTransactions: [];
      isHeader: boolean;
      createdAt: string;
    };
  }[];
};

export type VerifyBankAccount = {
  accountNumber: string;
  sortCode: string;
};

export type VerifyBankAccountRes = {
  accountNumber: string;
  accountName: string;
};
