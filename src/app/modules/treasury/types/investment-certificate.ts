export type InvestmentCertificate = {
  investmentId: number,
  investorId: number,
  investorName: string,
  startDate: string,
  maturityDate: string,
  investmentAmount: number,
  rate: number,
  tenor: number,
  cycleInfo: {
    investmentCycleScheduleId: number,
    investmentId: number,
    index: number,
    principal: number,
    totalInterest: number,
    cycleStartDate: string,
    withHoldingTax: number,
    tenor: number,
    grossInterest: number,
    cycleEndDate: string,
    daysRemaining: number,
    postedToFinance: boolean,
    createdAt: string
}[],
  appOwnerCurrency: string,
  total: number,
  appOwnerName: string,
  logoUrl: string
  appOwnerShippingAddress: string,
  appOwnerEmail: string,
  appOwnerPhone: string
}

export type InvestmentCertInfo = { title: string, value: string | number, type?:"amount" | "date" };
