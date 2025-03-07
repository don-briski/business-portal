import { GenericList } from "../../shared/shared.types";

export type DisbursementLimitGroup = {
  id?: number;
  name: string;
  category: DISBURSEMENT_CATEGORY;
  members: DisbursementLimitGroupMember[];
};

export type DisbursementLimitGroupMember = {
  entityName: string;
  entityId: number;
};

export enum DISBURSEMENT_LIMIT_TAB {
  disbursementLimit = "disbursementLimit",
  limitAlert = "limitAlert",
  group = "group",
}

export enum DISBURSEMENT_CATEGORY {
  Employer = "Employer",
  ProductType = "ProductType",
  State = "State",
  Branch = "Branch",
  Group = "Group"
}

export enum DISBURSEMENT_LIMIT_POPUP {
  groupMembers = "groupMembers",
  addEditGroup = "addEditGroup",
  limitDetail = "limitDetail",
}

export type DisbursementLimit = {
  id: number;
  code: string;
  category: string;
  limitAmount: number;
  isActive: boolean;
  entityName:string;
  minimumAlertThreshold: MinimumAlertThreshold;
};

type MinimumAlertThreshold = {
  type: string;
  amount: number;
};

export type DisbursementLimitDetail = {
  id: number;
  code: string;
  category: string;
  limitAmount: number;
  isActive: true;
  entityId: number;
  entityName: string;
  resetFrequency: string;
  preventDisbursement: boolean;
  alertThresholds: MinimumAlertThreshold[];
  frequencyStartDate:string;
};

export type SetLimitAlert = {
  allUsers: boolean;
  allRoles: boolean;
  roles: GenericList[];
  users: GenericList[];
};

export type AlertThreshold = {
  type: string;
  amount: number;
};

export type CreateEditDisbursementLimit = {
  category: string;
  isActive: boolean;
  preventDisbursement: boolean;
  entityId: number;
  limitAmount: number;
  entityName: string;
  resetFrequency: string;
  alertThresholds: AlertThreshold[];
  id?:number
};
