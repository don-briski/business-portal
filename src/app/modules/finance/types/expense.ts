import { LendaFile, Pagination } from "src/app/modules/shared/shared.types";

export type GetExpensesReqParams = {
  pageNumber: number;
  pageSize: number;
  filter?: any;
  keyword?: string;
  selectedSeachColumn?: string;
  customerId?:number
};

export type Expense = {
  createdAt: string;
  createdBy: string;
  customer: string;
  customerId: number;
  date: string;
  expenseCode: string;
  expenseId: number;
  status: string;
  totalAmount: number;
  vendor: string;
  vendorId: number;
};

export type GetExpensesResBody = Pagination & { items: Expense[] };

export type ExpenseDetails = {
  expenseId: number;
  expenseCode: string;
  totalAmount: number;
  currencyId: number;
  paidThroughAccountId: number;
  paidThroughAccount: string;
  date: string;
  createdAt: string;
  createdBy: string;
  vendorId: number;
  vendor: string;
  customerId: number;
  customer: string;
  reference: string;
  comments: [
    {
      name: string;
      comment: string;
      dateCreated: string;
    }
  ];
  status: string;
  notes: string;
  project: string;
  files: LendaFile[];
  expenseLines: {
    amount: number;
    expenseAccountId: number;
    notes: string;
    taxId: string;
    expenseAccount: {
      accountId: number;
      name: string;
    };
    tax: {
      accountId: number;
      name: string;
    };
  }[];
};
