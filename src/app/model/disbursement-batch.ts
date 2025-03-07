import { Pagination } from "../modules/shared/shared.types";

export type GetAllDisbursementBatchesQueryParams = {
  pageNumber: number;
  pageSize: number;
  keyword?: string;
  branchId?: number;
  assignedTo?: string;
  filter?: string;
  startDate?: string;
  endDate?: string;
};

export type DisbursementBatch = {
  disbursementBatchId: number;
  batchCode: string;
  batchValue: number;
  disbursed: number;
  pending: number;
  dateCreated: string;
  noOfLoans: number;
  branchName: string;
  branchId: number;
  status: "closed" | "open";
  assignedTo: string;
  assignedToId: number;
  createdBy: string;
  loans?: LoanForDisbursement[];
  disbursementDue?: number;
};

export type ModifiedDisbursementBatch = DisbursementBatch & {
  selected: boolean;
  selectable: boolean;
};

export type GetAllDisbursementBatchesResDto = Pagination & {
  items: DisbursementBatch[];
};

export type DisbursementBatchActivity = {
  activity: string;
  actor: string;
  actorId: number;
  date: string;
};

export type PaymentOfficer = {
  userId: number;
  name: string;
};

export type ReassignPaymentOfficerReqDto = {
  newPaymentOfficerId: number;
  disbursementBatches: number[];
};

export type LoanForDisbursement = {
  applicationCode: string;
  lendingInstitutionId?: string;
  loanTypeInfo: string;
  bvnInfo: string;
  loanAmount: number;
  fees: number;
  disbursedAmount: number;
  dateApproverApproved: string;
  bankInfo: string;
  statusString: string;
  loanStage: string;
  buyOverAmount: number;
}