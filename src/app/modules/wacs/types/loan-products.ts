import { ApplicableFee } from "../../loan-section/loan.types";

export type CreateLoanProductReq = {
  loanTypeId: number;
  description: string;
  productImageUrl?: string;
  productName: string;
  category: string;
  moratoriumPeriod: number;
  paybackPeriod: number;
  feature?: string[];
  status: string;
  amountTo: number;
  amountFrom: number;
  interestRate: number;
  applicableFees: ApplicableFee[];
  wacsLoanProductId?: number;
};

export type LoanProduct = {
  productCode: string;
  loanTypeName: string;
  loanTypeId: string;
  productName: string;
  description: string;
  category: string;
  paybackPeriod: number;
  moratoriumPeriod: number;
  feature: string[];
  features: string[];
  status: LoanProductStatus;
  amountTo: number;
  amountFrom: number;
  interestRate: number;
  createdAt: string;
  productId: string;
  id: number;
  applicableFees: ApplicableFee[];
};

export enum LoanProductStatus {
  "Active" = "Active",
  "NonActive" = "NonActive",
}

export type ActivateOrDeactivateLoanProduct = {
  wacsLoanProductId: number;
  status: LoanProductStatus;
};

export type WacsTransaction = {
  id: number;
  wacsCustomerId: number;
  firstName: string;
  middleName: string;
  lastName: string;
  status: string;
  wacsLoanId: string;
  transactionCode: string;
  wacsLoanProductId: number;
  wacsLoanProduct: string;
  loanId: number;
  loanAmount: number;
  createdAt: string;
};
export type WacsLoanApplicationReq = {
  wacsCustomerId: number;
  wacsLoanProductId: number;
  amount: number;
  currentSalary: number;
};

export type WacsDisbursementConfirmation = {
  reference: string;
  amount: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
  isPaid: string;
  loanId: number;
  createdAt: string;
};

export type WacsTransactionDetails = WacsTransaction & {
  phoneNumber: string;
  productName: string;
  paybackPeriod: number;
  createdBy: string;
  soldBy: string;
  invoiceInfo: {
    reference: string;
    amount: number;
    accountNumber: string;
    accountName: string;
    bankName: string;
    isPaid: string;
    loanId: number;
    createdAt: string;
  };
};
