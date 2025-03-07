export type Status =
  | "Draft"
  | "ReDraft"
  | "SentForApproval"
  | "Posted"
  | "Rejected";

export type RelatedObject = "CreditNote" | "VendorCreditNote";

export interface CreateCreditRefundReqBody {
  creditRefundId: number;
  reference: string;
  amount: number;
  status: Status;
  paymentModeId: number;
  transactionDescription: string;
  refundDate: string;
  relatedObject: RelatedObject;
  relatedObjectId: number;
  paidThroughAccountId: number;
  taxAccountId: number;
  transactionPin: string;
}

export interface Pagination {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  count: number;
  jumpArray: number[];
}

export interface GetCreditRefundsReqBody {
  search?: string;
  pageNumber: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  status?: Status[];
}

export interface GetCreditRefundsResBody {
  data: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    items: CreditRefund[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CreditRefund {
  amount: number;
  code: string;
  comments: CreditRefundComment[];
  createdAt: string;
  createdBy: string;
  creditRefundId: 10;
  datePosted: string;
  reference: string;
  refundLines: CreditRefundLines[];
  relatedObject: RelatedObject;
  relatedObjectId: number;
  status: Status;
  transactionDescription: string;
}

export interface CreditRefundLines {
  amount: number;
  appliedObjectCode: string;
  createdAt: string;
  creditNoteId: number;
  creditRefundId: number;
  creditRefundLineId: number;
  parentCode: string;
  refundDate: string;
}

interface CreditRefundComment {
  name: string;
  comment: string;
  dateCreated: string;
}

export type PaymentMode = {
  appOwnerKey: string;
  createdAt: string;
  createdBy: string;
  createdById: number;
  description: string;
  financePaymentModeId: number;
  isActive: boolean;
  isDefault: boolean;
  modifiedAt: string;
  modifiedBy: string;
  modifiedById: number;
  name: string;
};
