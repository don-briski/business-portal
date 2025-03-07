enum Status {
  "Active" = "Active",
  "NonActive" = "NonActive"
}

export interface InvestmentType {
  investmentTypeId: number,
  investmentName: string,
  investmentCode: string,
  interestRateType: InterestRateType,
  maxNetInterest: number,
  minNetInterest: number,
  minAmount: number,
  maxAmount: number,
  withHoldingTax: number,
  penalCharge: number,
  userId: 0,
  status: Status,
  maxInvestmentTenor: number,
  minInvestmentTenor: number,
  approvalRequired: boolean,
  termsAndConditionsInfoSetup: any
  termsAndConditionsSetupInfo: any
}

export enum InterestRateType {
  "Flat" = "Flat",
  "Compounding" = "Compounding"
}
