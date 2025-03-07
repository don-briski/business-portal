import { FormArray, FormControl, FormGroup } from "@angular/forms";
import { CustomerStatusEnum } from "./components/afford/profiles/profiles_data";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { BasicListResponse } from "../shared/shared.types";

export type RiskAssmntConfigForm = {
  runKYCCheck: FormControl<boolean>;
  loanTypeExceptions: FormControl<string[]>;
  creditProfileRecencyThresholdInDays: FormControl<number>;
  creditFileRecencyThresholdInDays: FormControl<number>;
  openLoanFilter: FormControl<string>;
  closedLoanAgeThresholdInDays: FormControl<number>;
  filters: FormArray;
};

export type BankCheckConfig = {
  bankStatementLengthMonths: number;
  bankCheckService: string;
};

export type CALoanConfiguration = {
  autoDecline: boolean;
  noBankCheck: boolean;
  limitThresholdAmount: number;
  minIncomeAmount: number;
  minLoan: number;
  maxLoan: number;
  maxDTI: number;
  instalmentMultiplier: number;
  maxTenor: number;
  interestRate: number;
  useSecondaryRoute: boolean;
  route?: string;
  // autoDeclineByEarningClass?: {isEnabled: boolean, earningClasses: string[]}
};

export type LoanConfig = {
  "CAT A": {
    loanConfiguration: CALoanConfiguration;
  };
  "CAT B": {
    loanConfiguration: CALoanConfiguration;
  };
  "CAT C": {
    loanConfiguration: CALoanConfiguration;
  };
  "CAT D": {
    loanConfiguration: CALoanConfiguration;
  };
  "CAT E": {
    loanConfiguration: CALoanConfiguration;
  };
};

export type CreditAffordabilityConfig = {
  loanConfig: LoanConfig;
  bankCheckConfiguration: {
    bankCheckService: number;
    bankStatementLengthMonths: number;
  };
  narrationCipherConfiguration: {
    checkChipher: boolean;
    periodThreshold: number;
    targetWords: string[];
  };
  accountActivityCipherConfiguration: {
    minInflowsCount: number;
    passRate: number;
  };
  incomeCipherConfiguration: {
    salaryDateOffset: number;
    salaryCalculatorMethod: number;
    salaryAdjustment: number;
    salaryAdjustmentFlatTypePercentageValue: number;
    rangedAdjustmentConfig: {
      r1: number;
      r2: number;
      r3: number;
      r4: number;
      r5: number;
    };
    salaryDateRecencyCheck: number;
  };
  accountSweepCipherConfiguration: {
    daysPostSalary: number;
    balanceThreshold: number;
    sweeperThreshold: number;
    sweepPeriodCheck: number;
  };
};

export type LoanConfigFormControls = {
  key: FormControl<string>;
  title: FormControl<string>;
  noBankCheck: FormControl<boolean>;
  autoDecline: FormControl<boolean>;
  limitThresholdAmount: FormControl<number | null>;
  minIncomeAmount: FormControl<number | null>;
  minLoan: FormControl<number | null>;
  maxLoan: FormControl<number | null>;
  maxDTI: FormControl<number | null>;
  instalmentMultiplier: FormControl<number | null>;
  maxTenor: FormControl<number | null>;
  interestRate: FormControl<number | null>;
  useSecondaryRoute: FormControl<boolean | null>;
  route?: FormControl<string | CustomDropDown[] | null>;
  // earningClassesToDecline?: FormControl<string | CustomDropDown[] | null>;
  // autoDeclineByEarningClassIsTrue?: FormControl<boolean | null>;
  // autoDeclineByEarningClassCategories?: FormControl<string[] | null>;
};

export type LoanConfigForm = {
  categories: FormArray<FormGroup<LoanConfigFormControls>>;
};

export type NarrationCipherReqBody = {
  checkCipher: boolean;
  periodThreshold: number;
  targetWords: string[];
};

export type AccActivityCipherReqBody = {
  minInflowsCount: number;
  passRate: number;
};

export enum SalaryAdjustmentEnum {
  NoAdjustment = "NoAdjustment",
  FlatAdjustment = "FlatAdjustment",
  RangedAdjustment = "RangedAdjustment",
}

export type IncomeCipherReqBody = {
  salaryDateOffset: number;
  salaryCalculatorMethod: string;
  salaryAdjustment: SalaryAdjustmentEnum;
  salaryAdjustmentFlatTypePercentageValue: number;
  rangedAdjustmentConfig: {
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    r5: number;
  };
  salaryDateRecencyCheck: number;
};

export type AccSweeperCipherReqBody = {
  daysPostSalary: number;
  balanceThreshold: number;
  sweeperThreshold: number;
  sweepPeriodCheck: number;
};

export type GambleCheck = {
  checkGamblingRate: boolean;
  gamblingRateCheckApplication: string;
  gamblingRate: number;
};

export type OpenLoanFilter = {
  attribute: string;
  operator: string;
  value: string;
};

export type RiskAssessmentReqBody = {
  runKycCheck: boolean;
  loanTypeExceptions: string[];
  creditProfileRecencyThresholdInDays: number;
  creditFileRecencyThresholdInDays: number;
  openLoanFilter: OpenLoanFilter[];

  closedLoanAgeThresholdInDays: number;
  creditHistoryThresholdInYears: number;
};

export type AffordProfileCustomer = {
  checkoutCustomerId: number;
  customerName: string;
  status: CustomerStatusEnum;
  category: string;
  hasAffordProfile: boolean;
  hasCreditFile: boolean;
  hasCreditProfile: boolean;
  bvn: string;
  createdAt: string;
  lastUpdated: string;
};

export enum CreditAffordModeEnum {
  Edit,
  View,
  Configure,
  None,
}

export type VerifyAccNumberResBody = {
  account_number: string;
  account_name: string;
};

export type CustomerCreditFileLoan = {
  accountNumber: string;
  accountStatus: string;
  currentBalance: number;
  installmentAmount: number;
  isExempted: true;
  lastUpdated: string;
  loanClosedDate: string;
  loanDuration: number;
  loanOpenDate: string;
  maxDelinquencyInDays: number;
  openingBalanceAmount: number;
  performanceStatus: string;
  recencyInYears: number;
  repaymentFrequency: string;
};

export type CustomerCreditFile = {
  bvn: string;
  name: string;
  creditFile: {
    lastUpdated: string;
    loans: CustomerCreditFileLoan[];
    openLoans: CustomerCreditFileLoan[];
    closedLoans: CustomerCreditFileLoan[];
  };
};

export type CustomerCreditProfile = {
  dfO1: number;
  dfO2: number;
  ola: number;
  cld: number;
  olc: number;
  maxLoanAmount: number;
  highestInstallmentAmount: number;
  totalInstallmentAmount: number;
  olaTargetLoan: string;
  subCategory: number;
  openLoanCount: number;
  closedLoanCount: number;
  cldTargetLoan: string;
  outlierLoansCount: number;
  lastUpdatedTime: string;
};

export type GetCustomerCreditProfileResBody = {
  data: {
    creditProfile: CustomerCreditProfile;
    bvn: string;
    name: string;
  };
};

export type InviteMerchantStaffReqBody = {
  emailAddress: string;
  loginURL: string;
  merchantName: string;
  merchantId: number;
};

export type SpoolMerchantReport = {
  start?: string;
  end?: string;
  pageNumber?: number;
  pageSize?: number;
  merchantId?:string;
};

export type MerchantReport = {
  merchantName: string;
  checkoutTransactionId: string;
  dateStarted: string;
  customerName: string;
  customerEmail: string;
  requestedAmount: number;
  verificationRoute: string;
  stage: string;
  commissionAmount: number;
  loanAmount:number;
  depositAmount:number;
  dateCompleted: string;
  riskCategory: string;
  repaymentMethod: string;
  referralCode: string;
  recordEntryMedium: string;
};

export type MerchantReportRes = BasicListResponse<MerchantReport>

export enum MerchantTransactionStage {
  Verification = "Verification",
  PhoneNumberSelection = "PhoneNumberSelection",
  VerificationComplete = "VerificationComplete",
  CreditRiskAnalysis = "CreditRiskAnalysis",
  CreditRiskAnalysisComplete = "CreditRiskAnalysisComplete",
  LoanOfferCalculationComplete = "LoanOfferCalculationComplete",
  LoanOfferAccepted = "LoanOfferAccepted",
  LoanOfferRejected = "LoanOfferRejected",
  DownPaymentInitiated = "DownPaymentInitiated",
  DownPaymentFailed = "DownPaymentFailed",
  LoanCreated = "LoanCreated"
}
