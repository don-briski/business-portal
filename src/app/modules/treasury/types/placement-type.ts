enum Status {
  "Active" = "Active",
  "Inactive" = "Inactive",
}

export type PlacementType = {
  shortTermPlacementTypeId?: number;
  placementType: string;
  placementName: string;
  placementCode: string;
  interestType: string;
  interestCycle: string;
  maxInterestRate: number;
  minInterestRate: number;
  minAmount: number;
  maxAmount: number;
  tenorType: string;
  minTenor: number;
  maxTenor: number;
  whtRate: number;
  penalCharge: number;
  status: Status;
  financialInstitutionId: number;
  financialInstitution: string;
  requireApproval: boolean;
};

export type AddEditPlacementTypeReqBody = {
  placementName: string;
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
  status: string;
  financialInstitutionId: number;
  requireApproval: boolean;
  shortTermPlacementTypeId?: number;
};
