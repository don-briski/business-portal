import { Pagination } from "../../shared/shared.types";

export type RawBankTransaction = {
  amount: number;
  transactionDate: string;
  balance: number;
  narration: string;
  type: string;
};

export type EligibilityTransactions = {
  month: string;
  totalMonthlyCredit: number;
  totalMonthlyDebit: number;
  emiCreditMultiple: number;
  emiMonthlyEligibility: string;
}

export type GetRawBankTransactionsResBody = Pagination & {
  items: RawBankTransaction[];
};

export type AffordProfile = {
  affordProfile: {
    riskCategory: string;
    bank: {
      sortCode: string;
      accountNumber: string;
    };
    location: string;
    quikCheck: boolean;
    bankStatementSpoolDate: string;
    bankStatementLengthMonths: number;
    firstDateInBankStatement: string;
    lastDateInBankStatement: string;
    mostRepaymentAmountPerMonth: number;
    totalRepaymentAmountPerMonth: number;
    estimateMonthlyRepayments: number;
    rawBankSpoolData: {
      spoolStartDate: string;
      bankTransactions: RawBankTransaction[];
    };
    analysedBankStatement: {
      earningClass: string;
      gamblingRate: number;
      expectedSalaryDay: number;
      confidenceIntervalOnSalaryDetection: number;
      salaryTransactions: {
        amount: number;
        transactionDate: string;
        isValidTransaction: boolean;
      }[];
      monthlyAverageBankChargeAmount: number;
      totalCreditTurnover: number,
      averageCredit: number,
      totalReccuringExpense: number,
      averageReccuringExpense: number,
      calulatedEstimateMonthlyInstallment: number,
      calculatedEligibilityResult: {
        eligibilityTransactions: EligibilityTransactions[],
        emiEligibilityStatus: string
      }

    };
    narrationCipherOutcome: string;
    narrationCipherOutcomeDetails: string;
    accountCipherOutcome: string;
    accountActivityCipherOutcomeDetails: {
      failPoint: string;
      tmi: number;
      passRate: number;
      threeMonthsPassCount: number;
      monthlyAverageBankChargeAmount: number;
      monthResult: {
        isPassed: boolean;
        month: string;
        countCredit: number;
        inflowSum: number;
        outflowSum: number;
        variance: number;
      }[];
    };
    incomeCipherOutcome: string;
    incomeCipherOutcomeDetails: {
      failPoint: string;
      confidenceInterval: number;
      salaryCalculationType: string;
      salaryReductionPCT: number;
      expectedSalaryDay: number;
      derivedSalaryDay: number;
      expectedSalary: number;
      derivedSalary: number;
      salaryVariance: number;
      detectedSalaries: number;
      allXMonthsHaveSameSalarayDay: boolean;
      salaryTransactions: {
        month: number;
        amount: number;
      }[];
      salaryTransactionsConsideredBasedOnRecncyConfig: {
        month: number;
        amount: number;
      }[];
    };
    derivedSalary: number;
    sweeperCipherOutcome: string;
    sweeperCipherOutcomeDetails: {
      failPoint: string;
      isSweeper: boolean;
      isRecentSweeper: boolean;
      sweepScore: number;
      sweeperCipherCalculatedValues: {
        configBalanceThreshold: number;
        salaryTransactionsWithSweepTags: {
          salaryDate: string;
          salaryDateUsedForCalculation: string;
          checkDate: string;
          checkDateUsedForCalculation: string;
          initialBalance: number;
          balanceOnConfigCheckDate: number;
          tag: string;
        }[];
      };
    };
    loanLimitOutcome: string;
    loanLimitAmount: number;
    loanLimitCipherCalculatedLimitAmount: number;
    loanLimitCipherOutcomeDetails: {
      loanLimitFailPoint: string;
      loanLimitCipherCalculationParameters: {
        repayment: number;
        tmi: number;
        interestRate: number;
        dti: number;
        maxTenor: number;
        minLoanAmount: number;
      };
    };
    responseCode: string;
    status: string;
    lastUpdatedTime: string;
  };
  bvn: string;
  name: string;
};

export enum CheckoutReportType {
  "TRANSACTION" = "TRANSACTION",
}
