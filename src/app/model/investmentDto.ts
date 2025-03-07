export class InvestmentDto {
    investmentId: number;
    investmentCode: string;
    investorId: number;
    investmentTypesName: string;
    iiquidationHistory: [];
    investmentTenor: number;
    investmentRate: number;
    initialDeposit: number;
    interestRateType: string;
    penalCharge: number;
    withHoldingTax: number;
    investmentAmount: number;
    createdBy: string;
    status: string;
    totalAmountExpected: number;
    investmentExpiryDate: string;
    investmentApprovalDate: string;
    dailyInterest: number;
    totalInvestmentEarning: number;
    dayCount: number;
    investmentExpired: boolean;
    currentAccruedAmount: number;
}

