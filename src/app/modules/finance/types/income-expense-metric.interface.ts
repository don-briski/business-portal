export interface IncomeExpense {
  period: string;
  income: number;
  expense: number;
}

export interface IncomeExpenseMetric {
  data: IncomeExpense[];

  totalIncome: number;
  totalExpense: number;
}
