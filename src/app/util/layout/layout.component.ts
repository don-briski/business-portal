import { Component, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { NavigationEnd, Router, RouterLinkActive } from "@angular/router";
import { RealtimeService } from "src/app/service/realtime.service";
import { LoanoperationsService } from "src/app/service/loanoperations.service";
import swal from "sweetalert2";
import Swal from "sweetalert2";
import { ConfigurationService } from "src/app/service/configuration.service";
import { PushNotificationsService } from "ng-push";
import { PushNotificationService } from "src/app/service/push-notification.service";
import { DomSanitizer } from "@angular/platform-browser";
import { PushNotification } from "src/app/model/push-notification.model";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { AllModulesEnum } from "../models/all-modules.enum";
import { WorkflowService } from "src/app/modules/workflow/services/workflow.service";
import { PendingRequestsStats } from "src/app/modules/workflow/workflow.types";
import { GrowthbookService } from "src/app/service/growthbook.service";
import GrowthBookFeatureTags from "src/app/model/growthbook-features";
import { AnimationOptions } from "ngx-lottie";
import { LayoutNav, User } from "src/app/modules/shared/shared.types";
import { SharedService } from "src/app/service/shared.service";

@Component({
  selector: "app-layout",
  templateUrl: "./layout.component.html",
  styleUrls: ["./layout.component.scss"],
})
export class LayoutComponent implements OnInit, AfterViewInit {
  copyright: number;
  metricsdata: any;
  public loggedInUser: any;
  currentuserbranchid: any;
  currentuserid: any;
  public user: User;
  module: string;
  public pushNotificationIsOpened: boolean;
  public allPushNotifications: PushNotification[] = [];

  public name: string;
  public root = "https://lenda-bucket.s3.eu-west-2.amazonaws.com/lendadevenv/";
  appOwner: any;
  appOwnerKey: string;
  public currentTheme: ColorThemeInterface & { textColor?: string };

  isSidebarClosed: boolean;

  unsubscriber$ = new Subject<void>();
  appOwnerLogo: any = null;
  allModulesEnum = AllModulesEnum;

  currentNavItemId?: string;
  pendingRequestsStats: PendingRequestsStats;

  activeUrl: string;

  popupLottieOptions: AnimationOptions = {
    path: "assets/lottie-files/trophy.json",
  };

  layoutNavs: LayoutNav[];
  userProfilePicture: string;
  growthBookFeatureTags = GrowthBookFeatureTags;
  @ViewChild(RouterLinkActive) routerLinkActive: RouterLinkActive;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private realtimeService: RealtimeService,
    private loanoperationService: LoanoperationsService,
    private configService: ConfigurationService,
    private _pushNotifications: PushNotificationsService,
    private pushNotification: PushNotificationService,
    private sanitizer: DomSanitizer,
    private colorThemeService: ColorThemeService,
    private workflowService: WorkflowService,
    private growthbookService: GrowthbookService,
    private sharedService: SharedService
  ) {
    this.copyright = new Date().getFullYear();
    this._pushNotifications.requestPermission();

    this.router.events.pipe(takeUntil(this.unsubscriber$)).subscribe((val) => {
      if (val instanceof NavigationEnd && this.currentTheme) {
        this.activeUrl = val?.url;
        this.changeActiveLinkColor();
        this.isSidebarClosed = true;
      }
    });

    this.listenForCrmCustomer();
  }

  ngOnInit() {
    this.onUserUpdated();
    this.loadTheme();
    this.loadModule();
    this.currentuserbranchid = this.authService.decodeToken().groupsid;
    this.currentuserid = this.authService.decodeToken().nameid;

    this.loggedInUser = this.authService.decodeToken();
    this.name = this.authService.decodeToken().actort;
    this.appOwnerKey = sessionStorage.getItem("appOwnerPublicKey");

    // this.getNotifications();

    this.configService.isSidebarClosed$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.isSidebarClosed = res;
      });

    if (this.module.toLocaleLowerCase() === "workflow") {
      this.getPendingReqsStats();
      this.listenForPendingReqsStats();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.fetchUser();
      this.fetchAppOwner();
      this.changeActiveLinkColor();
    });
  }

  onUserUpdated() {
    this.userService.userUpdated.pipe(takeUntil(this.unsubscriber$)).subscribe({
      next: (res) => {
        this.user = res;
        this.userProfilePicture = this.getUserProfilePicture();
      },
    });
  }

  getUserProfilePicture() {
    return this.user?.person?.profilePic
      ? `${this.user?.person?.profilePic}?timestamp=${Date.now()}`
      : null;
  }

  setLayoutNav() {
    const currentModule = sessionStorage.getItem("module");
    if (currentModule === this.allModulesEnum.CheckoutAdmin) {
      this.layoutNavs = [
        {
          parent: "Main",
          children: [
            {
              icon: "icon-company",
              routerLink: "/checkout-admin/transactions",
              title: "Manage Transactions",
              text: "Transactions",
              canView:
                this.user.permission.includes("View Checkout Transactions") ||
                this.user.permission.includes(
                  "View Checkout Commission Invoices"
                ),
            },
            {
              icon: "icon-user",
              routerLink: "/checkout-admin/customers",
              title: "Manage Customers",
              text: "Customers",
              canView: this.user.permission.includes("View Checkout Customers"),
            },
            {
              icon: "icon-company",
              routerLink: "/checkout-admin/config/merchants",
              title: "Manage Merchants",
              text: "Merchants",
              canView: this.user.permission.includes("View Merchants"),
            },
          ],
        },
        {
          parent: "Configuration",
          children: [
            {
              icon: "icon-editor",
              routerLink: "/checkout-admin/config/risk-assessment",
              title: "Manage Risk Assessment",
              text: "Risk Assessment",
              canView: this.user.permission.includes(
                "View Risk Engine Configuration"
              ),
            },
            {
              icon: "icon-editor",
              routerLink: "/checkout-admin/config/credit-affordability",
              title: "Manage Credit Affordability",
              text: "Credit Affordability",
              canView: this.user.permission.includes(
                "View Risk Engine Configuration"
              ),
            },
          ],
        },
        {
          parent: "General",
          children: [
            {
              icon: "icon-data-display",
              routerLink: "/checkout-admin/reports",
              title: "View Report",
              text: "Report",
              canView: this.user?.permission?.includes(
                "View Merchant Transactions Report"
              ),
            },
            {
              icon: "icon-profile",
              routerLink: "/configurations/settings",
              title: "Manage Profile",
              text: "Profile",
              canView: true,
            },
          ],
        },
      ];
    } else if (currentModule === this.allModulesEnum.CRM) {
      setTimeout(() => {
        this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.CRMCustomer
        );
      });
      this.layoutNavs = [
        {
          parent: "Main",
          children: [
            {
              icon: "icon-user-o",
              routerLink: "/crm/customers",
              title: "Manage Customers",
              text: "Customer Management",
              canView: this.user.permission.includes("View Prospect"),
            },
            {
              icon: "icon-setting",
              routerLink: "/crm/configurations",
              title: "Manage Configurations",
              text: "Configurations",
              canView: this.user.permission.includes("View Prospect Case Type"),
            },
          ],
        },
        {
          parent: "General",
          children: [
            {
              icon: "icon-profile",
              routerLink: "/configurations/settings",
              title: "Manage Profile",
              text: "Profile",
              canView: true,
            },
          ],
        },
      ];
    } else if (currentModule === this.allModulesEnum.wacs) {
      this.layoutNavs = [
        {
          parent: "Main",
          children: [
            {
              icon: "icon-editor",
              routerLink: "/wacs/transactions",
              title: "Manage Transactions",
              text: "Transactions",
              canView: this.user.permission.includes("View Wacs Transactions"),
            },
            {
              icon: "icon-user-o",
              routerLink: "/wacs/customers",
              title: "Manage WACS Customers",
              text: "Customers",
              canView: this.user.permission.includes("View Wacs Customers"),
            },
            {
              icon: "icon-ckeditor",
              routerLink: "/wacs/loan-products",
              title: "Manage Loan Products",
              text: "Loan Products",
              canView: this.user.permission.includes("View Wacs Loan Types"),
            },
          ],
        },
      ];
    }
  }

  isWhitelistedQLPViewer(): boolean {
    let host = window.location.host;
    let split = host.split(".");
    let subdomain = split[0];

    if (
      subdomain.includes("localhost") ||
      subdomain.includes("dev") ||
      subdomain.includes("test") ||
      subdomain.includes("vercel")
    )
      return true;

    if (subdomain.includes("lenda") || subdomain.includes("graceville"))
      return true;

    return false;
  }

  isFeatureEnabled(feature: string): boolean {
    switch (feature) {
      case "qlp": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.QLP
        );
      }
      case "vcn": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.VendorCreditNote
        );
      }
      case "cn": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.CreditNote
        );
      }
      case GrowthBookFeatureTags.EnterpriseStyle: {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.EnterpriseStyle
        );
      }
      default: {
        return false;
      }
    }
  }

  fetchAppOwner() {
    this.configService.getAppOwnerInfo().subscribe((res) => {
      this.appOwner = res.body;
      this.appOwnerLogo =
        this.appOwner?.logoUrl ?? "assets/images/logo-blue.png";
    });
  }

  changeActiveLinkColor(): void {
    setTimeout(() => {
      let elements = document.getElementsByClassName("dt-side-nav__link");

      for (let i = 0; i < elements.length; i++) {
        if (elements[i].classList.contains("active")) {
          elements[i].setAttribute(
            "style",
            `background-color: ${this.currentTheme?.secondaryColor}`
          );
        } else {
          elements[i].setAttribute("style", `background-color: transparent`);
        }
      }
    });
  }

  realTimeListener() {
    this.realtimeService
      .getNewAppNotification()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(() => {
        this.getPoolCount((metricsdata) => {
          const appPool = metricsdata.ApplicationPool.Count;
          const disbursePool = metricsdata.DisbursementPool.Count;

          this.notifyApplicationPool(appPool);
          this.notifyDisbursementPool(disbursePool);
        });
      });
  }

  isChildUrlActive(children: string[]): boolean {
    return children.includes(this.activeUrl);
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe((res) => {
        this.user = res.body;
        this.userProfilePicture = this.getUserProfilePicture();
        this.userService.userPermissions = [...this.user.permission];
        this.setLayoutNav();
        $(document).ready(() => {
          $.getScript("assets/js/sidebar.js");
        });
        this.getPoolCount();
      });
  }

  getPoolCount(callback = null) {
    if (this.module.toLocaleLowerCase() !== "loan") {
      return;
    }
    this.loanoperationService
      .spoolPoolMetrics(this.currentuserbranchid, this.currentuserid)
      .subscribe((response) => {
        this.metricsdata = response.body;
        if (callback != null) callback(this.metricsdata);
      });
  }

  logOut() {
    Swal.fire({
      allowOutsideClick: false,
      showConfirmButton: false,
      imageUrl: "assets/images/password.png",
      imageWidth: 60,
      html: '<p><i class="icon icon-spin icon-spin2"></i>  We are logging you out...</p>',
    });
    this.authService.logout(this.currentuserid).subscribe(
      (res) => {
        //   this.realtimeService.cancelConnection();
        sessionStorage.removeItem("auth");
        this.router.navigateByUrl(`/account/login/`);
        sessionStorage.clear();
        Swal.close();
      },
      (err) => {
        Swal.close();
        swal.fire({ type: "error", title: "Error", text: err.error });
      }
    );
  }

  loadModule() {
    this.module = sessionStorage.getItem("module");
  }

  manageSubs() {
    // tslint:disable-next-line: max-line-length
    window.open(
      `http://fulcrumapi-dev.eu-west-2.elasticbeanstalk.com/pay/index.html?applicationKey=828DAC50-98EB-4E3C-B335-10313F675A59&appOwnerId=${this.appOwner.appOwnerId}&appOwnerKey=${this.user.appOwnerKey}`
    );
  }

  notify(appPool, disbursePool) {
    //our function to be called on click
    let body = "";
    if (
      this.user.permission.includes("View Application Pool") &&
      appPool != 0
    ) {
      body += `You have ${appPool} in the Application Pool.\n`;
    }
    if (
      this.user.permission.includes("View Disbursement Pool") &&
      disbursePool != 0
    ) {
      body += `You have ${disbursePool} in the Disbursement Pool.`;
    }

    let options = {
      //set options
      body: body,
      icon: this.appOwnerLogo ?? "assets/images/logo-blue.png", //adding an icon
    };
    this._pushNotifications.create("New Application", options).subscribe(
      //creates a notification
      (res) => {
        if (res.event.type === "click") {
          // You can do anything else here
          parent.focus();
          window.focus();
          res.notification.close();
        }
      }
    );
  }

  notifyApplicationPool(appPool) {
    //our function to be called on click
    if (
      this.user.permission.includes("View Application Pool") &&
      appPool != 0
    ) {
      let body = `${appPool} loan application${
        appPool > 1 ? "s" : ""
      } in the pool.\n`;
      let options = {
        //set options
        body: body,
        icon: this.appOwnerLogo ?? "assets/images/logo-blue.png", //adding an icon
      };
      this._pushNotifications.create("New Application", options).subscribe(
        //creates a notification
        (res) => {
          if (res.event.type === "click") {
            // You can do anything else here
            parent.focus();
            window.focus();
            this.router.navigate(["/main/pool/applicationpool"]);
            res.notification.close();
          }
        }
      );
    }
  }

  notifyDisbursementPool(disbursePool) {
    //our function to be called on click

    if (
      this.user.permission.includes("View Disbursement Pool") &&
      disbursePool != 0
    ) {
      let body = `${disbursePool} loan application${
        disbursePool > 1 ? "s" : ""
      } in disbursement pool.`;
      let options = {
        //set options
        body: body,
        icon: this.appOwnerLogo ?? "assets/images/logo-blue.png", //adding an icon
      };
      this._pushNotifications.create("Approved Application", options).subscribe(
        //creates a notification
        (res) => {
          if (res.event.type === "click") {
            // You can do anything else here
            parent.focus();
            window.focus();
            this.router.navigate(["/main/pool/disbursementpool"]);
            res.notification.close();
          }
        }
      );
    }
  }

  toggleSidebar(): void {
    this.isSidebarClosed = !this.isSidebarClosed;
    this.configService.isSidebarClosed$.next(this.isSidebarClosed);
  }

  public togglePush(): void {
    this.pushNotificationIsOpened = !this.pushNotificationIsOpened;
  }

  private getNotifications(): void {
    this.pushNotification.getAllNotifications().subscribe((res) => {
      this.allPushNotifications = res;
      this.allPushNotifications.filter((notification) => {
        notification.excerptVal = this.sanitizer.bypassSecurityTrustHtml(
          notification.excerpt.rendered
        );
        notification.contentVal = this.sanitizer.bypassSecurityTrustHtml(
          notification.content.rendered
        );

        return notification;
      });
      this.allPushNotifications = [...this.allPushNotifications];
    });
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
        if (this.currentTheme.theme === "Light Mode") {
          this.currentTheme = { ...this.currentTheme, textColor: "#000" };
        } else if (this.currentTheme.theme === "Dark") {
          this.currentTheme = { ...this.currentTheme };
        }
      });
  }

  onShowSubNavItems(id: string) {
    if (this.currentNavItemId === id) {
      this.currentNavItemId = null;
      return;
    }
    this.currentNavItemId = id;
  }

  getPendingReqsStats() {
    this.workflowService
      .getPendingRequestsStats()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.pendingRequestsStats = res.body;
        },
      });
  }

  listenForPendingReqsStats() {
    this.workflowService.pendingRequestsStats
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (stats) => {
          this.pendingRequestsStats = stats;
        },
      });
  }

  private listenForCrmCustomer() {
    this.router.events
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          const module = event.url.split("/")[1];
          if (module === "crm") {
            this.sharedService.setModuleInSession(AllModulesEnum.CRM)
          }
          this.loadModule();
        }
      });
  }
}
