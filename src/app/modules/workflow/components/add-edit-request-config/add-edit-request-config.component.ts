import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { Validators, UntypedFormBuilder, UntypedFormGroup, UntypedFormArray } from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AuthService } from "src/app/service/auth.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  Approver,
  Branch,
  CustomField,
  CustomFieldSet,
  CustomForm,
  EditReqConfigData,
  Initiator,
  ReqConfig,
} from "../../workflow.types";
import { WorkflowService } from "../../services/workflow.service";
import { HttpResponse } from "@angular/common/http";
import { UserService } from "src/app/service/user.service";

@Component({
  selector: "lnd-add-edit-request-config",
  templateUrl: "./add-edit-request-config.component.html",
  styleUrls: ["./add-edit-request-config.component.scss"],
})
export class AddEditRequestConfigComponent implements OnInit, OnDestroy {
  @Input() reqConfig: ReqConfig;
  @Input() colorTheme: ColorThemeInterface;
  @Input() viewMode: false;
  @Output() closeForm = new EventEmitter<void>();
  @Output() refetchConfigs = new EventEmitter<void>();

  subs$ = new Subject<void>();
  user: any;

  editMode = false;
  reqConfigForm: UntypedFormGroup;

  formIsValid = false;
  submitting = false;
  previewMode = false;

  requestTypes: CustomDropDown[] = [
    { id: 1, text: "Payments" },
    { id: 2, text: "Custom" },
  ];
  selectedRequestType: CustomDropDown[] = [];
  branches = [];
  fetchingBranches = false;

  initiatorTypes: CustomDropDown[] = [
    { id: 1, text: "Roles" },
    { id: 2, text: "Teams" },
  ];
  selectedInitiatorType: CustomDropDown[] = [];
  initiators: CustomDropDown[] = [];

  approvalTypes: CustomDropDown[] = [
    { id: 1, text: "Users" },
    { id: 2, text: "Roles" },
    { id: 3, text: "Teams" },
  ];
  selectedApprovalType: CustomDropDown[] = [];
  approvers: CustomDropDown[] = [];

  approvalType = "Roles";
  fetchingInitiators = false;
  fetchingApprovers = false;

  customFieldStatuses: CustomDropDown[] = [
    { id: 1, text: "Activated" },
    { id: 2, text: "Deactivated" },
  ];

  customFieldDataTypes: CustomDropDown[] = [
    { id: "FreeText", text: "Free Text" },
    { id: "Date", text: "Date" },
    { id: "Number", text: "Number" },
    { id: "Selection", text: "Selection" },
    { id: "RadioGroup", text: "RadioGroup" },
  ];

  fetchingCustomForm = false;
  customForm: CustomForm;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigurationService,
    private workflowService: WorkflowService
  ) {}

  ngOnInit(): void {
    const decodedUser = this.authService.decodeToken();
    this.fetchUser(decodedUser.nameid);
    this.fetchBranches(decodedUser.nameid);

    if (this.reqConfig && !this.viewMode) this.editMode = true;
    if (this.reqConfig?.customFormId) this.fetchCustomForm();

    this.initForm();
  }

  fetchUser(userId: string) {
    this.userService
      .getUserInfo(userId)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  initForm() {
    this.reqConfigForm = this.fb.group({
      name: [this.reqConfig?.requestName || "", Validators.required],
      requestType: [this.reqConfig?.requestType || "", Validators.required],
      requireSupportingDocument: [
        this.reqConfig?.requireSupportingDocument || false,
      ],
      requestIdentifier: [
        this.reqConfig?.requestIdentifier || "",
        Validators.required,
      ],
      approvalType: [
        this.reqConfig?.approverSetupType || "",
        Validators.required,
      ],
      initiatorType: [
        this.reqConfig?.initiatorSetupType || "",
        Validators.required,
      ],
      branches: this.fb.array([], Validators.required),
      initiators: this.fb.array([], Validators.required),
      approvers: this.fb.array([], Validators.required),
      customForm: this.fb.group({
        customFieldSets: this.fb.array([]),
      }),
      isActive: [this.reqConfig?.isActive || false],
    });

    if (!this.editMode) {
      this.addCustomFieldSet();
    }

    if (this.editMode || this.viewMode) {
      this.selectedRequestType = this.requestTypes.filter(
        (rT) => rT.text === this.reqConfig.requestType
      );

      const branches = this.reqConfigForm.get("branches") as UntypedFormArray;
      this.reqConfig.permittedBranches.forEach((branch) => {
        branches.push(
          this.fb.group({
            id: this.fb.control(branch.branchId),
            text: this.fb.control(branch.branchName),
          })
        );
      });

      this.selectedInitiatorType = this.initiatorTypes.filter(
        (iT) => iT.text === this.reqConfig.initiatorSetupType
      );

      if (this.selectedInitiatorType[0].text === "Teams") {
        this.fetchingInitiators = true;
        this.fetchTeams();
        const initiators = this.reqConfigForm.get("initiators") as UntypedFormArray;
        this.reqConfig.initiators.forEach((initiator) => {
          initiators.push(
            this.fb.group({
              id: this.fb.control(initiator.actorId),
              text: this.fb.control(initiator.actorName),
            })
          );
        });
      } else {
        this.fetchingInitiators = true;
        this.fetchRoles();
        const initiators = this.reqConfigForm.get("initiators") as UntypedFormArray;
        this.reqConfig.initiators.forEach((initiator) => {
          initiators.push(
            this.fb.group({
              id: this.fb.control(initiator.actorId),
              text: this.fb.control(initiator.actorName),
            })
          );
        });
      }

      this.selectedApprovalType = this.approvalTypes.filter(
        (aT) => aT.text === this.reqConfig.approverSetupType
      );

      if (this.selectedApprovalType[0].text === "Users") {
        this.fetchUsers();
        this.fetchingApprovers = true;
        const approvers = this.reqConfigForm.get("approvers") as UntypedFormArray;
        this.reqConfig.approvers.forEach((approver) => {
          approvers.push(
            this.fb.group({
              id: this.fb.control(approver.actorId),
              text: this.fb.control(approver.actorName),
            })
          );
        });
      } else if (this.selectedApprovalType[0].text === "Roles") {
        this.fetchingApprovers = true;
        this.fetchRoles();
        const approvers = this.reqConfigForm.get("approvers") as UntypedFormArray;
        this.reqConfig.approvers.forEach((initiator) => {
          approvers.push(
            this.fb.group({
              id: this.fb.control(initiator.actorId),
              text: this.fb.control(initiator.actorName),
            })
          );
        });
      } else {
        this.fetchingApprovers = true;
        this.fetchTeams();
        const approvers = this.reqConfigForm.get("approvers") as UntypedFormArray;
        this.reqConfig.approvers.forEach((initiator) => {
          approvers.push(
            this.fb.group({
              id: this.fb.control(initiator.actorId),
              text: this.fb.control(initiator.actorName),
            })
          );
        });
      }
    }
  }

  onSelect(field: string, event: CustomDropDown) {
    switch (field) {
      case "requestType":
        this.reqConfigForm.get("requestType").setValue(event.text);
        break;
      case "initiatorType":
        this.reqConfigForm.get("initiatorType").setValue(event.text);
        (this.reqConfigForm.get("initiators") as UntypedFormArray).clear();
        this.fetchInitiators();
        break;
      case "approvalType":
        (this.reqConfigForm.get("approvers") as UntypedFormArray).clear();
        this.reqConfigForm.get("approvalType").setValue(event.text);
        this.fetchApprovers();
        break;
    }
  }

  onSelectMany(field: string, event: CustomDropDown) {
    switch (field) {
      case "branches":
        const branches = this.reqConfigForm.get("branches") as UntypedFormArray;
        branches.push(
          this.fb.group({
            id: this.fb.control(event.id),
            text: this.fb.control(event.text),
          })
        );

        (this.reqConfigForm.get("initiators") as UntypedFormArray).clear();
        (this.reqConfigForm.get("approvers") as UntypedFormArray).clear();
        this.fetchInitiators();
        this.fetchApprovers();
        break;
      case "initiators":
        const initiators = this.reqConfigForm.get("initiators") as UntypedFormArray;
        initiators.push(
          this.fb.group({
            id: this.fb.control(event.id),
            text: this.fb.control(event.text),
          })
        );
        break;
      case "approvers":
        const approvers = this.reqConfigForm.get("approvers") as UntypedFormArray;
        approvers.push(
          this.fb.group({
            id: this.fb.control(event.id),
            text: this.fb.control(event.text),
          })
        );
        break;
    }
  }

  onSelectAll(field: string) {
    const setAll = (
      sourceArray: CustomDropDown[],
      destinationArray: UntypedFormArray
    ) => {
      sourceArray.forEach((item) => {
        destinationArray.push(this.fb.group({ id: item.id, text: item.text }));
      });
    };

    switch (field) {
      case "branches":
        const branchesInForm = this.reqConfigForm.get("branches") as UntypedFormArray;
        setAll(this.branches, branchesInForm);

        (this.reqConfigForm.get("initiators") as UntypedFormArray).clear();
        (this.reqConfigForm.get("approvers") as UntypedFormArray).clear();
        this.fetchInitiators();
        this.fetchApprovers();
        break;
      case "initiators":
        const initiatorsInForm = this.reqConfigForm.get(
          "initiators"
        ) as UntypedFormArray;
        setAll(this.initiators, initiatorsInForm);
        break;
      case "approvers":
        const approversInForm = this.reqConfigForm.get(
          "approvers"
        ) as UntypedFormArray;
        setAll(this.approvers, approversInForm);
        break;
    }
  }

  onDeselect(field: string) {
    switch (field) {
      case "requestType":
        this.reqConfigForm.get("requestType").setValue("");
        break;
      case "initiatorType":
        this.reqConfigForm.get("initiatorType").setValue("");
        (this.reqConfigForm.get("initiators") as UntypedFormArray).clear();
        break;
      case "approvalType":
        this.reqConfigForm.get("approvalType").setValue("");
        (this.reqConfigForm.get("approvers") as UntypedFormArray).clear();
        break;
    }
  }

  onDeselectMany(field: string, event: CustomDropDown) {
    switch (field) {
      case "branches":
        const branches = this.reqConfigForm.get("branches") as UntypedFormArray;
        const branchIndex = branches.value.findIndex(
          (b: CustomDropDown) => b.id === event.id
        );
        branches.removeAt(branchIndex);

        (this.reqConfigForm.get("initiators") as UntypedFormArray).clear();
        (this.reqConfigForm.get("approvers") as UntypedFormArray).clear();
        this.fetchInitiators();
        this.fetchApprovers();
        break;
      case "initiators":
        const initiators = this.reqConfigForm.get("initiators") as UntypedFormArray;
        const initiatorIndex = initiators.value.findIndex(
          (i: CustomDropDown) => i.id === event.id
        );
        initiators.removeAt(initiatorIndex);
        break;
      case "approvers":
        const approvers = this.reqConfigForm.get("approvers") as UntypedFormArray;
        const approverIndex = approvers.value.findIndex(
          (i: CustomDropDown) => i.id === event.id
        );
        approvers.removeAt(approverIndex);
        break;
    }
  }

  onDeselectAll(field: string) {
    switch (field) {
      case "branches":
        (this.reqConfigForm.get("branches") as UntypedFormArray).clear();
        (this.reqConfigForm.get("initiators") as UntypedFormArray).clear();
        (this.reqConfigForm.get("approvers") as UntypedFormArray).clear();
        this.fetchInitiators();
        this.fetchApprovers();
        break;
      case "initiators":
        (this.reqConfigForm.get("initiators") as UntypedFormArray).clear();
        break;
      case "approvers":
        (this.reqConfigForm.get("approvers") as UntypedFormArray).clear();
    }
  }

  onSetIsActive(value: boolean) {
    this.reqConfigForm.get("isActive").setValue(value);
  }

  get customFieldSets() {
    return this.reqConfigForm.get("customForm.customFieldSets") as UntypedFormArray;
  }

  get approversInForm() {
    return this.reqConfigForm.get("approvers") as UntypedFormArray;
  }

  fetchInitiators() {
    const branches = this.reqConfigForm.get("branches") as UntypedFormArray;
    if (!(branches.length > 0)) return;

    const initiatorType = this.reqConfigForm.get("initiatorType").value;
    if (!initiatorType) return;

    this.fetchingInitiators = true;
    if (initiatorType === "Teams") this.fetchTeams();
    else this.fetchRoles();
  }

  fetchApprovers() {
    const branches = this.reqConfigForm.get("branches") as UntypedFormArray;
    if (!(branches.length > 0)) return;

    const approvalType = this.reqConfigForm.get("approvalType").value;
    if (!approvalType) return;

    this.fetchingApprovers = true;
    if (approvalType === "Users") this.fetchUsers();
    else if (approvalType === "Roles") this.fetchRoles();
    else this.fetchTeams();
  }

  fetchBranches(userId: string) {
    this.fetchingBranches = true;
    const data = { filter: "", userId };
    this.configService
      .spoolAccessibleBranches(data)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.fetchingBranches = false;

          this.branches = res.body.map((branch: any) => ({
            id: branch.branchId,
            text: branch.branchName,
          }));
        },
        (error) => {
          this.fetchingBranches = false;
        }
      );
  }

  fetchUsers() {
    const branches = this.reqConfigForm.get("branches").value;
    if (branches.length < 1) return;

    this.fetchingApprovers = true;
    this.workflowService
      .getUsers(branches)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          this.approvers = res.body;
          this.fetchingApprovers = false;
        },
        (err) => {
          this.fetchingApprovers = false;
        }
      );
  }

  fetchRoles() {
    const branches = this.reqConfigForm.get("branches").value;
    if (branches.length < 1) return;

    this.workflowService
      .getRoles(branches)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          if (this.fetchingApprovers) {
            this.approvers = res;
            this.fetchingApprovers = false;
          }

          if (this.fetchingInitiators) {
            this.initiators = res;
            this.fetchingInitiators = false;
          }
        },
        (err) => {
          this.fetchingApprovers = false;
          this.fetchingInitiators = false;
        }
      );
  }

  fetchTeams() {
    const branches = this.reqConfigForm.get("branches").value;
    if (branches.length < 1) return;

    this.workflowService
      .getTeams(branches)
      .pipe(takeUntil(this.subs$))
      .subscribe(
        (res) => {
          if (this.fetchingApprovers) {
            this.approvers = res.body;
            this.fetchingApprovers = false;
          }

          if (this.fetchingInitiators) {
            this.initiators = res.body;
            this.fetchingInitiators = false;
          }
        },
        (err) => {
          this.fetchingApprovers = false;
          this.fetchingInitiators = false;
        }
      );
  }

  addCustomFieldSet(customFieldSets?: CustomFieldSet[]) {
    if (!customFieldSets || customFieldSets.length < 1) return;

    const cFSetsInForm = this.reqConfigForm.get(
      "customForm.customFieldSets"
    ) as UntypedFormArray;

    for (let cFSet of customFieldSets) {
      const group = this.fb.group({
        customFieldSetName: [cFSet?.customFieldSetName || ""],
        customFieldSetNotes: [cFSet?.customFieldNotes || ""],
        customFieldSetType: [cFSet?.customFieldSetType || "WorkFlowRequest"],
        usage: [cFSet?.usage || "Standard"],
        customFormKey: [this.customForm?.customFormKey || ""],
        customFields: this.fb.array([]),
        customFieldSetKey: [cFSet?.customFieldSetKey],
      });

      cFSetsInForm.push(group);

      const cFields = group.get("customFields") as UntypedFormArray;

      const addCustomField = (item?: CustomField) => {
        const cField = this.fb.group({
          customFieldKey: [item?.customFieldKey || ""],
          customFieldSetKey: [cFSet?.customFieldSetKey],
          customFieldName: [item?.customFieldName || "", Validators.required],
          dataType: [item?.dataType || "", Validators.required],
          selectedDataType: [
            this.customFieldDataTypes.filter((v) => v.id === item?.dataType),
          ],
          customFieldStatus: [item?.customFieldStatus || ""],
          selectedStatus: [
            this.customFieldStatuses.filter(
              (v) => v.text === item?.customFieldStatus
            ),
          ],
          customFieldDescription: [item?.customFieldDescription || ""],
          isRequired: [item?.isRequired || false],
          customFieldType: [item?.customFieldType || "Users"],
          validationPattern: [item?.validationPattern || ""],
          valueLength: [item?.valueLength || "Short"],
        });

        if (
          (item.dataType === "Selection" || item.dataType === "RadioGroup") &&
          item.customFieldSelections?.length > 0
        ) {
          cField.addControl("customFieldSelections", this.fb.array([]));

          const selectnsInForm = cField.get(
            "customFieldSelections"
          ) as UntypedFormArray;

          item.customFieldSelections?.forEach((selectn) => {
            selectnsInForm.push(
              this.fb.group({
                customFieldSelectionKey: [selectn.customFieldSelectionKey],
                label: [selectn.label, Validators.required],
                uniqueId: [selectn.uniqueId, Validators.required],
              })
            );
          });
        }

        cFields.push(cField);
      };

      if (cFSet?.customFields.length > 0)
        cFSet?.customFields.forEach(addCustomField);
      else addCustomField();
    }
  }

  fetchCustomForm() {
    this.fetchingCustomForm = true;

    this.workflowService
      .getCustomForm(this.reqConfig?.customFormId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.customForm = res.body.data;
          this.addCustomFieldSet(this.customForm.customFieldSets);
          this.fetchingCustomForm = false;
        },
        error: () => {
          this.fetchingCustomForm = false;
        },
      });
  }

  onSubmit() {
    let {
      name,
      requestType,
      requireSupportingDocument,
      requestIdentifier,
      branches,
      initiators,
      approvers,
      approvalType,
      initiatorType,
      customForm,
      isActive,
    } = this.reqConfigForm.value;

    branches = this.modifyDropdownValues(branches);
    initiators = this.modifyDropdownValues(initiators);
    approvers = this.modifyApprovers(approvers);
    const data: EditReqConfigData = {
      name,
      requestType,
      requireSupportingDocument,
      requestIdentifier,
      approverType: approvalType,
      initiatorType,
      initiators,
      branches,
      approvers,
      customForm,
      isActive,
    };

    if (data.customForm && data.customForm.customFieldSets.length < 1) {
      delete data.customForm;
    }

    this.submitting = true;

    let req: Observable<HttpResponse<Object>>;
    if (this.editMode) {
      req = this.workflowService.editRequestConfig(
        data,
        this.reqConfig.requestSetupId
      );
    } else {
      req = this.workflowService.addRequestConfig(data);
    }

    req.pipe(takeUntil(this.subs$)).subscribe(
      () => {
        this.submitting = false;
        this.toast.fire({
          type: "success",
          title: `Request configuration ${
            this.editMode ? "updated" : "created"
          } successfully`,
        });
        this.refetchConfigs.emit();
        this.onCloseForm();
      },
      () => {
        this.submitting = false;
      }
    );
  }

  modifyDropdownValues(items: CustomDropDown[]): Branch[] | Initiator[] {
    return items.map((b) => ({
      id: +b.id,
      text: b.text,
    }));
  }

  modifyApprovers(approvers: CustomDropDown[]): Approver[] {
    return approvers.map((appr, index) => ({
      approverId: +appr.id,
      approverName: appr.text,
      isFirstToApprove: true,
      position: index,
    }));
  }

  onCloseForm() {
    this.closeForm.emit();
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
