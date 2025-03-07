import { Component, OnInit, ViewChild } from "@angular/core";
import swal, { SweetAlertType } from "sweetalert2";
import { AuthService } from "src/app/service/auth.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { PettyCashTransactionService } from "src/app/service/petty-cash-transaction.service";
import { Router } from "@angular/router";
import { UserService } from "src/app/service/user.service";
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  UntypedFormBuilder,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  PettyCashRecipient,
  PettyCashTransactionFetchModel,
  PettyCashTransactionStatus,
  PettyCashTransactionActivationOptions,
  ResultExpectedType,
} from "../models/petty-cash-transaction.model";
import { ActivatedRoute } from "@angular/router";
import { ParamMap } from "@angular/router";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";
import { SelectionModel } from "@angular/cdk/collections";
import { toFormData } from "src/app/util/finance/financeHelper";
import { SharedService } from "src/app/service/shared.service";
@Component({
  selector: "app-petty-cash-transaction",
  templateUrl: "./petty-cash-transaction.component.html",
  styleUrls: ["./petty-cash-transaction.component.scss"],
})
export class PettyCashTransactionComponent implements OnInit {
  allSubscritions = new Subject<void>();
  unsubscriber$ = new Subject();

  @ViewChild("viewTransactionModal") viewTransactionModal;

  public TransactionApprovalForm: UntypedFormGroup;

  pettyCashPaymentRecipientTypes: any[] = [
    PettyCashRecipient.Staff,
    PettyCashRecipient.Others,
  ];
  PettyCashPaymentRecipient_Staff = PettyCashRecipient.Staff;
  PettyCashPaymentRecipient_ThirdParty = PettyCashRecipient.Others;

  pettyCashTransactionActivationOptions: any[] = [
    PettyCashTransactionActivationOptions.Approve,
    PettyCashTransactionActivationOptions.ReDraft,
    PettyCashTransactionActivationOptions.Reject,
  ];
  PettyCashTransactionActivationOptions_Approve =
    PettyCashTransactionActivationOptions.Approve;
  PettyCashTransactionActivationOptions_ReDraft =
    PettyCashTransactionActivationOptions.ReDraft;
  PettyCashTransactionActivationOptions_Reject =
    PettyCashTransactionActivationOptions.Reject;

  PettyCashTransactionStatus_Posted = PettyCashTransactionStatus.Posted;
  PettyCashTransactionStatus_Reconciled = PettyCashTransactionStatus.Reconciled;
  PettyCashTransactionStatus_AwaitingReconciliation =
    PettyCashTransactionStatus.AwaitingReconciliation;
  PettyCashTransactionStatus_PartialReconciliation =
    PettyCashTransactionStatus.PartialReconciliation;
  PettyCashTransactionStatus_AwaitingReconciliationApproval =
    PettyCashTransactionStatus.AwaitingReconciliationApproval;
  PettyCashTransactionStatus_Draft = PettyCashTransactionStatus.Draft;
  PettyCashTransactionStatus_ReDraft = PettyCashTransactionStatus.ReDraft;
  PettyCashTransactionStatus_Rejected = PettyCashTransactionStatus.Rejected;
  PettyCashTransactionStatus_SentForApproval =
    PettyCashTransactionStatus.SentForApproval;

  ResultExpectedType_All = ResultExpectedType.All;
  ResultExpectedType_Closed = ResultExpectedType.Closed;
  ResultExpectedType_Open = ResultExpectedType.Open;

  staff: any[];
  transactions: any[];
  transactionFetchModel: PettyCashTransactionFetchModel = {
    pageNumber: 1,
    pageSize: 10,
    search: null,
    startDate: null,
    endDate: null,
    resultExpectedType: ResultExpectedType.Open,
  };
  transRawStartDate: string = null;
  transRawEndDate: string = null;
  transactionPagination: any = {
    pageNumber: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };
  transaction: any;
  transactionIdFromUrl: any;

  pettyCashTransaction: any;
  transactionActivities: any[] = [];
  transactionFiles: any[] = [];

  loader: boolean = false;
  loggedInUser: any = null;
  requestLoader: boolean = false;
  filesLoader: boolean = false;
  transactionsRequestLoader: boolean = false;
  currentuser: any;
  currentuserid: any;
  currentuserbranchid: any;
  currentview: string = ResultExpectedType.Open;

  currentTheme: ColorThemeInterface;
  openAside: boolean = false;

  toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  allAccounts: any[] = [];
  reconciliationLogForm: UntypedFormGroup;
  expenseAccount: any[] = [];
  logging: boolean;
  isEditingLog: boolean;

  reconciliationSelection = new SelectionModel<any>(true, []);
  logLoader: boolean;
  logApprovalForm: UntypedFormGroup;
  approving: boolean;

  reconciliationLogFiles: any[] = [];
  reconciliationLogFilePopup: any[];
  copy_hover = false;
  currencySymbol: string;

  constructor(
    private authService: AuthService,
    private pettyCashTransactionService: PettyCashTransactionService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private colorThemeService: ColorThemeService,
    private coaService: ChartOfAccountService,
    private fb: UntypedFormBuilder,
    private sharedService: SharedService,
    private readonly configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.loadTheme();
    this.loadAllAccounts();
    // this._getpaidThroughAccounts();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.transactionIdFromUrl = params.get("id");
      if (!this.isNullOrEmpty(this.transactionIdFromUrl)) {
        this.viewTransactionById(this.transactionIdFromUrl);
      }
    });
    this.initialize();
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configService.currencySymbol;
    if (!this.currencySymbol) {
      this.configService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  private loadAllAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.allAccounts = res;
        this.expenseAccount = this.allAccounts
          .filter((x) => x?.groupAccount === "Expenses")
          .filter((c) => c.isPostingAccount)
          .map((account) => ({
            id: account?.accountId,
            text: account?.name,
          }));
      });
  }

  initReconciliationForm(pettyCashId: any): void {
    this.reconciliationLogForm = this.fb.group({
      PettyCashId: new UntypedFormControl(pettyCashId, [Validators.required]),
      Amount: new UntypedFormControl("0", [Validators.required]),
      expenseAccount: new UntypedFormControl(null, [Validators.required]),
      ExpenseAccountId: new UntypedFormControl(null, [Validators.required]),
      Description: new UntypedFormControl(null, [Validators.required]),
      TransactionDate: new UntypedFormControl(null, [Validators.required]),
    });

    this.reconciliationLogFiles = [];

    this.reconciliationLogForm
      .get("expenseAccount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.reconciliationLogForm.get("ExpenseAccountId").setValue(res[0]?.id);
      });
  }

  submitReconciliation(): void {
    if (this.reconciliationLogForm.valid) {
      const value = this.reconciliationLogForm.value;
      value.files = this.reconciliationLogFiles;
      this.logging = true;
      delete value["expenseAccount"];
      const data = toFormData(value);
      this.pettyCashTransactionService
        .logReconciliation(data, this.isEditingLog)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.fetchPettyCashReconciliationLog(value?.PettyCashId);
            this.toast.fire({
              title: res?.body?.message,
              type: "success",
            });
            if (this.isEditingLog) {
              this.reconciliationLogForm.removeControl("logId");
              this.reconciliationLogForm.removeControl("staffAccountId");
            }
            this.logging = false;
            this.isEditingLog = false;
            this.closeModal();
          },
          () => {
            this.logging = false;
          }
        );
    }
  }

  newReconciliationLog(modal: any): void {
    this.isEditingLog = false;
    this.initReconciliationForm(
      this.pettyCashTransaction?.pettyCashTransactionId
    );
    this.openModal(modal, "md");
  }

  showReconciliationLogFile(files: any[], modal: any): void {
    this.reconciliationLogFilePopup = files;
    this.openModal(modal, "md");
  }

  editReconciliationLog(row: any, modal: any): void {
    this.isEditingLog = true;
    this.initReconciliationForm(
      this.pettyCashTransaction?.pettyCashTransactionId
    );
    this.reconciliationLogForm.addControl("logId", new UntypedFormControl(row?.id));
    // this.reconciliationLogForm.addControl('staffAccountId', new FormControl(row?.staffAccountId));
    row.expenseAccount = [
      this.expenseAccount.find((acc) => acc?.id === row?.expenseAccountId),
    ];
    row.transactionDate = this.formatDate(row?.transactionDate);
    this.reconciliationLogForm.patchValue({
      TransactionDate: row?.transactionDate,
      Amount: row?.amount,
      ExpenseAccountId: row?.staffAccountId,
      expenseAccount: row?.expenseAccount,
      Description: row?.description,
    });
    this.openModal(modal, "md");
  }

  clearReconciliationLogSelection(): void {
    this.reconciliationSelection = new SelectionModel<any>(true, []);
  }

  toggleReconciliationSelection(log: any): void {
    this.reconciliationSelection.toggle(log);
  }

  masterToggle(): void {
    this.isAllLogsSelected()
      ? this.reconciliationSelection.clear()
      : this.reconciliationSelection.select(
          ...this.pettyCashTransaction?.reconciliationLogs
            .filter((x) => x?.status?.toLowerCase() !== "approved")
            .filter((x) => x?.status?.toLowerCase() !== "rejected")
        );
  }

  isAllLogsSelected() {
    const selected = this.reconciliationSelection.selected;
    if (
      selected.length ===
      this.pettyCashTransaction?.reconciliationLogs?.filter((x) => x?.status?.toLowerCase() !== "approved")?.filter((x) => x?.status?.toLowerCase() !== "rejected")?.length
    )
      return true;
    return false;
  }

  isAllLogsIndeterminate(): boolean {
    const selected = this.reconciliationSelection.selected;
    if (selected.length === 0) return false;

    if (
      selected.length !== 0 &&
      selected.length !==
        this.pettyCashTransaction?.reconciliationLogs
          .filter((x) => x?.status?.toLowerCase() !== "approved")
          .filter((x) => x?.status?.toLowerCase() !== "rejected")?.length
    )
      return true;
  }

  initLogApprovalForm(
    approved: boolean,
    reject: boolean,
    redraft: boolean,
    modal: any
  ): void {
    this.logApprovalForm = this.fb.group({
      logIds: new UntypedFormControl(this.reconciliationSelection.selected, [
        Validators.required,
      ]),
      transactionPin: new UntypedFormControl(null, [Validators.required]),
      comment: new UntypedFormControl(null, [Validators.required]),
      isApproved: new UntypedFormControl(approved),
      isRedrafted: new UntypedFormControl(redraft),
      isRejected: new UntypedFormControl(reject),
    });

    this.openModal(modal, "md");
  }

  submitReconciliationApproval(): void {
    if (this.logApprovalForm.invalid) return;

    this.approving = true;
    const value = this.logApprovalForm.value;

    let request$;
    if (value?.logIds?.length === 1) {
      const model = {
        ...value,
        logId: value?.logIds[0]?.id,
        pettyCashTransactionId:
          this.pettyCashTransaction?.pettyCashTransactionId,
      };
      delete model?.logIds;
      request$ =
        this.pettyCashTransactionService.logReconciliationApprovalStatus(model);
    } else {
      const logIds = [];
      value?.logIds.forEach((logItem) => {
        logIds.push(logItem?.id);
      });
      const model = {
        ...value,
        pettyCashId: this.pettyCashTransaction?.pettyCashTransactionId,
      };
      delete model?.logIds;
      model["logIds"] = logIds;
      request$ =
        this.pettyCashTransactionService.logBulkReconciliationApprovalStatus(
          model
        );
    }

    request$.pipe(takeUntil(this.unsubscriber$)).subscribe(
      (res) => {
        this.toast.fire({
          title: res?.body?.message,
          type: "success",
        });
        this.reconciliationSelection.clear();
        this.fetchPettyCashReconciliationLog(
          this.pettyCashTransaction?.pettyCashTransactionId
        );
        this.closeModal();
        this.approving = false;
      },
      (err) => {
        this.approving = false;
        this.fetchPettyCashReconciliationLog(
          this.pettyCashTransaction?.pettyCashTransactionId
        );
        this.closeModal();
      }
    );
  }

  handleFileInput(filelist: FileList) {
    this.clearFileHandler();
    for (let i = 0; i < filelist.length; i++) {
      this.reconciliationLogFiles.push(filelist.item(i));
    }
  }

  clearFileHandler() {
    this.reconciliationLogFiles = [];
  }

  onRemoveFile(index: number): void {
    this.reconciliationLogFiles.splice(index, 1);
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.allSubscritions))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  initialize() {
    this.fetchUser();
    this.fetchTransactions(1);
    this.fetchStaff();
  }

  updateTransactionApprovalFormInit(pettyCashTransaction) {
    this.TransactionApprovalForm = new UntypedFormGroup({
      pettyCashTransactionId: new UntypedFormControl(
        pettyCashTransaction?.pettyCashTransactionId
      ),
      comment: new UntypedFormControl("", [Validators.required]),
      transactionPin: new UntypedFormControl("", [Validators.required]),
      userId: new UntypedFormControl(this.authService.decodeToken().nameid),
    });
  }

  submitApproval(activationOption: PettyCashTransactionActivationOptions) {
    this.loader = true;

    let model = this.TransactionApprovalForm.value;
    model.activationOption = activationOption;

    this.pettyCashTransactionService
      .updatePettyCashTransactionApprovalStatus(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          swal.fire({ type: "success", text: "", title: "Successful" });
          this.modalService.dismissAll();
          this.toggleAside();
          this.fetchTransactions();
          this.loader = false;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  fetchTransactions(pageNum = null) {
    this.transactionsRequestLoader = true;
    this.transactions = [];

    this.transactionFetchModel.startDate = this.formatDate(
      this.transRawStartDate
    );
    this.transactionFetchModel.endDate = this.formatDate(this.transRawEndDate);

    if (pageNum != null) {
      this.transactionPagination.pageNumber = pageNum;
      if (pageNum < 1) {
        this.transactionPagination.pageNumber = 1;
      }
      if (pageNum > this.transactionPagination.maxPage) {
        this.transactionPagination.pageNumber =
          this.transactionPagination.maxPage || 1;
      }
      this.transactionFetchModel.pageNumber =
        this.transactionPagination.pageNumber;
    }
    this.transactionFetchModel.pageSize = Number(
      this.transactionPagination.pageSize
    );

    this.pettyCashTransactionService
      .getPettyCashTransactions(this.transactionFetchModel)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.transactions = response.body.items;

          this.transactionPagination.maxPage = response.body.totalPages;
          this.transactionPagination.hasNextPage = response.body.hasNextPage;
          this.transactionPagination.hasPreviousPage =
            response.body.hasPreviousPage;
          this.transactionPagination.totalRecords = response.body.totalCount;
          this.transactionPagination.count = this.transactions.length;
          this.transactionPagination.jumpArray = Array(
            this.transactionPagination.maxPage
          );
          for (
            let i = 0;
            i < this.transactionPagination.jumpArray.length;
            i++
          ) {
            this.transactionPagination.jumpArray[i] = i + 1;
          }
          this.transactionsRequestLoader = false;

          // For deep linking via reports
          this.getPCTIdFromQuery();
        },
        (error) => {
          this.transactionsRequestLoader = false;
        }
      );
  }

  getAccountName(accountId: any): string {
    return this.allAccounts.find((acc) => acc?.accountId === accountId)?.name;
  }
  getAccountNumber(accountId: any): string {
    return this.allAccounts.find((acc) => acc?.accountId === accountId)
      ?.reference;
  }

  fetchStaff() {
    this.staff = [];
    this.pettyCashTransactionService
      .getStaff()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.staff = res.body.map((x) => {
            return { id: x.id, text: x.name };
          });
        },
        (err) => {}
      );
  }

  getPCTIdFromQuery() {
    const id = this.route.snapshot.queryParams["pctId"];
    if (id) {
      this.viewTransactionById(id);
    }
  }

  viewTransactionById(pettyCashTransactionId) {
    this.pettyCashTransaction = null;
    this.requestLoader = true;
    this.pettyCashTransactionService
      .getPettyCashTransactionById(pettyCashTransactionId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.pettyCashTransaction = res.body;
          this.viewTransaction(this.pettyCashTransaction);
          this.requestLoader = false;
        },
        (err) => {
          this.requestLoader = false;
        }
      );
  }

  viewTransactionByCode(content, pettyCashTransactionCode) {
    this.transaction = null;
    this.requestLoader = true;
    this.pettyCashTransactionService
      .getPettyCashTransactionByCode(pettyCashTransactionCode)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.transaction = res.body;
          this.updateTransactionApprovalFormInit(this.transaction);
          this.openModal(content);
          this.requestLoader = false;
        },
        (err) => {
          this.requestLoader = false;
        }
      );
  }

  viewTransaction(pettyCashTransaction, element?:HTMLElement) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.transactionActivities = [];
        this.pettyCashTransaction = pettyCashTransaction;
        this.initReconciliationForm(
          this.pettyCashTransaction?.pettyCashTransactionId
        );
        this.updateTransactionApprovalFormInit(pettyCashTransaction);
        this.viewTransactionHelper(
          pettyCashTransaction?.pettyCashTransactionId
        );
        setTimeout(() => {
          this.fetchPettyCashReconciliationLog(
            this.pettyCashTransaction?.pettyCashTransactionId
          );
        });
        this.toggleAside();
      }
    });
  }

  viewTransactionHelper(pettyCashTransactionId) {
    this.pettyCashTransactionService
      .getPettyCashTransactionById(pettyCashTransactionId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          let pettyCashTransaction = res.body;
          if (
            this.pettyCashTransaction?.pettyCashTransactionId ==
            pettyCashTransaction?.pettyCashTransactionId
          ) {
            this.pettyCashTransaction = pettyCashTransaction;
            this.fetchPettyCashTransactionActivities(
              pettyCashTransaction.pettyCashTransactionId
            );
          }
        },
        (err) => {}
      );
  }

  fetchPettyCashTransactionActivities(pettyCashTransactionId) {
    if (pettyCashTransactionId == null || pettyCashTransactionId == undefined)
      return;

    this.requestLoader = true;
    this.pettyCashTransactionService
      .getActivities(pettyCashTransactionId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.requestLoader = false;
          this.transactionActivities = res.body;
        },
        (err) => {
          this.requestLoader = false;
        }
      );
  }

  fetchPettyCashFiles(pettyCashTransactionId) {
    this.transactionFiles = [];
    if (pettyCashTransactionId == null || pettyCashTransactionId == undefined)
      return;

    this.filesLoader = true;
    this.pettyCashTransactionService
      .getAttachedFiles(pettyCashTransactionId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.filesLoader = false;
          this.transactionFiles = res.body;
        },
        (err) => {
          this.filesLoader = false;
        }
      );
  }
  fetchPettyCashReconciliationLog(pettyCashTransactionId: any): void {
    if (pettyCashTransactionId == null || pettyCashTransactionId == undefined)
      return;

    this.logLoader = true;
    this.reconciliationLogFilePopup = [];

    this.pettyCashTransactionService
      .getReconciliationLog(pettyCashTransactionId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.logLoader = false;
          this.pettyCashTransaction["reconciliationLogs"] = res.body;
          this.calculatePettyCashBalance();
          this.clearReconciliationLogSelection();
        },
        (err) => {
          this.logLoader = false;
        }
      );
  }

  calculatePettyCashBalance(): void {
    const allApprovedLogs =
      this.pettyCashTransaction?.reconciliationLogs.filter(
        (x) => x?.status === "Approved"
      );
    this.pettyCashTransaction["balance"] = this.pettyCashTransaction?.amount;
    allApprovedLogs.forEach((log) => {
      this.pettyCashTransaction.balance =
        this.pettyCashTransaction.balance - log?.amount;
    });
  }

  openLink(link) {
    window.open(link, "_blank");
  }

  toggleAside() {
    this.openAside = !this.openAside;
  }

  openModal(content, size = "lg") {
    this.modalService.open(content, {
      size: size,
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "loantypes-class",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  switchViews(expectedType: ResultExpectedType) {
    this.currentview = expectedType;
    this.transactionFetchModel.resultExpectedType = expectedType;
    this.fetchTransactions(1);
  }

  fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.currentuser = res.body;
      });
  }

  isNullOrEmpty(str: string) {
    return str == null || str.trim() == "";
  }

  formatDate(data) {
    if (data == null || data == undefined || data.trim == "") {
      return null;
    }
    try {
      const date = new Date(data.toString());
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const yyyy = date.getFullYear();

      const MM = m >= 10 ? m + "" : "0" + m;
      const dd = d >= 10 ? d + "" : "0" + d;
      return yyyy + "-" + MM + "-" + dd;
    } catch (error) {
      return null;
    }
  }

  separateWords(str: string) {
    if (this.isNullOrEmpty(str)) return str;

    let result = "";
    for (let i = 0; i < str.length; i++) {
      const element = str.charAt(i);

      if (i == str.length - 1 || i == 0 || element == " ") {
        result += element;
        continue;
      }

      if (element == element.toUpperCase()) {
        result += " " + element;
      } else {
        result += element;
      }
    }
    return result;
  }

  transactionsPaginatedJumpModal() {
    $(".transactionsPaginatedJumpModal").toggle();
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Petty Cash code copied to clipboard",type:'success',timer:3000})
    }
  }
}
