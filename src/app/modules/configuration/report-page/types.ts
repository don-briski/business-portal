export interface GetReportReqBody {
  StartDate?: string;
  EndDate?: string;
  Paginated: boolean;
  PageNumber: number;
  PageSize: number;
  BranchIds?: number[];
  Status?:
    | "Draft"
    | "ReDraft"
    | "SentForApproval"
    | "Posted"
    | "Rejected"
    | "Approved";
}

export interface GetReportResBody {
  data: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    items: any[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  status: boolean;
}

export type GetUserReportUrlSegment = "getactivitylogreport";

type Alignment = "left" | "center" | "right";

export interface UserReportTableColumns {
  [key: string]: {
    name: string;
    property: string;
    class?: string;
    type?: string;
    alignment?: Alignment;
  }[];
}
