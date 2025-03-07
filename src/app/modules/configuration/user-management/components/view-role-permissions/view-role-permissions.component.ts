import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject } from "rxjs";
import { PermissionClassification, Role } from "../../../models/user.type";
import { SharedModule } from "src/app/modules/shared/shared.module";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Tab } from "src/app/modules/shared/shared.types";
import { TabBarService } from "src/app/modules/shared/components/tab-bar/tab-bar.service";
import { map, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { UserService } from "src/app/service/user.service";
import { splitArray } from "src/app/modules/shared/helpers/generic.helpers";
import { SearchPermissionsComponent } from "../search-permissions/search-permissions.component";

@Component({
  selector: "lnd-view-role-permissions",
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    SearchPermissionsComponent,
  ],
  templateUrl: "./view-role-permissions.component.html",
  styleUrls: ["./view-role-permissions.component.scss"],
})
export default class ViewRolePermissionsComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  isLoading = false;

  loadingState: "role" | "permissions";

  role: Role;

  tabs: Tab[] = [
    {
      id: "permissions",
      text: "Permissions",
    },
    // {
    //   id: "users",
    //   text: "Users",
    // },
  ];

  currentTab: string = "permissions";

  accessibleModules = [];

  showAside = false;

  selectedModule: CustomDropDown;

  permissionGroups: PermissionClassification[] = [];

  searchCount: number | null = null;

  constructor(
    private tabBarService: TabBarService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.fetchRole(+this.route.snapshot.params["id"]);
    this.listenForTabSwitch();
  }

  listenForTabSwitch() {
    this.tabBarService.tabSwitched
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (id) => {
          this.currentTab = id.tabId;
        },
      });
  }

  fetchRole(id: number) {
    this.isLoading = true;
    this.loadingState = "role";
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
          };
          this.accessibleModules = this.role.moduleAccess.map((module) => ({
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

  fetchRolePermissions(id: number, moduleId: number) {
    this.isLoading = true;
    this.loadingState = "permissions";
    this.userService
      .fetchRolePermissions(id, moduleId)
      .pipe(
        map((res) =>
          res.body.data.map((classification) => ({
            ...classification,
            tag:
              classification.classification.split(" ").join("") +
              classification.classificationId,
            displayPermissions: splitArray(classification.permissions),
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (classifications) => {
          this.permissionGroups = classifications;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  openAside(module: CustomDropDown) {
    this.selectedModule = module;
    this.fetchRolePermissions(this.role.id, +module.id);
    this.showAside = true;
  }

  searchPermissions(searchTerm: string) {
    this.searchCount = 0;
    this.permissionGroups.forEach((pg) =>
      pg.permissions.forEach((permission) => {
        if (
          permission.name
            .toLocaleLowerCase()
            .includes(searchTerm.toLocaleLowerCase()) &&
          searchTerm.length > 0
        ) {
          permission.active = true;
          this.searchCount += 1;
        } else {
          permission.active = false;
        }
      })
    );

    if (searchTerm.length === 0) {
      this.searchCount = null;
    }
  }

  closeAside() {
    this.loadingState = "role";
    this.showAside = false;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
