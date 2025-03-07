import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { PermissionsComponent } from "../permissions/permissions.component";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { forkJoin, Observable, Subject } from "rxjs";
import { SharedModule } from "src/app/modules/shared/shared.module";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AppState, Modules } from "src/app/modules/shared/shared.types";
import {
  PermissionClassificationV2,
  PermissionSelection,
  PermissionSelectionState,
  Role,
  UpsertRoleRequestPayload,
} from "../../../models/user.type";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { takeUntil } from "rxjs/operators";
import { select, Store } from "@ngrx/store";
import {
  permissionClassSelector,
  permissionSelectionSelector,
} from "../../store/selectors";
import {
  clearPermissionSelection,
  setModulePermissions,
  removeModulePermissionSelection,
} from "../../store/actions";

@Component({
  selector: "lnd-add-edit-permission",
  templateUrl: "./add-edit-role.component.html",
  styleUrls: ["./add-edit-role.component.scss"],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    PermissionsComponent,
    Select2wrapperModule,
    SharedModule,
    RouterModule,
  ],
})
export default class AddEditRoleComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  modules: CustomDropDown[] = [];

  form = new FormGroup({
    roleName: new FormControl("", Validators.required),
    description: new FormControl("", [
      Validators.required,
      Validators.maxLength(250),
    ]),
    accessibleModules: new FormControl([], Validators.required),
    branchId: new FormControl("", Validators.required),
  });

  showAside = false;

  selectedModule: CustomDropDown;

  Modules = Modules;

  isLoading = false;

  isProcessing = false;

  role: Role;

  permissions: PermissionSelectionState[] = [];

  permissionIds: number[] = [];

  modulesAndPermissions: {
    moduleId: number;
    permissions: PermissionSelection[];
  }[] = [];
  isFetching = false;

  removedModuleIds: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private store: Store<AppState>
  ) {
    this.role = { ...this.role, id: +this.route.snapshot.params.id };
  }

  ngOnInit(): void {
    this.fetchInitializationParameters();
    if (this.role.id) {
      this.getRole(this.role.id);
    }
    this.setPermission();

    this.fetchPermissionsByModule();
  }

  fetchInitializationParameters() {
    this.isLoading = true;
    let sources$ = [
      this.userService.getUserInfo(this.authService.decodeToken()),
      this.userService.getAllowedModules(),
    ];

    forkJoin(sources$)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          const branchId = res[0].body.branchId;
          this.form.get("branchId").setValue(branchId);

          this.modules = res[1].body.data.map((module) => ({
            id: module.id,
            text: module.name,
          }));

          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  getRole(id: number) {
    this.isLoading = true;
    this.userService
      .getRole(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.role = {
            id: res.body.data.id,
            name: res.body.data.name,
            description: res.body.data.description,
            moduleAccess: res.body.data.moduleAccess,
            permissions: res.body.data.permissions,
          };
          this.patchForm();
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  patchForm() {
    this.form.patchValue({
      roleName: this.role.name,
      description: this.role.description,
      accessibleModules: this.role.moduleAccess.map((module) => ({
        id: module.id,
        text: module.name,
      })),
    });

    let permissionIds = [];

    this.role.permissions.forEach((classification) => {
      classification.permissions.forEach((permission) => {
        permissionIds.push(permission.id);
      });
    });
    this.permissionIds = [...permissionIds];

    this.watchModuleChange();
  }

  setPermission() {
    this.store
      .pipe(select(permissionSelectionSelector), takeUntil(this.unsubscriber$))
      .subscribe((currentSelections) => {
        this.permissions = currentSelections.filter(
          (x) => x?.roleId === (this.role.id || 0)
        );

        this.form.markAsTouched();
        this.form.updateValueAndValidity();
      });
  }

  openAside(module: CustomDropDown) {
    this.selectedModule = module;
    this.showAside = true;
  }

  submit() {
    this.isProcessing = true;
    let removedModulePermissionIds: number[] = [];
    this.removedModuleIds.forEach((id: number) => {
      const modulePermissions = this.modulesAndPermissions.find(perm => perm.moduleId === id)?.permissions.map(x => x.permissionId);
      const intersection = this.permissionIds.filter(value => modulePermissions.includes(value));
      removedModulePermissionIds = [...removedModulePermissionIds, ...intersection];
    });
    const selectedPermissionIds = Array.from(
      new Set(
        this.permissions.reduce((acc, selection) => {
          return acc.concat(
            selection.addedPermissions.map((perm) => perm.permissionId)
          );
        }, [] as number[])
      )
    );
    let removedPermissionIds = Array.from(
      new Set(
        this.permissions.reduce((acc, selection) => {
          return acc.concat(
            selection.removedPermissions.map((perm) => perm.permissionId)
          );
        }, [] as number[])
      )
    );

    removedPermissionIds = [...removedPermissionIds, ...removedModulePermissionIds];

    this.permissionIds = [
      ...this.updatePermissionIds(
        this.permissionIds,
        selectedPermissionIds,
        removedPermissionIds
      ),
    ];
    const { roleName, description, branchId } = this.form.value;

    let payload: UpsertRoleRequestPayload = {
      roleName,
      description,
      branchId: +branchId,
      permissions: this.permissionIds,
    };

    if (this.role.id) {
      payload.roleId = this.role.id;
    }

    this.userService
      .upsertRole(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.isProcessing = false;
          this.router.navigateByUrl("/configurations/roles-and-permissions");
        },
        error: () => {
          this.isProcessing = false;
        },
      });
  }

  updatePermissionIds(
    allPermissions: number[],
    addedPermissions: number[],
    removedPermissions: number[]
  ): number[] {
    addedPermissions.forEach((item) => {
      if (!allPermissions.includes(item)) {
        allPermissions.push(item);
      }
    });
    removedPermissions.forEach((item) => {
      allPermissions = allPermissions.filter(
        (existingItem) => existingItem !== item
      );
    });

    return allPermissions;
  }

  fetchPermissionsByModule(): void {
    this.store
      .pipe(select(permissionClassSelector))
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          const allSavedPermissions = res;
          this.modulesAndPermissions = [];
          allSavedPermissions.forEach((item) => {
            const data = {
              moduleId: item.moduleId,
              permissions: this.transformData(item.permissions),
            };
            this.modulesAndPermissions.push(data);
          });
        },
      });
  }

  watchModuleChange(): void {
    this.form
      .get("accessibleModules")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (value) => {
          setTimeout(() => {
            const selectedModules = value.map((item) => item.id);
            selectedModules.forEach((item) => {
              this.removedModuleIds = this.removedModuleIds.filter(
                (existing) => existing !== item
              );
            });
          }, 500);
        },
      });
  }

  fetchPermissionByModule(id: number) {
    this.isFetching = true;
    this.userService
      .fetchPermissionsByModules(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          const permissions = res.body.data as PermissionClassificationV2[];
          const dataStore = {
            moduleId: id,
            permissions,
          };
          this.store.dispatch(
            setModulePermissions({ modulePermissions: dataStore })
          );
          this.isFetching = false;
        },
        error: () => {
          this.isFetching = false;
        },
      });
  }

  removedModule(item: any): void {
    const moduleId = item?.id;
    const isModulePreselected = this.role.moduleAccess.some(
      (mod) => mod.id === moduleId
    );
    if (!isModulePreselected) {
      this.store.dispatch(
        removeModulePermissionSelection({
          moduleId,
          roleId: this.role.id,
        })
      );
    } else {
      this.removedModuleIds.push(item?.id);
      const isModulePermissionLoaded = this.modulesAndPermissions.some(
        (x) => x.moduleId === moduleId
      );
      if (!isModulePermissionLoaded) {
        this.fetchPermissionByModule(moduleId);
      }
    }
  }

  transformData(data: PermissionClassificationV2[]): PermissionSelection[] {
    const result: PermissionSelection[] = [];
    for (const item of data) {
      const temp = item.permissions.map((permission) => ({
        classificationId: item.classificationId,
        permissionId: permission.id,
      }));
      result.push(...temp);
    }
    return result;
  }

  ngOnDestroy(): void {
    this.store.dispatch(clearPermissionSelection());
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
