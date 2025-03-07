export type EndOfPeriod =
  | "LoanInterestIncome"
  | "InterestExpense"
  | "PlacementInterestIncome";

export interface LastPostedInterestIncomeDate {
  lastLoansInterestIncomeEndDate?: string;
  fiscalYearStartDate?: string;
}
export interface LastPostedPlacementInterestIncomeDate {
  lastPlacementInterestIncomeEndDate?: string;
  fiscalYearStartDate?: string;
}

export interface LastPostedInterestInvestmentInterestExpenseDate {
  lastInvestmentInterestExpenseEndDate?: string;
  fiscalYearStartDate?: string;
}

export type BasicDateSpoolReqParams = {
  startDate: string;
  endDate: string;
};

export type GetLoanInterestIncomeReqParams = BasicDateSpoolReqParams & {
  type?: string;
  pageNumber: number;
  pageSize: number;
};

export type InvestmentInterestExpense = {
  dateTerminated: string;
  interestDueDate: string;
  interestRateType: string;
  investmentCode: string;
  investmentExpiryDate: string;
  investmentStartDate: string;
  investmentType: string;
  investorName: string;
  maturityDate: string;
  status: string;
  terminationPenalCharge: number;
  withHoldingTax: number;
  tenor: number;
  period: number;
  periodAtTermination: number;
  netInterestRate: number;
  netInterestAtTermination: number;
  investmentTypeWithHoldingTax: number;
  investmentTenor: number;
  investmentRate: number;
  grossInterestAtTermination: number;
  grossInterestRate: number;
  initialDeposit: number;
  interestAtTermination: number;
  investmentAmount: number;
  code?: string;
};
export type LoanInterestIncome = {
  loanCode: string;
  branch: string;
  customerName: string;
  loanAmount: number;
  feesCharged: string;
  disbursedAmount: string;
  loanTenor: string;
  periodicInstallment: string;
  loanStartDate: string;
  dateDisbursed: string;
  productType: string;
  rate: string;
  status: string;
  currentPeriod: string;
  interestIncomeForPeriod: string;
  interestIncomeTillPeriod: string;
  accountClosureType: string;
  code?: string;
};

export type PlacementInterestIncome = {
  grossInterest: number;
  interest: number;
  shortTermPlacementCode: string;
  principal: number;
  tenor: number;
  interestAccrued: number;
  startDate: string;
  maturityDate: string;
  createdAt: string;
  daysTillMaturity: number;
  status: string;
  placementType: string;
  whtRate: number;
  code?: string;
};

export type GetInterestPeriodRes = {
  data: LoanInterestIncome[] | InvestmentInterestExpense[];
  items?: PlacementInterestIncome[];
  resultSummary: {
    InterestIncomeTillPeriodTotal: number;
    InterestIncomeForPeriodTotal: number;
  };
  groupedSummary: {
    totalInterestIncomeForPeriod: number;
  };
  pages: number;
  page: number;
  totalRecords: number;
  totalEntries: number;
  totalLoanAmount: number;
  queued: boolean;
};

export interface GetTotalInterestIncomeForPeriodReqParams {
  startDate: string;
  endDate: string;
  type: "Grouped";
}

export interface GetTotalInvestmentInterestExpenseForPeriodReqParams {
  startDate: string;
  endDate: string;
}

export interface TotalInterestIncomeForPeriod {
  totalInterestIncomeForPeriod?: number;
  totalNetInterestAccrued?: number;
  endDate: string;
}

export interface TotalInvestmentInterestExpenseForPeriod {
  totalGrossInvestmentInterestExpense: number;
  totalNetInvestmentInterestExpense: number;
  totalWHTInvestmentInterestExpense: number;
}

export interface PostLoansInterestIncomeQueryParams {
  data: any;
  fromDate?: string;
  toDate?: string;
  stpShortTermInterestAccruedResponses?: PlacementInterestIncome[];
  interestIncomeModel?: LoanInterestIncome[];
}

export interface PostInvestmentInterestExpenseQueryParams {
  data: TotalInvestmentInterestExpenseForPeriod[];
  fromDate?: string;
  toDate?: string;
  investmentInterestExpenseModel?: InvestmentInterestExpense[];
}

export type GroupedTransaction = {
  groupedTransactionId: number;
  code: string;
  transactionDate: string;
  debitAmount: number;
  creditAmount: number;
  reference: string;
  relatedObjectId: number;
  relatedObjectType: string;
  status: string;
  interactionType: string;
  reportsUploadUrl: string;
  branchId: number;
  branch: string;
  currencyId: number;
  currency: string;
  createdById: number;
  createdBy: string;
  createdAt: string;
  modifiedAt: string;
};

export type LedgerTransaction = {
  account: string;
  accountId: number;
  appOwnerKey: string;
  branch: string;
  branchId: number;
  createdAt: string;
  createdBy: string;
  createdById: number;
  creditAmount: number;
  currency: string;
  currencyId: number;
  debitAmount: number;
  label: string;
  ledgerTransactionId: number;
  reference: string;
  relatedObjectId: number;
  relatedObjectType: string;
  status: string;
  transactionDate: string;
};

export type PostLoansInterestIncomeDto = {
  fromDate: string;
  toDate: string;
  interestIncomeLogs?: LoanInterestIncome[];
  loanInterestBackLogs?: LoanInterestIncome[];
};
