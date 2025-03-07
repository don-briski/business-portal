import { Module } from "../../shared/shared.types";

export type CreateUserResBody = {
  userId: number;
  personId: number;
  displayName: string;
};

export type AddUserRoleData = {
  userId: number;
  roleId?: number;
  roleName?: string;
  permissions?: { itemName: string }[];
  branchView?: string;
};

export type GetClaimedAppReviewersResponse = {
  userId: number;
  personId: number;
  displayName: string;
};

type Permission = { id: number; name: string; active?:boolean };

export type Role = {
  id: number;
  name: string;
  description: string;
  moduleAccess?: Module[];
  accessibleModules?: string;
  permissions?: {
    classificationId: number;
    classification: string;
    permissions: Permission[];
  }[];
};

export type UpsertRoleRequestPayload = {
  roleId?: number;
  roleName: string;
  description: string;
  branchId: number;
  permissions: number[];
};

export type PermissionClassification = {
  classificationId: number;
  classification: string;
  moduleId?:number;
  permissions: Permission[];
  masterChecked?: boolean;
  displayPermissions?: Permission[][];
  tag?: string;
};

export type RoleDetail = {
  permissions: {
    classificationId: number;
    classification: string;
    permissions: Permission[];
  }[];
  id: number;
  name: string;
  description: string;
  moduleAccess: {
    id: number;
    name: string;
  }[];
};

export type PermissionV2 = {
  id: number;
  name: string;
  isSelected: boolean;
};

export type PermissionSelection = { classificationId: number; permissionId: number };

export interface PermissionSelectionState {
  roleId: number;
  moduleId: number;
  addedPermissions: PermissionSelection[];
  removedPermissions: PermissionSelection[];
};

export type PermissionClassificationV2 = {
  classificationId: number;
  classification: string;
  permissions: Permission[];
}
