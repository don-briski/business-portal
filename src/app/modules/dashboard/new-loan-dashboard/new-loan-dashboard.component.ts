import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { takeUntil } from "rxjs/operators";
import { forkJoin, Observable, Subject } from "rxjs";
import { HttpResponse } from "@angular/common/http";

import {
  GetLoanMetricsDto,
  GetUserLoanActivitiesResBody,
  LoanMetricsInfo,
  LoanStatusBreakdown,
  MetricsRange,
  UserLoanActivity,
} from "../loan-dashboard.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { LoanMetricsService } from "src/app/service/loan-metrics.service";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { Pagination, User } from "../../shared/shared.types";
import { ReportDetailsDateFunctions } from "src/app/model/ReportDetailsDateFunctions";
import { Router } from "@angular/router";

@Component({
  selector: "lnd-new-loan-dashboard",
  templateUrl: "./new-loan-dashboard.component.html",
  styleUrls: ["./new-loan-dashboard.component.scss"],
})
export class NewLoanDashboardComponent implements OnInit, OnDestroy {
  @Output() switchDashboard = new EventEmitter<void>();

  unsubscriber$ = new Subject<void>();
  user: User;
  currentTheme: ColorThemeInterface;
  currencySymbol: string;
  selectedMetricsRange: MetricsRange = "Today";
  gettingData = false;

  activeLoanTypes: LoanMetricsInfo = {};
  activeLoans: LoanMetricsInfo = {};
  gettingActiveLoansCount: boolean;
  averageLoanSize: LoanMetricsInfo = {};
  gettingNewCustomersReg = false;
  newCustomers: LoanMetricsInfo = {};
  gettingLoanAppsCount: boolean;
  loanApplications: LoanMetricsInfo = {};
  gettingDisbursements: boolean;
  disbursements: LoanMetricsInfo = {};
  loansAwaitingDisb: LoanMetricsInfo = {};
  gettingLoansAwaitingDisbCount: boolean;
  gettingRejectedApps: boolean;
  rejectedApps: LoanMetricsInfo = {};
  mostSoldProduct: LoanMetricsInfo = {};
  largestLoanTicket: LoanMetricsInfo = {};
  smallestLoanTicket: LoanMetricsInfo = {};
  mostSubscribedTenor: LoanMetricsInfo = {};
  gettingSettledLoansCount: boolean;
  settledLoans: LoanMetricsInfo = {};
  gettingApprovedLoans = false;
  approvedLoans: LoanMetricsInfo = {};
  loanStatusBreakdown: LoanStatusBreakdown[] = [];
  userLoanActivities: UserLoanActivity[] = [];
  gettingUserLoanActivities = false;
  weekRange: GetLoanMetricsDto;
  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
  };

  constructor(
    private configService: ConfigurationService,
    private colorThemeService: ColorThemeService,
    private metricsService: LoanMetricsService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getCurrencySymbol();
    this.getUser();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
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

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe((res) => {
        this.user = res.body;
        this.getData();
      });
  }

  onGetMetrics(metricsRange: MetricsRange, id: string) {
    const dateFunctions = new ReportDetailsDateFunctions();

    let dateRange: GetLoanMetricsDto;
    if (metricsRange === "Today") {
      const today = dateFunctions.getTodayRange();
      dateRange = {
        start: today[0].toISOString(),
        end: today[1].toISOString(),
      };
    } else {
      const month = dateFunctions.getMonthRange();
      dateRange = {
        start: month[0].toISOString(),
        end: month[1].toISOString(),
      };
    }

    this.selectedMetricsRange = metricsRange;

    switch (id) {
      case "new-customer-regs":
        this.getNewCustomersRegsCount(dateRange);
        break;
      case "loan-apps":
        this.getLoanAppsCount(dateRange);
        break;
      case "approved-apps":
        this.getApprovedLoans(dateRange);
        break;
      case "settled-loans":
        this.getSettledLoansCount(dateRange);
        break;
      case "active-loans":
        this.getActiveLoansCount(dateRange);
        break;
      case "awaiting-disb":
        this.getLoansAwaitingDisbCount(dateRange);
        break;
      case "disbursements":
        this.getDisbursements(dateRange);
        break;
      case "rejected-apps":
        this.getRejectedApps(dateRange);
        break;
    }
  }

  getData() {
    const requests: Observable<HttpResponse<any>>[] = [];

    const daily = new ReportDetailsDateFunctions();
    const today = daily.getTodayRange();
    const todayRange = {
      start: today[0].toISOString(),
      end: today[1].toISOString(),
    };

    const weekly = new ReportDetailsDateFunctions();
    const week = weekly.getWeekRange();
    const weekRange = {
      start: week[0].toISOString(),
      end: week[1].toISOString(),
    };
    this.weekRange = weekRange;

    requests.push(this.metricsService.fetchActiveLoanTypesCount(todayRange));
    requests.push(this.metricsService.fetchAverageLoanSize(todayRange));
    requests.push(this.metricsService.fetchNewCustomersCount(todayRange));
    requests.push(this.metricsService.fetchLoanApplicationsCount(todayRange));

    requests.push(this.metricsService.fetchDisbursements(todayRange));
    requests.push(
      this.metricsService.fetchAwaitingDisbursementConfirmation(todayRange)
    );
    requests.push(this.metricsService.fetchRejectedApplications(todayRange));
    requests.push(this.metricsService.fetchMostSoldProduct(weekRange));

    requests.push(this.metricsService.fetchLargestLoanTicket(weekRange));
    requests.push(this.metricsService.fetchSmallestLoanTicket(weekRange));
    requests.push(this.metricsService.fetchMostSubscribedTenor(weekRange));
    requests.push(
      this.metricsService.fetchUserLoanActivities({
        pageNumber: 1,
        pageSize: 20,
      })
    );

    requests.push(this.metricsService.fetchSettledLoansCount(todayRange));
    requests.push(this.metricsService.fetchLoanStatusBreakdown(weekRange));
    requests.push(this.metricsService.fetchActiveLoansCount(todayRange));
    requests.push(this.metricsService.fetchApprovedLoans(todayRange));

    this.gettingData = true;
    forkJoin(requests)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.activeLoanTypes = res[0].body?.data || {};

          this.averageLoanSize = res[1].body?.data || {};

          this.newCustomers = res[2].body?.data || {};

          this.loanApplications = res[3].body?.data || {};

          this.disbursements = res[4].body?.data || {};

          this.loansAwaitingDisb = res[5].body?.data || {};

          this.rejectedApps = res[6].body?.data || {};

          this.mostSoldProduct = res[7].body?.data || {};

          this.largestLoanTicket = res[8].body?.data || {};

          this.smallestLoanTicket = res[9].body?.data || {};

          this.mostSubscribedTenor = res[10].body?.data || {};

          this.userLoanActivities = res[11].body?.items || [];
          this.setPagination(res[11].body);

          this.settledLoans = res[12].body?.data || {};

          this.loanStatusBreakdown = res[13].body?.data || {};

          this.activeLoans = res[14].body?.data || {};

          this.approvedLoans = res[15].body?.data || {};

          this.gettingData = false;
        },
        error: () => {
          this.gettingData = false;
        },
      });
  }

  getLoanAppsCount(dateRange: GetLoanMetricsDto) {
    this.gettingLoanAppsCount = true;
    this.metricsService
      .fetchLoanApplicationsCount(dateRange)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.loanApplications = res.body.data;
          this.gettingLoanAppsCount = false;
        },
        error: () => {
          this.gettingLoanAppsCount = false;
        },
      });
  }

  getNewCustomersRegsCount(dateRange: GetLoanMetricsDto) {
    this.gettingNewCustomersReg = true;
    this.metricsService
      .fetchNewCustomersCount(dateRange)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.newCustomers = res.body.data;
          this.gettingNewCustomersReg = false;
        },
        error: () => {
          this.gettingNewCustomersReg = false;
        },
      });
  }

  getSettledLoansCount(dateRange: GetLoanMetricsDto) {
    this.gettingSettledLoansCount = true;
    this.metricsService
      .fetchSettledLoansCount(dateRange)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.settledLoans = res.body.data;
          this.gettingSettledLoansCount = false;
        },
        error: () => {
          this.gettingSettledLoansCount = false;
        },
      });
  }

  getLoansAwaitingDisbCount(dateRange: GetLoanMetricsDto) {
    this.gettingLoansAwaitingDisbCount = true;
    this.metricsService
      .fetchAwaitingDisbursementConfirmation(dateRange)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.loansAwaitingDisb = res.body.data;
          this.gettingLoansAwaitingDisbCount = false;
        },
        error: () => {
          this.gettingLoansAwaitingDisbCount = false;
        },
      });
  }

  getDisbursements(dateRange: GetLoanMetricsDto) {
    this.gettingDisbursements = true;
    this.metricsService
      .fetchDisbursements(dateRange)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.disbursements = res.body.data;
          this.gettingDisbursements = false;
        },
        error: () => {
          this.gettingDisbursements = false;
        },
      });
  }

  getRejectedApps(dateRange: GetLoanMetricsDto) {
    this.gettingRejectedApps = true;
    this.metricsService
      .fetchRejectedApplications(dateRange)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.rejectedApps = res.body.data;
          this.gettingRejectedApps = false;
        },
        error: () => {
          this.gettingRejectedApps = false;
        },
      });
  }

  getApprovedLoans(dateRange: GetLoanMetricsDto) {
    this.gettingApprovedLoans = true;
    this.metricsService
      .fetchApprovedLoans(dateRange)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.approvedLoans = res.body.data;
          this.gettingApprovedLoans = false;
        },
        error: () => {
          this.gettingApprovedLoans = false;
        },
      });
  }

  getActiveLoansCount(dateRange: GetLoanMetricsDto) {
    this.gettingActiveLoansCount = true;
    this.metricsService
      .fetchActiveLoansCount(dateRange)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.activeLoans = res.body.data;
          this.gettingActiveLoansCount = false;
        },
        error: () => {
          this.gettingActiveLoansCount = false;
        },
      });
  }

  onGotoReports() {
    this.router.navigate(["loan/reports"]);
  }

  onGetUserLoanActivities(data = { pageNumber: 1, pageSize: 20 }) {
    this.gettingUserLoanActivities = true;
    this.metricsService
      .fetchUserLoanActivities(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.userLoanActivities = res.body.items;
          this.setPagination(res.body);
          this.gettingUserLoanActivities = false;
        },
        error: () => {
          this.gettingUserLoanActivities = false;
        },
      });
  }

  setPagination(res: GetUserLoanActivitiesResBody): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
