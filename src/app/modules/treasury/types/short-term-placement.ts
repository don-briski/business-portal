import { GetDataQueryParams, Pagination } from "../../shared/shared.types";

export enum STPTabsEnum {
  pool = "pool",
  active = "active",
  liquidated = "liquidated",
  terminated = "terminated",
}

export type ShorTermPlacementDetails = {
  shortTermPlacementId: number;
  shortTermPlacementCode: string;
  principal: number;
  compoundingCurrentPrincipal: number;
  interestAccrued: number;
  tenor: number;
  tenorType: string;
  interestRate: number;
  interestType: string;
  startDate: string;
  maturityDate: string;
  status: string;
  liquidationDate: string;
  terminationDate: string;
  liquidationAmount: number;
  interestAccruedAtTermination: number;
  shortTermPlacementTypeId: number;
  hasFinanceInteraction: boolean;
  financeInteractionCashOrBankAccountId: number;
  financeInteractionCashOrBankAccount: string;
  financeInteractionInvestmentIncomeAccountId: number;
  financeInteractionInvestmentIncomeAccount: string;
  liquidationFinanceInteractionInvestmentIncomeAccountId: number;
  liquidationFinanceInteractionInvestmentIncomeAccount: string;
  createdById: number;
  createdBy: string;
  branchId: number;
  branch: string;
  createdAt: string;
  modifiedAt: string;
  editable: true;
  approvable: true;
  liquidatable: true;
  terminable: true;
  daysTillMaturity: number;
  shortTermPlacementTypeInfo: STPTypeInfo;
  approvalDetails: [
    {
      userId: number;
      comment: string;
      username: string;
      status: string;
      date: string;
    }
  ];
  cycleSchedules: [
    {
      shortTermPlacementCycleScheduleId: number;
      shortTermPlacementId: number;
      index: number;
      cycleDate: string;
      principal: number;
      interest: number;
      grossInterest: number;
      withHoldingTax: number;
      interestAccrued: number;
      isLast: boolean;
    }
  ];
};

export type STPTypeInfo = {
  shortTermPlacementTypeId: number;
  placementName: string;
  placementCode: string;
  placementType: string;
  minTenor: number;
  maxTenor: number;
  maxInterestRate: number;
  minInterestRate: number;
  minAmount: number;
  maxAmount: number;
  tenorType: string;
  interestType: string;
  interestCycle: string;
  penalCharge: number;
  wht: number;
  financialInstitutionId: number;
  financialInstitution: string;
  requireApproval: true;
};

export type ShortTermPlacement = {
  createdAt: string;
  daysTillMaturity: number;
  interestAccrued: number;
  liquidationAmount: number;
  maturityDate: string;
  placementType: string;
  principal: number;
  shortTermPlacementCode: string;
  shortTermPlacementId: number;
  shortTermPlacementTypeId: number;
  shortTermPlacementTypeInfo: string;
  parsedShortTermPlacementTypeInfo: STPTypeInfo; // Computed on FE. Doesn't come from BE.
  startDate: string;
  status: string;
};

export type AddEditShortTermPlacementReqBody = {
  startDate: string;
  shortTermPlacementTypeId: number;
  status: string;
  hasFinanceInteraction: boolean;
  financeInteractionCashOrBankAccountId: number;
  financeInteractionInvestmentIncomeAccountId: number;
  tenor: number;
  amount: number;
  interestRate: number;
  shortTermPlacementId?: string;
};

export type GetShortTermPlacementsQueryParams = GetDataQueryParams & {
  shortTermPlacementTypeId?: number;
  filter?: string[];
  endDate?: string;
  startDate?: string;
};

export type GetShortTermPlacementsResBody = Pagination & {
  items: ShortTermPlacement[];
};

export type ShortTermPlacementType = {
  shortTermPlacementTypeId: number;
  placementName: string;
  placementCode: string;
  placementType: string;
  minTenor: number;
  maxTenor: number;
  maxInterestRate: number;
  minInterestRate: number;
  minAmount: number;
  maxAmount: number;
  tenorType: string;
  penalCharge: number;
  whtRate: number;
  interestType: string;
  interestCycle: string;
  status: "Active" | "Inactive";
  financialInstitutionId: number;
  financialInstitution: string;
  requireApproval: boolean;
  createdAt: string;
  modifiedAt: string;
};

export type GetShortTermPlacementTypesResBody = {
  pageNumber: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  searchColumns: string[];
  items: ShortTermPlacementType[];
};

export type ReviewShortTermPlacementReqBody = {
  shortTermPlacementId: number;
  comment: string;
  status: string;
  transactionPin: string;
};

export type PreviewSTPInvestmentScheduleReqBody = {
  shortTermPlacementId?: number;
  shortTermPlacementTypeId: number;
  startDate: string;
  principal: number;
  interestRate: number;
  tenor: number;
};

export type STPInvestmentSchedule = {
  shortTermPlacementCycleScheduleId: number;
  shortTermPlacementId: number;
  index: number;
  cycleDate: string;
  principal: number;
  interest: number;
  grossInterest: number;
  withHoldingTax: number;
  interestAccrued: number;
  isLast: boolean;
};

export type PreviewSTPInvestmentScheduleResBody = {
  data: { cycleSchedules: STPInvestmentSchedule[] };
};

export type STPPreviewDetails = {
  investmentAmount: number;
  investmentRate: number;
  investmentTenor: number;
  tenorType: string;
  startDate: string;
  investorName?: string;
  investmentExpiryDate?: string;
}
