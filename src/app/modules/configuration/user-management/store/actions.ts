import { createAction, props } from "@ngrx/store";
import {
  PermissionClassificationV2,
  PermissionSelectionState,
} from "../../models/user.type";
export const setPermissionSelection = createAction(
  "[Configuration] Set Permission Selection",
  props<PermissionSelectionState>()
);
export const removeModulePermissionSelection = createAction(
  "[Configuration] Remove Role Module Permission Selection",
  props<{roleId: number, moduleId: number}>()
);
export const clearPermissionSelection = createAction(
  "[Configuration] Clear Permission Selection"
);

export const setModulePermissions = createAction(
  "[Configuration] Set Module Permissions",
  props<{
    modulePermissions: {
      moduleId: number;
      permissions: PermissionClassificationV2[];
    };
  }>()
);
export const clearModulePermissions = createAction(
  "[Configuration] Clear Module Permissions"
);
