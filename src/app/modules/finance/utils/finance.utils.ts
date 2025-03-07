import { FinanceStatus } from "../finance.types";

export const OPEN_FINANCE_STATUSES = [FinanceStatus.Draft,FinanceStatus.Redraft,FinanceStatus.SentForApproval];

export const CLOSED_FINANCE_STATUSES = [FinanceStatus.Posted,FinanceStatus.Rejected]

export const ALL_FINANCE_STATUSES = [FinanceStatus.Draft,FinanceStatus.Posted,FinanceStatus.Redraft,FinanceStatus.Rejected,FinanceStatus.SentForApproval]
