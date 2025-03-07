export type ApproverType = "Users" | "Roles" | "Teams";
export type InitiatorType = "Roles" | "Teams";
export type RequestType = "Payments" | "Custom";
export type WorkflowReqStatus =
  | ""
  | "InProgress"
  | "Declined"
  | "Approved"
  | "Redrafted"
  | "Treated"
  | "Open"
  | "Closed"
  | "Pending"
  | "Reviewed";
export type ApprovingCategory = "Users" | "Roles" | "Teams";

export interface Approver {
  approverId: number;
  approverName: string;
  position: number;
  isFirstToApprove: boolean;
}

export interface Initiator {
  id: number;
  text: string;
}

export interface Branch {
  id: number;
  text: string;
}

export interface CustomFieldSet {
  customFieldSetName: string;
  customFieldNotes: string;
  customFieldSetType: string;
  usage: string;
  customFormKey: string;
  customFields: CustomField[];
  customFieldSetKey: string;
}

export interface CustomField {
  dataType: CustomFieldDataType;
  customFieldStatus: "Activated" | "Deactivated";
  customFieldDescription: string;
  isRequired: boolean;
  customFieldType: string;
  validationPattern: string;
  value?: string;
  valueLength: string;
  customFieldKey: string;
  customFieldLinks: [];
  customFieldName: string;
  customFieldSelections?: CustomFieldSelection[];
}

export interface CustomFieldSelection {
  customFieldSelectionKey: string;
  label: string;
  uniqueId: string;
}

export interface CustomForm {
  customFieldSets: CustomFieldSet[];
  customFormKey: string;
}
export interface GetCustomFormResBody {
  data: CustomForm;
}

export interface EditReqConfigData {
  name: string;
  requireSupportingDocument: boolean;
  requestIdentifier: string;
  approverType: ApproverType;
  initiatorType: InitiatorType;
  approvers: Approver[];
  initiators: Initiator[];
  branches: Branch[];
  requestType: RequestType;
  customForm: {
    customFieldSets: CustomFieldSet[];
  };
  isActive: boolean;
}

export interface GetReqConfigsQueryParams {
  pageNumber: number;
  pageSize: number;
  keyword: string;
  filter?: string;
}

export interface GetReqConfigsResBody {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: ReqConfig[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ReqConfig {
  approvers: { actorId: number; actorName: string }[];
  requireSupportingDocument: boolean;
  approverSetupType: ApproverType;
  createdAt: string;
  createdBy: string;
  createdById: number;
  initiatorSetupType: InitiatorType;
  initiators: { actorId: number; actorName: string }[];
  isActive: boolean;
  requestIdentifier: string;
  requestName: string;
  requestSetupId: number;
  requestType: RequestType;
  permittedBranches: { branchId: number; branchName: string }[];
  customFormId?: string;
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

export type CustomFieldDataType =
  | "FreeText"
  | "Date"
  | "Number"
  | "Selection"
  | "Checkbox"
  | "RadioGroup";

export interface CreateRequestReqBody {
  requestSetupId: number;
  totalAmount?: number;
  paymentDescription: string;
  paymentDate?: string;
  supportingDocuments: any;
  vendorId?: number;
  selectedItems?: { itemId: number; name: string; quantity: number };
  createdById: string;
}

export interface GetReqsQueryParams {
  pageNumber: number;
  pageSize: number;
  keyword: string;
  approvingCategory?: ApprovingCategory;
  filter?: WorkflowReqStatus;
  requestStatus?: WorkflowReqStatus;
}

export interface WorkflowRequest {
  createdAt: string;
  requestCode: string;
  requestId: number;
  requestName: string;
  requestType: "Custom" | "Payments";
  status: WorkflowReqStatus;
  totalAmount: number;
  vendorId: number;
}

export interface GetReqsResBody {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: WorkflowRequest[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetReqParams {
  id: number;
}

export interface RequestItem {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  amount: number;
}

export interface Approval {
  approvalAction: string;
  approvalId: number;
  approvedAt: string;
  approverId: number;
  approverName: string;
  comment: string;
  userId: number;
}

export interface RequestDetail {
  requestCode: string;
  approvals: Approval[];
  approverSetupType: RequestType;
  createdAt: string;
  createdById: number;
  requestorName: string;
  requestorRole: string;
  originatingBranch: string;
  description: string;
  isCompleted: boolean;
  nextApproverId: number;
  nextApproverName: string;
  totalApproversCount: number;
  paymentDate: string;
  requestApprovalStatus: WorkflowReqStatus;
  requestId: number;
  requestItems: RequestItem[];
  requestName: string;
  requestSetupId: number;
  totalAmount: number;
  vendorAddress: string;
  vendorName: string;
  supportingDocuments: {
    fileName: string;
    url: string;
  };
  vendorId: number;
  customForms?: CustomForm;
}

export interface ApproveReqReqBody {
  requestId: number;
  comment: string;
  approvalAction: WorkflowReqStatus;
}

export interface ApproveReqResBody {
  status: boolean;
  message: string;
}

export interface RedraftReqReqBody {
  totalAmount?: number;
  vendorId?: number;
  selectedItems?: {
    itemId: number;
    quantity: number;
    name: string;
  }[];
  createdById: number;
  customFieldsValues?: {
    customFieldValues: [
      {
        customFieldKey: string;
        value: string;
        scoreAmount: number;
      }
    ];
  };
}

export interface Tab {
  id: string;
  text: string;
}

export interface TabBarId {
  tabId: string;
  tabBarId: string;
}

export interface WorkflowReqActivity {
  activityDescription: string;
  appActivityId: number;
  activityDate: string;
}

export interface PendingRequestsStats {
  users: number;
  teams: number;
  roles: number;
}

export interface GetWorkflowReportsQueryParams {
  pageNumber: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  filter?: string;
  keyword?: string;
}

export interface WorkflowReportsData {
  pageNumber: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPreviousPage: true;
  hasNextPage: true;
  items: WorkflowReport[];
}

export interface WorkflowReport {
  requestId: number;
  requestCode: string;
  requestName: string;
  status: string;
  amount: number;
  requestDate: string;
  approvedBy: string;
  approvalDate: string;
  approvingCategory: string;
}
