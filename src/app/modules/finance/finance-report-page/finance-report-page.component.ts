import { Component, OnInit, OnDestroy } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as $ from "jquery";
import Swal from "sweetalert2";
import { Subject } from "rxjs";
import { pluck, take, takeUntil } from "rxjs/operators";
import { Router } from "@angular/router";
import * as moment from "moment";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ReportService } from "../../../service/report.service";
import { FinanceReportTypes } from "../models/finance-type.enum";
import { FinanceReportLists } from "../models/finance-report-list";
import { ConfigurationService } from "../../../service/configuration.service";
import { AuthService } from "../../../service/auth.service";
import { UserService } from "../../../service/user.service";
import { FinanceService } from "../service/finance.service";
import { ActivatedRoute } from "@angular/router";
import { ChartOfAccountService } from "src/app/service/chart-of-account.service";

@Component({
  selector: "app-finance-report-page",
  templateUrl: "./finance-report-page.component.html",
  styleUrls: ["./finance-report-page.component.scss"],
})
export class FinanceReportPageComponent implements OnInit, OnDestroy {
  reportName: string;
  openedReportTyped: FinanceReportTypes;

  userInfo: any;
  loader = false;
  requestLoader: boolean;
  ownerInformation: any;

  branchesAccessibleArray: any[] = [];
  queuedReportList: any[] = [];

  public unsubscriber$ = new Subject<void>();

  loggedInUser: any;
  currentTheme: ColorThemeInterface;
  showAside: boolean;
  agingDetailPeriod: string;
  agingDetailPeriodType: string;
  reportLists = FinanceReportLists?.allReports;
  fiscalYear: { startFiscalYear: string; endFiscalYear: string };
  allAccounts: any[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private modalService: NgbModal,
    private reportService: ReportService,
    private configurationService: ConfigurationService,
    private route: ActivatedRoute,
    private router: Router,
    private colorThemeService: ColorThemeService,
    private financeService: FinanceService,
    private coaService: ChartOfAccountService
  ) {
    this.loadFiscalYear();
    this.loadAllAccounts();
  }

  ngOnInit() {
    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams?.period) {
        this.agingDetailPeriod = queryParams?.period;
        this.agingDetailPeriodType = queryParams?.type;
        this.loader = true;
        if (this.ownerInformation) {
          this.getConstants();
        }
      } else {
        this.agingDetailPeriod = null;
        this.agingDetailPeriodType = null;
      }
    });

    this.loadTheme();
    this.loggedInUser = this.authService.decodeToken();

    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }
    this.getUserInfo();
    this.getConstants();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  loadFiscalYear(): void {
    this.financeService
      .getFiscalYearConfig()
      .pipe(takeUntil(this.unsubscriber$), pluck("body"))
      .subscribe((res) => {
        this.fiscalYear = {
          startFiscalYear: res?.nextFiscalYearStart,
          endFiscalYear: res?.nextFiscalYearEnd,
        };
      });
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  getConstants() {
    this.requestLoader = true;
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
        this.requestLoader = false;

        if (this.agingDetailPeriod) {
          let report;
          this.agingDetailPeriodType === "Invoices"
            ? (report = FinanceReportTypes.InvoiceAgingDetailsReport)
            : (report = FinanceReportTypes.BillAgingDetailsReport);
          setTimeout(() => {
            this.openReportAside(report, false);
            this.loader = false;
          }, 1000);
        }
      },
      (error) => {
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
          });
        });
        this.requestLoader = false;
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

  toggleAside() {
    this.showAside = false;
    if (this.agingDetailPeriod) {
      this.router.navigate(["finance/reports"], {
        queryParams: { view: null, period: null, type: null },
        queryParamsHandling: "merge",
      });
    }
  }

  openReportAside(type: FinanceReportTypes, isDisabled?: boolean): void {
    if (isDisabled) return;
    this.openedReportTyped = type;
    this.showAside = true;
  }

  openModal(content) {
    this.modalService.open(content, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  loadQueuedReports() {
    this.requestLoader = true;
    this.reportService.spoolQueuedReports(this.reportName).subscribe(
      (res) => {
        this.queuedReportList = res.body.value.data;
        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = false;
      }
    );
  }

  private loadAllAccounts(): void {
    this.coaService
      .getAllAccounts()
      .pipe(take(1))
      .subscribe((res) => {
        this.allAccounts = res;
      });
  }

  public downloadQueueReport(currentFileDownloadUrl) {
    window.open(currentFileDownloadUrl, "_blank");
  }

  protected formatDate(date: string): string {
    let newDate = new Date(date);
    return moment(newDate).format("DD-MMM-YYYY");
  }
}
