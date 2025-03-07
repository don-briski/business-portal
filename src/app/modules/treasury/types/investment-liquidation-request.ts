import { Pagination } from "../../shared/shared.types";

export type LiquidationReqStatus =
  | "Open"
  | "Closed"
  | "SentForApproval"
  | "Approved"
  | "Rejected"
  | "";

export interface GetLiquidationReqsQueryParams {
  pageNumber: number;
  pageSize: number;
  filter: LiquidationReqStatus;
  keyword?: string;
}

export type GetLiquidationReqsResBody = {
  items: LiquidationReq[];
} & Pagination;

export interface LiquidationReq {
  requestDate: string;
  liquidationRequestedBy: string;
  investmentCode: string;
  investmentExpiryDate: string;
  interestAccrued: number;
  investmentLiquidationRequestId: number;
  investmentRate: number;
  periodTillTermination: number;
  rollOverAmount: number;
  liquidatedAmount: number;
  liquidationRequestApprovedBy: string;
  liquidationDate?: string;
  financeInteractionCashOrBankAccountId?: number;
  investmentId?: number;
  investmentType: string;
  investmentTypeId?: number;
  investmentTenor: number;
  reviewComments?: ReviewComment[];
  rollOverDetails?: string;
  startDate?: string;
  investmentLiquidationRequestStatus: LiquidationReqStatus;
  penalCharge: number;
}

interface ReviewComment {
  name: string;
  comment: string;
  dateCreated: string;
}

export interface ReviewLiquidationReqBody {
  investmentId: number;
  isApproved: boolean;
  isRejected: boolean;
  comment: string;
  transactionPin: string;
}

export interface EditLiquidationReqBody {
  liquidatedAmount: number;
  liquidationDate: string;
  investmentTypeId?: number;
  rollOverDetails?: string;
  startDate?: string;
  financeInteractionCashOrBankAccountId: number;
  transactionPin: string;
}
