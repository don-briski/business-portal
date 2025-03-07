import { Component, OnDestroy, OnInit } from "@angular/core";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Router } from "@angular/router";
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  UntypedFormBuilder,
} from "@angular/forms";
import { LoanoperationsService } from "../../../service/loanoperations.service";

import Swal from "sweetalert2";
import swal from "sweetalert2";
import { TokenRefreshErrorHandler } from "src/app/service/TokenRefreshErrorHandler";
import { HttpResponse } from "@angular/common/http";
import * as _ from "lodash";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Observable, Subject } from "rxjs";
import { map, pluck, takeUntil } from "rxjs/operators";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { multiLoanConfig } from "../models/Multi-loan-config.interface";
import { Configuration } from "src/app/model/configuration";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { nonZero } from "src/app/util/validators/validators";
import { toFormData } from "src/app/util/finance/financeHelper";
import { GrowthbookService } from "src/app/service/growthbook.service";
import GrowthBookFeatureTags from "src/app/model/growthbook-features";

@Component({
  selector: "app-loansetup-page",
  templateUrl: "./loansetup-page.component.html",
  styleUrls: ["./loansetup-page.component.scss"],
})
export class LoansetupPageComponent implements OnInit, OnDestroy {
  public user: any;
  public loanSetupForm: UntypedFormGroup;
  public loanDisbursmentForm: UntypedFormGroup;
  public notificationForm: UntypedFormGroup;
  public loader = false;
  public keyLoader = false;
  public isProductSetup = false;
  public ussdServicesLoaded = false;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  requestLoader: boolean;
  public root = "https://lenda-bucket.s3.eu-west-2.amazonaws.com/lendadevenv/";
  loggedInUser: any;
  appOwner: any;
  dropdownSettings = {};
  dataFields = [];
  dataFieldSelected = [];

  isEnterprise: boolean = false;
  ussdLoanTypes = [];
  hasActiveUssdLoanType: boolean = false;
  activeUssdLoanType: any;
  ussdLoanCode: string;
  ussdShortCodePrefix: string = null;
  selectedLoanTypeId: any = null;
  selectedLoanOfferId: any = null;
  loanOffers: any[];
  loanOffersSelect: any[];
  loanOffersFullSelect: any;
  selectedLoanOffer: any;
  hasDefaultLoanOffer: boolean;
  defaultLoanOffer: any;
  ngselectedLoanTypeId: any;
  ngselectedLoanOffer: any;
  ussdShortCodeLoader: boolean = false;
  setUssdShortCodePrefixForm: UntypedFormGroup;

  downloading: boolean;
  fileInputLabel: any;
  fileInput: any = null;
  uploading: boolean;
  multiLoanIsActive: boolean;

  loanOriginationIds = [
    "UNIQUE_ID",
    "EMAIL_ADDRESS",
    "UNIQUE_ID_OR_EMAIL_ADDRESS",
  ];
  customerField = [
    { id: "1", itemName: "UniqueId" },
    { id: "2", itemName: "Phone" },
    { id: "3", itemName: "Email" },
  ];
  customerFieldSelected = [];

  currentTheme: ColorThemeInterface;
  private _unsubscriber$ = new Subject<void>();

  bulkOperationType: string = null;

  retryOptions: CustomDropDown[] = [
    { id: "SendForUpdate", text: "Send Back For Account Update (Auto)" },
    { id: "AllowRetry", text: "Allow Disbursement Officer To Retry" },
  ];

  updateOptions: CustomDropDown[] = [
    { id: "SendForApproval", text: "Send For Approval" },
    { id: "SendForDisbursement", text: "Send For Disbursement" },
  ];

  multiLoanForm: UntypedFormGroup;
  multiLoanConfigs: multiLoanConfig[] = [];
  togglePopup = false;
  loanTypes: CustomDropDown[] = [];
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };
  multiLoanConfigState: "add" | "edit";

  constructor(
    private authService: AuthService,
    private configService: ConfigurationService,
    private userService: UserService,
    private router: Router,
    private loanoperationService: LoanoperationsService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private fb: UntypedFormBuilder,
    private colorThemeService: ColorThemeService,
    private growthbookService: GrowthbookService
  ) {}

  ngOnInit() {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.fetchUserInfo(this.authService.decodeToken().nameid);
    this.loanSetupFormInit();
    this.loanDisbursmentFormInit();
    this.getAppOwnerDetails();
    this.notificationFormInit();
    this.spoolFormFields();
    this.checkEnterprise();
    this.dropdownSettings = {
      singleSelection: false,
      lazyLoading: true,
      text: "Assign Required",
      selectAllText: "Select All Fields",
      unSelectAllText: "UnSelect All",
      enableSearchFilter: true,
      classes: "loan-setup",
    };
    this.getLoanTypes();
    this.initMultiLoanForm();
    this.configService
      .getAppOwnerInfo({ applicationOwner: true })
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.multiLoanIsActive = res.body.isMultiLoanSubscribed;
      });
  }

  getMultiLoanConfigs($event?): void {
    let payload = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if ($event) payload = { ...payload, ...$event };
    this.requestLoader = true;
    this.configService
      .getMultiLoanConfigs(payload)
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.requestLoader = false;
        this._setPagination(res);
      });
  }

  setMultiLoanActiveState(state) {
    this.loader = true;
    const payload = toFormData({ Subscribe: state });
    this.configService
      .setMultiLoanState(payload)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.multiLoanIsActive = state;
        this.loader = false;
      });
  }

  private _setPagination(res: any): void {
    this.multiLoanConfigs = res.items;
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  toggleProductPopup(state: "add" | "edit", loanTypeId?: number) {
    if (state === "edit") {
      const config = this.multiLoanConfigs.find(
        (config) => config.loanTypeId === loanTypeId
      );
      this.multiLoanForm.patchValue({
        loanType: [{ id: config.loanTypeId, text: config.name }],
        loanTypeId: config.loanTypeId,
        maxActiveLoanPerCustomer: config.maxActiveLoanPerCustomer,
        allowConcurrency: config.allowConcurrency,
      });
    }

    this.togglePopup = !this.togglePopup;
    this.multiLoanConfigState = state;
  }

  deleteMultiLoanConfig(loanTypeId: number) {
    this.requestLoader = true;
    this.configService
      .deleteMultiLoanConfig({ loanTypeId })
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(() => {
        this.toast.fire({
          type: "success",
          title: "Configuration deleted successfully",
        });
        this.getMultiLoanConfigs();
      });
  }

  initMultiLoanForm() {
    this.multiLoanForm = this.fb.group({
      loanType: new UntypedFormControl("", Validators.required),
      loanTypeId: new UntypedFormControl("", Validators.required),
      maxActiveLoanPerCustomer: new UntypedFormControl(1, [
        Validators.required,
        Validators.min(1),
        nonZero.bind(this),
      ]),
      allowConcurrency: new UntypedFormControl(false, Validators.required),
    });

    this.multiLoanForm
      .get("loanType")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        if (res) {
          this.multiLoanForm.get("loanTypeId").setValue(res[0]?.id);
        }
      });
  }

  getLoanTypes() {
    this.configService
      .spoolLoanTypes({ pageNumber: 1, pageSize: 10 })
      .pipe(
        pluck("body", "value", "data"),
        map((response) =>
          response.map((loanType) => ({
            id: loanType.loanTypeId,
            text: loanType.loanName,
          }))
        ),
        takeUntil(this._unsubscriber$)
      )
      .subscribe((loanTypes) => {
        this.loanTypes = loanTypes;
      });
  }

  updateDropdown($event: any): void {
    this.loanTypes = $event.value.data.map((loanType) => ({
      id: loanType?.loanTypeId,
      text: loanType?.loanName,
    }));
  }

  getSearchLoanTypeService(): Select2SearchApi {
    return {
      search: (keyword: string) => {
        const model = {
          filter: keyword,
          pageNumber: "1",
          pageSize: "10",
        };
        return this.configService.spoolLoanTypes(model);
      },
    };
  }

  setConcurrency($event) {
    this.multiLoanForm.get("allowConcurrency").setValue($event);
  }

  submitMultiLoanConfig() {
    this.requestLoader = true;
    const { loanType, ...payload } = this.multiLoanForm.value;

    this.configService
      .setMultiLoanConfig(toFormData(payload))
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        () => {
          this.toast.fire({
            type: "success",
            title: "Configuration saved successfully",
          });
          this.getMultiLoanConfigs();
          this.requestLoader = false;
          this.multiLoanForm.reset({
            allowConcurrency: false,
            maxActiveLoanPerCustomer: 1,
          });
          this.togglePopup = !this.toggleOpened;
        },
        () => {
          this.requestLoader = false;
          this.togglePopup = !this.toggleOpened;
        }
      );
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  ussdServices() {
    this.requestLoader = true;
    this.getUssdLoanTypes();
    this.getUssdLoanCode();
    this.checkEnterprise();
    this.getActiveUssdLoanType();
    this.getLoanOffersList();
    this.getDefaultLoanOffer();

    this.ussdServicesLoaded = true;
  }

  onItemSelect(item: any) {
    this.loanSetupForm.controls["fieldModel"].setValue(this.dataFieldSelected, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanSetupForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  OnItemDeSelect(item: any) {
    this.loanSetupForm.controls["fieldModel"].setValue(this.dataFieldSelected, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanSetupForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  onSelectAll(items: any) {
    this.dataFieldSelected = items;
    this.loanSetupForm.controls["fieldModel"].setValue(this.dataFieldSelected, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanSetupForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  onDeSelectAll(items: any) {
    this.dataFieldSelected = [];
    this.loanSetupForm.controls["fieldModel"].setValue(this.dataFieldSelected, {
      onlySelf: true,
      emitEvent: true,
    });
    this.loanSetupForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  onCustomerItemSelect(item: any) {
    this.loanSetupForm.controls["uniqueIdInformation"].setValue(
      this.customerFieldSelected,
      { onlySelf: true, emitEvent: true }
    );
    this.loanSetupForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  OnCustomerItemDeSelect(item: any) {
    this.loanSetupForm.controls["uniqueIdInformation"].setValue(
      this.customerFieldSelected,
      { onlySelf: true, emitEvent: true }
    );
    this.loanSetupForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  onCustomerSelectAll(items: any) {
    this.customerFieldSelected = items;
    this.loanSetupForm.controls["uniqueIdInformation"].setValue(
      this.customerFieldSelected,
      { onlySelf: true, emitEvent: true }
    );
    this.loanSetupForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  onCustomerDeSelectAll(items: any) {
    this.customerFieldSelected = [];
    this.loanSetupForm.controls["uniqueIdInformation"].setValue(
      this.customerFieldSelected,
      { onlySelf: true, emitEvent: true }
    );
    this.loanSetupForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  spoolFormFields() {
    this.configService.spoolFormFields().subscribe(
      (res) => {
        this.dataFields = res.body.All;
        this.dataFieldSelected = res.body.Selected;
        this.loanSetupForm.controls["fieldModel"].setValue(
          this.dataFieldSelected,
          { onlySelf: true, emitEvent: true }
        );
        this.loanSetupForm.updateValueAndValidity({
          onlySelf: true,
          emitEvent: true,
        });
      },
      (err) => {}
    );
  }

  notificationFormInit() {
    this.notificationForm = new UntypedFormGroup({
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      Duration: new UntypedFormControl("", [Validators.required]),
    });
  }

  notificationFormSave(val) {
    this.keyLoader = true;
    this.configService
      .updateNotification(this.notificationForm.value)
      .subscribe(
        (res) => {
          this.keyLoader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
        },
        (err) => {
          this.keyLoader = false;
        }
      );
  }

  copyToClipboard(val: string) {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    this.toast.fire({
      type: "success",
      title: "Link copied to clipboard.",
    });
  }

  fetchUserInfo(id: number) {
    this.requestLoader = true;
    this.userService.getUserInfo(id).subscribe(
      (res) => {
        this.requestLoader = false;
        this.user = res.body;
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
      },
      (err) => {
        this.requestLoader = false;
      }
    );
  }

  submitQueryRequest(type, message) {
    // tslint:disable-next-line:max-line-length
    swal
      .fire({
        type: "info",
        text: message,
        title: "Background Event",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          this.requestLoader = true;

          const model = {
            Type: type,
            UserId: this.user.userId,
          };

          this.loanoperationService.ForceBackgroundEvent(model).subscribe(
            (res) => {
              this.requestLoader = false;
              swal.fire({
                type: "success",
                text: res.body.value.feedbackmessage,
                title: "Finished!",
              });
            },
            (err) => {
              this.requestLoader = false;
            }
          );
        }
      });
  }

  loanSetupFormInit() {
    this.loanSetupForm = new UntypedFormGroup({
      appOwnerLoanApplicationCode: new UntypedFormControl("", [
        Validators.required,
      ]),
      appOwnerLoanCode: new UntypedFormControl("", [Validators.required]),
      appOwnerLoanBatchCode: new UntypedFormControl("", [Validators.required]),
      appOwnerLoanDisbursementCode: new UntypedFormControl("", [
        Validators.required,
      ]),
      appOwnerLoanPaymentCode: new UntypedFormControl("", [
        Validators.required,
      ]),
      customerLoanSubmissionType: new UntypedFormControl("", [
        Validators.required,
      ]),
      appOwnerLoanOriginationId: new UntypedFormControl("", [
        Validators.required,
      ]),
      appOwnerLoanBankAccountValidationSetting: new UntypedFormControl("", [
        Validators.required,
      ]),
      fieldModel: new UntypedFormControl([]),
      uniqueIdInformation: new UntypedFormControl([]),
    });
  }

  loanDisbursmentFormInit() {
    this.loanDisbursmentForm = new UntypedFormGroup({
      retryOptionObj: new UntypedFormControl(
        [this.retryOptions[1]],
        [Validators.required]
      ),
      retryOption: new UntypedFormControl("AllowRetry", [Validators.required]),
      retryCount: new UntypedFormControl(0),
      updateActionObj: new UntypedFormControl("", [Validators.required]),
      updateAction: new UntypedFormControl("", [Validators.required]),
      remindersAfterFailureCount: new UntypedFormControl(0),
    });

    this.loanDisbursmentForm
      .get("retryOptionObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        if (res) {
          this.loanDisbursmentForm.get("retryOption").setValue(res[0]?.id);
        }
      });

    this.loanDisbursmentForm
      .get("updateActionObj")
      .valueChanges.pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        if (res) {
          this.loanDisbursmentForm.get("updateAction").setValue(res[0]?.id);
        }
      });
  }

  getAppOwnerDetails() {
    this.configService.getAppOwnerInfo().subscribe(
      (res) => {
        this.appOwner = res.body;

        // Set business info
        if (this.appOwner !== null) {
          this.loanSetupForm.controls.appOwnerLoanApplicationCode.setValue(
            this.appOwner.appOwnerLoanApplicationCode
          );
          this.loanSetupForm.controls.appOwnerLoanCode.setValue(
            this.appOwner.appOwnerLoanCode
          );
          this.loanSetupForm.controls.appOwnerLoanBatchCode.setValue(
            this.appOwner.appOwnerLoanBatchCode
          );
          this.loanSetupForm.controls.appOwnerLoanDisbursementCode.setValue(
            this.appOwner.appOwnerLoanDisbursementCode
          );
          this.loanSetupForm.controls.appOwnerLoanPaymentCode.setValue(
            this.appOwner.appOwnerLoanPaymentCode
          );
          this.loanSetupForm.controls.appOwnerLoanOriginationId.setValue(
            this.appOwner.appOwnerLoanOriginationId ||
              "UNIQUE_ID_OR_EMAIL_ADDRESS"
          );
          this.loanSetupForm.controls.appOwnerLoanBankAccountValidationSetting.setValue(
            this.appOwner.loanBankAccountValidationSetting
          );
          this.loanSetupForm.controls.customerLoanSubmissionType.setValue(
            this.appOwner.customerLoanSubmissionType
          );
          this.loanSetupForm.controls.uniqueIdInformation.setValue(
            this.appOwner.uniqueIdInformation
          );

          //dusbursement setup
          if (this.appOwner.disbursementFailedSettings) {
            var disbursementFailedSettings = JSON.parse(
              this.appOwner.disbursementFailedSettings
            );
            let retryOptionObj = this.retryOptions.filter(
              (retryOption) =>
                retryOption.id === disbursementFailedSettings.RetryOption
            );

            let updateActionObj = this.updateOptions.filter(
              (updateOptions) =>
                updateOptions.id === disbursementFailedSettings.UpdateAction
            );

            this.loanDisbursmentForm.patchValue({
              retryOptionObj: retryOptionObj,
              retryOption: disbursementFailedSettings.RetryOption,
              retryCount: disbursementFailedSettings.RetryCount,
              updateActionObj: updateActionObj,
              updateAction: disbursementFailedSettings.UpdateAction,
              remindersAfterFailureCount:
                disbursementFailedSettings.RemindersAfterFailureCount,
            });
          }
        }
      },
      (err) => {
        this.requestLoader = false;
      }
    );

    this.configService.getAppOwnerProductStatus().subscribe(
      (res) => {
        this.isProductSetup = res.body;
      },
      (err) => {}
    );
  }

  updateLoanSetup() {
    this.loader = true;
    this.configService.updateLoanSetup(this.loanSetupForm.value).subscribe(
      (res) => {
        this.loader = false;
        this.toast.fire({
          type: "success",
          title: "Update was successful",
        });
      },
      (err) => {
        this.loader = false;
      }
    );
  }

  private _cleanUp(): void {
    this.loanDisbursmentForm.removeControl("retryOptionObj");
    this.loanDisbursmentForm.removeControl("updateActionObj");
  }

  updateDisbursementSetup() {
    this._cleanUp();
    this.loader = true;

    this.configService
      .updateDisbursementSetup(this.loanDisbursmentForm.value)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.loader = false;
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  toggleOpened($event) {}

  getUssdLoanTypes() {
    this.ussdLoanTypes = [];
    this.configService.spoolLoanTypesForUssdActivation().subscribe(
      (res) => {
        this.ussdLoanTypes = res.body.map((element) => {
          return { id: element.loanTypeId, text: element.loanName };
        });
        this.requestLoader = false;
      },
      (err) => {
        this.requestLoader = false;
      }
    );
  }

  getLoanOffersList() {
    this.loanOffers = [];
    this.loanOffersSelect = [];
    this.configService.spoolLoanOffersList().subscribe(
      (res) => {
        this.loanOffers = res.body;
        this.loanOffersFullSelect = res.body.map((element) => {
          return { id: element.loanOfferId, text: element.name };
        });
        this.loanOffersSelect = [...this.loanOffersFullSelect];
      },
      (err) => {}
    );
  }

  getUssdLoanCode() {
    this.configService.spoolAppOwnerUssdLoanCode().subscribe(
      (res) => {
        this.ussdLoanCode = res.body;
      },
      (err) => {}
    );
  }

  getUssdShortCodePrefix() {
    this.configService.getUssdShortCodePrefix().subscribe(
      (res) => {
        this.ussdShortCodePrefix = res.body;
        this.setUssdShortCodePrefixFormInit(this.ussdShortCodePrefix);
      },
      (err) => {}
    );
  }

  getActiveUssdLoanType() {
    this.configService.spoolActiveUssdLoanType().subscribe(
      (res) => {
        if (res.body.status) {
          this.hasActiveUssdLoanType = true;
          this.activeUssdLoanType = res.body.message;
        } else {
          this.hasActiveUssdLoanType = false;
          this.activeUssdLoanType = null;
        }
      },
      (err) => {
        this.hasActiveUssdLoanType = false;
        this.activeUssdLoanType = null;
      }
    );
  }

  getDefaultLoanOffer() {
    this.configService.spoolDefaultLoanOffer().subscribe(
      (res) => {
        if (res.body.status) {
          this.hasDefaultLoanOffer = true;
          this.defaultLoanOffer = res.body.message;
        } else {
          this.hasDefaultLoanOffer = false;
          this.defaultLoanOffer = null;
        }
      },
      (err) => {
        this.hasDefaultLoanOffer = false;
        this.defaultLoanOffer = null;
      }
    );
  }

  checkEnterprise() {
    this.configService.isEnterprise().subscribe(
      (res) => {
        this.isEnterprise = res.body;
        if (this.isEnterprise) {
          this.getUssdShortCodePrefix();
        }
      },
      (err) => {}
    );
  }

  setUssdShortCodePrefixFormInit(ussdPrefix) {
    this.setUssdShortCodePrefixForm = new UntypedFormGroup({
      ussdShortCode: new UntypedFormControl(ussdPrefix, [Validators.required]),
    });
  }

  setUssdShortCodePrefix() {
    this.ussdShortCodeLoader = true;
    this.configService
      .setUssdShortCodePrefix(this.setUssdShortCodePrefixForm.value)
      .subscribe(
        (res) => {
          this.ussdShortCodeLoader = false;
          this.getUssdShortCodePrefix();
          this.toast.fire({
            type: "success",
            title: "Update was successful",
          });
        },
        (err) => {
          this.ussdShortCodeLoader = false;
        }
      );
  }

  onSelectActiveLoanType(data) {
    this.selectedLoanTypeId = data.id;

    this.loanOffersSelect = this.loanOffers
      .filter((x) => x.loanTypeId == data.id)
      .map((element) => {
        return { id: element.loanOfferId, text: element.name };
      });
    this.selectedLoanOfferId = null;
    this.selectedLoanOffer = null;
    this.ngselectedLoanOffer = null;
  }

  onSelectDefaultLoanOffer(data) {
    this.selectedLoanOfferId = data.id;
    this.selectedLoanOffer = null;
    let selectedLoanOffer = this.loanOffers.filter(
      (x) => x.loanOfferId == data.id
    );

    if (selectedLoanOffer != null && selectedLoanOffer.length != 0) {
      this.selectedLoanOffer = selectedLoanOffer[0];
    }
  }

  setActiveUssdLoanTypeAndOffer() {
    if (this.selectedLoanTypeId == null) {
      Swal.fire("Error", "Please select a Loan Type", "error");
      return;
    }
    this.loader = true;
    this.configService
      .setActiveUssdLoanTypeAndOffer(
        this.selectedLoanTypeId,
        this.selectedLoanOfferId
      )
      .subscribe(
        (res) => {
          this.selectedLoanTypeId = null;
          this.selectedLoanOfferId = null;
          this.selectedLoanOffer = null;
          this.ngselectedLoanOffer = null;
          this.ngselectedLoanTypeId = null;
          this.getUssdLoanTypes();
          this.getUssdLoanCode();
          this.getActiveUssdLoanType();
          this.getLoanOffersList();
          this.getDefaultLoanOffer();
          swal.fire({ type: "success", text: "success", title: "Success!" });
          this.loader = false;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  unsetActiveUssdLoanTypeAndOffer() {
    this.loader = true;
    this.configService.unsetActiveUssdLoanTypeAndOffer().subscribe(
      (res) => {
        this.selectedLoanTypeId = null;
        this.selectedLoanOfferId = null;
        this.selectedLoanOffer = null;
        this.ngselectedLoanOffer = null;
        this.ngselectedLoanTypeId = null;
        this.getUssdLoanTypes();
        this.getUssdLoanCode();
        this.getActiveUssdLoanType();
        this.getLoanOffersList();
        this.getDefaultLoanOffer();
        swal.fire({ type: "success", text: "success", title: "Success!" });
        this.loader = false;
      },
      (err) => {
        this.loader = false;
      }
    );
  }

  getFileName(response: HttpResponse<Blob>) {
    let filename: string;
    try {
      const contentDisposition: string = response?.headers.get(
        "Content-Disposition"
      );
      filename = contentDisposition
        .split(";")[1]
        .split("filename")[1]
        .split("=")[1]
        .trim();
    } catch (e) {
      filename = "Lendastack-Loan-Template.xlsx";
    }
    return filename;
  }

  downloadLoanTemplate() {
    this.downloading = true;
    this.loanoperationService.saveBulkloanTemplate().subscribe(
      (response: HttpResponse<Blob>) => {
        swal.fire({
          type: "info",
          text: "Template will start downloading automatically.",
          title: "Downloading",
        });
        const filename: string = this.getFileName(response);
        let binaryData = [];
        binaryData.push(response.body);
        let downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(
          new Blob(binaryData, { type: "blob" })
        );
        downloadLink.setAttribute("download", filename);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        this.downloading = false;
      },
      (err) => {
        this.downloading = false;
      }
    );
  }
  downloadLoanUpdateTemplate() {
    this.downloading = true;
    this.loanoperationService.saveBulkloanRescheduleTemplate().subscribe(
      (response: HttpResponse<Blob>) => {
        swal.fire({
          type: "info",
          text: "Template will start downloading automatically.",
          title: "Downloading",
        });
        const filename: string = this.getFileName(response);
        let binaryData = [];
        binaryData.push(response.body);
        let downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(
          new Blob(binaryData, { type: "blob" })
        );
        downloadLink.setAttribute("download", filename);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        this.downloading = false;
      },
      (err) => {
        this.downloading = false;
      }
    );
  }

  bulkOperationLoanService$(): Observable<any> {
    const operation = this.bulkOperationType;

    if (operation === "loan") {
      const form = new FormData();
      form.append("File", this.fileInput, this.fileInput.name);
      return this.loanoperationService.bulkLoanUpload(form);
    } else if (operation === "tenor") {
      const form = new FormData();
      form.append("LoanRescheduleFile", this.fileInput, this.fileInput.name);
      return this.loanoperationService.bulkLoanReschedukeUpload(form);
    }
  }

  onFileSelect(event) {
    let af = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      if (!_.includes(af, file.type)) {
        swal.mixin({
          type: "info",
          title: "Only EXCEL Docs Allowed!",
          timer: 3000,
        });
      } else {
        this.fileInputLabel = file.name;
        this.fileInput = file;
      }
    }
  }

  removeFile() {
    this.fileInput = null;
    this.fileInputLabel = null;
  }

  uploadEvents() {
    if (this.fileInput !== null) {
      this.uploading = true;

      this.bulkOperationLoanService$().subscribe(
        (res) => {
          let message = res?.body?.message ?? "Upload successful";
          swal.fire({ type: "success", title: "Success", text: message });
          this.uploading = false;
        },
        (err) => {
          this.uploading = false;
        }
      );
    } else {
      swal.mixin({
        type: "info",
        text: "You have not selected any file to upload.",
      });
    }
  }

  enableFeature(): boolean {
    return this.growthbookService.growthbook.isOn(
      GrowthBookFeatureTags.DisbursementLimit
    );
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
