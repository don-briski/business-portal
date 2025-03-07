import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { DepositService } from "src/app/service/deposit.service";
import { GroupRole } from "src/app/model/grouprole.interface";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-deposit-setup",
  templateUrl: "./deposit-setup.component.html",
  styleUrls: ["./deposit-setup.component.scss"],
})
export class DepositSetupComponent implements OnInit, OnDestroy {
  subs$ = new Subject<void>();

  user: any;
  appOwner: any;
  gettingAppOwner = false;
  currentTheme: ColorThemeInterface;

  form: UntypedFormGroup;
  groupRoleForm: UntypedFormGroup;
  groupRoles: GroupRole[];
  creating = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  isLoading: boolean = false;
  isEditing: boolean = false;
  submitted: boolean = false;
  deleting: boolean = false;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    maxPage: Infinity,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };

  constructor(
    private colorThemeService: ColorThemeService,
    private userService: UserService,
    private authService: AuthService,
    private configService: ConfigurationService,
    private depositService: DepositService,
    private fb: UntypedFormBuilder,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.fetchUser(this.authService.decodeToken().nameid);
    this.getAppOwnerDetails();
    this.initGroupRoleForm();
    this.getGroupRoles();
  }

  getGroupRoles(): void {
    this.isLoading = true;
    this.depositService
      .getGroupRoles()
      .pipe(pluck("data", "items"), takeUntil(this.subs$))
      .subscribe((groupRoles) => {
        this.groupRoles = groupRoles;
        if (this.submitted) {
          this.toast.fire({
            type: "success",
            title: `Group Role ${
              this.isEditing ? "updated" : "created"
            } successfully.`,
          });
          this.closeModal();
        }

        if (this.deleting) {
          this.toast.fire({
            type: "success",
            title: `Group Role deleted successfully`,
          });
          this.deleting = false;
        }
        this.isLoading = false;
      });
  }

  private initGroupRoleForm(): void {
    this.groupRoleForm = this.fb.group({
      roles: this.fb.array([]),
    });

    this.addGroupRole();
  }

  roles(): UntypedFormArray {
    return this.groupRoleForm.controls["roles"] as UntypedFormArray;
  }

  addGroupRole(): void {
    const role = this.fb.group({
      roleId: new UntypedFormControl(null),
      roleName: new UntypedFormControl(null, Validators.required),
    });
    this.roles().push(role);
  }

  removeGroupRole(index: number): void {
    this.roles().removeAt(index);
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res: ColorThemeInterface) => {
          this.currentTheme = res;
        },
      });
  }

  fetchUser(id: number): void {
    this.userService
      .getUserInfo(id)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.user = res.body;
        },
      });
  }

  getAppOwnerDetails() {
    this.gettingAppOwner = true;
    this.configService
      .getAppOwnerInfo({ applicationOwner: true })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.appOwner = res.body;
          this.initForm();
          this.gettingAppOwner = false;
        },
        error: () => {
          this.gettingAppOwner = false;
        },
      });
  }

  initForm() {
    this.form = new UntypedFormGroup({
      depositProductCode: new UntypedFormControl(
        this.appOwner?.depositProductCode || "",
        Validators.required
      ),
      depositAccountCode: new UntypedFormControl(
        this.appOwner?.depositAccountCode || "",
        Validators.required
      ),
      depositApplicationCode: new UntypedFormControl(
        this.appOwner?.depositApplicationCode || "",
        Validators.required
      ),
      skipVerification: new UntypedFormControl(
        this.appOwner?.skipVerification == null
          ? ""
          : this.appOwner?.skipVerification,
        Validators.required
      ),
      customerIdentifier: new UntypedFormControl(
        this.appOwner?.customerIdentifier || "",
        Validators.required
      ),
    });
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  deleteRole(roleId: number): void {
    this.deleting = true;
    this.depositService
      .deleteGroupRole(roleId)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.getGroupRoles();
        },
        (error) => (this.deleting = false)
      );
  }

  openModal(modal: any, groupRole?: GroupRole): void {
    if (groupRole) {
      this.isEditing = true;
      this.roles().at(0)?.patchValue({
        roleId: groupRole.groupRoleId,
        roleName: groupRole.groupRoleName,
      });
    } else {
      this.roles().reset();
      this.isEditing = false;
    }
    this.modalService.open(modal, { centered: true });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  saveRole(): void {
    this.isLoading = true;
    this.depositService
      .saveGroupRole(this.groupRoleForm.get("roles").value)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.submitted = true;
          this.getGroupRoles();
        },
        (error) => {
          this.isLoading = false;
        }
      );
  }

  onSubmit() {
    this.creating = true;
    this.depositService
      .createDepositSetupCodes(this.form.value)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: () => {
          this.creating = false;
          this.toast.fire({
            type: "success",
            title: "Updated successfully",
          });
        },
        error: () => {
          this.creating = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
