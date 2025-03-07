import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  TemplateRef,
  ViewChild,
  EventEmitter,
} from "@angular/core";
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
} from "@angular/forms";
import swal from "sweetalert2";
import { NgbModal, NgbModalConfig } from "@ng-bootstrap/ng-bootstrap";
import {
  Configuration,
  Integration,
  Loan,
  LoanDisbursementViaSeerbitDto,
  LoanDisbursementViaSeerbitRes,
  LoanItemForDisbursementViaSeerbit,
  SeerbitNameEnquiryData,
} from "../../../model/configuration";
import { ConfigurationService } from "../../../service/configuration.service";
import { LoanoperationsService } from "../../../service/loanoperations.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import ConfettiGenerator from "confetti-js";
import { SelectionModel } from "@angular/cdk/collections";
import { EncryptService } from "src/app/service/encrypt.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { take, takeUntil } from "rxjs/operators";
import { ExcelService } from "../../../service/excel.service";
import { Bank, Tab } from "../../shared/shared.types";
import { TabBarService } from "../../shared/components/tab-bar/tab-bar.service";
import { DisbursementBatch } from "src/app/model/disbursement-batch";
import { SharedService } from "src/app/service/shared.service";
import { DisbursementFailed } from "../loan.types";

const KUDA_SORT_CODE = "090267";

@Component({
  selector: "app-disbursements-page",
  templateUrl: "./disbursements-page.component.html",
  styleUrls: ["./disbursements-page.component.scss"],
})
export class DisbursementsPageComponent implements OnInit, OnDestroy {
  reopenAside = new EventEmitter<{}>();
  public AddBatchForm: UntypedFormGroup;
  public AddDisburseForm: UntypedFormGroup;
  public BulkDisburseForm: UntypedFormGroup;
  public AddDisbursementClaimForm: UntypedFormGroup;
  public AddBuyOverDisburseForm: UntypedFormGroup;

  currentuser: any;
  currentuserid: any;
  ownerInformation: any;

  currentuserbranchid: any;
  failedDisbursements: any[] = [];
  disbursementbatches: Configuration[] = [];
  opendisbursementbatches: Configuration[];
  closeddisbursementbatches: Configuration[];
  disbursementsclaimed: Configuration[];
  disbursements: Configuration[];
  buyoverloans: Configuration[];
  viewloandetails: boolean;
  viewbuyoverdetails = false;
  viewdisbursementdetails: boolean;
  loaninformation: any;
  batchinformation: any;
  buyoverinformation: any;
  selectedloanid: any;
  selectedBatchId: number;
  metricsdata: any;
  public loggedInUser: any;
  selectedMethod: any;
  feedbackdata: any;
  resultExpected = "Open";
  loanactivities: any;
  appOwnerRetrialCount: any;
  isDisbursementProcessInitialTrial = true;
  disbBatchForView: DisbursementBatch;

  getParams = {
    view: null,
  };

  pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  pagination2 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  pagination3 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  pagination4 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  pagination5 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  pagination6 = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  failedDisbPagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  currentview = 6;
  requestLoader: boolean;
  loader = false;
  dataTable: any;
  dataTable2: any;

  claimedloansfromfeedback = new Array();

  selectedDisbursementsForBatchArray = new Array();
  selectedLoansForDisbursementArray = new Array();
  selectedDisbursementsForClaimArray = new Array();
  selectedBuyOverLoansArrayForDisbursement = new Array();

  selection = new SelectionModel<Configuration>(true, []);
  disbSelection = new SelectionModel<any>(true, []);

  failedDisbursementSelection = new Set();

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  accounts: any[] = [];
  appOwner: any;
  tabs: Tab[] = [
    { id: "loans", text: "Loans" },
    { id: "disbursement-history", text: "Activities" },
  ];
  currentTabId = "loans";
  sameDateForLoanStart = false;
  pickedDateForLoanStart = "";
  kudaInfo: Integration;
  seerbitInfo: Integration;
  paystackBanks: Bank[] = [];
  kudaBanks: Bank[] = [];
  seerbitBanks: Bank[] = [];
  kudaBankSortCode: any;
  failedKudaDisbursements: any[] = [];
  failedSeerbitDisbursements: any[] = [];
  @ViewChild("failedKudaDisbModal")
  private failedKudaDisbModal: TemplateRef<any>;
  @ViewChild("failedSeerbitDisbModal")
  private failedSeerbitDisbModal: TemplateRef<any>;
  copy_hover = false;
  toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  codeType:string;
  bankList: any[] = [];
  selectedDisbursements:DisbursementFailed[];
  paystackInfo: Integration;

  constructor(
    private configurationService: ConfigurationService,
    private loanoperationService: LoanoperationsService,
    public authService: AuthService,
    private userService: UserService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    private tokenRefreshError: TokenRefreshErrorHandler,
    config: NgbModalConfig,
    public encrypt: EncryptService,
    private colorThemeService: ColorThemeService,
    private excelService: ExcelService,
    private tabBarService: TabBarService,
    private sharedService: SharedService
  ) {
    config.backdrop = "static";
    config.keyboard = false;
  }

  ngOnInit() {
    this._getAppOwnerDetails();
    this.fetchBankByPartner();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.tokenRefreshError.tokenNeedsRefresh.subscribe((res) => {
      if (!res) {
        // this.httpFailureError = true;
      }
    });
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.getUserPromise().then((next) => {
      // this.getUserInfo();
      this.getConstants();

      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
      this.AddBatchFormInit();
      this.AddDisburseFormInit();
      this.BulkDisburseFormInit();
      this.addDisbursementClaimFormInit();
      this.AddBuyOverDisburseFormInit();

      this.route.paramMap.subscribe((params: ParamMap) => {
        this.getParams.view = params.get("view");
      });

      if (this.getParams.view === "disbursementbasket") {
        this.currentview = 2;
      } else if (this.getParams.view === "disbursementbatches") {
        this.currentview = 6;
      }

      this.switchviews(this.currentview);
    });

    this.listenForTabSwitch();
    this.getAllIntegrations();
    this.getBanks();
  }

  listenForTabSwitch() {
    this.tabBarService.tabSwitched
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (tabSwitch) => {
          this.currentTabId = tabSwitch.tabId;
        },
      });
  }

  private _getAppOwnerDetails() {
    this.configurationService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.appOwner = res.body;
        const disbursementAccounts: any[] =
          res.body.financeDisbursementAccounts;
        this.accounts = disbursementAccounts.map((account) => ({
          id: account.accountId,
          text: `${account.reference} - ${account.name}`,
        }));
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
  selectAll() {
    const numSelected = this.selection.selected.length;
    const numRows = this.disbursements.length;
    this.disbursements.forEach((row) => this.selection.select(row));
    return numSelected === numRows;
  }
  clearSelection() {
    this.selectedDisbursementsForClaimArray.length = 0;
    this.selection.clear();
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.selectAll()
      ? this.clearSelection()
      : this.selection.selected.forEach((row) =>
          this.selectedDisbursementsForClaimArray.push({
            id: row.loanId,
            amount: row.loanAmount,
            code: row.applicationCode,
            name: row.customerName,
          })
        );
  }

  selectAllDisb() {
    const numSelected = this.disbSelection.selected.length;
    const numRows = this.batchinformation.loans.length;
    this.batchinformation.loans.forEach((row) =>
      this.disbSelection.select(row)
    );
    return numSelected === numRows;
  }
  clearDisbSelection() {
    this.selectedLoansForDisbursementArray = [];
    this.disbSelection.clear();
  }

  masterDisbToggle() {
    if (this.selectAllDisb()) {
      this.clearDisbSelection()
    } else {
      this.selectedLoansForDisbursementArray = [];
      this.disbSelection.selected.forEach((row) => {
        if (row.statusString === "DisburserClaimed") {
          this.selectedLoansForDisbursementArray.push({
            id: row.loanId,
            amount: row.loanAmount,
            code: row.applicationCode,
            name:
              this.getFromJson(row.bvnInfo, "bvnFirstName") +
              " " +
              this.getFromJson(row.bvnInfo, "bvnLastName"), //row.person.displayName,
            bankname: this.getFromJson(row.bankInfo, "bankName"),
            bankaccountnumber: this.getFromJson(
              row.bankInfo,
              "bankAccountNumber"
            ),
            banksortcode: this.getFromJson(row.bankInfo, "bankSortCode"),
            dateapproved: row.dateApproverApproved,
            fee: row.fees,
            disbursementamount: row?.amountDisbursed ?? row?.disbursedAmount,
            disbursementRemainder: row.disbursementRemainder,
            buyoveramount: row.buyOverAmount,
            status: row.loanStage,
            loanStartDate: row?.loanStartDate,
            loanType: this.getFromJson(row.loanTypeInfo, "loanTypeName"),
            branchId: row?.branchId,
            loanBatchId: row?.loanBatchId,
            stage:row?.loanCode ? 'loan' : 'loanApplication'
          });
        }
      });
    }
  }

  generateConfetti() {
    const confettiSettings = {
      target: "my-canvas",
      max: "200",
      size: "1",
      animate: true,
      props: [
        { type: "svg", src: "./assets/images/naira.svg", size: 20, weight: 1 },
      ],
      colors: [
        [165, 104, 246],
        [230, 61, 135],
        [0, 199, 228],
        [253, 214, 126],
      ],
      clock: "80",
      rotate: true,
      start_from_edge: true,
      respawn: false,
    };
    const confetti = new ConfettiGenerator(confettiSettings);
    confetti.render();
  }

  switchviews(view) {
    if (view === 1) {
      this.currentview = 1;
      this.getOpenDisbursementBatches();
      this.requestLoader = true;
    } else if (view === 2) {
      this.currentview = 2;
      this.getDisbursementsClaimed();
      this.requestLoader = true;
    } else if (view === 3) {
      this.currentview = 3;
      this.getDisbursementPool();
      this.requestLoader = true;
    } else if (view === 4) {
      this.currentview = 4;
      this.getClosedDisbursementBatches();
      this.requestLoader = true;
    } else if (view === 5) {
      this.currentview = 5;
      this.getBuyOverLoans();
      this.codeType = "Loan";
      this.requestLoader = true;
    } else if (view === 6) {
      this.currentview = 6;
      this.getDisbursementBatches();
      this.requestLoader = true;
      this.codeType = "Batch";
    } else if (view === 7) {
      this.currentview = 7;
      this.getFailedDisbursements();
      this.requestLoader = true;
      this.codeType = "Application";
    } else if (view === 8) {
      this.currentview = 8;
    }
  }

  navigateOut() {
    // tslint:disable-next-line:max-line-length
    swal
      .fire({
        type: "info",
        text: "This will take you to the disbursement pool tab to claim approved loans",
        title: "Add to Basket",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          this.switchviews(3);
        } else {
          //   this.router.navigate(['/pool/disbursementpool']);
        }
      });
  }

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  openModal2(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2 myModal",
    });
  }

  getConstants() {
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
      },
      (error) => {
        // swal.fire('Error', error.error, 'error');
      }
    );

    this.loanoperationService
      .spoolDisbursementMetrics(this.currentuserbranchid, this.currentuserid)
      .subscribe(
        (response) => {
          this.metricsdata = response.body;
        },
        (error) => {
          // swal.fire('Error', error.error, 'error');
        }
      );

    this.configurationService.spoolRetrialInfo().subscribe(
      (response) => {
        this.appOwnerRetrialCount = response.body;
      },
      (error) => {
        // swal.fire('Error', error.error, 'error');
      }
    );
  }

  addDisbursementClaimFormInit() {
    this.AddDisbursementClaimForm = new UntypedFormGroup({
      LoanIds: new UntypedFormControl(""),
      UserId: new UntypedFormControl(this.currentuserid),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
    });
  }

  AddBatchFormInit() {
    this.AddBatchForm = new UntypedFormGroup({
      LoanIds: new UntypedFormControl(""),
      UserId: new UntypedFormControl(this.currentuserid),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
    });
  }

  AddBuyOverDisburseFormInit() {
    this.AddBuyOverDisburseForm = new UntypedFormGroup({
      LoanIds: new UntypedFormControl(""),
      UserId: new UntypedFormControl(this.currentuserid),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
      DisburseOperationType: new UntypedFormControl(""),
    });
  }

  AddDisburseFormInit() {
    this.AddDisburseForm = new UntypedFormGroup({
      LoanIds: new UntypedFormControl(""),
      UserId: new UntypedFormControl(this.currentuserid),
      DisburseOperationType: new UntypedFormControl(""),
      LoanBatchId: new UntypedFormControl(""),
      DisburseAmount: new UntypedFormControl(""),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
      FeesCharged: new UntypedFormControl(""),
      BuyOverAmount: new UntypedFormControl(""),
      BranchId: new UntypedFormControl(""),
      financeAccountIdObj: new UntypedFormControl(""),
      financeAccountId: new UntypedFormControl(null),
    });

    this.AddDisburseForm.get("financeAccountIdObj")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res)
          this.AddDisburseForm.get("financeAccountId").setValue(res[0]?.id);
      });
  }

  BulkDisburseFormInit() {
    this.BulkDisburseForm = new UntypedFormGroup({
      LoanIds: new UntypedFormControl(""),
      transfers: new UntypedFormControl(""),
      UserId: new UntypedFormControl(this.currentuserid),
      DisburseOperationType: new UntypedFormControl(""),
      LoanBatchId: new UntypedFormControl(""),
      DisburseAmount: new UntypedFormControl(""),
      DisbursementRemainder: new UntypedFormControl(""),
      FeesCharged: new UntypedFormControl(""),
      BuyOverAmount: new UntypedFormControl(""),
      currency: new UntypedFormControl(""),
      source: new UntypedFormControl(""),
      Keys: new UntypedFormControl(""),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
      BranchId: new UntypedFormControl(""),
      IsRetry: new UntypedFormControl(false),
    });
  }

  closeModal() {
    this.clearSelection();
    this.clearDisbSelection();
    this.modalService.dismissAll();
  }

  getFailedDisbursements(
    pageNum = this.failedDisbPagination.pageNum,
    filter = null
  ) {
    this.failedDisbursements = [];
    this.requestLoader = true;
    this.resetFailedDisbursementSelection();

    // paginated section
    this.failedDisbPagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.failedDisbPagination.pageNum = 1;
    }
    if (pageNum > this.failedDisbPagination.maxPage) {
      this.failedDisbPagination.pageNum =
        this.failedDisbPagination.maxPage || 1;
    }

    const paginationmodel = {
      pageNum: this.failedDisbPagination.pageNum,
      pageSize: this.failedDisbPagination.pageSize,
      search: this.failedDisbPagination.searchTerm,
    };

    this.loanoperationService
      .spoolFailedDisbursements(paginationmodel)
      .subscribe(
        (response) => {
          this.failedDisbursements = response.body.data;
          this.failedDisbursements.forEach(item => {
            item['amountDisbursed'] = item?.loanAmount
          })

          this.failedDisbPagination.maxPage = response.body.pages;
          this.failedDisbPagination.totalRecords = response.body.totalRecords;
          this.failedDisbPagination.count = this.failedDisbursements.length;
          this.failedDisbPagination.jumpArray = Array(
            this.failedDisbPagination.maxPage
          );
          for (let i = 0; i < this.failedDisbPagination.jumpArray.length; i++) {
            this.failedDisbPagination.jumpArray[i] = i + 1;
          }

          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;

          // swal.fire('Error', error.error, 'error');
        }
      );
  }

  getDisbursementBatches(pageNum = this.pagination6.pageNum, filter = null) {
    this.requestLoader = true;

    // paginated section
    this.pagination6.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination6.pageNum = 1;
    }
    if (pageNum > this.pagination6.maxPage) {
      this.pagination6.pageNum = this.pagination6.maxPage || 1;
    }

    const paginationmodel = {
      BranchId: this.currentuserbranchid,
      UserId: this.currentuserid,
      pageNumber: this.pagination6.pageNum,
      pageSize: this.pagination6.pageSize,
      filter: this.pagination6.searchTerm,
      ResultExpected: "All",
    };

    this.loanoperationService
      .spoolDisbursementBatches(paginationmodel)
      .subscribe(
        (response) => {
          this.disbursementbatches = response.body?.value?.data?.map(
            (item: any) => ({ ...item, selected: false })
          );
          this.pagination6.maxPage = response.body.value.pages;
          this.pagination6.totalRecords = response.body.value.totalRecords;
          this.pagination6.count = this.disbursementbatches.length;
          this.pagination6.jumpArray = Array(this.pagination6.maxPage);
          for (let i = 0; i < this.pagination6.jumpArray.length; i++) {
            this.pagination6.jumpArray[i] = i + 1;
          }

          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;

          // swal.fire('Error', error.error, 'error');
        }
      );
  }

  getOpenDisbursementBatches(pageNum = this.pagination.pageNum, filter = null) {
    this.opendisbursementbatches = [];
    this.requestLoader = true;

    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    const paginationmodel = {
      BranchId: this.currentuserbranchid,
      UserId: this.currentuserid,
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      filter: this.pagination.searchTerm,
      ResultExpected: "Open",
    };

    this.loanoperationService
      .spoolDisbursementBatches(paginationmodel)
      .subscribe(
        (response) => {
          this.opendisbursementbatches = response.body.value.data;

          this.pagination.maxPage = response.body.value.pages;
          this.pagination.totalRecords = response.body.value.totalRecords;
          this.pagination.count = this.opendisbursementbatches.length;
          this.pagination.jumpArray = Array(this.pagination.maxPage);
          for (let i = 0; i < this.pagination.jumpArray.length; i++) {
            this.pagination.jumpArray[i] = i + 1;
          }

          this.chRef.detectChanges();

          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;

          // swal.fire('Error', error.error, 'error');
        }
      );
  }

  getClosedDisbursementBatches(
    pageNum = this.pagination4.pageNum,
    filter = null
  ) {
    this.closeddisbursementbatches = [];
    this.requestLoader = true;

    // paginated section
    this.pagination4.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination4.pageNum = 1;
    }
    if (pageNum > this.pagination4.maxPage) {
      this.pagination4.pageNum = this.pagination4.maxPage || 1;
    }

    const paginationmodel = {
      BranchId: this.currentuserbranchid,
      UserId: this.currentuserid,
      pageNumber: this.pagination4.pageNum,
      pageSize: this.pagination4.pageSize,
      filter: this.pagination4.searchTerm,
      ResultExpected: "Closed",
    };

    this.loanoperationService
      .spoolDisbursementBatches(paginationmodel)
      .subscribe(
        (response) => {
          this.closeddisbursementbatches = response.body.value.data;

          this.pagination4.maxPage = response.body.value.pages;
          this.pagination4.totalRecords = response.body.value.totalRecords;
          this.pagination4.count = this.closeddisbursementbatches.length;
          this.pagination4.jumpArray = Array(this.pagination4.maxPage);
          for (let i = 0; i < this.pagination4.jumpArray.length; i++) {
            this.pagination4.jumpArray[i] = i + 1;
          }

          this.chRef.detectChanges();

          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;

          // swal.fire('Error', error.error, 'error');
        }
      );
  }

  getDisbursementsClaimed(pageNum = this.pagination2.pageNum, filter = null) {
    this.disbursementsclaimed = [];
    this.requestLoader = true;

    // paginated section
    this.pagination2.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination2.pageNum = 1;
    }
    if (pageNum > this.pagination2.maxPage) {
      this.pagination2.pageNum = this.pagination2.maxPage || 1;
    }

    const paginationmodel = {
      BranchId: this.currentuserbranchid,
      UserId: this.currentuserid,
      pageNumber: this.pagination2.pageNum,
      pageSize: this.pagination2.pageSize,
      filter: this.pagination2.searchTerm,
    };

    this.loanoperationService
      .spoolClaimedLoansForDisbursementsbyuserid(paginationmodel)
      .subscribe(
        (response) => {
          this.disbursementsclaimed = response.body.value.data;

          this.pagination2.maxPage = response.body.value.pages;
          this.pagination2.totalRecords = response.body.value.totalRecords;
          this.pagination2.count = this.disbursementsclaimed.length;
          this.pagination2.jumpArray = Array(this.pagination2.maxPage);
          for (let i = 0; i < this.pagination2.jumpArray.length; i++) {
            this.pagination2.jumpArray[i] = i + 1;
          }

          this.chRef.detectChanges();

          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;

          // swal.fire('Error', error.error, 'error');
        }
      );
  }

  getDisbursementPool(pageNum = this.pagination3.pageNum, filter = null) {
    this.disbursements = [];
    this.requestLoader = true;

    // paginated section
    this.pagination3.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination3.pageNum = 1;
    }
    if (pageNum > this.pagination3.maxPage) {
      this.pagination3.pageNum = this.pagination3.maxPage || 1;
    }

    const paginationmodel = {
      UserId: this.currentuserid,
      BranchId: this.currentuserbranchid,
      pageNumber: this.pagination3.pageNum,
      pageSize: this.pagination3.pageSize,
      filter: this.pagination3.searchTerm,
    };

    this.loanoperationService.spoolDisbursementPool(paginationmodel).subscribe(
      (response) => {
        this.disbursements = response.body.value.data;

        this.pagination3.maxPage = response.body.value.pages;
        this.pagination3.totalRecords = response.body.value.totalRecords;
        this.pagination3.count = this.disbursements.length;
        this.pagination3.jumpArray = Array(this.pagination3.maxPage);
        for (let i = 0; i < this.pagination3.jumpArray.length; i++) {
          this.pagination3.jumpArray[i] = i + 1;
        }

        this.chRef.detectChanges();

        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = true;

        // swal.fire('Error', error.error, 'error');
      }
    );
  }

  getBuyOverLoans(pageNum = this.pagination5.pageNum, filter = null) {
    this.buyoverloans = [];
    this.requestLoader = true;

    // paginated section
    this.pagination5.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination5.pageNum = 1;
    }
    if (pageNum > this.pagination5.maxPage) {
      this.pagination5.pageNum = this.pagination5.maxPage || 1;
    }

    const paginationmodel = {
      BranchId: this.currentuserbranchid,
      UserId: this.currentuserid,
      pageNumber: this.pagination5.pageNum,
      pageSize: this.pagination5.pageSize,
      filter: this.pagination5.searchTerm,
      ResultExpected: this.resultExpected,
    };

    this.loanoperationService.spoolBuyOverLoans(paginationmodel).subscribe(
      (response) => {
        this.buyoverloans = response.body.value.data;

        this.pagination5.maxPage = response.body.value.pages;
        this.pagination5.totalRecords = response.body.value.totalRecords;
        this.pagination5.count = this.buyoverloans.length;
        this.pagination5.jumpArray = Array(this.pagination5.maxPage);
        for (let i = 0; i < this.pagination5.jumpArray.length; i++) {
          this.pagination5.jumpArray[i] = i + 1;
        }

        this.chRef.detectChanges();
        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = false;

        // swal.fire('Error', error.error, 'error');
      }
    );
  }

  isSelected(collection, id) {
    return collection.find((app) => app.id === id);
  }

  // tslint:disable-next-line:max-line-length
  selectMultipleClaim(
    type,
    index,
    id,
    code,
    amount,
    name,
    bankname,
    bankaccountnumber,
    banksortcode,
    dateapproved,
    fee,
    disbursementamount,
    buyoveramount,
    status,
    loanStartDate,
    loanType,
    loanBatchId,
    branchId,
    loanCode?
  ) {
    if (type === "batchcreation") {
      const found = this.selectedDisbursementsForBatchArray.some(
        (item) => item.id === id
      );

      // tslint:disable-next-line:max-line-length
      if (found) {
        this.selectedDisbursementsForBatchArray.splice(
          this.selectedDisbursementsForBatchArray.indexOf(index),
          1
        );
      } else {
        this.selectedDisbursementsForBatchArray.push({
          id,
          code,
          amount,
          name,
        });
      }
    } else if (type === "batchdisbursement") {
      // const found = this.selectedLoansForDisbursementArray.some(item => item.id === id);

      const element = document.getElementById(
        `disbCheckbox-${index}`
      ) as HTMLInputElement;
      if (element.checked) {
        this.selectedLoansForDisbursementArray.push({
          id,
          code,
          amount,
          name,
          bankname,
          bankaccountnumber,
          banksortcode,
          dateapproved,
          fee,
          disbursementamount,
          buyoveramount,
          status,
          loanStartDate,
          loanType,
          loanBatchId,
          branchId,
          stage:loanCode ? 'loan' : 'loanApplication'
        });

      } else {
        this.selectedLoansForDisbursementArray =
          this.selectedLoansForDisbursementArray.filter(
            (disb) => disb.id !== id
          );
      }

      // tslint:disable-next-line:max-line-length
      // if (found) {   this.selectedLoansForDisbursementArray.splice(this.selectedLoansForDisbursementArray.indexOf(index), 1); } else { this.selectedLoansForDisbursementArray.push({id, code, amount, name, bankname, bankaccountnumber, banksortcode, dateapproved, fee, disbursementamount, buyoveramount}); }
    } else if (type === "disbursements") {
      // const found = this.selectedDisbursementsForClaimArray.some(item => item.id === id);

      const element = document.getElementById(
        `checkbox-${index}`
      ) as HTMLInputElement;
      if (element.checked) {
        this.selectedDisbursementsForClaimArray.push({
          id,
          code,
          amount,
          name,
        });
      } else {
        this.selectedDisbursementsForClaimArray.splice(
          this.selectedDisbursementsForClaimArray.indexOf(index),
          1
        );
      }

      // tslint:disable-next-line:max-line-length
      // if (found) {   this.selectedDisbursementsForClaimArray.splice(this.selectedDisbursementsForClaimArray.indexOf(index), 1); } else { this.selectedDisbursementsForClaimArray.push({id, code, amount, name, buyoveramount}); }
    } else if (type === "buyover") {
      const found = this.selectedBuyOverLoansArrayForDisbursement.some(
        (item) => item.id === id
      );

      // tslint:disable-next-line:max-line-length
      if (found) {
        this.selectedBuyOverLoansArrayForDisbursement =
          this.selectedBuyOverLoansArrayForDisbursement.filter(
            (loan) => loan.id !== id
          );
      } else {
        this.selectedBuyOverLoansArrayForDisbursement.push({
          id,
          code,
          amount,
          name,
        });
      }
    }
  }

  // selectAll(inputArray){
  //   //alert(inputArray);
  //   $(".dt-module__list .dt-module__list-item input[type=checkbox]").prop("checked", $(this).prop("checked"));
  // }

  // tslint:disable-next-line:max-line-length
  selectClaim(
    content,
    type,
    index,
    id,
    code,
    amount,
    name,
    bankname,
    bankaccountnumber,
    banksortcode,
    dateapproved,
    fee,
    disbursementamount,
    buyoveramount,
    status,
    loanStartDate
  ) {
    if (type === "batchcreation") {
      const found = this.selectedDisbursementsForBatchArray.some(
        (item) => item.id === id
      );

      // tslint:disable-next-line:max-line-length
      if (found) {
        this.selectedDisbursementsForBatchArray.splice(
          this.selectedDisbursementsForBatchArray.indexOf(index),
          1
        );
      } else {
        this.selectedDisbursementsForBatchArray.push({
          id,
          code,
          amount,
          name,
        });
      }

      this.modalService.open(content, {
        centered: true,
        ariaLabelledBy: "modal-basic-title",
        windowClass: "custom-modal-style opq2",
      });
    } else if (type === "batchdisbursement") {
      this.selectedLoansForDisbursementArray = [];

      const found = this.selectedLoansForDisbursementArray.some(
        (item) => item.id === id
      );

      // tslint:disable-next-line:max-line-length
      if (found) {
        this.selectedLoansForDisbursementArray.splice(
          this.selectedLoansForDisbursementArray.indexOf(index),
          1
        );
      } else {
        this.selectedLoansForDisbursementArray.push({
          id,
          code,
          amount,
          name,
          bankname,
          bankaccountnumber,
          banksortcode,
          dateapproved,
          fee,
          disbursementamount,
          buyoveramount,
          status,
          loanStartDate,
        });
      }

      this.modalService.open(content, {
        centered: true,
        ariaLabelledBy: "modal-basic-title",
        windowClass: "custom-modal-style opq2",
      });
    } else if (type === "disbursements") {
      this.selectedDisbursementsForClaimArray = [];

      const found = this.selectedDisbursementsForClaimArray.some(
        (item) => item.id === id
      );

      // tslint:disable-next-line:max-line-length
      if (found) {
        this.selectedDisbursementsForClaimArray.splice(
          this.selectedDisbursementsForClaimArray.indexOf(index),
          1
        );
      } else {
        this.selectedDisbursementsForClaimArray.push({
          id,
          code,
          amount,
          name,
          loanStartDate,
        });
      }

      this.modalService.open(content, {
        centered: true,
        ariaLabelledBy: "modal-basic-title",
      });
    }
  }

  downloadTransactionDetails() {
    const options = {
      headers: [
        "Branch",
        "DateApproved",
        "ApplicationID",
        "Applicant",
        "Product",
        "BankName",
        "AccountNumber",
        "Amount",
        "LoanStartDate",
        "Fee",
        "Disbursement Amount",
      ],
    };

    const data = [];
    let total = 0;
    this.selectedLoansForDisbursementArray.forEach((row) => {
      data.push({
        Branch: this.currentuser.branchName,
        DateApproved: row.dateapproved,
        ApplicationID: row.code,
        Applicant: row.name,
        Product: row.loanType,
        BankName: row.bankname,
        AccountNumber: row.bankaccountnumber,
        Amount: row.amount,
        loanStartDate: row?.loanStartDate,
        Fee: row.fee,
        "Disbursement Amount": row.disbursementamount,
      });
      total += row.disbursementamount;
    });

    data.push({
      DateApproved: "",
      Branch: "",
      ApplicationID: "",
      Applicant: "",
      BankName: "",
      AccountNumber: "",
      Amount: "",
      LoanStartDate: "",
      Fee: "Total",
      "Disbursement Amount": total,
    });

    const excelData = {
      title: "Loans to be disbursed",
      headers: options.headers,
      data,
    };

    this.excelService.exportExcel(excelData);

    // return new AngularCsv(data, "Loans to Disbursed", options);
  }

  openDocument(content) {
    this.modalService.open(content, {
      size: "lg",
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2",
    });
  }

  LoanDetails(type, information) {
    if (!this.copy_hover) {
      this.closeModal();
      this.BulkDisburseForm.reset();
      this.AddDisburseForm.reset();
      this.AddBatchForm.reset();
      this.AddDisbursementClaimForm.reset();

      this.loanactivities = [];
      if (type === "disbursementview") {
        this.batchinformation = information;
        this.viewloandetails = false;
        this.viewdisbursementdetails = true;
        this.viewbuyoverdetails = false;
        this.selectedBatchId = information.loanBatchId;
        this.disbBatchForView = null;
      } else if (type === "buyoverdetailsview") {
        this.buyoverinformation = information;
        this.viewloandetails = false;
        this.viewdisbursementdetails = false;
        this.viewbuyoverdetails = true;
        this.disbBatchForView = null;
      } else if (type === "ViewDisbursementBatch") {
        this.disbBatchForView = information;
        this.disbBatchForView.createdBy = information?.user?.person?.displayName;
        this.disbBatchForView.dateCreated = information?.createdAt;
        this.disbBatchForView.batchCode = information?.loanBatchCode;
        this.disbBatchForView.disbursementBatchId = information?.loanBatchId;
        this.viewloandetails = false;
        this.viewdisbursementdetails = false;
        this.viewbuyoverdetails = false;
      } else {
        this.loaninformation = information;
        this.viewloandetails = true;
        this.viewdisbursementdetails = false;
        this.viewbuyoverdetails = false;
        this.disbBatchForView = null;
        //  this.selectedloanid = information.loanId;
      }

      this.ResetCheckboxes();
    }
  }

  onViewDisbBatch(disb: DisbursementBatch) {
    this.LoanDetails("ViewDisbursementBatch", disb);
  }

  submitLoanRequest(type, loanid, loancode) {
    if (type === "LoanActivities") {
      this.requestLoader = true;

      this.loanoperationService.getActivities(type, loanid).subscribe(
        (res) => {
          this.requestLoader = false;
          this.loanactivities = res.body;
        },
        (err) => {
          this.requestLoader = false;
          // swal.fire('Error', err.error, 'error');
        }
      );
    }
  }

  ResetCheckboxes() {
    const element: HTMLElement = document.querySelectorAll(
      '.table-responsive td input[type="checkbox"]'
    )[0] as HTMLElement;
    if (element != null) {
      element.click();
    }

    this.selectedDisbursementsForBatchArray = [];
    this.selectedLoansForDisbursementArray = [];
    this.selectedDisbursementsForClaimArray = [];
    this.selectedBuyOverLoansArrayForDisbursement = [];
  }

  submitBatchForm(val: any, content) {
    if (this.AddBatchForm.valid) {
      this.loader = true;

      // tslint:disable-next-line:variable-name
      const entry_lines = [];
      this.selectedDisbursementsForBatchArray.forEach((line, index) => {
        entry_lines.push({
          LoanId: line.id,
          LoanCode: line.code,
          UserId: this.currentuserid,
        });
      });

      if (entry_lines.length === 0) {
        this.AddBatchForm.reset();
        this.modalService.dismissAll();
        this.loader = false;
        swal.fire({
          type: "info",
          title: "Empty Batch List",
          text: "Please select applications to batch and try again",
        });
      } else {
        this.AddBatchForm.controls["LoanIds"].patchValue(
          JSON.stringify(entry_lines)
        );
        this.AddBatchForm.controls["UserId"].patchValue(this.currentuserid);

        this.loanoperationService
          .createBatch(this.AddBatchForm.value)
          .subscribe(
            (res) => {
              // tslint:disable-next-line:max-line-length
              swal
                .fire({
                  type: "success",
                  text: res.body.value.feedbackmessage,
                  title: "Successful",
                  showCancelButton: true,
                  cancelButtonColor: "#B85353",
                  cancelButtonText: "Create another",
                  confirmButtonText: "View Batches",
                  confirmButtonColor: "#558E90",
                })
                .then((result) => {
                  if (result.value) {
                    this.AddBatchForm.reset();
                    this.loader = false;
                    this.selectedDisbursementsForBatchArray = [];
                    this.modalService.dismissAll();
                    this.switchviews(1);
                    this.getConstants();
                  } else {
                    this.AddBatchForm.reset();
                    this.loader = false;
                    this.selectedDisbursementsForBatchArray = [];
                    this.modalService.dismissAll();
                    this.switchviews(2);
                    this.getConstants();
                  }
                });
            },
            (err) => {
              this.loader = false;

              // swal.fire('Error', err.error, 'error');
            }
          );
      }
    }
  }

  submitBuyOverForm(val: any, content) {
    if (this.AddBuyOverDisburseForm.valid) {
      this.loader = true;

      // tslint:disable-next-line:variable-name
      const entry_lines = [];
      this.selectedBuyOverLoansArrayForDisbursement.forEach((line, index) => {
        entry_lines.push({
          LoanId: line.id,
          LoanCode: line.code,
          UserId: this.currentuserid,
        });
      });

      if (entry_lines.length === 0) {
        this.AddBuyOverDisburseForm.reset();
        this.modalService.dismissAll();
        this.loader = false;
        swal.fire({
          type: "info",
          title: "Empty List",
          text: "Please select buy-over applications and try again",
        });
      } else {
        this.AddBuyOverDisburseForm.controls["LoanIds"].patchValue(
          JSON.stringify(entry_lines)
        );
        this.AddBuyOverDisburseForm.controls["UserId"].patchValue(
          this.currentuserid
        );
        this.AddBuyOverDisburseForm.controls[
          "DisburseOperationType"
        ].patchValue("Manual");

        this.loanoperationService
          .disburseBuyOver(this.AddBuyOverDisburseForm.value)
          .subscribe(
            (res) => {
              // tslint:disable-next-line:max-line-length
              swal
                .fire({
                  type: "success",
                  text: res.body,
                  title: "Successful",
                  showCancelButton: true,
                  cancelButtonColor: "#B85353",
                  cancelButtonText: "Create another",
                  confirmButtonText: "View Batches",
                  confirmButtonColor: "#558E90",
                })
                .then((result) => {
                  this.AddBuyOverDisburseForm.reset();
                  this.loader = false;
                  this.selectedBuyOverLoansArrayForDisbursement = [];
                  this.modalService.dismissAll();
                  this.switchviews(5);
                  this.getConstants();
                });
            },
            (err) => {
              this.loader = false;
              // swal.fire('Error', err.error, 'error');
            }
          );
      }
    }
  }

  statusMethod(response) {
    this.selectedMethod = response;
  }

  fetchBankByPartner(){
    this.loader = true;
    this.configurationService.spoolBanksByPartner()
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe(
      (res) => {
        const allBanks = res.body;
        this.kudaBanks = allBanks.filter(bank => bank?.partner === "Kuda");
        this.loader = false;
      },
      (err) => {
        this.loader = false;
      }
    );
  }

  fetchBanks() {
    this.loader = true;
    this.configurationService.spoolBanks()
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe(
      (res) => {
        this.loader = false;
        this.bankList = res?.body;
      },
      (err) => {
        this.loader = false;
      }
    );
  }

  submitQueryRequest(
    partner: number,
    process: number,
    content: TemplateRef<any>,
    message: string
  ) {
    this.failedKudaDisbursements = [];
    let source: string;
    if (partner === 1) {
      source = "Paystack";
    } else if (partner === 2) {
      source = "Kuda";
    } else if (partner === 3) {
      source = "Seerbit";
    }
    this.selectedMethod = source;

    swal
      .fire({
        type: "info",
        text: message + " via " + source,
        title: "External Request",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
        allowEscapeKey: false,
        allowOutsideClick: false,
      })
      .then((result) => {
        if (result.value) {
          this.requestLoader = true;

          if (partner === 1 && process === 1) {
            // tslint:disable-next-line:max-line-length
            this.modalService.open(content, {
              size: "lg",
              centered: true,
              ariaLabelledBy: "modal-basic-title",
              windowClass: "custom-modal-style opq2",
            });

            this.feedbackdata = [];
            // tslint:disable-next-line:variable-name
            const entry_lines = [];
            // tslint:disable-next-line:variable-name
            const sub_entry_lines = [];

            this.selectedLoansForDisbursementArray.forEach((line, index) => {
              const metadata = {
                loanid: line.id,
              };

              sub_entry_lines.push({ Loancode: line.code });
              // tslint:disable-next-line:max-line-length
              entry_lines.push({
                name: line.name,
                metadata: JSON.stringify(metadata),
                account_number: line.bankaccountnumber,
                bank_name: line.bankname,
                amount: line.amount,
                bank_code: line.banksortcode,
                LoanId: line.id,
                LoanCode: line.code,
                fee: line.fee,
                disbursementamount: line.disbursementamount,
                UserId: this.currentuserid,
                buyoveramount: line.buyoveramount,
              });
            });

            if (entry_lines.length === 0) {
              // tslint:disable-next-line:max-line-length
              swal.fire({
                type: "info",
                title: "Empty Disbursement List",
                text: "Please select loan applications to disburse and try again",
              });
            } else {
              const datamodel = {
                LoanIds: JSON.stringify(entry_lines),
                Partner: source,
              };

              this.loanoperationService.createRecipients(datamodel).subscribe(
                (res) => {
                  this.requestLoader = false;
                  this.feedbackdata = res.body;
                },
                (err) => {
                  this.requestLoader = false;
                  this.modalService.dismissAll();
                  this.selectedLoansForDisbursementArray = [];

                  // swal.fire('Error', err.error, 'error');
                }
              );
            }
          } else if (partner === 1 && process === 2) {
            if (this.BulkDisburseForm.valid) {
              this.loader = true;

              const entry_lines = [];
              this.feedbackdata.forEach((line, index) => {
                entry_lines.push({
                  LoanId: line.loanId,
                  LoanStartDate: line?.loanStartDate,
                });
              });

              const transfer_entry_lines = [];
              this.feedbackdata.forEach((line, index) => {
                transfer_entry_lines.push({
                  recipient: line.receipientCode,
                  amount: line.disbursementAmount * 100,
                  reference: this.randomNumber("reflenda", 10000, 9999999999),
                });
              });

              const push_lines = [];
              push_lines.push({
                currrency: `${this.ownerInformation?.currency?.currencySymbol}`,
                source: "balance",
                transfers: transfer_entry_lines,
              });

              if (entry_lines.length === 0) {
                this.loader = false;
                this.requestLoader = false;
                swal.fire({
                  type: "info",
                  title: "Empty Disbursement List",
                  text: "Please select loan applications to disburse and try again",
                });
              } else {
                this.BulkDisburseForm.controls["LoanIds"].patchValue(
                  JSON.stringify(entry_lines)
                );
                this.BulkDisburseForm.controls["currency"].patchValue(
                  `${this.ownerInformation?.currency?.currencySymbol}`
                );
                this.BulkDisburseForm.controls["source"].patchValue("balance");
                this.BulkDisburseForm.controls["Keys"].patchValue(
                  transfer_entry_lines
                );
                this.BulkDisburseForm.controls["transfers"].patchValue(
                  JSON.stringify(transfer_entry_lines)
                );
                this.BulkDisburseForm.controls["UserId"].patchValue(
                  this.currentuserid
                );
                this.BulkDisburseForm.controls["LoanBatchId"].patchValue(
                  this.selectedBatchId
                );
                this.BulkDisburseForm.controls["BranchId"].patchValue(
                  this.currentuserbranchid
                );
                this.BulkDisburseForm.controls["DisburseAmount"].patchValue(
                  this.getTotalSection(
                    "disbursementamount",
                    this.feedbackdata,
                    ""
                  )
                );
                this.BulkDisburseForm.controls[
                  "DisbursementRemainder"
                ].patchValue(
                  this.getTotalSection(
                    "disbursementremainder",
                    this.feedbackdata,
                    ""
                  )
                );
                this.BulkDisburseForm.controls["FeesCharged"].patchValue(
                  this.getTotalSection("fees", this.feedbackdata, "")
                );
                this.BulkDisburseForm.controls["BuyOverAmount"].patchValue(
                  this.getTotalSection("buyOverAmount", this.feedbackdata, "")
                );
                this.BulkDisburseForm.controls[
                  "DisburseOperationType"
                ].patchValue("Paystack");

                this.BulkDisburseForm.controls["IsRetry"].patchValue(
                  !this.isDisbursementProcessInitialTrial
                );

                this.loanoperationService
                  .createLoanDisbursement(this.BulkDisburseForm.value)
                  .subscribe(
                    (res) => {
                      this.modalService.dismissAll();

                      swal
                        .fire({
                          type: "success",
                          text: res.body.value.feedbackmessage,
                          title: "Successful",
                          confirmButtonColor: "#558E90",
                        })
                        .then((result) => {
                          this.BulkDisburseForm.reset();
                          this.loader = false;
                          this.requestLoader = false;
                          this.feedbackdata = [];
                          this.selectedLoansForDisbursementArray = [];
                          this.modalService.dismissAll();
                          if (this.isDisbursementProcessInitialTrial == true) {
                            this.switchviews(6);
                            this.closeAside();
                          } else {
                            // remove search term if exists
                            this.failedDisbPagination.searchTerm = "";
                            this.switchviews(7);
                            this.isDisbursementProcessInitialTrial = true;
                            this.BulkDisburseForm.controls[
                              "IsRetry"
                            ].patchValue(false);
                          }

                          //    this.generateConfetti();
                        });
                    },
                    (err) => {
                      this.loader = false;
                      this.requestLoader = false;

                      this.closeAside();
                      this.switchviews(6);
                    }
                  );
              }
            }
          } else if (partner === 2 && process === 1) {
            this.feedbackdata = [];
            const loansKudaCannotDibs = [];

            this.selectedLoansForDisbursementArray.forEach((item) => {
              const data = {
                loanCode: item?.code,
                customer: item.name,
                bank: item.bankname,
                accountNumber: item.bankaccountnumber,
                amount: item.amount,
                disbursementAmount: item?.disbursementamount,
                disbursementRemainder: item.disbursementRemainder,
                code: item.banksortcode,
                loanId: item?.id,
                bankCode: item.banksortcode,
                disburseOperationType: source,
                feeCharged: item?.fee,
                disburseAmount: item.disbursementamount,
                branchId: item.branchId,
                loanBatchId: item.loanBatchId,
                userId: this.currentuserid,
                buyOverAmount: item.buyoveramount,
                financeAccountId: this.kudaInfo?.financeAccountId,
                loanStartDate: item?.loanStartDate,
                appOwnerKey: this.appOwner?.appOwnerKey,
                isRetry: !this.isDisbursementProcessInitialTrial,
                reference: "",
              };

              const kudaCanDisburseBank = this.kudaBanks.some(
                (bank) =>
                  bank?.bankName.toLowerCase() === data?.bank.toLowerCase()
              );
              if (kudaCanDisburseBank) {
                this.feedbackdata.push(data);
              } else {
                loansKudaCannotDibs.push(data?.loanCode);
              }
              this.requestLoader = false;
            });

            if (loansKudaCannotDibs.length > 0) {
              swal.fire({
                type: "info",
                title: "Kuda Bank does not support some loans.",
                text: `Kuda bank does not support disbursement to the bank(s) of ${
                  loansKudaCannotDibs.length
                } out of ${
                  this.feedbackdata?.length + loansKudaCannotDibs?.length
                } selected loan applications. These loan applications have been removed from the disbursement list. You may disburse them using another channel/method.`,
              });
            }

            if (this.feedbackdata.length === 0) {
              swal.fire({
                type: "info",
                title: "Empty Disbursement List",
                text: "Please select loan applications to disburse and try again",
              });
            } else {
              swal.fire({
                type: "info",
                text: message + " via " + source,
                title: "Processing Request",
                allowEscapeKey: false,
                allowOutsideClick: false,
              });
              swal.showLoading();

              this.loader = true;
              const name_enquiry_Lines = [];

              this.feedbackdata.forEach((line) => {
                name_enquiry_Lines.push({
                  requestCode: line?.loanCode,
                  requestRef: this.randomNumber("reflenda", 10000, 9999999999),
                  data: {
                    beneficiaryAccountNumber: line?.accountNumber,
                    beneficiaryBankCode: this.kudaBanks.find(
                      (x) =>
                        x.bankName.toLowerCase() === line?.bank.toLowerCase()
                    )?.sortCode,
                  },
                });
              });

              const loansWithEmptySessionId = [];
              // Name Enquiry from Kuda
              this.loanoperationService
                .kudaNameEnquiry(name_enquiry_Lines)
                .pipe()
                .subscribe(
                  (res) => {
                    const responses = res?.body;

                    responses?.forEach((resp, index) => {
                      if (resp.status) {
                        const dataIndex = this.feedbackdata.findIndex(
                          (c) => c?.loanCode === resp?.requestCode
                        );

                        this.feedbackdata[dataIndex]["nameEnquirySessionID"] =
                          resp?.sessionID;
                        this.feedbackdata[dataIndex].reference =
                          name_enquiry_Lines[index]?.requestRef;
                        this.feedbackdata[dataIndex].bankCode =
                          resp?.beneficiaryBankCode;
                        this.feedbackdata[dataIndex]["beneficiaryName"] =
                          resp?.beneficiaryName;
                        this.feedbackdata[dataIndex]["bankName"] =
                          this.feedbackdata[dataIndex]?.bank;
                        this.feedbackdata[dataIndex]["isDestinationBankKuda"] =
                          KUDA_SORT_CODE ===
                          this.kudaBanks.find(
                            (x) =>
                              x.bankName.toLowerCase() ===
                              this.feedbackdata[dataIndex]?.bank.toLowerCase()
                          )?.sortCode
                            ? true
                            : false;
                      } else {
                        loansWithEmptySessionId.push(resp?.requestCode);
                      }
                      this.loader = false;
                    });
                  },
                  (err) => {
                    this.loader = false;
                    this.requestLoader = false;
                    swal.hideLoading();
                    swal.close();
                  },
                  () => {
                    swal.hideLoading();
                    swal.close();
                    if (loansWithEmptySessionId?.length > 0) {
                      loansWithEmptySessionId.forEach((loanCode) => {
                        const index = this.feedbackdata.findIndex(
                          (c) => c?.loanCode === loanCode
                        );
                        this.feedbackdata.splice(index, 1);
                      });

                      if (
                        this.feedbackdata?.length > 0 &&
                        loansWithEmptySessionId?.length > 0
                      ) {
                        swal.fire({
                          type: "info",
                          title: "Response from Kuda",
                          text: `We could not process the session ID for the bank account of the following loan application(s): ${loansWithEmptySessionId.join(
                            ", "
                          )}. Please try again.`,
                        });
                      }
                    }
                    if (this.feedbackdata.length > 0) {
                      this.modalService.open(content, {
                        size: "lg",
                        centered: true,
                        ariaLabelledBy: "modal-basic-title",
                        windowClass: "custom-modal-style opq2",
                      });
                    } else {
                      swal.fire({
                        type: "error",
                        title: "Response from Kuda",
                        text: `We could not process the session ID for the bank account of all selected loan applications. Please try again.`,
                      });
                    }
                  }
                );
            }
          } else if (partner === 2 && process === 2) {
            this.loader = true;

            const transactionPin =
              this.BulkDisburseForm.value["TransactionPin"];
            this.feedbackdata.forEach((loan, index) => {
              this.feedbackdata[index].disbursementAmount =
                this.feedbackdata[index]?.disbursementAmount * 100;
            });

            this.loanoperationService
              .disburseLoanWithKuda(this.feedbackdata, transactionPin)
              .pipe(takeUntil(this.unsubscriber$))
              .subscribe(
                (res) => {
                  const result = res?.body?.data;
                  const disbursed = [];
                  const failed = [];
                  result.forEach((item) => {
                    const loanCode = this.feedbackdata.find(
                      (x) => x.loanCode === item?.loanCode
                    )?.loanCode;
                    if (item?.status) {
                      disbursed.push(loanCode);
                    } else {
                      failed.push(loanCode);
                      const failedDisb = this.feedbackdata.find(
                        (line) => line?.loanCode === loanCode
                      );
                      failedDisb["errorMessage"] = item?.message;
                      this.failedKudaDisbursements.push(failedDisb);
                    }
                  });
                  let popupMessage = "";
                  if (disbursed?.length > 0) {
                    popupMessage = `${disbursed.length} ${
                      disbursed?.length === 1 ? "loan" : "loans"
                    } sent for disbursement.`;
                  }

                  if (failed?.length > 0) {
                    popupMessage = `${popupMessage} ${failed.join(", ")} ${
                      failed?.length === 1 ? "was" : "were"
                    } not disbursed.`;
                  }

                  this.modalService.dismissAll();
                  swal
                    .fire({
                      type:
                        disbursed?.length > 0 && failed?.length === 0
                          ? "success"
                          : failed?.length > 0 && disbursed?.length === 0
                          ? "error"
                          : "info",
                      text: popupMessage,
                      title:
                        disbursed?.length > 0 && failed?.length === 0
                          ? "Successful"
                          : failed?.length > 0 && disbursed?.length === 0
                          ? "Error"
                          : "Some disbursements failed.",
                      showCancelButton: failed?.length > 0 ? true : false,
                      cancelButtonColor: "#2A6AB8",
                      cancelButtonText: "View Failed Applications",
                      confirmButtonText: "Ok",
                      confirmButtonColor: "#558E90",
                    })
                    .then((result) => {
                      if (!result.value) {
                        this.modalService.open(this.failedKudaDisbModal, {
                          centered: true,
                          size: "lg",
                          ariaLabelledBy: "modal-basic-title",
                        });
                      } else {
                        this.BulkDisburseForm.reset();
                        this.loader = false;
                        this.requestLoader = false;
                        this.feedbackdata = [];
                        this.selectedLoansForDisbursementArray = [];
                        this.modalService.dismissAll();
                        if (this.isDisbursementProcessInitialTrial == true) {
                          this.switchviews(6);
                          this.closeAside();
                        } else {
                          // remove search term if exists
                          this.failedDisbPagination.searchTerm = "";
                          this.switchviews(7);
                          this.isDisbursementProcessInitialTrial = true;
                          this.BulkDisburseForm.controls["IsRetry"].patchValue(
                            false
                          );
                        }
                      }
                    });
                },
                (err) => {
                  this.loader = false;
                  this.requestLoader = false;

                  this.closeAside();
                  this.switchviews(6);
                }
              );
          } else if (partner === 3 && process === 1) {
            this.feedbackdata = [];
            const loansSeerbitCannotDibs = [];

            this.selectedLoansForDisbursementArray.forEach((item) => {
              const data = {
                loanCode: item?.code,
                customer: item.name,
                bank: item.bankname,
                accountNumber: item.bankaccountnumber,
                amount: item.amount,
                disbursementAmount: item?.disbursementamount,
                disbursementRemainder: item.disbursementRemainder,
                code: item.banksortcode,
                loanId: item?.id,
                bankCode: item.banksortcode,
                disburseOperationType: source,
                feeCharged: item?.fee,
                disburseAmount: item.disbursementamount,
                branchId: item.branchId,
                loanBatchId: item.loanBatchId,
                loanStartDate: item?.loanStartDate,
                buyOverAmount: item.buyoveramount,
                userId: this.currentuserid,
                financeAccountId: this.kudaInfo?.financeAccountId,
                appOwnerKey: this.appOwner?.appOwnerKey,
                isRetry: !this.isDisbursementProcessInitialTrial,
                reference: this.randomNumber("reflenda", 10000, 9999999999),
              };

              const seerbitCanDisburseBank = this.seerbitBanks.some(
                (bank) =>
                  bank?.bankName.toLowerCase() === data?.bank.toLowerCase()
              );
              if (seerbitCanDisburseBank) {
                this.feedbackdata.push(data);
              } else {
                loansSeerbitCannotDibs.push(data?.loanCode);
              }
              this.requestLoader = false;
            });
            if (loansSeerbitCannotDibs.length > 0) {
              swal.fire({
                type: "info",
                title: "Seerbit does not support some loans.",
                text: `Seerbit does not support disbursement to the bank(s) of ${
                  loansSeerbitCannotDibs.length
                } out of ${
                  this.feedbackdata?.length + loansSeerbitCannotDibs?.length
                } selected loan applications. These loan applications have been removed from the disbursement list. You may disburse them using another channel/method.`,
              });
            }

            if (this.feedbackdata.length === 0) {
              swal.fire({
                type: "info",
                title: "Empty Disbursement List",
                text: "Please select loan applications to disburse and try again",
              });
            } else {
              swal.fire({
                type: "info",
                text: message + " via " + source,
                title: "Processing Request",
                allowEscapeKey: false,
                allowOutsideClick: false,
              });

              this.loader = true;
              swal.showLoading();
              const nameEnquiryList: SeerbitNameEnquiryData[] = [];

              this.feedbackdata.forEach((data) => {
                nameEnquiryList.push({
                  accountNumber: data?.accountNumber,
                  bankCode: this.seerbitBanks.find(
                    (x) => x.bankName.toLowerCase() === data?.bank.toLowerCase()
                  )?.sortCode,
                  entityCode: data?.loanCode,
                });
              });

              const loansThatFailedNameEnquiry: string[] = [];
              this.loanoperationService
                .enquireNameViaSeerbit(nameEnquiryList)
                .pipe()
                .subscribe({
                  next: (res) => {
                    res?.body?.data?.forEach((item) => {
                      if (!item.isSuccessful) {
                        loansThatFailedNameEnquiry.push(item.entityCode);
                      }
                    });
                  },
                  complete: () => {
                    this.loader = false;
                    this.requestLoader = false;
                    swal.hideLoading();
                    swal.close();
                    if (loansThatFailedNameEnquiry?.length > 0) {
                      loansThatFailedNameEnquiry.forEach((loanCode) => {
                        const index = this.feedbackdata.findIndex(
                          (c) => c?.loanId === loanCode
                        );
                        this.feedbackdata.splice(index, 1);
                      });

                      if (loansThatFailedNameEnquiry?.length > 0) {
                        swal.fire({
                          type: "info",
                          title: "Response from Seerbit",
                          text: `We could not verify the bank account of the following loan application(s): ${loansThatFailedNameEnquiry.join(
                            ", "
                          )}. Please try again.`,
                        });
                      }
                    }

                    if (this.feedbackdata.length > 0) {
                      this.modalService.open(content, {
                        size: "lg",
                        centered: true,
                        ariaLabelledBy: "modal-basic-title",
                        windowClass: "custom-modal-style opq2",
                      });
                    } else {
                      swal.fire({
                        type: "error",
                        title: "Response from Seerbit",
                        text: `We could not verify the bank account all selected loan applications. Please try again.`,
                      });
                    }
                  },
                });
            }
          } else if (partner === 3 && process === 2) {
            this.loader = true;

            const transactionPin =
              this.BulkDisburseForm.value["TransactionPin"];

            const loanData = this.feedbackdata[0];
            const loanDisbursementViaSeerbitDto: LoanDisbursementViaSeerbitDto =
              {
                appOwnerKey: loanData.appOwnerKey,
                branchId: loanData.branchId,
                financeAccountId: loanData.financeAccountId,
                loanBatchId: loanData.loanBatchId || 0,
                userId: loanData.userId,
                disbursedLines: "",
                loans: [],
              };

            this.feedbackdata?.forEach((data) => {
              const item: LoanItemForDisbursementViaSeerbit = {
                accountNumber: data.accountNumber,
                amount: data.amount,
                applicationCode: data.loanCode,
                bankCode: this.seerbitBanks.find(
                  (x) => x.bankName.toLowerCase() === data?.bank.toLowerCase()
                )?.sortCode,
                buyOverAmount: data.buyOverAmount,
                feesCharged: data.feeCharged,
                disbursementRemainder: data.disbursementRemainder,
                reference: data.reference,
              };

              loanDisbursementViaSeerbitDto.loans.push(item);
            });

            this.loanoperationService
              .disburseLoanViaSeerbit(
                loanDisbursementViaSeerbitDto,
                transactionPin
              )
              .pipe(takeUntil(this.unsubscriber$))
              .subscribe({
                next: (res) => {
                  const disbursed: string[] = [];
                  const failed: string[] = [];

                  res?.body?.forEach((item) => {
                    const disbursement = this.feedbackdata.find(
                      (x) => x.loanCode === item?.entityCode
                    );
                    if (item?.status) {
                      disbursed.push(disbursement.loanCode);
                    } else {
                      failed.push(disbursement.loanCode);
                      const failedDisb = disbursement;
                      failedDisb["errorMessage"] = item?.message;
                      this.failedSeerbitDisbursements.push(failedDisb);
                    }
                  });
                  let popupMessage = "";
                  if (disbursed?.length > 0) {
                    popupMessage = `${popupMessage} ${disbursed.join(", ")} ${
                      disbursed?.length === 1 ? "was" : "were"
                    } disbursed.`;
                  }

                  if (failed?.length > 0) {
                    popupMessage = `${popupMessage} ${failed.join(", ")} ${
                      failed?.length === 1 ? "was" : "were"
                    } not disbursed.`;
                  }

                  this.modalService.dismissAll();
                  swal
                    .fire({
                      type:
                        disbursed?.length > 0 && failed?.length === 0
                          ? "success"
                          : failed?.length > 0 && disbursed?.length === 0
                          ? "error"
                          : "info",
                      text: popupMessage,
                      title:
                        disbursed?.length > 0 && failed?.length === 0
                          ? "Successful"
                          : failed?.length > 0 && disbursed?.length === 0
                          ? "Error"
                          : "Some disbursements failed.",
                      showCancelButton: failed?.length > 0 ? true : false,
                      cancelButtonColor: "#2A6AB8",
                      cancelButtonText: "View Failed Applications",
                      confirmButtonText: "Ok",
                      confirmButtonColor: "#558E90",
                    })
                    .then((result) => {
                      if (!result.value) {
                        this.modalService.open(this.failedSeerbitDisbModal, {
                          centered: true,
                          size: "lg",
                          ariaLabelledBy: "modal-basic-title",
                        });
                      } else {
                        this.BulkDisburseForm.reset();
                        this.loader = false;
                        this.requestLoader = false;
                        this.feedbackdata = [];
                        this.selectedLoansForDisbursementArray = [];
                        this.modalService.dismissAll();
                        if (this.isDisbursementProcessInitialTrial == true) {
                          this.switchviews(6);
                          this.closeAside();
                        } else {
                          // remove search term if exists
                          this.failedDisbPagination.searchTerm = "";
                          this.switchviews(7);
                          this.isDisbursementProcessInitialTrial = true;
                          this.BulkDisburseForm.controls["IsRetry"].patchValue(
                            false
                          );
                        }
                      }
                    });
                },
                error: (err) => {
                  this.loader = false;
                  this.requestLoader = false;
                  const failed: string[] = [];
                  const data: LoanDisbursementViaSeerbitRes = err?.error;

                  data?.forEach((item) => {
                    const loanCode = this.feedbackdata.find(
                      (x) => x.loanCode === item?.entityCode
                    )?.loanCode;

                    failed.push(loanCode);
                    const failedDisb = this.feedbackdata.find(
                      (line) => line?.loanCode === loanCode
                    );

                    failedDisb["errorMessage"] = item?.message;
                    this.failedSeerbitDisbursements.push(failedDisb);
                  });

                  let popupMessage = "";
                  if (failed?.length > 0) {
                    popupMessage = `${popupMessage} ${failed.join(", ")} ${
                      failed?.length === 1 ? "was" : "were"
                    } not disbursed.`;
                  }

                  this.modalService.dismissAll();
                  swal
                    .fire({
                      type: "error",
                      text: popupMessage,
                      title: "Error",
                      confirmButtonText: "View Failed Applications",
                      confirmButtonColor: "#558E90",
                    })
                    .then((result) => {
                      if (result.value) {
                        this.modalService.open(this.failedSeerbitDisbModal, {
                          centered: true,
                          size: "lg",
                          ariaLabelledBy: "modal-basic-title",
                        });
                      } else {
                        this.BulkDisburseForm.reset();
                        this.loader = false;
                        this.requestLoader = false;
                        this.feedbackdata = [];
                        this.selectedLoansForDisbursementArray = [];
                        this.modalService.dismissAll();
                        if (this.isDisbursementProcessInitialTrial == true) {
                          this.switchviews(6);
                          this.closeAside();
                        } else {
                          // remove search term if exists
                          this.failedDisbPagination.searchTerm = "";
                          this.switchviews(7);
                          this.isDisbursementProcessInitialTrial = true;
                          this.BulkDisburseForm.controls["IsRetry"].patchValue(
                            false
                          );
                        }
                      }
                    });
                },
              });
          }
        }
      });
  }

  closeFailedDisbursementsModal(): void {
    this.modalService.dismissAll();
    this.BulkDisburseForm.reset();
    this.loader = false;
    this.requestLoader = false;
    this.feedbackdata = [];
    this.selectedLoansForDisbursementArray = [];
    this.modalService.dismissAll();
    if (this.isDisbursementProcessInitialTrial == true) {
      this.switchviews(6);
      this.closeAside();
    } else {
      // remove search term if exists
      this.failedDisbPagination.searchTerm = "";
      this.switchviews(7);
      this.isDisbursementProcessInitialTrial = true;
      this.BulkDisburseForm.controls[
       "IsRetry"
      ].patchValue(false);
    }
  }

  submitDisbursementClaimForm(val: any, content) {
    if (this.AddDisbursementClaimForm.valid) {
      this.loader = true;

      const entry_lines = [];
      this.selectedDisbursementsForClaimArray.forEach((line, index) => {
        entry_lines.push({
          LoanId: line.id,
          LoanCode: line.code,
          UserId: this.currentuserid,
        });
      });

      if (entry_lines.length === 0) {
        swal.fire({
          type: "info",
          title: "Empty Claim List",
          text: "Please select applications to claim and try again",
        });
        this.loader = false;
      } else {
        this.AddDisbursementClaimForm.controls["LoanIds"].patchValue(
          JSON.stringify(entry_lines)
        );
        this.AddDisbursementClaimForm.controls["UserId"].patchValue(
          this.currentuserid
        );

        this.loanoperationService
          .createBatch(this.AddDisbursementClaimForm.value)
          .subscribe(
            (res) => {
              swal
                .fire({
                  type: "success",
                  text: res.body.value.feedbackmessage,
                  title: "Successful",
                  showCancelButton: true,
                  cancelButtonColor: "#B85353",
                  cancelButtonText: "Claim another",
                  confirmButtonText: "View Batches",
                  confirmButtonColor: "#558E90",
                })
                .then((result) => {
                  if (result.value) {
                    this.claimedloansfromfeedback = [];
                    this.modalService.dismissAll();
                    this.router.navigate([
                      "/loan/disbursements/disbursementbatches",
                    ]);
                    this.switchviews(1);
                  } else {
                    this.AddDisbursementClaimForm.reset();
                    this.loader = false;
                    this.selectedDisbursementsForClaimArray = [];
                    this.getConstants();
                    this.switchviews(3);

                    this.modalService.dismissAll();
                  }
                });
            },
            (err) => {
              this.loader = false;

              // swal.fire('Error', err.error, 'error');
            }
          );
      }
    }
  }

  submitDisburseForm(val: any, content) {
    if (this.AddDisburseForm.valid) {
      // this.modalService.dismissAll();

      // swal.fire({ type: 'info', text:  'Are you sure you want to activate selected loans ' , title: 'Activate Loan', showCancelButton: true,  cancelButtonColor: '#558E90',  cancelButtonText: 'Proceed', confirmButtonText: 'Abort', confirmButtonColor: '#B85353'})
      // .then((result) => {

      //         if(result.value){
      //             //escape
      //         }else{

      this.loader = true;

      const entry_lines = [];
      this.selectedLoansForDisbursementArray.forEach((line, index) => {
        entry_lines.push({
          LoanId: line.id,
          LoanCode: line.code,
          Amount: line.amount,
          Fee: line.fee,
          DisbursementAmount: line.disbursementamount,
          UserId: this.currentuserid,
          loanStartDate: line?.loanStartDate,
        });
      });

      if (entry_lines.length === 0) {
        swal.fire({
          type: "info",
          title: "Empty Disbursement List",
          text: "Please select loan applications to disburse and try again",
        });
      } else {
        this.AddDisburseForm.controls["LoanIds"].patchValue(
          JSON.stringify(entry_lines)
        );
        this.AddDisburseForm.controls["UserId"].patchValue(this.currentuserid);
        this.AddDisburseForm.controls["DisburseOperationType"].patchValue(
          this.selectedMethod
        );
        this.AddDisburseForm.controls["LoanBatchId"].patchValue(
          this.selectedBatchId
        );
        this.AddDisburseForm.controls["BranchId"].patchValue(
          this.currentuserbranchid
        );
        this.AddDisburseForm.controls["DisburseAmount"].patchValue(
          this.getTotalSection(
            "disbursementamountinner",
            this.selectedLoansForDisbursementArray,
            ""
          )
        );
        this.AddDisburseForm.controls["FeesCharged"].patchValue(
          this.getTotalSection(
            "fees",
            this.selectedLoansForDisbursementArray,
            ""
          )
        );
        this.AddDisburseForm.controls["BuyOverAmount"].patchValue(
          this.getTotalSection(
            "buyoveramount",
            this.selectedLoansForDisbursementArray,
            ""
          )
        );

        this.loanoperationService
          .createLoanDisbursement(this.AddDisburseForm.value)
          .subscribe(
            (res) => {
              this.modalService.dismissAll();

              swal
                .fire({
                  type: "success",
                  text: res.body.value.feedbackmessage,
                  title: "Successful",
                  confirmButtonColor: "#558E90",
                })
                .then((result) => {
                  //   if(result.value){
                  this.AddDisburseForm.reset();
                  this.loader = false;
                  this.selectedLoansForDisbursementArray = [];
                  this.closeAside();
                  this.switchviews(6);

                  // }else{

                  //   this.AddDisburseForm.reset();
                  //   this.loader = false;
                  //   this.selectedLoansForDisbursementArray = [];
                  //  // this.switchviews(1);

                  //  }
                });
            },
            (err) => {
              this.loader = false;

              // swal.fire('Error', err.error, 'error');
            }
          );
      }
    }
  }

  changeStartDate(value: any, i: number): void {
    this.selectedLoansForDisbursementArray[i].loanStartDate = value;
  }

  closeAside() {
    (window as any).viewLoan();
  }

  getTotalSection(type, arrayinput, expectedResult) {
    let total = 0;

    if (type === "disbursements") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].amount;
        }
      }
    } else if (type === "fees") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].fee;
        }
      }
    } else if (type === "buyoveramount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].buyoveramount;
        }
      }
    } else if (type === "disbursementamount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].disbursementAmount;
        }
      }
    } else if (type === "disbursementremainder") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].disbursementRemainder;
        }
      }
    } else if (type === "disbursementamountinner") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].disbursementamount;
        }
      }
    } else if (type === "disbursedamount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].disbursedAmount;
        }
      }
    } else if (type === "loanAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].loanAmount;
        }
      }
    } else if (type === "buyOverAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].buyOverAmount;
        }
      }
    } else if (type === "fees2") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].fees;
        }
      }
    } else if (type === "disbursedAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += arrayinput[i].disbursedAmount;
        }
      }
    }

    if (expectedResult === "formatted") {
      return total.toLocaleString(undefined, { minimumFractionDigits: 2 });
    } else {
      return total;
    }
  }

  showActions() {
    $(".help-button-wrapper").toggleClass("expanded");
  }

  informationModal() {
    //this.ResetReportAsideContent();
    $(".generate-menu").toggle();
  }

  topUpInformationModal() {
    //this.ResetReportAsideContent();
    $(".generate-menu2").toggle();
  }

  getFromJson(stringArray, expectedResult) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  randomNumber(prefix, min, max) {
    return prefix + "_" + Math.floor(Math.random() * (max - min) + min);
  }

  printThisDocument(content, reporttype) {
    const host = window.location.host;

    let printContents = null,
      popupWin = null,
      title = null,
      data = null;
    switch (reporttype) {
      case "to_be_disbursed":
        printContents = document.getElementById(content).innerHTML;
        title = "Loans to Disburse";
        data = this.selectedLoansForDisbursementArray;
        break;
      default:
        swal.fire({
          type: "error",
          title: "Error",
          text: "Print Content seems to be empty",
        });
        break;
    }
    if (data != null && data.length !== 0 && printContents != null) {
      popupWin = window.open(
        "",
        "_blank",
        "top=0,left=0,height=100%,width=auto"
      );
      popupWin.document.open();
      popupWin.document.write(`
            <html>
              <head>
                <title>${title}</title>
                <link rel="stylesheet" href="http://${host}/assets/css/bootstrap.min.css" type="text/css"/>
                <style>
                //........Customized style.......
                @page { margin: 0 }
                body { margin: 0 }
                .sheet {
                  margin: 0;
                  overflow: hidden;
                  position: relative;
                  box-sizing: border-box;
                  page-break-after: always;
                }

                /** Paper sizes **/
                body.A3               .sheet { width: 297mm; height: 419mm }
                body.A3.landscape     .sheet { width: 420mm; height: 296mm }
                body.A4               .sheet { width: 210mm; height: 296mm }
                body.A4.landscape     .sheet { width: 297mm; height: 209mm }
                body.A5               .sheet { width: 148mm; height: 209mm }
                body.A5.landscape     .sheet { width: 210mm; height: 147mm }
                body.letter           .sheet { width: 216mm; height: 279mm }
                body.letter.landscape .sheet { width: 280mm; height: 215mm }
                body.legal            .sheet { width: 216mm; height: 356mm }
                body.legal.landscape  .sheet { width: 357mm; height: 215mm }

                /** Padding area **/
                .sheet.padding-10mm { padding: 10mm }
                .sheet.padding-15mm { padding: 15mm }
                .sheet.padding-20mm { padding: 20mm }
                .sheet.padding-25mm { padding: 25mm }

                /** For screen preview **/
                @media screen {
                  body { background: #e0e0e0 }
                  .sheet {
                    background: white;
                    box-shadow: 0 .5mm 2mm rgba(0,0,0,.3);
                    margin: 5mm auto;
                  }
                }

                /** Fix for Chrome issue #273306 **/
                @media print {
                          body.A3.landscape { width: 420mm }
                  body.A3, body.A4.landscape { width: 297mm }
                  body.A4, body.A5.landscape { width: 210mm }
                  body.A5                    { width: 148mm }
                  body.letter, body.legal    { width: 216mm }
                  body.letter.landscape      { width: 280mm }
                  body.legal.landscape       { width: 357mm }
                }
                nav, aside, footer, button {
                  display: none !important;
                  }

                  // table,  th {
                  //   // border: 1px solid #eee;
                  //  //  width: 100%;
                  //   // text-align: center;
                  //    padding: 5px;
                  //   font-size: ;

                  // }

                  .clay {
                    width: 50%;
                  }

                  .dt-card__title {
                    margin: 0;
                    margin-top: 4px;
                    font-size: 8px;
                    color: #262626
                }



                  .modal-header {
                    padding: 10px;
                  }

                  .table {
                    width: 100%;
                    margin-bottom: 0.4rem;
                    font-size:8px

                }


                .table th {
                      padding: 0.2rem;
                    vertical-align: top;
                    border-bottom:1pt solid black;
                    border-top:1pt solid black;

                    border-collapse: collapse;
                    border-spacing: 0;

                }

                .table td {
                  padding: 0.5rem;
                  vertical-align: top;
                  border-bottom-width: 1px solid #e8e8e8
              }



                  .text-center {
                    text-align: center;
                  }

                  .text-left {
                    text-align: left;
                  }

                  .text-right {
                    text-align: right;
                  }
                </style>
              </head>
          <body onload="window.print();window.close();">${printContents}</body>
            </html>`);
      popupWin.document.close();
    }
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.clearSelection();
    this.clearDisbSelection();
    this.requestLoader = true;
    // this.dataTable.destroy();
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getOpenDisbursementBatches(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination.searchTerm = filter === "" ? null : filter;
    this.getOpenDisbursementBatches(pageNumber, filter);
  }

  getItemsPaginatedSearch2(filter, pageSize, pageNumber) {
    this.clearSelection();
    this.clearDisbSelection();
    this.requestLoader = true;
    this.pagination2.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getDisbursementsClaimed(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination2.searchTerm = filter === "" ? null : filter;
    this.getDisbursementsClaimed(pageNumber, filter);
  }

  getItemsPaginatedSearch3(filter, pageSize, pageNumber) {
    this.clearSelection();
    this.clearDisbSelection();
    this.requestLoader = true;
    this.pagination3.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getDisbursementPool(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination3.searchTerm = filter === "" ? null : filter;
    this.getDisbursementPool(pageNumber, filter);
  }

  getItemsPaginatedSearch4(filter, pageSize, pageNumber) {
    this.clearSelection();
    this.clearDisbSelection();
    this.requestLoader = true;
    this.pagination4.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getClosedDisbursementBatches(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination4.searchTerm = filter === "" ? null : filter;
    this.getClosedDisbursementBatches(pageNumber, filter);
  }

  getItemsPaginatedSearch5(filter, pageSize, pageNumber) {
    this.clearSelection();
    this.clearDisbSelection();
    this.requestLoader = true;
    this.pagination4.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getBuyOverLoans(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination5.searchTerm = filter === "" ? null : filter;
    this.getBuyOverLoans(pageNumber, filter);
  }

  getItemsPaginatedSearch6(filter, pageSize, pageNumber) {
    this.clearSelection();
    this.clearDisbSelection();
    this.requestLoader = true;
    this.pagination6.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getDisbursementBatches(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination6.searchTerm = filter === "" ? null : filter;
    this.getDisbursementBatches(pageNumber, filter);
  }

  getItemsPaginatedSearch7(filter, pageSize, pageNumber) {
    this.clearSelection();
    this.clearDisbSelection();
    this.requestLoader = true;
    this.failedDisbPagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getFailedDisbursements(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.failedDisbPagination.searchTerm = filter === "" ? null : filter;
    this.getFailedDisbursements(pageNumber, filter);
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  getUserPromise() {
    this.requestLoader = true;
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.requestLoader = false;
          this.currentuser = user.body;
          this.currentuserid = this.currentuser.userId;
          this.currentuserbranchid = this.currentuser.branchId;
          resolve(user);
        },
        (err) => {
          this.requestLoader = false;
          reject(err);
        }
      );
    });
  }

  getDetailsById(contentViewName: string, id: number) {
    this.selectedBatchId = id;
    
    if (!this.copy_hover) {
      this.requestLoader = true;
      this.loanoperationService.getDisbursementBatchById(id).subscribe(
        (res) => {
          this.requestLoader = false;
          this.LoanDetails(contentViewName, res.body);
          this.toggleAside();
        },
        (err) => {
          this.requestLoader = false;
        }
      );
    }
  }

  sendBackSelectedFailedDisbursements() {
    const selected = Array.from(this.failedDisbursementSelection);

    swal
      .fire({
        type: "info",
        text: "Are you sure want to proceed?",
        title: "Bank Account Update",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          this.requestLoader = true;
          const payload = {
            loanIds: selected,
          };
          this.loanoperationService
            .sendBackFailedDisbursements(payload)
            .subscribe(
              (res) => {
                this.requestLoader = false;
                this.getItemsPaginatedSearch7(
                  this.failedDisbPagination.searchTerm,
                  this.failedDisbPagination.pageSize,
                  this.failedDisbPagination.pageNum
                );
                swal.fire({
                  type: "success",
                  text: res.body,
                  title: "Successful",
                });
              },
              (err) => {
                this.requestLoader = false;
                swal.fire("Error", err.error, "error");
              }
            );
        }
      });
  }

  retrySelectedFailedDisbursements(partner, process, content, message) {
    this.selectedLoansForDisbursementArray = [];
    const selected = Array.from(this.failedDisbursementSelection);

    var resultArray = this.failedDisbursements.filter((item) =>
      selected.includes(item.loanId)
    );

    resultArray.forEach((row) => {
      let rowTrialCount =
        row.disbursementTrailCount == null ? 0 : row.disbursementTrailCount;
      if (
        row.status != "Disbursed" &&
        rowTrialCount <= this.appOwnerRetrialCount
      ) {
        this.selectedLoansForDisbursementArray.push({
          id: row.loanId,
          amount: row.loanAmount,
          code: row.applicationCode,
          name: row.customerName,
          bankname: this.getFromJson(row.bankInfo, "bankName"),
          bankaccountnumber: this.getFromJson(
            row.bankInfo,
            "bankAccountNumber"
          ),
          banksortcode: this.getFromJson(row.bankInfo, "bankSortCode"),
          dateapproved: row.dateApproverApproved,
          fee: row.fees,
          disbursementamount: row?.disbursedAmount ?? row.amountDisbursed,
          buyoveramount: row.buyOverAmount,
          status: row.loanStage,
          loanStartDate: row?.loanStartDate,
          branchId: row?.branchId,
          loanBatchId: row?.loanBatchId
        });
      }

      this.selectedBatchId = this.selectedBatchId || row.loanBatchId;
    });
    this.isDisbursementProcessInitialTrial = false;
    this.submitQueryRequest(partner, process, content, message);
  }

  toggleAside() {
    (window as any).viewLoan();
  }

  toggleFailedDisbursementSelection(loanId) {
    if (this.failedDisbursementSelection.has(loanId)) {
      this.failedDisbursementSelection.delete(loanId);
    } else {
      this.failedDisbursementSelection.add(loanId);
    }
  }

  selectAllFailedDisbursementSelection() {
    if (this.allFailedDisbursementSelected()) {
      this.failedDisbursementSelection = new Set();
    } else {
      const ids = this.failedDisbursements.map((x) => x.loanId);
      this.failedDisbursementSelection = new Set(ids);
    }
  }

  allFailedDisbursementSelected() {
    const ids = this.failedDisbursements.map((x) => x.loanId);
    const allSelectable = new Set(ids);

    let intersection = new Set(
      [...allSelectable].filter((x) => this.failedDisbursementSelection.has(x))
    );
    return intersection.size == allSelectable.size;
  }

  failedDisbursementSelected(loanId) {
    return this.failedDisbursementSelection.has(loanId);
  }

  getDate(s) {
    if (!s) {
      return false;
    }
    try {
      let d = new Date(s);
      const yyyy = `${d.getFullYear()}`;
      const mm = `0${d.getMonth() + 1}`.slice(-2);
      const dd = `0${d.getDate()}`.slice(-2);
      return `${yyyy}-${mm}-${dd}`;
    } catch (error) {
      return false;
    }
  }

  resetFailedDisbursementSelection() {
    this.failedDisbursementSelection = new Set();
  }

  onShowSameDateForLoanStartInput(show: boolean) {
    if (!show) {
      this.pickedDateForLoanStart = "";
    }
    this.sameDateForLoanStart = show;
  }

  updateLoanStartDateForAll(date: string) {
    this.selectedLoansForDisbursementArray =
      this.selectedLoansForDisbursementArray.map((loan) => ({
        ...loan,
        loanStartDate: loan.loanStartDate ? loan.loanStartDate : date,
      }));
  }

  onSetSameDateForLoanStart(value: string) {
    this.pickedDateForLoanStart = value;
    this.updateLoanStartDateForAll(value);
  }

  getBanks() {
    this.getPaystackBanks();
    this.getKudaBanks();
    this.getSeerbitBanks();
  }

  getPaystackBanks() {
    this.configurationService
      .spoolBanks({ provider: "Paystack" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.paystackBanks = res.body;
        },
      });
  }

  getKudaBanks() {
    this.configurationService
      .spoolBanks({ provider: "Kuda" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.kudaBanks = res.body;
        },
      });
  }

  getSeerbitBanks() {
    this.configurationService
      .spoolBanks({ provider: "Seerbit" })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.seerbitBanks = res.body;
        },
      });
  }

  getAllIntegrations(): void {
    this.configurationService
      .getAllIntegrations()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.kudaInfo = res?.body.find(
          (integration) => integration?.integrationName === "Kuda"
        );
        this.seerbitInfo = res?.body.find(
          (integration) => integration?.integrationName === "Seerbit"
        );

        this.paystackInfo = res?.body.find(
          (integration) => integration?.integrationName === "Paystack"
        );
      });
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:`${this.codeType} Code copied to clipboard`,type:'success',timer:3000})
    }
  }

  markDisbAsFailed(content?:HTMLElement){
    this.selectedDisbursements = this.selectedLoansForDisbursementArray.map(loan => ({code:loan?.code,applicant:loan?.name,loanAmount:loan?.amount,loanId:loan?.id,stage:loan?.stage}));
    this.modalService.open(content)
  }

  markAsFailedCleanup(currentView:number){
    this.toggleAside();
    this.switchviews(currentView)
  }

  toggleFailedDisbBank(loanId: any, bankInfo: any): void {
    const bankName = this.getFromJson(bankInfo, 'bankName');
    const isDiamondBank = bankName.toLocaleLowerCase().includes('diamond');
    
    swal.fire({
      type: 'info',
      title: "Change Bank",
      text: `We noticed this application is to be disbursed to an ${bankName} account, instead of an ${!isDiamondBank ? 'Access Bank (Diamond)' : 'Access Bank'} account. Would you want to change?`,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: `Yes change to ${!isDiamondBank ? 'Access Bank (Diamond)' : 'Access Bank'}`,
      confirmButtonColor: '#6faa8f',
      cancelButtonText: `No`,
      showLoaderOnConfirm: true,
    }).then((result) => {
      if (result.value) {
        swal.showLoading;
        this.loanoperationService.toggleDisbursementBank(loanId, `${isDiamondBank ? 'AccessBank' : 'DiamondBank'}`).pipe(take(1)).subscribe(() => {
          this.getFailedDisbursements();
          swal.close();
          this.toast.fire({
            type: 'success',
            text: 'Bank changed successfully.'
          });

          this.toggleAside();
          this.getDetailsById('disbursementview', this.selectedBatchId)
        })
      }
    })
  }

  isAccessBankCheck(payload: any): boolean {
    return this.getFromJson(payload.bankInfo, 'bankName').toLocaleLowerCase().includes('access')
  }


  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
