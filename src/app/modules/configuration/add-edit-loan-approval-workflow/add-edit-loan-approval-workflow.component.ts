import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { forkJoin, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";

import { v4 as uuidv4 } from "uuid";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  LoanApprovalLevel,
  LoanApprovalWorkflow,
} from "../../loan-section/loan.types";

@Component({
  selector: "lnd-add-edit-loan-approval-workflow",
  templateUrl: "./add-edit-loan-approval-workflow.component.html",
  styleUrls: ["./add-edit-loan-approval-workflow.component.scss"],
})
export class AddEditLoanApprovalWorkflowComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  currentTheme: ColorThemeInterface;
  gettingRoles = false;
  roles: CustomDropDown[] = [];
  availableRoles: CustomDropDown[] = [];
  gettingPermissions = false;
  permissions: CustomDropDown[] = [];
  gettingApprovalWorkflow = false;
  approvalWorkflow: LoanApprovalWorkflow;
  approvalWorkflowId: number;
  initializing = false;

  form = new FormGroup({
    name: new FormControl("", [
      Validators.required,
      Validators.maxLength(100),
      Validators.pattern(/^[a-zA-Z0-9 ]+$/),
    ]),
    approvalLevels: new FormArray([]),
  });
  approvalWorkflowNames: string[] = [];
  workflowNameDuplicate = false;

  submitting = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getData();
    this.getLoanApprovalWorkflows();
    this.onNameChange();
  }

  loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  onNameChange() {
    this.form
      .get("name")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (value) => {
          if (
            this.approvalWorkflowNames.length &&
            this.approvalWorkflowNames
              .map((name) => name.toLowerCase())
              .includes(value.toLowerCase()) &&
            value !== this.approvalWorkflow?.name
          ) {
            this.workflowNameDuplicate = true;
          } else {
            this.workflowNameDuplicate = false;
          }
        },
      });
  }

  getData() {
    this.initializing = true;
    const reqs = [
      this.configService.getLoanApprovalRoles(),
      this.configService.getLoanApprovalPermissions(),
    ];

    const id = this.route.snapshot.params["id"];
    if (id) {
      this.approvalWorkflowId = id;
      reqs.push(this.configService.getLoanApprovalWorkflow(id));
    }

    forkJoin(reqs)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res: any) => {
          this.roles = res[0].body?.map((r) => ({
            id: r.id,
            text: r.name,
          }));
          this.availableRoles = this.roles;

          this.permissions = res[1].body?.map((perm) => ({
            id: perm.id,
            text: perm.name,
          }));

          if (this.approvalWorkflowId) {
            this.approvalWorkflow = res[2].body.data;

            this.form.get("name").setValue(this.approvalWorkflow.name);

            this.approvalWorkflow.approvalLevels.forEach((level) => {
              this.onAddApprovalLevel(level);
            });

            this.updateAvailableRoles();
          } else {
            this.onAddApprovalLevel();
          }

          this.initializing = false;
        },
        error: () => {
          this.initializing = false;
        },
      });
  }

  getLoanApprovalWorkflow() {
    this.gettingApprovalWorkflow = true;

    this.configService
      .getLoanApprovalWorkflow(this.approvalWorkflowId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.approvalWorkflow = res.body.data;
          this.gettingApprovalWorkflow = false;
        },
        error: () => {
          this.gettingApprovalWorkflow = false;
        },
      });
  }

  get approvalLevels() {
    return this.form.get("approvalLevels") as FormArray;
  }

  onAddApprovalLevel(level?: LoanApprovalLevel) {
    const id = uuidv4();

    let selectedApprovingRoles = [];
    let allPermissionsChecked = false;

    if (level) {
      selectedApprovingRoles = level?.approvingRoles?.map(
        (role) =>
          new FormGroup({
            id: new FormControl(role.id),
            text: new FormControl(role.name),
          })
      );

      const allPermissionIds = this.permissions.map((perm) => +perm.id);
      const levelPermissionIds = level?.permissions?.map(
        (perm) => +perm.permissionId
      );

      allPermissionsChecked = allPermissionIds.every((id) =>
        levelPermissionIds?.includes(id)
      );
    }

    const levelCtrl = new FormGroup({
      levelId: new FormControl(id),
      allPermissionsChecked: new FormControl(allPermissionsChecked || false),
      approvalLevelName: new FormControl(level?.name || "", [
        Validators.required,
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9 ]+$/),
      ]),
      approvalLevelNameDuplicate: new FormControl(false),
      approvingRoleIds: new FormArray(
        level?.approvingRoles?.map((role) => new FormControl(role.id)) || []
      ),
      selectedApprovingRoles: new FormArray(selectedApprovingRoles),
      permissions: new FormArray([]),
    });

    levelCtrl
      .get("approvalLevelName")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((value) => {
        const approvalLevelNames = this.approvalLevels.controls.map((ctrl) =>
          ctrl.get("approvalLevelName").value.toLowerCase()
        );

        const duplicates = approvalLevelNames.filter(
          (name) => name.toLowerCase() === value.toLowerCase()
        );

        if (
          value.toLowerCase() !== "" &&
          approvalLevelNames.length > 1 &&
          duplicates.length > 1
        ) {
          levelCtrl.get("approvalLevelNameDuplicate").setValue(true);
        } else {
          levelCtrl.get("approvalLevelNameDuplicate").setValue(false);
        }
      });

    this.approvalLevels.push(levelCtrl);

    this.permissions?.forEach((perm) => {
      const checked = level?.permissions
        .map((levelPerm) => +levelPerm?.permissionId)
        .includes(+perm.id);

      const permGrp = new FormGroup({
        permissionChecked: new FormControl(checked || false),
        id: new FormControl(perm.id),
        name: new FormControl(perm.text),
      });

      (levelCtrl.get("permissions") as FormArray).push(permGrp);
    });
  }

  onRemoveApprovalLevel(index: number) {
    this.approvalLevels.removeAt(index);
  }

  onSelect(data: { type: string; levelIndex: number; value: CustomDropDown }) {
    if (data.type === "approvingRole") {
      const level = this.approvalLevels.at(data.levelIndex);
      (level.get("approvingRoleIds") as FormArray).push(
        new FormControl(data.value.id)
      );

      this.updateAvailableRoles();
    }
  }

  onRemove(data: { type: string; levelIndex: number; value: CustomDropDown }) {
    if (data.type === "approvingRole") {
      const level = this.approvalLevels.at(data.levelIndex);
      const array = level.get("approvingRoleIds") as FormArray;
      const ctrlIndex = array.controls.findIndex(
        (ctrl) => ctrl.value === data.value.id
      );
      array.removeAt(ctrlIndex);

      this.updateAvailableRoles();
    }
  }

  updateAvailableRoles() {
    const selectedRoles: number[] = [];
    this.approvalLevels.controls.forEach((level) => {
      level.get("approvingRoleIds").value.forEach((id) => {
        selectedRoles.push(+id);
      });
    });

    this.availableRoles = this.roles.filter(
      (role) => !selectedRoles.includes(+role.id)
    );
  }

  onParentChange(id: number, checked: boolean) {
    const level = this.approvalLevels.controls.find(
      (level) => level.get("levelId").value === id
    );
    const perms = level.get("permissions") as FormArray;

    if (checked) {
      perms.controls.forEach((perm) => {
        perm.get("permissionChecked").setValue(true);
      });
    } else {
      perms.controls.forEach((perm) => {
        perm.get("permissionChecked").setValue(false);
      });
    }
  }

  onChildChange(data: { permId: number; levelId: number; checked: boolean }) {
    const level = this.approvalLevels.controls.find(
      (level) => level.get("levelId").value === data.levelId
    );

    const perm = (level.get("permissions") as FormArray).controls.find(
      (perm) => perm.get("id").value === data.permId
    );

    perm.get("permissionChecked").setValue(data.checked);

    const allPermissionsChecked = (
      level.get("permissions") as FormArray
    ).controls.every((perm) => perm.get("permissionChecked").value);

    level.get("allPermissionsChecked").setValue(allPermissionsChecked);
  }

  getLoanApprovalWorkflows() {
    this.configService
      .getLoanApprovalWorkflows({ pageNumber: 1, pageSize: 100000 })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.approvalWorkflowNames = res.body?.items?.map(
            (item) => item.name
          );
        },
      });
  }

  onSubmit() {
    if (this.haveErrors()) {
      return;
    }

    this.submitting = true;
    const approvalLevels = this.form.value.approvalLevels.map((level) => ({
      ...level,
      permissions: level.permissions
        .filter((perm) => perm.permissionChecked)
        .map((perm) => perm.id),
    }));

    let req: any;
    if (this.approvalWorkflowId) {
      req = this.configService.editLoanApprovalWorkflow({
        ...this.form.value,
        approvalLevels,
        id: this.approvalWorkflowId,
      } as any);
    } else {
      req = this.configService.createLoanApprovalWorkflow({
        ...this.form.value,
        approvalLevels,
      } as any);
    }

    req.pipe(takeUntil(this.unsubscriber$)).subscribe({
      next: () => {
        this.toast.fire({
          type: "success",
          title: `Loan approval workflow ${
            this.approvalWorkflowId ? "edited" : "created"
          } successfully!`,
        });
        this.submitting = false;
        this.router.navigateByUrl("/configurations/parameterssetup?tab=4");
      },
      error: () => {
        this.submitting = false;
      },
    });
  }

  haveErrors() {
    let hasError = false;

    if (this.form.value.approvalLevels.length < 2) {
      Swal.fire({
        title: "Error!",
        text: "You need to setup at least two approval levels before you can create a workflow.",
        type: "error",
      });

      return true;
    }

    this.form.value.approvalLevels.forEach((level) => {
      if (!level?.approvingRoleIds?.length) {
        Swal.fire({
          title: "Error!",
          text: "You need to assign at least one role in each approval level.",
          type: "error",
        });
        hasError = true;
      }
    });

    return hasError;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
