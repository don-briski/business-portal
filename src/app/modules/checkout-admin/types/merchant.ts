import { GetDataQueryParams, Pagination } from "../../shared/shared.types";

export type MerchantDetails = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  bankName: string;
  accountNumber: string;
  maxLoanAmount: number;
  commission: number;
  callBackUrl: string;
  redirectUrl?: string;
  logoUrl: string;
  isActive: "Active" | "Inactive";
  status: "Active" | "Inactive";
  downPaymentRequired: boolean;
  registrationNumber: string;
  hasInterestRate: boolean;
  hasCommission: boolean;
  hasMaximumLoanAmount: boolean;
  interestRate: number;
  downPaymentRate: number;
  isBankAccountValidated: boolean;
  notes: string;
  bankAccountName: string;
  billingAddress: BillingAddress;
  autoDeclineConfiguration: AutoDeclineConfiguration;
};

export type Merchant = {
  createdAt: string;
  id: number;
  email: string;
  status: "Active" | "Inactive";
  name: string;
  phoneNumber: string;
  successfulApplications: number;
};

export type GetMerchantsResBody = Pagination & {
  items: Merchant[];
};

export type LimitedMerchantData = {
  merchantId: number;
  merchantName: string;
};

export type GetAllMerchantsResBody = {
  data: LimitedMerchantData[];
};

export type MerchantTransaction = {
  checkoutTransactionId: string;
  commisionEarned: number;
  createdAt: string;
  approvedDate: string;
  customerName: string;
  customerEmail: string;
  merchantName: string;
  modifiedAt: string;
  customerPhoneNumber: string;
  productDetails: string[];
  transactionAmount: number;
  loanAmount: number;
  itemsPurchased: string;
  status: string;
  stage: string;
};

export type GetMerchantTransactionsQueryParams = GetDataQueryParams & {
  startDate?: string;
  endDate?: string;
}

export type GetMerchantTransactionsResBody = Pagination & {
  items: MerchantTransaction[];
};

export type GetMerchantCommissionsQueryParams = GetDataQueryParams & {
  month?: number;
  merchantId?: string;
};

export type MerchantCommission = {
  id: number;
  periodStartDate: string;
  periodEndDate: string;
  code: string;
  transactionCount: number;
  paymentDate: string;
  settledBy: string;
  status: string;
  merchant: string;
  totalCommissionsAmount: 5419.5;
};

export type GetMerchantCommissionsResBody = Pagination & {
  items: MerchantCommission[];
};

export interface BillingAddress {
  address: string;
  city: string;
  state: string;
  country: string;
  stateId: number;
  countryId: number;
  houseNumber?: string;
}

export interface AutoDeclineConfiguration {
  autoDeclineByCategory: {isEnabled: boolean, categories: string[]},
  autoDeclineByEarningClass: {isEnabled: boolean, earningClasses: string[]},
}

