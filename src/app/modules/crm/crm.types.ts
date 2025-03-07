import { AllModulesEnum } from "src/app/util/models/all-modules.enum";
import {
  GenericSpoolRequestPayload,
  GenericSpoolResponsePayload,
} from "../shared/shared.types";

export type CRMCustomerDetail = {
  id?: string;
  InvestorId?: number;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  middleName?: string,
  dateOfBirth?: string;
  phoneNumber?: string;
  bvn?: string;
  email?: string;
  address?: string;
  nextOfKinFirstName?: string;
  nextOfKinLastName?: string;
  nextOfKinDateOfBirth?: string;
  nextOfKinPhoneNumber?: string;
  nextOfKinRelationship?: string;
  nextOfKinEmailAddress?: string;
  nextOfKinAddress?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  netIncome?: number;
  bankId?: number | string;
  bankName?: string;
  employmentStatus?: string;
  gender?: string;
  maritalStatus?: string;
  status?: CustomerType | string;
  modifiedAt?: string;
  createdBy?: string;
};

export type InvestmentDetail = {
  personId?: number,
  firstName?: string,
  middleName?: string,
  lastName?: string,
  phoneNumber?: string,
  emailAddress?: string,
  bvn?: string,
  personCode?: string,
  createdAt?: string,
  address?: string,
  investorType?: string
};

export type SharedInvestorData = {
  email?: string
  data?: InvestmentDetail;
  type?: string;
}

export type CRMCustomer = Pick<
  CRMCustomerDetail,
  "id" | "firstName" | "lastName" | "email" | "phoneNumber" | "status"
>;

export type FetchCRMCustomersResponse =
  GenericSpoolResponsePayload<CRMCustomer>;

export type CreateCRMProspectResponse = {
  data: string;
  status: boolean;
  message: string;
};

export type CaseType = {
  id?: number;
  name: string;
  description: string;
  isActive: boolean;
};
export type CrmCustomerCase = {
  id?: number;
  prospectId: string;
  title: string;
  createdAt?: string;
  description: string;
  caseType: string;
  caseTypeId?: number;
  stage: PROSPECT_CASE_STAGE | string;
};

export enum PROSPECT_CASE_TYPE {
  FollowUp = "FollowUp",
  Support = "Support",
  FeatureRequest = "FeatureRequest",
  Enquiries = "Enquiries",
  Others = "Others",
}

export enum PROSPECT_CASE_STAGE {
  Open = "Open",
  InProgress = "InProgress",
  Resolved = "Resolved",
  Closed = "Closed",
}

export type CreateCaseNote = {
  id?: number;
  prospectCaseId: number;
  text: string;
};

export type CaseNote = {
  id: number;
  text: string;
  createdById: number;
  createdBy: string;
  createdAt: string;
  isEdit?: boolean;
};

export enum CustomerType {
  Prospect = "Prospect",
  Customer = "Customer",
}

export type FetchCustomerProduct = GenericSpoolRequestPayload & {
  customerId: string;
};

export type CustomerLoanProduct = {
  loanCode: string;
  loanAmount: number;
  amountToBeRepayed: number;
  id: number;
  createdAt: string;
  modifiedAt: string;
};

export type CustomerInvestmentProduct = {
  investmentCode: string;
  investmentAmount: number;
  maturityAmount: number;
  status: string;
  id: number;
  createdAt: string;
};
