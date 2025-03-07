import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as $ from "jquery";
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
} from "@angular/forms";
import { ReportService } from "../../../service/report.service";
import Swal from "sweetalert2";
import { LoanoperationsService } from "../../../service/loanoperations.service";

import { Observable, of, Subject } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { TypeaheadMatch } from "ngx-bootstrap";
import { ExcelService } from "src/app/service/excel.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { ActivatedRoute, Router } from "@angular/router";
import { AngularCsv } from "angular7-csv/dist/Angular-csv";
import { HttpResponse } from "@angular/common/http";
import * as moment from "moment";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import { PillFilter } from "src/app/model/CustomDropdown";
import { DisbursementReport } from "../loan.types";
@Component({
  selector: "app-report-page",
  templateUrl: "./report-page.component.html",
  styleUrls: ["./report-page.component.scss"],
})
export class ReportPageComponent implements OnInit, OnDestroy {
  @ViewChild("firstTab") firstTab?: ElementRef;
  reportName: string;
  userInfo: any;
  today: number = Date.now();
  searchForm: UntypedFormGroup;
  loader = false;
  activityList: any[];
  investmentReportList: any[];
  investmentLiquidationReportList: any[];
  disbursementList: DisbursementReport[];
  topUpEligibilityList: any[];
  customerReportList: any[];
  redraftReportList: any[];
  feesList: any[];
  reductionReportList: any[];
  interestIncomeList: any[];
  loanbookList: any[];
  paymentsList: any[];
  reportInputDateType: any;
  openReportAside = false;
  requestLoader: boolean;
  ownerInformation: any;
  reportOutputFormatCheck = false;
  loanSearchCheck = false;
  showVolumeofRepayments = false;
  paginated = false;
  loandataSource: Observable<any>;
  StartDate: any;
  EndDate: any;
  reportinvolvesCalculation = false;
  showBranch = false;
  showLoan = false;
  selectedBranchIds: number[] = [];
  selectedLoanIds: number[] = [];
  selectedViewType: string = "grouped";

  searchedLoansResult: any[] = [];
  selectedLoan: any;
  asyncSelected: any;
  typeaheadLoading: boolean;

  searchrequestLoader: boolean;
  loansearchResult: any[] = [];
  repaymentsDueList: any[];
  cbnReportList: any[];
  cbnCustomerReportList: any[];
  collectionsReportList: any[];

  branchesAccessibleArray: any[] = [];
  loantypesArray: any[] = [];
  queuedReportList: any[] = [];

  outputTypeSelect;
  branchSelect;
  loanTypeSelect;

  public unsubscriber$ = new Subject<void>();

  public resultOutputTypeArray: Array<string> = ["Grouped", "Breakdown"];
  selectedOutputType: any = "Breakdown";
  loggedInUser: any;
  pagination = {
    pageNum: 1,
    pageSize: 50,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
  };

  metricsdata: any;

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  downloading: boolean;

  currentTheme: ColorThemeInterface;
  settlementDiffReportList: any[] = [];
  desiredRows: any[] = [50, 100, 200, 500, { id: 1, text: "All" }];
  removeFilterPillAction = false;
  requiredFields = [];
  isStartDateRequired = false;
  isEndDateRequired = false;

  constructor(
    private authService: AuthService,
    private excel: ExcelService,
    private userService: UserService,
    private modalService: NgbModal,
    private reportService: ReportService,
    private configurationService: ConfigurationService,
    private loanoperationService: LoanoperationsService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private router: Router,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService,
    private sharedService: SharedService
  ) {

  }

  ngOnInit() {
    this.loadTheme();
    this.removePill();
    this.loggedInUser = this.authService.decodeToken();

    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }

    this.getUserInfo();

    // For deep linking via finance reports
    this.getReportForViewFromQuery();
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters) => {
        if (selectedFilters.action === "remove") {
          this.removeFilterPillAction = true;
          this.selectedBranchIds = [];
          this.branchSelect = [];
          this.searchForm.get("Branches").reset([]);
          this.selectedLoanIds = [];
          this.loanTypeSelect = [];
          this.searchForm.get("LoanTypes").reset([]);

          selectedFilters.filters.forEach((selectedFilter) => {
            selectedFilter.forEach((filter) => {
              if (filter.type === "branch") {
                this.selectedBranchIds.push(+filter.id);
                this.searchForm
                  .get("Branches")
                  .setValue([...this.searchForm.value.Branches, filter]);
                this.branchSelect = [...this.branchSelect, filter];
              } else if (filter.type === "loan") {
                this.selectedLoanIds.push(+filter.id);
                this.searchForm
                  .get("LoanTypes")
                  .setValue([...this.searchForm.value.LoanTypes, filter]);
                this.loanTypeSelect = [...this.loanTypeSelect, filter];
              } else {
              }
            });
          });

          this.filterReport(this.pagination.pageNum);
        } else {
          this.removeFilterPillAction = false;
        }
      });
  }

  private setBranchesAndLoans(type: "branches" | "loans") {
    if (type === "branches") {
      this.selectedBranchIds = [];
      this.selectedBranchIds = this.branchesAccessibleArray.map(
        (branch) => branch.id
      );

      this.branchSelect = this.branchesAccessibleArray;
      this.searchForm.get("Branches")?.setValue(this.branchesAccessibleArray);
      this.searchForm
        .get("BranchesList")
        ?.setValue(JSON.stringify(this.selectedBranchIds));
    }

    if (type === "loans") {
      this.selectedLoanIds = [];
      this.selectedLoanIds = this.loantypesArray.map((loan) => loan.id);
      this.loanTypeSelect = this.loantypesArray;
      this.searchForm.get("LoanTypes").setValue(this.loantypesArray);
      this.searchForm
        .get("LoanTypeList")
        ?.setValue(JSON.stringify(this.selectedLoanIds));
    }
  }

  toggleSelectAllBranches() {
    this.setBranchesAndLoans("branches");
  }

  toggleSelectAllLoans() {
    this.setBranchesAndLoans("loans");
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getReportForViewFromQuery() {
    const viewReport = this.route.snapshot.queryParams["interestIncome"];
    if (viewReport) {
      this.toggleAside("Interest Income Report");
    }
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  filterModal() {
    $(".generate-menu").toggle();
  }

  getConstants() {
    this.requestLoader = true;
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
        this.requestLoader = false;
      },
      () => {
        this.requestLoader = false;
      }
    );

    this.requestLoader = false;
  }

  loadDropdown() {
    const datamodel = { filter: "", UserId: this.loggedInUser.nameid };
    this.configurationService
      .spoolAccessibleBranches(datamodel)
      .subscribe((response) => {
        this.branchesAccessibleArray = [];
        response.body.forEach((element) => {
          this.branchesAccessibleArray.push({
            id: element.branchId,
            text: element.branchName,
            type: "branch",
          });
        });
        this.requestLoader = false;
      });

    this.configurationService
      .spoolAccessibleLoanTypes(datamodel)
      .subscribe((response) => {
        this.loantypesArray = [];
        response.body.forEach((element) => {
          this.loantypesArray.push({
            id: element.loanTypeId,
            text: element.loanName,
            type: "loan",
          });
        });
      });
  }

  getUserInfo() {
    this.userService.getUserInfo(this.loggedInUser.nameid).subscribe((res) => {
      this.userInfo = res.body;
      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
      this.loadDropdown();
    });
  }

  toggleAside(reportName: string) {
    this.firstTab?.nativeElement?.click();
    this.paginated = true;
    this.reportOutputFormatCheck = false;
    this.showBranch = false;
    this.showLoan = false;
    this.loanSearchCheck = false;
    this.reportinvolvesCalculation = false;
    this.isStartDateRequired = false;
    this.isEndDateRequired = false;
    this.selectedOutputType = null;

    this.reportName = reportName;
    this.ResetReportAsideContent();

    if (this.requiredFields.length > 0) {
      this.requiredFields = [];
    }

    if (this.reportName === "Interest Income Report") {
      this.reportInputDateType = 1; /*start date and end date */
      this.showBranch = true;
      this.showLoan = true;
      this.paginated = false;
      this.showVolumeofRepayments = false;
      this.reportOutputFormatCheck = true;
      this.reportinvolvesCalculation = true;
    } else if (this.reportName === "Loanbook Report") {
      this.reportInputDateType = 3;
      this.loanSearchCheck = true;
      this.showBranch = true;
      this.showLoan = true;
      this.paginated = false;
      this.showVolumeofRepayments = false;
      this.reportOutputFormatCheck = true;
      this.reportinvolvesCalculation = true;
    } else if (this.reportName === "Fee Report") {
      this.showLoan = true;
      this.paginated = false;
      this.showVolumeofRepayments = false;
      this.reportOutputFormatCheck = true;
      this.requiredFields = ["startDate"];
      this.isStartDateRequired = true;
    } else if (
      this.reportName === "Activity Log" ||
      this.reportName === "Customers Information Report"
    ) {
      this.isStartDateRequired = true;
      this.showVolumeofRepayments = false;
    } else if (
      this.reportName === "Disbursement Report" ||
      this.reportName === "Deduction Report" ||
      this.reportName === "Customer Repayment Report"
    ) {
      this.reportInputDateType = 1;
      this.showBranch = true;
      this.showVolumeofRepayments = false;
      this.showLoan = true;
    } else if (this.reportName === "CBN Loan Report") {
      this.reportInputDateType = 1;
      this.showBranch = true;
      this.showLoan = true;
      this.paginated = true;
      this.showVolumeofRepayments = false;
    } else if (this.reportName === "CBN Customer Report") {
      this.showBranch = true;
      this.paginated = true;
      this.showVolumeofRepayments = false;
      this.isStartDateRequired = true;
    } else if (this.reportName === "Repayments Due Report") {
      this.reportInputDateType = 1;
      this.paginated = false;
      this.showVolumeofRepayments = false;
    } else if (this.reportName === "TopUp Eligibility Report") {
      this.reportInputDateType = 1; /*start date and end date */
      this.showBranch = true;
      this.showLoan = true;
      this.paginated = false;
      this.showVolumeofRepayments = true;
    } else if (this.reportName === "Redraft Report") {
      this.reportInputDateType = 2; /*start date and end date */
      this.showVolumeofRepayments = false;
      this.reportOutputFormatCheck = true;
      this.paginated = true;
      this.isStartDateRequired = true;
    } else if (this.reportName === "Payments Report") {
      this.isStartDateRequired = true;
      this.showVolumeofRepayments = false;
      this.paginated = true;
    } else if (this.reportName === "Settlement Differential Report") {
      this.reportInputDateType = 2; /*start date and end date */
      this.showVolumeofRepayments = false;
      this.paginated = true;
      this.requiredFields = ["startDate"];
      this.isStartDateRequired = true;
    } else {
      this.reportInputDateType = 2; /*start date and end date */
      this.showVolumeofRepayments = false;
      this.paginated = true;
      this.requiredFields = ["startDate"];
    }

    this.searchFormInit();
    this.openReportAside = true;
  }

  closeAside() {
    this.sharedService.selectedFilters$.next({
      filters: [],
      headers: [],
      action: "",
    });
    this.openReportAside = false;
    this.reportInputDateType = null;
    this.filterModal();
  }

  openModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal() {
    this.StartDate = null;
    this.EndDate = null;
    this.searchForm.reset();
  }

  searchFormInit() {
    if (this.reportInputDateType === 1 || this.reportInputDateType === 3) {
      this.searchForm = new UntypedFormGroup({
        StartDate: new UntypedFormControl("", []),
        EndDate: new UntypedFormControl("", [Validators.required]),
        Type: new UntypedFormControl(""),
        SearchParam: new UntypedFormControl(""),
        LoanId: new UntypedFormControl(""),
        pageNumber: new UntypedFormControl(""),
        pageSize: new UntypedFormControl(""),
        filter: new UntypedFormControl(""),
        BranchesList: new UntypedFormControl(""),
        LoanTypeList: new UntypedFormControl(""),
        Branches: new UntypedFormControl([]),
        LoanTypes: new UntypedFormControl([]),
        RepaymentVolume: new UntypedFormControl(0),
      });
    } else if (this.reportInputDateType === 4) {
      this.searchForm = new UntypedFormGroup({
        EndDate: new UntypedFormControl("", [Validators.required]),
        StartDate: new UntypedFormControl("", [Validators.required]),
        Type: new UntypedFormControl(""),
        SearchParam: new UntypedFormControl(""),
        LoanId: new UntypedFormControl(""),
        Duration: new UntypedFormControl(""),
        pageNumber: new UntypedFormControl(""),
        pageSize: new UntypedFormControl(""),
        filter: new UntypedFormControl(""),
        BranchesList: new UntypedFormControl(""),
        LoanTypeList: new UntypedFormControl(""),
        Branches: new UntypedFormControl([]),
        LoanTypes: new UntypedFormControl([]),
        EmployersList: new UntypedFormControl(""),
        RepaymentVolume: new UntypedFormControl(""),
        spoolReason: new UntypedFormControl(""),
        draw: new UntypedFormControl(""),
        length: new UntypedFormControl(""),
        start: new UntypedFormControl(""),
        statusType: new UntypedFormControl(""),
      });
    } else {
      this.searchForm = new UntypedFormGroup({
        EndDate: new UntypedFormControl("", [Validators.required]),
        StartDate: new UntypedFormControl("", [Validators.required]),
        Type: new UntypedFormControl(""),
        SearchParam: new UntypedFormControl(""),
        LoanId: new UntypedFormControl(""),
        pageNumber: new UntypedFormControl(""),
        pageSize: new UntypedFormControl(""),
        filter: new UntypedFormControl(""),
        BranchesList: new UntypedFormControl(""),
        Branches: new UntypedFormControl([]),
        LoanTypes: new UntypedFormControl([]),
        LoanTypeList: new UntypedFormControl(""),
        RepaymentVolume: new UntypedFormControl(""),
      });
    }

    if (this.reportOutputFormatCheck) {
      this.searchForm.addControl(
        "outputType",
        new UntypedFormControl(null, [Validators.required])
      );
    }
  }

  ResetReportAsideContent() {
    this.interestIncomeList = [];
    this.disbursementList = [];
    this.reductionReportList = [];
    this.activityList = [];
    this.investmentReportList = [];
    this.investmentLiquidationReportList = [];
    this.feesList = [];
    this.loanbookList = [];
    this.paymentsList = [];
    this.repaymentsDueList = [];
    this.cbnReportList = [];
    this.cbnCustomerReportList = [];
    this.pagination.totalRecords = 0;
    this.topUpEligibilityList = [];
    this.customerReportList = [];
    this.collectionsReportList = [];
    this.redraftReportList = [];
    this.settlementDiffReportList = [];
    this.queuedReportList = [];
    this.selectedBranchIds = [];
    this.selectedLoanIds = [];
    this.outputTypeSelect = null;
    this.loanTypeSelect = [];
    this.branchSelect = [];
    this.StartDate = null;
    this.EndDate = null;
  }
  setFilters(filters: PillFilter[][], headers: string[]) {
    const selectedFilters: PillFilters = {
      filters,
      action: "add",
      headers,
    };

    this.sharedService.selectedFilters$.next(selectedFilters);
  }

  setBranchesAndLoanTypes() {
    this.searchForm.value.BranchesList?.length === 0 &&
      this.setBranchesAndLoans("branches");
    this.searchForm.value.LoanTypeList?.length === 0 &&
      this.setBranchesAndLoans("loans");
  }

  filterReport(pageNum = this.pagination.pageNum, filter = null) {
    // paginated section
    this.pagination.pageNum = pageNum;
    if (pageNum < 1) {
      this.pagination.pageNum = 1;
    }
    if (pageNum > this.pagination.maxPage) {
      this.pagination.pageNum = this.pagination.maxPage || 1;
    }

    if (this.searchForm.valid) {
      this.searchForm.controls["Type"].patchValue(this.selectedOutputType);
      this.searchForm.controls["BranchesList"].patchValue(
        this.selectedBranchIds.length > 0
          ? JSON.stringify(this.selectedBranchIds)
          : ""
      );

      if (!this.branchSelect) {
        this.branchSelect = [];
        this.selectedBranchIds.forEach((branchId) => {
          this.branchesAccessibleArray.forEach((branch) => {
            if (branch.id === branchId) {
              this.branchSelect.push({ id: branch.id, text: branch.text });
            }
          });
        });
      }

      if (!this.loanTypeSelect) {
        this.loanTypeSelect = [];
        this.selectedLoanIds.forEach((loanId) => {
          this.loantypesArray.forEach((loan) => {
            if (loan.id === loanId) {
              this.loanTypeSelect.push({ id: loan.id, text: loan.text });
            }
          });
        });
      }

      this.searchForm.controls["LoanTypeList"].patchValue(
        this.selectedLoanIds.length > 0
          ? JSON.stringify(this.selectedLoanIds)
          : ""
      );

      this.searchForm.controls["pageNumber"].patchValue(
        this.paginated === true ? this.pagination.pageNum : 0
      );
      this.searchForm.controls["pageSize"].patchValue(
        this.paginated === true ? this.pagination.pageSize : 1000
      );
      this.searchForm.controls["filter"].patchValue(
        this.paginated === true ? this.pagination.searchTerm : ""
      );

      if (
        this.searchForm.controls["Type"].value == "Breakdown" &&
        this.searchForm.controls["pageNumber"].value == 0
      ) {
        this.pagination.pageNum = 1;
        this.searchForm.controls["pageNumber"].patchValue(1);
      }

      this.loader = true;
      this.getConstants();

      if (this.reportName === "Activity Log") {
        this.activityList = [];
        this.reportService.fetchActivityLog(this.searchForm.value).subscribe(
          (res) => {
            this.loader = false;

            if (res.body.value.queued) {
              Swal.fire("Success", res.body.value.message, "success");
            } else {
              this.activityList = res.body.value.data;

              if (this.paginated === true) {
                this.pagination.maxPage = res.body.value.pages;
                this.pagination.totalRecords = res.body.value.totalRecords;
                this.pagination.count = this.activityList.length;
                this.pagination.jumpArray = Array(this.pagination.maxPage);
                for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                  this.pagination.jumpArray[i] = i + 1;
                }
              }
            }
          },
          (err) => {
            this.loader = false;

            // Swal.fire('Error', err.error, 'error');
          }
        );
      } else if (this.reportName === "Disbursement Report") {
        this.setBranchesAndLoanTypes();
        this.disbursementList = [];
        const { Branches, LoanTypes, ...payload } = this.searchForm.value;
        this.reportService
          .fetchDisbursement(payload)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.setFilters(
                [
                  this.searchForm.value?.Branches,
                  this.searchForm.value?.LoanTypes,
                ],
                ["Branches", "Loans Types"]
              );

              this.loader = false;

              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.disbursementList = res.body.value.data;
                this.metricsdata = res.body.value.resultSummary;

                if (this.paginated === true) {
                  this.pagination.maxPage = res.body.value.pages;
                  this.pagination.totalRecords = res.body.value.totalRecords;
                  this.pagination.count = this.disbursementList.length;
                  this.pagination.jumpArray = Array(this.pagination.maxPage);
                  for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                    this.pagination.jumpArray[i] = i + 1;
                  }
                }
              }
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (this.reportName === "Deduction Report") {
        this.reductionReportList = [];
        this.reportService
          .fetchReductionReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.setFilters(
                [
                  this.searchForm.value?.Branches,
                  this.searchForm.value?.LoanTypes,
                ],
                ["Branches", "Loans Types"]
              );
              this.loader = false;

              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.reductionReportList = res.body.value.data;

                if (this.paginated === true) {
                  this.pagination.maxPage = res.body.value.pages;
                  this.pagination.totalRecords = res.body.value.totalRecords;
                  this.pagination.count = this.reductionReportList.length;
                  this.pagination.jumpArray = Array(this.pagination.maxPage);
                  for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                    this.pagination.jumpArray[i] = i + 1;
                  }
                }
              }
            },
            (err) => {
              this.loader = false;

              // Swal.fire('Error', err.error, 'error');
            }
          );
      } else if (this.reportName === "Interest Income Report") {
        if (this.selectedOutputType === "" || this.selectedOutputType == null) {
          this.loader = false;
          Swal.fire({
            type: "info",
            text: "Please select a preferred result output format before generating",
          });
        } else {
          this.interestIncomeList = [];
          // tslint:disable-next-line:max-line-length
          if (this.selectedLoan !== "" && this.selectedLoan != null) {
            this.searchForm.controls["LoanId"].patchValue(
              this.selectedLoan.loanId
            );
          }

          this.reportService
            .fetchInterestIncomeReport(this.searchForm.value)
            .pipe(takeUntil(this.unsubscriber$))
            .subscribe(
              (res) => {
                this.setFilters(
                  [
                    [
                      "",
                      {
                        id: this.outputTypeSelect[0],
                        text: this.outputTypeSelect[0],
                      },
                    ],
                    this.searchForm.value?.Branches,
                    this.searchForm.value?.LoanTypes,
                  ],
                  ["Preferred Output", "Branches", "Loan Types"]
                );
                this.loader = false;

                if (res.body.value.queued) {
                  Swal.fire("Success", res.body.value.message, "success");
                } else {
                  this.interestIncomeList =
                    this.selectedOutputType === "Grouped"
                      ? [res.body.value.groupedSummary]
                      : res.body.value.data;
                  this.metricsdata = res.body.value.resultSummary;

                  if (this.paginated === true) {
                    this.pagination.maxPage = res.body.value.pages;
                    this.pagination.totalRecords = res.body.value.totalRecords;
                    this.pagination.count = this.interestIncomeList.length;
                    this.pagination.jumpArray = Array(this.pagination.maxPage);
                    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                      this.pagination.jumpArray[i] = i + 1;
                    }
                  }
                }
                // this.clearInput(1);
              },
              (err) => {
                this.loader = false;

                // Swal.fire('Error', err.error, 'error');
              }
            );
        }
      } else if (this.reportName === "Fee Report") {
        // tslint:disable-next-line:max-line-length
        if (this.selectedOutputType === "" || this.selectedOutputType == null) {
          this.loader = false;
          Swal.fire({
            type: "info",
            text: "Please select a preferred result output format before generating",
          });
        } else {
          this.setBranchesAndLoanTypes();
          this.feesList = [];
          this.searchForm.value.BranchesList?.length === 0 &&
            this.setBranchesAndLoans("branches");
          this.searchForm.value.LoanTypeList?.length === 0 &&
            this.setBranchesAndLoans("loans");
          this.reportService
            .fetchFeeReport(this.searchForm.value)
            .pipe(takeUntil(this.unsubscriber$))
            .subscribe(
              (res) => {
                this.setFilters(
                  [this.searchForm.value?.LoanTypes],
                  ["Loans Types"]
                );

                this.loader = false;

                if (res.body.value.queued) {
                  Swal.fire("Success", res.body.value.message, "success");
                } else {
                  this.feesList = res.body.value.data;
                }
              },
              (err) => {
                this.loader = false;
                // Swal.fire({ type: 'error',  text: err.error  });
                // Swal.fire('Error', err.error, 'error');
              }
            );
        }
      } else if (this.reportName === "Loanbook Report") {
        this.loanbookList = [];

        if (this.selectedOutputType === "" || this.selectedOutputType == null) {
          this.loader = false;
          Swal.fire({
            type: "info",
            text: "Please select a preferred result output format before generating",
          });
        } else {
          // tslint:disable-next-line:max-line-length
          if (this.selectedLoan !== "" && this.selectedLoan != null) {
            this.searchForm.controls["LoanId"].patchValue(
              this.selectedLoan.loanId
            );
          }
          this.setBranchesAndLoanTypes();

          this.reportService
            .fetchLoanbookReport(this.searchForm.value)
            .subscribe(
              (res) => {
                this.setFilters(
                  [
                    [
                      "",
                      {
                        id: this.outputTypeSelect[0],
                        text: this.outputTypeSelect[0],
                      },
                    ],
                    this.searchForm.value?.Branches,
                    this.searchForm.value?.LoanTypes,
                  ],
                  ["Preferred Output", "Branches", "Loan Types"]
                );
                this.loader = false;
                if (res.body.value.queued) {
                  Swal.fire("Success", res.body.value.message, "success");
                } else {
                  this.loanbookList =
                    this.selectedOutputType === "Grouped"
                      ? [res.body.value.groupedSummary]
                      : res.body.value.data;
                  this.metricsdata = res.body.value.resultSummary;

                  // this.loanbookList = res.body.value.data;
                  // this.metricsdata = res.body.value.resultSummary;

                  if (this.paginated === true) {
                    this.pagination.maxPage = res.body.value.pages;
                    this.pagination.totalRecords = res.body.value.totalRecords;
                    this.pagination.count = this.loanbookList.length;
                    this.pagination.jumpArray = Array(this.pagination.maxPage);
                    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                      this.pagination.jumpArray[i] = i + 1;
                    }
                  }
                }
              },
              (err) => {
                this.loader = false;
                // Swal.fire('Error', err.error, 'error');
              }
            );
        }
      } else if (this.reportName === "Payments Report") {
        this.paymentsList = [];
        this.reportService.fetchPaymentsReport(this.searchForm.value).subscribe(
          (res) => {
            this.loader = false;

            if (res.body.value.queued) {
              Swal.fire("Success", res.body.value.message, "success");
            } else {
              this.paymentsList = res.body.value.data;

              if (this.paginated === true) {
                this.pagination.maxPage = res.body.value.pages;
                this.pagination.totalRecords = res.body.value.totalRecords;
                this.pagination.count = this.paymentsList.length;
                this.pagination.jumpArray = Array(this.pagination.maxPage);
                for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                  this.pagination.jumpArray[i] = i + 1;
                }
              }
            }
          },
          (err) => {
            this.loader = false;
            // Swal.fire('Error', err.error, 'error');
          }
        );
      } else if (this.reportName === "CBN Loan Report") {
        this.cbnReportList = [];
        this.setBranchesAndLoanTypes();
        this.reportService
          .fetchCbnReport(this.searchForm.value)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.setFilters(
                [
                  this.searchForm.value?.Branches,
                  this.searchForm.value?.LoanTypes,
                ],
                ["Branches", "Loans Types"]
              );
              this.loader = false;

              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.cbnReportList = res.body.value.cbnInfo.cbnInformations;

                if (this.paginated === true) {
                  this.pagination.maxPage = res.body.value.pages;
                  this.pagination.totalRecords = res.body.value.totalRecords;
                  this.pagination.count = this.cbnReportList.length;
                  this.pagination.jumpArray = Array(this.pagination.maxPage);
                  for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                    this.pagination.jumpArray[i] = i + 1;
                  }
                }
              }
            },
            (err) => {
              this.loader = false;
              //   Swal.fire('Error', err.error, 'error');
            }
          );
      } else if (this.reportName === "CBN Customer Report") {
        this.cbnCustomerReportList = [];
        this.reportService
          .fetchCbnCustomerReport(this.searchForm.value)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.setFilters([this.searchForm.value?.Branches], ["Branches"]);

              this.loader = false;

              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.cbnCustomerReportList =
                  res.body.value.customers.customerInfos;

                if (this.paginated === true) {
                  this.pagination.maxPage = res.body.value.pages;
                  this.pagination.totalRecords = res.body.value.totalRecords;
                  this.pagination.count = this.cbnCustomerReportList.length;
                  this.pagination.jumpArray = Array(this.pagination.maxPage);
                  for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                    this.pagination.jumpArray[i] = i + 1;
                  }
                }
              }
            },
            (err) => {
              this.loader = false;
              // Swal.fire('Error', err.error, 'error');
            }
          );
      } else if (this.reportName === "Repayments Due Report") {
        /* if(this.selectedOutputType === "" || this.selectedOutputType == null) {  this.loader = false; Swal.fire({  type: 'info',text: "Please select a preferred result output format before generating" });}
         else{ */

        this.repaymentsDueList = [];
        this.reportService
          .fetchRepaymentsDueReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.loader = false;
              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.repaymentsDueList = res.body.value.data;
              }
            },
            (err) => {
              this.loader = false;
              //  Swal.fire({ type: 'error', text: err.error });
            }
          );
      } else if (this.reportName === "Investment Report") {
        this.investmentReportList = [];
        this.reportService
          .fetchInvestmentReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.loader = false;
              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.investmentReportList = res.body.value.data;

                if (this.paginated === true) {
                  this.pagination.maxPage = res.body.value.pages;
                  this.pagination.totalRecords = res.body.value.totalRecords;
                  this.pagination.count = this.paymentsList.length;
                  this.pagination.jumpArray = Array(this.pagination.maxPage);
                  for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                    this.pagination.jumpArray[i] = i + 1;
                  }
                }
              }
            },
            (err) => {
              this.loader = false;
              // Swal.fire({ type: 'error',  text: err.error  });
              //  Swal.fire('Error', err.error, 'error');
            }
          );
      } else if (this.reportName === "Investment Liquidation Report") {
        this.investmentLiquidationReportList = [];
        this.reportService
          .fetchInvestmentLiquidationReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.loader = false;
              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.investmentLiquidationReportList = res.body.value.data;

                if (this.paginated === true) {
                  this.pagination.maxPage = res.body.value.pages;
                  this.pagination.totalRecords = res.body.value.totalRecords;
                  this.pagination.count = this.paymentsList.length;
                  this.pagination.jumpArray = Array(this.pagination.maxPage);
                  for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                    this.pagination.jumpArray[i] = i + 1;
                  }
                }
              }
            },
            (err) => {
              this.loader = false;
              //  Swal.fire('Error', err.error, 'error');
            }
          );
      } else if (this.reportName === "TopUp Eligibility Report") {
        this.topUpEligibilityList = [];
        this.setBranchesAndLoanTypes();
        this.reportService
          .fetchTopUpEligibilityReport(this.searchForm.value)
          .subscribe(
            (res) => {
              this.loader = false;
              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.topUpEligibilityList = res.body.value.data;
              }
            },
            (err) => {
              this.loader = false;
              //  Swal.fire({ type: 'error', text: err.error });
            }
          );
      } else if (this.reportName === "Customers Information Report") {
        this.customerReportList = [];
        this.reportService
          .fetchCustomerReport(this.searchForm.value)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.loader = false;

              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.customerReportList = res.body.value.data;
                this.metricsdata = res.body.value.resultSummary;

                if (this.paginated === true) {
                  this.pagination.maxPage = res.body.value.pages;
                  this.pagination.totalRecords = res.body.value.totalEntries;
                  this.pagination.count = this.customerReportList.length;
                  this.pagination.jumpArray = Array(this.pagination.maxPage);
                  for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                    this.pagination.jumpArray[i] = i + 1;
                  }
                }
              }
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (this.reportName === "Customer Repayment Report") {
        this.collectionsReportList = [];
        this.setBranchesAndLoanTypes();
        this.reportService
          .fetchCollectionsReport(this.searchForm.value)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.setFilters(
                [
                  this.searchForm.value?.Branches,
                  this.searchForm.value?.LoanTypes,
                ],
                ["Branches", "Loans Types"]
              );
              this.loader = false;

              if (res.body.value.queued) {
                Swal.fire("Success", res.body.value.message, "success");
              } else {
                this.collectionsReportList = res.body.value.data;

                if (this.paginated === true) {
                  this.pagination.maxPage = res.body.value.pages;
                  this.pagination.totalRecords = res.body.value.totalRecords;
                  this.pagination.count = this.collectionsReportList.length;
                  this.pagination.jumpArray = Array(this.pagination.maxPage);
                  for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                    this.pagination.jumpArray[i] = i + 1;
                  }
                }
              }
            },
            (err) => {
              this.loader = false;
            }
          );
      } else if (this.reportName === "Redraft Report") {
        this.redraftReportList = [];
        this.fetchRedraftReport(this.selectedOutputType);
      } else if (this.reportName === "Settlement Differential Report") {
        this.settlementDiffReportList = [];
        this.fetchLoanSettlementReport();
      }
    }

    if (!this.removeFilterPillAction) this.filterModal();
  }

  fetchLoanSettlementReport() {
    this.loader = true;
    this.paginated = true;

    this.reportService
      .fetchSettlementDiffReport(this.searchForm.value)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.loader = false;

          if (res.body.value.queued) {
            Swal.fire("Success", res.body.value.message, "success");
          } else {
            this.settlementDiffReportList = res.body.value.data;
            this.settlementDiffReportList.forEach(
              (x) =>
                (x.repaymentBalanceType = this.humanize(x.repaymentBalanceType))
            );

            this.metricsdata = res.body.value.resultSummary;

            if (this.paginated === true) {
              this.pagination.maxPage = res.body.value.pages;
              this.pagination.totalRecords = res.body.value.totalEntries;
              this.pagination.count = this.settlementDiffReportList.length;
              this.pagination.jumpArray = Array(this.pagination.maxPage);
              for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                this.pagination.jumpArray[i] = i + 1;
              }
            }
          }
        },
        (err) => {
          this.loader = false;
        }
      );
  }
  fetchRedraftReport(viewType: string) {
    this.loader = true;
    this.paginated = true;

    this.reportService
      .fetchRedraftReport(this.searchForm.value, viewType)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.setFilters(
            [
              [
                "" as any,
                {
                  id: this.outputTypeSelect[0],
                  text: this.outputTypeSelect[0],
                },
              ],
            ],
            ["Preferred Output"]
          );
          this.loader = false;

          if (res.body.value.queued) {
            Swal.fire("Success", res.body.value.message, "success");
          } else {
            this.redraftReportList = res.body.value.data;

            this.metricsdata = res.body.value.resultSummary;

            if (this.paginated === true) {
              this.pagination.maxPage = res.body.value.pages;
              this.pagination.totalRecords = res.body.value.totalEntries;
              this.pagination.count = this.redraftReportList.length;
              this.pagination.jumpArray = Array(this.pagination.maxPage);
              for (let i = 0; i < this.pagination.jumpArray.length; i++) {
                this.pagination.jumpArray[i] = i + 1;
              }
            }
          }
        },
        (err) => {
          this.loader = false;
        }
      );
  }

  loadQueuedReports() {
    this.requestLoader = true;
    let reportName = this.reportName;
    if (reportName === "Activity Log") {
      reportName = "Activity Report";
    } else if (reportName === "Repayments Due Report") {
      reportName = "Repayment Due Report";
    } else if (reportName === "Payments Report") {
      reportName = "Payment Report";
    }
    this.reportService.spoolQueuedReports(reportName).subscribe(
      (res) => {
        this.queuedReportList = res.body.value.data;
        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = false;
        // Swal.fire('Error', error.error, 'error');
      }
    );
  }

  getTotalSection(type, arrayinput, expectedResult) {
    let total = 0;

    if (type === "interestIncomeForPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].interestIncomeForPeriod);
        }
      }
    } else if (type === "interestIncomeTillPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].interestIncomeTillPeriod);
        }
      }
    } else if (type === "settlementAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].settlementAmount);
        }
      }
    } else if (type === "totalRepayed") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].totalRepayed);
        }
      }
    } else if (type === "feesBreakdown") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].feesCharged);
        }
      }
    } else if (type === "feesGrouped") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].totalFeesCharged);
        }
      }
    } else if (type === "feesGroupedLoanCount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].loanCount);
        }
      }
    } else if (type === "paymentAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].paymentAmount);
        }
      }
    } else if (type == "loanAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].loanAmount);
        }
      }
    } else if (type == "repaymentsDue") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].repaymentsDue);
        }
      }
    } else if (type == "repaymentsMade") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].repaymentsMade);
        }
      }
    } else if (type == "expectedAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].expectedAmountInPeriod);
        }
      }
    } else if (type == "expectedPrincipalPortionAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].expectedPrincipalPortionAmount);
        }
      }
    } else if (type == "expectedInterestPortionAmount") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].expectedInterestPortionAmount);
        }
      }
    } else if (type == "reconciledRepaymentsMadeInPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].reconciledRepaymentsMadeInPeriod);
        }
      }
    } else if (type == "scheduleRepaymentsDueInPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].scheduleRepaymentsDueInPeriod);
        }
      }
    } else if (type == "totalRepaymentsMadeTillPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].totalRepaymentsMadeTillPeriod);
        }
      }
    } else if (type == "totalAccumRepaymentsDueTillPeriod") {
      if (arrayinput != null) {
        for (let i = 0, len = arrayinput.length; i < len; i++) {
          total += parseFloat(arrayinput[i].totalAccumRepaymentsDueTillPeriod);
        }
      }
    }

    if (expectedResult === "formatted") {
      return total.toLocaleString(undefined, { minimumFractionDigits: 2 });
    } else {
      return total;
    }
  }

  selected(type, data, index) {
    if (type === "OutputType") {
      this.selectedOutputType = data.id;
      this.searchForm.get("outputType").patchValue(data?.id);

      data.id == "Grouped" && this.reportName !== "Redraft Report"
        ? (this.paginated = false)
        : (this.paginated = true);
    } else if (type === "AccessibleBranch") {
      this.selectedBranchIds.push(data.id);
      this.searchForm
        .get("Branches")
        .setValue([
          ...this.searchForm.value.Branches,
          { ...data, type: "branch" },
        ]);
    } else if (type === "LoanTypes") {
      this.selectedLoanIds.push(data.id);
      this.searchForm
        .get("LoanTypes")
        .setValue([
          ...this.searchForm.value.LoanTypes,
          { ...data, type: "loan" },
        ]);
    } else if (type === "rowSize") {
      if (data.id !== "1") {
        this.pagination.pageSize = +data?.id;
      } else {
        this.pagination.pageSize = 10000000;
      }
    }
  }

  removed(type, data) {
    if (type === "Branch") {
    } else if (type === "AccessibleBranch") {
      this.selectedBranchIds = this.selectedBranchIds.filter(
        (id) => id !== data?.id
      );

      let remainingBranches = this.searchForm.value.Branches;
      remainingBranches = remainingBranches.filter(
        (branch) => branch.id !== data.id
      );
      remainingBranches.length === 0
        ? this.searchForm.get("Branches").setValue(null)
        : this.searchForm.get("Branches").setValue(remainingBranches);
    } else if (type === "LoanTypes") {
      this.selectedLoanIds = this.selectedLoanIds.filter(
        (id) => id !== data?.id
      );

      let remainingLoans = this.searchForm.value.LoanTypes;
      remainingLoans = remainingLoans.filter((loan) => loan.id !== data.id);
      this.searchForm.get("LoanTypes").setValue(remainingLoans);
    }
  }

  exportLog(data: any[]) {
    if (this.reportName === "Activity Log") {
      const exportAble = [];
      const options = {
        headers: ["Description", "Action Date"],
      };
      data.forEach((key) => {
        exportAble.push({
          Description: key.activityDescription,
          "Action Date": key.activityDate,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      // new AngularCsv(exportAble, 'Loanbook Activity Log', options);
      const excelData = {
        title: "Loanbook Activity Log",
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData);
    } else if (this.reportName === "Disbursement Report") {
      const exportAble = [];

      const options = {
        headers: [
          "Loan Code",
          "Application Code",
          "Customer Code",
          "Firstname",
          "Surname",
          "Phone Number",
          "Email Address",
          "Date of Birth",
          "Product Type",
          "Loan Term",
          "Rate",
          "Loan Amount",
          "Upfront Fees",
          "Total Fees Charged",
          "Parent Loan OutStanding Amount",
          "Parent Loan Code",
          "Disbursed Amount",
          "Deposit Amount",
          "Deposit Received",
          "Loan Periodic Installment",
          "Creation Date",
          "Created By",
          "Reviewer",
          "Date Approved",
          "Time Approved",
          "Disbursement Date",
          "Disbursement TAT",
          "Account Number",
          "Bank Name",
          "Loan Start Date",
          "Loan Status",
          "Employer Name",
          "Employee Code",
          "Date of Employment",
          "State",
          "Branch",
          "Sales Agent Staff ID",
          "Sales Agent",
          "Loan Application Category",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          "Loan Code": key.loanCode,
          "Application Code": key.applicationCode,
          "Customer Code": key.customerCode,
          Firstname: key.firstName,
          Surname: key.surname,
          "Phone Number": key.phoneNumber,
          "Email Address": key.emailAddress,
          "Date of Birth": key.dateOfBirth,
          "Product Type": key.productType,
          "Loan Term": key.loanTerm,
          Rate: key.rate,
          "Loan Amount": this.numberify(key.loanAmount),
          "Upfront Fees": key.upFrontFees,
          "Total Fees Charged": key.totalFeesCharged,
          "Parent Loan OutStanding Amount": key.parentLoanOutStandingAmount,
          "Parent Loan Code": key.parentLoanCode,
          "Disbursed Amount": key.disbursedAmount,
          "Deposit Amount": key.depositAmount,
          "Deposit Received": key.isLoanDepositRecieved,
          "Loan Periodic Installment": key.loanPeriodicInstallment,
          "Creation Date": key.creationDate,
          "Created By": key.createdBy,
          Reviewer: key.reviewer,
          "Date Approved": key.dateApproved,
          "Time Approved": key.timeApproved,
          "Disbursement Date": key.disbursementDate,
          "Disbursement TAT": key.disbursementTat,
          "Account Number": key.bankAccountNumber,
          "Bank Name": key.bankName,
          "Loan Start Date": key.loanStartDate,
          "Loan Status": key.loanStatus,
          "Employer Name": key.employerName ? key.employerName : "",
          "Employee Code": key.employeeCode || "",
          "Date of Employment": key.dateOfEmployment,
          State: key.state,
          Branch: key.branch,
          "Sales Agent Staff ID": key.salesAgentStaffId,
          "Sales Agent": key.salesAgent,
          "Loan Application Category": key.loanApplicationCategory,
        });
      });
      const numericHeaders = [
        "Rate",
        "Loan Amount",
        "Upfront Fees",
        "Disbursed Amount",
        "Loan Periodic Installment",
        "Disbursement TAT",
        "Total Fees Charged",
        "Parent Loan OutStanding Amount",
      ];
      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });
      // tslint:disable-next-line:no-unused-expression
      // new AngularCsv(exportAble, 'Disbursement Report', options);
      var titleName = "Disbursement Report_";
      var titleFullname =
        this.StartDate === "" || this.StartDate == null
          ? titleName + "As At_" + this.EndDate
          : titleName + this.StartDate + "_to_" + this.EndDate;
      const excelData = {
        title: titleFullname,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Deduction Report") {
      const exportAble = [];
      const options = {
        headers: [
          "Loan Code",
          "Employee Code",
          "Firstname",
          "Surname",
          "Loan Amount",
          "Loan Term",
          "Loan Periodic Installment",
          "Employer Name",
          "State",
          "Creation Date",
          "Product Type",
          "Loan Status",
          "Sales Agent",
          "Branch",
          "Reviewer",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          "Loan Code": key.loanCode,
          "Employee Code": key.employeeCode ? key.employeeCode.toString() : "",
          Firstname: key.firstName,
          Surname: key.surname,
          "Employer Name": key.employerName ? key.employerName : "",

          "Product Type": key.productType,

          "Loan Amount": key.loanAmount,
          "Loan Term": key.loanTerm,
          "Loan Periodic Installment": key.loanPeriodicInstallment,
          "Loan Status": key.loanStatus,

          "Sales Agent": key.salesAgent,
          "Creation Date": key.creationDate,
          Branch: key.branch,
          Reviewer: key.reviewer,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      // new AngularCsv(exportAble, 'Deduction Report', options);
      const numericHeaders = ["Loan Amount", "Loan Periodic Installment"];
      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });
      const excelData = {
        title: "Deduction Report",
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Interest Income Report") {
      const exportAble = [];

      if (this.StartDate === "" || this.StartDate == null) {
        const options = {
          // tslint:disable-next-line:max-line-length
          headers:
            this.selectedOutputType === "Grouped"
              ? ["Total InterestIncome For Period"]
              : [
                  "Loan Code",
                  "Customer Name",
                  "Employment Code",
                  "Branch",
                  "Product Type",
                  "Rate",
                  "Tenor",
                  "Loan Amount",
                  "Fees Charged",
                  "Disbursed Amount",
                  "Periodic Installment",
                  "Loan Start Date",
                  "Date Disbursed",
                  "Status",
                  "Account Closure Type",
                  "Period",
                  "Interest Income For Period",
                  "Interest Income Till Period",
                ],
        };
        let numericHeaders = [];
        if (this.selectedOutputType === "Grouped") {
          data.forEach((key) => {
            exportAble.push({
              "Total InterestIncome For Period":
                key.totalInterestIncomeForPeriod,
            });
          });
          numericHeaders = ["Total InterestIncome For Period"];
        } else {
          data.forEach((key) => {
            exportAble.push({
              "Loan Code": key.loanCode,
              "Customer Name": key.customerName,
              "Employment Code": key?.employmentCode,
              Branch: key.branch,
              "Product Type": key.productType,
              Rate: key.rate,
              Tenor: key.loanTenor,
              "Loan Amount": key.loanAmount,
              "Fees Charged": key.feesCharged,
              "Disbursed Amount": key.disbursedAmount,
              "Periodic Installment": key.periodicInstallment,
              "Loan Start Date": key.loanStartDate,
              "Date Disbursed": key.dateDisbursed,
              Status: key.status,
              "Account Closure Type": key.accountClosureType,
              Period: key.currentPeriod,
              "Interest Income For Period": key.interestIncomeForPeriod,
              "Interest Income Till Period": key.interestIncomeTillPeriod,
            });
          });
          numericHeaders = [
            "Rate",
            "Loan Amount",
            "Fees Charged",
            "Disbursed Amount",
            "Periodic Installment",
            "Interest Income For Period",
            "Interest Income Till Period",
          ];
        }

        // tslint:disable-next-line:no-unused-expression
        // new AngularCsv(exportAble, 'Interest Income Report As At_' + this.EndDate, options);
        exportAble.forEach((row) => {
          numericHeaders.forEach((column) => {
            row[column] = this.numberify(row[column]);
          });
        });
        const excelData = {
          title: "Interest Income Report As At_" + this.EndDate,
          headers: options.headers,
          data: exportAble,
        };
        this.excel.exportExcel(excelData, numericHeaders);
      } else {
        const options = {
          // tslint:disable-next-line:max-line-length
          headers:
            this.selectedOutputType === "Grouped"
              ? ["Total InterestIncome For Period"]
              : [
                  "Loan Code",
                  "Customer Name",
                  "Employment Code",
                  "Branch",
                  "Product Type",
                  "Rate",
                  "Tenor",
                  "Loan Amount",
                  "Fees Charged",
                  "Disbursed Amount",
                  "Periodic Installment",
                  "Loan Start Date",
                  "Date Disbursed",
                  "Status",
                  "Account Closure Type",
                  "Interest Income In Period",
                ],
        };

        if (this.selectedOutputType === "Grouped") {
          data.forEach((key) => {
            exportAble.push({
              "Total InterestIncome For Period":
                key.totalInterestIncomeForPeriod,
            });
          });
        } else {
          data.forEach((key) => {
            exportAble.push({
              "Loan Code": key.loanCode,
              "Customer Name": key.customerName,
              "Employment Code": key?.employmentCode,
              Branch: key.branch,
              "Product Type": key.productType,
              Rate: key.rate,
              Tenor: key.loanTenor,
              "Loan Amount": key.loanAmount,
              "Fees Charged": key.feesCharged,
              "Disbursed Amount": key.disbursedAmount,
              "Periodic Installment": key.periodicInstallment,
              "Loan Start Date": key.loanStartDate,
              "Date Disbursed": key.dateDisbursed,
              Status: key.status,
              accountClosureType: key.accountClosureType,
              "Interest Income In Period": key.interestIncomeForPeriod,
            });
          });
        }

        // tslint:disable-next-line:no-unused-expression
        // new AngularCsv(
        //   exportAble,
        //   "Interest Income from " + this.StartDate + " to " + this.EndDate,
        //   options
        // );
        const numericHeaders = [
          "Rate",
          "Loan Amount",
          "Fees Charged",
          "Disbursed Amount",
          "Periodic Installment",
          "Interest Income In Period",
        ];
        exportAble.forEach((row) => {
          numericHeaders.forEach((column) => {
            row[column] = this.numberify(row[column]);
          });
        });
        const excelData = {
          title: `Interest Income from ${this.StartDate} to ${this.EndDate}`,
          headers: options.headers,
          data: exportAble,
        };
        this.excel.exportExcel(excelData, numericHeaders);
      }
    } else if (this.reportName === "CBN Loan Report") {
      const exportAble = [];
      const options = {
        headers: [
          "Customer ID",
          "Customer Name",
          "Account Number",
          "Product",
          "Branch",
          "Account Status",
          "Account Status Date",
          "Loan Effective Date",
          "Facility Amount",
          "Availed Limit",
          "Outstanding Balance",
          "Outstanding Balance Interest",
          "Outstanding Balance Principal",
          "Overdue Amount",
          "Overdue Amount Interest",
          "Overdue Amount Principal",
          "Installment Amount",
          "Currency",
          "Days In Arrears",
          "Loan (Facility) Type",
          "Loan (Facility) Tenor",
          "Repayment Frequency",
          "Last Payment Date",
          "Last Payment Amount",
          "Maturity Date",
          "Loan Classification",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          "Customer ID": key.customerId,
          "Customer Name": key.customerName,
          "Account Number": key.accountNumber,
          Product: key.product,
          Branch: key.branch,
          "Account Status": key.accountStatus,
          "Account Status Date": key.accountStatusDate,
          "Loan Effective Date": key.dateOfLoanDisbursement,
          "Facility Amount": key.creditLimitAmount,
          "Availed Limit": key.loanAmount,
          "Outstanding Balance": key.outstandingBalance,
          "Outstanding Balance Interest": key.outstandingBalanceInterest,
          "Outstanding Balance Principal": key.outstandingBalancePrincipal,
          "Overdue Amount": key.overdueAmount,
          "Overdue Amount Interest": key.overdueAmountInterest,
          "Overdue Amount Principal": key.overdueAmountPrincipal,
          "Installment Amount": key.installmentAmount,
          Currency: key.currency,
          "Days In Arrears": key.daysInArrears,
          "Loan (Facility) Type": key.loanFaciltyType,
          "Loan (Facility) Tenor": key.loanFaciltyTenor,
          "Repayment Frequency": key.repaymentFrequency,
          "Last Payment Date": key.lastPaymentDate,
          "Last Payment Amount": key.lastPaymentAmount,
          "Maturity Date": key.maturityDate,
          "Loan Classification": key.loanClassification,
        });
      });

      // tslint:disable-next-line: no-unused-expression
      // new AngularCsv(exportAble, 'CBN Loan Report_From_' + this.StartDate + '_to_' + this.EndDate, options);
      const numericHeaders = [
        "Facility Amount",
        "Availed Limit",
        "Outstanding Balance",
        "Outstanding Balance Interest",
        "Outstanding Balance Principal",
        "Overdue Amount",
        "Overdue Amount Interest",
        "Overdue Amount Principal",
        "Installment Amount",
        "Last Payment Amount",
      ];
      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });

      var titleName = "CBN Loan Report_";
      var titleFullname =
        this.StartDate === "" || this.StartDate == null
          ? titleName + "As At_" + this.EndDate
          : titleName + this.StartDate + "_to_" + this.EndDate;
      const excelData = {
        title: titleFullname,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "CBN Customer Report") {
      const exportAble = [];
      const options = {
        headers: [
          "Customer ID",
          "Branch Code",
          "Surname",
          "First Name",
          "Middle Name",
          "Date of Birth",
          "BVN No",
          "Gender",
          "Mobile Number",
          "Primary Address Line 1",
          "Employment Status",
          "Borrower Type",
          "E-mail address",
          "Employer Name",
          "Employer Address Line 1",
          "Title",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          "Customer ID": key.customerId,
          "Branch Code": key.branch,
          Surname: key.surname,
          "First Name": key.firstName,
          "Middle Name": key.middleName,
          "Date of Birth": key.dateofBirth,
          // 'NIN': key.nationIdentityNumber,
          // 'Driver\'s License No': key.driversLicenseNo,
          "BVN No": key.bvn,
          //  'Passport No': key.passportNo,
          Gender: key.gender,
          // 'Nationality': key.nationality,
          // 'Marital Status': key.maritialStatus,
          "Mobile Number": key.mobileNumber,
          "Primary Address Line 1": key.primaryAddressLine1,
          // 'City/LGA': key.primaryCityorLGA,
          // 'State': key.primaryState,
          // 'Country': key.primaryCountry,
          "Employment Status": key.employmentStatus,
          // 'Occupation': key.occupation,
          // 'Business Category': key.businessCategory,
          // 'Business Sector': key.businessSector,
          "Borrower Type": key.borrowerType,
          // 'Tax Id': key.taxId,
          "E-mail address": key.email,
          "Employer Name": key.employerName,
          "Employer Address Line 1": key.employerAddressLine,
          // 'Employer City': key.employerCity,
          // 'Employer State': key.employerState,
          Title: key.title,
          // 'Work Phone': key.workPhone,
          // 'Home Phone': key.homePhone
        });
      });

      // tslint:disable-next-line: no-unused-expression
      // new AngularCsv(exportAble, 'CBN Customer Report_From_' + this.StartDate + '_to_' + this.EndDate, options);
      const excelData = {
        title:
          "CBN Customer Report_From_" + this.StartDate + "_to_" + this.EndDate,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData);
    } else if (this.reportName === "Fee Report") {
      const exportAble = [];
      let numericHeaders = [];
      if (this.selectedOutputType === "Grouped") {
        const options = {
          headers: ["Fee Name", "Number of Loans", "Total Fees Charged"],
        };

        data.forEach((key) => {
          exportAble.push({
            "Fee Name": key.feeName,
            "Number of Loans": key.loanCount,
            "Total Fees Charged": key.totalFeesCharged,
          });
        });
        numericHeaders = ["Number of Loans", "Total Fees Charged"];
        exportAble.forEach((row) => {
          numericHeaders.forEach((column) => {
            row[column] = this.numberify(row[column]);
          });
        });
        // tslint:disable-next-line:no-unused-expression
        // new AngularCsv(exportAble, 'Fees Grouped From_' + this.StartDate + '-To-' + this.EndDate, options);
        const excelData = {
          title: "Fees Grouped From_" + this.StartDate + "-To-" + this.EndDate,
          headers: options.headers,
          data: exportAble,
        };
        this.excel.exportExcel(excelData, numericHeaders);
      } else {
        const options = {
          // tslint:disable-next-line:max-line-length
          headers: [
            "Branch",
            "Customer Name",
            "Loan Code",
            "Product Type",
            "Loan Amount",
            "Date Disbursed",
            "Fee Name",
            "Fees Charged",
          ],
        };
        data.forEach((key) => {
          exportAble.push({
            Branch: key.branch,
            "Customer Name": key.customerName,
            "Loan Code": key.loanCode,
            "Product Type": key.productType,
            "Loan Amount": key.loanAmount,
            "Date Disbursed": key.dateDisbursed,
            "Fee Name": key.feeName,
            "Fees Charged": key.feesCharged,
          });
        });
        numericHeaders = ["Loan Amount", "Fees Charged"];
        exportAble.forEach((row) => {
          numericHeaders.forEach((column) => {
            row[column] = this.numberify(row[column]);
          });
        });
        // tslint:disable-next-line:no-unused-expression
        // new AngularCsv(exportAble, 'Fees Breakdown From_' + this.StartDate + '-To-' + this.EndDate, options);
        const excelData = {
          title:
            "Fees Breakdown From_" + this.StartDate + "-To-" + this.EndDate,
          headers: options.headers,
          data: exportAble,
        };
        this.excel.exportExcel(excelData, numericHeaders);
      }
    } else if (this.reportName === "Loanbook Report") {
      const exportAble = [];
      const options = {
        // tslint:disable-next-line:max-line-length

        headers:
          this.selectedOutputType === "Grouped"
            ? ["Total InterestIncome Till Period"]
            : [
                "Loan Code",
                "Customer Name",
                "Employment Code",
                "Branch",
                "Product Type",
                "Rate",
                "Tenor",
                "Loan Amount",
                "Disbursed Amount",
                "Periodic Installment",
                "Loan Start Date",
                "Date Disbursed",
                "Loan Status",
                "Account Closure Type",
                "Interest Income Till Period",
                "Interest Paid Till Period",
                "Principal Paid Till Period",
                "Total Repaid",
                "Settlement Amount",
              ],
      };
      let numericHeaders = [];
      if (this.selectedOutputType === "Grouped") {
        data.forEach((key) => {
          exportAble.push({
            "Total InterestIncome Till Period":
              key.totalInterestIncomeTillPeriod,
          });
        });
        numericHeaders = ["Total InterestIncome Till Period"];
      } else {
        data.forEach((key) => {
          exportAble.push({
            "Loan Code": key.loanCode,
            "Customer Name": key.customerName,
            "Employment Code": key?.employmentCode,
            Branch: key.branch,
            "Product Type": key.productType,
            Rate: key.rate,
            Tenor: key.loanTenor,
            "Loan Amount": key.loanAmount,
            "Disbursed Amount": key.disbursedAmount,
            "Periodic Installment": key.periodicInstallment,
            "Loan Start Date": key.loanStartDate,
            "Date Disbursed": key.dateDisbursed,
            "Loan Status": key.status,
            "Account Closure Type": key.accountClosureType,
            "Interest Income Till Period": key.interestIncomeTillPeriod,
            "Interest Paid Till Period": key.interestPaidUp,
            "Principal Paid Till Period": key.principalPaidUp,
            "Total Repaid": key.totalRepayed,
            "Settlement Amount": key.settlementAmount,
          });
        });

        numericHeaders = [
          "Rate",
          "Loan Amount",
          "Disbursed Amount",
          "Periodic Installment",
          "Interest Income Till Period",
          "Interest Paid Till Period",
          "Principal Paid Till Period",
          "Total Repaid",
          "Settlement Amount",
        ];
      }
      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });
      // tslint:disable-next-line:no-unused-expression
      //  new AngularCsv(exportAble, 'Loanbook Report_as_at_' + this.EndDate, options);
      const excelData = {
        title: "Loanbook Report_as_at_" + this.EndDate,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Payments Report") {
      const exportAble = [];
      const options = {
        // tslint:disable-next-line:max-line-length
        headers: [
          "Branch",
          "Payment Code",
          "Loan Code",
          "Customer Name",
          "Payment Type",
          "Payment Mode",
          "Created By",
          "Payment Date",
          "Date Recorded",
          "Payment Amount",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          Branch: key.branch,
          "Payment Code": key.paymentCode,
          "Loan Code": key.loanCode,
          "Customer Name": key.customerName,
          "Payment Type": key.paymentType,
          "Payment Mode": key.paymentMode,
          "Created By": key.createdBy,
          "Payment Date": key.paymentDate,
          "Date Recorded": key.createdAt,
          "Payment Amount": key.paymentAmount,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      // new AngularCsv(exportAble, 'Payments Report from ' + this.StartDate + ' to ' + this.EndDate, options);
      const numericHeaders = ["Payment Amount"];
      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });
      const excelData = {
        title: "Payments Report from " + this.StartDate + " to " + this.EndDate,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Investment Report") {
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Investor",
          "Amount",
          "Status",
          "Gross Interest",
          "Net Interest",
          "WHT",
          "Investment Type",
          "Period",
          "Current Interest Accrued",
          "Tenor",
          "Start Date",
          "Maturity Date",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          Code: key.investmentCode,
          Investor: key.investorName,
          Amount: key.initialDeposit,
          Status: key.status,
          "Gross Interest": key.grossInterestRate,
          "Net Interest": key.netInterestRate,
          WHT: key.withHoldingTax,
          "Investment Type": key.investmentType,
          Period: key.period,
          "Current Interest Accrued": key.currentAccruedAmount,
          Tenor: key.tenor,
          "Start Date": key.investmentStartDate,
          "Maturity Date": key.maturityDate,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      // new AngularCsv(exportAble, 'Investment Report', options);
      const numericHeaders = [
        "Amount",
        "Gross Interest",
        "Net Interest",
        "WHT",
        "Current Interest Accrued",
      ];
      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });
      const excelData = {
        title: "Investment Report",
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Investment Liquidation Report") {
      const exportAble = [];
      const options = {
        headers: [
          "Code",
          "Investor",
          "Principal",
          "Liquidated Amount",
          "Penal Charge",
          "Liquidation Date",
          "Start Date",
          "Maturity Date",
        ],
      };
      data.forEach((key) => {
        exportAble.push({
          Code: key.investmentCode,
          Investor: key.investorName,
          Principal: key.initialDeposit,
          "Liquidated Amount": key.liquidatedAmount,
          "Penal Charge": key.penalCharge,
          "Liquidation Date": key.liquidationDate,
          "Start Date": key.investmentStartDate,
          "Maturity Date": key.maturityDate,
        });
      });
      // tslint:disable-next-line:no-unused-expression
      // new AngularCsv(exportAble, 'Investment Liquidation Report', options);
      const numericHeaders = ["Principal", "Liquidated Amount", "Penal Charge"];
      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });

      const excelData = {
        title: "Investment Liquidation Report",
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Repayments Due Report") {
      const exportAble = [];
      //  if(this.selectedOutputType == "Grouped"){
      const options = {
        headers: [
          "Customer Name",
          "Loan Code",
          "Product",
          "Outlet",
          "Loan Amount",
          "Expected Principal Portion In Period",
          "Expected Interest Portion In Period",
          "Expected Total Repayment In Period",
          "Reconciled Repayments Made In Period",
          "Schedule Repayments Due In Period",
          "Total Repayments Made Till Period",
          "Total Accum Repayments Due Till Period",
          "Last Payment Date",
        ],
      };

      const filename =
        this.StartDate == null || this.StartDate == ""
          ? "Repayments Due Grouped As at_" + this.EndDate
          : "Repayments Due Grouped From_" +
            this.StartDate +
            "-To-" +
            this.EndDate;

      data.forEach((key) => {
        exportAble.push({
          "Customer Name": key.customerName,
          "Loan Code": key.loanCode,
          Product: key.productType,
          Outlet: key.outlet,
          //  'Date Disbursed': key.dateDisbursed,
          "Loan Amount": key.loanAmount,
          "Expected Principal Portion In Period":
            key.expectedPrincipalPortionAmountInPeriod,
          "Expected Interest Portion In Period":
            key.expectedInterestPortionAmountInPeriod,
          "Expected Total Repayment In Period": key.expectedAmountInPeriod,
          "Repayments Made In Period": key.reconciledRepaymentsMadeInPeriod,
          "Repayments Due In Period": key.scheduleRepaymentsDueInPeriod,
          "Total Repayments Made Till Period":
            key.totalRepaymentsMadeTillPeriod,
          "Total Accum Repayments Due Till Period":
            key.totalAccumRepaymentsDueTillPeriod,
          "Last Payment Date": key.lastPaymentDate,
        });
      });
      // new AngularCsv(exportAble, filename, options);
      const numericHeaders = [
        "Loan Amount",
        "Expected Principal Portion In Period",
        "Expected Interest Portion In Period",
        "Expected Total Repayment In Period",
        "Repayments Made In Period",
        "Repayments Due In Period",
        "Total Repayments Made Till Period",
        "Total Accum Repayments Due Till Period",
      ];
      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });
      const excelData = {
        title: filename,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
      //  }
    } else if (this.reportName === "TopUp Eligibility Report") {
      const exportAble = [];

      const options = {
        headers: [
          "Loan Code",
          "Customer Name",
          "BVN",
          "Product",
          "Tenor",
          "Outlet",
          "Date Created",
          "Status",
          "Sales Officer",
          "Created By",
          "Home Address",
          "Email Address",
          "Phone Number",
          "Employer Name",
          "Employment Code",
          "Employer Address",
          "Loan Amount",
          "Last Payment Date",
          "Periodic Repayment",
          "Total Expected Repayment",
          "Total Repayments Made",
          "Repayments Count",
          "Total Accum Repayments Due",
        ],
      };

      const filename =
        this.StartDate == null || this.StartDate == ""
          ? "TopUp Eligibility Report As at_" + this.EndDate
          : "TopUp Eligibility Report From_" +
            this.StartDate +
            "-To-" +
            this.EndDate;

      data.forEach((key) => {
        exportAble.push({
          "Loan Code": key.loanCode,
          "Customer Name": key.customerName,
          BVN: key.bVN,
          Product: key.productType,
          Tenor: key.loanDuration,
          Outlet: key.outlet,
          "Date Created": key.createdAt,
          Status: key.status,
          "Sales Officer": key.salesOfficer,
          "Created By": key.createdBy,
          "Date Disbursed": key.dateDisbursed,
          "Home Address": key.homeAddress,
          "Email Address": key.emailAddress,
          "Phone Number": key.phoneNumber,
          "Employer Name": key.employerName,
          "Employment Code": key.employmentCode,
          "Employer Address": key.employerAddress,
          "Loan Amount": key.loanAmount,
          "Last Payment Date": key.lastPaymentDate,
          "Periodic Repayment": key.periodicRepaymentAmount,
          "Total Expected Repayment": key.expectedRepaymentAmount,
          "Total Repayments Made": key.totalRepaymentsMade,
          "Repayments Count": key.repaymentsCount,
          "Total Accum Repayments Due": key.totalAccumRepaymentsDue,
        });
      });
      // new AngularCsv(exportAble, filename, options);
      const numericHeaders = [
        "Loan Amount",
        "Periodic Repayment",
        "Total Expected Repayment",
        "Total Repayments Made",
        "Repayments Count",
        "Total Accum Repayments Due",
      ];

      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });

      const excelData = {
        title: filename,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Customer Information Report") {
      const exportAble = [];

      const options = {
        headers: [
          "Customer Code",
          "Customer First Name",
          "Customer Last Name",
          "BVN",
          "Email Address",
          "Phone Number",
          "Address",
          "Next of kin name",
          "Next of kin phone number",
          "Next of kin address",
          "Date Created",
        ],
      };

      const filename =
        this.StartDate == null || this.StartDate == ""
          ? "Customer Information Report As at_" + this.EndDate
          : "Customer Information Report From_" +
            this.StartDate +
            "-To-" +
            this.EndDate;

      data.forEach((key) => {
        exportAble.push({
          "Customer Code": key?.personCode,
          "Customer First Name": key?.firstName,
          "Customer Last Name": key?.lastName,
          BVN: key?.bvn,
          "Email Address": key?.emailAddress,
          "Phone Number": key?.phoneNumber,
          Address: key?.address,
          "Next of kin name": key?.residentialInfo?.nextOfKinName,
          "Next of kin phone number":
            key?.residentialInfo?.nextOfKinPhoneNumber,
          "Next of kin address": key?.residentialInfo?.nextOfKinAddress,
          "Date Created": this.formatDate(key?.createdAt),
        });
      });

      const excelData = {
        title: filename,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData);
    } else if (this.reportName === "Customer Repayment Report") {
      const exportAble = [];

      const options = {
        headers: [
          "Loan Code",
          "First Name",
          "Last Name",
          "Phone Number",
          "Alternative Phone Number",
          "Date of Birth",
          "Email Address",
          "Employer Name",
          "Employer Code",
          "Loan Type",
          "Date Disbursed",
          "Interest Rate",
          "Tenor",
          "Loan Amount",
          "Periodic Installment Amount",
          "Repayment Start Date",
          "Maturity Date",
          "Expected Amount In Period",
          "Total Repayment Made Till Period",
          "Total Accumulated Repayment Due Till Period",
          "Next Of Kin Name",
          "Next Of Kin PhoneNumber",
          "Outlet",
          "BVN",
          "Days Delinquent",
          "Status",
        ],
      };

      const filename =
        this.StartDate == null || this.StartDate == ""
          ? "Customer Repayment Report As at_" + this.EndDate
          : "Customer Repayment Report From_" +
            this.StartDate +
            "-To-" +
            this.EndDate;

      data.forEach((key) => {
        exportAble.push({
          "Loan Code": key?.loanCode,
          "First Name": key?.firstName,
          "Last Name": key?.lastName,
          "Phone Number": key?.phoneNumber,
          "Alternative Phone Number": key?.alternativePhoneNumber,
          "Date of Birth":
            key?.dateOfBirth == "" || key?.dateOfBirth == null
              ? ""
              : this.formatDate(new Date(key?.dateOfBirth).toString()),
          "Email Address": key?.emailAddress,
          "Employer Name": key?.employerName,
          "Employer Code": key?.employerCode,
          "Loan Type": key?.loanType,
          "Date Disbursed": this.formatDate(key?.dateDisbursed),
          "Interest Rate": key?.interestRate,
          Tenor: key?.loanTenor,
          "Loan Amount": key?.loanAmount,
          "Periodic Installment Amount": key?.periodicInstallmentPayment,
          "Repayment Start Date": this.formatDate(key?.repaymentStartDate),
          "Maturity Date": this.formatDate(key?.maturityDate),
          "Expected Amount In Period": key?.expectedAmountInPeriod,
          "Total Repayment Made Till Period": key?.totalRepaymentMadeTillPeriod,
          "Total Accumulated Repayment Due Till Period":
            key?.totalAccumulatedRepaymentDueTillPeriod,
          "Next Of Kin Name": key?.nextOfKinName,
          "Next Of Kin PhoneNumber": key?.nextOfKinPhoneNumber,
          Outlet: key?.outlet,
          BVN: key?.bvn,
          "Days Delinquent": key?.daysDelinquent,
          Status: key?.status,
        });
      });

      const numericHeaders = [
        "Loan Amount",
        "Periodic Installment Amount",
        "Expected Amount In Period",
        "Total Repayment Made Till Period",
        "Total Accumulated Repayment Due Till Period",
      ];

      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });

      const excelData = {
        title: filename,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Redraft Report") {
      const exportAble = [];

      const options = {
        headers: [
          "Application Code",
          "Loan Code",
          "Customer First Name",
          "Customer Last Name",
          "Product Type",
          "Loan Amount",
          "Branch",
          "Redraft reason",
          "Requested At",
          "Requested By",
          "Completed By",
          "Completed At",
          "Team Lead",
        ],
      };

      const filename =
        this.StartDate == null || this.StartDate == ""
          ? "Redraft Report As at_" + this.EndDate
          : "Redraft Report From_" + this.StartDate + "-To-" + this.EndDate;

      data.forEach((key) => {
        exportAble.push({
          "Application Code": key?.applicationCode,
          "Loan Code": key?.loanCode,
          "Customer First Name": key?.firstName,
          "Customer Last Name": key?.lastName,
          "Product Type": key?.productType,
          "Loan Amount": key?.loanAmount,
          Branch: key?.branch,
          "Redraft reason": key?.reason,
          "Requested At": this.formatDate(key?.requestedAt),
          "Requested By": key?.requestedBy,
          "Completed By": key?.completedBy,
          "Completed At": this.formatDate(key?.completedAt),
          "Team Lead": key?.teamLead,
        });
      });

      const numericHeaders = ["Loan Amount"];

      exportAble.forEach((row) => {
        numericHeaders.forEach((column) => {
          row[column] = this.numberify(row[column]);
        });
      });

      const excelData = {
        title: filename,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData, numericHeaders);
    } else if (this.reportName === "Settlement Differential Report") {
      const exportAble = [];

      const options = {
        headers: [
          "Loan Code",
          "Loan Start Date",
          "Customer Name",
          "Customer Code",
          "Tenor",
          "Repayment Type",
          "Repayment Balance Type",
          "Settlement Paid",
          "Settlement Date",
          "Calculated Effective Settlement",
          "Differential Amount",
        ],
      };

      const filename =
        this.StartDate == null || this.StartDate == ""
          ? "Settlement Differential As at_" + this.EndDate
          : "Settlement Differential From_" +
            this.StartDate +
            "-To-" +
            this.EndDate;

      data.forEach((key) => {
        exportAble.push({
          "Loan Code": key?.loanCode,
          "Loan Start Date": key?.loanStartDate,
          "Customer Name": key?.customerName,
          "Customer Code": key?.customerCode,
          Tenor: key?.tenor,
          "Repayment Type": key?.repaymentType,
          "Repayment Balance Type": key?.repaymentBalanceType,
          "Settlement Paid": key?.settlementPaid,
          "Settlement Date": key?.settlementDate,
          "Calculated Effective Settlement": key?.calculatedEffectiveSettlement,
          "Differential Amount": key?.differentialAmount,
        });
      });

      const excelData = {
        title: filename,
        headers: options.headers,
        data: exportAble,
      };
      this.excel.exportExcel(excelData);
    }

    this.toast.fire({
      title: "Report download will start soon.",
      type: "success",
    });
  }

  getStatesAsObservable(token: string): Observable<any> {
    const query = new RegExp(token, "i");
    return of(
      this.searchedLoansResult.filter((state: any) => {
        return query.test(state.combinedLoanInformation);
      })
    );
  }

  typeaheadOnSelect(e: TypeaheadMatch): void {
    this.selectedLoan = e.item;
    this.asyncSelected = e;
  }

  changeTypeaheadLoading(e: boolean): void {
    this.typeaheadLoading = e;
  }

  clearInput(type) {
    if (type === 1) {
      this.selectedLoan = "";
      this.asyncSelected = "";
    } else if (type === 2) {
    }
  }

  pushtoSelectedLoan(row, type) {
    // tslint:disable-next-line:no-unused-expression
    this.selectedLoan === "";
    this.selectedLoan = row;
    this.asyncSelected = row;
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
      title: "Copied to clipboard.",
    });
  }

  printReport(referenceId) {
    const host = window.location.host;

    const printContents = document.getElementById(referenceId).innerHTML;
    let popupWin = null;
    if (printContents != null) {
      popupWin = window.open(
        "",
        "_blank",
        "top=0,left=0,height=100%,width=auto"
      );
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>${this.reportName}</title>
            <link rel="stylesheet" href="http://${host}/assets/css/bootstrap.min.css" type="text/css"/>
           <br/>
            <img class="dt-brand__logo-img mb-3" width="100px" src="assets/images/logo-blue.png" alt="Lendastack"><br/><br/>
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
              .col-sm-1, .col-sm-2, .col-sm-3, .col-sm-4, .col-sm-5,
              .col-sm-6, .col-sm-7, .col-sm-8, .col-sm-9, .col-sm-10, .col-sm-11, .col-sm-12 {
                float: left;
              }
              .col-sm-12 {
                width: 100%;
              }
              .col-sm-11 {
                width: 91.66666667%;
              }
              .col-sm-10 {
                width: 83.33333333%;
              }
              .col-sm-9 {
                width: 75%;
              }
              .col-sm-8 {
                width: 66.66666667%;
              }
              .col-sm-7 {
                width: 58.33333333%;
              }
              .col-sm-6 {
                width: 50%;
              }
              .col-sm-5 {
                width: 41.66666667%;
              }
              .col-sm-4 {
                width: 33.33333333%;
              }
              .col-sm-3 {
                width: 25%;
              }
              .col-sm-2 {
                width: 16.66666667%;
              }
              .col-sm-1 {
                width: 8.33333333%;
              }
              .col-sm-pull-12 {
                right: 100%;
              }
              .col-sm-pull-11 {
                right: 91.66666667%;
              }
              .col-sm-pull-10 {
                right: 83.33333333%;
              }
              .col-sm-pull-9 {
                right: 75%;
              }
              .col-sm-pull-8 {
                right: 66.66666667%;
              }
              .col-sm-pull-7 {
                right: 58.33333333%;
              }
              .col-sm-pull-6 {
                right: 50%;
              }
              .col-sm-pull-5 {
                right: 41.66666667%;
              }
              .col-sm-pull-4 {
                right: 33.33333333%;
              }
              .col-sm-pull-3 {
                right: 25%;
              }
              .col-sm-pull-2 {
                right: 16.66666667%;
              }
              .col-sm-pull-1 {
                right: 8.33333333%;
              }
              .col-sm-pull-0 {
                right: auto;
              }
              .col-sm-push-12 {
                left: 100%;
              }
              .col-sm-push-11 {
                left: 91.66666667%;
              }
              .col-sm-push-10 {
                left: 83.33333333%;
              }
              .col-sm-push-9 {
                left: 75%;
              }
              .col-sm-push-8 {
                left: 66.66666667%;
              }
              .col-sm-push-7 {
                left: 58.33333333%;
              }
              .col-sm-push-6 {
                left: 50%;
              }
              .col-sm-push-5 {
                left: 41.66666667%;
              }
              .col-sm-push-4 {
                left: 33.33333333%;
              }
              .col-sm-push-3 {
                left: 25%;
              }
              .col-sm-push-2 {
                left: 16.66666667%;
              }
              .col-sm-push-1 {
                left: 8.33333333%;
              }
              .col-sm-push-0 {
                left: auto;
              }
              .col-sm-offset-12 {
                margin-left: 100%;
              }
              .col-sm-offset-11 {
                margin-left: 91.66666667%;
              }
              .col-sm-offset-10 {
                margin-left: 83.33333333%;
              }
              .col-sm-offset-9 {
                margin-left: 75%;
              }
              .col-sm-offset-8 {
                margin-left: 66.66666667%;
              }
              .col-sm-offset-7 {
                margin-left: 58.33333333%;
              }
              .col-sm-offset-6 {
                margin-left: 50%;
              }
              .col-sm-offset-5 {
                margin-left: 41.66666667%;
              }
              .col-sm-offset-4 {
                margin-left: 33.33333333%;
              }
              .col-sm-offset-3 {
                margin-left: 25%;
              }
              .col-sm-offset-2 {
                margin-left: 16.66666667%;
              }
              .col-sm-offset-1 {
                margin-left: 8.33333333%;
              }
              .col-sm-offset-0 {
                margin-left: 0%;
              }
              .visible-xs {
                display: none !important;
              }
              .hidden-xs {
                display: block !important;
              }
              table.hidden-xs {
                display: table;
              }
              tr.hidden-xs {
                display: table-row !important;
              }
              th.hidden-xs,
              td.hidden-xs {
                display: table-cell !important;
              }
              .hidden-xs.hidden-print {
                display: none !important;
              }
              .hidden-sm {
                display: none !important;
              }
              .visible-sm {
                display: block !important;
              }
              table.visible-sm {
                display: table;
              }
              tr.visible-sm {
                display: table-row !important;
              }
              th.visible-sm,
              td.visible-sm {
                display: table-cell !important;
              }
              table,  th {
                  border: 1px solid #eee;
                  width: 100%;
                  text-align: left;
                  padding: 3px;
                  font-size: 7px !important;
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
                  font-size: 7px
                }
              .table th {
                padding: 3px;
                vertical-align: top;
                border-bottom:1pt solid black;
                border-top:1pt solid black;
                border-collapse: collapse;
                border-spacing: 0;
              }
              .table td {
                padding: 3px;
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
            }
            nav, aside, footer, button {
              display: none !important;
            }
            </style>
          </head>
      <body onload="window.print();window.close();">${printContents}</body>
        </html>`);
      popupWin.document.close();
    }
  }

  getItemsPaginatedSearch(filter, pageSize, pageNumber) {
    if (this.EndDate !== "" && this.EndDate != null) {
      this.loader = true;
      // tslint:disable-next-line:radix
      this.pagination.pageSize = parseInt(pageSize);
      if (filter == null) {
        this.filterReport(pageNumber, filter);
        return;
      }
      filter = filter.trim();
      this.pagination.searchTerm = filter === "" ? null : filter;
      this.filterReport(pageNumber, filter);
    }
  }

  getItemsPaginatedPageJumpModal() {
    $(".pagination-menu").toggle();
  }

  numberify(num) {
    try {
      var numStr = `${num}`.replace(/,/g, "");
      numStr = numStr.replace(/s/g, "");
      return Number(numStr);
    } catch (e) {
      return 0;
    }
  }

  public downloadCbnTemplate(): void {
    this.downloading = true;
    this.reportService.downloadCreditReportTempFile().subscribe(
      (response: HttpResponse<Blob>) => {
        Swal.fire(
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

  public downloadCbnTemplate1(): void {
    this.downloading = true;
    let d1 = false;
    let d2 = false;
    this.reportService.downloadCreditReportTempFile1().subscribe(
      (response: HttpResponse<Blob>) => {
        Swal.fire(
          "Downloading",
          "Template will start downloading automatically.",
          "success"
        );
        const filename: string =
          "CommonDataTemplatesCREDITREPORTINGCBNAPPROVED.xlsx";
        let binaryData = [];
        binaryData.push(response.body);
        let downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(
          new Blob(binaryData, { type: "blob" })
        );
        downloadLink.setAttribute("download", filename);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        d1 = true;
        this.downloading = !(d1 && d2);
      },
      (err) => {
        this.downloading = false;
      }
    );
    this.reportService.downloadCreditReportTempFile2().subscribe(
      (response: HttpResponse<Blob>) => {
        Swal.fire(
          "Downloading",
          "Template will start downloading automatically.",
          "success"
        );
        const filename: string = "SpooledCreditReportSample.xls";
        let binaryData = [];
        binaryData.push(response.body);
        let downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(
          new Blob(binaryData, { type: "blob" })
        );
        downloadLink.setAttribute("download", filename);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        d2 = true;
        this.downloading = !(d1 && d2);
      },
      (err) => {
        this.downloading = false;
      }
    );
  }

  public downloadQueueReport(currentFileDownloadUrl) {
    window.open(currentFileDownloadUrl, "_blank");
  }

  private getFileName(response: HttpResponse<Blob>): string {
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
      filename = `${this.reportName}.xlsx`;
    }
    return filename;
  }

  protected formatDate(date: string): string {
    let newDate = new Date(date);
    return moment(newDate).format("DD-MMM-YYYY");
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
}
