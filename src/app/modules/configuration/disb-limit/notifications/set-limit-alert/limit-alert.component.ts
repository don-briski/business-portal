import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Subject } from "rxjs";
import { map, takeUntil, tap } from "rxjs/operators";
import { UserService } from "src/app/service/user.service";
import { DisbursementLimitService } from "../../../services/disbursement-limit.service";
import { SetLimitAlert } from "../../../models/disbursement-limit-type";
import Swal from "sweetalert2";

@Component({
  selector: "lnd-limit-alert",
  templateUrl: "./limit-alert.component.html",
  styleUrls: ["./limit-alert.component.scss"],
})
export class SetLimitAlertComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  @Input() canManageAlerts:boolean;

  showAlertForm = false;

  roleList = [];

  userList = [];

  isLoading = false;

  form = new FormGroup({
    allUsers: new FormControl(false),
    allRoles: new FormControl(false),
    roles: new FormControl(null),
    users: new FormControl(null),
  });

  isProcessing = false;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  alertSettings: SetLimitAlert;

  totalRoles: number;
  totalUsers: number;

  constructor(
    private userMgntService: UserService,
    private disbLimitService: DisbursementLimitService
  ) {}

  ngOnInit(): void {
    this.getLimitAlertConfig();
  }

  private getLimitAlertConfig() {
    this.isLoading = true;
    this.disbLimitService
      .getLimitAlertSettings()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.alertSettings = res.body.data;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  private getRoles() {
    this.isLoading = true;
    const payload = { pageNumber: 1, pageSize: 10000 };
    this.userMgntService
      .fetchRoles(payload)
      .pipe(
        tap((response) => (this.totalRoles = response.body.totalCount)),
        map((response) =>
          response.body.items.map((role) => ({ id: role.id, text: role.name }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (roles) => {
          this.roleList = roles;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private getUsers() {
    this.isLoading = true;
    const payload = { pageNumber: 1, pageSize: 30 };
    this.userMgntService
      .FetchAllUsers(payload)
      .pipe(
        tap((response) => (this.totalUsers = response.body.data.totalCount)),
        map((response) =>
          response.body.data.items.map((user) => ({
            id: user?.person?.personId,
            text: user?.person?.displayName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (users) => {
          this.userList = users;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  displayForm() {
    this.getRoles();
    this.getUsers();

    if (
      this.alertSettings?.roles.length > 0 ||
      this.alertSettings?.users.length > 0
    ) {
      const payload = {
        ...this.alertSettings,
        roles: this.alertSettings.roles?.map((role) => ({
          id: role.id,
          text: role.name,
        })),
        users: this.alertSettings.users?.map((user) => ({
          id: user.id,
          text: user.name,
        })),
      };
      this.form.patchValue(payload);
    }
    this.showAlertForm = true;
  }

  setAllRoles(value: boolean) {
    this.form.get("allRoles").setValue(value);
    if (value) {
      this.form.get("roles").clearValidators();
      this.form.get("roles").setValue(null);

      this.form.get("users").clearValidators();
      this.form.get("users").setValue(null);
    }
  }

  setAllUsers(value: boolean) {
    this.form.get("allUsers").setValue(value);
    if (value) {
      this.form.get("users").clearValidators();
      this.form.get("users").setValue(null);

      this.form.get("roles").clearValidators();
      this.form.get("roles").setValue(null);
    }
  }

  deselectAllUsers() {
    this.form.get("allUsers").setValue(false);
  }

  update() {
    const roles =
      this.form.value.roles?.map((role) => ({
        id: role.id,
        name: role.text,
      })) || null;
    const users =
      this.form.value.users?.map((user) => ({
        id: user.id,
        name: user.text,
      })) || null;
    let payload = { ...this.form.value, roles, users } as SetLimitAlert;

    this.isProcessing = true;
    this.disbLimitService
      .setLimitAlert(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.isProcessing = false;
          this.toast.fire({
            type: "success",
            title: "Alert configured successfully",
          });
          this.getLimitAlertConfig();
          this.showAlertForm = false;
        },
        error: () => (this.isProcessing = false),
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
