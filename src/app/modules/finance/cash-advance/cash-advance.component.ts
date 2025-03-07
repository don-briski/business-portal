import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Filter } from "src/app/model/filter";
import { AuthService } from "src/app/service/auth.service";
import { CashAdvanceService } from "src/app/service/cash-advance.service";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { SharedService } from "src/app/service/shared.service";
import { UserService } from "src/app/service/user.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import Swal from "sweetalert2";

@Component({
  selector: "app-cash-advance",
  templateUrl: "./cash-advance.component.html",
  styleUrls: ["./cash-advance.component.scss"],
})
export class CashAdvanceComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();
  allCashAdvance: any[] = [];
  tabLoader: boolean;
  loggedInUser: any;
  employeeList: any[];
  ownerInformation: any;
  user: any;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    count: 0,
    totalCount: 0,
    maxPage: 0,
    filter: null,
    jumpArray: [],
  };
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  currentTheme: ColorThemeInterface;
  filterOptions = [
    { id: "all", text: "All" },
    { id: "PendingReview", text: "Pending Review" },
    { id: "Declined", text: "Declined" },
    { id: "AwaitingReconciliation", text: "Awaiting Reconciliation" },
    { id: "Reconciled", text: "Reconciled" },
    { id: "Redrafted", text: "Redrafted" },
  ];
  filterStatuses = [
    "All",
    "Pending Review",
    "Declined",
    "Awaiting Reconciliation",
    "Reconciled",
    "Redrafted",
  ];
  filterModel: Filter;
  openAside: boolean = false;
  cashAdvanceInformation: any;
  requestLoader: boolean;
  CashAdvanceApprovalForm: UntypedFormGroup;
  reconciliationLogForm: UntypedFormGroup;
  loader: boolean;
  logging: boolean;
  accounts: any[] = [];
  remainingBalance: number = 0;
  searchParam: string;
  isApproved = false;
  reconciliationLogFiles = [];
  reconciliationLogViewFiles = [];
  expenseAccount: { id: any; text: any }[] = [];
  currentview: number = 1;
  copy_hover = false;
  currencySymbol: string;

  constructor(
    private cashAdvanceService: CashAdvanceService,
    private colorThemeService: ColorThemeService,
    private modalService: NgbModal,
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private configurationService: ConfigurationService,
    private coaService: ChartOfAccountService,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.getConstants();

    // For deep linking via reports.
    this.getCashAdvanceIdFromQuery();

    this.loadAllCashAdvances(this.filterOptions[this.currentview]?.text);
    this.initApprovalForm();
    this._getAccounts();
    this.initReconciliationLogForm();
    this.getCurrencySymbol();
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configurationService.currencySymbol;
    if (!this.currencySymbol) {
      this.configurationService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  getCashAdvanceIdFromQuery() {
    const id = this.route.snapshot.queryParams["cashAdvanceId"];
    if (id) {
      this.viewCashAdvance(id);
    }
  }

  filterModalOpen(display?: boolean) {
    $(".filter-menu").toggle(display);
  }

  viewCashAdvance(id: any, refresh: boolean = true, element?:HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.tabLoader = true;

        if (refresh) this.cashAdvanceInformation = null;

        this.cashAdvanceService
          .getCashAdvanceById(id)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe((res) => {
            this.cashAdvanceInformation = res?.body?.data;

            this.calculateRemainingBalance();
            this.initApprovalForm();
            if (refresh) this.toggleAside();
            this.tabLoader = false;
          });
      }
    });
  }

  loadAllCashAdvances(filter?: string): void {
    let model: any = {
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
      keyword: !this.searchParam ? "" : this.searchParam,
    };
    if (filter && filter !== "All") {
      const option = this.filterOptions.filter(
        (option) => option.text === filter
      );
      model["filter"] = option[0].id;

      if (this.currentview == 0) {
        this.filterModel.setData({
          filters: [[option[0]]],
          filterTypes: ["status"],
          filterHeaders: ["Status"],
        });
      }
    } else {
      delete model.filter;
    }

    this.tabLoader = true;
    this.allCashAdvance = [];
    this.cashAdvanceService
      .spoolAllCashAdvances(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.tabLoader = false;
          this.allCashAdvance = res.body?.items;

          this._setPagination(res.body);
        },
        (err) => {
          this.tabLoader = false;
        }
      );
  }

  switchViews(filterType: number) {
    this.filterModel.clearData();
    this.currentview = filterType;
    this.pagination.filter = this.filterOptions[filterType]?.text;
    this.loadAllCashAdvances(this.pagination?.filter);
  }

  private _setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.maxPage = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.maxPage);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  clearFileHandler() {
    this.reconciliationLogFiles = [];
  }

  handleFileInput(filelist: FileList) {
    this.clearFileHandler();
    for (let i = 0; i < filelist.length; i++) {
      this.reconciliationLogFiles.push(filelist.item(i));
      this.reconciliationLogViewFiles = [
        ...this.reconciliationLogViewFiles,
        filelist.item(i),
      ];
    }
  }

  public removeFile(index: number): void {
    this.reconciliationLogViewFiles.splice(index, 1);
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  toggleAside() {
    this.openAside = !this.openAside;
  }

  calculateRemainingBalance(): void {
    let amountReconciled = 0;

    this.cashAdvanceInformation?.reconcialiations.forEach((item) => {
      amountReconciled += item?.amount;
    });

    this.remainingBalance =
      +this.cashAdvanceInformation?.amount - amountReconciled;
  }

  initApprovalForm(): void {
    this.CashAdvanceApprovalForm = this.fb.group({
      comment: new UntypedFormControl("", [Validators.required]),
      transactionPin: new UntypedFormControl("", [Validators.required]),
      userId: new UntypedFormControl(this.authService.decodeToken().nameid),
    });
  }

  submitApprovalForm(status: boolean, type: String): void {
    this.loader = true;
    const data = this.CashAdvanceApprovalForm.value;
    if (type === "Approved") {
      data.isApproved = status;
      data.isRedrafted = false;
      this.isApproved = true;
    } else if (type === "Redraft") {
      data.isRedrafted = status;
      data.isApproved = false;
      this.isApproved = false;
    }
    data.cashAdvanceId = this.cashAdvanceInformation?.id;

    this.cashAdvanceService
      .reviewCashAdvance(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            title: `Cash advance ${
              data?.isRedrafted
                ? "redrafted"
                : data?.isApproved
                ? "approved"
                : "rejected"
            }.`,
            type: "success",
          });
          this.viewCashAdvance(data?.cashAdvanceId, false);
          this.loadAllCashAdvances();
          if (data.isRedrafted) {
            this.toggleAside();
          }
          this.loader = false;
        },
        () => {
          this.loader = false;
          this.isApproved = false;
        }
      );
  }

  initReconciliationLogForm(): void {
    this.reconciliationLogForm = this.fb.group({
      cashAdvanceId: new UntypedFormControl(this.cashAdvanceInformation?.id, [
        Validators.required,
      ]),
      amount: new UntypedFormControl(0, [Validators.required, Validators.min(1)]),
      expenseAccountId: new UntypedFormControl(null, [Validators.required]),
      expenseAccount: new UntypedFormControl(null),
      description: new UntypedFormControl(null, [Validators.required]),
      transactionDate: new UntypedFormControl(null, [Validators.required]),
      logAnother: new UntypedFormControl(false),
    });

    this.reconciliationLogForm
      .get("expenseAccount")
      .valueChanges.subscribe((res) => {
        this.reconciliationLogForm.get("expenseAccountId").setValue(res[0]?.id);
      });
  }

  submitReconciliationLog(): void {
    this.logging = true;
    let model = this.reconciliationLogForm.value;
    if (this.reconciliationLogFiles.length > 0) {
      model.SupportingDocuments = this.reconciliationLogFiles;
    }

    const formData = toFormData(model, ["SupportingDocuments"]);
    this.cashAdvanceService
      .logReconciliationCashAdvance(formData)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          if (!model?.logAnother) {
            this.closeModal();
          } else {
            this.initReconciliationLogForm();
            this.reconciliationLogForm.get("logAnother").patchValue(true);
          }
          this.viewCashAdvance(this.cashAdvanceInformation?.id, false);
          this.logging = false;
          this.toast.fire({
            type: "success",
            text: "Reconciliation logged successfully.",
          });
        },
        () => {
          this.logging = false;
        }
      );
  }

  selectAccount(event: any): void {
    this.reconciliationLogForm
      .get("expenseAccountId")
      .patchValue(event?.accountId);
  }

  changePage(pageNum: number): void {
    this.pagination.pageNumber = pageNum;
    this.loadAllCashAdvances();
  }

  private fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res?.body;
      });
  }

  reconcileCashAdvance(): void {
    this.loader = true;

    this.cashAdvanceService
      .reconcileCashAdvance(this.cashAdvanceInformation?.id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.viewCashAdvance(this.cashAdvanceInformation?.id, false);
          this.loadAllCashAdvances();
          this.toast.fire({
            title: `Cash advance has been reconciled.`,
            type: "success",
          });
          this.loader = false;
        },
        () => {
          this.loader = false;
        }
      );
  }

  openModal(content: any): void {
    this.initReconciliationLogForm();
    this.modalService.open(content, { centered: true });
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  private fetchAllEmpoyee(id: any) {
    this.employeeList = [];
    const model = {
      UserId: id,
      Num: 1000,
    };
    this.userService.FetchAllUsers(model).subscribe((res) => {
      let allUsers: any[] = res.body.data?.items;
      this.employeeList = allUsers?.filter((x) => x.status === 0);
    });
  }
  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }
  private getConstants() {
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
      },
      (err) => {}
    );
  }
  private _getAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((accounts) => {
        this.accounts = accounts;
        this.expenseAccount = this.accounts
          .filter((x) => x?.groupAccount === "Expenses")
          .filter((c) => c.isPostingAccount)
          .map((account) => ({
            id: account?.accountId,
            text: account?.name,
          }));
      });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.switchViews(this.currentview);
    });
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Cash Advance code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
