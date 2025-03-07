import { Component, OnInit, OnDestroy } from "@angular/core";
import { AuthService } from "src/app/service/auth.service";
import { Router } from "@angular/router";
import swal from "sweetalert2";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DomSanitizer } from "@angular/platform-browser";
import { GuidedTour, Orientation, GuidedTourService } from "ngx-guided-tour";
import { deploymentTarget } from "src/environments/deploymenttarget";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { Subject } from "rxjs";

import { AnimationOptions } from "ngx-lottie";
import { AllModulesEnum, ModuleCard } from "../models/all-modules.enum";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";
import { PaystackInfo } from "src/app/modules/configuration/models/configuration";
import { GrowthbookService } from "src/app/service/growthbook.service";
import GrowthBookFeatureTags from "src/app/model/growthbook-features";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { YearlyReviewDialogComponent } from "../yearly-review-dialog/yearly-review-dialog.component";
import { SharedService } from "src/app/service/shared.service";

@Component({
  selector: "app-all-modules-page",
  templateUrl: "./all-modules-page.component.html",
  styleUrls: ["./all-modules-page.component.scss"],
})
export class AllModulesPageComponent implements OnInit, OnDestroy {
  public lottieLoanConfig: Object;
  public lottieInvestmentConfig: Object;
  public lottieReportConfig: Object;
  public lottieUserConfig: Object;
  anim: any;
  currentuser: User;
  currentuserid: any;
  appOwner: AppOwnerInformation;
  user: User;
  isAppSubscriptionActive = false;
  loanSubscriptionIsActive: boolean = true;
  investmentSubscriptionIsActive: boolean = true;
  depositSubscriptionIsActive: boolean = true;
  financeSubscriptionIsActive: boolean = true;
  workflowSubscriptionIsActive: boolean = true;
  checkoutSubscriptionIsActive: boolean = true;
  crmSubscriptionIsActive = true;
  wacsSubscriptionIsActive = true;
  isProduction: boolean;
  subscriptionMessage = "";

  subscriptionUrl: any;
  appInfo: any;
  appUpdates: any;
  requestLoader = false;
  sumTotal = 0;
  isMultenantDeployment = deploymentTarget.isMultitenant;
  appOwnerKey: string;
  allModulesEnum = AllModulesEnum;

  loanLottieOptions: AnimationOptions = {
    path: "assets/lottie-files/loan.json",
  };
  investmentLottieOptions: AnimationOptions = {
    path: "assets/lottie-files/invest.json",
  };
  userLottieOptions: AnimationOptions = {
    path: "assets/lottie-files/user.json",
  };
  depositLottieOptions: AnimationOptions = {
    path: "assets/lottie-files/deposit.json",
  };
  financeLottieOptions: AnimationOptions = {
    path: "assets/lottie-files/finance.json",
  };
  workFlowLottieOptions: AnimationOptions = {
    path: "assets/lottie-files/work-flow.json",
  };
  checkoutLottieOptions: AnimationOptions = {
    path: "assets/lottie-files/checkout.json",
  };

  public dashboardTour: GuidedTour = {
    tourId: "welcome-tour",
    useOrb: false,
    steps: [
      {
        title: "Welcome to Lendastack",
        content: "Welcome to Lendastack loan management portal.",
      },
      {
        title: "Loans",
        selector: ".cyan",
        content: "Manage all that concerns loans here.",
        orientation: Orientation.Bottom,
        useHighlightPadding: true,
      },
      {
        title: "Investments",
        selector: ".red",
        content: "Manage all your investments.",
        orientation: Orientation.Bottom,
        useHighlightPadding: true,
      },
      {
        title: "User Management",
        selector: ".orange",
        content: "Manage your profile and your users.",
        orientation: Orientation.Bottom,
        useHighlightPadding: true,
      },
    ],
  };
  appIsModular: boolean;
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  urlProtocol: string;
  initStatus = { user: false, appOwner: false };
  paystackInfo: PaystackInfo;
  moduleCards: ModuleCard[] = [];
  currencySymbol: string | null = null;

  constructor(
    private modalService: NgbModal,
    private authService: AuthService,
    private router: Router,
    private configService: ConfigurationService,
    private userService: UserService,
    private sanitizer: DomSanitizer,
    private guidedTourService: GuidedTourService,
    private colorThemeService: ColorThemeService,
    private growthbookService: GrowthbookService,
    private dialog: MatDialog,
    private configurationService: ConfigurationService,
    private sharedService:SharedService
  ) {
    this.urlProtocol = window.location.host;
    this.checkForLiveDeployment();
    this.lottieLoanConfig = {
      path: "assets/lottie-files/loan.json",
      renderer: "canvas",
      autoplay: true,
      loop: true,
    };
    this.lottieInvestmentConfig = {
      path: "assets/lottie-files/invest.json",
      renderer: "canvas",
      autoplay: true,
      loop: true,
    };
    this.lottieReportConfig = {
      path: "assets/lottie-files/report.json",
      renderer: "canvas",
      autoplay: true,
      loop: true,
    };
    this.lottieUserConfig = {
      path: "assets/lottie-files/user.json",
      renderer: "canvas",
      autoplay: true,
      loop: true,
    };
    this.currentuserid = this.authService.decodeToken().nameid;
  }

  ngOnInit() {
    this.loadTheme();
    this.getAppOwnerDetails();
    this.getUser();
    this.appOwnerKey = sessionStorage.getItem("appOwnerPublicKey");
    this.getPaystackInfo();
    this.getCurrencySymbol();
  }

  private getPaystackInfo() {
    this.configService
      .getPaystackInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.paystackInfo = res.body.data;
      });
  }

  takeTour(): void {
    this.guidedTourService.startTour(this.dashboardTour);
  }

  openModule(module: AllModulesEnum) {
    this.sharedService.setModuleInSession(module);
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configurationService.currencySymbol;
    if (!this.currencySymbol) {
      this.configurationService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  logOut() {
    swal.fire({
      allowOutsideClick: false,
      showConfirmButton: false,
      imageUrl: "assets/images/password.png",
      imageWidth: 60,
      html: '<p><i class="icon icon-spin icon-spin2"></i>  We are logging you out...</p>',
    });
    this.authService.logout(this.currentuserid).subscribe(
      (res) => {
        sessionStorage.clear();
        this.router.navigateByUrl("/account/login/");
        swal.close();
      },
      (err) => {
        swal.close();
        swal.fire({ type: "error", title: "Error", text: err.error });
      }
    );
  }

  getAppOwnerDetails() {
    this.requestLoader = true;
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.setInitStatus({ appOwner: true });
          this.requestLoader = false;
          this.appOwner = res.body;
        },
        (err) => {
          this.requestLoader = false;
        }
      );
  }

  getUser() {
    this.requestLoader = true;
    this.userService
      .getUserInfo(this.currentuserid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
        this.currentuser = res.body;
        this.isAppSubscriptionActive = res.body.isSubscriptionActive;
        const modules = res.body?.modules;
        this.appIsModular = res.body.isModular;

        this.loanSubscriptionIsActive =
          (this.appIsModular &&
            !!modules?.find(
              (m) => m.moduleName.toLowerCase() == "loan" && m.isActive == true
            )) ||
          (!this.appIsModular && this.isAppSubscriptionActive);
        this.investmentSubscriptionIsActive =
          (this.appIsModular &&
            !!modules?.find(
              (m) =>
                m.moduleName.toLowerCase() == "investment" && m.isActive == true
            )) ||
          (!this.appIsModular && this.isAppSubscriptionActive);
        this.checkoutSubscriptionIsActive =
          (this.appIsModular &&
            !!modules?.find(
              (m) =>
                m.moduleName.toLowerCase() == "checkout" && m.isActive == true
            )) ||
          (!this.appIsModular && this.isAppSubscriptionActive);
        this.depositSubscriptionIsActive =
          (this.appIsModular &&
            !!modules?.find(
              (m) =>
                m.moduleName.toLowerCase() == "deposit" && m.isActive == true
            )) ||
          (!this.appIsModular && this.isAppSubscriptionActive);
        this.financeSubscriptionIsActive =
          (this.appIsModular &&
            !!modules?.find(
              (m) =>
                m.moduleName.toLowerCase() == "finance" && m.isActive == true
            )) ||
          (!this.appIsModular && this.isAppSubscriptionActive);

        this.crmSubscriptionIsActive =
          (this.appIsModular &&
            !!modules?.find(
              (m) => m.moduleName.toLowerCase() == "crm" && m.isActive == true
            )) ||
          (!this.appIsModular && this.isAppSubscriptionActive);

        this.wacsSubscriptionIsActive =
          (this.appIsModular &&
            !!modules?.find(
              (m) => m.moduleName.toLowerCase() == "wacs" && m.isActive == true
            )) ||
          (!this.appIsModular && this.isAppSubscriptionActive);

        this.workflowSubscriptionIsActive =
          (this.appIsModular &&
            !!modules?.find(
              (m) =>
                m.moduleName.toLowerCase() == "workflow" && m.isActive == true
            )) ||
          (!this.appIsModular && this.isAppSubscriptionActive);

        if (this.isProduction) {
          this.depositSubscriptionIsActive = false;
        }
        this.subscriptionMessage = res.body.subscriptionMessage;
        this.setInitStatus({ user: true });
        this.requestLoader = false;

        this.currentuser?.permission?.includes("Manage Business Information") &&
          this.loanBusinessNotifications();

        this.moduleCards = [
          {
            subscriptionIsActive: this.crmSubscriptionIsActive,
            name: "CRM",
            lottieFileName: `/assets/lottie-files/crm.json`,
            routerLink: "/crm/customers",
            module: AllModulesEnum.CRM
          },
          {
            subscriptionIsActive: this.wacsSubscriptionIsActive,
            name: "WACS",
            lottieFileName: `/assets/lottie-files/wacs.json`,
            routerLink: "/wacs/transactions",
            module: AllModulesEnum.wacs,
          },
        ];
      });
  }

  private loanBusinessNotifications() {
    this.configService
      .getAppUpdates()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.appUpdates = res.body;

        for (var i = 0; i < this.appUpdates.length; i++) {
          this.sumTotal = this.sumTotal + this.appUpdates[i].count;
        }
      });
  }

  setInitStatus(data: { user?: boolean; appOwner?: boolean }) {
    this.initStatus.user = this.initStatus.user || data.user;
    this.initStatus.appOwner = this.initStatus.appOwner || data.appOwner;

    if (this.initStatus.user && this.initStatus.appOwner) {
      this.navigateToPreviousUrl();
    }
  }

  navigateToPreviousUrl() {
    const previousUrl = this.authService.previousUrl;
    if (!previousUrl || previousUrl === "_REDIRECTED_") return;

    let moduleName = previousUrl.split("/")[1];

    if (
      (moduleName === "loan" ||
        moduleName === "deposit" ||
        moduleName === "finance" ||
        moduleName === "workflow" ||
        moduleName === "treasury" ||
        moduleName === "checkout-admin") &&
      this.authService.navigateToPreviousUrl
    ) {
      if (moduleName === "treasury") {
        this.openModule(AllModulesEnum.Investment);
      } else {
        if (moduleName === "checkout-admin") {
          moduleName = AllModulesEnum.CheckoutAdmin;
        }
        const modifiedModuleName = this.modifyModuleName(
          moduleName
        ) as AllModulesEnum;

        this.openModule(modifiedModuleName);
      }

      this.authService.previousUrl = "_REDIRECTED_";
      this.authService.navigateToPreviousUrl = false;

      // Remove first slash before navigation.
      this.router.navigateByUrl(previousUrl.substring(1));
    }
  }

  modifyModuleName(name: string) {
    const firstLetter = name[0].toUpperCase();
    const otherLetters = name.substring(1);
    const pascalCase = firstLetter + otherLetters;
    return pascalCase;
  }

  checkForLiveDeployment(): void {
    const urlSegments = this.urlProtocol.split(".");
    const isDevOrTest =
      urlSegments.some((x) => x === "dev") ||
      urlSegments.some((x) => x === "test") ||
      urlSegments.some((x) => x === "vercel") ||
      window.origin.includes("localhost");

    if (isDevOrTest) {
      this.isProduction = false;
    } else {
      this.isProduction = true;
    }
  }

  triggerSubcription(content) {
    var url =
      this.user.paymentUrl +
      "applicationKey=" +
      this.user.applicationKey +
      "&appOwnerKey=" +
      this.user.appOwnerKey;

    this.subscriptionUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.modalService.open(content, {
      size: "lg",
      centered: true,
      ariaLabelledBy: "modal-basic-title",
      windowClass: "custom-modal-style opq2",
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  showModuleByGrowthbookFlag(module: string): boolean {
    switch (module) {
      case "finance": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.FinanceModule
        );
      }
      case "checkout": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.CheckoutModule
        );
      }
      case "workflow": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.WorkflowModule
        );
      }

      case "crm": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.CRMModule
        );
      }
      case "deposit": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.DepositModule
        );
      };
      case "wacs": {
        return this.growthbookService.growthbook.isOn(
          GrowthBookFeatureTags.WacsModule
        );
      }
      default: {
        return false;
      }
    }
  }

  getCheckoutDefaultPageLink() {
    const perms = this.user.permission;
    if (
      perms.includes("View Checkout Transactions") ||
      perms.includes("View Checkout Commission Invoices")
    ) {
      return "/checkout-admin/transactions";
    } else if (perms.includes("View Checkout Customers")) {
      return "/checkout-admin/customers";
    } else if (perms.includes("View Merchants")) {
      return "/checkout-admin/config/merchants";
    } else {
      return "/checkout-admin/transactions";
    }
  }

  isWrappedFeatureEnabled(): boolean {
    return this.growthbookService.growthbook.isOn(
      GrowthBookFeatureTags.Wrapped
    );
  }

  openUserYearActivity(): void {
      const config = new MatDialogConfig();
      config.maxWidth = "700px";
      config.maxHeight = "450px"
      config.width = "100%";
      config.height = "100%";
      config.autoFocus = true;
      config.backdropClass = "blurry-bg";
      config.data = {
        logo: "assets/images/logo-white.png",
        lendastackLogo: "assets/images/wrapped/logo-2.svg",
        appOwnerName: this.appOwner?.appOwnerName,
        name: this.user.person.firstName,
        permissions: this.user?.permission,
        currencySymbol: this.currencySymbol
      };
      this.dialog.open(YearlyReviewDialogComponent, config);
    }

    ngOnDestroy() {
      this.unsubscriber$.next();
      this.unsubscriber$.complete();
    }
}
