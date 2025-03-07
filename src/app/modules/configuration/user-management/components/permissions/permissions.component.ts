import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { SharedModule } from "src/app/modules/shared/shared.module";
import {
  PermissionClassification,
  PermissionClassificationV2,
  PermissionSelection,
  PermissionSelectionState,
} from "../../../models/user.type";
import { AppState, Modules } from "src/app/modules/shared/shared.types";
import { SelectionModel } from "@angular/cdk/collections";
import { takeUntil } from "rxjs/operators";
import { UserService } from "src/app/service/user.service";
import { select, Store } from "@ngrx/store";
import {
  setModulePermissions,
  setPermissionSelection,
} from "../../store/actions";
import { splitArray } from "src/app/modules/shared/helpers/generic.helpers";
import { SearchPermissionsComponent } from "../search-permissions/search-permissions.component";
import {
  permissionClassSelector,
  permissionSelectionSelector,
} from "../../store/selectors";

@Component({
  selector: "lnd-permissions",
  templateUrl: "./permissions.component.html",
  styleUrls: ["./permissions.component.scss"],
  standalone: true,
  imports: [SharedModule, CommonModule, SearchPermissionsComponent],
})
export class PermissionsComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  @Input() module: Modules;

  @Input() moduleId: number;

  @Input() roleId: number = 0;

  @Output() closeAside = new EventEmitter();

  @Output() setPermission = new EventEmitter<{
    module: number;
    permissions: number[];
  }>();

  isFetching = false;
  isFetchingPerms = false;

  permissionGroup: PermissionClassification[] = [];

  permissionsMatrix: { classificationId?: number; permissions?: number[] }[] =
    [];

  selectAllSubgroupPermissionId: number;

  permissionSelection = new SelectionModel<{
    classificationId: number;
    permissionId: number;
  }>(true, [], true, this.objectEquality);

  selectAll = false;

  unselectAll = false;

  searchCount: number | null = null;

  allPermissionClass: {
    moduleId: number;
    permissions: PermissionClassificationV2[];
  }[] = [];

  selectedPermissions: PermissionSelection[] = [];
  removedPermissions: PermissionSelection[] = [];
  constructor(
    private userService: UserService,
    private store: Store<AppState>
  ) {}

  ngOnInit(): void {
    if (!this.roleId) this.roleId = 0;
    this.watchPermissionChanges();

    this.store
      .pipe(select(permissionSelectionSelector))
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (selectedPermission: PermissionSelectionState[]) => {
          this.selectedPermissions =
            selectedPermission.find(
              (x) => x.moduleId === this.moduleId && x.roleId === this.roleId
            )?.addedPermissions ?? [];
          this.permissionSelection.clear();
          this.permissionSelection.select(...this.selectedPermissions);
          const removedPermissions =
            selectedPermission.find(
              (x) => x.moduleId === this.moduleId && x.roleId === this.roleId
            )?.removedPermissions ?? [];

          this.removedPermissions = [...removedPermissions];
        },
      });
    this.store
      .pipe(select(permissionClassSelector))
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.allPermissionClass = res;
          if (this.allPermissionClass?.length > 0) {
            const modulePermissionLoaded = this.allPermissionClass.find(
              (x) => x.moduleId === this.moduleId
            );
            if (modulePermissionLoaded) {
              this.sortSelectedModulePermissions(
                modulePermissionLoaded.permissions
              );
            } else {
              this.fetchPermissionByModule(this.moduleId);
            }
          } else {
            this.fetchPermissionByModule(this.moduleId);
          }
        },
      });
  }

  private watchPermissionChanges() {
    this.permissionSelection.changed
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        const selected = res.source.selected;
        for (let index = 0; index < selected.length; index++) {
          let originalPermissions = this.permissionGroup.find(
            (pg) => pg.classificationId === selected[index].classificationId
          );
          const groupedMatrix = this.getPermissionMatrix();
          const selectedPermissions = groupedMatrix.find(
            (gm) => gm.classificationId === selected[index].classificationId
          );
          if (
            originalPermissions?.permissions?.length ===
            selectedPermissions?.permissions?.length
          ) {
            originalPermissions.masterChecked = true;
          } else {
            this.selectAll = false;
          }
        }
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
          this.sortSelectedModulePermissions(permissions);
          this.isFetching = false;
        },
        error: () => {
          this.isFetching = false;
        },
      });
  }

  fetchRolePermissions(id: number, moduleId: number) {
    this.isFetchingPerms = true;
    this.userService
      .fetchRolePermissions(id, moduleId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          let selectedPermissions = [];
          res.body.data.forEach((classification) => {
            classification.permissions.forEach((permission) => {
              selectedPermissions.push({
                classificationId: classification.classificationId,
                permissionId: permission.id,
              });
            });
          });

          this.store.dispatch(
            setPermissionSelection({
              roleId: this.roleId,
              moduleId: moduleId,
              addedPermissions: selectedPermissions,
              removedPermissions: [],
            })
          );
          this.isFetchingPerms = false;
        },
        error: () => {
          this.isFetchingPerms = false;
        },
      });
  }

  private objectEquality(a: any, b: any): boolean {
    return (
      a.classificationId === b.classificationId &&
      a.permissionId === b.permissionId
    );
  }

  masterToggleSubgroupSelection(classificationId: number, checked: boolean) {
    const subgroupAndPermissions = this.permissionGroup.find(
      (pg) => pg.classificationId === classificationId
    );
    const permissions = subgroupAndPermissions.permissions.map(
      (permission) => ({
        classificationId: subgroupAndPermissions.classificationId,
        permissionId: permission.id,
      })
    );
    if (!checked) {
      const selectedPermissions = this.selectedPermissions.filter(
        (perm) => perm.classificationId === classificationId
      );

      selectedPermissions.forEach((permission) => {
        if (
          !this.removedPermissions.some(
            (perm) => perm.permissionId === permission.permissionId
          )
        ) {
          this.removedPermissions.push(permission);
        }
      });
      const otherPermissions = this.permissionSelection.selected.filter(
        (perm) => perm.classificationId !== classificationId
      );
      this.permissionSelection.clear();
      this.permissionSelection.select(...otherPermissions);
    } else {
      this.removedPermissions = this.removedPermissions.filter(
        (item) => item.classificationId === classificationId
      );
      this.permissionSelection.select(...permissions);
      subgroupAndPermissions.masterChecked = true;
    }
  }

  getPermissionMatrix() {
    return this.permissionSelection.selected.reduce((acc, curr) => {
      const existingEntry = acc.find(
        (item) => item.classificationId === curr.classificationId
      );

      if (existingEntry) {
        existingEntry.permissions.push(curr.permissionId);
      } else {
        acc.push({
          classificationId: curr.classificationId,
          permissions: [curr.permissionId],
        });
      }

      return acc;
    }, []);
  }

  selectAllPermission() {
    this.permissionGroup.forEach((pg) =>
      this.masterToggleSubgroupSelection(pg?.classificationId, true)
    );
    this.selectAll = true;
    this.unselectAll = false;
  }

  unselectAllPermission() {
    this.permissionGroup.forEach((pg) => {
      this.masterToggleSubgroupSelection(pg?.classificationId, false);
      pg.masterChecked = false;
    });
    this.unselectAll = true;
    this.selectAll = false;
  }

  save() {
    this.store.dispatch(
      setPermissionSelection({
        roleId: this.roleId ?? 0,
        moduleId: this.moduleId,
        addedPermissions: this.permissionSelection.selected,
        removedPermissions: this.removedPermissions,
      })
    );

    this.closeAside.emit();
  }

  onCloseAside() {
    if (this.permissionSelection.selected.length === 0) {
      this.save();
    }
    this.closeAside.emit();
  }

  searchPermissions(searchTerm: string) {
    this.searchCount = 0;
    this.permissionGroup.forEach((pg) =>
      pg.displayPermissions.forEach((group) => {
        group.forEach((perm) => {
          if (
            searchTerm?.length > 0 &&
            perm.name
              .toLocaleLowerCase()
              .includes(searchTerm.toLocaleLowerCase())
          ) {
            perm.active = true;
            this.searchCount += 1;
          } else {
            perm.active = false;
          }
        });
      })
    );

    if (searchTerm?.length === 0) {
      this.searchCount = null;
    }
  }

  sortSelectedModulePermissions(permissions: any[]): void {
    const modifiedPermissionGroup = permissions.map((pg) => ({
      ...pg,
      displayPermissions: splitArray(
        pg.permissions.map((perm) => ({ ...perm }))
      ),
    }));
    this.permissionGroup = modifiedPermissionGroup;
    if (this.roleId > 0) {
      if (this.selectedPermissions.length === 0) {
        this.fetchRolePermissions(this.roleId, this.moduleId);
      }
    }
  }

  togglePermissionSelection(
    classificationId: number,
    permissionId: number
  ): void {
    const data = {
      classificationId,
      permissionId,
    };

    this.permissionSelection.toggle(data);
    if (this.permissionSelection.isSelected(data)) {
      this.removedPermissions = this.removedPermissions.filter(
        (item) => item.permissionId !== data.permissionId
      );
    } else {
      this.selectedPermissions = JSON.parse(
        JSON.stringify(this.permissionSelection.selected)
      );
      if (
        !this.removedPermissions.some(
          (item) => item.permissionId === data.permissionId
        )
      ) {
        this.removedPermissions.push(data);
      }
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
