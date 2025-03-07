import { Component, OnInit } from "@angular/core";
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
import Swal from "sweetalert2";
import * as _ from "lodash";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Observable, Subject } from "rxjs";
import { takeUntil, pluck, tap } from "rxjs/operators";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { FinanceService } from "../../finance/service/finance.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MovementEntryService } from "src/app/service/movemententry.service";
import { humanize } from "src/app/util/finance/financeHelper";
import { Pagination } from "src/app/model/Pagination";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { GetTaxesResBody, Tax } from "../../finance/finance.types";
import { GetDataQueryParams } from "../../shared/shared.types";
import { Filter } from "src/app/model/filter";

@Component({
  selector: "app-financesetup-page",
  templateUrl: "./financesetup-page.component.html",
  styleUrls: ["./financesetup-page.component.scss"],
})
export class FinancesetupPageComponent implements OnInit {
  fetchUnits: boolean = false;
  public user: any;
  public financeSetupForm: UntypedFormGroup;
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
  _humanize: Function = humanize;
  requestLoader: boolean;
  public root = "https://lenda-bucket.s3.eu-west-2.amazonaws.com/lendadevenv/";
  loggedInUser: any;
  appOwner: any;
  dropdownSettings = {};
  dataFields = [];
  dataFieldSelected = [];
  nonEditableLowerBoundaries: number[] = [];
  selectedTax: any;

  ussdLoanTypes = [];
  hasActiveUssdLoanType: boolean = false;
  activeUssdLoanType: any;
  ussdLoanCode: string;
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
  downloading: boolean;
  fileInputLabel: any;
  fileInput: any = null;
  uploading: boolean;

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
  unsubscriber$ = new Subject<void>();

  allGroupHeaders: any[] = [];
  groupHeadersCopy: any[];
  paymentTermsForm: UntypedFormGroup;
  allPaymentTerms: any[] = [];
  activeStatus: any[] = [
    { id: true, text: "Active" },
    { id: false, text: "Inactive" },
  ];
  taxTypes: CustomDropDown[] = [
    { id: "Sales", text: "Sales" },
    { id: "Purchase", text: "Purchase" },
    { id: "Both", text: "Both" },
  ];
  defaultStatus: any[] = [
    { id: 0, text: "No" },
    { id: 1, text: "Yes" },
  ];
  isEditingPaymentTerms: boolean;

  taxForm: UntypedFormGroup;
  allTaxes: Tax[] = [];
  taxesPagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  isEditingTax: boolean;

  allPaymentModes: any[] = [];
  paymentModeForm: UntypedFormGroup;
  isEditingPaymentMode: boolean;

  // Movement entry
  accounts: any[] = [];
  movementEntries: any[] = [];
  movementEntry: any = null;
  movementEntriesLoader = false;
  movementEntryLoader = false;
  movementEntrySaveLoader = false;
  // END Movement Entry

  filterModel: Filter;
  filterOptions: string[] = ["Loan", "Investment", "Finance"];
  openModalState: boolean = false;
  template;
  unit;
  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    count: 0,
    totalPages: 0,
    jumpArray: [],
  };
  fetchDataDto = {
    pageNumber: this.pagination.pageNumber,
    pageSize: this.pagination.pageSize,
  };
  isLoading = true;
  currentTab = "accountSetupTab";
  accountTab = "pills-headers";
  originalEntries: any[] = [];
  slct2Accounts;

  editFiscalYear: boolean;
  fiscalYear: string;
  currentFiscalYear: string;
  isSavingFiscalYear: boolean;
  accountsSetupChildTabs:{id:string,name:string, class: string}[] = [
    {
      id:"pills-headers", name: "Group Headers", class: 'nav-link active show'
    },
    {
      id:"pills-fiscal", name: "Fiscal Year", class: 'nav-link'
    },
    {
      id:"pills-opening-balance", name: "Opening Balances", class: 'nav-link'
    },
    {
      id:"pills-customer-balances", name: "Customer Balances", class: 'nav-link'
    },
    {
      id:"pills-vendor-balances", name: "Vendor Balances", class: 'nav-link'
    },
    {
      id:"pills-classification", name: "Account Classification", class: 'nav-link'
    },
  ]

  constructor(
    private authService: AuthService,
    private configService: ConfigurationService,
    private accountService: ChartOfAccountService,
    private userService: UserService,
    private movementEntryService: MovementEntryService,
    private router: Router,
    private fb: UntypedFormBuilder,
    private colorThemeService: ColorThemeService,
    private chartOfAccountsService: ChartOfAccountService,
    private financeService: FinanceService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.loadTheme();
    this.loadAccounts();
    this.getMovementEntries();

    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }

    this.fetchUserInfo(this.authService.decodeToken().nameid);
    this.financeSetupFormInit();
    this.getAppOwnerDetails();
    this.notificationFormInit();

    this.dropdownSettings = {
      singleSelection: false,
      lazyLoading: true,
      text: "Assign Required",
      selectAllText: "Select All Fields",
      unSelectAllText: "UnSelect All",
      enableSearchFilter: true,
      classes: "loan-setup",
    };

    this.getAllGroupHeaders();
    this.loadFiscalYear();
  }

  filterEntries(event): void {
    this.movementEntries = [...this.originalEntries];
    if (event.length > 1) {
      let regex = new RegExp(event, "i");
      this.movementEntries = this.movementEntries.filter((entry) =>
        regex.test(entry.operation)
      );
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  setEditableHeaders(accountId: number): void {
    this.nonEditableLowerBoundaries.push(accountId);
  }

  isNonEditable(accountId: number): boolean {
    return this.nonEditableLowerBoundaries.includes(accountId);
  }

  fetchData(resource: string): void {
    this.currentTab = resource;

    switch (resource) {
      case "taxes":
        this.fetchTaxes(this.fetchDataDto);
        break;

      case "paymentMode":
        this.fetchPaymentModes(this.fetchDataDto);
        break;
      default:
        this.fetchPaymentTerms(this.fetchDataDto);
        break;
    }
  }

  private loadAccounts(): void {
    this.accountService
      .getAccounts()
      .pipe(
        tap((accounts) => {
          this.slct2Accounts = accounts.map((account) => ({
            id: account.accountId,
            text: account.name,
          }));
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((res) => {
        this.accounts = res;
      });
  }

  notificationFormInit() {
    this.notificationForm = new UntypedFormGroup({
      UserId: new UntypedFormControl(this.authService.decodeToken().nameid, [
        Validators.required,
      ]),
      Duration: new UntypedFormControl("", [Validators.required]),
    });
  }

  toggleModal(template) {
    this.openModalState = true;
    this.template = template;
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

  financeSetupFormInit() {
    this.financeSetupForm = new UntypedFormGroup({
      appOwnerPettyCashTransactionCode: new UntypedFormControl("", [
        Validators.required,
      ]),
      appOwnerExpenseCode: new UntypedFormControl("", [Validators.required]),
      appOwnerJournalCode: new UntypedFormControl("", [Validators.required]),
      appOwnerPurchaseOrderCode: new UntypedFormControl("", [Validators.required]),
      appOwnerItemCode: new UntypedFormControl("", [Validators.required]),
      appOwnerVendorCreditNoteCode: new UntypedFormControl("", [Validators.required]),
      appOwnerCreditNoteCode: new UntypedFormControl("", [Validators.required]),
      appOwnerIncomeCode: new UntypedFormControl("", [Validators.required]),
      appOwnerFinancePaymentCode: new UntypedFormControl("", [Validators.required]),
      appOwnerBillCode: new UntypedFormControl("", [Validators.required]),
    });
  }

  getAppOwnerDetails() {
    this.configService.getAppOwnerInfo().subscribe(
      (res) => {
        this.appOwner = res.body;
        // Set business info
        if (this.appOwner !== null) {
          this.financeSetupForm.controls.appOwnerPettyCashTransactionCode.setValue(
            this.appOwner.appOwnerPettyCashTransactionCode
          );
          this.financeSetupForm.controls.appOwnerExpenseCode.setValue(
            this.appOwner.appOwnerExpenseCode
          );
          this.financeSetupForm.controls.appOwnerJournalCode.setValue(
            this.appOwner.appOwnerJournalCode
          );
          this.financeSetupForm.controls.appOwnerPurchaseOrderCode.setValue(
            this.appOwner.appOwnerPurchaseOrderCode
          );
          this.financeSetupForm.controls.appOwnerItemCode.setValue(
            this.appOwner.appOwnerItemCode
          );
          this.financeSetupForm.controls.appOwnerVendorCreditNoteCode.setValue(
            this.appOwner.appOwnerVendorCreditNoteCode
          );
          this.financeSetupForm.controls.appOwnerCreditNoteCode.setValue(
            this.appOwner.appOwnerCreditNoteCode
          );
          this.financeSetupForm.controls.appOwnerIncomeCode.setValue(
            this.appOwner.appOwnerIncomeCode
          );
          this.financeSetupForm.controls.appOwnerFinancePaymentCode.setValue(
            this.appOwner.appOwnerFinancePaymentCode
          );
          this.financeSetupForm.controls.appOwnerBillCode.setValue(
            this.appOwner.appOwnerBillCode
          );
        }
      },
      (err) => {
        this.requestLoader = false;
      }
    );
  }

  updateFinanceSetupForm() {
    this.loader = true;
    this.configService
      .updateFinanceSetupForm(this.financeSetupForm.value)
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

  getAllGroupHeaders(): void {
    this.chartOfAccountsService
      .getGroupHeaders()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.allGroupHeaders = res;
        },
        (err) => {},
        () => {
          this.allGroupHeaders.forEach((item) => {
            item["isEditing"] = false;
          });
        }
      );
  }

  updateGroupHeader(data: any): void {
    this.loader = true;
    this.chartOfAccountsService
      .configureGroupHeader(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.getAllGroupHeaders();
          this.loader = false;
          this.toast.fire({
            text: "Group header updated successfully",
            type: "success",
          });
        },
        (error) => {
          this.loader = false;
        }
      );
  }

  changeGroupHeaderValue(event: any, index: number, position: string): void {
    const value = event.target.value;
    if (position === "lower") {
      this.allGroupHeaders[index]["newLowerBoudary"] = +value;
    } else if (position === "upper") {
      this.allGroupHeaders[index]["newUpperBoundary"] = +value;
    }
  }

  startUpdate(index: number): void {
    const groupHeader = this.allGroupHeaders[index];

    if (
      (groupHeader?.newLowerBoudary && groupHeader?.newUpperBoundary) ||
      (groupHeader.referenceLowerBoundary && groupHeader.referenceUpperBoundary)
    ) {
      Swal.fire({
        type: "info",
        text: "Are you sure you want to complete the setup for the group header? Please note that you will not be able to edit after confirmation.",
        title: "Complete setup ?",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Cancel",
        confirmButtonText: "Yes, Configure it",
        confirmButtonColor: "#558E90",
      }).then((result) => {
        if (result.value) {
          const data = {
            groupHeaderId: groupHeader.accountId,
            lowerReferenceBoundary:
              groupHeader.newLowerBoudary ?? groupHeader.referenceLowerBoundary,
            upperReferenceBoundary:
              groupHeader.newUpperBoundary ??
              groupHeader.referenceUpperBoundary,
          };

          this.updateGroupHeader(data);
        }
      });
    } else {
      Swal.fire({
        type: "error",
        text: "Lower and Upper boundary must be set !",
        title: "Invalid input",
        confirmButtonText: "Back",
        confirmButtonColor: "#558E90",
      });
    }
  }

  fetchPaymentTerms(data): void {
    this.isLoading = true;
    const {keyword, ...payload} = data;
    if (keyword) {
      payload.paymentModeName = keyword;
    }

    this.financeService
      .spoolAllPaymentTerms(payload)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.allPaymentTerms = res.data.items;
        this.setPagination(res);
        this.isLoading = false;
      });
  }

  attemptDelete(id: any, type: string): void {
    Swal.fire({
      type: "info",
      text: "Are you sure you want to delete this item ?",
      title: "Delete?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        if (type === "paymentTerms") this.deletePaymentTerms(id);
        if (type === "taxes") this.deleteTax(id);
        if (type === "paymentMode") this.deletePaymentMode(id);
      }
    });
  }

  initPaymentTermsForm(item?: any): void {
    this.paymentTermsForm = this.fb.group({
      paymentTermName: new UntypedFormControl(
        !this.isEditingPaymentTerms ? null : item?.paymentTermName,
        [Validators.required, Validators.minLength(3)]
      ),
      paymentTermDays: new UntypedFormControl(
        !this.isEditingPaymentTerms ? null : item?.paymentTermDays,
        [Validators.required]
      ),
      paymentTermDescription: new UntypedFormControl(
        !this.isEditingPaymentTerms ? null : item?.paymentTermDescription
      ),
      isactive: new UntypedFormControl(
        !this.isEditingPaymentTerms
          ? null
          : item?.isActive
          ? [this.activeStatus[0]]
          : [this.activeStatus[1]]
      ),
      isActive: new UntypedFormControl(item?.isActive, [Validators.required]),

      isdefault: new UntypedFormControl(
        !this.isEditingPaymentTerms
          ? null
          : item?.isDefault
          ? [this.defaultStatus[1]]
          : [this.defaultStatus[0]]
      ),
      isDefault: new UntypedFormControl(item?.isDefault, [Validators.required]),
    });

    if (this.isEditingPaymentTerms) {
      this.paymentTermsForm.addControl(
        "paymentTermId",
        new UntypedFormControl(item?.paymentTermId, Validators.required)
      );
    }

    this.paymentTermsForm
      .get("isactive")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.paymentTermsForm
          .get("isActive")
          .setValue(res[0].text === "Active" ? true : false);
      });

    this.paymentTermsForm
      .get("isdefault")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.paymentTermsForm
          .get("isDefault")
          .setValue(res[0].text === "Yes" ? true : false);
      });
  }

  savePaymentTermsForm() {
    this.paymentTermsForm.removeControl("isactive");
    this.paymentTermsForm.removeControl("isdefault");
    this.loader = true;
    const data = this.paymentTermsForm.value;

    this.sendPaymentTermsToService$(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loader = false;
          this.fetchPaymentTerms({
            pageNum: this.pagination.pageNumber,
            pageSize: this.pagination.pageSize,
          });
          this.closeModal();
          this.toast.fire({
            text: this.isEditingPaymentTerms
              ? "Payment term updated."
              : "Payment term created",
            type: "success",
          });
          this.isEditingPaymentTerms = false;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  openPaymentTermModal(modal: any, item?: any): void {
    if (item) {
      this.isEditingPaymentTerms = true;
    } else {
      this.isEditingPaymentTerms = false;
    }
    this.initPaymentTermsForm(item);

    this.openModal(modal);
  }

  deletePaymentTerms(id: any): void {
    this.financeService
      .deletePaymentTerm(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.toast.fire({
          text: "Payment term deleted.",
          type: "success",
        });
        this.fetchPaymentTerms({
          pageNum: this.pagination.pageNumber,
          pageSize: this.pagination.pageSize,
        });
      });
  }

  fetchTaxes(query: GetDataQueryParams): void {
    if (query?.keyword) {
      query.selectedSearchColumn = 'Name';
    }

    this.isLoading = true;
    this.financeService
      .getTaxes(query)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.allTaxes = res.body.items;
        this.setTaxesPagination(res.body);
        this.isLoading = false;
      });
  }

  setTaxesPagination(res: GetTaxesResBody): void {
    this.taxesPagination = res;
    this.taxesPagination.count = res.items.length;

    this.taxesPagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.taxesPagination.jumpArray.push(i);
    }
  }

  initTaxForm(tax?: Tax): void {
    let taxType: CustomDropDown[] = [];
    if (tax) {
      taxType = this.taxTypes.filter((taxType) => taxType.id === tax?.type);
    }
    this.taxForm = this.fb.group({
      name: new UntypedFormControl(null, [
        Validators.required,
        Validators.minLength(3),
      ]),
      value: new UntypedFormControl(0, [Validators.required]),
      accountId: new UntypedFormControl(0, [Validators.required]),
      taxType: new UntypedFormControl(taxType || null, [Validators.required]),
      type: new UntypedFormControl(null, [Validators.required]),
      description: new UntypedFormControl(null),
      isActive: new UntypedFormControl(false, [Validators.required]),
    });

    this.taxForm
      .get("taxType")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((taxType) => {
        this.taxForm.get("type").setValue(taxType[0]?.id);
      });
  }

  selectAccount(event: any): any {
    this.taxForm.get("accountId").patchValue(event?.accountId);
  }

  saveTaxForm() {
    this.taxForm.removeControl("taxType");
    this.loader = true;
    const data = this.taxForm.value;

    this.sendTaxToService$(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loader = false;
          this.fetchTaxes(this.fetchDataDto);
          this.closeModal();
          this.toast.fire({
            text: this.isEditingTax ? "Tax updated." : "Tax created",
            type: "success",
          });
          this.isEditingTax = false;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  openTaxesModal(modal: any, item?: any): void {
    this.selectedTax = item;
    this.initTaxForm(this.selectedTax);
    if (item) {
      this.taxForm.addControl(
        "id",
        new UntypedFormControl(item?.financeTaxId, [Validators.required])
      );
      this.taxForm.patchValue(item);
      this.isEditingTax = true;
    } else {
      this.isEditingTax = false;
    }
    this.openModal(modal);
  }

  makeDefault(paymentMode): void {
    this.initPaymentModeForm();
    this.paymentModeForm.patchValue({
      isDefault: true,
      name: paymentMode?.name,
      description: paymentMode?.description,
      isActive: paymentMode?.isActive,
    });
    this.paymentModeForm.addControl(
      "paymentModeId",
      new UntypedFormControl(paymentMode?.financePaymentModeId)
    );

    this.isEditingPaymentMode = true;
    this.savePaymentModeForm();
  }

  deleteTax(id: any): void {
    this.financeService
      .deleteTax(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.toast.fire({
          text: "Tax deleted.",
          type: "success",
        });
        this.fetchTaxes(this.fetchDataDto);
      });
  }
  // Payment Mode
  fetchPaymentModes(data): void {
    this.isLoading = true;

    const {keyword, ...payload} = data;
    if (keyword) {
      payload.paymentModeName = keyword;
    }
    this.financeService
      .getPaymentModes(payload)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.allPaymentModes = res.data.items;
        this.setPagination(res);
        this.isLoading = false;
      });
  }

  initPaymentModeForm(paymentMode?): void {
    let isActiveObj: any[] = [];
    if (paymentMode) {
      isActiveObj = this.activeStatus.filter(
        (status) => status?.id === paymentMode?.isActive
      );
    }
    this.paymentModeForm = this.fb.group({
      name: new UntypedFormControl(null, [
        Validators.required,
        Validators.minLength(3),
      ]),
      description: new UntypedFormControl(null),
      isActive: new UntypedFormControl(true, [Validators.required]),
      isActiveObj: new UntypedFormControl(isActiveObj || true, [Validators.required]),
      isDefault: new UntypedFormControl(false, [Validators.required]),
    });
    this.paymentModeForm
      .get("isActiveObj")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.paymentModeForm.get("isActive").setValue(res[0]?.id);
      });
  }

  savePaymentModeForm() {
    this.paymentModeForm.removeControl("isActiveObj");
    this.loader = true;
    const data = this.paymentModeForm.value;

    this.sendPaymentModeToService$(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loader = false;
          this.fetchPaymentModes(this.fetchDataDto);
          this.closeModal();
          this.toast.fire({
            text: this.isEditingPaymentMode
              ? "Payment Mode updated."
              : "Payment Mode created",
            type: "success",
          });
          this.isEditingPaymentMode = false;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  openPaymentModeModal(modal: any, item?: any): void {
    this.initPaymentModeForm(item);
    if (item) {
      this.paymentModeForm.addControl(
        "paymentModeId",
        new UntypedFormControl(item?.financePaymentModeId, [Validators.required])
      );
      this.paymentModeForm.patchValue(item);
      this.isEditingPaymentMode = true;
    } else {
      this.isEditingPaymentMode = false;
    }
    this.openModal(modal);
  }

  deletePaymentMode(id: any): void {
    this.financeService
      .deletePaymentMode(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.toast.fire({
          text: "Payment Mode deleted.",
          type: "success",
        });
        this.fetchPaymentModes(this.fetchDataDto);
      });
  }

  // Movement Entry Setup
  getMovementEntries(data = {module: ''}) {
    this.movementEntriesLoader = true;
    this.movementEntries = [];
    this.movementEntryService.getMovementEntries(data).subscribe(
      (response) => {
        this.originalEntries = response.body.data;
        this.movementEntries = response.body.data;
        this.movementEntriesLoader = false;
      },
      (error) => {
        this.movementEntriesLoader = false;
      }
    );
  }

  onOpenFilterModal(): void {
    $(".filter-menu").toggle();
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.getMovementEntries({ module: "" });
    });
  }

  onOptionSelected(option: { id: string; text: string }) {
    this.filterModel.setData({
      filters: [[option]],
      filterTypes: ["module"],
      filterHeaders: ["Module"],
    });
    this.getMovementEntries({ module: option.id });
  }

  getMovementEntryById(movementEntryId) {
    this.movementEntryLoader = true;
    this.movementEntry = null;
    this.movementEntryService.getMovementEntryById(movementEntryId).subscribe(
      (response) => {
        this.movementEntry = response.body.data;
        this.movementEntryLoader = false;
      },
      (error) => {
        this.movementEntryLoader = false;
      }
    );
  }
  selectMappingAccount(event, mapping): void {
    mapping.accountId = event.accountId;
  }
  openMovementEntryModal(movementEntryId, modal) {
    this.movementEntryLoader = true;
    this.modalService.open(modal, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "modalSubclassWidth",
      size: "lg",
    });

    this.movementEntry = null;
    this.movementEntryService.getMovementEntryById(movementEntryId).subscribe(
      (response) => {
        this.movementEntry = response.body.data;
        this.movementEntryLoader = false;
      },
      (error) => {
        this.movementEntryLoader = false;
      }
    );
  }

  setSlct2MappingAccount($event, mapping) {
    mapping.accountId = $event.id;
  }

  submitMovementEntryUpdate() {
    this.movementEntrySaveLoader = true;
    this.movementEntryService.updateMovementEntry(this.movementEntry).subscribe(
      (response) => {
        this.movementEntrySaveLoader = false;
        this.getMovementEntries();
        this.closeModal();
      },
      (error) => {
        this.movementEntrySaveLoader = false;
      }
    );
  }
  // End of Movement Entry Setup

  openModal(modal: any): void {
    this.modalService.open(modal, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  initUnitModal(event, template): void {
    this.unit = event;
    this.openModal(template);
  }

  closeModal(event?: string): void {
    this.modalService.dismissAll();
    this.openModalState = false;
    if (event === "reload") {
      this.fetchUnits = true;
    }

    if (event === "close") {
      this.unit = null;
    }
  }

  sendPaymentTermsToService$(data: any): Observable<any> {
    if (this.isEditingPaymentTerms) {
      return this.financeService.updatePaymentTerms(data);
    } else {
      return this.financeService.createPaymentTerms(data);
    }
  }
  sendTaxToService$(data: any): Observable<any> {
    if (this.isEditingTax) {
      return this.financeService.updateTax(data);
    } else {
      return this.financeService.createTax(data);
    }
  }
  sendPaymentModeToService$(data: any): Observable<any> {
    if (this.isEditingPaymentMode) {
      return this.financeService.updatePaymentMode(data);
    } else {
      return this.financeService.createPaymentMode(data);
    }
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.data.pageSize;
    this.pagination.pageNumber = res.data.pageNumber;
    this.pagination.totalCount = res.data.totalCount;
    this.pagination.hasNextPage = res.data.hasNextPage;
    this.pagination.hasPreviousPage = res.data.hasPreviousPage;
    this.pagination.totalPages = res.data.totalPages;
    this.pagination.count = res.data.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  loadFiscalYear(): void {
    this.financeService
      .getFiscalYearConfig()
      .pipe(takeUntil(this.unsubscriber$), pluck("body"))
      .subscribe((res) => {
        this.currentFiscalYear = `${res?.fiscalYearEndMonth}-${res?.fiscalYearEndDay}`;
      });
  }
  updateFiscalYear(): void {
    const data = {
      endDate: this.fiscalYear,
    };

    this.isSavingFiscalYear = true;
    this.financeService
      .updateFiscalYearConfig(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        () => {
          this.editFiscalYear = false;
          this.fiscalYear = null;
          this.isSavingFiscalYear = false;
          this.loadFiscalYear();
        },
        (err) => {
          this.isSavingFiscalYear = false;
        }
      );
  }
}
