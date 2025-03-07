import { GenericSpoolResponsePayload } from "../../shared/shared.types";

export type WacsCustomer = {
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  ippisNumber: string;
  bvn: string;
  wacsCustomerId: number;
  customerId: number;
  customerCode: string;
  createdAt: string;
};

export type GetWacsCustomersResponse =
  GenericSpoolResponsePayload<WacsCustomer>;

export type RegisteredWacsCustomer = {
  id: number;
  mda: string;
  pfaName: string;
  accountName: string;
  accountNumber: string;
  bank: string;
  bankCode: string;
  bvn: string;
  currentSalary: number;
  ippisNumber: string;
  nationality: string;
  address: string;
  state: string;
  employeeStatus: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    middleName: string;
    phoneNumber: string;
    email: string;
    role: string;
    dateOfBirth: string;
  };
};

export type WacsCustomerDetail = {
  customer: RegisteredWacsCustomer;
  nextOfKinInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    houseNumber?: string;
    street1?: string;
    nearestLandMark?: string;
    country?: string;
    state?: string;
    stateId?: number;
    localGovernmentArea?: string;
    lgaId?: number;
  };
  refereeInfo?: [
    {
      firstName?: string;
      lastName?: string;
      phone?: string;
      houseNumber?: string;
      street1?: string;
      nearestLandMark?: string;
      country?: string;
      state?: string;
      stateId?: number;
      localGovernmentArea?: string;
      lgaId?: number;
    }
  ];
};

export type WascCustomerDetail = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  customerCode?: string;
  role?: string;
  pfaName?: string;
  ippisNumber?: string;
  bvn?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  bankSortCode?: string;
  currentSalary?: number;
  employeeStatus?: string;
  wacsCustomerId?: number;
  gender?: string;
  dob?: string;
  address?: string;
  nextOfKinInfo?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    houseNumber?: string;
    street1?: string;
    nearestLandMark?: string;
    country?: string;
    state?: string;
    stateId?: number;
    localGovernmentArea?: string;
    lgaId?: number;
  };
  refereeInfo?: [
    {
      firstName?: string;
      lastName?: string;
      phone?: string;
      houseNumber?: string;
      street1?: string;
      nearestLandMark?: string;
      country?: string;
      state?: string;
      stateId?: number;
      localGovernmentArea?: string;
      lgaId?: number;
    }
  ];
};

export type LoanHistoryReq = {
  relatedObject: string;
  relatedObjectId: number;
};

export type Activity = {
  appActivityId: number;
  userId: number;
  personId: number;
  person: string;
  activityDescription: string;
  relatedObject: string;
  relatedObjectId: number;
  relatedObjectInitiatorCode: string;
  relatedObjectRecipientCode: string;
  branch: string;
  branchId: number;
  appOwnerKey: string;
  activityDate: string;
};

export type RegisterWacsCustomer = {
  ippisNumber: string;
  bvn: string;
  accountNumber: string;
  accountName: string;
  bank: string;
  bankCode: string;
};
