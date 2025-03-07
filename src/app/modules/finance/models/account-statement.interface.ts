export interface AccountStatement {
  amountPaid: number;
  invoicedAmount?: number;
  billedAmount?: number;
  openingBalance: number;
}
