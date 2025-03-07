import { Component, OnInit } from "@angular/core";
import { InvestmentService } from "src/app/service/investment.service";
import swal from "sweetalert2";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "../../../service/user.service";
import { AuthService } from "../../../service/auth.service";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { Subject } from "rxjs";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-investment-dashboard",
  templateUrl: "./investment-dashboard.component.html",
  styleUrls: ["./investment-dashboard.component.scss"],
})
export class InvestmentDashboardComponent implements OnInit {
  dashboardData = [];
  ownerInformation = {};
  currentuser: any;
  public loggedInUser: any;

  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  constructor(
    private investmentService: InvestmentService,
    private configurationService: ConfigurationService,
    private userService: UserService,
    public authService: AuthService,
    private router: Router,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit() {
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

    this.getUserPromise()
      .then((next) => {
        $(document).ready(() => {
          $.getScript("assets/js/script.js");
        });
        this.getDashboardData();
        this.getOwnerInformation();
      })
      .catch((err) => {
        // if (this.httpFailureError) { swal.fire('Error', 'User not Loaded: ' + err.error, 'error'); }
      });
  }

  setColor(btn1: any, btn2, btn3, btn4): any {
    btn1.style.background = this.currentTheme.primaryColor;
    btn1.style.color = "#fff";

    btn2.style.background = "#fff";
    btn2.style.color = "#000";

    btn3.style.background = "#fff";
    btn3.style.color = "#000";

    btn4.style.background = "#fff";
    btn4.style.color = "#000";
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getDashboardData() {
    this.investmentService.fetchInvestmentDashboardInfo().subscribe(
      (res) => {
        this.dashboardData = res.body;
      },
      (err) => {
        // Swal.fire('Error', err.error, 'error');
      }
    );
  }

  getOwnerInformation() {
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
      },
      (error) => {}
    );
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
}
