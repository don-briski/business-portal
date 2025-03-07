export interface CreateDepositAccountModel {
  depositProductId: number;
  depositAmount: number;
  branchId: number;
  createdByUserId: number;
  personId?: number;
  customerType: DepositAccountCustomerType;
  groupId?: number;
  openingBalance?: number;
  startDate?: string;
  termLength?: number;
  depositSource?: DepositAccountSource;
  debitFrequency: DepositDebitFrequency;
  description?: string;
  savingsGoalTarget?: number;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  title?: string;
  gender?: string;
  phoneNumber?: string;
  emailAddress?: string;
  dateOfBirth?: string;
  residentialAddress?: string;
  maximumWithdrawalAmount: number;
  recommendedDepositAmount: number;
  interestRate: number;
}

export enum DepositAccountCustomerType {
  Person = "Person",
  Group = "Group",
}

export enum DepositAccountSource {
  Card = "Card",
}

export enum DepositDebitFrequency {
  Daily = "Daily",
  Weekly = "Weekly",
  Monthly = "Monthly",
}

export interface TempDepositStatusUpdateModel {
  tempDepositDetailsId: number;
  transactionPin?: string;
  userId: number;
  comment?: string;
  status: DepositAccountTempDetailsStatus;
}

export enum DepositAccountTempDetailsStatus {
  Created = "Created",
  Redraft = "Redraft",
  Approved = "Approved",
  Withdrawn = "Withdrawn",
  Rejected = "Rejected",
}

export interface DepositApplicationsRequestModel {
  pageNumber: number;
  pageSize: number;
  createdByUserId?: number;
  depositProductId?: number;
  customerType?: DepositAccountCustomerType;
  status?: DepositAccountTempDetailsStatus;
  depositAccountCategory?: DepositProductCategory;
  depositProductType?: DepositProductType;
}

export enum DepositProductType {
  SavingsAccount = "SavingsAccount",
  FixedDeposit = "FixedDeposit",
  SavingsPlan = "SavingsPlan",
}

export enum DepositProductCategory {
  BusinessDeposit = "BusinessDeposit",
  PersonalDeposit = "PersonalDeposit",
}

export interface EditDepositAccountModel {
  tempDepositDetailsId: number;
  maximumWithdrawalAmount?: number;
  recommendedDepositAmount?: number;
  interestRate?: number;
  savingsGoalTarget?: number;
  description?: string;
}

export interface DepositAccountsRequestModel {
  pageNumber: number;
  pageSize: number;
  depositProductId?: number;
  branchId?: number;
  approvedByUserId?: number;
  status?: DepositAccountStatus;
}

export enum DepositAccountStatus {
  Approved = "Approved",
  Active = "Active",
  Matured = "Matured",
  Locked = "Locked",
  Dormant = "Dormant",
  Closed = "Closed",
}

export interface CreateDepositAccountTransactionModel {
  depositAccountId: number;
  transactionType: NewDepositTransactionType;
  amount: number;
  backDate: string;
  bookingDate: string;
  channelId: number;
  branchId: number;
  comment: string;
  notes: string;
}

export enum NewDepositTransactionType {
  Deposit = "Deposit",
  Withdrawal = "Withdrawal",
}

export interface CreateDepositAccountFeeModel {
  depositAccountId: number;
  depositFeeId: number;
  amount: number;
  comment: string;
  branchId: number;
}

export interface DepositAccountTransactionRequestModel {
  pageNumber: number;
  pageSize: number;
  depositAccountId: number;
  transactionType: DepositAccountTransactionType;
  startDate: string;
  endDate: string;
}

export enum DepositAccountTransactionType {
  Deposit = "Deposit",
  Withdrawal = "Withdrawal",
  Fee = "Fee",
  InterestApplied = "InterestApplied",
  Transfer = "Transfer",
}

export interface CreateDepositSetupCodesReqBody {
  depositProductCode: string;
  depositAccountCode: string;
  depositApplicationCode: string;
}

export interface DepositGroup {
  appOwnerKey: string;
  createdAt: string;
  createdBy: string;
  groupId: number;
  groupCode: string;
  groupName: string;
  modifiedBy: string;
  members?: GroupMember[];
  memberRoles?: {
    personId: number;
    personName: string;
    roleId: number;
    role: string;
  }[];
}

export interface GroupMember {
  personId: number;
  personName: string;
}

export interface GetDepositGroupsResBody {
  data: {
    pageNumber: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    items: DepositGroup[];
  };
}

export interface GetDepositGroupResBody {
  data: DepositGroup;
}
