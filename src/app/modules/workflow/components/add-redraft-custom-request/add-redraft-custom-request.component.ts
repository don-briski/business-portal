import { Component, Input, OnInit } from "@angular/core";
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormArray, Validators } from "@angular/forms";
import { HttpResponse } from "@angular/common/http";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject, Observable } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AuthService } from "src/app/service/auth.service";
import { WorkflowService } from "../../services/workflow.service";
import {
  WorkflowRequest,
  RequestDetail,
  ReqConfig,
  CustomForm,
  GetReqConfigsQueryParams,
  CustomFieldSet,
} from "../../workflow.types";

@Component({
  selector: "lnd-add-redraft-custom-request",
  templateUrl: "./add-redraft-custom-request.component.html",
  styleUrls: ["./add-redraft-custom-request.component.scss"],
})
export class AddRedraftCustomRequestComponent implements OnInit {
  @Input() reqConfigId: number;
  @Input() reqConfigs: ReqConfig[];
  @Input() selectedReq: WorkflowRequest;
  @Input() duplicateReq: boolean;

  subs$ = new Subject<void>();
  loggedInUser: any;

  redraftMode = false;
  reqDetails: RequestDetail;
  selectedReqType: CustomDropDown[] = [];
  modifiedReqConfigs: CustomDropDown[] = [];
  gettingReqConfigs = false;
  requireSupportingDocument = false;

  ownerInfo: any;
  gettingConfigs = false;
  filesForUpload: any[] = [];

  reqForm: UntypedFormGroup;
  submitting = false;

  fetchingCustomForm = false;
  customForm: CustomForm;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private authService: AuthService,
    private fb: UntypedFormBuilder,
    private workflowService: WorkflowService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loggedInUser = this.authService.decodeToken();

    if (this.selectedReq && !this.duplicateReq) {
      this.redraftMode = true;
    } else {
      this.initForm();
    }

    this.loadReqConfigs();
  }

  get formInitialized() {
    return this.redraftMode || this.duplicateReq
      ? this.reqDetails && !this.gettingReqConfigs
      : true;
  }

  initForm(reqDetail?: RequestDetail) {
    this.reqForm = this.fb.group({
      requestSetupId: [reqDetail?.requestSetupId || "", Validators.required],
      createdById: [reqDetail?.createdById || this.loggedInUser.nameid],
      paymentDescription: [reqDetail?.description || "", Validators.required],
    });

    if ((this.redraftMode || this.duplicateReq) && reqDetail?.customForms) {
      this.customForm = reqDetail.customForms;
      this.addCustomFieldsToForm(reqDetail.customForms.customFieldSets);
    }
  }

  getReqDetails() {
    this.workflowService
      .getRequest({ id: this.selectedReq.requestId })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.reqDetails = res.body;
          this.initForm(res.body);

          if (this.redraftMode || this.duplicateReq) {
            this.selectedReqType = this.modifiedReqConfigs.filter(
              (rc) => rc.id === this.reqDetails.requestSetupId
            );
          }
        },
      });
  }

  loadReqConfigs(
    data: GetReqConfigsQueryParams = {
      pageNumber: 1,
      pageSize: 1000,
      keyword: "",
    }
  ) {
    if (!this.redraftMode && !this.duplicateReq) {
      this.initReqConfigsAndCustomForm(this.reqConfigs);
      return;
    }

    this.gettingReqConfigs = true;
    this.workflowService
      .getRequestConfigs(data, { forInitiators: true })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.reqConfigs = res.body.items;
          const customReqConfigs = res.body.items.filter(
            (item) => item.requestType === "Custom"
          );

          this.modifiedReqConfigs = customReqConfigs.map((config) => ({
            id: config.requestSetupId,
            text: config.requestName,
          }));

          this.initReqConfigsAndCustomForm(customReqConfigs);

          if (this.redraftMode || this.duplicateReq) this.getReqDetails();
          this.gettingReqConfigs = false;
        },
        error: (_) => {
          this.gettingReqConfigs = false;
        },
      });
  }

  initReqConfigsAndCustomForm(configs: ReqConfig[]) {
    const foundConfig = this.reqConfigs.find(
      (reqConfig) => reqConfig.requestSetupId === this.reqConfigId
    );

    this.requireSupportingDocument = foundConfig?.requireSupportingDocument;

    this.modifiedReqConfigs = configs.map((config) => ({
      id: config.requestSetupId,
      text: config.requestName,
    }));

    const config = this.modifiedReqConfigs.find(
      (rc) => rc.id === this.reqConfigId
    );
    this.selectedReqType = [config];

    if (!this.redraftMode) {
      this.reqForm.get("requestSetupId").setValue(this.reqConfigId);

      const reqConfigsWithCustomForm = this.reqConfigs.filter((item) => {
        return item.customFormId;
      });

      const reqConfigWithCustomForm = reqConfigsWithCustomForm.find(
        (item) => item.requestSetupId === this.reqConfigId
      );

      if (reqConfigWithCustomForm)
        this.fetchCustomForm(reqConfigWithCustomForm.customFormId);
    }
  }

  fetchCustomForm(customFormKey: string) {
    this.fetchingCustomForm = true;

    this.workflowService
      .getCustomForm(customFormKey)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.customForm = res.body.data;
          this.addCustomFieldsToForm(this.customForm.customFieldSets);

          this.fetchingCustomForm = false;
        },
        error: () => {
          this.fetchingCustomForm = false;
        },
      });
  }

  addCustomFieldsToForm(customFieldSets: CustomFieldSet[]) {
    this.reqForm.addControl("customFieldSets", this.fb.array([]));
    this.customFieldSets.clear();

    const customFieldSetsInForm = this.reqForm.get(
      "customFieldSets"
    ) as UntypedFormArray;

    customFieldSets.forEach((cFSet) => {
      const cFSetInForm = this.fb.group({
        customFieldSetName: this.fb.control(cFSet.customFieldSetName),
        customFields: this.fb.array([]),
      });

      const cFieldsInForm = cFSetInForm.get("customFields") as UntypedFormArray;

      cFSet.customFields.forEach((cField) => {
        const cFieldInForm = this.fb.group({
          customFieldKey: [cField.customFieldKey],
          value: [cField?.value || ""],
          name: [cField.customFieldName],
          dataType: [cField.dataType],
        });

        if (cField.isRequired) {
          cFieldInForm.get("value").setValidators(Validators.required);
          cFieldInForm.addControl("required", this.fb.control(true));
        }

        if (
          cField.dataType === "RadioGroup" ||
          cField.dataType === "Selection"
        ) {
          cFieldInForm.addControl("customFieldSelections", this.fb.array([]));

          const cFieldSelectionsInForm = cFieldInForm.get(
            "customFieldSelections"
          ) as UntypedFormArray;

          cField.customFieldSelections?.forEach((cFieldSelectn) => {
            const cFieldSelectnInForm = this.fb.group({
              label: this.fb.control(cFieldSelectn.label),
              uniqueId: this.fb.control(cFieldSelectn.uniqueId),
            });

            cFieldSelectionsInForm.push(cFieldSelectnInForm);
          });
        }

        cFieldsInForm.push(cFieldInForm);
      });

      customFieldSetsInForm.push(cFSetInForm);
    });
  }

  get customFieldSets() {
    return this.reqForm.get("customFieldSets") as UntypedFormArray;
  }

  onSelect(value: string, event: CustomDropDown, index?: number) {
    switch (value) {
      case "reqType":
        this.reqForm.get("requestSetupId").setValue(event.id);
        const reqConfigsWithCustomForm = this.reqConfigs.filter((item) => {
          return item.customFormId;
        });

        const reqConfigWithCustomForm = reqConfigsWithCustomForm.find(
          (item) => item.requestSetupId === event.id
        );

        if (reqConfigWithCustomForm)
          this.fetchCustomForm(reqConfigWithCustomForm.customFormId);
        else this.customForm = null;
        break;
    }
  }

  onDeselect(value: string, index?: number) {
    switch (value) {
      case "reqType":
        this.reqForm.get("requestSetupId").setValue("");
        this.customForm = null;
        break;
    }
  }

  handleFileInput(filelist: FileList): void {
    this.filesForUpload = [];

    for (let i = 0; i < filelist.length; i++) {
      this.filesForUpload.push(filelist.item(i));
    }
  }

  removeFile(index: number): void {
    this.filesForUpload.splice(index, 1);
  }

  getCustomFieldValues() {
    const cFieldValues = [];

    this.customFieldSets.controls.forEach((cFSet) => {
      const cFields = cFSet.get("customFields") as UntypedFormArray;
      cFields.controls.forEach((cField) => {
        const cFValue = {
          customFieldKey: cField.get("customFieldKey").value,
          value: cField.get("value").value,
        };

        cFieldValues.push(cFValue);
      });
    });

    return cFieldValues;
  }

  onSubmit() {
    const { requestSetupId, createdById, paymentDescription } =
      this.reqForm.value;

    const data = {
      requestSetupId,
      createdById,
      paymentDescription,
      supportingDocuments: this.filesForUpload[0],
    };

    if (this.customForm && (!this.redraftMode || this.duplicateReq)) {
      data["customFieldValues"] = this.getCustomFieldValues();
    } else if (this.customForm && this.redraftMode) {
      data["customFieldsValues"] = {
        customFieldValues: this.getCustomFieldValues(),
      };
    }

    this.submitting = true;

    let req: Observable<HttpResponse<Object>>;

    if (this.redraftMode)
      req = this.workflowService.redraftRequest(
        data,
        this.selectedReq.requestId
      );
    else req = this.workflowService.createRequest(data);

    req.pipe(takeUntil(this.subs$)).subscribe({
      next: () => {
        this.submitting = false;

        this.toast.fire({
          type: "success",
          title: `Request ${
            this.redraftMode ? "redrafted" : "created"
          } successfully.`,
        });
        this.onCloseForm();
      },
      error: () => {
        this.submitting = false;
      },
    });
  }

  getApprovalComment() {
    return this.reqDetails?.approvals[this.reqDetails?.approvals?.length - 1]
      .comment;
  }

  onCloseForm() {
    this.modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
