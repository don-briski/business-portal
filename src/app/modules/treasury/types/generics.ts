export type VerifyBankAccount = {
  accountNumber: string;
  sortCode: string;
};

export type InvestmentTypeAdditionalInfo = {
  minInterest: number;
  maxInterest: number;
  maxAmount: number;
  minAmount: number;
  maxTenor: number;
  minTenor: number;
};
