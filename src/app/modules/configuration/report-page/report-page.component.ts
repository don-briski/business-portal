import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserReportLists } from "../../finance/models/user-report-list";
import Swal from "sweetalert2";
import { UserReportTypes } from "../../finance/models/user-type.enum";
import { UserService } from "src/app/service/user.service";

@Component({
  selector: "lnd-report-page",
  templateUrl: "./report-page.component.html",
  styleUrls: ["./report-page.component.scss"],
})
export class ReportPageComponent implements OnInit {
  reportLists = UserReportLists?.allReports;
  currentTheme: ColorThemeInterface;
  showAside: boolean;
  requestLoader: boolean;
  loggedInUser: any;
  branchesAccessibleArray: any[] = [];
  openedReportTyped: UserReportTypes;
  userInfo: any;
  ownerInformation: any;

  private unsubscriber$ = new Subject();

  constructor(
    private colorThemeService: ColorThemeService,
    private configurationService: ConfigurationService,
    private authService: AuthService,

    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
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

  getUserInfo() {
    this.userService.getUserInfo(this.loggedInUser.nameid).subscribe((res) => {
      this.userInfo = res.body;
      $(document).ready(() => {
        $.getScript("assets/js/script.js");
      });
      this.loadDropdown();
    });
  }

  getConstants() {
    this.requestLoader = true;
    this.configurationService.spoolOwnerInfo().subscribe(
      (response) => {
        this.ownerInformation = response.body;
        this.requestLoader = false;
      },
      (error) => {
        this.requestLoader = false;
      }
    );

    this.requestLoader = false;
  }

  toggleAside() {
    this.showAside = false;
    (window as any).viewLoan();
  }

  openReportAside(type: UserReportTypes): void {
    this.openedReportTyped = type;
    this.showAside = true;
    (window as any).viewLoan();
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
}
