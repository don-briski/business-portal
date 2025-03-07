import { Pagination } from "../../shared/shared.types";
import { FinanceStatus } from "../finance.types";

export type FetchJournalsPayload = {
  pageNumber: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  filter: FinanceStatus[];
  financePersonId?: number;
  selectedSearchColumn?: string;
  keyword?: string;
};

export type Journal = {
  journalId: number;
  journalCode: string;
  totalAmount: number;
  date: string;
  createdBy: string;
  createdAt: string;
  status: FinanceStatus;
};

export type JournalDetails = {
    journalId: number;
    journalCode: string;
    totalAmount: number;
    date: string;
    currencyId: number;
    reference: string;
    notes: string;
    comments: [];
    createdById: number;
    createdBy: string;
    createdAt: string;
    modifiedAt: string;
    status: string;
    journalType: string;
    createdFrom: string;
    appOwnerKey: string;
    branchId: number;
    journalLines: {
      account: {
        name: string;
        reference: number;
        accountId: number;
      };
      contact: {
        name: string;
        id: number;
      };
      description: string;
      debitAmount: number;
      creditAmount: number;
    }[];
    datePosted: string;
};

export type FetchJournalsRes = Pagination & {
  items: Journal[];
};
