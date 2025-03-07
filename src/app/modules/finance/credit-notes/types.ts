export type TabName = "overview" | "comments" | "activity" | "files";

export type TaxOption = "Inclusive" | "Exclusive";

export type CreditNoteStatus =
  | "Draft"
  | "Redraft"
  | "SentForApproval"
  | "Posted"
  | "Rejected";

export interface CNLine {
  itemName: string;
  itemCode: string;
  quantity: number;
  unitPrice: number;
  amountAfterTax: number;
  taxId: number;
  itemId: number;
  itemType: string;
  accountId: number;
  subTotalAmount: number;
}

export interface CreateCNoteReqBody {
  vendorId: string;
  vendorCreditDate: string;
  orderNumber: number;
  taxOption: TaxOption;
  lines: CNLine[];
  notes: string;
  files: any[];
  status: string;
}

export interface CreateCNoteResBody {
  status: boolean;
  message: string;
}

export interface GetCNotesReqBody {
  keyword?: string;
  pageNumber?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  statuses?: string[];
  filter?: number;
  selectedSearchColumn?: string;
}

export interface CreditNoteDetails {
  id: number;
  status: string;
  customer: string;
  customerId: number;
  code: string;
  creditsRemaining: number;
  subTotal: number;
  taxTotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  date: string;
  salesPerson: string;
  salesPersonId: number;
  transactionLevelDiscountRate: number;
  discountAccountId: number;
  discountAfterTax: number;
  orderNumber: number;
  taxOption: string;
  notes: string;
  lines: CNLine[];
  comments: {
    name: string;
    comment: string;
    dateCreated: string;
  }[];
  files: {
    fileId: number;
    userId: number;
    dateUploaded: string;
    filePath: string;
    fileName: string;
    originalName: string;
    activity: string;
    loanId: number;
    personId: number;
    appOwnerKey: string;
    fileType: string;
  }[];
}

export type CreditNote = {
  code: string;
  creditsRemaining: number;
  customer: string;
  customerId: number;
  date: string;
  id: number;
  salesPerson: string;
  status: string;
  totalAmount: number;
};

export interface GetCNotesResBody {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: CreditNote[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetCNoteResBody {
  data: CreditNoteDetails;
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

export interface CreditInvoiceLine {
  id: number;
  amount: number;
}

export interface ApproveCNReqBody {
  creditNoteId: number;
  comments: string;
  status: CreditNoteStatus;
}

export interface GetCNActivitiesResBody {
  data: CNActivity[];
}

export interface CNActivity {
  activityDate: string;
  activityDescription: string;
  relatedObjectInitiatorCode: string;
}

export interface UploadedFile {
  activity: string;
  appOwnerKey: string;
  fileId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  originalName: string;
  userId: number;
}
