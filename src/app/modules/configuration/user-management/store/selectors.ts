import { createSelector } from "@ngrx/store";
import { AppState } from "src/app/modules/shared/shared.types";
import { PermissionStoreState } from "./reducers";

export const selectFeature = (state: AppState) => state.permissions;

export const permissionSelectionSelector = createSelector(
  selectFeature,
  (state: PermissionStoreState) => state.permissionSelection
);
export const permissionClassSelector = createSelector(
  selectFeature,
  (state: PermissionStoreState) => state.modulePermissions
);
