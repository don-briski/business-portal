import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewEncapsulation,
} from "@angular/core";
import { Roles } from "../../../model/roles";
import { PermissionsService } from "../../../service/permissions.service";
import * as $ from "jquery";
import "datatables.net";
import "datatables.net-bs4";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UntypedFormGroup, Validators, UntypedFormControl } from "@angular/forms";
import Swal from "sweetalert2";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { TokenRefreshErrorHandler } from "src/app/service/TokenRefreshErrorHandler";
import { Router } from "@angular/router";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Subject } from "rxjs";

@Component({
  selector: "app-permission-page",
  templateUrl: "./permission-page.component.html",
  encapsulation: ViewEncapsulation.None,
  styleUrls: ["./permission-page.component.scss"],
})
export class PermissionPageComponent implements OnInit {
  dataTable: any;
  private roles: Roles[];
  public AddRoleForm: UntypedFormGroup;
  public EditRoleForm: UntypedFormGroup;
  permissions: any[];
  selectedPermissions: any[];
  dropdownSettings: {};
  loader = false;
  public user: any;
  public loggedInUser: any;
  public branchList = [];
  public activeBranchList = [];
  public showBranchView = false;
  public showEditBranchView = false;

  isDuplicateRole: boolean;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  constructor(
    private permService: PermissionsService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private authService: AuthService,
    private userService: UserService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit() {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.fetchRoles();
    this.fetchUserInfo();
    this.fetchPermission();
    this.addRoleFormInit();
    this.dropdownSettings = {
      singleSelection: false,
      lazyLoading: true,
      text: "Select Permissions",
      selectAllText: "Select All Permissions",
      unSelectAllText: "UnSelect All",
      enableSearchFilter: true,
      classes: "custom-class-example",
    };
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }
  fetchUserInfo() {
    this.userService.getUserInfo(this.loggedInUser.nameid).subscribe((res) => {
      this.user = res.body;
      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
    });
  }

  fetchPermission() {
    this.permService.FetchPermissions().subscribe(
      (res) => {
        this.permissions = res.body;
      },
      (err) => {}
    );
  }

  addRoleFormInit() {
    this.AddRoleForm = new UntypedFormGroup({
      RoleName: new UntypedFormControl("", [Validators.required]),
      Permissions: new UntypedFormControl("", [Validators.required]),
      UserId: new UntypedFormControl(this.loggedInUser.nameid, [Validators.required]),
    });
  }

  fetchRoles() {
    this.loader = true;
    this.roles = [];
    this.permService.FetchRoles().subscribe(
      (res) => {
        this.roles = res.body.data;
        this.chRef.detectChanges();
        const table: any = $("table");
        this.dataTable = table.DataTable({
          ordering: true,
          order: [],
        });
        this.loader = false;

      },
      (err) => {}
    );
  }

  openModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  openEditModal(content: any, data: any, isDuplicate?: boolean) {
    this.isDuplicateRole = isDuplicate;
    this.selectedPermissions = [];
    data.permissions.forEach((key) => {
      this.selectedPermissions.push({
        id: key.permissionId,
        itemName: key.permissionName,
      });
    });
    this.EditRoleForm = new UntypedFormGroup({
      UserId: new UntypedFormControl(this.loggedInUser.nameid, [Validators.required]),
      RoleId: new UntypedFormControl(data.roleId, [Validators.required]),
      RoleName: new UntypedFormControl(data.roleName, [Validators.required]),
      Permissions: new UntypedFormControl(this.selectedPermissions, [
        Validators.required,
      ]),
    });
    if (this.isDuplicateRole) {
      this.EditRoleForm.removeControl('RoleId');
      this.EditRoleForm.updateValueAndValidity();
    }
    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  removePermission(val: any, roleid: number) {
    Swal.fire({
      title: "Are you sure?",
      text:
        'This action will remove "' + val.permissionName + '" from this role.',
      type: "warning",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes",
      confirmButtonColor: "#558E90",
      showLoaderOnConfirm: true,
    }).then((res) => {
      if (res.value) {
        this.permService
          .RemovePermission(this.loggedInUser.nameid, roleid, val.permissionId)
          .subscribe(
            () => {
              // Swal.close();
              this.dataTable.destroy();
              this.fetchRoles();
              Swal.fire({
                type: "success",
                text: "Successfully deleted!",
              });
            },
            (err) => {}
          );
      }
    });
  }

  removeRole(val: any) {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will delete a role, it is irreversible!",
      type: "warning",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "No, cancel",
      confirmButtonText: "Yes",
      confirmButtonColor: "#558E90",
      showLoaderOnConfirm: true,
    }).then((res) => {
      if (res.value) {
        this.permService
          .DeleteRole(this.loggedInUser.nameid, val.roleId)
          .subscribe(
            () => {
              // Swal.close();
              this.dataTable.destroy();
              this.fetchRoles();
              Swal.fire({
                type: "success",
                text: "Successfully deleted!",
              });
            },
            (err) => {}
          );
      }
    });
  }

  submitRoleForm(val: any) {
    if (this.AddRoleForm.valid) {
      this.loader = true;
      this.permService.AddRole(val).subscribe(
        (res) => {
          this.loader = false;
          Swal.fire({
            type: "success",
            text: "Role Successfully Added!",
          });
          this.addRoleFormInit();
          this.dataTable.destroy();
          this.fetchRoles();
          this.closeModal();
        },
        (err) => {
          this.loader = false;
        }
      );
    }
  }

  submitEditRoleForm(val: any) {
    if (this.EditRoleForm.valid) {
      this.loader = true;
      if (this.isDuplicateRole) {
        this.permService.AddRole(val).pipe(takeUntil(this.unsubscriber$)).subscribe(() => {
          Swal.fire({
            type: 'success',
            text: 'Role successfully added.'
          })
          this.dataTable.destroy();
          this.fetchRoles();

          // Clear user so it can be refetched when next it's needed.
          this.userService.currentUser = null;
          this.loader = false;
          this.closeModal();
        })
      } else {
        this.permService.EditRole(val).subscribe(
          (res) => {
            Swal.fire({
              type: "success",
              text: "Role Successfully Edited!",
            });
            this.dataTable.destroy();
            this.fetchRoles();

            // Clear user so it can be refetched when next it's needed.
            this.userService.currentUser = null;
            this.loader = false;
            this.closeModal();
          },
          (err) => {
            this.loader = false;
          }
        );
      }

    }
  }

  selectedBranch(val: any, type: string) {
    // tslint:disable-next-line:max-line-length
    const branchList =
      type === "add"
        ? this.AddRoleForm.get("Branch").value
          ? JSON.parse(this.AddRoleForm.get("Branch").value)
          : []
        : this.EditRoleForm.get("Branch").value
        ? JSON.parse(this.EditRoleForm.get("Branch").value)
        : [];

    branchList.push({ id: val.id, text: val.text });
    if (type === "add") {
      this.AddRoleForm.controls["Branch"].setValue(JSON.stringify(branchList), {
        onlySelf: true,
        emitEvent: true,
      });
      this.AddRoleForm.controls["Branch"].updateValueAndValidity();
    } else {
      this.EditRoleForm.controls["Branch"].setValue(
        JSON.stringify(branchList),
        { onlySelf: true, emitEvent: true }
      );
      this.EditRoleForm.controls["Branch"].updateValueAndValidity();
    }
  }

  removedBranch(val: any, type: string) {
    // tslint:disable-next-line:max-line-length
    const branchList =
      type === "add"
        ? this.AddRoleForm.get("Branch").value
          ? JSON.parse(this.AddRoleForm.get("Branch").value)
          : []
        : this.EditRoleForm.get("Branch").value
        ? JSON.parse(this.EditRoleForm.get("Branch").value)
        : [];

    const index = branchList.indexOf({ id: val.id, text: val.text });
    branchList.splice(index, 1);
    if (type === "add") {
      if (branchList.length > 0) {
        this.AddRoleForm.controls["Branch"].setValue(
          JSON.stringify(branchList),
          { onlySelf: true, emitEvent: true }
        );
        this.AddRoleForm.controls["Branch"].updateValueAndValidity();
      } else {
        this.AddRoleForm.controls["Branch"].setValue("", {
          onlySelf: true,
          emitEvent: true,
        });
        this.AddRoleForm.controls["Branch"].updateValueAndValidity();
      }
    } else {
      if (branchList.length > 0) {
        this.EditRoleForm.controls["Branch"].setValue(
          JSON.stringify(branchList),
          { onlySelf: true, emitEvent: true }
        );
        this.EditRoleForm.controls["Branch"].updateValueAndValidity();
      } else {
        this.EditRoleForm.controls["Branch"].setValue("", {
          onlySelf: true,
          emitEvent: true,
        });
        this.EditRoleForm.controls["Branch"].updateValueAndValidity();
      }
    }
  }
}
