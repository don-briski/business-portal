export interface DepositProduct {
  appOwnerKey: string;
  depositProductName: string;
  depositProductCategory: string;
  depositProductStatus: string;
  depositProductType: string;
  depositProductDescription?: string;
  depositProductAvailabilitySettings: ProductAvailability;
  depositProductNewAccountSettings: NewAccountSettings;
  depositProductInternalControls: ProductInternalControl;
  currencyId: number;
  depositProductInterestPaidIntoAccount: boolean;
  openingBalanceSettings: OpeningBalanceSettings;
  depositInterestRateBaseSettings: DepositInterestRateBaseSettings;
  depositAndWithdrawalSettings: DepositAndWithdrawalSettings;
  depositProductTermLengthSetting: DepositProductTermLengthSetting;
  depositProductAllowArbitraryFees: boolean;
  interestRateTiers: InterestRateTier[];
  depositProductFees: DepositFee[]
}

export interface ProductAvailability {
  customers: boolean;
  groups: boolean;
  allBranches: boolean;
  branches?: number[];
}

export interface NewAccountSettings {
  idType: string;
  randomPatternFormat?: string;
  incrementalNumberStart?: number;
}

export interface ProductInternalControl {
  depositProductAutoSetAccountAsDormant?: boolean;
  depositProductAutoSetAccountAsDormantDays?: number;
}

export interface DepositInterestRateBaseSettings {
  interestRateBaseSettingsRateTerms?: number;
  interestRateChargedPer?: string;
  interestRateChargedDays?: number;
  interestRateTiers?: InterestRateTier[];
  interestRateConstraintsDefault?: number;
  interestRateConstraintsMaximum?: number;
  interestRateConstraintsMinimum?: number;
  balanceForCalculations?: number;
  maximumBalanceForInterestCalculation?: number;
  daysInYear?: string;
}

export interface InterestRateTier {
  interestRateTierEndingBalance?: number;
  interestRateTierEndingDay?: number;
  interestRateTierInterestRate?: number;
  interestRateTierIndex?: number;
}

export interface DepositAndWithdrawalSettings {
  depositProductRecommendedDepositAmount?: number;
  depositProductMaxWithdrawalAmount?: number;
}

export interface DepositProductTermLengthSetting {
  depositProductDefaultTermLength?: number;
  depositProductMaxTermLength?: number;
  depositProductMinTermLength?: number;
  depositProductTermUnitMeasure?: number;
}
export interface OpeningBalanceSettings {
  depositProductDefaultOpeningBalance?: number;
  depositProductMinimumOpeningBalance?: number;
  depositProductMaximumOpeningBalance?: number;
}

export interface DepositFee {
  depositProductFeeId?: number;
  feeName?: string;
  feeDescription?: string;
  amount?: number;
  depositProductFeeType?: string;
  depositProductFeeApplyDateMethod?: string;
}
