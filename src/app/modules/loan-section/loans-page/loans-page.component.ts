import { Location } from "@angular/common";
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  TemplateRef,
} from "@angular/core";
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import swal from "sweetalert2";
import { DomSanitizer } from "@angular/platform-browser";
import { AngularCsv } from "angular7-csv/dist/Angular-csv";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpResponse } from "@angular/common/http";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import * as _ from "lodash";
import Swal from "sweetalert2";

import { LoanoperationsService } from "../../../service/loanoperations.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import {
  AppOwnerInformation,
  FilterParams,
  FilterTypes,
  GenericSpoolRequestPayload,
  GetDataQueryParams,
  Pagination,
  SearchParams,
  User,
} from "../../shared/shared.types";
import { LoanRepaymentMethodEnum } from "../enums/loan-repayment-method.enum";
import {
  GetDeactivatedLoansResBody,
  LoansPageCurrentView,
  MandatePaymentHistory,
  DisbursementFailed,
  UpdateDisbFailed,
  LoansAwaitingDisbursement,
  Loan,
  LoanPayment,
} from "../loan.types";
import { QuickLoanService } from "src/app/service/quick-loan.service";
import { ExcelService } from "src/app/service/excel.service";
import { getUserReadableLoanRepaymentBalanceType, removeNullUndefinedWithReduce } from "../../shared/helpers/generic.helpers";
import { Store } from "@ngrx/store";
import { AppWideState } from "src/app/store/models";
import { clearFilters } from "src/app/store/actions";
declare let $: any;

@Component({
  selector: "app-loans-page",
  templateUrl: "./loans-page.component.html",
  styleUrls: ["./loans-page.component.scss"],
})
export class LoansPageComponent implements OnInit, OnDestroy {
  public loggedInUser: any;
  currentUser: User;
  currentUserId: number;
  currentUserBranchId: number;
  currentView: LoansPageCurrentView;
  LoansPageCurrentView = LoansPageCurrentView;
  requestLoader: boolean;
  loader = false;
  viewloandetails: boolean;
  loaninformation: any;
  loans: Loan[];
  currentdate: any;
  currentFileUrl: any;
  currentFileType: any;
  currentFileDownloadUrl: any;
  ownerInformation: any;
  loanhistoryinformation: any;
  loanhistoryperson: any;
  loanactivities: any;
  settlementInformation: any;
  selectedLoanId: number;
  currentProcess: boolean;
  pagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  CurrentDate: any;
  remitaPayments: any;
  remitaStatusMessage: string = null;
  issueDDI: boolean;
  remitaMandate: boolean;
  cancelDDI: boolean;
  externalidentifier = null;
  isMandateStop: boolean = false;
  stopMandateSuccess: boolean = false;
  payLoader: boolean;
  remitaPaymentsDetails: [] = [];
  downloading: boolean;
  fileInput: any;
  fileInputLabel: any;
  uploading: boolean;
  status: string;
  awaitingDisbursementPagination = {
    pageNum: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    searchColumns: [],
  };

  deactivatedLoans = [];
  deactivatedLoansPagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  deactivatedLoansSearchColumns: string[] = [];
  selectedDeactivatedLoansSearchColumn = "";
  deactivatedLoansSearchTerm = "";

  loansAwaitingDisbursement = [];

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  loanRescheduleDetails: any;
  repaymentLoader = false;
  title: string;

  rawFilters = {
    VIEW_LOAN: [
      "Disbursed",
      "Paid"
    ],
  };

  filters;
  selectedFilter = {
    VIEW_LOAN: [],
  };
  notifyingRemita = false;
  stoppingRemitaCollection = false;
  isLoadingMandatePaymentHistory = false;
  mandatePaymentHistory: MandatePaymentHistory;
  appOwnerInfo: AppOwnerInformation;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  loadingSettlementAmt = false;
  usesRemitaRepaymentMethod = false;
  copy_hover = false;
  qlpLoanId: number | "successfulLoan";
  openAside;
  selectedDisbursements: DisbursementFailed[];
  searchColumns: string[] = [];
  forceLoanActivationDate: string;
  selectedPayment: LoanPayment;
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
    public sanitizer: DomSanitizer,
    private router: Router,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService,
    private sharedService: SharedService,
    private qlpService: QuickLoanService,
    private location: Location,
    private readonly excelService: ExcelService,
    private store: Store<AppWideState>
  ) {}

  ngOnInit() {
    this.listenForQLPloanId();

    this.getAppOwnerInfo();
    this.removePill();

    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.viewloandetails = false;

    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.getToday();
    this.loadFilterDropdownData();

    this.getUserPromise()
      .then((next) => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        this.currentView = LoansPageCurrentView.Loans;

        this.currentProcess = false;

        this.getConstants();
        this.switchView(this.currentView);
      })
      .catch((err) => {});
  }

  listenForQLPloanId() {
    this.qlpService.successfulLoanId$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((qlpLoanId) => {
        this.qlpLoanId = qlpLoanId.id;
        if (this.qlpLoanId) {
          this.getLoanDetailsById(this.qlpLoanId);
        }
      });
  }

  getAppOwnerInfo() {
    this.configurationService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.appOwnerInfo = res.body;
        },
      });
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          this.selectedFilter.VIEW_LOAN = selectedFilters.filters[0];
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

  closeModal() {
    this.modalService.dismissAll();
    if (this.forceLoanActivationDate) {
      this.forceLoanActivationDate = null;
    }
  }

  closeModalReschedule() {
    this.closeModal();
    this.getLoans();
  }

  openModal(content: TemplateRef<any>, options?: NgbModalOptions) {
    this.modalService.open(content, {
      ...options,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  getQueryParams() {
    const queryParams = this.route.snapshot.queryParams;
    const id = queryParams["id"];

    if (id) {
      this.selectedLoanId = +id;
      this.getLoanDetailsById(id);
    }
  }

  rescheduleLoan(template, loan, status, title, event: Event) {
    event.stopPropagation();
    this.loanRescheduleDetails = loan;
    this.status = status;
    this.title = title;
    this.openModal(template);
  }

  LoanDetails(loaninformation) {
    if (loaninformation?.repaymentInfo) {
      const repaymentMethod = this.getFromJson(
        loaninformation.repaymentInfo,
        "repaymentMethod"
      );

      this.usesRemitaRepaymentMethod =
        repaymentMethod === LoanRepaymentMethodEnum.InflightCollectionsRemita;
    }

    this.loanactivities = [];
    let empInfo;
    if (loaninformation?.employmentInfo) {
      empInfo = JSON.parse(loaninformation?.employmentInfo);
    }

    this.loaninformation = {
      ...loaninformation,
      isDecideActive: this.appOwnerInfo?.decideInfo?.isActive,
      customerImageUrl:
        loaninformation?.customerImageUrl ||
        "assets/images/male-default-profile.png",
    };

    this.loaninformation["repaymentBalanceType"] = null;
    this.loaninformation["repaymentBalanceType"] =
      loaninformation?.repaymentSchedule[0]?.repaymentBalanceType;
    if (this.loaninformation["repaymentBalanceType"]) {
      this.loaninformation["repaymentBalanceTypeTab"] =
        getUserReadableLoanRepaymentBalanceType(
          this.loaninformation["repaymentBalanceType"]
        );
    }

    this.viewloandetails = true;
    this.selectedLoanId = loaninformation.loanId;
    empInfo && empInfo.bankStatement
      ? (this.loaninformation.bankStatement = true)
      : (this.loaninformation.bankStatement = false);

    this.externalidentifier =
      this.getFromJson(
        this.getFromJson(
          loaninformation.externalIntegrationIdentifier,
          "Content"
        ),
        "MandateId"
      ) === ""
        ? ""
        : this.getFromJson(
            this.getFromJson(
              loaninformation.externalIntegrationIdentifier,
              "Content"
            ),
            "MandateId"
          );
    let status =
      this.getFromJson(
        this.getFromJson(
          loaninformation.externalIntegrationIdentifier,
          "Content"
        ),
        "MandateId"
      ) === ""
        ? ""
        : this.getFromJson(
            this.getFromJson(
              loaninformation.externalIntegrationIdentifier,
              "Content"
            ),
            "Status"
          );
    this.isMandateStop = !status ? false : status === "Cancellation Successful";
    this.currentProcess = false;
    this.stopMandateSuccess = false;
  }

  getRemitaPayments(loanId: number) {
    this.payLoader = true;
    const userId = parseFloat(this.loggedInUser.nameid);
    const data = {
      userId,
      loanId,
    };

    this.loanoperationService
      .getRemitaMandatePayments(data)
      .subscribe((res) => {
        this.remitaPayments = res.body.mandateResponse.data.data;
        this.remitaPaymentsDetails =
          res.body.mandateResponse.data.data.paymentDetails;
        this.payLoader = false;
      });
  }

  cancelRemitaDDI(loanId: number) {
    this.cancelDDI = true;
    const userId = parseFloat(this.loggedInUser.nameid);
    const data = {
      userId,
      loanId,
    };

    this.loanoperationService.cancelRemitaDebitInstruction(data).subscribe(
      (res) => {
        this.cancelDDI = false;
        this.remitaStatusMessage = res.body.message;
        setTimeout(() => {
          this.remitaStatusMessage = null;
        }, 5000);
      },
      (err) => {
        this.remitaStatusMessage = err.error.mandateResponse.status;
        setTimeout(() => {
          this.remitaStatusMessage = null;
        }, 5000);
        this.cancelDDI = false;
      }
    );
  }
  issueRemitaDDI(loanId: number) {
    this.issueDDI = true;
    const userId = parseFloat(this.loggedInUser.nameid);
    const data = {
      userId,
      loanId,
    };

    this.loanoperationService.issueRemitaDirectDebitInstruction(data).subscribe(
      (res) => {
        this.issueDDI = false;
        this.remitaStatusMessage = res.body.message;
        setTimeout(() => {
          this.remitaStatusMessage = null;
        }, 5000);
      },
      (err) => {
        this.remitaStatusMessage = err.error.mandateResponse.status;
        setTimeout(() => {
          this.remitaStatusMessage = null;
        }, 5000);
        this.issueDDI = false;
      }
    );
  }
  stopMandate(loanId: number) {
    this.remitaMandate = true;
    const userId = parseFloat(this.loggedInUser.nameid);
    const data = {
      userId,
      loanId,
    };

    swal
      .fire({
        title: "Are you sure?",
        text: "This action will stop the remita mandate",
        type: "warning",
        showCancelButton: true,
        cancelButtonColor: "#B85353",
        cancelButtonText: "No, cancel",
        confirmButtonText: "Yes",
        confirmButtonColor: "#558E90",
        showLoaderOnConfirm: true,
      })
      .then((res) => {
        if (res.value) {
          this.loanoperationService.stopRemitaMandate(data).subscribe(
            (res) => {
              this.remitaMandate = false;
              this.stopMandateSuccess = true;
              this.remitaStatusMessage = res.body.message;

              setTimeout(() => {
                this.remitaStatusMessage = null;
              }, 5000);
            },
            (err) => {
              this.remitaStatusMessage = err.error.mandateResponse.status;
              setTimeout(() => {
                this.remitaStatusMessage = null;
              }, 5000);
              this.remitaMandate = false;
            }
          );
        } else {
          this.remitaMandate = false;
        }
      });
  }

  formatDate(data) {
    const date = new Date(data.toString());
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const yyyy = date.getFullYear();

    const MM = m >= 10 ? m + "" : "0" + m;
    const dd = d >= 10 ? d + "" : "0" + d;
    return yyyy + "-" + MM + "-" + dd;
  }

  submitLoanRequest(type, loanid) {
    this.requestLoader = true;

    this.loanoperationService.getActivities(type, loanid).subscribe(
      (res) => {
        this.requestLoader = false;
        this.loanactivities = res.body;
      },
      (err) => {
        this.requestLoader = false;
      }
    );
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

  getFromJson(jsonString: string, expectedResult: string) {
    let result = "";
    if (jsonString != null && jsonString !== "" && expectedResult !== "") {
      result = JSON.parse(jsonString)[expectedResult];
    }
    return result;
  }

  switchView(view: LoansPageCurrentView, clear = false) {
    if (clear) {
      this.store.dispatch(clearFilters());
    }
    if (view === LoansPageCurrentView.Loans) {
      this.filterTypes = [
        this.FILTER_TYPES.Status,
        this.FILTER_TYPES.Branch,
        this.FILTER_TYPES.LoanProduct,
      ];
      this.getLoans();
    } else if (view === LoansPageCurrentView.AwaitingDisbursementConfirmation) {
      this.filterTypes = [
        this.FILTER_TYPES.Branch,
        this.FILTER_TYPES.LoanProduct,
      ];
      this.getLoansAwaitingDisbursement();
    } else if (view === LoansPageCurrentView.DeactivatedLoans) {
      this.filterTypes = [
        this.FILTER_TYPES.Branch,
        this.FILTER_TYPES.LoanProduct,
      ];
      this.getDeactivatedLoans();
    }

    this.currentView = view;
  }

  setFilters(filterParams) {
    if (filterParams) {
      const selectedFilters: PillFilters = {
        filters: filterParams,
        action: "add",
        headers: ["Status"],
      };

      this.sharedService.selectedFilters$.next(selectedFilters);
    }
  }

  searchLoans(searchParams: SearchParams) {
    this.getLoans(null, null, searchParams);
  }

  setFilterParams(filterParams: FilterParams) {
    this.filterParams = removeNullUndefinedWithReduce({
      ...filterParams,
      loanProducts: (filterParams?.loanProducts as number[])?.join(","),
      branches: (filterParams?.branches as number[])?.join(",")
    });
    this.switchView(this.currentView);
  }

  getLoans(
    pageNum = this.pagination.pageNum,
    filter = null,
    searchParams?: SearchParams
  ) {
    this.loans = [];
    this.requestLoader = true;

    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    let getLoansPayload: GenericSpoolRequestPayload = {
      pageNumber: this.pagination.pageNum,
      pageSize: this.pagination.pageSize,
    };

    if (searchParams) {
      getLoansPayload = {
        ...getLoansPayload,
        selectedSearchColumn: searchParams.selectedSearchColumn,
        keyword: searchParams.keyword,
      };
    }

    if (this.filterParams) {
      getLoansPayload = { ...getLoansPayload, ...this.filterParams };
    }

    this.loanoperationService.getLoans(getLoansPayload).subscribe(
      (response) => {
        this.loans = response.body.items;
        this.searchColumns = response.body.searchColumns;
        this.pagination.maxPage = response.body.totalPages;
        this.pagination.totalRecords = response.body.totalCount;
        this.pagination.count = this.loans.length;
        this.pagination.jumpArray = Array(this.pagination.maxPage);
        for (let i = 0; i < this.pagination.jumpArray.length; i++) {
          this.pagination.jumpArray[i] = i + 1;
        }

        if (this.currentProcess) {
          this.loans.forEach((element) => {
            if (element.id === this.selectedLoanId) {
              this.loaninformation = element;
            }
          });
        }

        this.chRef.detectChanges();

        this.requestLoader = false;
        this.getQueryParams();
      },
      (error) => {
        this.requestLoader = false;
      }
    );
  }

  getLoansAwaitingDisbursement(
    pageNum = this.awaitingDisbursementPagination.pageNum,
    filter = null,
    searchParams = null
  ) {
    this.loansAwaitingDisbursement = [];
    this.requestLoader = true;

    // paginated section
    this.awaitingDisbursementPagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.awaitingDisbursementPagination.pageNum = 1;
    }
    if (pageNum > this.awaitingDisbursementPagination.maxPage) {
      this.awaitingDisbursementPagination.pageNum =
        this.awaitingDisbursementPagination.maxPage || 1;
    }

    let paginationModel = {
      UserId: this.currentUserId,
      pageNumber: this.awaitingDisbursementPagination.pageNum,
      pageSize: this.awaitingDisbursementPagination.pageSize,
    };

    if (searchParams) {
      paginationModel = { ...paginationModel, ...searchParams };
    }

    if (this.filterParams) {
      paginationModel = { ...paginationModel, ...this.filterParams };
    }

    this.loanoperationService
      .getLoansAwaitingDisbursement(paginationModel)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.loansAwaitingDisbursement = response.body.items;

          this.awaitingDisbursementPagination.maxPage =
            response.body.totalPages;
          this.awaitingDisbursementPagination.searchColumns =
            response.body.searchColumns;
          this.awaitingDisbursementPagination.totalRecords =
            response.body.totalCount;
          this.awaitingDisbursementPagination.count =
            this.loansAwaitingDisbursement.length;
          this.awaitingDisbursementPagination.jumpArray = Array(
            this.awaitingDisbursementPagination.maxPage
          );
          for (
            let i = 0;
            i < this.awaitingDisbursementPagination.jumpArray.length;
            i++
          ) {
            this.awaitingDisbursementPagination.jumpArray[i] = i + 1;
          }
          this.chRef.detectChanges();
          this.requestLoader = false;
        },
        (error) => {
          this.requestLoader = false;
        }
      );
  }

  setSearchParamsForDeactivatedLoans(searchParams) {
    this.deactivatedLoansSearchTerm = searchParams?.keyword;
    this.selectedDeactivatedLoansSearchColumn =
      searchParams?.selectedSearchColumn;

    this.getDeactivatedLoans();
  }

  getDeactivatedLoans(
    query: GetDataQueryParams = {
      pageNumber: this.deactivatedLoansPagination.pageNumber,
      pageSize: this.deactivatedLoansPagination.pageSize,
      keyword: this.deactivatedLoansSearchTerm,
      selectedSearchColumn: this.selectedDeactivatedLoansSearchColumn,
    }
  ) {
    let payload = query;
    if (this.filterParams) {
      payload = { ...payload, ...this.filterParams };
    }

    this.requestLoader = true;
    this.loanoperationService
      .spoolDeactivatedLoans(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.deactivatedLoans = res.body?.items;
          this.deactivatedLoansSearchColumns = res.body?.searchColumns;
          this.setDeactivatedLoansPagination(res.body);
          if (res.body?.items?.length) {
            this.selectedDeactivatedLoansSearchColumn = "";
            this.deactivatedLoansSearchTerm = "";
          }
          this.requestLoader = false;
        },
        error: () => {
          this.requestLoader = false;
        },
      });
  }

  setDeactivatedLoansPagination(res: GetDeactivatedLoansResBody): void {
    this.deactivatedLoansPagination = res;
    this.deactivatedLoansPagination.count = res.items.length;

    this.deactivatedLoansPagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.deactivatedLoansPagination.jumpArray.push(i);
    }
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
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
          };

          this.loanoperationService.ForceBackgroundEvent(model).subscribe(
            (res) => {
              this.requestLoader = false;
              this.currentProcess = true;
              swal.fire({
                type: "success",
                text: res.value.feedbackmessage,
                title: "Finished!",
              });
              this.switchView(LoansPageCurrentView.Loans);
              this.closeAside();
            },
            (err) => {
              this.requestLoader = false;
            }
          );
        }
      });
  }

  getSettlementAmount(content) {
    this.loadingSettlementAmt = true;
    const date = new Date();
    this.CurrentDate = this.formatDate(date);

    const model = {
      EndDate: this.CurrentDate,
      LoanId: this.selectedLoanId,
      SpoolReason: "settlementamountcheck",
    };
    this.loanoperationService.getSettlementAmount(model).subscribe(
      (res) => {
        this.loadingSettlementAmt = false;
        this.settlementInformation = res.body;
        this.modalService.open(content, {
          centered: true,
          ariaLabelledBy: "modal-basic-title",
          windowClass: "custom-modal-style opq2",
        });
      },
      (err) => {
        this.loadingSettlementAmt = false;
      }
    );
  }

  getLoanDetailsById(id, element?) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.fetchLoan(id);
      }
    });
  }

  fetchLoan(loanId: number, toggleAside = true) {
    this.requestLoader = true;
    this.loanoperationService
      .getLoanapplicationbyid(loanId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.requestLoader = false;
          this.LoanDetails(res.body);
          toggleAside && this.toggleAside();
        },
        () => {
          this.requestLoader = false;
        }
      );
  }

  toggleAside() {
    this.openAside = !this.openAside;
    if (this.qlpLoanId) {
      this.qlpService.successfulLoanId$.next({ id: null, fromLoans: true });
      this.location.back();
    }
  }

  closeAside() {
    (window as any).viewLoan();
  }

  getToday() {
    // tslint:disable-next-line:new-parens
    const dateString = new Date();
    this.currentdate = dateString;
  }

  getTotalSection(type, arrayinput, expectedResult) {
    let total = 0;

    if (type === "repayments") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          if (
            arrayinput[i].paymentTypeString == "Repayment" ||
            arrayinput[i].paymentTypeString == "Settlement"
          ) {
            total += arrayinput[i].paymentAmount;
          }
        }
      }
    }

    if (type === "refunds") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          if (arrayinput[i].paymentTypeString == "Refund") {
            total += arrayinput[i].paymentAmount;
          }
        }
      }
    }

    if (type === "reversals") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          if (arrayinput[i].paymentTypeString == "Reversal") {
            total += arrayinput[i].paymentAmount;
          }
        }
      }
    }

    if (type === "netrepayments") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          if (
            arrayinput[i].paymentTypeString == "Repayment" ||
            arrayinput[i].paymentTypeString == "Settlement"
          ) {
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

  isEmpty(value) {
    var isEmpty = false;
    if (value == "" || value == null) {
      isEmpty = true;
    }
    return isEmpty;
  }

  getDateDiff(date1, date2) {
    const dateOut1 = new Date(date1);
    const dateOut2 = new Date(date2);

    const timeDiff = Math.abs(dateOut2.getTime() - dateOut1.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (timeDiff / (1000 * 3600 * 24) < 1) {
      return "Today";
    } else {
      if (diffDays === 1) {
        return diffDays + " day";
      } else {
        return diffDays.toLocaleString() + " days";
      }
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

      // tslint:disable-next-line:use-isnan
      if (Number.isNaN(days) || Number.isNaN(months) || Number.isNaN(years)) {
        message = "Could not calculate";
      } else {
        message += months + " months : \n";
        message += years + " years ago \n";
      }
    }

    return message;
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

      // tslint:disable-next-line:max-line-length
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

  downloadfile() {
    window.open(this.currentFileDownloadUrl, "_blank");
  }

  getConstants() {
    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  exportLog(type, key: any) {
    if (type === "Settlement") {
      const exportAble = [];
      const options = {
        headers: [
          "As At Date",
          "Customer Name",
          "Loan Amount",
          "Interest Accrued",
          "Total Repayments",
          "Settlement Amount",
        ],
      };
      exportAble.push({
        "As At Date": key.endDate,
        "Customer Name": key.customerName,
        "Loan Amount": key.loanAmount,
        "Interest Accrued": key.interestAccrued,
        "Total Repayments": key.totalRepaid,
        "Settlement Amount": key.settlementAmount,
      });
      new AngularCsv(
        exportAble,
        "Settlment Breakdown as at_" + this.CurrentDate,
        options
      );
    }
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;

    this.pagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getLoans(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.pagination.searchTerm = filter === "" ? null : filter;
    this.getLoans(pageNumber, filter);
  }

  getloansAwaitingDisbursementsPaginatedSearch(filter, pageSize, pageNumber) {
    this.requestLoader = true;
    this.awaitingDisbursementPagination.pageSize = parseInt(pageSize);
    if (filter == null) {
      this.getLoansAwaitingDisbursement(pageNumber, filter);
      return;
    }
    filter = filter.trim();
    this.awaitingDisbursementPagination.searchTerm =
      filter === "" ? null : filter;
    this.getLoansAwaitingDisbursement(pageNumber, filter);
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentUser = user.body;
          this.currentUserId = this.currentUser.userId;
          this.currentUserBranchId = this.currentUser.branchId;
          resolve(user);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  getFileName(response: HttpResponse<Blob>) {
    let filename: string;
    try {
      const contentDisposition: string = response.headers.get(
        "Content-Disposition"
      );
      filename = contentDisposition
        .split(";")[1]
        .split("filename")[1]
        .split("=")[1]
        .trim();
    } catch (e) {
      filename = "Bulk Loan Template.xlsx";
    }
    return filename;
  }

  downloadTemplate() {
    this.downloading = true;
    this.loanoperationService.saveBulkloanTemplate().subscribe(
      (response: HttpResponse<Blob>) => {
        swal.fire(
          "Downloading",
          "Template will start downloading automatically.",
          "success"
        );
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
  onFileSelect(event) {
    let af = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      if (!_.includes(af, file.type)) {
        swal.fire("Attention", "Only EXCEL Docs Allowed!", "info");
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

  uploadCelebrants() {
    if (this.fileInput !== null) {
      this.uploading = true;
      const form = new FormData();

      this.loanoperationService.bulkLoanUpload(form).subscribe(
        (res) => {
          swal.fire(
            "Success",
            "Loan records uploaded successfully.",
            "success"
          );
          this.modalService.dismissAll();
          this.uploading = false;
        },
        (err) => {
          this.uploading = false;
        }
      );
    } else {
      swal.fire(
        "Attention",
        "You have not selected any file to upload.",
        "info"
      );
    }
  }

  openForceActivateModal(
    content: TemplateRef<any>,
    loanId: number,
    event: Event
  ) {
    event.stopPropagation();
    this.fetchLoan(loanId, false);
    this.openModal(content, { windowClass: "force-loan-activation" });
  }

  setActivationDate(value: string) {
    this.forceLoanActivationDate = value;
  }

  forceActivate() {
    const model = {
      loanIds: [this.loaninformation.loanId],
      userId: this.currentUserId,
      type: "ForceScheduleCreation",
      loanStartDate: this.forceLoanActivationDate,
    };
    this.requestLoader = true;
    this.loanoperationService.ForceBackgroundEvent(model).subscribe(
      (response) => {
        this.closeModal();
        this.getLoansAwaitingDisbursement();
        swal.fire({
          type: "success",
          text: response.body.value.feedbackmessage,
          title: "Done!",
        });
        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = false;
      }
    );
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
    this.loadFilterDropdownData();
    this.showPopup = true;
  }

  closeFilterModal() {
    $(".filter-menu").toggle();
  }

  loadFilterDropdownData() {
    this.filters = {};
    for (const key in this.rawFilters) {
      if (Object.prototype.hasOwnProperty.call(this.rawFilters, key)) {
        const element = this.rawFilters[key];

        const mapped = element.map((x) => {
          return { id: x, text: this.humanize(x) };
        });

        this.filters[key] = mapped;
      }
    }
  }

  notifyRemita() {
    this.notifyingRemita = true;
    this.loanoperationService
      .notifyRemita({
        loanId: this.selectedLoanId,
        tenantId: this.appOwnerInfo.appOwnerKey,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.notifyingRemita = false;
          this.closeAside();
          this.toast.fire({
            type: "success",
            title: `Notified remita successfully.`,
          });
        },
        error: () => {
          this.notifyingRemita = false;
        },
      });
  }

  stopRemitaCollection() {
    this.stoppingRemitaCollection = true;
    this.loanoperationService
      .stopRemitaCollection({
        loanId: this.selectedLoanId,
      })
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.stoppingRemitaCollection = false;
          this.closeAside();
          this.toast.fire({
            type: "success",
            title: `Remita collection stopped successfully.`,
          });
        },
        error: () => {
          this.stoppingRemitaCollection = false;
        },
      });
  }

  onViewMandatePaymentHistory(view: TemplateRef<any>) {
    this.isLoadingMandatePaymentHistory = true;
    this.loanoperationService
      .getMandatePaymentHistory(this.selectedLoanId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.mandatePaymentHistory = res.body.data;
          this.isLoadingMandatePaymentHistory = false;
          this.modalService.open(view, {
            size: "lg",
            centered: true,
          });
        },
        error: () => {
          this.isLoadingMandatePaymentHistory = false;
        },
      });
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      let codeType;
      this.currentView === LoansPageCurrentView.AwaitingDisbursementConfirmation
        ? (codeType = "Application")
        : (codeType = "Loan");
      this.toast.fire({
        title: `${codeType} code copied to clipboard`,
        type: "success",
        timer: 3000,
      });
    }
  }

  markLoanAsFailed(event: Event, loan?: Loan, content?: HTMLElement) {
    if (event) {
      event.stopPropagation();
      this.selectedDisbursements = [
        {
          code: loan?.loanCode,
          applicant: loan?.applicant,
          loanAmount: loan?.loanAmount,
          loanId: loan?.id,
          stage: "loan",
        },
      ];
      this.modalService.open(content);
    }
  }

  markDisbAsFailed(
    event: Event,
    loan?: LoansAwaitingDisbursement,
    content?: HTMLElement
  ) {
    if (event) {
      event.stopPropagation();
      this.selectedDisbursements = [
        {
          code: loan?.applicationCode,
          applicant: loan?.applicant,
          loanAmount: loan?.disbursementAmount,
          loanId: loan?.loanId,
          stage: "loanApplication",
        },
      ];
      this.modalService.open(content);
    }
  }

  exportToExcel(data: any[]) {
    const exportAble = [];
    const numericHeaders = [];
    const tableData = [
      { colName: "Application Code", propName: "applicationCode" },
      { colName: "Applicant", propName: "applicant" },
      { colName: "Partner", propName: "disbursementPartner" },
      { colName: "Partner Reference", propName: "partnerLoanReference" },
      { colName: "Bank", propName: "bankName" },
      { colName: "Bank Account Number", propName: "bankAccountNumber" },
      { colName: "Date Disbursed", propName: "dateDisbursed" },
      { colName: "Disbursement Amount", propName: "disbursementAmount" },
    ];

    data.forEach((row) => {
      const exportedData = {};
      if (row) {
        tableData.forEach((item) => {
          if (item.propName === "loanAmount") {
            exportedData[item.colName] = row[item.propName]
              .toString()
              .replace(/s/g, "");
          } else if (item.propName === "bankName") {
            exportedData[item.colName] = row?.bank;
          } else if (item.propName === "bankAccountNumber") {
            exportedData[item.colName] = row?.bankAccountNumber;
          } else {
            exportedData[item.colName] = row[item.propName];
          }
        });

        exportAble.push(exportedData);
      }
    });

    const excelData = {
      title: "Awaiting Disbursement Confirmation",
      headers: tableData.map((item) => item.colName),
      data: exportAble,
    };
    this.excelService.exportExcel(excelData, numericHeaders);
  }

  exportSingleLoanDisbursementInfo(info: any): void {
    info["customerName"] = info.person.displayName;
    this.exportToExcel([info]);
  }

  onViewPayment(template: TemplateRef<any>, payment: LoanPayment) {
    this.selectedPayment = payment;

    this.modalService.open(template, {
      size: "md",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete;
  }
}
