import {
  Component,
  OnInit,
  ChangeDetectorRef,
  TemplateRef,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { LoanoperationsService } from "../../../service/loanoperations.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { Configuration } from "../../../model/configuration";
import swal from "sweetalert2";
import { DomSanitizer } from "@angular/platform-browser";
import {
  Router,
  ActivatedRoute,
  ParamMap,
  NavigationExtras,
} from "@angular/router";
import {
  UntypedFormGroup,
  Validators,
  UntypedFormControl,
  UntypedFormBuilder,
} from "@angular/forms";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { map, pluck, take, takeUntil } from "rxjs/operators";
import { SharedService } from "src/app/service/shared.service";
import { CustomDropDown, PillFilters } from "src/app/model/CustomDropdown";
import {
  DeactivatedApplication,
  FailedDisbursement,
  FailedDisbursementApplication,
  GetAwaitingPoolApprovalLoans,
  GetLoanApplicationsReq,
  LoanApplicationPaginationModel,
  LoanApplicationStages,
  LoanAppsPageCurrentView,
  LoanSearchParam,
  OpenLoanApplication,
  OpenOrReviewedClaimedApplication,
} from "../loan.types";
import {
  ActionConfig,
  FilterTypes,
  LegacyPaginatedResponse,
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
  TableStatusClassProps,
  TableSubTab,
} from "../../shared/shared.types";
import { DecimalPipe } from "@angular/common";
import {
  VerifyBankAccount,
  VerifyBankAccountRes,
} from "../../configuration/models/configuration";
import Swal from "sweetalert2";
import { removeNullUndefinedWithReduce } from "../../shared/helpers/generic.helpers";
import { Store } from "@ngrx/store";
import { AppWideState } from "src/app/store/models";
import { clearFilters } from "src/app/store/actions";
import { GrowthbookService } from "src/app/service/growthbook.service";
import GrowthBookFeatureTags from "src/app/model/growthbook-features";
@Component({
  selector: "app-loanapplications-page",
  templateUrl: "./loanapplications-page.component.html",
  styleUrls: ["./loanapplications-page.component.scss"],
})
export class LoanapplicationsPageComponent implements OnInit, OnDestroy {
  @ViewChild("addAccountUpdateModal") addAccountUpdateModal: ElementRef;
  public AddTopUpForm: UntypedFormGroup;
  public loggedInUser: any;
  sideview: any;
  currentuser: any;
  currentuserid: any;
  currentuserbranchid: any;
  currentView: LoanAppsPageCurrentView;
  LoanAppsPageCurrentView = LoanAppsPageCurrentView;
  requestLoader: boolean;
  loader = false;
  viewloandetails: boolean;
  loaninformation: any;
  loanactivities: any;
  userLoanApplications: OpenLoanApplication[];
  allLoanApplications: OpenOrReviewedClaimedApplication[];
  supervisorloanapplications: Configuration[];
  deactivatedApplications: DeactivatedApplication[];
  currentdate: any;
  currentFileUrl: any;
  currentFileType: any;
  currentFileDownloadUrl: any;
  ownerInformation: any;
  selectedstatus: any;
  searchrequestLoader: boolean;
  loanSearchResult: any[];
  selectedLoan: any;
  topuplines: any[] = [];
  tenorArray: any[];
  failedDisbursements: FailedDisbursementApplication[] = [];
  preferredTenor: any;
  topupeligible = false;
  showProceedButton = false;

  selectedNewLoanAmount: number;
  showProductChangeSection = false;
  showProductInformationSection = false;

  loanProductsArray: any[];
  preferredLoanType: any;
  feelines: any;

  public DeactivationForm: UntypedFormGroup;

  /**
   * @deprecated don't use this type use paginationV2 instead
   */
  pagination = {
    pageNumber: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    filter: null,
    status: null,
  };

  paginationV2: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
  };

  topUpReturnInformation = {
    interestRate: null,
    dsr: 10,
    loanTypeParameterUsed: Infinity,
    tenorAllowable: null,
    categoryValueUsed: false,
    result: false,
    resultMessage: "",
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

  getParams = {
    view: null,
    code: null,
  };

  tenorForSelectedLoan: number;

  showtenorSection = false;
  topUpLoanAmount: number;
  topUpTenor: any;
  topUpNetIncome: any;

  //bank update
  bankUpdateForm: UntypedFormGroup;
  bankList: any[] = [];
  bankInfo?: VerifyBankAccountRes;
  verifyloader: boolean;
  public toast = swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    // timer: 3000
  });

  VIEW_OPEN_LOAN_APPLICATIONS = [
    "Pool",
    "Draft",
    "Claimed",
    "Submitted",
    "Redraft",
    "DeactivationRequestSent",
  ];

  VIEW_ALL_LOAN_APPLICATIONS = [
    "Pool",
    "Draft",
    "Claimed",
    "Approved",
    "Rejected",
    "Submitted",
    "Redraft",
    "DisburserClaimed",
    "DisbursementRequestSent",
    "DisbursementFailed",
    "Disbursed",
    "Paid",
    "DeactivationRequestSent",
    "Deactivated",
  ];

  rawFilters = {
    VIEW_ALL_LOAN_APPLICATIONS: [
      "Pool", // pool
      "Draft", // draft
      "Claimed", // claimed
      "Approved", // approved
      "Rejected", // rejected
      "Submitted", // submitted
      "Redraft", // redraft
      "DisburserClaimed", // disburserclaimed
      "DisbursementRequestSent", // disbursement-request-sent
      "DisbursementFailed", // disbursement-failed
      "Disbursed", // disbursed
      "Paid", // paid
      "DeactivationRequestSent", // deactivation-request-sent
      "Deactivated", // deactivated
    ],
    VIEW_OPEN_LOAN_APPLICATIONS: [
      "Pool",
      "Draft",
      "Claimed",
      "Submitted",
      "Redraft",
      "DeactivationRequestSent",
    ],
  };
  decodedRepaymentType: any;

  filters: any = {};
  selectedFilter = {
    VIEW_ALL_LOAN_APPLICATIONS: [],
    VIEW_OPEN_LOAN_APPLICATIONS: [],
  };

  tempBankDetails: any;
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  currentLoanApplicationId: any;

  repaymentLoader = false;
  public repaymentScheduleArray: any[] = [];
  scheduleInformation: any;
  copy_hover = false;
  searchByCol = [
    "Loan Code",
    "First Name",
    "Last Name",
    "BVN",
    "Email",
    "Phone Number",
  ];
  selectedSearchCol: string;
  loanAppConfig: TableConfig = {
    uniqueIdPropLink: "code",
    searchPlaceholder: "Code or Name",
    legacySearch: true,
    striped: true,
    rowClickable: true,
  };
  loanAppHeaders: TableHeader[] = [];

  loanAppData: TableData[] = [];

  paginationModel: LoanApplicationPaginationModel;
  paginationModelV2: GetLoanApplicationsReq;
  searchColumns: string[] = [];
  selectedFilters: CustomDropDown;
  openAside = false;
  LOANAPPLICATIONSTAGES = LoanApplicationStages;
  teamLeadView: "submitted" | "open" | "closed" = "submitted";
  tableSubTabs: TableSubTab[] = [];
  verifyingAltPhoneNo = false;
  customerAltPhoneNumber: string;
  useNewFilter = true;
  filterTypes: FilterTypes[] = [];
  FILTER_TYPES = FilterTypes;
  filterStatuses: CustomDropDown[] = [];
  clearFilterSelections = false;

  constructor(
    private configurationService: ConfigurationService,
    private loanoperationService: LoanoperationsService,
    public authService: AuthService,
    private userService: UserService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private fb: UntypedFormBuilder,
    private router: Router,
    private configService: ConfigurationService,
    private colorThemeService: ColorThemeService,
    private sharedService: SharedService,
    private decimalPipe: DecimalPipe,
    private store: Store<AppWideState>,
    private growthbookService: GrowthbookService
  ) {}

  ngOnInit() {
    this.removePill();
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.sideview = 0;
    this.feelines = [];
    this.viewloandetails = false;
    this.tokenRefreshError.tokenNeedsRefresh
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (!res) {
          // this.httpFailureError = true;
        }
      });
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.AddDeactivationFormInit();
    this.AddTopUpFormInit();

    this.getUserPromise()
      .then((next) => {
        const params = this.route.snapshot.params;
        this.getParams.view = params["view"];
        this.getParams.code = params["code"];

        if (this.getParams.view === "myapplications") {
          this.currentView = LoanAppsPageCurrentView.OpenLoanApplications;
          this.switchView(this.currentView);

          if (this.getParams.code != null) {
            this.getLoanDetails(this.getParams.code);
          }
        } else if (this.getParams.view === "allapplication") {
          this.currentView = LoanAppsPageCurrentView.AllLoanApplications;
          this.switchView(this.currentView);
        } else if (this.getParams.view === "failedapplications") {
          this.currentView = LoanAppsPageCurrentView.FailedDisbursements;
          this.switchView(this.currentView);
        } else {
          this.currentView = LoanAppsPageCurrentView.OpenLoanApplications;
          this.switchView(this.currentView);
        }
        this.getApplicationownerinformation();
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        // ;
      })
      .catch((err) => {
        // if (this.httpFailureError) { swal.fire('Error', 'User not Loaded', 'error'); }
      });

    this.paginationModel = {
      userId: this.currentuserid,
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      resultExpected: "Open",
    };

    this.paginationModelV2 = {
      pageNumber: this.paginationV2.pageNumber,
      pageSize: this.paginationV2.pageSize,
    };
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters: PillFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          delete this.paginationModel["status"];
          delete this.pagination["status"];
          delete this.paginationModel["filter"];
          delete this.pagination["filter"];
          this.switchView(this.currentView);
        }
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

  downloadfile() {
    window.open(this.currentFileDownloadUrl, "_blank");
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  closeModalSchedule() {
    this.closeModal();
    this.toggleAside();
  }

  AddDeactivationFormInit() {
    this.DeactivationForm = new UntypedFormGroup({
      Reason: new UntypedFormControl(""),
      Status: new UntypedFormControl(""),
      UserId: new UntypedFormControl(this.currentuserid),
      LoanId: new UntypedFormControl(""),
      TransactionPin: new UntypedFormControl("", [Validators.required]),
    });
  }

  trimWhitespace(control: string) {
    this.AddTopUpForm.get(control).setValue(
      this.AddTopUpForm.value[control].trim()
    );
  }

  AddTopUpFormInit() {
    this.AddTopUpForm = this.fb.group({
      SearchParam: new UntypedFormControl("", [
        Validators.required,
        Validators.pattern(/^\S.*$/),
      ]),
      Tenor: new UntypedFormControl(""),
      LoanAmount: new UntypedFormControl("", [Validators.required]),
      NetIncome: new UntypedFormControl(""),
      LoanTypeId: new UntypedFormControl(""),
      LoanId: new UntypedFormControl(""),
      PersonId: new UntypedFormControl(""),
    });

    this.AddTopUpForm.get("LoanAmount")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (value) => {
          this.registerNewLoanAmount(+value);
        },
      });

    this.AddTopUpForm.get("SearchParam")
      .valueChanges.pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.loanSearchResult = null;
        },
      });
  }

  openModal(content, id) {
    this.currentLoanApplicationId = id;
    this.modalService.open(content, { ariaLabelledBy: "modal-basic-title" });
  }

  triggerModal(type, content) {
    if (type == "topup-unknown") {
      this.modalService.open(content, {
        size: "lg",
        ariaLabelledBy: "modal-basic-title",
      });
    } else if (type == "topup-known") {
      this.modalService.dismissAll();
      this.modalService.open(content, {
        size: "lg",
        ariaLabelledBy: "modal-basic-title",
      });
    }
  }

  toggleDeactivationModal(id, content) {
    this.requestLoader = false;
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2",
      size: "lg",
    });
  }
  pushtoSelectedLoan(row, type, newmodaltype, newmodalcontent) {
    this.selectedLoan === "";
    this.selectedLoan = row;
    this.topuplines = [];
    this.addLoanRow(type);

    this.tenorForSelectedLoan =
      row?.loanTypeTenor > 0 ? row?.loanTypeTenor : row?.loanTenor;

    this.triggerModal(newmodaltype, newmodalcontent);
  }

  addLoanRow(type) {
    if (this.selectedLoan === "") {
      this.loader = false;
      this.requestLoader = false;

      swal.fire({
        type: "info",
        title: "Empty Search Box",
        text: "Please select the loan you want to register a top-up for and try again",
      });
    } else {
      if (type === "single") {
        // tslint:disable-next-line:max-line-length
        this.topuplines.push({
          LoanId: this.selectedLoan.loanId,
          PersonId: this.selectedLoan.personId,
          LoanAmount: this.selectedLoan.loanAmount,
          LoanCode: this.selectedLoan.loanCode,
          CustomerName: this.selectedLoan.customer,
          LastPaymentDate: this.selectedLoan.lastPaymentDate,
          LoanType: this.selectedLoan.loanType,
          LoanTypeId: this.selectedLoan.loanTypeId,
          AmountDue: this.selectedLoan.totalRepaymentOutstanding,
          NetIncome: parseFloat(this.selectedLoan.netIncome),
        });

        // tslint:disable-next-line:max-line-length
      } else {
        this.showProceedButton = true;
        this.topuplines.push({
          LoanId: this.selectedLoan.loanId,
          PersonId: this.selectedLoan.personId,
          LoanAmount: this.selectedLoan.loanAmount,
          LoanCode: this.selectedLoan.loanCode,
          CustomerName: this.selectedLoan.customer,
          LastPaymentDate: this.selectedLoan.lastPaymentDate,
          LoanType: this.selectedLoan.loanType,
          LoanTypeId: this.selectedLoan.loanTypeId,
          AmountDue: this.selectedLoan.totalRepaymentOutstanding,
          NetIncome: parseFloat(this.selectedLoan.netIncome),
        });
      }
    }
  }

  LoanDetails(loaninformation) {
    this.loaninformation = loaninformation;
    if (this.loaninformation?.residentialInfo) {
      this.loaninformation = {
        ...this.loaninformation,
        _residentialInfo: JSON.parse(this.loaninformation.residentialInfo),
      };
    }
    this.loaninformation.customerImageUrl =
      this.loaninformation.customerImageUrl ||
      "assets/images/male-default-profile.png";
    this.viewloandetails = true;

    const incomingFeeLines = JSON.parse(
      this.loaninformation?.loanTypeInfo
    ).FeesUsed;
    if (incomingFeeLines != null) {
      this.feelines = incomingFeeLines;
    }

    $(".notify")
      .delay(400)
      .fadeIn(function () {
        $(".notify")
          .animate(
            {
              width: "450",
              left: 0,
            },
            2000
          )
          .animate({ top: 0 });
      });

    // this.selectedloanid = loaninformation.loanId;
    this.loanactivities = [];
  }

  getFromJson(stringArray, expectedResult) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  selected(type, data, index) {
    if (type === "Tenor") {
      this.preferredTenor = data.id;
    } else if (type === "Product") {
      this.preferredLoanType = data.id;
      this.getLoanCalculationParamters(this.preferredLoanType);
    }
  }

  statusCheck(response) {
    if (response === "v3kre87") {
      this.selectedstatus = "DeactivationRequestSent";
    } else if (response === "dfe3df") {
      this.selectedstatus = "DeactivationRejected";
    } else if (response === "nkfjre") {
      this.selectedstatus = "DeactivationApproved";
    }
  }

  clearFilter() {
    delete this.pagination.status;
    delete this.paginationModel["status"];
    this.selectedFilters = null;
  }

  clearPagination() {
    this.paginationModel = {
      userId: this.currentuserid,
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };
    this.pagination["keyword"] = "";

    this.paginationV2 = {
      ...this.paginationV2,
      pageNumber: 1,
      pageSize: 10,
      selectedSearchColumn: "",
      keyword: "",
    };
  }

  switchView(view: LoanAppsPageCurrentView, retainStatus = false, clearFilterSelections = false) {
    this.currentView = view;
    this.clearFilterSelections = clearFilterSelections;
    if (this.clearFilterSelections) {
      this.store.dispatch(clearFilters());
    }
    if (this.tableSubTabs.length > 0) {
      this.tableSubTabs = [];
    }
    if (this.currentView !== view) {
      this.clearPagination();
    }
    !retainStatus && this.clearFilter();
    if (view === LoanAppsPageCurrentView.AllLoanApplications) {
      this.filterTypes = [
        this.FILTER_TYPES.Status,
        this.FILTER_TYPES.Branch,
        this.FILTER_TYPES.LoanProduct,
      ];
      this.getAllApplications();
    } else if (view === LoanAppsPageCurrentView.OpenLoanApplications) {
      this.filterTypes = [
        this.FILTER_TYPES.Status,
        this.FILTER_TYPES.Branch,
        this.FILTER_TYPES.LoanProduct,
      ];
      this.getLoanApplicationsByType(this.LOANAPPLICATIONSTAGES.open);
    } else if (view === LoanAppsPageCurrentView.ReviewedLoanApplications) {
      this.getLoanApplicationsByType(this.LOANAPPLICATIONSTAGES.closed);
    } else if (view === LoanAppsPageCurrentView.DeactivatedLoanApplications) {
      this.filterTypes = [
        this.FILTER_TYPES.Branch,
        this.FILTER_TYPES.LoanProduct,
      ];
      this.getDeactivatedApplications();
    } else if (view === LoanAppsPageCurrentView.FailedDisbursements) {
      this.filterTypes = [
        this.FILTER_TYPES.Branch,
        this.FILTER_TYPES.LoanProduct,
      ];
      this.getFailedDisbursements();
    } else if (view === LoanAppsPageCurrentView.AwaitingPoolApproval) {
      if (this.teamLeadView === "submitted") {
        this.filterTypes = [
          this.FILTER_TYPES.Branch,
          this.FILTER_TYPES.LoanProduct,
        ];
      } else {
        this.filterTypes = [
          this.FILTER_TYPES.Status,
          this.FILTER_TYPES.Branch,
          this.FILTER_TYPES.LoanProduct,
        ];
      }
      this.getAwaitingPoolApprovalLoans();
    }
  }

  setFilterParams($event) {
    this.paginationV2["filterParams"] = removeNullUndefinedWithReduce({
      ...$event,
      loanProducts: ($event?.loanProducts as number[])?.join(","),
      branches: ($event?.branches as number[])?.join(",")
    });
    this.clearFilterSelections = false;
    this.switchView(this.currentView);
  }

  switchSubTab($event) {
    this.clearFilterSelections = true;

    if (
      $event === "OpenLoanApplications" ||
      $event === "ReviewedLoanApplications"
    ) {
      this.switchView(LoanAppsPageCurrentView[$event]);
    }

    if (this.currentView === LoanAppsPageCurrentView.AwaitingPoolApproval) {
      this.paginationModelV2.statuses = $event;
      this.switchTeamLeadViews(
        LoanAppsPageCurrentView.AwaitingPoolApproval,
        $event,this.clearFilterSelections
      );
    }
  }

  switchTeamLeadViews(
    view: LoanAppsPageCurrentView,
    tab: "submitted" | "open" | "closed",
    clearFilterSelections = false
  ) {

    this.teamLeadView = tab;
    this.paginationV2["status"] = this.teamLeadView;
    this.paginationModelV2.statuses = this.teamLeadView;

    if (this.teamLeadView === "submitted") {
      this.paginationModelV2.resultExpected = null;
    } else if (this.teamLeadView === "open") {
      this.paginationModelV2.statuses = "";
      this.paginationModelV2.resultExpected = LoanApplicationStages.open;
      this.filters = [
        "Pool",
        "Draft",
        "Claimed",
        "Submitted",
        "Redraft",
        "Approved",
        "DeactivationRequestSent",
      ];
    } else if (this.teamLeadView === "closed") {
      this.paginationModelV2.statuses = "";
      this.paginationModelV2.resultExpected = LoanApplicationStages.closed;
      this.filters = ["Rejected", "Disbursed"];
    }
    this.switchView(view,false,clearFilterSelections);
  }

  submitLoanRequest(type, loanid?, loancode?, event?: Event) {
    event?.stopPropagation();

    if (type === "LoanActivities") {
      this.requestLoader = true;

      this.loanoperationService
        .getActivities(type, loanid)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.requestLoader = false;
            this.loanactivities = res.body;
          },
          (err) => {
            this.requestLoader = false;

            //  swal.fire('Error', err.error, 'error');
          }
        );
    } else if (type === "LoanApproval") {
      // tslint:disable-next-line:max-line-length
      swal
        .fire({
          type: "info",
          text:
            "Your are about to submit loan application: " +
            loancode +
            " to the application pool",
          title: "Loan Approval",
          showCancelButton: true,
          cancelButtonColor: "#B85353",
          cancelButtonText: "Abort",
          confirmButtonText: "Proceed",
          confirmButtonColor: "#558E90",
        })
        .then((result) => {
          if (result.value) {
            this.requestLoader = true;

            const datamodel = {
              UserId: this.currentuserid,
              LoanId: loanid,
            };
            this.loanoperationService
              .approveLoan(datamodel)
              .pipe(takeUntil(this.unsubscriber$))
              .subscribe(
                (res) => {
                  this.switchView(LoanAppsPageCurrentView.OpenLoanApplications);
                  swal.fire({
                    type: "success",
                    text: res.body.value.feedbackmessage,
                    title: "Successful",
                  });

                  this.requestLoader = false;
                },
                (err) => {
                  this.requestLoader = false;

                  //  swal.fire('Error', err.error, 'error');
                }
              );
          }
        });
    } else if (type === "TopUpEligibility") {
      this.requestLoader = true;
      var topUpProductId =
        this.preferredLoanType == null
          ? this.selectedLoan.loanTypeId
          : this.preferredLoanType;
      this.AddTopUpForm.controls["LoanTypeId"].patchValue(topUpProductId);
      this.AddTopUpForm.controls["Tenor"].patchValue(this.preferredTenor);
      this.AddTopUpForm.controls["LoanId"].patchValue(this.selectedLoan.loanId);
      this.AddTopUpForm.controls["PersonId"].patchValue(
        this.selectedLoan.personId
      );
      if (this.AddTopUpForm.controls["NetIncome"].value === "") {
        this.AddTopUpForm.controls["NetIncome"].patchValue(
          this.topuplines[0].NetIncome
        );
      }

      this.topUpNetIncome = this.AddTopUpForm.controls["NetIncome"].value;

      this.loanoperationService
        .checkTopUpEligibility(this.AddTopUpForm.value)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.requestLoader = false;
            //   swal.fire({ type: 'success', text: res.body + ", Click Process TopUp  to proceed", title: 'Successful'});

            this.topupeligible = true;

            this.topUpTenor = this.preferredTenor;

            swal
              .fire({
                text: res.body + ", Click Process TopUp  to proceed",
                type: "success",
                showCancelButton: true,
                confirmButtonColor: "#558E90",
                cancelButtonColor: "#B85353",
                confirmButtonText: "Process TopUp Now",
                cancelButtonText: "Review Loan Amount",
              })
              .then((result) => {
                if (result.value) {
                  this.modalService.dismissAll();
                  this.loanoperationService.fromTopupCreation$.next(true);
                  this.router.navigate(
                    [
                      "/loan/redraft-loan/" +
                        this.selectedLoan.loanId +
                        "/topup/" +
                        this.topUpLoanAmount +
                        "/" +
                        this.topUpTenor +
                        "/" +
                        this.topUpNetIncome +
                        "/" +
                        topUpProductId,
                    ],
                    { skipLocationChange: true }
                  );
                }
              });
          },
          (err) => {
            this.requestLoader = false;
            this.topupeligible = false;
          }
        );
    }
  }

  setSelectedFilters() {
    this.sharedService.selectedFilters$.next({
      filters: [[{ ...this.selectedFilters, type: "status" }]],
      action: "add",
      headers: ["Statuses"],
    });
  }

  getAllApplications() {
    this.requestLoader = true;
    this.paginationModelV2 = removeNullUndefinedWithReduce({
      pageNumber: this.paginationV2.pageNumber,
      pageSize: this.paginationV2.pageSize,
      selectedSearchColumn: this.paginationV2.selectedSearchColumn,
      keyword: this.paginationV2.keyword,
      filter: this.paginationModel["filter"],
      status: this.paginationV2["status"]
    });

    if (this.paginationV2["filterParams"]) {
      this.paginationModelV2 = {
        ...this.paginationModelV2,
        ...this.paginationV2["filterParams"],
      };
    }

    this.loanoperationService
      .getAllApplications(this.paginationModelV2)
      .pipe(
        map((response) => {
          response.body.items = response.body.items.map((loanApplications) => {
            if (loanApplications.loanStage === "Settled") {
              loanApplications.loanStage = "Paid";
            }
            if (loanApplications.loanStage === "Settled - Top Up") {
              loanApplications.loanStage = "Paid - Top Up";
            }
            return loanApplications;
          });
          return response;
        }),
        takeUntil(this.unsubscriber$)
      )
      .subscribe(
        (response) => {
          this.allLoanApplications = response.body.items;
          this.setAllApplicationsTableProps();
          this.pagination = this.paginationV2 as any;
          this.setPaginationV2(response.body);
          this.requestLoader = false;
        },
        () => {
          this.requestLoader = false;
        }
      );
  }

  setPaginationV2(res): void {
    this.paginationV2.pageSize = res.pageSize;
    this.paginationV2.pageNumber = res.pageNumber;
    this.paginationV2.totalCount = res.totalCount;
    this.paginationV2.hasNextPage = res.hasNextPage;
    this.paginationV2.hasPreviousPage = res.hasPreviousPage;
    this.paginationV2.totalPages = res.totalPages;
    this.paginationV2.count = res.items.length;
    this.paginationV2.searchColumns = res.searchColumns;

    this.paginationV2.jumpArray = Array(this.paginationV2.totalPages);
    for (let i = 0; i < this.paginationV2.jumpArray.length; i++) {
      this.paginationV2.jumpArray[i] = i + 1;
    }
  }

  getLoanApplicationsByType(type: LoanApplicationStages) {
    this.loanAppConfig = { ...this.loanAppConfig, legacySearch: false };
    this.userLoanApplications = [];
    this.requestLoader = true;
    if (this.currentView === LoanAppsPageCurrentView.OpenLoanApplications) {
      this.filters = [
        "Pool",
        "Draft",
        "Claimed",
        "Submitted",
        "Redraft",
        "Approved",
        "DeactivationRequestSent",
      ];
    }

    if (this.currentView === LoanAppsPageCurrentView.ReviewedLoanApplications) {
      this.filters = ["Rejected", "Disbursed"];
    }

    this.paginationModelV2 = removeNullUndefinedWithReduce({
      pageNumber: this.paginationV2.pageNumber,
      pageSize: this.paginationV2.pageSize,
      resultExpected: type,
      selectedSearchColumn: this.paginationV2.selectedSearchColumn,
      keyword: this.paginationV2.keyword,
      status: this.paginationV2["status"],
    });

    if (this.paginationV2["filterParams"]) {
      this.paginationModelV2 = {
        ...this.paginationModelV2,
        ...this.paginationV2["filterParams"],
      };
    }

    this.loanoperationService
      .getLoanApplications(this.paginationModelV2)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.tableSubTabs = [
            {
              text: "Open",
              currentTab: LoanAppsPageCurrentView.OpenLoanApplications,
              activeTab:
                this.currentView ===
                LoanAppsPageCurrentView.OpenLoanApplications,
            },
            {
              text: "Reviewed",
              currentTab: LoanAppsPageCurrentView.ReviewedLoanApplications,
              activeTab:
                this.currentView ===
                LoanAppsPageCurrentView.ReviewedLoanApplications,
            },
          ];
          this.searchColumns = response.body.searchColumns;
          this.userLoanApplications = response.body.items;
          this.setOpenAndReviewedApplicationsTableProps();
          this.pagination = this.paginationV2 as any;
          this.setPaginationV2(response.body);
          this.requestLoader = false;
        },
        () => {
          this.requestLoader = false;
        }
      );
  }

  getAwaitingPoolApprovalLoans() {
    this.requestLoader = true;

    this.paginationModelV2 = removeNullUndefinedWithReduce({
      pageNumber: this.paginationV2.pageNumber,
      pageSize: this.paginationV2.pageSize,
      selectedSearchColumn: this.paginationV2.selectedSearchColumn,
      keyword: this.paginationV2.keyword,
      statuses: this.paginationModelV2?.statuses,
      resultExpected: this.paginationModelV2?.resultExpected,
    });


    if (this.paginationV2["filterParams"]) {
      this.paginationModelV2 = {
        ...this.paginationModelV2,
        ...this.paginationV2["filterParams"],
      };
    }
    this.loanoperationService
      .getAwaitingPoolApprovalLoans(this.paginationModelV2)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (response) => {
          this.tableSubTabs = [
            {
              text: "Awaiting Pool Approval",
              currentTab: "submitted",
              activeTab:
                this.currentView ===
                  LoanAppsPageCurrentView.AwaitingPoolApproval &&
                this.teamLeadView === "submitted",
            },
            {
              text: "Open",
              currentTab: "open",
              activeTab:
                this.currentView ===
                  LoanAppsPageCurrentView.AwaitingPoolApproval &&
                this.teamLeadView === "open",
            },
            {
              text: "Reviewed",
              currentTab: "closed",
              activeTab:
                this.currentView ===
                  LoanAppsPageCurrentView.AwaitingPoolApproval &&
                this.teamLeadView === "closed",
            },
          ];
          this.searchColumns = response.body.searchColumns;
          this.userLoanApplications = response.body.items;
          this.setOpenAndReviewedApplicationsTableProps();
          this.pagination = this.paginationV2 as any;
          this.setPaginationV2(response.body);
          this.requestLoader = false;
        },
        error: () => {
          this.requestLoader = false;
        },
      });
  }

  redirect(navigate: { url: string; config: NavigationExtras }) {
    this.router.navigate([navigate.url], navigate.config);
  }

  getFailedDisbActionConfig(payload: FailedDisbursementApplication) {
    return [
      {
        showBtn:
          this.currentuser?.permission?.includes(
            "Manage Failed Disbursements"
          ) &&
          payload.disbursementUpdateStatus != null &&
          payload.disbursementUpdateStatus != "Updated",
        iconClass: "icon-edit",
        btnText: "Manage Funding Account",
        funcRef: () => this.manageFailedAppliation(payload?.loanId),
      },
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.getLoanDetailsById(payload?.loanId),
      },
    ];
  }

  toggleFailedDisbBank(loanId: any, bankInfo: any): void {
    const bankName = this.getFromJson(bankInfo, "bankName");
    const isDiamondBank = bankName.toLocaleLowerCase().includes("diamond");

    swal
      .fire({
        type: "info",
        title: "Change Bank",
        text: `We noticed this application is to be disbursed to an ${bankName} account, instead of an ${
          !isDiamondBank ? "Access Bank (Diamond)" : "Access Bank"
        } account. Would you want to change?`,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: `Yes change to ${
          !isDiamondBank ? "Access Bank (Diamond)" : "Access Bank"
        }`,
        confirmButtonColor: "#6faa8f",
        cancelButtonText: `No`,
        showLoaderOnConfirm: true,
      })
      .then((result) => {
        if (result.value) {
          swal.showLoading;
          this.loanoperationService
            .toggleDisbursementBank(
              loanId,
              `${isDiamondBank ? "AccessBank" : "DiamondBank"}`
            )
            .pipe(take(1))
            .subscribe(() => {
              this.getFailedDisbursements();
              swal.close();
              this.toast.fire({
                type: "success",
                text: "Bank changed successfully.",
              });
            });
        }
      });
  }

  getDeactivatedAppActionConfig(payload: DeactivatedApplication) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.getLoanDetailsById(payload?.id),
      },
    ];
  }

  getAllAppActionConfig(payload: OpenOrReviewedClaimedApplication) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.getLoanDetailsById(payload?.loanId),
      },
    ];
  }

  getOpenAndReviewedAppActionConfig(
    type: string,
    payload: OpenLoanApplication
  ): ActionConfig[] {
    return [
      {
        showBtn:
          payload?.status === "Draft" &&
          this.currentuser?.permission?.includes("Edit Loan Application") &&
          payload?.createdBy === this.currentuser?.userId,
        iconClass: "icon-edit",
        btnText: "Edit",
        funcRef: () =>
          this.redirect({
            url: `/loan/redraft-loan/${payload?.loanId}/loanapplication`,
            config: { skipLocationChange: true },
          }),
      },
      {
        showBtn:
          (payload?.status == "Submitted" || payload?.status == "Redraft") &&
          this.currentuser?.permission?.includes("Edit Loan Application") &&
          this.currentuser?.permission?.includes("Team Lead"),
        iconClass: "icon-edit",
        btnText: "Manage Application",
        funcRef: () =>
          this.redirect({
            url: `/loan/redraft-loan/${payload?.loanId}/loanapplication`,
            config: { skipLocationChange: true },
          }),
      },
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.getLoanDetailsById(payload?.loanId),
      },
      {
        showBtn:
          payload?.status == "Submitted" &&
          this.currentuser?.permission?.includes("Submit Application to Pool"),
        iconClass: "icon-circle-check-o",
        btnText: "Submit to Pool",
        funcRef: () =>
          this.submitLoanRequest(
            "LoanApproval",
            payload?.loanId,
            payload?.applicationCode
          ),
      },
    ];
  }

  getOpenOrReviewedStatusClass(
    openOrReviewedApplication: TableStatusClassProps
  ): string {
    if (openOrReviewedApplication.status == "Paid") {
      return "badge-success";
    }
    if (
      openOrReviewedApplication.loanStage != "Loan Active" &&
      openOrReviewedApplication?.loanStage != "Rejected" &&
      openOrReviewedApplication?.status != "Redraft" &&
      openOrReviewedApplication?.status != "DisbursementFailed" &&
      openOrReviewedApplication?.status != "Deactivated"
    ) {
      return "badge-warning";
    }
    if (openOrReviewedApplication.loanStage == "Loan Active") {
      return "badge-warning";
    }
    if (
      openOrReviewedApplication?.loanStage === "Rejected" ||
      openOrReviewedApplication?.status === "DisbursementFailed" ||
      openOrReviewedApplication?.status === "Deactivated"
    ) {
      return "badge-danger";
    }
    if (openOrReviewedApplication?.status === "Redraft") {
      return "badge-approval";
    }
  }

  getFailedDisbursementsStatusClass(failedDisbursement: {
    disbursementUpdateStatus: string;
  }): string {
    if (
      failedDisbursement.disbursementUpdateStatus == "" ||
      failedDisbursement.disbursementUpdateStatus == null
    ) {
      return "badge-danger";
    } else {
      return "badge-warning";
    }
  }

  getAllAppsStatusClass(allApps: TableStatusClassProps): string {
    if (
      allApps?.loanStage == "Loan Active" ||
      allApps?.loanStage === "Paid" ||
      allApps?.loanStage === "Settled - Top Up" ||
      allApps?.loanStage === "Paid - Top Up"
    ) {
      return "badge-success";
    } else if (
      allApps?.loanStage == "Rejected" ||
      allApps?.status == "DisbursementFailed" ||
      allApps?.status == "Deactivated"
    ) {
      return "badge-danger";
    } else if (allApps?.status == "Redraft") {
      return "badge-approval";
    } else {
      return "badge-warning";
    }
  }

  getReviewedApplicationsByUser() {
    this.loanAppConfig = { ...this.loanAppConfig, legacySearch: false };
    this.userLoanApplications = [];
    this.requestLoader = true;
    this.filters = [];
    this.paginationModel.resultExpected = "Closed";
    this.loanoperationService
      .spoolApplicationsByUser(this.paginationModel)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.searchColumns = ["code", "name"];
          this.userLoanApplications = response.body.value.data;
          this.setOpenAndReviewedApplicationsTableProps();
          this.setPagination(response);
          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;
        }
      );
  }

  updatePagination(event: TablePaginationChange) {
    this.pagination = { ...this.pagination, ...event };
    this.pagination?.filter
      ? (this.paginationModel["filter"] = this.pagination?.filter)
      : delete this.paginationModel["filter"];
    this.paginationModel.pageNumber = this.pagination.pageNumber;
    this.paginationModel.pageSize = this.pagination.pageSize;
    this.paginationV2.pageNumber = this.pagination.pageNumber;
    this.paginationV2.pageSize = this.pagination.pageSize;
    this.switchView(this.currentView);
  }

  filter(status: string[]) {
    if (this.currentView !== this.LoanAppsPageCurrentView.AllLoanApplications) {
      this.paginationModel["status"] = status[0];
      this.selectedFilters = {
        id: this.paginationModel["status"],
        text: this.paginationModel["status"],
      };
      this.paginationV2["status"] = status[0];
    }

    if (this.currentView === this.LoanAppsPageCurrentView.AllLoanApplications) {
      this.paginationModel["filter"] = status[0];
      this.selectedFilters = {
        id: this.paginationModel["filter"],
        text: this.paginationModel["filter"],
      };
      this.paginationV2["filter"] = status[0];
    }
    this.setSelectedFilters();
    this.switchView(this.currentView, true);
  }

  setPagination(response: LegacyPaginatedResponse) {
    this.pagination.maxPage = response.body?.value?.pages;
    this.pagination.totalRecords = response.body?.value?.totalRecords;
    this.pagination.count = response.body?.value?.data.length;
    this.pagination.jumpArray = Array(this.pagination.maxPage);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
    this.pagination["pageNumber"] = this.pagination.pageNumber;
    this.pagination["totalPages"] = this.pagination.maxPage;
    this.pagination["totalCount"] = this.pagination.totalRecords;
    this.pagination["hasPreviousPage"] =
      (this.pagination.pageNumber - 1) * this.pagination.pageSize + 1 > 10;
    this.pagination["hasNextPage"] =
      this.pagination.pageNumber < this.pagination["totalPages"];
  }

  setOpenAndReviewedApplicationsTableProps() {
    this.loanAppHeaders = [
      { name: "Code", type: "code" },
      { name: "Applicant" },
      { name: "Amount", type: "amount" },
      { name: "Date Submitted" },
      { name: "Date Approved" },
      { name: "Stage" },
      { name: "Created By" },
      { name: "Action" },
    ];

    this.loanAppData = this.userLoanApplications.map((loanApplication) => ({
      code: {
        tdValue: loanApplication?.applicationCode,
        type: "code",
        id: loanApplication.loanId,
        codeConfig: { tooltip: "Copy Application Code" },
      },
      applicant: { tdValue: loanApplication?.customerName },
      loanAmount: {
        tdValue: loanApplication?.loanAmount,
        type: "amount",
      },
      createdAt: {
        tdValue: loanApplication?.createdAt,
        type: "date",
        dateConfig: { format: "dd/MM/yyyy" },
      },
      dateApproverApproved: {
        tdValue: loanApplication?.dateApproved,
        type: "date",
        dateConfig: { format: "dd/MM/yyyy" },
      },
      loanStage: {
        tdValue: loanApplication?.loanStage,
        type: "status",
        statusConfig: {
          class: this.getOpenOrReviewedStatusClass(loanApplication),
        },
      },
      createdByName: { tdValue: loanApplication?.createdByName },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getOpenAndReviewedAppActionConfig(
          "loanApplication",
          loanApplication
        ),
      },
    }));
  }

  setAllApplicationsTableProps() {
    this.loanAppHeaders = [
      { name: "Code", type: "code" },
      { name: "Applicant" },
      { name: "Branch" },
      { name: "Amount", type: "amount" },
      { name: "Date Submitted" },
      { name: "Date Approved" },
      { name: "Stage" },
      { name: "Action" },
    ];

    this.loanAppData = this.allLoanApplications.map((allApps) => ({
      code: {
        tdValue: allApps?.applicationCode,
        type: "code",
        id: allApps.loanId,
        codeConfig: { tooltip: "Copy Application Code" },
      },
      applicant: {
        tdValue: allApps?.customerName,
      },
      branch: {
        tdValue: allApps?.branchName,
      },
      loanAmount: {
        tdValue: allApps?.loanAmount,
        type: "amount",
      },
      dateSubmitted: {
        tdValue: allApps?.createdAt,
        type: "date",
        dateConfig: { format: "dd/MM/yyyy" },
      },
      dateApproved: {
        tdValue: allApps?.dateApproverApproved,
        type: "date",
        dateConfig: { format: "dd/MM/yyyy" },
      },
      status: {
        tdValue: allApps?.loanStage,
        type: "status",
        statusConfig: { class: this.getAllAppsStatusClass(allApps) },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getAllAppActionConfig(allApps),
      },
    }));
  }

  search(event: LoanSearchParam) {
    this.pagination["selectedSearchColumn"] = event.selectedSearchColumn;
    this.pagination["keyword"] = event.keyword;
    this.paginationV2 = { ...this.paginationV2, ...event };

    if (
      this.currentView === LoanAppsPageCurrentView.OpenLoanApplications ||
      this.currentView === LoanAppsPageCurrentView.ReviewedLoanApplications ||
      this.currentView === LoanAppsPageCurrentView.FailedDisbursements ||
      this.currentView === LoanAppsPageCurrentView.AwaitingPoolApproval ||
      this.currentView === LoanAppsPageCurrentView.AllLoanApplications
    ) {
      this.switchView(this.currentView);
    } else {
      this.getDeactivatedApplications();
    }
  }

  getDeactivatedApplications() {
    this.loanAppConfig = { ...this.loanAppConfig, legacySearch: false };
    this.requestLoader = true;
    this.filters = [];
    this.paginationModelV2 = removeNullUndefinedWithReduce({
      pageNumber: this.paginationV2.pageNumber,
      pageSize: this.paginationV2.pageSize,
      selectedSearchColumn: this.paginationV2.selectedSearchColumn,
      keyword: this.paginationV2.keyword,
      status: this.paginationV2["status"],
    });

    if (this.paginationV2["filterParams"]) {
      this.paginationModelV2 = {
        ...this.paginationModelV2,
        ...this.paginationV2["filterParams"],
      };
    }

    this.loanoperationService
      .spoolDeactivatedApplications(this.paginationModelV2)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.deactivatedApplications = res.body?.items;
          this.searchColumns = res.body.searchColumns;
          this.loanAppHeaders = [
            { name: "Application Code", type: "code" },
            { name: "Branch" },
            { name: "Applicant" },
            { name: "Loan Amount", type: "amount" },
            { name: "Stage" },
            { name: "Action" },
          ];
          this.loanAppData = this.deactivatedApplications.map(
            (deactivatedApplication) => ({
              code: {
                tdValue: deactivatedApplication?.applicationCode,
                type: "code",
                id: deactivatedApplication.id,
                codeConfig: { tooltip: "Copy Application Code" },
              },
              branch: {
                tdValue: deactivatedApplication?.branch,
              },
              applicant: {
                tdValue: deactivatedApplication?.applicant,
              },
              loanAmount: {
                tdValue: deactivatedApplication?.amount,
                type: "amount",
              },
              status: {
                tdValue: deactivatedApplication?.stage,
                type: "status",
                statusConfig: { class: "badge-warning" },
              },
              action: {
                tdValue: null,
                type: "action",
                actionConfig: this.getDeactivatedAppActionConfig(
                  deactivatedApplication
                ),
              },
            })
          );

          const response = {
            body: {
              value: {
                ...res.body,
                pages: res.body.totalPages,
                totalRecords: res.body.totalCount,
                data: res.body.items,
              },
            },
          };
          this.setPagination(response);
          this.requestLoader = false;
        },
        error: () => {
          this.requestLoader = false;
        },
      });
  }

  getFailedDisbursements() {
    this.loanAppConfig = { ...this.loanAppConfig, legacySearch: false };
    this.failedDisbursements = [];
    this.requestLoader = true;
    this.filters = [];

    this.paginationModelV2 = removeNullUndefinedWithReduce({
      pageNumber: this.paginationV2.pageNumber,
      pageSize: this.paginationV2.pageSize,
      selectedSearchColumn: this.paginationV2.selectedSearchColumn,
      keyword: this.paginationV2.keyword,
      status: this.paginationV2["status"],
    });

    if (this.paginationV2["filterParams"]) {
      this.paginationModelV2 = {
        ...this.paginationModelV2,
        ...this.paginationV2["filterParams"],
      };
    }

    this.loanoperationService
      .getFailedDisbApplications(this.paginationModelV2)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.searchColumns = response.body.searchColumns;
          this.failedDisbursements = response.body.items;
          this.loanAppHeaders = [
            { name: "Application Code", type: "code" },
            { name: "Batch Code", type: "code" },
            { name: "Branch" },
            { name: "Customer" },
            { name: "Loan Amount", type: "amount" },
            { name: "Retrials", alignment: "center" },
            { name: "Stage" },
            { name: "Action" },
          ];
          this.loanAppData = this.failedDisbursements.map((disbursement) => ({
            code: {
              tdValue: disbursement?.applicationCode,
              type: "code",
              id: disbursement.loanId,
              codeConfig: { tooltip: "Copy Application Code" },
            },
            batchCode: { tdValue: disbursement?.loanBatchCode, type: "code" },
            branch: {
              tdValue: disbursement?.branchName,
            },
            customer: {
              tdValue: disbursement?.customerName,
            },
            loanAmount: {
              tdValue: disbursement?.loanAmount,
              type: "amount",
            },
            retrial: {
              tdValue: disbursement?.disbursementTrailCount || 0,
              alignment: "center",
            },
            status: {
              tdValue: disbursement?.disbursementUpdateStage,
              type: "status",
              statusConfig: {
                class: this.getFailedDisbursementsStatusClass(disbursement),
              },
            },
            action: {
              tdValue: null,
              type: "action",
              actionConfig: this.getFailedDisbActionConfig(disbursement),
            },
          }));
          response.body["value"] = response.body;
          this.pagination = this.paginationV2 as any;
          this.setPaginationV2(response.body);

          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;
        }
      );
  }

  getLoanDetails(code) {
    this.requestLoader = true;

    this.loanoperationService
      .getLoanapplicationbycode(code)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.requestLoader = false;
          this.LoanDetails(res.body);
          this.toggleAside();
        },
        (err) => {
          this.requestLoader = false;

          //  swal.fire('Error', err.error, 'error');
        }
      );
  }

  getLoanDetailsById(id, element?) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.requestLoader = true;
        this.loanoperationService
          .getLoanapplicationbyid(id)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.requestLoader = false;
              this.LoanDetails(res.body);
              this.toggleAside();
            },
            () => {
              this.requestLoader = false;
            }
          );
      }
    });
  }

  getLoanCalculationParamters(productId) {
    var loanAmount = this.selectedNewLoanAmount;
    var loanTypeId =
      productId == null ? this.selectedLoan.loanTypeId : productId;

    const inputModel = {
      LoanAmount: loanAmount,
      LoanTypeId: loanTypeId,
    };

    this.topUpLoanAmount = loanAmount;

    if (loanAmount != 0.0 && loanAmount != 0) {
      this.requestLoader = true;

      this.configurationService
        .getCalculationParameters(inputModel)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.requestLoader = false;
            this.showtenorSection = true;
            this.topUpReturnInformation.interestRate = res.body.interestRate;
            this.topUpReturnInformation.resultMessage = res.body.resultMessage;
            this.showProceedButton = false;
            this.preferredLoanType = null;

            const tenor =
              res?.body?.tenorAllowable || this.tenorForSelectedLoan;
            this.tenorArray = [];
            for (let i = 1; i <= tenor; i++) {
              this.tenorArray.push({ id: i, text: i.toString() });
            }
          },
          (err) => {
            this.requestLoader = false;
            this.showtenorSection = false;

            swal
              .fire({
                type: "warning",
                text: err.error,
                showCancelButton: true,
                cancelButtonColor: "#B85353",
                cancelButtonText: "Review Loan Amount",
                confirmButtonText: "Change Loan Product",
                confirmButtonColor: "#558E90",
                width: "600px",
              })
              .then((result) => {
                if (result.value) {
                  this.getLoanProductsByAmount(this.topUpLoanAmount);
                } else {
                }
              });
          }
        );
    }
  }

  registerNewLoanAmount(loanAmount: number) {
    if (loanAmount != this.selectedNewLoanAmount) {
      this.showtenorSection = false;
      this.showProductChangeSection = false;
      this.topupeligible = false;
      this.showProceedButton = true;
    }
    this.selectedNewLoanAmount = loanAmount;
  }

  getLoanProductsByAmount(loanAmount) {
    const inputModel = {
      LoanAmount: loanAmount,
    };
    if (loanAmount != 0.0 && loanAmount != 0) {
      this.requestLoader = true;

      this.loanoperationService
        .getLoanProductsByAmount(inputModel)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (response) => {
            this.requestLoader = false;
            this.showProductChangeSection = true;
            this.showProductInformationSection = false;

            this.loanProductsArray = [];
            response.body.forEach((element) => {
              this.loanProductsArray.push({
                id: element.loanTypeId,
                text: element.loanName,
              });
            });
          },
          (err) => {
            this.requestLoader = false;
            this.showtenorSection = false;
            // swal.fire('Error', err.error, 'error', );
          }
        );
    }
  }

  submitDeactivationForm(val: any) {
    if (this.DeactivationForm.valid) {
      this.loader = true;

      this.DeactivationForm.controls["Status"].patchValue(this.selectedstatus);
      this.DeactivationForm.controls["UserId"].patchValue(this.currentuserid);
      this.DeactivationForm.controls["LoanId"].patchValue(
        this.loaninformation.loanId
      );
      this.loanoperationService
        .updateLoanapplicationstatus(this.DeactivationForm.value)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.modalService.dismissAll();

            // tslint:disable-next-line:max-line-length
            swal
              .fire({
                type: "success",
                text: res.body.value.feedbackmessage,
                title: "Successful",
                confirmButtonColor: "#558E90",
              })
              .then((result) => {
                this.DeactivationForm.reset();
                this.loader = false;
                this.toggleAside();
                this.switchView(LoanAppsPageCurrentView.OpenLoanApplications);
              });
          },
          (err) => {
            this.loader = false;

            //  swal.fire('Error', err.error, 'error');
          }
        );
    }
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
      const combinedUrl =
        "https://docs.google.com/viewer?url=" + urlInput + "&embedded=true";
      this.currentFileUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl(combinedUrl);
      this.currentFileDownloadUrl = urlInput;
      window.open(this.currentFileDownloadUrl, "_blank");

      // tslint:disable-next-line:max-line-length
      // this.modalService.open(doccontent, { size: 'lg', centered: true, ariaLabelledBy: 'modal-basic-title',  windowClass: 'custom-modal-style opq2' });
    }
  }

  getToday() {
    // tslint:disable-next-line:new-parens
    const dateString = new Date();
    this.currentdate = dateString;
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

      // message += " was "
      //   message += days + " days : \n"
      message += months + "month(s) : \n";
      message += years + "year(s) ago\n";
    }

    return message;
  }

  humanize(str: string) {
    if (str == null || str == undefined || str.length == 0) return "";

    let result = "";
    for (let i = 0; i < str.length; i++) {
      const element = str[i];

      if (i != 0 && element.toLowerCase() != element) {
        result += ` ${element}`;
      } else {
        result += element;
      }
    }
    return result;
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  closeFilterModal() {
    $(".filter-menu").toggle();
  }

  filterFn(view) {
    if (view === LoanAppsPageCurrentView.AllLoanApplications) {
      this.getAllApplications();
    } else if (view === LoanAppsPageCurrentView.OpenLoanApplications) {
      this.getLoanApplicationsByType(this.LOANAPPLICATIONSTAGES.open);
    }
    this.closeFilterModal();
  }

  getApplicationownerinformation() {
    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  toggleAside() {
    this.openAside = !this.openAside;
  }

  triggerSearch() {
    this.clearLoanTopUpData({ clearForm: false });

    if (
      this.AddTopUpForm.controls["SearchParam"].value !== "" &&
      this.AddTopUpForm.controls["SearchParam"].value != null
    ) {
      this.searchrequestLoader = true;
      this.showtenorSection = false;
      this.loanSearchResult = null;

      const searchModel = {
        filter: "Active",
        keyword: this.AddTopUpForm.controls["SearchParam"].value,
        selectedSearchColumn: this.selectedSearchCol,
      };

      this.loanoperationService
        .spoolLoansbySearch(searchModel)
        .pipe(
          pluck("body", "items"),
          map((loans) =>
            loans.map((loan) => ({
              ...loan,
              combinedLoanInformation: `${loan?.loanCode} : ${
                loan?.customer
              } - ${this.decimalPipe.transform(
                loan?.totalRepaymentOutstanding,
                "1.2-2"
              )}`,
            }))
          ),
          takeUntil(this.unsubscriber$)
        )
        .subscribe(
          (res) => {
            this.loanSearchResult = res;
            this.searchrequestLoader = false;
          },
          () => {
            this.requestLoader = false;
            this.searchrequestLoader = false;
          }
        );
    } else {
      // tslint:disable-next-line:max-line-length
      swal.fire({
        type: "info",
        title: "Empty Search Box",
        text: "Please enter loan code or customer name into the  search box and try again",
      });
      this.searchrequestLoader = false;
    }
  }

  clearLoanTopUpData(options = { clearForm: true }) {
    this.loanSearchResult = null;
    if (options.clearForm) this.AddTopUpForm.reset();
    this.topuplines = [];
    this.showProceedButton = false;
  }

  isEmpty(value) {
    var isEmpty = false;
    if (value == "" || value == null) {
      isEmpty = true;
    }
    return isEmpty;
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService
        .getUserInfo(this.loggedInUser.nameid)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
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

  getBankSelected(event) {
    this.bankInfo = null;

    const selectedOptions = event.target.options;
    const selectedIndex = selectedOptions.selectedIndex;
    const selectElementText = selectedOptions[selectedIndex].text;
    this.bankUpdateForm.controls["BankSortCode"].setValue(event.target.value, {
      onlySelf: true,
      emitEvent: true,
    });
    this.bankUpdateForm.controls["BankSortCode"].updateValueAndValidity();
    this.bankUpdateForm.controls["BankName"].setValue(selectElementText, {
      onlySelf: true,
      emitEvent: true,
    });
    this.bankUpdateForm.controls["BankName"].updateValueAndValidity();
    this.bankUpdateForm.controls["BankAccountNumber"].setValue("", {
      onlySelf: true,
      emitEvent: true,
    });
    this.bankUpdateForm.controls["BankAccountNumber"].updateValueAndValidity();

    this.bankUpdateForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  validateAccount() {
    this.verifyloader = true;

    this.bankUpdateForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
    const payload: VerifyBankAccount = {
      accountNumber: this.bankUpdateForm.get("BankAccountNumber").value,
      sortCode: this.bankUpdateForm.get("BankSortCode").value,
    };
    this.configService
      .validateBankAccount(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.bankInfo = res.body.data;
          this.verifyloader = false;

          this.bankUpdateForm.controls["BankAccountName"].setValue(
            res.body.data.accountName,
            { onlySelf: true, emitEvent: true }
          );
          this.bankUpdateForm.updateValueAndValidity({
            onlySelf: true,
            emitEvent: true,
          });
        },
        (err) => {
          this.verifyloader = false;
        }
      );
  }

  manageFailedAppliation(loanId) {
    this.requestLoader = true;
    this.loanoperationService
      .getLoanapplicationbyid(loanId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.requestLoader = false;
          this.selectedLoan = {
            ...res?.body,
            customerName: `${res?.body?.person?.firstName} ${res?.body?.person?.lastName}`,
            loanTypeName: res.body?.loanType?.loanName,
            disbursementClaimer:
              res.body?.disbursementClaimer?.person?.displayName,
          };

          if (res?.body?.bankInfo) {
            this.selectedLoan.bankInfo = JSON.parse(res?.body?.bankInfo);
          }
          this.modalService.open(this.addAccountUpdateModal, {
            size: "lg",
            ariaLabelledBy: "modal-basic-title",
          });
          if (
            this.selectedLoan.disbursementUpdateStatus !== "AwaitingApproval"
          ) {
            this.fetchBanks();
            this.bankUpdateFormInit();
          } else {
            this.bankUpdateFormInit();
            this.getLoanTempBankDetails(this.selectedLoan.loanId);
          }
        },
        () => {
          this.requestLoader = false;
        }
      );
  }

  bankUpdateFormInit() {
    this.bankUpdateForm = new UntypedFormGroup({
      BankList: new UntypedFormControl("", []),
      Reason: new UntypedFormControl(""),
      BankName: new UntypedFormControl("", [Validators.required]),
      BankSortCode: new UntypedFormControl("", [Validators.required]),
      BankAccountName: new UntypedFormControl("", []),
      BankAccountNumber: new UntypedFormControl("", [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
      ]),
      SupportingDocumentFile: new UntypedFormControl(""),
      BankStatementFile: new UntypedFormControl(""),
    });
  }

  fileUploader(files: FileList, text: string) {
    this.bankUpdateForm.controls[text].setValue(files[0], {
      onlySelf: true,
      emitEvent: true,
    });
    this.bankUpdateForm.updateValueAndValidity({
      onlySelf: true,
      emitEvent: true,
    });
  }

  getBankInfoFromLoan(row) {
    var info = JSON.parse(row.bankInfo);
    return info;
  }

  fetchBanks() {
    this.loader = true;
    this.configService
      .fetchBanks()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loader = false;
          this.bankList = res.body.data;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  getLoanTempBankDetails(loanId: any) {
    this.loader = true;

    this.loanoperationService
      .getTempBankDetailsByLoanId(loanId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loader = false;

          this.tempBankDetails = res.body;
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  submitFailedApplication() {
    if (this.bankUpdateForm.valid) {
      this.loader = true;
      let data = {
        userId: this.currentuserid,
        loanId: this.selectedLoan.loanId,
        ...this.bankUpdateForm.value,
      };

      this.loanoperationService
        .submitFailedApplication(data)
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.loader = false;
            this.switchView(LoanAppsPageCurrentView.FailedDisbursements);
            swal.fire({
              type: "success",
              text: "Update submitted",
              title: "Successful",
            });
            this.closeModal();
          },
          (err) => {
            this.loader = false;
          }
        );
    }
  }

  approveFailedApplication(approved: boolean) {
    this.loader = true;
    let data = {
      userId: this.currentuserid,
      loanId: this.selectedLoan.loanId,
      approved,
      reason: this.bankUpdateForm.controls["Reason"].value,
    };

    this.loanoperationService
      .approveFailedApplication(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        () => {
          this.loader = false;
          this.switchView(LoanAppsPageCurrentView.FailedDisbursements);
          swal.fire({
            type: "success",
            text: "Update submitted",
            title: "Successful",
          });
          this.closeModal();
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  userCanApprove() {
    return (
      this.currentuser &&
      this.currentuser.permission &&
      this.currentuser.permission.includes("Approve Bank Account Update") &&
      this.selectedLoan.disbursementUpdateStatus === "AwaitingApproval"
    );
  }

  viewRepaymentSchedule(content) {
    this.repaymentLoader = true;
    this.repaymentScheduleArray = [];
    const Amount = this.loaninformation.loanAmount;
    const NetIncome = this.getFromJson(
      this.loaninformation?.employmentInfo,
      "netIncome"
    );
    const Duration = this.loaninformation?.loanTenor;
    const LoanType = this.loaninformation?.loanTypeId;
    const InterestRate = this.getFromJson(
      this.loaninformation?.loanTypeInfo,
      "loanInterestRate"
    );
    const loanStartDate = this.loaninformation?.loanStartDate;
    const RepaymentDate = this.loaninformation.preferredFirstRepaymentDate;
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
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe(
          (res) => {
            this.repaymentLoader = false;
            this.scheduleInformation = res.body;
            this.repaymentScheduleArray = res.body.repaymentSchedule;
            if (!this.modalService.hasOpenModals()) {
              this.openModal(content, this.loaninformation?.loanid);
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

  setSearchParams(searchCol: CustomDropDown, type: "select" | "remove") {
    type === "select"
      ? (this.selectedSearchCol = searchCol?.id as string)
      : (this.selectedSearchCol = null);
  }

  get reviewDate() {
    const date: string = this.getReviewInfo("DateCreated");
    if (date.includes("/")) {
      let transformed = date.replace("/", "-");
      transformed = transformed.replace("/", "-");
      transformed = transformed.replace(" ", "T");

      let splitted = transformed.split("T");
      const splittedDate = splitted[0];
      const splittedTime = splitted[1];

      const day = splittedDate.split("-")[0];
      const month = splittedDate.split("-")[1];
      const year = splittedDate.split("-")[2];
      return `${year}-${month}-${day}T${splittedTime}`;
    } else {
      return date;
    }
  }

  getReviewInfo(prop: string) {
    return this.loaninformation?.recordEntryMedium === "Checkout"
      ? this.getFromJson(
          this.loaninformation?.approversInfo,
          "loanapplication"
        )[prop]
      : this.getFromJson(
          this.getFromJson(
            this.loaninformation?.approversInfo,
            "loanappplication"
          ),
          prop
        );
  }

  openPhoneVerificationModal(template: TemplateRef<any>) {
    this.customerAltPhoneNumber =
      this.loaninformation?._residentialInfo?.customerAltPhoneNumber;
    this.modalService.open(template, {
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  enableFeature(): boolean {
    return this.growthbookService.growthbook.isOn(
      GrowthBookFeatureTags.AltPhoneNumber
    );
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
