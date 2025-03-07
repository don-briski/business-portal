import { createReducer, on } from "@ngrx/store";
import {
  clearModulePermissions,
  clearPermissionSelection,
  removeModulePermissionSelection,
  setModulePermissions,
  setPermissionSelection,
} from "./actions";
import {
  PermissionClassificationV2,
  PermissionSelectionState,
} from "../../models/user.type";

export interface PermissionStoreState {
  permissionSelection: PermissionSelectionState[];
  modulePermissions: {
    moduleId: number;
    permissions: PermissionClassificationV2[];
  }[];
}

export const initialState: PermissionStoreState = {
  permissionSelection: [],
  modulePermissions: [],
};

export const permissionReducer = createReducer(
  initialState,
  on(setPermissionSelection, (state, { roleId, moduleId, addedPermissions, removedPermissions }) => {
    const existingIndex = state.permissionSelection.findIndex(
      (module) => module.moduleId === moduleId && module.roleId === roleId
    );
    if (existingIndex > -1) {
      const updatedPermissionSelection = state.permissionSelection.map(
        (module, index) =>
          index === existingIndex
            ? { ...module, addedPermissions: [...addedPermissions], removedPermissions: [...removedPermissions] }
            : module
      );

      return {
        ...state,
        permissionSelection: updatedPermissionSelection,
      };
    } else {
      return {
        ...state,
        permissionSelection: [
          ...state.permissionSelection,
          { roleId, moduleId, addedPermissions, removedPermissions },
        ],
      };
    }
  }),
  on(removeModulePermissionSelection, (state, {roleId, moduleId}) => {
    const updatedPermissionSelection = state.permissionSelection.filter((mod) => mod.moduleId !== moduleId && mod.roleId === roleId);
    return {
      ...state,
      permissionSelection: [...updatedPermissionSelection]
    }
  }),
  on(clearPermissionSelection, (state) => ({
    ...state,
    permissionSelection: [],
  })),
  on(setModulePermissions, (state, { modulePermissions }) => {
    const moduleId = modulePermissions.moduleId;
    const currentState = state.modulePermissions;
    const isModuleSaved = currentState.some((x) => x.moduleId === moduleId);
    return {
      ...state,
      modulePermissions: !isModuleSaved
        ? [...state.modulePermissions, modulePermissions]
        : [...state.modulePermissions],
    };
  }),
  on(clearModulePermissions, (state) => ({
    ...state,
    modulePermissions: [],
  }))
);
