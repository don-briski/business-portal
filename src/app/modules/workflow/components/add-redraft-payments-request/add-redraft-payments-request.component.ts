import { Component, Input, OnInit, OnDestroy } from "@angular/core";
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  UntypedFormArray,
  Validators,
  AbstractControl,
} from "@angular/forms";
import Swal from "sweetalert2";
import { HttpResponse } from "@angular/common/http";
import { Subject, Observable } from "rxjs";
import { takeUntil, pluck } from "rxjs/operators";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { CustomDropDown } from "src/app/model/CustomDropdown";
import { FinanceService } from "src/app/modules/finance/service/finance.service";
import { AuthService } from "src/app/service/auth.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ItemService } from "src/app/service/item.service";
import { customDateFormat } from "src/app/util/finance/financeHelper";
import { WorkflowService } from "../../services/workflow.service";
import {
  WorkflowRequest,
  RequestDetail,
  ReqConfig,
  CustomForm,
  RequestItem,
  GetReqConfigsQueryParams,
  CustomFieldSet,
} from "../../workflow.types";

@Component({
  selector: "lnd-add-redraft-payments-request",
  templateUrl: "./add-redraft-payments-request.component.html",
  styleUrls: ["./add-redraft-payments-request.component.scss"],
})
export class AddRedraftPaymentsRequestComponent implements OnInit, OnDestroy {
  @Input() reqConfigId: number;
  @Input() reqConfigs: ReqConfig[];
  @Input() selectedReq: WorkflowRequest;
  @Input() duplicateReq: boolean;

  subs$ = new Subject<void>();
  loggedInUser: any;

  redraftMode = false;
  reqDetails: RequestDetail;
  selectedReqType: CustomDropDown[] = [];
  selectedVendor: CustomDropDown[] = [];
  modifiedReqConfigs: CustomDropDown[] = [];
  gettingReqConfigs = false;
  requireSupportingDocument = false;

  vendors: CustomDropDown[] = [];
  ownerInfo: any;
  currencySymbol: string;
  gettingVendors = false;
  gettingItems = false;
  itemOpts: CustomDropDown[] = [];
  items: any[] = [];
  filesForUpload: any[] = [];

  reqForm: UntypedFormGroup;
  submitting = false;

  fetchingCustomForm = false;
  customForm: CustomForm;
  itemsTotalAmt = 0;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private authService: AuthService,
    private fb: UntypedFormBuilder,
    private configService: ConfigurationService,
    private finServ: FinanceService,
    private workflowService: WorkflowService,
    private itemService: ItemService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loggedInUser = this.authService.decodeToken();
    this.getOwnerInfo();
    this.getVendors();
    this.getItems();

    if (this.selectedReq && !this.duplicateReq) {
      this.redraftMode = true;
    } else {
      this.initForm();
    }

    this.loadReqConfigs();
  }

  get formInitialized() {
    if (this.redraftMode || this.duplicateReq) {
      return !this.gettingVendors && !this.gettingItems && this.reqDetails;
    } else {
      return !this.gettingVendors && !this.gettingItems;
    }
  }

  get selectedItems() {
    return this.reqForm.get("selectedItems") as UntypedFormArray;
  }

  initForm(reqDetail?: RequestDetail) {
    this.reqForm = this.fb.group({
      requestSetupId: [reqDetail?.requestSetupId || "", Validators.required],
      totalAmount: [reqDetail?.totalAmount || 0, Validators.required],
      paymentDate: [
        reqDetail?.paymentDate ? customDateFormat(reqDetail?.paymentDate) : "",
        Validators.required,
      ],
      vendorId: [reqDetail?.vendorId || "", Validators.required],
      createdById: [reqDetail?.createdById || this.loggedInUser.nameid],
      selectedItems: this.fb.array([], Validators.required),
      paymentDescription: [reqDetail?.description || "", Validators.required],
    });

    if (this.redraftMode || this.duplicateReq) {
      reqDetail?.requestItems.forEach((requestItem) => {
        const foundItem = this.items.find(
          (item) => item.itemId === requestItem.itemId
        );

        this.onAddItem(requestItem, foundItem);
      });

      if (reqDetail?.customForms) {
        this.customForm = reqDetail.customForms;
        this.addCustomFieldsToForm(reqDetail.customForms.customFieldSets);
      }

      this.itemsTotalAmt = reqDetail?.totalAmount;
    } else {
      this.onAddItem();
    }

    this.watchItemsChange();
  }

  watchItemsChange(): void {
    this.selectedItems.valueChanges.pipe(takeUntil(this.subs$)).subscribe({
      next: () => {
        this.itemsTotalAmt = 0;
        this.selectedItems.controls.forEach(({ value }) => {
          this.calculateItemsTotalAmt(+value.quantity, +value.costPrice);
        });
      },
    });
  }

  calculateItemsTotalAmt(qty: number, price: number) {
    if (qty && price) {
      const amt = qty * price;
      this.itemsTotalAmt += amt;
    }
  }

  watchItemChange(index: number): void {
    const item = this.selectedItems.at(index);

    item.valueChanges.pipe(takeUntil(this.subs$)).subscribe({
      next: (value) => {
        const qty = +value.quantity;
        const price = +value.costPrice;
        item.get("amount").setValue(qty * price, { emitEvent: false });
        this.calculateItemsTotalAmt(qty, price);
      },
    });
  }

  get itemsTotalAmtOutOfBounds() {
    return this.itemsTotalAmt !== +this.reqForm.get("totalAmount").value;
  }

  onAddItem(requestItem?: RequestItem, item?: any) {
    const ctrl = this.fb.group({
      itemId: [requestItem?.itemId || "", Validators.required],
      name: [requestItem?.itemName || "", Validators.required],
      quantity: [
        requestItem?.quantity || "",
        [Validators.required, Validators.min(1)],
      ],
      costPrice: [item?.costPrice || ""],
      amount: [item?.costPrice * requestItem?.quantity || ""],
    });

    this.selectedItems.push(ctrl);
    this.watchItemChange(this.selectedItems.controls.length - 1);
  }

  onRemoveItem(index: number) {
    this.selectedItems.removeAt(index);
  }

  getOwnerInfo() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.ownerInfo = res.body;
          this.currencySymbol = this.ownerInfo?.currency?.currencySymbol;
        },
      });
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
            const config = this.modifiedReqConfigs.find(
              (rc) => rc.id === this.reqDetails.requestSetupId
            );

            this.selectedReqType = [config];
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
          const paymentsReqConfigs = res.body.items.filter(
            (item) => item.requestType === "Payments"
          );

          this.modifiedReqConfigs = paymentsReqConfigs.map((config) => ({
            id: config.requestSetupId,
            text: config.requestName,
          }));

          this.initReqConfigsAndCustomForm(paymentsReqConfigs);

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

  getVendors() {
    this.gettingVendors = true;
    const model = {
      pageSize: 1000,
      pageNumber: 1,
    };
    this.finServ
      .getVendors(model)
      .pipe(pluck("body", "items"), takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.vendors = res.map((v: any) => ({
            id: v.id,
            text: v.fullName,
          }));

          if (this.redraftMode || this.duplicateReq) {
            this.selectedVendor = this.vendors.filter(
              (v) => v.id === this.selectedReq.vendorId
            );
          }
          this.gettingVendors = false;
        },
        error: (_) => {
          this.gettingVendors = false;
        },
      });
  }

  getItems() {
    this.gettingItems = true;
    this.itemService
      .getItems({ pageNumber: 1, pageSize: 1000 })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.items = res.body.items;
          this.itemOpts = res.body.items
            .filter((item: any) => item.costPrice > 0)
            .map((item: any) => ({
              id: item.itemId,
              text: item.itemName,
            }));
          this.gettingItems = false;
        },
        error: (_) => {
          this.gettingItems = false;
        },
      });
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
      case "vendor":
        this.reqForm.get("vendorId").setValue(event.id);
        break;
      case "item":
        const existingItem = this.selectedItems.controls.find(
          (control: AbstractControl) => control.get("itemId").value === event.id
        );
        if (existingItem) {
          this.toast.fire({
            type: "error",
            title:
              "Item added already. Increase the quantity of the item instead.",
          });
          this.selectedItems.removeAt(index);
          return;
        }

        const item = this.selectedItems.at(index) as UntypedFormGroup;
        item.get("itemId").setValue(event.id, { emitEvent: false });
        item.get("name").setValue(event.text, { emitEvent: false });
        item.get("quantity").setValue(1);

        const foundItem = this.items.find((item) => item.itemId === event.id);
        item.get("costPrice").setValue(foundItem.costPrice);
        item.get("amount").setValue(foundItem.costPrice, { emitEvent: false });
        break;
    }
  }

  onDeselect(value: string, index?: number) {
    switch (value) {
      case "reqType":
        this.reqForm.get("requestSetupId").setValue("");
        this.customForm = null;
        break;
      case "vendor":
        this.reqForm.get("vendorId").setValue("");
        break;
      case "item":
        const item = this.selectedItems.at(index) as UntypedFormGroup;
        item.get("itemId").setValue("");
        item.get("name").setValue("");
        item.get("quantity").setValue(0);
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
    const {
      requestSetupId,
      totalAmount,
      paymentDate,
      vendorId,
      createdById,
      selectedItems,
      paymentDescription,
    } = this.reqForm.value;

    const data = {
      requestSetupId,
      totalAmount,
      paymentDate,
      vendorId,
      createdById,
      selectedItems,
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
