/**
 * @deprecated The Type should not be used,use InvestmentV2 instead
 */
export interface Investment {
  investmentId: number;
  investmentCode: string;
  investorId: number;
  investor: {
    personId: number;
    bvn?: string;
    securityAnswers?: string;
    securityQuestion?: string;
    personCode: string;
    title?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    sex?: string;
    dateOfBirth?: string;
    type: number;
    phoneNumber: string;
    emailAddress: string;
    profilePic?: string;
    staffId?: string;
    address: string;
    createdAt: string;
    status: number;
    branch?: string;
    branchId?: string;
    lastPersonId: string;
    appOwnerKey: string;
    isBvnValidated: boolean;
    addtionalUniqueId?: string;
    personStatus: number;
    blacklistDetails?: string;
    blacklistDetailsJson: [];
    vendorName?: string;
    taxIdNumber?: string;
    vendorCreatedBy?: string;
    employmentCode?: string;
    contactPersonDetails?: string;
    hasInvestment: boolean;
    contactPersonDetailsList: [];
    bankAccountDetails?: string;
    bankAccountDetailsList: [];
    loan?: string;
    displayName: string;
    initials: string;
    loanApplicationCount: number;
  };
  investorName: string;
  investmentTypeId: number;
  investmentType: {
    investmentTypeId: number;
    investmentName: string;
    investmentCode: string;
    minInvestmentTenor: number;
    maxInvestmentTenor: number;
    interestRateType: string;
    minInterestRate: number;
    maxInterestRate: number;
    minAmount: number;
    maxAmount: number;
    withHoldingTax: number;
    penalCharge: number;
    userId: number;
    createdBy?: string;
    createdAt: string;
    status: string;
    approvalRequired: boolean;
  };
  investmentTypesName: string;
  liquidationHistory: [];
  collectionHistory: [];
  investmentTenor: number;
  investmentRate: number;
  interestRateType: string;
  penalCharge: number;
  withHoldingTax: number;
  investmentAmount: number;
  initialDeposit: number;
  additionals: {
    bankName: string;
    bankSortCode: string;
    bankAccountName: string;
    bankAccountNumber: string;
    investorEmail: string;
    investorCustomAddress: string;
    investorAltPhoneNumber: string;
    phoneNumber: string;
    bvn: string;
    startDate: string;
    cycleSchedules: [
      {
        principal: number;
        totalInterest: number;
        cycleStartDate: string;
        withHoldingTax: number;
        tenor: number;
        period?: string;
        interestAccrued?: string;
        grossInterest: number;
        cycleEndDate: string;
        investmentCycleScheduleId: number;
      }
    ];
    transactionRef?: string;
    payment?: string;
  };
  userId: number;
  createdBy?: string;
  status: string;
  totalAmountExpected: number;
  approvalDetails: [
    {
      Status: string;
      Comment: string;
      Username: string;
      UserId: number;
      CreatedAt: string;
    }
  ];
  cycleSchedules: [
    {
      principal: number;
      totalInterest: number;
      cycleStartDate: string;
      withHoldingTax: number;
      tenor: number;
      period?: string;
      interestAccrued?: string;
      grossInterest: number;
      cycleEndDate: string;
      investmentCycleScheduleId: number;
    }
  ];
  createdAt: string;
  investmentApprovalDate: string;
  investmentExpiryDate: string;
  dailyInterest: number;
  totalInvestmentEarning: number;
  dayCount: number;
  investmentExpired: boolean;
  currentAccruedAmount: number;
  grossInterest: number;
  periodTillTermination: number;
  totalAmountTerminated: number;
  totalInterestAccruedAtTermination: number;
  totalInterestAccruedAtApproval: number;
  totalAmountCollected: number;
}

import { InvestmentCertificateInfoSetup } from "src/app/model/configuration";
import { GetDataQueryParams, Pagination } from "../../shared/shared.types";
import { InvestmentType } from "./investment-type.interface";

export type InvestmentV2 = {
  investmentId: number;
  investmentCode: string;
  investorId: number;
  investmentTenor: number;
  investorName: string;
  investmentAmount: number;
  initialDeposit: number;
  createdAt: string;
  createdBy: string;
  status: string;
  daysToMaturity: string;
  investmentExpiryDate: string;
  totalAmountTerminated: number;
  totalInterestAccruedAtTermination: number;
  totalInterestAccruedAtApproval: number;
  createdById: number;
  currentAccruedAmount: number;
  investmentApprovalDate: string;
  cycleSchedules: {
    cycleEndDate: string;
    cycleStartDate: string;
    tenor: number;
    totalInterest: number;
  }[];
};

export type PreviewInvestmentCertData = InvestmentDetails & {
  total: number;
  withHoldingTax: number;
  investmentCertSetup: InvestmentCertificateInfoSetup;
};

export type InvestmentDetails = {
  investmentApprovalDate: string;
  firstName: string;
  lastName: string;
  middleName: string;
  emailAddress: string;
  startDate: string;
  investmentExpiryDate: string;
  investorId: number;
  initialDeposit: number;
  investorName: string;
  investmentCode: string;
  investmentAmount: number;
  investmentRate: number;
  investmentTenor: number;
  maturityDate: string;
  dayCount: number;
  nuban: string;
  investmentId: number;
  totalInvestmentEarning: number;
  totalAmountExpected: number;
  investmentExpired: string;
  penalCharge: number;
  currentAccruedAmount: number;
  collectionPeriod: number;
  financeInteractionCashOrBankAccountId: number;
  hasFinanceInteraction: boolean;
  additionalInfo: {
    investorEmail: string;
    phoneNumber: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    bvn: string;
    directorName:string;
    directorPhoneNumber:string;
    investorCustomAddress:string;

  };
  liquidationHistory: {
    status: string;
    liquidatedAmount: number;
    penalCharge: number;
    createdAt: string;
  };
  approvalDetailInfo: {
    status: string;
    username: string;
    comment: string;
    createdAt: string;
  };
  cycleSchedules: {
    cycleStartDate: string;
    cycleEndDate: string;
    principal: number;
    tenor: number;
    grossInterest: number;
    withHoldingTax: number;
    totalInterest: number;
  }[];
  investmentTypeInfo: InvestmentType;
  status: string;
  createdAt: string;
  createdBy: string;
  createdById: number;
  billingAddressData: {
    country: string;
    address: string;
    street1: string;
    city: string;
    houseNumber:string;
    nearestLandMark: string;
    state:string;
    stateId:string;
    localGovernmentArea:string;
    lgaId:number;
  };
};

export type GetInvestmentsResponse = Pagination & {
  items: InvestmentV2[];
};

export type GetInvestmentDetailResponse = { data: InvestmentDetails };

export enum InvestmentFilterEnum {
  Pool = "Pool",
  Approved = "Approved",
  Redraft = "Redraft",
  Terminated = "Terminated",
  Expired = "Expired",
  Deactivated = "Deactivated",
  Rejected = "Rejected",
}

export type FetchInvestmentsPayload = GetDataQueryParams & {
  filter: InvestmentFilterEnum | InvestmentFilterEnum[];
};

export type SendInvestmentCertificateReq = {
  investmentId: number;
};

export type GetInvestmentReportReqBody = {
  branchesList: string;
  endDate: string;
  filter: string;
  pageNumber: number;
  pageSize: number;
  statusType: string;
  tenantId: string;
  startDate?: string;
};

export enum InvestmentReportNameEnum {
  InvestmentReport = "Investment Report",
  InvestmentLiquidationReport = "Investment Liquidation Report",
  InvestmentMaturityReport = "Investment Maturity Report",
  InterestAccruedReport = "Interest Accrued Report",
  ActivityReport = "Activity Report",
  ShortTermInvestmentReport = "Short Term Investment Report",
  ShortTermInvestmentMaturityReport = "Short Term Investment Maturity Report",
  ShortTermInvestmentLiquidationReport = "Short Term Investment Liquidation Report",
  ShortTermInvestmentInterestAccruedReport = "Short Term Investment Interest Accrued Report",
}

export type ShortTermInvestmentReport = {
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
};

export type GetShortTermInvestmentReportRes = Pagination & {
  items: ShortTermInvestmentReport[];
};

export type STPLiquidationReport = {
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
  penalCharge: number;
  liquidationDate: string;
  liquidationAmount: number;
};

export type GetSTPLiquidationReportRes = Pagination & {
  items: STPLiquidationReport[];
};

export type GetSTPInterestAccruedReportRes = Pagination & {
  items: STPInterestAccruedReport[];
};

export type STPInterestAccruedReport = {
  createdAt: string;
  daysTillMaturity: number;
  grossInterest: number;
  maturityDate: string;
  placementType: string;
  principal: number;
  shortTermPlacementCode: string;
  startDate: string;
  status: string;
  tenor: number;
  whtRate: number;
  interest: number;
  interestAccrued: number;
};

export type InvestmentTabName =
  | "Pool"
  | "Approved"
  | "Terminated"
  | "Deactivated";

export type CreateInvestmentReq = {
  firstName: string;
  middleName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  houseNumber: number;
  street1: string;
  nearestLandMark: string;
  country: string;
  state: string;
  stateId: number;
  localGovernmentArea: string;
  lgaId: number;
  bankName: string;
  bvn: string;
  bankAccountNumber: string;
  investmentTypeId: number;
  investmentAmount: number;
  investmentRate: number;
  investmentTenor: number;
  startDate: "2024-10-29";
  collectionPeriod: number;
  financeInteractionCashOrBankAccountId: number;
  hasFinanceInteraction: boolean;
};
