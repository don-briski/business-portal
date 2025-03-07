import { LoanType } from "../modules/loan-section/loan.types";
import { Person } from "./person";

export class Configuration {
  loanId: any;
  loanCode: any;
  employmentCode: any;
  customer: any;
  branchName: any;
  employerName: any;
  periodicRepaymentAmount: any;
  totalRepaymentOutstanding: any;
  applicationCode: any;
  loanAmount: any;
  person: Person;
  customerName: any;
  loanTenor: any;
  repaymentScheduleType: any;
  createdAt: string;
  loanType: Loan;
  reviewClaimer: Reviewer;
  personId: number;
  dateApproverApproved: string;
  loanStage: string;
  createdByName: string;
  status: string;
  createdBy: string;
}

export type ModifiedConfiguration = Configuration & { selected: boolean };

/**
 * @deprecated this method should is deprecated use Loan form loan.types.ts
 */
export class Loan {
  loanId: number;
  loanCode: string;
  applicationCode: string;
  customerName: string;
  loanAmount: number;
  disbursedAmount: number;
  fees: number;
  totalFees: number;
  buyOverAmount: number;
  lastLoanEntryId: number;
  lastApplicationEntryId: number;
  identifier: string;
  creditScore: number;
  remitaLoanInformation: number;
  isRemitaDisbursementSentNotificationSuccessful: boolean;
  isRemitaStopLoanCollectionSentNotificationSuccessful: boolean;
  loanTenor: number;
  loanTypeId: number;
  loanType: LoanType;
  loanBatchId: number;
  loanDisbursementId: number;
  disbursementClaimedById: number;
  status: number;
  reviewClaimedById: number;
  stateId: number;
  state: string;
  soldBy: number;
  createdBy: number;
  branchId: number;
  personId: number;
  dateApproverClaimed: string;
  dateApproverApproved: string;
  dateDisburserClaimed: string;
  dateRepaymentApproved: string;
  dateDisbursed: string;
  dateDisbursementConfirmed: string;
  loanStartDate: string;
  redraftFrequency: number;
  redraftReasons: [];
  redraftReasonsList: [];
  appOwnerKey: string;
  isBulkUploaded: boolean;
  recordEntryMedium: string;
  disbursementTrailCount: number;
  payment: [];
  files: [];
  loanRedraftLogs: [];
  totalAmountExpected: string;
  totalAmountPaid: number;
  calculatedEffectiveSettlementAmount: number;
  calculatedSettlementAmount: number;
  financeAccountId: number;
  nextRepaymentDate: string;
  nextRepaymentAmount: string;
  hashedAppplicationCode: string;
  amountRepayed: number;
  settlementAmountRepayed: number;
  totalAmountRepaid: number;
  totalAmountToBeRepayed: string;
  loanBalance: string;
  amountOutstanding: string;
  isSettled: boolean;
  repaymentMethodVerified: boolean;
  loanStage: string;
  creditScoreChecked: boolean;
  employerVerified: boolean;
  repaymentScheduleType: string;
  statusString: string;
  loanAccountStatus: string;
  disbursementUpdateStage: string;
  createdAt: string;
  modifiedAt: string;
}

export class Reviewer {
  person: Person;
}

export type RemitaSetup = {
  id: number;
  isActive: boolean;
  remitaData: RemitaData;
};

export type RemitaData = {
  remitaInfo: {
    userName: string;
    merchantID: string;
    serviceTypeID: string;
    apiKey: string;
    apiToken: string;
    isActive: boolean;
  };
  bankDetails: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
    bankName: string;
  };
};

export enum RemitaIntegrationNameEnum {
  InflightCollectionsRemita = "Inflight Collections - Remita",
  AutomaticDirectDebitRemita = "Automatic Direct Debit - Remita",
}

export type UpdateRemitaInfoData = {
  integrationName: string;
  data: RemitaData;
};

export type Integration = {
  id: number;
  isActive: true;
  emailAddress: string;
  integrationName: IntegrationNameEnum;
  apiPublicKey?: string;
  apiSecretKey?: string;
  financeAccountId?: string;
  extraInfo?: any;
};

export enum IntegrationNameEnum {
  Paystack = "Paystack",
  AfricasTalking = "AfricasTalking",
  Multitexter = "Multitexter",
  Dojah = "Dojah",
  Kuda = "Kuda",
  Seerbit = "Seerbit",
  Termii = "Termii",
  Mono = "Mono",
  YouVerify = "YouVerify",
}

export type SeerbitNameEnquiryData = {
  entityCode: string;
  bankCode: string;
  accountNumber: string;
};

export type SeerbitNameEnquiryResBody = {
  message: string;
  status: boolean;
  data: {
    customerName: string;
    entityCode: string;
    isSuccessful: boolean;
    message: string;
  }[];
};

export type LoanItemForDisbursementViaSeerbit = {
  applicationCode: string;
  reference: string;
  bankCode: string;
  accountNumber: string;
  amount: number;
  feesCharged: number;
  disbursementRemainder: number;
  buyOverAmount: number;
};

export type LoanDisbursementViaSeerbitDto = {
  loanBatchId: number;
  userId: number;
  loans: LoanItemForDisbursementViaSeerbit[];
  financeAccountId: number;
  appOwnerKey: string;
  disbursedLines: string;
  branchId: number;
};

export type LoanDisbursementViaSeerbitRes = {
  entityCode: string;
  message: string;
  reference: string;
  status: boolean;
}[];

export type LoanDisbursementViaKudaRes = {
  data: [
    {
      requestReference: string;
      transactionReference: string;
      responseCode: string;
      status: boolean;
      message: string;
      loanCode: string;
    }
  ];
  status: boolean;
  message: string;
};

export type ValidateBVNResBody = {
  data: {
    bvn: string;
    dob: string;
    first_name: string;
    last_name: string;
    middleName?: string;
    mobile: string;
    bvnImageUrl?: string;
  };
};

export type InvestmentInfoSetupDto = {
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankSortCode: string;
  ePaymentLimitAmount: number;
  investmentThresholdAmount: number;
  sendNotification: boolean;
  userId: number;
};

export type InvestmentCertificateInfoSetup = {
  signatoryName: string;
  signatoryRole: string;
  displaySignatoryName: boolean;
};