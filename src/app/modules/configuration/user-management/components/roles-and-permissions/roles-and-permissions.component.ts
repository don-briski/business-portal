import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { SharedModule } from "src/app/modules/shared/shared.module";
import {
  GenericSpoolRequestPayload,
  GenericSpoolResponsePayload,
  Module,
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
} from "src/app/modules/shared/shared.types";
import { UserService } from "src/app/service/user.service";
import Swal from "sweetalert2";
import { Role } from "../../../models/user.type";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";

@Component({
  selector: "lnd-permissions",
  templateUrl: "./roles-and-permissions.component.html",
  styleUrls: ["./roles-and-permissions.component.scss"],
  standalone: true,
  imports: [SharedModule, RouterModule],
})
export default class RolesAndPermissionsComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  isLoading = false;

  config: TableConfig = {
    uniqueIdPropLink: "role",
  };

  tableHeaders: TableHeader[] = [
    { name: "Roles" },
    { name: "Description" },
    { name: "Module Access" },
    { name: "Action" },
  ];

  tableData: TableData[] = [];

  roles: Role[] = [];

  colorTheme: ColorThemeInterface;

  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns: [],
  };

  constructor(
    private router: Router,
    private userMgntService: UserService,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.fetchRoles({pageNumber:this.pagination.pageNumber,pageSize:this.pagination.pageSize});
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  fetchRoles(payload:GenericSpoolRequestPayload) {
    this.isLoading = true;
    this.userMgntService
      .fetchRoles(payload)
      .pipe(map(res => ({...res.body,items:res.body.items.map(role => ({...role,accessibleModules:role.moduleAccess.map(module => module.name).join(", ")}))})),takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.roles = res.items;
          this.setTableData(this.roles);
          this.setPagination(res);
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private setPagination(res: GenericSpoolResponsePayload): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;
    this.pagination.searchColumns = res.searchColumns;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  private setTableData(roles: Role[]) {
    this.tableData = roles.map((role) => ({
      role: { tdValue:role.name, id: role.id },
      description: {
        tdValue:role.description,
      },
      modules: {
        tdValue: role.accessibleModules,
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(role.id),
      },
    }));
    this.isLoading = false;
  }

  getActionConfig(roleId) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.viewRole(roleId),
      },
      {
        showBtn: true,
        iconClass: "icon-edit",
        btnText: "Edit",
        funcRef: () =>
          this.router.navigateByUrl(
            `configurations/roles-and-permissions/edit/${roleId}`
          ),
      },
      {
        showBtn: true,
        iconClass: "icon-trash",
        btnText: "Delete",
        funcRef: () => this.deleteRole(roleId),
      },
    ];
  }

  viewRole(roleId: number) {
    const role:Role = this.roles.find(role => role.id === roleId);
    this.router.navigateByUrl(
      `configurations/view-roles-and-permissions/${roleId}`,{state:role}
    );
  }

  deleteRole(id: number) {
    const role = this.roles.find((role) => role.id === id);
    Swal.fire({
      title: "Delete Role",
      text: `You are about to delete the ${role?.name} role!`,
      confirmButtonText: "Yes, Delete",
      confirmButtonColor: this.colorTheme.secondaryColor,
      showCancelButton: true,
      showCloseButton: true,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        cancelButton: "swal-cancel-btn",
        confirmButton: "swal-confirm-btn",
        closeButton: "swal-close-btn",
        actions: "swal-actions",
      },
    }).then((result) => {
      if (result?.value) {
        this.isLoading = true;
        this.userMgntService
          .deleteRole(id)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe({
            next: () => {
              this.fetchRoles({pageNumber:this.pagination.pageNumber,pageSize:this.pagination.pageSize});
            },
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
