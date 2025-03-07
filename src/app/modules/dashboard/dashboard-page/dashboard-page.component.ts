import { Router } from "@angular/router";
import swal from "sweetalert2";
import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { LoanoperationsService } from "../../../service/loanoperations.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { ConfigurationService } from "../../../service/configuration.service";
import { ReportDetailsDateFunctions } from "../../../model/ReportDetailsDateFunctions";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import {
  GetLoanMetricsDataQueryParams,
  LoanMetricsData,
  MetricsRange,
} from "../loan-dashboard.types";
import { LoanMetricsService } from "src/app/service/loan-metrics.service";
import { ActivityService } from "src/app/service/activity.service";
import { GrowthbookService } from "src/app/service/growthbook.service";
import GrowthBookFeatureTags from "src/app/model/growthbook-features";
@Component({
  selector: "app-dashboard-page",
  templateUrl: "./dashboard-page.component.html",
  styleUrls: ["./dashboard-page.component.scss"],
})
export class DashboardPageComponent implements OnInit {
  currentuser: any;
  currentuserid: any;
  currentuserbranchid: any;
  currentview: any;
  requestLoader: boolean;
  loader = false;
  public loggedInUser: any;
  ownerInformation: any;
  private root = window.location.origin;
  showMetrics = false;
  public isProductSetup = false;

  applicationdata = {
    data: [],
    countdata: null,
  };

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  loanMetricsData: LoanMetricsData[] = [];
  countMetricsData: any = null;

  userActivities: any = [];
  userActivityFetchModel = {
    pageNumber: 1,
    pageSize: 3,
  };
  userActivityPagination = {
    pageNumber: 1,
    pageSize: 3,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };
  userActivityLoader: boolean = false;

  teamActivities: any = [];
  teamActivityFetchModel = {
    pageNumber: 1,
    pageSize: 3,
  };
  teamActivityPagination = {
    pageNumber: 1,
    pageSize: 3,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };
  teamActivityLoader: boolean = false;
  awaitingDisbConfirmationMetrics: LoanMetricsData;
  allLoanApplicationMetrics: LoanMetricsData;
  allPaidLoansMetrics: LoanMetricsData;
  isFetchingAwaitingDisbConfirmation = false;
  isFetchingallLoanApplication = false;
  isFetchingallPaidLoans = false;
  currencySymbol: string;
  useNewLoanDashboard = false;

  constructor(
    private configurationService: ConfigurationService,
    private loanoperationService: LoanoperationsService,
    private loanMetricsService: LoanMetricsService,
    public authService: AuthService,
    public activityService: ActivityService,
    private userService: UserService,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private growthbookService: GrowthbookService
  ) {}

  ngOnInit() {
    this.resolveInitialState();
  }

  resolveInitialState() {
    this.useNewLoanDashboard = this.isFeatureEnabled(
      GrowthBookFeatureTags.NewLoanDasboard
    );

    if (!this.useNewLoanDashboard) {
      this.initOldDashboard();
    }
  }

  initOldDashboard() {
    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();
    this.currencySymbol = this.configurationService.currencySymbol;

    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.getUserPromise().then((next) => {
      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
      this.currentview = 1;
      this.getConstants();
    });

    this.getCountMetrics();
    this.onGetMetrics("Today", "disbursement");
    this.onGetMetrics("Today", "application");
    this.onGetMetrics("Today", "paidLoans");
  }

  isFeatureEnabled(feature: GrowthBookFeatureTags): boolean {
    switch (feature) {
      case GrowthBookFeatureTags.NewLoanDasboard: {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.NewLoanDasboard
        );
      }
    }
  }

  setColor(btn1, btn2, btn3): any {
    btn1.style.background = this.currentTheme.primaryColor;
    btn1.style.color = "#fff";

    btn2.style.background = "#fff";
    btn2.style.color = "#000";

    btn3.style.background = "#fff";
    btn3.style.color = "#000";
  }

  selectedRange: MetricsRange = "Today";

  onGetMetric(range: MetricsRange) {
    this.selectedRange = range;
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  toggleMetricsView() {
    this.showMetrics = !this.showMetrics;
    this.getLoanMetricsData();
  }

  getData() {
    const DateFunctions = new ReportDetailsDateFunctions();
    const todayRange = DateFunctions.getTodayRange();
    const weekRange = DateFunctions.getWeekRange();
    const monthRange = DateFunctions.getMonthRange();
    const quarterRange = DateFunctions.getQuarterRange();
    const yearRange = DateFunctions.getYearRange();

    const dates = {
      todayStart: todayRange[0],
      todayEnd: todayRange[1],
      weekStart: weekRange[0],
      weekEnd: weekRange[1],
      monthStart: monthRange[0],
      monthEnd: monthRange[1],
      quarterStart: quarterRange[0],
      quarterEnd: quarterRange[1],
      yearStart: yearRange[0],
      yearEnd: yearRange[1],
      BranchId: this.authService.decodeToken().groupsid,
      UserId: this.authService.decodeToken().nameid,
    };

    this.loanoperationService
      .spoolDashboardDataByBranch(dates)
      .subscribe((response) => {
        this.applicationdata.data = response.body.financialData; // response.body.financialData;
        this.applicationdata.countdata = response.body.countMetricsData;
      });
  }

  getCountMetrics() {
    this.loanMetricsService
      .spoolApplicationCountMetrics()
      .subscribe((response) => {
        this.countMetricsData = response.body.data;
      });
  }

  getLoanMetricsFetchModel() {
    const DateFunctions = new ReportDetailsDateFunctions();
    const todayRange = DateFunctions.getTodayRange();
    const weekRange = DateFunctions.getWeekRange();
    const monthRange = DateFunctions.getMonthRange();
    const quarterRange = DateFunctions.getQuarterRange();
    const yearRange = DateFunctions.getYearRange();

    const dates = {
      todayStart: todayRange[0],
      todayEnd: todayRange[1],
      weekStart: weekRange[0],
      weekEnd: weekRange[1],
      monthStart: monthRange[0],
      monthEnd: monthRange[1],
      quarterStart: quarterRange[0],
      quarterEnd: quarterRange[1],
      yearStart: yearRange[0],
      yearEnd: yearRange[1],
      BranchId: this.authService.decodeToken().groupsid,
      UserId: this.authService.decodeToken().nameid,
    };

    return dates;
  }

  getLoanMetricsData() {
    const permissionsToMetricsFunctions = {
      "View My Loan Applications": [
        this.loanMetricsService.spoolTotalValueOfMyApplications,
      ],
      "View Application Pool": [
        this.loanMetricsService.spoolTotalValueOfApplicationsInPool,
      ],
      "Claim Applications - Application Pool": [
        this.loanMetricsService.spoolValueOfUntreatedClaimedApplications,
        this.loanMetricsService.spoolTotalValueOfApplicationsReviewed,
        this.loanMetricsService.spoolTotalValueOfApplicationsApproved,
        this.loanMetricsService.spoolTotalValueOfApplicationsRejected,
        this.loanMetricsService.spoolTotalValueOfApplicationsRedrafted,
      ],
      "View Disbursement Verifications": [
        this.loanMetricsService.spoolTotalValueOfPendingVerifications,
        this.loanMetricsService.spoolValueOfPendingChequeVerifications,
        this.loanMetricsService.spoolValueOfPendingDirectDebitVerifications,
      ],
      "View Disbursement Pool": [
        this.loanMetricsService.spoolTotalValueInDisbursementPool,
      ],
      "View Disbursement Batches": [
        this.loanMetricsService.spoolTotalValueOfBatchedLoans,
        this.loanMetricsService.spoolTotalAmountDisbursed,
      ],
      "View Loans": [
        this.loanMetricsService.spoolTotalValueOfActiveLoans,
        this.loanMetricsService.spoolTotalValueOfSettledLoans,
        this.loanMetricsService.spoolTotalValueOfDeactivatedLoans,
        this.loanMetricsService.spoolTotalValueOfTopupLoans,
      ],
      "View Payments": [
        this.loanMetricsService.spoolTotalValueOfRepaymentsRecorded,
        this.loanMetricsService.spoolTotalValueOfRefundsRecorded,
        this.loanMetricsService.spoolTotalValueOfReversalsRecorded,
      ],
    };

    const permissionSet = new Set(this.currentuser.permission);

    const loanMetricsFetchModel = this.getLoanMetricsFetchModel();

    for (const permission in permissionsToMetricsFunctions) {
      if (!permissionSet.has(permission)) continue;
      if (
        Object.prototype.hasOwnProperty.call(
          permissionsToMetricsFunctions,
          permission
        )
      ) {
        const metricsFns = permissionsToMetricsFunctions[permission];

        metricsFns.forEach((func) => {
          const boundFunc = func.bind(this.loanMetricsService);
          boundFunc(loanMetricsFetchModel)
            .pipe(takeUntil(this.unsubscriber$))
            .subscribe((response) => {
              this.loanMetricsData.push(response.body.data);
            });
        });
      }
    }
  }

  onGetMetrics(
    range: MetricsRange,
    type: "disbursement" | "application" | "paidLoans"
  ) {
    let dateRangeObj: GetLoanMetricsDataQueryParams;
    let start: string;
    let end: string;
    const dateFunctions = new ReportDetailsDateFunctions();

    const today = dateFunctions.getTodayRange();
    start = today[0].toISOString();
    end = today[1].toISOString();

    if (range === "MTD") {
      const month = dateFunctions.getMonthRange();
      start = month[0].toISOString();
    } else if (range === "YTD") {
      const year = dateFunctions.getYearRange();
      start = year[0].toISOString();
    }

    dateRangeObj = { start, end };
    if (range === "Today") {
      delete dateRangeObj?.end;
    }
    if (type === "disbursement")
      this.getLoansAwaitingDisbConfirmation(dateRangeObj);
    if (type === "application")
      this.getTotalValueOfAllLoanApplications(dateRangeObj);
    if (type === "paidLoans") this.getTotalValueOfAllPaidLoans(dateRangeObj);
  }

  getLoansAwaitingDisbConfirmation(data: GetLoanMetricsDataQueryParams) {
    this.isFetchingAwaitingDisbConfirmation = true;
    this.loanMetricsService
      .spoolTotalValueOfLoansAwaitingConfirmation(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.awaitingDisbConfirmationMetrics = res.body.data;
          this.awaitingDisbConfirmationMetrics.tag = "Disbursement";
          this.isFetchingAwaitingDisbConfirmation = false;
        },
        error: () => {
          this.isFetchingAwaitingDisbConfirmation = false;
        },
      });
  }
  getTotalValueOfAllLoanApplications(data: GetLoanMetricsDataQueryParams) {
    this.isFetchingallLoanApplication = true;
    this.loanMetricsService
      .spoolTotalValueOfLoansApplications(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.allLoanApplicationMetrics = res.body.data;
          this.allLoanApplicationMetrics.tag = "Application";
          this.isFetchingallLoanApplication = false;
        },
        error: () => {
          this.isFetchingallLoanApplication = false;
        },
      });
  }
  getTotalValueOfAllPaidLoans(data: GetLoanMetricsDataQueryParams) {
    this.isFetchingallPaidLoans = true;
    this.loanMetricsService
      .spoolTotalValueOfPaidLoans(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.allPaidLoansMetrics = res.body.data;
          this.allPaidLoansMetrics.tag = "Repaid";
          this.isFetchingallPaidLoans = false;
        },
        error: () => {
          this.isFetchingallPaidLoans = false;
        },
      });
  }

  fetchUserActivities(pageNum = null) {
    this.userActivityLoader = true;
    this.userActivities = [];

    if (pageNum != null) {
      this.userActivityPagination.pageNumber == pageNum;
      if (pageNum < 1) {
        this.userActivityPagination.pageNumber = 1;
      }
      if (pageNum > this.userActivityPagination.maxPage) {
        this.userActivityPagination.pageNumber =
          this.userActivityPagination.maxPage || 1;
      }
      this.userActivityFetchModel.pageNumber =
        this.userActivityPagination.pageNumber;
    }
    this.userActivityFetchModel.pageSize = Number(
      this.userActivityPagination.pageSize
    );

    this.activityService
      .getUserActivities(this.userActivityFetchModel)
      .subscribe(
        (response) => {
          this.userActivities = response.body.data.items;

          this.userActivityPagination.maxPage = response.body.data.totalPages;
          this.userActivityPagination.hasNextPage =
            response.body.data.hasNextPage;
          this.userActivityPagination.hasPreviousPage =
            response.body.data.hasPreviousPage;
          this.userActivityPagination.totalRecords =
            response.body.data.totalCount;
          this.userActivityPagination.count = this.userActivities.length;
          this.userActivityPagination.jumpArray = Array(
            this.userActivityPagination.maxPage
          );
          for (
            let i = 0;
            i < this.userActivityPagination.jumpArray.length;
            i++
          ) {
            this.userActivityPagination.jumpArray[i] = i + 1;
          }
          this.userActivityLoader = false;
        },
        (error) => {
          this.userActivityLoader = false;
        }
      );
  }

  fetchTeamActivities(pageNum = null) {
    this.teamActivityLoader = true;
    this.teamActivities = [];

    if (pageNum != null) {
      this.teamActivityPagination.pageNumber == pageNum;
      if (pageNum < 1) {
        this.teamActivityPagination.pageNumber = 1;
      }
      if (pageNum > this.teamActivityPagination.maxPage) {
        this.teamActivityPagination.pageNumber =
          this.teamActivityPagination.maxPage || 1;
      }
      this.teamActivityFetchModel.pageNumber =
        this.teamActivityPagination.pageNumber;
    }
    this.teamActivityFetchModel.pageSize = Number(
      this.teamActivityPagination.pageSize
    );

    this.activityService
      .getUserTeammateActivities(this.teamActivityFetchModel)
      .subscribe(
        (response) => {
          this.teamActivities = response.body.data.items;

          this.teamActivityPagination.maxPage = response.body.data.totalPages;
          this.teamActivityPagination.hasNextPage =
            response.body.data.hasNextPage;
          this.teamActivityPagination.hasPreviousPage =
            response.body.data.hasPreviousPage;
          this.teamActivityPagination.totalRecords =
            response.body.data.totalCount;
          this.teamActivityPagination.count = this.teamActivities.length;
          this.teamActivityPagination.jumpArray = Array(
            this.teamActivityPagination.maxPage
          );
          for (
            let i = 0;
            i < this.teamActivityPagination.jumpArray.length;
            i++
          ) {
            this.teamActivityPagination.jumpArray[i] = i + 1;
          }
          this.teamActivityLoader = false;
        },
        (error) => {
          this.teamActivityLoader = false;
        }
      );
  }

  userActivityJumpModal() {
    $(".userActivityJumpModal").toggle();
  }

  teamActivityJumpModal() {
    $(".teamActivityJumpModal").toggle();
  }

  getConstants() {
    this.configurationService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentuser = user.body;
          this.currentuserid = this.currentuser.userId;
          this.currentuserbranchid = this.currentuser.branchId;

          this.getLoanMetricsData();

          resolve(user);
        },
        (err) => {
          reject(err.error);
        }
      );
    });
  }

  OpenExternalLink() {
    const combinedUrl = this.root + "/reward";
    window.open(combinedUrl, "_blank");
  }
}
