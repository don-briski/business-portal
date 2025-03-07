export interface SplitInvestment {
  "investmentId": number,
  "newInvestments": [
    {
      "investmentTypeId": number,
      "investmentAmount": number,
      "investmentRate": number,
      "investmentTenor": number,
      "collectionPeriod": number,
      "startDate": string
    }
  ],
  "transactionPin": string
}
