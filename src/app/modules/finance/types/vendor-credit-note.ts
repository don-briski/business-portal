import { GetDataQueryParams, Pagination } from "../../shared/shared.types";

export type TabName = "overview" | "comments" | "activity" | "files";

export type TaxOption = "Inclusive" | "Exclusive";

export type VCNStatus =
  | "Draft"
  | "Redraft"
  | "SentForApproval"
  | "Posted"
  | "Rejected";

export interface VCNLine {
  itemId: number;
  item: any;
  assetId: number;
  itemType: string;
  quantity: number;
  unitPrice: number;
  taxId: number;
  taxName: string;
  amount: number;
  accountId: number;
  amountAfterDiscount: number;
  amountAfterTax: number;
  creditLineId: number;
  discountAmount: number;
  itemName: string;
  subTotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  vendorCreditNoteId: number;
  accountName?: string;
}

export interface CreateVCNoteReqBody {
  vendorId: string;
  vendorCreditDate: string;
  orderNumber: number;
  taxOption: TaxOption;
  lines: VCNLine[];
  notes: string;
  files: any[];
  status: string;
}

export interface CreateVCNoteResBody {
  status: boolean;
  message: string;
}

export type GetVCNotesReqParams = GetDataQueryParams & {
  startDate?: string;
  endDate?: string;
  filter?: string[];
  vendorId?: number;
};

export type VCNote = {
  id: number;
  vendorCreditNoteId: number;
  code: string;
  vendor: string;
  vendorId: number;
  date: string;
  totalAmount: number;
  creditsRemaining: number;
  totalCreditsRemaining: number;
  status: VCNStatus;
};

export type GetVCNsResBody = Pagination & { items: VCNote[] };

export type VCNDetails = {
  amountAfterDiscountForLineLevelDiscount: number;
  appOwnerKey: string;
  appliedLines: VCNLine[];
  branchId: number;
  code: string;
  comments: any[];
  createdAt: string;
  createdById: number;
  creditApplicationStatus: string;
  currencyId: number;
  discountAfterTax: boolean;
  discountAmount: number;
  transactionLevelDiscountRate: number;
  discountAccountId: number;
  files: any[];
  isDelete: boolean;
  lastEntryId: number;
  lines: VCNLine[];
  notes: string;
  orderNumber: string;
  status: VCNStatus;
  subTotal: number;
  taxOption: TaxOption;
  taxTotalAmount: number;
  totalAmount: number;
  totalCreditsApplied: number;
  totalCreditsRemaining: number;
  vendor: string;
  vendorCreditNoteDate: string;
  vendorCreditNoteId: number;
  vendorId: number;
};

export interface GetVCNoteResBody {
  data: VCNDetails;
}

export interface CreditBillLine {
  id: number;
  amount: number;
}

export interface ApproveVCNReqBody {
  vendorCreditNoteId: number;
  comments: string;
  status: "Draft" | "ReDraft" | "SentForApproval" | "Posted" | "Rejected";
}

export interface GetVCNActivitiesResBody {
  data: VCNActivity[];
}

export interface VCNActivity {
  activityDate: string;
  activityDescription: string;
  relatedObjectInitiatorCode: string;
}
