export interface AccountTransactionsViewData {
  accountId: number;
  accountName: string;
  account?: string;
  accountNumber: string;
  startDate: string;
  endDate: string;
  paginated: boolean;
  pageNumber: number;
  pageSize: number;
  transactionType: 'Debit' | 'Credit'
}

export interface AccountTransaction {
  accountName: string;
  creditAmount: number;
  debitAmount: number;
  label: string;
  postingDate: string;
  relatedEntity: string;
  relatedEntityId: number;
  transactionDate: string;
  reference: string;
}
