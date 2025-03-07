import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  OnDestroy,
  TemplateRef,
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  UntypedFormBuilder,
  FormGroup,
  FormControl,
  FormArray,
} from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LoanoperationsService } from "../../../service/loanoperations.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Configuration } from "../../../model/configuration";
import swal from "sweetalert2";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import * as $ from "jquery";
import * as moment from "moment";
import { EncryptService } from "src/app/service/encrypt.service";
import { UnderwriterReasonInterface } from "../../configuration/models/underwriter-reason.interface";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { map, pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { SelectionModel } from "@angular/cdk/collections";
import { PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import { LoanRepaymentMethodEnum } from "../enums/loan-repayment-method.enum";
import {
  AllClaimedApplication,
  BVNInfo,
  LoanInformation,
  LoanType,
  LoanWithApprovalWorkflow,
  OpenOrReviewedClaimedApplication,
} from "../loan.types";
import { removeNullUndefinedWithReduce } from "../../shared/helpers/generic.helpers";
import { toFormData } from "src/app/util/finance/financeHelper";
import { FilterParams, FilterTypes } from "../../shared/shared.types";
import { Store } from "@ngrx/store";
import { AppWideState } from "src/app/store/models";
import { clearFilters } from "src/app/store/actions";
@Component({
  selector: "app-applications-page",
  templateUrl: "./applications-page.component.html",
  styleUrls: ["./applications-page.component.scss"],
})
export class ApplicationsPageComponent implements OnInit, OnDestroy {
  @ViewChild("recallModal", { static: true }) recallModal: ElementRef;

  applications: OpenOrReviewedClaimedApplication[];
  reviewedapplications: OpenOrReviewedClaimedApplication[];
  allClaimedApplications: AllClaimedApplication[];
  sideview: any;
  loanactivities: any;
  recallMultiLoans: boolean;
  loansToRecall: any[] = [];
  loansToRecallId: any[] = [];

  loanStartDate: any = null;
  loanDateError: boolean = true;

  public AddResponseForm: UntypedFormGroup;
  public AddCreditScoreForm: UntypedFormGroup;
  public RecallLoanForm: UntypedFormGroup;
  public RecallMultiLoanForm: UntypedFormGroup;
  NewRepaymentDateSection = false;
  changeInterest = false;
  updateLoanInterestLoader = false;
  isVisible: boolean;

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

  currentuser: any;
  currentuserid: any;
  currentuserbranchid: any;
  ownerInformation: any;
  viewloandetails: boolean;
  loanInformation: LoanInformation;
  bvnInfo: BVNInfo;
  loanhistoryinformation: any;
  loanhistoryperson: any;
  lineInformation: any;
  currentdate: any;
  currentFileUrl: any;
  currentFileType: any;
  currentFileDownloadUrl: any;
  loansummaryhistory: any;

  isBlacklist: boolean;
  blackListReason: string = "";

  currentview: number;
  requestLoader: boolean;
  loader = false;
  dataTable: any;

  //filtering
  filterForm: UntypedFormGroup;
  filterFormData: any = {
    loantypesArray: [],
    branchesAccessibleArray: [],
    selectedBranchIds: [],
    selectedBranches: [],
    selectedLoanIds: [],
    selectedLoans: [],
  };

  selectedloanid: any;
  showBankStatementAnalysis: boolean = false;
  selectedloancode: any;
  selectedstatus: any;
  public loggedInUser: any;

  feedbackdata: any;
  possibleResults: any;
  currentSource: any;
  public root = window.location.origin;

  getParams = {
    code: null,
  };

  NewFirstRepaymentDate: any;
  FormFieldValidation = [];
  bankStatementAvailable: boolean;
  bankStatement: any;
  bankStatementLoaded: boolean;
  bankBalanceLoader: boolean;
  public bankStatementFilter: UntypedFormGroup;
  sendCalendlyLoader = false;
  allReasons: UnderwriterReasonInterface[] = [];
  allReasonsSelectData: any[] = [];
  isRedraftReason: boolean;
  selectedReasons: any[] = [];
  reasonString: string;

  repaymentLoader = false;
  public repaymentScheduleArray: any[] = [];

  resPersonOpts: any[] = [];
  appOwnerDetails: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  reassignReviewerForm: UntypedFormGroup;

  public toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  remitaInflightInUse = false;

  claimedApplicationSelection = new SelectionModel<AllClaimedApplication>(
    true,
    []
  );
  scheduleInformation: any;
  feelines: any;
  copy_hover = false;
  selectedLoanWithHistoryId: number;
  selectedLoanWithHistoryLoanType: LoanType;
  isMultiLevelApproval = false;
  gettingLoanWithApprovalDetails = false;
  loanWithApprovalWorkflow: LoanWithApprovalWorkflow;
  uploadingFiles = false;
  gettingReviewers = false;
  showPopup = false;
  FILTER_TYPES = FilterTypes;
  filterParams: FilterParams;
  filterTypes: FilterTypes[] = [];

  constructor(
    private configurationService: ConfigurationService,
    private loanoperationService: LoanoperationsService,
    public authService: AuthService,
    private userService: UserService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private fb: UntypedFormBuilder,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    public encrypt: EncryptService,
    private colorThemeService: ColorThemeService,
    private sharedService: SharedService,
    private store:Store<AppWideState>
  ) {}

  ngOnInit() {
    this.removePill();
    this.getAppOwnerInfo();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.feelines = [];
    this.sideview = 0;
    this.viewloandetails = false;
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.getUserPromise().then((next) => {
      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
      this.route.paramMap.subscribe((params: ParamMap) => {
        this.getParams.code = params.get("code");
      });

      this.addCreditScoreFormInit();
      this.getConstants();
      this.getToday();
      this.addResponseFormInit();
      this.reassignUserFormInit();
      this.switchviews(1);
    });
  }

  addCreditScoreFormInit() {
    this.AddCreditScoreForm = new UntypedFormGroup({
      CreditScore: new UntypedFormControl("", [Validators.required]),
      UserId: new UntypedFormControl(""),
      LoanId: new UntypedFormControl(""),
    });
  }
  recallLoanFormInit() {
    this.RecallLoanForm = new UntypedFormGroup({
      transactionPin: new UntypedFormControl("", [Validators.required]),
    });
  }
  recallMultiLoanFormInit() {
    this.RecallMultiLoanForm = new UntypedFormGroup({
      transactionPin: new UntypedFormControl("", [Validators.required]),
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  openModal(content: TemplateRef<any>, size = "md") {
    this.modalService.open(content, {
      size,
      ariaLabelledBy: "modal-basic-title",
      centered: true,
    });
  }

  onReassignReviewer(
    reassignTemplate: TemplateRef<any>,
    errorTemplate: TemplateRef<any>
  ) {
    if (this.containsBothTypes()) {
      this.openModal(errorTemplate, "sm");
    } else if (this.containsMultiple()) {
      Swal.fire({
        type: "warning",
        title: "Not Allowed!",
        text: "You can only select one loan with multi-level approval for reassignment.",
      });
    } else {
      const loan = this.claimedApplicationSelection.selected[0];
      if (loan?.isMultiLevelLoanApproval) {
        this.getUsersWithRequiredRoles({
          template: reassignTemplate,
          loanId: loan.loanId,
        });
      } else {
        this.getAllowedReviewers(reassignTemplate);
      }
    }
  }

  containsMultiple() {
    const loansWithMultiApproval =
      this.claimedApplicationSelection.selected.filter(
        (loan) => loan.isMultiLevelLoanApproval
      );

    return loansWithMultiApproval.length > 1;
  }

  containsBothTypes() {
    const loansWithMultiApproval =
      this.claimedApplicationSelection.selected.filter(
        (loan) => loan.isMultiLevelLoanApproval
      );
    const loansWithoutMultiApproval =
      this.claimedApplicationSelection.selected.filter(
        (loan) => !loan.isMultiLevelLoanApproval
      );

    return (
      loansWithMultiApproval.length > 0 && loansWithoutMultiApproval.length > 0
    );
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters.action === "remove") {
          this.filterFormData.selectedBranchIds = [];
          this.filterFormData.selectedBranches = [];
          this.filterFormData.selectedLoanIds = [];
          this.filterFormData.selectedLoans = [];

          selectedFilters.filters.forEach((selectedFilter) => {
            selectedFilter.forEach((filter) => {
              if (filter.type === "branch") {
                this.filterFormData.selectedBranchIds.push(filter.id);
                this.filterFormData.selectedBranches.push(filter);
              }
              if (filter.type === "loan") {
                this.filterFormData.selectedLoanIds.push(filter.id);
                this.filterFormData.selectedLoans.push(filter);
              }
            });
          });

          if (this.currentview === 1) {
            this.filterLoans("open");
          } else if (this.currentview === 2) {
            this.filterLoans("reviewed");
          } else {
            this.filterLoans("all");
          }
        }
      });
  }

  addResponseFormInit() {
    this.AddResponseForm = this.fb.group({
      LoanId: new UntypedFormControl(""),
      UserId: new UntypedFormControl(""),
      Status: new UntypedFormControl(""),
      InternalNote: new UntypedFormControl(""),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
      files: [null],
      ApplicationCode: new UntypedFormControl(""),
      NewFirstRepaymentDate: new UntypedFormControl(""),
      RedraftReasons: new UntypedFormControl([]),
      LoanStartDate: new UntypedFormControl(null),
      rejectToLevelId: new FormControl(0),
      loanApprovalAction: new FormControl(""),
    });
  }

  statusCheck(response) {
    this.selectedstatus = response;
  }

  handleFileInput(filelist: FileList) {
    const output = [];
    for (let i = 0; i < filelist.length; i++) {
      output.push(filelist.item(i));
    }
    this.AddResponseForm.controls["files"].patchValue(output);

    this.uploadMultiApprovalLoanFile();
  }
  clearFileHandler() {
    this.AddResponseForm.controls["files"].patchValue(null);
  }

  uploadMultiApprovalLoanFile() {
    this.uploadingFiles = true;

    const payload = {
      loanId: this.selectedLoanWithHistoryId,
      file: this.AddResponseForm.get("files")?.value[0],
    };

    const formData = toFormData(payload);

    this.loanoperationService
      .uploadMultiApprovalLoanFile(formData)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.toast.fire({
            type: "success",
            title: "File uploaded successfully!",
          });
          this.uploadingFiles = false;
          this.closeAside();
        },
        error: () => {
          this.uploadingFiles = false;
        },
      });
  }

  getAllReasons(): void {
    const model = {
      pageNumber: 1,
      pageSize: 1000,
    };
    this.configurationService.spoolUnderwriterReasons(model).subscribe(
      (res) => {
        this.allReasons = res.body.value.data as UnderwriterReasonInterface[];
      },
      (err: any) => {},
      () => {
        this.mapReasonsToDropdown();
      }
    );
  }

  selectedReason(reason: any): void {
    this.selectedReasons.push(reason.id);
  }

  removedReason(reason: any): void {
    const index = this.selectedReasons.indexOf(reason?.id);
    if (index !== -1) {
      this.selectedReasons.splice(index, 1);
    }
  }

  cancelRedraft(e: any = null, type: string): void {
    this.cancelBlacklist();
    if (e !== null) {
      e.preventDefault();
    }
    this.isRedraftReason = !this.isRedraftReason;
    if (!this.isRedraftReason) {
      this.selectedReasons = [];
    }
  }

  confirmRedraft(e: any) {
    e.preventDefault();
    this.statusCheck("Redraft");
    let isReasonStringNotEmpty;
    if (typeof this.reasonString !== "undefined" && this.reasonString) {
      isReasonStringNotEmpty = true;
    }
    if (this.selectedReasons.length < 1 && !isReasonStringNotEmpty) {
      swal.fire({
        type: "info",
        text: "You must select at least one reason or write a reason in the text box for redrafting this application.",
        title: "Redraft reason",
      });
    } else {
      if (this.isMultiLevelApproval) {
        this.onReviewMultiLevelApprovalLoan("Redraft");
      } else {
        this.submitResponseForm(this.AddResponseForm.value);
      }
    }
  }
  mapReasonsToDropdown(): void {
    this.allReasonsSelectData = this.allReasons
      .filter((val) => val.status === "Active")
      .map((reason) => ({
        id: reason.underwriterReasonId,
        text: reason.underwriterReasonName,
      }));
  }

  submitResponseForm(val: any) {
    if (this.AddResponseForm.valid) {
      this.loader = true;

      this.onLoanDateChange(this.loanStartDate);
      if (!this.loanDateError && this.loanStartDate) {
        this.AddResponseForm.controls["LoanStartDate"].setValue(
          this.getDate(this.loanStartDate)
        );
      } else {
        this.AddResponseForm.controls["LoanStartDate"].setValue(null);
      }

      this.AddResponseForm.controls["LoanId"].patchValue(this.selectedloanid);
      this.AddResponseForm.controls["UserId"].patchValue(this.currentuserid);
      this.AddResponseForm.controls["Status"].patchValue(this.selectedstatus);
      this.AddResponseForm.controls["NewFirstRepaymentDate"].patchValue(
        this.NewFirstRepaymentDate
      );
      if (this.isRedraftReason && this.selectedstatus === "Redraft") {
        const allReason = this.selectedReasons;
        if (typeof this.reasonString !== "undefined" && this.reasonString) {
          allReason.push(this.reasonString);
        }
        this.AddResponseForm.controls["RedraftReasons"].patchValue(allReason);
      } else {
        this.AddResponseForm.controls["RedraftReasons"].patchValue([]);
      }

      this.loanoperationService
        .createResponse(this.AddResponseForm.value)
        .subscribe(
          (res) => {
            swal.fire({
              type: "success",
              text: "Loan Review Saved",
              title: "Successful",
            });
            this.NewRepaymentDateSection = false;
            this.closeAside();
            this.AddResponseForm.reset();
            this.selectedReasons = [];
            this.isRedraftReason = false;

            this.switchviews(1);
            this.getApplications();
            this.loader = false;
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  // Blacklist
  blacklistCustomer(e: any, type?: string): void {
    e.preventDefault();
    this.isBlacklist = true;
    this.isRedraftReason = false;
    if (type === "withReason") {
      this.blackListReason = this.blackListReason.trim();
      if (typeof this.blackListReason !== "undefined" && this.blackListReason) {
        swal
          .fire({
            type: "warning",
            text: "Are you sure you want to blacklist customer ?",
            title: "Blacklist Customer",
            showCancelButton: true,
            cancelButtonColor: "#B85353",
            cancelButtonText: "No",
            confirmButtonText: "Yes I want to",
            confirmButtonColor: "#558E90",
          })
          .then((result) => {
            if (result.value) {
              this.confirmBlacklist();
            }
          });
      } else {
        swal.fire({
          type: "info",
          title: "Provide Reason",
          text: "State the reason for blacklisting the customer.",
        });
      }
    }
  }
  cancelBlacklist() {
    this.isBlacklist = false;
    this.blackListReason = null;
  }

  confirmBlacklist() {
    this.loader = true;
    const transactionPin = this.AddResponseForm.get("TransactionPin").value;
    const model = {
      reason: this.blackListReason,
      customerId: this.loanInformation?.person?.personId,
      loanId: this.selectedloanid,
      transactionPin: this.encrypt.encrypt(transactionPin),
    };

    this.loanoperationService.blacklistCustomer(model).subscribe(
      (res) => {
        swal.fire({
          type: "success",
          text: "Customer Blacklist request sent",
          title: "Successful",
        });
        this.NewRepaymentDateSection = false;
        this.closeAside();
        this.AddResponseForm.reset();
        this.selectedReasons = [];
        this.reasonString = null;
        this.blackListReason = "";
        this.isRedraftReason = false;
        this.cancelBlacklist();

        this.switchviews(1);
        this.getApplications();
        this.loader = false;
      },
      (err) => {
        this.loader = false;
      }
    );
  }

  submitCreditScoreForm(val: any) {
    if (this.AddCreditScoreForm.valid) {
      this.loader = true;

      this.AddCreditScoreForm.controls["LoanId"].patchValue(
        this.selectedloanid
      );
      this.AddCreditScoreForm.controls["UserId"].patchValue(this.currentuserid);
      this.loanoperationService
        .updateCreditScore(this.AddCreditScoreForm.value)
        .subscribe(
          (res) => {
            swal.fire({
              type: "success",
              text: "Credit Score Updated",
              title: "Successful",
            });
            this.NewRepaymentDateSection = false;

            this.loader = false;
          },
          (err) => {
            this.loader = false;

            // swal.fire("Error", err.error, "error");
          }
        );
    }
  }

  LoanDetails(loanInformation) {
    this.loanInformation = {
      ...loanInformation?.currentApplication,
      isDecideActive: this.appOwnerDetails.decideInfo.isActive,
      customerImageUrl:
        loanInformation?.currentApplication?.customerImageUrl ||
        "assets/images/male-default-profile.png",
    };
    if (this.loanInformation?.bvnInfo) {
      this.bvnInfo = JSON.parse(this.loanInformation.bvnInfo);
    }

    if (loanInformation?.currentApplication?.loanDeposit) {
      this.loanInformation.loanDeposit = JSON.parse(
        this.loanInformation.loanDeposit
      );
    }

    this.loansummaryhistory = loanInformation.previousLoanApplications;
    this.viewloandetails = true;
    this.selectedloanid = loanInformation.currentApplication.loanId;
    this.selectedloancode = loanInformation.currentApplication.applicationCode;
    this.loanactivities = [];

    this.AddResponseForm.reset();
    this.clearFileHandler();
    this.NewRepaymentDateSection = false;
    this.NewFirstRepaymentDate = "";

    this.loanStartDate = this.getDate(this.loanInformation?.loanStartDate);
    const incomingFeeLines = JSON.parse(
      this.loanInformation?.loanTypeInfo
    ).FeesUsed;
    if (incomingFeeLines != null) {
      this.feelines = incomingFeeLines;
    }

    this.onLoanDateChange(this.loanStartDate);
    if (this.loanInformation.repaymentInfo) {
      const decodedRepaymentInfo = JSON.parse(
        this.loanInformation.repaymentInfo
      );
      this.remitaInflightInUse =
        decodedRepaymentInfo.repaymentMethod ===
        LoanRepaymentMethodEnum.InflightCollectionsRemita;
    }
  }

  loanPreview(personinfo, loanrow, content) {
    this.loanhistoryperson = personinfo;
    this.loanhistoryinformation = loanrow;

    this.modalService.open(content, {
      size: "lg",
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2",
    });
  }

  getFromJson(stringArray, expectedResult) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  getObjectFromJson(stringArray) {
    let result = "";
    if (stringArray != null && stringArray !== "") {
      result = JSON.parse(stringArray);
    }
    return result;
  }

  getSpecificArray(objectArray, expectedResult) {
    let result = "";

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < objectArray.length; i++) {
      result = objectArray.loanappplication;
    }

    return result;
  }

  switchviews(view: number, requireRefresh = false, clear = false) {
    if (this.currentview === view && !requireRefresh) return;
    if (clear) {
      this.store.dispatch(clearFilters());
    }
    this.clearClaimedLoanSelection();
    if (view === 1) {
      this.currentview = 1;
      this.getApplications();
      this.requestLoader = true;
    } else if (view === 2) {
      this.currentview = 2;
      this.getReviewedApplications();
      this.requestLoader = true;
    } else if (view === 3) {
      this.currentview = view;
      this.requestLoader = true;
      this.getAllClaimedApplications();
    }
  }

  setFilters(filterParams) {
    if (filterParams) {
      const selectedFilters: PillFilters = {
        filters: [
          this.filterFormData.selectedBranches,
          this.filterFormData.selectedLoans,
        ],
        action: "add",
        headers: ["Branches", "Loans"],
      };
      this.sharedService.selectedFilters$.next(selectedFilters);
    }
  }

  getApplications(
    pageNum = this.pagination.pageNum,
    filter = null,
    filterParams = null
  ) {
    this.applications = [];
    this.requestLoader = true;

    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    let paginationModel = removeNullUndefinedWithReduce({
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
      loanTypeId: this.filterFormData.selectedLoanIds[0],
      selectedSearchColumn: this.pagination["selectedSearchColumn"],
      keyword: this.pagination["keyword"],
    });

    if (this.filterParams) {
      paginationModel = { ...paginationModel, ...this.filterParams };
    }

    this.loanoperationService
      .spoolOpenOrReviewedClaimedApplications(paginationModel, false)
      .subscribe(
        (response) => {
          this.applications = response.body.items;

          this.pagination.maxPage = response.body.totalPages;
          this.pagination.totalRecords = response.body.totalCount;
          this.pagination.count = this.applications.length;
          this.pagination.jumpArray = Array(this.pagination.maxPage);
          this.pagination["searchColumns"] = response.body.searchColumns;
          for (let i = 0; i < this.pagination.jumpArray.length; i++) {
            this.pagination.jumpArray[i] = i + 1;
          }

          this.requestLoader = false;
          this.loader = false;
        },
        (error) => {
          this.loader = false;
          this.requestLoader = false;
          // swal.fire("Error", error.error, "error");
        }
      );
  }

  onSearchParams(event) {
    if (this.currentview === 1) {
      this.pagination["selectedSearchColumn"] = event?.selectedSearchColumn;
      this.pagination["keyword"] = event?.keyword;

      this.getApplications();
    } else if (this.currentview === 2) {
      this.pagination2["selectedSearchColumn"] = event?.selectedSearchColumn;
      this.pagination2["keyword"] = event?.keyword;

      this.getReviewedApplications();
    } else if (this.currentview === 3) {
      this.pagination3["selectedSearchColumn"] = event?.selectedSearchColumn;
      this.pagination3["keyword"] = event?.keyword;

      this.getAllClaimedApplications();
    }
  }

  getReviewedApplications(
    pageNum = this.pagination2.pageNum,
    filter = null,
    filterParams = null
  ) {
    this.reviewedapplications = [];
    this.requestLoader = true;

    // paginated section
    this.pagination2.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination2.pageNum = 1;
    }
    if (pageNum > this.pagination2.maxPage) {
      this.pagination2.pageNum = this.pagination2.maxPage || 1;
    }

    let paginationModel = removeNullUndefinedWithReduce({
      pageNumber: this.pagination2.pageNum,
      pageSize: this.pagination2.pageSize,
      selectedSearchColumn: this.pagination2["selectedSearchColumn"],
      keyword: this.pagination2["keyword"],
    });

    if (this.filterParams) {
      paginationModel = { ...paginationModel, ...this.filterParams };
    }

    this.loanoperationService
      .spoolOpenOrReviewedClaimedApplications(paginationModel, true)
      .subscribe(
        (response) => {
          this.reviewedapplications = response.body.items;

          this.pagination2.maxPage = response.body.totalPages;
          this.pagination2.totalRecords = response.body.totalCount;
          this.pagination2.count = this.reviewedapplications.length;
          this.pagination2.jumpArray = Array(this.pagination2.maxPage);
          this.pagination2["searchColumns"] = response.body.searchColumns;
          for (let i = 0; i < this.pagination2.jumpArray.length; i++) {
            this.pagination2.jumpArray[i] = i + 1;
          }

          this.chRef.detectChanges();

          this.requestLoader = false;
          this.loader = false;
        },
        (error) => {
          this.requestLoader = false;
          this.loader = false;
          // swal.fire("Error", error.error, "error");
        }
      );
  }

  getAllClaimedApplications(
    pageNum = this.pagination3.pageNum,
    filter = null,
    filterParams = null
  ) {
    this.allClaimedApplications = [];
    this.clearClaimedLoanSelection();
    this.requestLoader = true;

    // paginated section
    this.pagination3.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination3.pageNum = 1;
    }
    if (pageNum > this.pagination3.maxPage) {
      this.pagination3.pageNum = this.pagination3.maxPage || 1;
    }

    let paginationModel = removeNullUndefinedWithReduce({
      pageNumber: this.pagination3.pageNum,
      pageSize: this.pagination3.pageSize,
      selectedSearchColumn: this.pagination3["selectedSearchColumn"],
      keyword: this.pagination3["keyword"],
    });

    if (this.filterParams) {
      paginationModel = { ...paginationModel, ...this.filterParams };
    }

    this.loanoperationService
      .getAllClaimedApplications(paginationModel)
      .subscribe(
        (response) => {
          this.allClaimedApplications = response.body.items;

          this.pagination3.maxPage = response.body.totalPages;
          this.pagination3.totalRecords = response.body.totalCount;
          this.pagination3.count = this.allClaimedApplications.length;
          this.pagination3.jumpArray = Array(this.pagination3.maxPage);
          this.pagination3["searchColumns"] = response.body.searchColumns;
          for (let i = 0; i < this.pagination3.jumpArray.length; i++) {
            this.pagination3.jumpArray[i] = i + 1;
          }

          this.chRef.detectChanges();

          this.requestLoader = false;
          this.loader = false;
        },
        (error) => {
          this.requestLoader = false;
          this.loader = false;
        }
      );
  }

  toggleClaimedLoan(data: AllClaimedApplication): void {
    this.claimedApplicationSelection.toggle(data);
  }

  clearClaimedLoanSelection(): void {
    this.claimedApplicationSelection.clear();
  }

  masterToggle(): void {
    this.isAllClaimedAppSelected()
      ? this.clearClaimedLoanSelection()
      : this.claimedApplicationSelection.select(...this.allClaimedApplications);
  }

  isAllClaimedAppSelected(): boolean {
    const selected = this.claimedApplicationSelection.selected;
    if (selected.length === this.allClaimedApplications.length) return true;

    return false;
  }

  isAllClaimedAppIndeterminate(): boolean {
    const selected = this.claimedApplicationSelection.selected;
    if (selected.length === 0) return false;

    if (
      selected.length !== 0 &&
      selected.length !== this.allClaimedApplications.length
    )
      return true;
  }

  reassignUserFormInit() {
    this.reassignReviewerForm = new UntypedFormGroup({
      transactionPin: new UntypedFormControl("", [Validators.required]),
      loanIds: new UntypedFormControl([]),
      assignedUserId: new UntypedFormControl(null, [Validators.required]),
    });
  }

  reAssignUserToLoans(): void {
    this.loader = true;

    const allSelectedLoans = this.claimedApplicationSelection.selected;
    const allSelectedLoanIds = [];

    allSelectedLoans.forEach((loan) => {
      allSelectedLoanIds.push(loan.loanId);
    });
    this.reassignReviewerForm.get("loanIds").patchValue(allSelectedLoanIds);

    const data = this.reassignReviewerForm.value;

    let req: any;
    if (
      this.claimedApplicationSelection.selected[0]?.isMultiLevelLoanApproval
    ) {
      req = this.loanoperationService.reassignLoanWithMultiLevelApproval(
        { assignedUserId: data.assignedUserId, loanIds: data.loanIds },
        data.transactionPin
      );
    } else {
      req = this.loanoperationService.reassignClaimedApplications(data);
    }

    req.pipe(takeUntil(this.unsubscriber$)).subscribe(
      (res) => {
        this.toast.fire({
          text: res.body?.message,
        });
        this.loader = false;
        this.getAllClaimedApplications();
        this.closeModal();
        this.reassignUserFormInit();
        this.reassignReviewerForm.reset();
      },
      (err) => {
        this.loader = false;
      }
    );
  }

  documentViewer(filename, urlInput, fileType, doccontent, imgcontent) {
    this.currentFileUrl = "";
    this.currentFileType = fileType;
    if (fileType === "image") {
      this.currentFileUrl = urlInput; // this.root+ '/Uploads/'+filename;
      // tslint:disable-next-line:max-line-length
      this.modalService.open(doccontent, {
        size: "lg",
        centered: true,
        ariaLabelledBy: "modal-basic-title",
        windowClass: "custom-modal-style opq2",
      });
    } else {
      const combinedUrl = urlInput; // 'https://docs.google.com/viewer?url=' + urlInput + '&embedded=true';
      this.currentFileUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl(combinedUrl);
      this.currentFileDownloadUrl = urlInput;
      window.open(this.currentFileDownloadUrl, "_blank");
      //  this.currentFileUrl = this._base64ToArrayBuffer(urlInput);

      // tslint:disable-next-line:max-line-length
      // this.modalService.open(doccontent, { size: 'lg', centered: true, ariaLabelledBy: 'modal-basic-title',  windowClass: 'custom-modal-style opq2' });
    }
  }

  confirmApplicationResend() {
    Swal.fire({
      type: "warning",
      title: "Are you sure?",
      text: "Are you sure you want to send this application back to the pool?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Send it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.sendApplicationsBackToPool();
      }
    });
  }

  sendApplicationsBackToPool(): void {
    this.loader = true;
    const allSelectedLoans = this.claimedApplicationSelection.selected;
    const allSelectedLoanIds = [];

    allSelectedLoans.forEach((loan) => {
      allSelectedLoanIds.push(loan.loanId);
    });

    const model = {
      loanIds: allSelectedLoanIds,
    };

    this.loanoperationService
      .sendClaimedApplicationsBackToPool(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            text: `${allSelectedLoanIds.length} claimed loan(s) sent back to pool.`,
          });
          this.loader = false;
          this.getAllClaimedApplications();
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  downloadfile() {
    window.open(this.currentFileDownloadUrl, "_blank");
  }

  submitQueryRequest(partner, process, row, content, message) {
    const source = partner === 1 ? "First Central" : "Credit Registry";

    this.feedbackdata = [];

    // tslint:disable-next-line:max-line-length
    swal
      .fire({
        type: "info",
        text: message + " via " + source,
        title: "Query Request",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "Abort",
        confirmButtonText: "Proceed",
        confirmButtonColor: "#558E90",
      })
      .then((result) => {
        if (result.value) {
          this.modalService.open(content, {
            centered: true,
            ariaLabelledBy: "modal-basic-title",
            windowClass: "custom-modal-style",
          });
          this.requestLoader = true;

          if (partner === 1 && process === 1) {
            this.feedbackdata = [];
            this.possibleResults = [];

            const datamodel = {
              ConsumerName:
                this.getFromJson(row.bvnInfo, "bvnFirstName") +
                " " +
                this.getFromJson(row.bvnInfo, "bvnLastName"),
              DateOfBirth: this.getDateTime(
                this.getFromJson(row.bvnInfo, "bvnDOB")
              ),
              IdentificationNumber: this.getFromJson(row.bvnInfo, "bvnNumber"),
              AccountNumber: this.getFromJson(
                row.bankInfo,
                "bankAccountNumber"
              ),
              LoanId: this.selectedloanid,
              UserId: this.currentuserid,
              Source: source,
            };

            this.loanoperationService.CrcfindCustomer(datamodel).subscribe(
              (res) => {
                this.requestLoader = false;
                this.currentSource = source;
                this.possibleResults = res.body;
              },
              (err) => {
                this.requestLoader = false;

                // swal.fire("Error", err.error, "error");
              }
            );
          } else if (partner === 2 && process === 1) {
            const datamodel = {
              MaxRecords: 10,
              MinRelevance: 0,
              BVN: this.getFromJson(row.bvnInfo, "bvnNumber"),
              SessionCode: row.identifier,
              LoanId: this.selectedloanid,
              UserId: this.currentuserid,
              Source: source,
            };

            this.loanoperationService.CrcfindCustomerbybvn(datamodel).subscribe(
              (res) => {
                this.requestLoader = false;
                this.feedbackdata =
                  "Feedback: " + res + " " + res.StatusMessage;
              },
              (err) => {
                this.requestLoader = false;

                // swal.fire("Error", err.error, "error");
              }
            );
          } else if (partner === 1 && process === 2) {
          } else if (partner === 2 && process === 2) {
          }
        }
      });
  }

  submitLoanRequest(type, loanid, customerid) {
    if (type === "LoanActivities") {
      this.requestLoader = true;

      this.loanoperationService.getActivities(type, loanid).subscribe(
        (res) => {
          this.requestLoader = false;
          this.loanactivities = res.body;
        },
        (err) => {
          this.requestLoader = false;
          // swal.fire("Error", err.error, "error");
        }
      );
    }
  }

  onLoanDateChange(datestr) {
    let date = this.getDate(datestr);
    this.loanDateError = date == false;
  }

  fetchUsers(id: any) {
    const data = {
      UserId: id,
      Num: 1000,
    };

    this.userService
      .FetchAllUsersPaginated("allusersshortdetailspaginated", data)
      .pipe(
        pluck("body", "data"),
        map((res) =>
          res?.items?.map((user) => ({
            id: user.userId,
            text: `${user.displayName} - (${user.roleName})`,
          }))
        )
      )
      .subscribe((res) => {
        this.resPersonOpts = res;
      });
  }

  getAllowedReviewers(reassignTemplate: TemplateRef<any>) {
    this.gettingReviewers = true;

    this.userService
      .getAllUsersWithPermissions("Claim Applications - Application Pool")
      .pipe(
        map((response) =>
          response.body.items.map((user) => ({
            id: user.userId,
            text: user.displayName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (res) => {
          this.resPersonOpts = res;
          this.gettingReviewers = false;
          this.openModal(reassignTemplate);
        },
        error: () => {
          this.gettingReviewers = false;
        },
      });
  }

  getUsersWithRequiredRoles(data: {
    template: TemplateRef<any>;
    loanId: number;
  }) {
    this.gettingReviewers = true;
    this.userService
      .getUsersWithRequiredRoles(data.loanId)
      .pipe(
        map((response) =>
          response.body.map((user) => ({
            id: user.userId,
            text: user.displayName,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe({
        next: (res) => {
          this.resPersonOpts = res;
          this.gettingReviewers = false;
          this.openModal(data.template);
        },
        error: () => {
          this.gettingReviewers = false;
        },
      });
  }

  getToday() {
    const dateString = new Date();
    this.currentdate = dateString;
  }

  getDateTime(date) {
    return new Date(date);
  }

  getDateDiff(date1, date2) {
    const dateOut1 = new Date(date1);
    const dateOut2 = new Date(date2);

    const timeDiff = Math.abs(dateOut2.getTime() - dateOut1.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (diffDays === 1) {
      return diffDays + " day";
    } else {
      return diffDays + " days";
    }
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

  getFullDateDiff(date1, date2) {
    const dateOut1 = new Date(date1);
    const dateOut2 = new Date(date2);
    let message = "";

    if (date1 != null && date2 != null) {
      const diff = Math.floor(dateOut1.getTime() - dateOut2.getTime());
      const day = 1000 * 60 * 60 * 24;

      const days = Math.floor(diff / day);
      const months = Math.floor(days / 31);
      const years = Math.floor(months / 12);

      if (Number.isNaN(days) || Number.isNaN(months) || Number.isNaN(years)) {
        message = "Could not calculate";
      } else {
        // message += days + " days : \n"
        message += months + "month(s) : \n";
        message += years + "year(s) ago\n";
      }
    }

    return message;
  }

  closeAside() {
    (window as any).viewLoan();
    this.loanInformation = null;
  }

  getConstants() {
    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  getAppOwnerInfo() {
    this.configurationService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.appOwnerDetails = res.body;
      });
  }

  setDate(dateContent) {
    if (dateContent !== "") {
      const now = moment();
      const future = moment(dateContent);
      const daysCount = future.diff(now, "days");
      if (daysCount < 0) {
        swal.fire(
          "Error",
          "First Repayment Date must be in the future",
          "error"
        );
        return;
      } // negative value means a past date was selected
      if (daysCount > 30) {
        swal.fire(
          "Error",
          "First Repayment date must not be more than 30 days",
          "error"
        );
        return;
      } // difference in date cannot be more than 30 days

      this.NewFirstRepaymentDate = dateContent;
    }
  }

  toggleView(type) {
    if (type == "FRDate") {
      this.NewRepaymentDateSection =
        this.NewRepaymentDateSection == true ? false : true;
    }
  }

  getLoanDetailsWithHistoryById(id: number) {
    this.selectedLoanWithHistoryId = id;
    this.getLoanWithApprovalDetails(id);

    if (!this.copy_hover) {
      this.requestLoader = true;
      this.loanoperationService
        .getLoanapplicationWithHistorybyid(id)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.selectedLoanWithHistoryLoanType =
              res.body?.currentApplication?.loanType;
            this.requestLoader = false;

            this.setupBankStatement(res.body.currentApplication.personId);

            this.LoanDetails(res.body);

            this.toggleAside();
            this.getAllReasons();
          },
          () => {
            this.requestLoader = false;
          }
        );
    }
  }

  setupBankStatement(personId) {
    this.bankStatement = null;

    this.loanoperationService.checkBankStatementStatus(personId).subscribe(
      (res) => {
        this.bankStatementAvailable = res.body.data.isAvailble;
        if (this.bankStatementAvailable) {
          var startDate = new Date();
          startDate.setMonth(
            startDate.getMonth() - res.body.data.statementLength
          );

          this.bankStatementFilter = new UntypedFormGroup({
            LoanId: new UntypedFormControl(this.loanInformation.loanId, []),
            StartDate: new UntypedFormControl(
              startDate.toISOString().substring(0, 10),
              [Validators.required]
            ),
            EndDate: new UntypedFormControl(
              new Date().toISOString().substring(0, 10),
              [Validators.required]
            ),
          });
        }
      },
      (err) => {
        this.loader = false;
        // swal.fire("Error", err.error, "error");
      }
    );
  }

  getBankStatement(form: any) {
    let appArray = this.applications.filter((x) => x.loanId == form.LoanId);
    appArray =
      appArray.length == 0
        ? this.reviewedapplications.filter((x) => x.loanId == form.LoanId)
        : appArray;

    if (appArray.length > 0) {
      let loan = appArray[0];
      this.bankStatement = null;
      this.bankBalanceLoader = true;
      this.bankStatementLoaded = false;
      var requestData = {
        PersonId: loan.personId,
        StartDate: form.StartDate,
        EndDate: form.EndDate,
      };

      this.loanoperationService.getBankStatementById(requestData).subscribe(
        (res) => {
          this.bankStatement = res.body.data;
          this.bankBalanceLoader = false;
          this.bankStatementLoaded = true;
          this.bankStatementAvailable = res.body.data.integrationActive;
        },
        (err) => {
          this.bankBalanceLoader = false;
          // swal.fire("Error", err.error, "error");
        }
      );
    }
  }

  getLoanDetailsById(id, loanViewerModal) {
    this.requestLoader = true;
    this.loanoperationService.getLoanapplicationbyid(id).subscribe(
      (res) => {
        this.requestLoader = false;
        this.loanPreview(
          this.loanInformation.person,
          res.body,
          loanViewerModal
        );
      },
      (err) => {
        this.requestLoader = false;
        // swal.fire("Error", err.error, "error");
      }
    );
  }

  toggleAside() {
    (window as any).viewLoan();
    $("#default-nav")[0]?.click();
  }

  isEmpty(value?: string) {
    return value == "" || value == null;
  }

  formatDateInput(dateContent) {
    return moment(dateContent);
  }
  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getApplications(pageNumber, filter, {
        branches: this.filterFormData.selectedBranchIds,
        loanProducts: this.filterFormData.selectedLoanIds,
      });
      return;
    }
    filter = filter.trim();
    this.pagination.searchTerm = filter === "" ? null : filter;
    this.getApplications(pageNumber, filter, {
      branches: this.filterFormData.selectedBranchIds,
      loanProducts: this.filterFormData.selectedLoanIds,
    });
  }

  getItemsPaginatedSearch2(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.pagination2.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getReviewedApplications(pageNumber, filter, {
        branches: this.filterFormData.selectedBranchIds,
        loanProducts: this.filterFormData.selectedLoanIds,
      });
      return;
    }
    filter = filter.trim();
    this.pagination2.searchTerm = filter === "" ? null : filter;
    this.getReviewedApplications(pageNumber, filter, {
      branches: this.filterFormData.selectedBranchIds,
      loanProducts: this.filterFormData.selectedLoanIds,
    });
  }
  getItemsPaginatedSearch3(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.pagination3.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getAllClaimedApplications(pageNumber, filter, {
        branches: this.filterFormData.selectedBranchIds,
        loanProducts: this.filterFormData.selectedLoanIds,
      });
      return;
    }
    filter = filter.trim();
    this.pagination3.searchTerm = filter === "" ? null : filter;
    this.getAllClaimedApplications(pageNumber, filter, {
      branches: this.filterFormData.selectedBranchIds,
      loanProducts: this.filterFormData.selectedLoanIds,
    });
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentuser = user.body;
          this.currentuserid = this.currentuser.userId;
          this.currentuserbranchid = this.currentuser.branchId;
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  printThisDocument(content, reporttype) {
    const host = window.location.host;

    let printContents = null,
      popupWin = null,
      title = null,
      data = null;
    switch (reporttype) {
      case "to_be_printed":
        printContents = document.getElementById(content).innerHTML;
        title =
          this.loanhistoryinformation.applicationCode + "_Loan_Information";
        data = this.loanhistoryinformation;
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

                  .row {
                    display: -ms-flexbox;
                    display: flex;
                    -ms-flex-wrap: wrap;
                    flex-wrap: wrap;
                    // margin-right: -1.6rem;
                    // margin-left: -1.6rem
                }

                .black {
                  color: #000;
               }

              .orange {
                  color: #ff015b;
                }


            .f-12 {
              font-size: 12px
              }

              .mb-1,
              .my-1 {
                  margin-bottom: .4rem !important
              }



                  .col-md-6 {
                    -ms-flex: 0 0 50%;
                    flex: 0 0 50%;
                    max-width: 50%
                }

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
      popupWin.document.print();
      popupWin.document.close();
    }
  }

  getTotalSection(type, arrayinput, expectedResult) {
    let total = 0;

    if (type === "repayments") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          if (arrayinput[i].paymentTypeString == "Repayment") {
            total += arrayinput[i].paymentAmount;
          } else if (
            arrayinput[i].paymentTypeString == "Reversal" ||
            arrayinput[i].paymentTypeString == "Refund"
          ) {
            total -= arrayinput[i].paymentAmount;
          }
        }
      }
    }

    if (expectedResult === "formatted") {
      return total.toLocaleString(undefined, { minimumFractionDigits: 2 });
    } else {
      return total;
    }
  }

  recallLoan(modal: any) {
    this.recallLoanFormInit();
    this.openModal(modal);
    // this.closeAside();
  }

  recallSingleLoan() {
    this.loader = true;
    let pin = this.RecallLoanForm.value.transactionPin;

    const data = {
      transactionPin: this.encrypt.encrypt(pin),
      userId: this.currentuserid,
      loans: [this.loanInformation.loanId],
    };

    this.loanoperationService.recallSingleLoan(data).subscribe(
      (res) => {
        this.modalService.dismissAll();

        this.getLoanDetailsWithHistoryById(this.loanInformation.loanId);
        swal.fire("Success", res.message, "success");
        this.loader = false;
        this.getReviewedApplications();
      },
      (err: any) => {
        this.loader = false;
        // swal.fire('Error', err.error.message, 'error');
      }
    );
  }

  toggleRecallLoansCheck() {
    this.loansToRecall.length = 0;
    this.recallMultiLoans = !this.recallMultiLoans;
  }

  toggleLoansToRecall(e: any) {
    let id = e.target.value;
    let loan: any = this.reviewedapplications.find((x) => x.loanId == id);
    if (e.target.checked) {
      this.loansToRecall.push(loan);
    } else {
      let ind = this.loansToRecall.findIndex((x) => x.loanId == loan.loanId);
      if (ind !== -1) {
        this.loansToRecall.splice(ind, 1);
      }
    }
  }

  callRecallMultiLoansPin(modal: any) {
    this.loansToRecallId = [];
    this.loansToRecall.forEach((item) => {
      this.loansToRecallId.push(item.loanId);
    });
    this.recallMultiLoanFormInit();
    this.openModal(modal);
  }
  recallSelectedLoans() {
    let pin = this.RecallMultiLoanForm.value.transactionPin;
    const data = {
      transactionPin: this.encrypt.encrypt(pin),
      userId: this.currentuserid,
      loans: this.loansToRecallId,
    };

    this.loader = true;
    this.loanoperationService.recallSingleLoan(data).subscribe(
      (res) => {
        this.recallMultiLoans = false;
        this.loansToRecall = [];
        this.loansToRecallId = [];
        this.modalService.dismissAll();

        swal.fire("Success", res.message, "success");
        this.loader = false;
        this.getReviewedApplications();
      },
      (err: any) => {
        this.loader = false;
        // swal.fire('Error', err, 'error');
      }
    );
  }
  filterModalOpen() {
    //this.ResetReportAsideContent();

    this.showPopup = true;

    $(".filter-menu").toggle();

    if (!this.filterForm) {
      this.filterFormInit();
    }
    this.loadFilterDropdownData();
  }
  filterFormInit() {
    this.filterForm = new UntypedFormGroup({
      // BranchId: new FormControl(this.userInfo.branchId, [Validators.required]),
      BranchesList: new UntypedFormControl(""),
      LoanTypeList: new UntypedFormControl(""),
    });
  }

  closeFilterModal() {
    $(".filter-menu").toggle();
  }

  loadFilterDropdownData() {
    const datamodel = { filter: "", UserId: this.loggedInUser.nameid };
    this.configurationService.spoolAccessibleBranches(datamodel).subscribe(
      (response) => {
        this.filterFormData.branchesAccessibleArray = response.body.map(
          (item) => {
            return { id: item.branchId, text: item.branchName };
          }
        );
        this.requestLoader = false;
      },
      (error) => {
        // swal.fire('Error', error.error, 'error');
      }
    );

    this.configurationService.spoolAccessibleLoanTypes(datamodel).subscribe(
      (response) => {
        this.filterFormData.loantypesArray = response.body.map((item) => {
          return { id: item.loanTypeId, text: item.loanName };
        });
      },
      (error) => {
        // swal.fire('Error', error.error, 'error');
      }
    );
  }

  filterLoans(tab, pageNum = this.pagination.pageNum, filter = null) {
    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    if (this.filterForm.valid) {
      this.loader = true;
      this.getConstants();

      if (tab === "open") {
        this.getItemsPaginatedSearch(
          this.pagination.searchTerm,
          this.pagination.pageSize,
          1
        );
      } else if (tab === "reviewed") {
        this.getItemsPaginatedSearch2(
          this.pagination.searchTerm,
          this.pagination.pageSize,
          1
        );
      } else if (tab === "all") {
        this.getItemsPaginatedSearch3(
          this.pagination.searchTerm,
          this.pagination.pageSize,
          1
        );
      }
    }

    this.closeFilterModal();
  }

  selected(type, data, index) {
    if (type === "OutputType") {
      this.filterFormData.selectedOutputType = data.id;
    } else if (type === "AccessibleBranch") {
      if (this.filterFormData.selectedBranchIds.includes(data.id)) return;
      this.filterFormData.selectedBranchIds.push(data.id);
      this.filterFormData.selectedBranches.push({ ...data, type: "branch" });
    } else if (type === "LoanTypes") {
      if (this.filterFormData.selectedLoanIds.includes(data.id)) return;
      this.filterFormData.selectedLoanIds.push(data.id);
      this.filterFormData.selectedLoans.push({ ...data, type: "loan" });
    } else if (type === "Users") {
      this.reassignReviewerForm.get("assignedUserId").patchValue(data?.id);
    }
  }

  removed(type, data) {
    if (type === "Branch") {
      // this.selectedBranchID.splice(this.selectedRejectionReasonsIDs.indexOf(data.id), 1);
    } else if (type === "AccessibleBranch") {
      if (!this.filterFormData.selectedBranchIds.includes(data.id)) return;
      this.filterFormData.selectedBranchIds.splice(
        this.filterFormData.selectedBranchIds.indexOf(data),
        1
      );
    } else if (type === "LoanTypes") {
      if (!this.filterFormData.selectedLoanIds.includes(data.id)) return;
      this.filterFormData.selectedLoanIds.splice(
        this.filterFormData.selectedLoanIds.indexOf(data),
        1
      );
    } else if (type === "Users") {
      this.reassignReviewerForm.get("assignedUserId").patchValue(null);
    }
  }

  canUseCrc() {
    return this.getFromJson(
      this.ownerInformation.appOwnerCreditRegistryInfo,
      "IsActive"
    );
  }

  canSendCalendlyNotification() {
    return (
      this.loanInformation?.person?.emailAddress &&
      this.currentuser?.permission?.includes("Send Calendly Notification")
    );
  }

  sendCalendlyEmail() {
    this.sendCalendlyLoader = true; // sendcalendlynotification
    if (this.loanInformation?.person?.emailAddress) {
      this.loanoperationService
        .sendCalendlyNotification(this.loanInformation?.person?.emailAddress)
        .subscribe(
          (res) => {
            this.sendCalendlyLoader = false;
            swal.fire("Successful", res.body.message, "success");
          },
          (err) => {
            this.sendCalendlyLoader = false;
            swal.fire("Error", err.message, "error");
          }
        );
    } else {
      this.sendCalendlyLoader = false;
      swal.fire(
        "Calendly Notification",
        "Customer does not have a valid email address",
        "warning"
      );
    }
  }

  viewRepaymentSchedule(content) {
    this.repaymentLoader = true;
    this.repaymentScheduleArray = [];
    const Amount = this.loanInformation.loanAmount;
    const NetIncome = this.getFromJson(
      this.loanInformation?.employmentInfo,
      "netIncome"
    );
    const Duration = this.loanInformation?.loanTenor;
    const LoanType = this.loanInformation?.loanTypeId;
    const InterestRate = this.getFromJson(
      this.loanInformation?.loanTypeInfo,
      "loanInterestRate"
    );
    const loanStartDate = this.loanInformation?.loanStartDate;
    const RepaymentDate = this.isEmpty(this.NewFirstRepaymentDate)
      ? this.loanInformation.preferredFirstRepaymentDate
      : this.NewFirstRepaymentDate;
    const UserPreferredFeeChanges = this.feelines;
    if (Amount > 0 && NetIncome && Duration && LoanType) {
      this.configurationService
        .getRepaymentSchedule({
          NetIncome,
          Amount,
          LoanType,
          Duration,
          RepaymentDate,
          InterestRate,
          loanStartDate,
          UserPreferredFeeChanges,
        })
        .subscribe(
          (res) => {
            this.repaymentLoader = false;
            this.scheduleInformation = res.body;
            this.repaymentScheduleArray = res.body.repaymentSchedule;
            if (!this.modalService.hasOpenModals()) {
              this.openModal(content);
            }
          },
          (err) => {
            this.repaymentLoader = false;
            // this.toast.fire({
            //   type: 'warning',
            //   title: 'Error: ',
            //   text: err.error
            // });
          }
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

  updateInterestRate(value: number) {
    if (value > 0) {
      this.updateLoanInterestLoader = true;
      this.loanoperationService
        .updateLoanInterestRate({
          loanId: this.loanInformation.loanId,
          interest: value,
        })
        .subscribe(
          (res) => {
            this.updateLoanInterestLoader = false;
            this.changeInterest = false;
            this.getLoanDetailsWithHistoryById(this.loanInformation.loanId);
            Swal.fire("Successful", "Update was successful", "success");
          },
          (err) => {
            this.updateLoanInterestLoader = false;
            Swal.fire("error", err.error, "error");
          }
        );
    }
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Application code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  onOpenEditModal(template: TemplateRef<any>) {
    this.modalService.open(template, {
      size: "md",
      ariaLabelledBy: "modal-basic-title",
      centered: true,
    });
  }

  getLoanWithApprovalDetails(id: number) {
    this.gettingLoanWithApprovalDetails = true;

    this.loanoperationService
      .getLoanWithApprovalDetails(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.loanWithApprovalWorkflow = res.body.data;
          if (this.loanWithApprovalWorkflow?.approvalFlow?.length) {
            this.isMultiLevelApproval = true;
          }

          this.gettingLoanWithApprovalDetails = false;
        },
        error: () => {
          this.gettingLoanWithApprovalDetails = false;
        },
      });
  }

  onReviewMultiLevelApprovalLoan(status: string) {
    this.AddResponseForm.get("loanApprovalAction").setValue(status);
    this.AddResponseForm.get("LoanId").setValue(this.selectedLoanWithHistoryId);
    const transactionPin = this.AddResponseForm.value["TransactionPin"];
    const comment = this.AddResponseForm.value["InternalNote"];

    delete this.AddResponseForm.value["TransactionPin"];

    this.loader = true;

    const payload = this.AddResponseForm.value;

    this.loanoperationService
      .reviewLoanWithApprovalWorkflow(
        { ...payload, comment, redraftReasonIds: this.selectedReasons },
        transactionPin
      )
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.loader = false;
          this.toast.fire({
            type: "success",
            title: "Loan reviewed successfully!",
          });
          this.closeAside();
          this.switchviews(this.currentview, true);
        },
        error: () => {
          this.loader = false;
        },
      });
  }

  onLoanEdited() {
    this.closeAside();
    this.switchviews(this.currentview, true);
  }

  setFilterParams(filterParams: FilterParams) {
    this.filterParams = removeNullUndefinedWithReduce({
      ...filterParams,
      loanProducts: (filterParams?.loanProducts as number[])?.join(","),
      branches: (filterParams?.branches as number[])?.join(",")
    });
    this.switchviews(this.currentview, true);
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
