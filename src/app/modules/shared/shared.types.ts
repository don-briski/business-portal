import { CustomDropDown } from "src/app/model/CustomDropdown";
import {
  PermissionClassificationV2,
  PermissionSelectionState,
} from "../configuration/models/user.type";
import { PermissionStoreState } from "../configuration/user-management/store/reducers";
import { AllModulesEnum } from "src/app/util/models/all-modules.enum";

export interface SelectOption {
  value: string;
  label: string;
}

export interface Tab {
  id: string;
  text: string;
  hide?: boolean;
}

export interface TabSwitch {
  tabId: string;
  tabBarId: string;
}

export interface Pagination {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  count?: number;
  searchColumns?: string[];
  jumpArray?: number[];
  filter?: string;
  keyword?: string;
  selectedSearchColumn?: string;
}

export type GetDataQueryParams = {
  pageNumber?: number;
  pageSize?: number;
  keyword?: string;
  selectedSearchColumn?: string;
  filter?: string | string[];
};

export interface User {
  userId: number;
  emailAddress: string;
  branchId: number;
  branchName: string;
  branchCode: string;
  status: number;
  personId: number;
  person: {
    personId: number;
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    type: number;
    phoneNumber: string;
    emailAddress: string;
    profilePic: string;
    staffId: string;
    status: number;
    branch: {
      branchId: number;
      branchName: string;
      state: string;
      stateId: number;
      countryId: number;
      address: string;
      status: number;
      members: number;
      appOwnerKey: string;
      createdAt: string;
      modifiedAt: string;
    };
    branchId: number;
    lastPersonId: number;
    appOwnerKey: string;
    isBvnValidated: boolean;
    personStatus: number;
    blacklistDetails: string;
    blacklistDetailsJson: [
      {
        reason: string;
        blacklistedRequestedAt: string;
        requestedBy: string;
        customerName: string;
        customerId: number;
        blacklistedById: number;
        reviewedBy: string;
        isBlacklistApproved: boolean;
        reviewedAt: string;
        loanId: number;
      }
    ];
    hasInvestment: boolean;
    primaryContactData: { id: string };
    billingAddressData: {};
    shippingAddressData: {};
    vendorCommentsData: [];
    socialMediaData: {};
    contactPersonDetailsList: [];
    bankAccountDetailsList: [];
    displayName: string;
    initials: string;
    loanApplicationCount: number;
    createdAt: string;
    modifiedAt: string;
  };
  userRoleId: string;
  roleName: string;
  canSell: boolean;
  appOwnerKey: string;
  permission: string[];
  branchView: CustomDropDown[];
  team: CustomDropDown[];
  branchIds: number[];
  teamIds: number[];
  isSubscriptionActive: boolean;
  isModular: boolean;
  subscriptionMessage: string;
  applicationKey: string;
  paymentUrl: string;
  _user2FASettings: {
    isEnabled: boolean;
    defaultOption: number;
    phoneNumber: string;
    isPhoneNumberConfrimed: boolean;
  };
}

export interface UserToken {
  IsUserTeamLead: boolean;
  RoleId: String;
  Team: string;
  UserRoleId: string;
  email: string;
  exp: number;
  iat: number;
  nameid: string;
}

export type LoggedInUser = {
  actort: string;
  email: string;
  exp: number;
  groupsid: string;
  iat: number;
  isImpersonator: string;
  isUserTeamLead: string;
  nameid: string;
  nbf: number;
  roleId: string;
  team: string;
  userRoleId: string;
};

export interface AppOwnerInformation {
  appInactivityTimeoutSeconds: number;
  appOwner2FASetup: string;
  appOwnerAWSFolderName: string;
  appOwnerAlias: string;
  appOwnerBillCode: string;
  appOwnerBillingAddress: string;
  appOwnerCreditNoteCode: string;
  appOwnerCreditRegistryInfo: string;
  appOwnerCustomColors: string;
  appOwnerDecideInfo: string;
  appOwnerEmail: string;
  appOwnerExpenseCode: string;
  appOwnerFinancePaymentCode: string;
  appOwnerFirstCentralInfo: string;
  appOwnerId: number;
  appOwnerIncomeCode: string;
  appOwnerInvoiceCode: string;
  appOwnerItemCode: string;
  appOwnerJournalCode: string;
  appOwnerKey: string;
  appOwnerLoanApplicationCode: string;
  appOwnerLoanBatchCode: string;
  appOwnerLoanCode: string;
  appOwnerLoanDisbursementCode: string;
  appOwnerLoanOriginationId: string;
  appOwnerLoanPaymentCode: string;
  appOwnerMonnifyInfo: string;
  appOwnerName: string;
  appOwnerPersonCode: string;
  appOwnerPettyCashTransactionCode: string;
  appOwnerPhone: string;
  appOwnerPurchaseOrderCode: string;
  appOwnerRemitaInfo: string;
  appOwnerShippingAddress: string;
  appOwnerShortTermPlacementCode: string;
  appOwnerShortTermPlacementTypeCode: string;
  appOwnerVendorCreditNoteCode: string;
  appOwnerYouVerifyInfo: string;
  assetManagementSettings: string;
  bankAccountValidationSettings: string;
  bankInformation: string;
  calendlyIntegrationInfo: string;
  country: string;
  currency: {
    currencyId: number;
    countryUsing: string;
    currencyName: string;
    currencyCode: string;
    currencySymbol: string;
    currencyThousandSeparator: string;
  };
  currencyId: number;
  customerIdentifier: string;
  customerLoanSubmissionType: number;
  defaultAccountVerificationPartner: number;
  defaultBvnValidationPartner: number;
  defaultDaysInAYear: number;
  defaultDisbursementPartner: number;
  depositAccountCode: string;
  depositApplicationCode: string;
  depositProductCode: string;
  disbursementFailedSettings: string;
  encryptedData: string;
  encryptionKey: string;
  encryptionKeyIv: string;
  financeInteraction: string;
  financeStpInitialAccounts: any[];
  financeInteractionAccounts: {
    accountId: number;
    appOwnerId: number;
    financeInteractionAccountId: number;
    type: string;
    account: {
      accountId: number;
      name: string;
      reference: number;
      isReferenceAutoIncremented: boolean;
      transactionType: number;
      accountClassifications: [];
      accountType: number;
      createdAt: string;
      createdById: number;
      heirarchyLevel: number;
      isGroupAccount: boolean;
      isHeader: boolean;
      isPostingAccount: boolean;
      ledgerTransactions: [];
      parentId: number;
    };
  }[];
  financeInteractionData: {
    disbursementIsActive: boolean;
    disbursementMode: string;
    investmentAccruedIsActive: boolean;
    investmentAccruedMode: string;
    investmentInitialAndAccruedIsActive: boolean;
    investmentInitialAndAccruedMode: string;
    investmentInitialIsActive: boolean;
    investmentInitialMode: string;
    paymentIsActive: boolean;
    paymentMode: string;
    stpAccruedIsActive: boolean;
    stpAccruedMode: string;
    stpInitialAndAccruedIsActive: boolean;
    stpInitialAndAccruedMode: string;
    stpInitialIsActive: boolean;
    stpInitialMode: string;
  };
  investmentSetupInfo: string;
  isAccountVerified: boolean;
  isPaystackActive: boolean;
  loanCustomerCreationSetting: number;
  loanFormFieldRequirements: string;
  logoUrl: string;
  ofiCode: string;
  publicKey: string;
  skipVerification: boolean;
  smsSetupInfo: string;
  uniqueIdInformation: string;
  useAdditionalUniqueId: boolean;
  _appOwner2FASetup: {
    isActive: boolean;
    isActiveForCustomer: boolean;
    isActiveForStaff: boolean;
    isOptional: boolean;
    options: {
      useAuthApp: boolean;
      useSms: boolean;
    };
  };
  _appOwnerCustomColors: {
    primaryColor: string;
    secondaryColor: string;
  };
  _payStackInfo: {
    isActive: boolean;
    isDefaultAccountVerificationPartner: boolean;
    isDefaultBvnValidationPartner: boolean;
    isDefaultDisbursementPartner: boolean;
    publicKey: string;
    secretKey: string;
  };
  _smsSetupInfo: {
    activeSmsProviders: string;
    isActive: boolean;
    sendSmsEvents: {
      loanApproved: SMSEvent;
      oanDisbursed: SMSEvent;
      loanPaymentMade: SMSEvent;
      loanRepaymentDue: SMSEvent;
      loanSettled: SMSEvent;
    };
    smsProviderInfo: {
      africasTalkingSmsProviderInfo: {
        apiKey: string;
        senderId: string;
        userName: string;
      };
      multitexterSmsProviderInfo: {
        apiKey: string;
        password: string;
        senderName: string;
        useApiKey: boolean;
        userName: string;
      };
    };
  };
  decideInfo?: {
    autoApprove: boolean;
    autoApproveCriteria: [];
    trigger: String;
    isActive: boolean;
    canTriggerManually: boolean;
    canTriggerAutomatically: boolean;
  };
  isMultiTenant: boolean;
  loanBankAccountValidationSetting: boolean;
  financeInvestmentInitialAccounts: {
    accountClassifications: [];
    accountId: number;
    accountType: number;
    createdAt: string;
    heirarchyLevel: number;
    isActive: boolean;
    isGroupAccount: boolean;
    isHeader: boolean;
    isPostingAccount: boolean;
    isReferenceAutoIncremented: boolean;
    isSystemAccount: boolean;
    ledgerTransactions: [];
    name: string;
    parentId: number;
    reference: number;
    transactionType: number;
  }[];
}

interface SMSEvent {
  isActive: boolean;
  template: string;
}

export type Bank = {
  bankId: number;
  bankName: string;
  sortCode: string;
};

export interface ListItem {
  label: string;
  value: string;
  iconClass: string;
  type?: string;
}

export enum StepStatus {
  "complete" = 1,
  "current",
  "pending",
  "invalid",
}
export interface Step {
  id?: string;
  width?: string;
  height?: string;
  stage: string;
  type: string;
  status?: StepStatus;
  usePrimaryBg?: boolean;
}

export type AccordionItemData = {
  title?: string;
  value: string | number | string[];
  type?: "string" | "list" | "currency" | "percentage" | "number";
  tooltip?: string;
  showValueAsPill?: boolean;
  trailing?: string;
};

export type AccordionItem = {
  [key: string]: AccordionItemData[];
};

export type TableConfig = {
  theadLight?: boolean;
  theadBg?: boolean;
  small?: boolean;
  striped?: boolean;
  currency?: string;
  shadow?: boolean;
  summations?: boolean;
  bordered?: boolean;
  rowClickable?: boolean;
  uniqueIdPropLink?: string;
  searchPlaceholder?: string;
  legacySearch?: boolean;
  style?: { [key: string]: string };
  tdStyle?: { [key: string]: string };
};

export type ActionConfig = {
  showBtn: boolean;
  iconClass?: string;
  btnText: string;
  funcRef?: () => void;
};

export type TableData = {
  [key: string]: {
    tdValue: string | number | boolean;
    id?: number | string;
    type?:
      | "amount"
      | "code"
      | "date"
      | "status"
      | "stage"
      | "link"
      | "action"
      | "";
    defaultConfig?: { style?: { [key: string]: string }; class?: string };
    codeConfig?: { tooltip: string; tooltipPlacement?: "top" | "left" };
    dateConfig?: { format?: string; showTime?: boolean };
    statusConfig?: { class: string };
    actionConfig?: ActionConfig[];
    /**
     * @deprecated Use {@link TextAlignment} instead.
     */
    centered?: boolean;
    style?: { [key: string]: string };
    alignment?: TextAlignment;
  };
};

export type TableHeader = {
  name: string;
  type?: "amount" | "code" | "percent";
  /**
   * @deprecated Use {@link alignment} instead.
   */
  centered?: boolean;
  alignment?: TextAlignment;
};

export type TextAlignment = "left" | "center" | "right";

export type TableSubTab<T = any> = {
  text: string;
  currentTab: T;
  activeTab: boolean;
};

export enum LoanFilters {
  Disbursed = "Disbursed",
  Paid = "Paid",
}

export type GenericSpoolRequestPayload<T = any> = {
  pageNumber: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  filter?: any;
  selectedSearchColumn?: string;
  keyword?: string;
  items?: T[];
  branches?: string;
  loanProducts?: string;
  statuses?: string;
};

export type GenericSpoolResponsePayload<T = any> = {
  pageNumber: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  items?: T[];
  searchColumns: string[];
};

export type SearchParams = {
  keyword: string;
  pageNumber?: number;
  pageSize?: number;
  selectedSearchColumn: string;
};
export type UploadStat = { label?: string; value: number };

export type ImportError = {
  rowNumber: number;
  columnName: string;
  error: string;
};

export enum ImportErrorEnum {
  RequiredDataNotProvided = "RequiredDataNotProvided",
  DatabaseDuplicate = "DatabaseDuplicate",
  FileEmpty = "FileEmpty",
  WrongFile = "WrongFile",
  InvalidFormat = "InvalidFormat",
  OutOfRange = "OutOfRange",
  NotFound = "NotFound",
  SheetDuplicate = "SheetDuplicate",
  NegativeValueProvided = "NegativeValueProvided",
  ValueLessThanZero = "ValueLessThanZero",
}
export type TableSummation = {
  value: string | number | null;
  isLabel?: boolean;
};

export type LendaFile = {
  fileId: number;
  userId: number;
  filePath: string;
  fileName: string;
  originalName: string;
  activity: string;
  appOwnerKey: string;
  fileType: string;
};

export type TablePaginationChange = {
  pageNumber: number;
  pageSize: number;
  filter?: string;
  searchTerm?: string;
};

export type TableStatusClassProps = { loanStage?: string; status?: string };

export type LegacyPaginatedResponse = {
  body: {
    value: {
      data: any[];
      pages: number;
      totalRecords: number;
    };
  };
};

export type DtListItemType =
  | "date"
  | "number"
  | "amount"
  | "company"
  | "person"
  | "text"
  | "percent"
  | "code"
  | "badge";

export type UploadedFile = {
  activity: string;
  appOwnerKey: string;
  fileId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  originalName: string;
  userId: number;
};

export type BasicPaginationReqProps = {
  pageNumber: number;
  pageSize: number;
  keyword?: string;
  selectedSearchColumn?: string;
  filter?: string | string[];
};

export interface BasicListResponse<T> {
  pageNumber: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  items: T[];
  searchColumns: string[];
}

export type LayoutNav = {
  parent?: string;
  children: {
    icon: string;
    routerLink: string;
    title: string;
    canView: boolean;
    text: string;
  }[];
};

export type ComplexFilter = {
  id: string;
  label: string;
  placeholder: string;
  data: CustomDropDown[];
};

export type ComplexFiltersChange = {
  id: string;
  data: CustomDropDown;
};

export type LoadingState = {
  isLoading: boolean;
  text?: string;
};

export type CreateLinkInfo = {
  type?: "url";
  url?: string;
  text: string;
};

export enum Modules {
  Loan = "Loan",
  Investment = "Investment",
  UserManagement = "UserManagement",
  Checkout = "Checkout",
  Finance = "Finance",
  CRM = "CRM",
  Deposits = "Deposits",
  Workflow = "Workflow",
}

export type Module = { id: number; name: string };

export interface AppState {
  permissions: PermissionStoreState;
}

export type GenericList = {
  id: number;
  name: string;
};

export type ValidatePhoneNumberResBody = {
  id: string;
  address: {
    town: string;
    lga: string;
    state: string;
    addressLine: string;
  };
  status: string;
  dataValidation: boolean;
  selfieValidation: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  image: string;
  mobile: string;
  birthCountry: string;
  dateOfBirth: string;
  isConsent: boolean;
  nin: string;
  idNumber: string;
  businessId: string;
  type: string;
  advanceSearch: boolean;
  allValidationPassed: boolean;
  requestedAt: string;
  requestedById: string;
  country: string;
  createdAt: string;
  lastModifiedAt: string;
  requestedBy: {
    firstName: string;
    lastName: string;
    middleName: string;
    id: string;
  };
};

export enum FilterTypes {
  Status = "Status",
  Branch = "Branch",
  LoanProduct = "LoanProduct",
}

export type FilterMenuSelection = {
  [key: string]: CustomDropDown[];
};

export type FilterParams = {
  [key: string]: (string | number)[] | string;
};

export type CrmRedirect = {
  data: any;
  target?: AllModulesEnum;
};

export enum ExcelValueType {
  Numeric = "Numeric",
}

export type ExcelHeader = {
  name: string;
  type?: ExcelValueType;
  key: string;
};

export type ExcelConfig = {
  title: string;
  cellHeaderColor?: string;
};

export type ExcelData = {
  [key: string]: {
    values: object | any[];
    summations?: {
      name: string;
      values: {
        value: number;
        col: number;
      }[];
    };
  };
};
