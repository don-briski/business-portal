import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ReportDetailsDateFunctions } from "src/app/model/ReportDetailsDateFunctions";
import { AuthService } from "src/app/service/auth.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import Swal from "sweetalert2";
import { FinanceMetricsFetchModel } from "../types/financemetricsfetchmodel.interface";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  dashboardData: any[] = [];
  financeMetricsData: any[] = [];
  ownerInformation;
  currentuser: any;
  loggedInUser: any;
  current = "finToday";
  financeMetricsFetchModel: FinanceMetricsFetchModel;
  subs$ = new Subject<void>();
  currentTheme: ColorThemeInterface;

  constructor(
    private configurationService: ConfigurationService,
    private userService: UserService,
    public authService: AuthService,
    private router: Router,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.loadTheme();

    this.financeMetricsFetchModel = this.getFinanceMetricsFetchModel();
    this.loggedInUser = this.authService.decodeToken();

    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      Swal.fire("Error", "Please log in", "error");
    }

    this.getUserPromise().then((next) => {
      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
      this.getOwnerInformation();
    });
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getFinanceMetricsFetchModel() {
    const DateFunctions = new ReportDetailsDateFunctions();
    const today = new Date();
    const todayRange = DateFunctions.getTodayRange();
    const monthRange = DateFunctions.getMonthRange();
    const yearRange = DateFunctions.getYearRange();

    const dates = {
      todayStart: todayRange[0],
      todayEnd: todayRange[1],
      monthStart: monthRange[0],
      monthEnd: monthRange[1],
      yearStart: yearRange[0],
      yearEnd: yearRange[1],
      BranchId: this.authService.decodeToken().groupsid,
      UserId: this.authService.decodeToken().nameid,
    };
    return dates;
  }

  getOwnerInformation() {
    this.configurationService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  getUserPromise() {
    return new Promise((resolve, reject) => {
      this.userService.getUserInfo(this.loggedInUser.nameid).subscribe(
        (user) => {
          this.currentuser = user.body;
          resolve(user);
        },
        (err) => {
          reject(err.error);
        }
      );
    });
  }

  ngOnDestroy() {
    this.subs$.next();
    this.subs$.complete();
  }
}
