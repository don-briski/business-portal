import {
  FormGroup,
  FormControl,
  FormArray,
  AbstractControl,
} from "@angular/forms";
import {
  User,
  Pagination,
  GenericSpoolRequestPayload,
} from "../shared/shared.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";

export type LoanPayment = {
  appOwnerKey: string;
  branch: {
    address: string;
    appOwnerKey: string;
    branchCode: string;
    branchId: number;
    branchName: string;
    countryId: number;
    createdAt: string;
    members: number;
    modifiedAt: string;
    state: string;
    stateId: number;
    status: number;
  };
  branchId: number;
  createdAt: string;
  createdBy: number;
  financePaymentId: number;
  lastPaymentEntryId: number;
  loanId: number;
  modifiedAt: string;
  paymentAmount: number;
  paymentAmountLeft: number;
  paymentAmountUsed: number;
  paymentCode: string;
  paymentDate: string;
  paymentId: number;
  paymentLine: [];
  paymentMode: number;
  paymentModeString: string;
  paymentSource: number;
  paymentSourceString: string;
  paymentType: number;
  paymentTypeString: string;
  person: {
    appOwnerKey: string;
    bankAccountDetailsList: [];
    billingAddressData: {};
    blacklistDetailsJson: [];
    branchId: number;
    contactPersonDetailsList: [];
    createdAt: string;
    dateOfBirth: string;
    displayName: string;
    emailAddress: string;
    firstName: string;
    hasInvestment: false;
    initials: string;
    isBvnValidated: false;
    lastName: string;
    lastPersonId: number;
    loanApplicationCount: number;
    personCode: string;
    personId: number;
    personStatus: number;
    phoneNumber: string;
    primaryContactData: { id: string };
    sex: string;
    shippingAddressData: {};
    socialMediaData: {};
    status: number;
    type: number;
    vendorCommentsData: [];
  };
  personId: number;
  postedToFinace: boolean;
  status: string;
  user: User;
  narration: string;
};

export type GetCustomerDetailsFromRemitaDto = {
  firstName: string;
  lastName: string;
  bvn: string;
  accountNumber: string;
  bankCode: string;
};

export type GetCustomerDetailsFromRemitaRes = {
  status: boolean;
  message: string;
  data: CustomerDetailsFromRemita;
};

export type RemitaSalaryHistoryItem = {
  paymentDate: string;
  amount: string;
  accountNumber: string;
  bankCode: string;
};

export type CustomerDetailsFromRemita = {
  customerId: string;
  customerName: string;
  bankCode: string;
  bvn: string;
  accountNumber: string;
  companyName: string;
  category: string;
  firstPaymentDate: string;
  salaryCount: string;
  salaryPaymentDetails: RemitaSalaryHistoryItem[];
  loanHistoryDetails: RemitaLoanHistoryItem[];
};

export type CustomerBVNDetails = {
  bvn: string;
  dob: string;
  firstName: string;
  lastName: string;
  mobile: string;
};

export type RemitaLoanInformation = {
  paymentDate: string;
  loanAmount: number;
  bankName: string;
  accountNumber: string;
  salary: number;
};

export type RemitaLoanHistoryItem = {
  loanProvider: string;
  loanAmount: number;
  loanDisbursementDate: string;
  outstandingAmount: number;
  repaymentAmount: number;
  repaymentFreq: string;
  status: string;
};

export type GetBlacklistedCustomersReqData = {
  pageNumber: number;
  pageSize: number;
  keyword: string;
  filter?: string;
};

export type GetBlacklistedCustomersResBody = Pagination & {
  items: BlacklistedCustomer[];
};

export type BlacklistedCustomer = {
  customerCode: string;
  fullName: string;
  personId: number;
  blacklistDetails: {
    blacklistedById: number;
    blacklistedRequestedAt: string;
    customerId: number;
    customerName: string;
    isBlacklistApproved: boolean;
    loanId: number;
    reason: string;
    requestedBy: string;
    requestedById: number;
    reviewedAt: string;
    reviewedBy: string;
  }[];
};

export type BacklistedCustomerFilter =
  | "Active"
  | "Blacklisted"
  | "BlacklistRequested"
  | "Deactivated"
  | "";

export type TransformedBlacklistedCustomer = {
  customerCode: string;
  fullName: string;
  personId: number;
  blacklistedById?: number;
  blacklistedRequestedAt?: string;
  customerId?: number;
  customerName?: string;
  isBlacklistApproved?: boolean;
  loanId?: number;
  reason?: string;
  requestedBy?: string;
  requestedById?: number;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type BlacklistCustomerDto = {
  customerId: number;
  isApproved: boolean;
  userId: number;
};

export type Customer = {
  bvn: string;
  createdAt: string;
  dateOfBirth: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
  originatingBranch: string;
  personCode: string;
  personId: number;
  phoneNumber: string;
};

export type GetLoanCustomersResBody = {
  value: {
    data: Customer[];
    pages: number;
    totalRecords: number;
  };
};

export type PreviousLoanApplication = {
  amountOutstanding: number;
  amountRepayed: number;
  applicationCode: string;
  dateDisbursed: string;
  loanAmount: number;
  loanCode: string;
  loanId: number;
  loanStage: string;
  status: string;
  totalAmountToBeRepayed: number;
  loanTypeInfo: {
    applyDSRCheck: boolean;
    buyOverAmount: string;
    createdByName: string;
    daysInaYear: 365;
    lendingInstitutionBankDetails: string;
    lendingInstitutionId: string;
    loanAmount: string;
    loanDuration: 13;
    loanInterestRate: string;
    loanReasonCode: string;
    loanReasonDescription: string;
    loanReasonID: string;
    loanReasonName: string;
    loanTypeCategory: string;
    loanTypeID: string;
    loanTypeName: string;
    outlet: string;
    parentLoanAmount: string;
    parentLoanCode: string;
    rateUnit: string;
    repaymentBalanceType: string;
    soldBy: string;
    soldByName: string;
    state: string;
  };
};

export type LoanType = {
  userId?: number;
  activeUssd: boolean;
  alternativeConditions: string;
  alternativeScoringPattern: string;
  appOwnerKey: string;
  applicableFees: string;
  applicablePlatform: string;
  applyDSRCheck: boolean;
  branchId: number;
  branchesApplicable: string;
  buyOverConstraints: string;
  buyOverEligibility: boolean;
  createdAt: string;
  createdBy: number;
  creditScoringRule: string;
  daysInAYear: number;
  dsrRate: number;
  interestRate: number;
  loanName: string;
  loanTypeCategories: string;
  loanTypeCode: string;
  loanTypeId: number;
  loanTypeTenor: number;
  maxAmount: number;
  maximumCreditScore: number;
  minAmount: number;
  minimumCreditScore: number;
  modifiedAt: string;
  rateUnit: number;
  repaymentBalanceType: string;
  repaymentMethods: string;
  repaymentType: string;
  status: string;
  termsAndConditions: string;
  topUpConstraints: {
    isTopUpActive: boolean;
    volumeOfRepayments: number;
    volumeOfRepaymentsIsActive: number;
    lateRepaymentsAllowableIsActive: boolean;
    lateRepaymentsAllowable: number;
    topUpDsrIsActive: boolean;
    topUpDsr: number;
    numberOfRepaymentsIsActive: boolean;
    numberOfRepayments: number;
    minLoanTenorIsActive: boolean;
    minLoanTenor: number;
  };
  topUpEligibility: true;
  accountClosureValue: string;
  thresholdParameter: {
    thresholdParameterId: number;
    thresholdParameterName: string;
    thresholdParameterValue: number;
    thresholdParameterType: number;
    thresholdParameterDescription: string;
  };
  isDepositRequired: boolean;
  loanDepositSettings?: {
    depositType: string;
    depositValue: number;
  };
  isMultiLevelLoanApproval: boolean;
  loanApplicationWorkflow?:string;
};

export type MandatePaymentHistory = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  employerName: string;
  salaryAccount: string;
  status: string;
  authorisationCode: string;
  collectionStartDate: string;
  customerId: string;
  dateOfDisbursement: string;
  disbursementAccount: string;
  disbursementAccountBank: string;
  totalDisbursed: number;
  lenderDetails: string;
  loanMandateReference: string;
  outstandingLoanBal: string;
  salaryBankCode: string;
  totalAmountExpected: number;
};

export type payroll = {
  "First Name": string;
  "Last Name": string;
  "Staff Number": number;
  Gender: string;
  "Date Of Birth": string;
  "Phone Number": string;
  Email: string;
  BVN: string;
  "Account Number": string;
  Bank: string;
  Ministry: string;
  "Grade Level": number;
  "Profile Score": number;
  "Gross Salary": number;
  "Total Deductions": number;
  "Total Loans": number;
};

export type PayrollData = {
  items: payroll[];
  rows?: number;
  totalNetPay?: number;
};

export type ApplicableFee = {
  calculatedFeeAmount?: number;
  feeAmount: number;
  feeApplication: string;
  feeID: number;
  feeIsMandatory: string;
  feeName: string;
  feeType: string;
};

export type LoanDetails = {
  loanName: FormControl<string | null>;
  loanTypeCode: FormControl<string | null>;
  branchesApplicable: FormControl<CustomDropDown[] | string | null>;
  applicablePlatform: FormControl<string[] | null>;
  termsAndConditions: FormControl<string | null>;
};

export type TermsAndParameters = {
  interestRate: FormControl<string | null>;
  rateUnit: FormControl<string | number | null>;
  loanTypeTenor: FormControl<string | null>;
  minAmount: FormControl<string | null>;
  maxAmount: FormControl<string | null>;
  dsrRate: FormControl<string | null>;
  isDepositRequired: FormControl<boolean | null>;
  depositType?: FormControl<string | number | null>;
  depositValue?: FormControl<number | null>;
};

export type Repayment = {
  repaymentType: FormControl<string | number | null>;
  repaymentBalanceType: FormControl<string | null>;
  repaymentMethods: FormControl<string[] | string | null>;
  accountClosureValue: FormControl<string | null>;
  thresholdParameterId: FormControl<string | number | null>;
  daysInAYear: FormControl<string | number | null>;
};

export type TopUpConstraints = {
  isTopUpActive: FormControl<boolean | null>;
  volumeOfRepaymentsIsActive: FormControl<boolean | null>;
  volumeOfRepayments: FormControl<number | null>;
  lateRepaymentsAllowableIsActive: FormControl<boolean | null>;
  lateRepaymentsAllowable: FormControl<number | null>;
  topUpDsrIsActive: FormControl<boolean | null>;
  topUpDsr: FormControl<number | null>;
  numberOfRepaymentsIsActive: FormControl<boolean | null>;
  numberOfRepayments: FormControl<number | null>;
  minLoanTenorIsActive: FormControl<boolean | null>;
  minLoanTenor: FormControl<number | null>;
};

export interface LoanTypeForm {
  loanTypeId?: FormControl<number | null>;
  status: FormControl<string | null>;
  userId: FormControl<number | null>;
  loanDetails: FormGroup<LoanDetails>;
  termsAndParameters: FormGroup<TermsAndParameters>;
  repayment: FormGroup<Repayment>;
  topUpConstraints: FormGroup<TopUpConstraints>;
  applicableFees: FormArray;
  loanApplicationWorkflow: FormControl<string>;
  loanApplicationWorkflowId: FormControl<string>;
  isMultiLevelLoanApproval: FormControl<boolean>;
}

export interface UpdateDisbFailed {
  updateDisbursementFailedDtos?: {
    loanId?: number;
    briefDescription?: string;
  }[];
}

export interface DisbursementFailed {
  code: string;
  applicant: string;
  loanAmount: number;
  loanId: number;
  stage: string;
}

export type DeactivatedApplication = {
  id: number;
  applicationCode: string;
  branch: string;
  applicant: string;
  modifiedAt: string;
  amount: number;
  stage: string;
  status: string;
  createdBy: string;
};

export type GetDeactivatedApplicationsResBody = Pagination & {
  items: DeactivatedApplication[];
};

export type DeactivatedLoan = {
  amount: number;
  applicant: string;
  branch: string;
  id: number;
  loanCode: string;
  modifiedAt: string;
  stage: string;
};

export type GetDeactivatedLoansResBody = Pagination & {
  items: DeactivatedLoan[];
};

export enum LoansPageCurrentView {
  Loans = "Loans",
  AwaitingDisbursementConfirmation = "AwaitingDisbursementConfirmation",
  DeactivatedLoans = "DeactivatedLoans",
}

export enum LoanAppsPageCurrentView {
  AllLoanApplications = "AllLoanApplications",
  OpenLoanApplications = "OpenLoanApplications",
  AwaitingPoolApproval = "AwaitingPoolApproval",
  ReviewedLoanApplications = "ReviewedLoanApplications",
  DeactivatedLoanApplications = "DeactivatedLoanApplications",
  FailedDisbursements = "FailedDisbursements",
}

export type DisbursementReport = {
  loanCode: string;
  applicationCode: string;
  employeeCode: number;
  firstName: string;
  surname: number;
  phoneNumber: string;
  emailAddress: string;
  loanAmount: number;
  disbursedAmount: number;
  depositAmount: number;
  depositRecieved: "Yes" | "No";
  upFrontFees: number;
  loanTerm: number;
  loanPeriodicInstallment: number;
  employerName: string;
  state: string;
  creationDate: string;
  disbursementDate: string;
  productType: string;
  loanStatus: string;
  branch: string;
  salesAgent: string;
  rate: number;
  bankAccountNumber: string;
  bankName: string;
  dateOfBirth: string;
  dateOfEmployment: string;
  loanApplicationCategory: string;
  disbursementTat: number;
  salesAgentStaffId: string;
  reviewer: string;
  dateApproved: string;
  timeApproved: string;
  customerCode: string;
  parentLoanOutStandingAmount: number;
  totalFeesCharged: number;
  parentLoanCode: string;
  loanStartDate: string;
  createdBy: string;
};

type DisbursementExternalIdentifier = {
  RequestReference: string;
  TransactionReference: string;
  ResponseCode: number;
  Status: boolean;
  Message: string;
  Data: string;
  LoanId: number;
  DisbursementPartner: string;
  SessionId: string;
}

export type LoansAwaitingDisbursement = {
  applicationCode?: string;
  loanCode?: string;
  applicant?: string;
  customerName?: string;
  bank: string;
  bankAccountNumber: string;
  dateDisbursed: string;
  lag: string;
  disbursementAmount?: number;
  loanAmount?: number;
  loanId: number;
  disbursementPartner: string;
  internalReference: string;
  partnerLoanReference: string;
  disbursementExternalIdentifier?: DisbursementExternalIdentifier;
  loanStatus: string;
};
export type LoanSearchParam = {
  filter: string;
  keyword: string;
  selectedSearchColumn: string;
};

export type SearchedLoanData = {
  loanCode: string;
  loanTenor: number;
  loanId: number;
  loanTypeId: number;
  customer: string;
  loanType: string;
  loanTypeTenor: number;
  personId: number;
  branchId: number;
  branchName: string;
  loanAmount: number;
  netIncome: number;
  periodicRepaymentAmount: number;
  totalRepaymentOutstanding: number;
  lastPaymentDate: string;
};

export type SearchLoansResponse = Pagination & {
  items: SearchedLoanData[];
};

export type BVNInfo = {
  IsBvnValidated: boolean;
  bvnDOB: string;
  bvnFirstName: string;
  bvnLastName: string;
  bvnNumber: string;
  bvnPhoneNumber: string;
};

export type LoanInformation = {
  amountOutstanding: number;
  amountRepayed: number;
  appOwnerKey: string;
  applicationCode: string;
  bankInfo: string;
  branch: { branchName: string };
  branchId: number;
  buyOverAmount: number;
  bvnInfo: string;
  calculatedEffectiveSettlementAmount: number;
  calculatedSettlementAmount: number;
  createdAt: string;
  createdBy: number;
  creditScore: number;
  creditScoreChecked: boolean;
  dateApproverClaimed: string;
  disbursedAmount: number;
  disbursementUpdateStage: string;
  employerVerified: boolean;
  employmentInfo: string;
  fees: number;
  files: [];
  identifier: string;
  isBulkUploaded: boolean;
  isDecideActive: boolean;
  isRemitaDisbursementSentNotificationSuccessful: boolean;
  isRemitaStopLoanCollectionSentNotificationSuccessful: boolean;
  isSettled: boolean;
  lastApplicationEntryId: number;
  lastLoanEntryId: number;
  loanAccountStatus: string;
  loanAmount: number;
  loanBalance: number;
  loanId: number;
  loanRedraftLogs: [];
  loanStage: string;
  loanTenor: number;
  loanType: {};
  loanTypeId: number;
  loanTypeInfo: string;
  modifiedAt: string;
  nextRepaymentAmount: number;
  payment: [];
  person: { personId: number; emailAddress: string; phoneNumber: string };
  personId: number;
  recordEntryMedium: string;
  redraftFrequency: number;
  redraftReasons: string;
  redraftReasonsList: [];
  remitaLoanInformation: string;
  repaymentInfo: string;
  repaymentMethodVerificationInfo: string;
  repaymentMethodVerified: boolean;
  repaymentSchedule: [];
  repaymentScheduleType: string;
  residentialInfo: string;
  reviewClaimedById: number;
  reviewClaimer: {};
  salesPerson: {};
  settlementAmountRepayed: number;
  soldBy: number;
  state: string;
  stateId: number;
  status: number;
  statusString: string;
  totalAmountExpected: number;
  totalAmountPaid: number;
  totalAmountRepaid: number;
  totalAmountToBeRepayed: number;
  totalFees: number;
  user: {};
  loanDeposit: string;
  loanStartDate: string;
  preferredFirstRepaymentDate: string;
};

export type Loan = {
  id: number;
  loanCode: string;
  applicant: string;
  loanAmount: number;
  amountRepaid: number;
  loanBalance: number;
  stage: string;
  branch: string;
  modifiedAt: string;
};

export type GetLoansResBody = Pagination & {
  items: Loan[];
};

export type LoanApplicationPaginationModel = {
  userId: number;
  pageNumber: number;
  pageSize: number;
  resultExpected?: "Open" | "Closed";
  status?: string;
};

export type BankInfo = {
  bankAccountNumber: string;
  bankSortCode: string;
  bankAccountName: string;
  bankName: string;
};

export type ResidentialInfo = {
  address: string;
  utilityBill: string;
  fileUploadType: string;
  customerPhoneNumber: string;
  customerAltPhoneNumber: string;
  nextOfKinName: string;
  nextOfKinPhoneNumber: string;
  nextOfKinAddress: string;
};

export type EmploymentInfo = {
  employerID: number;
  employerName: string;
  employmentCode: string;
  employerAddress: string;
  employmentStatus: string;
  employmentIndustry: string;
  employerPayDate: string;
  employmentLevel: string;
  WorkEmail: string;
  WorkPhone: string;
  employmentYears: string;
  netIncome: number;
  bankStatement: string;
  bankStatementBankSortCode: string;
  bankStatementIsPassworded: boolean;
  bankStatementPassword: string;
  fileUploadType: string;
};

export type FailedDisbursement = {
  loanId: number;
  loanBatchCode: string;
  applicationCode: string;
  fees: number;
  buyOverAmount: number;
  identifier: string;
  loanAmount: number;
  disbursedAmount: number;
  loanTenor: number;
  status: string;
  branchName: string;
  loanBatchId: number;
  branchId: number;
  loanTypeName: string;
  customerName: string;
  isCustomerBvnValidated: boolean;
  customerStatus: string;
  personId: number;
  createdBy: number;
  repaymentInfo: {
    repaymentMethod: string;
    repaymentStartDate: string;
    clientAuthorizationCode: string;
  };
  createdAt: string;
  dateApproverClaimed: string;
  dateApproverApproved: string;
  dateDisburserClaimed: string;
  dateRepaymentApproved: string;
  dateDisbursed: string;
  amountRepayed: number;
  totalAmountToBeRepayed: number;
  loanBalance: number;
  amountOutstanding: number;
  loanStage: string;
  amountDisbursed: number;
  lagPeriod: string;
  disbursementUpdateStatus: string;
  disbursementUpdateStage: string;
  bankInfo: BankInfo;
  disbursementClaimer: "Motun S";
  disbursementTrailCount: number;
  redraftReasonsList: [];
  residentialInfo: ResidentialInfo;
  employmentInfo: EmploymentInfo;
};

export type LoanProfile = {
  imgUrl?: ArrayBuffer | string;
  name?: string;
  dob?: string;
  newProfileImg?;
  fileName?: string;
  base64Img?: ArrayBuffer | string;
};

export type GetLoansInApplicationPoolOrDisbReq = {
  pageNumber: number;
  pageSize: number;
  branches?: number[];
  loanProducts?: number[];
  selectedSearchColumn?: string;
  keyword?: string;
};

export type LoanInApplicationPool = {
  repaymentScheduleType: string;
  loanTenor: number;
  loanId: number;
  applicationCode: string;
  customerName: string;
  loanAmount: number;
  branchName: string;
  loanTypeName: string;
  createdAt: string;
  customerImageUrl: string;
};

export enum LoanApplicationStages {
  "open" = "Open",
  "closed" = "Closed",
  "all" = "All",
  "approved" = "Approved",
}

export type GetLoanApplicationsReq = GenericSpoolRequestPayload & {
  resultExpected?: LoanApplicationStages;
  status?: string;
};

export type OpenLoanApplication = {
  loanStage: string;
  status: string;
  createdBy: number;
  createdByName: string;
  loanId: number;
  applicationCode: string;
  customerName: string;
  loanAmount: number;
  branchName: string;
  loanTypeName: string;
  createdAt: string;
  dateApproved: string;
};

export type FailedDisbursementApplication = {
  disbursementUpdateStage: string;
  disbursementUpdateStatus: string;
  loanId: number;
  loanCode: string;
  applicationCode: string;
  customerName: string;
  loanAmount: number;
  branchName: string;
  loanTypeName: string;
  createdAt: string;
  loanBatchCode: string;
  disbursementTrailCount: number;
};

export type GetAwaitingPoolApprovalLoans = GenericSpoolRequestPayload & {
  status?: string;
};

export type OpenOrReviewedClaimedApplication = {
  loanId: number;
  applicationCode: string;
  status: string;
  customerName: string;
  loanAmount: number;
  createdAt: string;
  dateApproverApproved: string;
  loanStage: string;
  branchName: string;
  personId: number;
  dateSubmitted: string;
};

export type AllClaimedApplication = {
  loanId: number;
  applicationCode: string;
  applicantName: string;
  dateSubmitted: string;
  dateApproved: string;
  status: string;
  reviewerName: string;
  loanAmount: number;
  loanStage: string;
  personId: number;
  isMultiLevelLoanApproval: boolean;
};

export type UnverifiedApp = {
  applicationCode: string;
  createdAt: string;
  customerName: string;
  dateApproverApproved: string;
  lagPeriod: string;
  loanAmount: number;
  loanId: number;
  loanTypeName: string;
  repaymentInfo: string;
  stage: string;
  status: string;
};

export type GetUnverifiedAppsResBody = { items: UnverifiedApp[] } & Pagination;

export type LoanApprovalRole = {
  id: number;
  name: string;
  description: string;
};

export type LoanApprovalPermission = {
  id: number;
  name: string;
};

export type LoanApprovalLevel = {
  id: number;
  name: string;
  permissions: { permissionId: number; permissionName: string }[];
  approvingRoles: LoanApprovalRole[];
};

export type LoanApprovalWorkflow = {
  id: number;
  name: string;
  assignedLoanTypes: string[];
  createdAt: string;
  approvalLevelsCount: number;
  approvalLevels: LoanApprovalLevel[];
};

export type CreateLoanApprovalWorkflowDto = {
  id?: number;
  name: string;
  approvalLevels: LoanApprovalLevel[];
};

export type LoanEditPermission = {
  permissionId: number;
  permissionName: string;
};

export type LoanDocument = {
  fileId: number;
  filePath: string;
  fileName: string;
};

export type LoanAppDetails = {
  loanId: number;
  loanAmount: number;
  interest: number;
  loanTenor: number;
  loanStartDate: string;
  documents: LoanDocument[];
  requiredPermissions: LoanEditPermission[];
  bankInformation: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    bankSortCode: string;
  };
};

export type UpdateLoanDto = {
  loanId: number;
  loanAmount: number;
  interest: number;
  loanTenor: number;
  loanStartDate: string;
  bankInformation: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    bankSortCode: string;
  };
};

export type LoanApprovalFlow = {
  level: string;
  status: string;
};

export type LoanWithApprovalReview = {
  action: string;
  comment: string;
  createdAt: string;
  id: number;
  level: string;
  reviewedBy: string;
  reviewedById: number;
  role: string;
};

export type LoanWithApprovalWorkflow = {
  status: string;
  interestRate: number;
  loanTenor: number;
  netIncome: number;
  repaymentMethod: string;
  createdById: number;
  createdBy: string;
  approvalFlow: LoanApprovalFlow[];
  documents: [];
  reviews: LoanWithApprovalReview[];
  loanId: number;
  applicationCode: string;
  customerName: string;
  loanAmount: number;
  branchName: string;
  loanTypeName: string;
  createdAt: string;
};

export type ReviewLoanWithApprovalFlowDto = {
  loanId: number;
  loanApprovalAction: string;
  rejectToLevelId: number;
  comment: string;
  redraftReasonIds: number[];
};

export type ReassignLoanDto = {
  loanIds: number[];
  assignedUserId: number;
};
