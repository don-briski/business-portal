import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { RealtimeService } from "./service/realtime.service";
import { AuthService } from "./service/auth.service";
import Swal from "sweetalert2";
import {
  Router,
  NavigationEnd,
  RouterEvent,
  RouteConfigLoadStart,
  RouteConfigLoadEnd,
} from "@angular/router";
import { UserIdleService } from "angular-user-idle";
import { TokenRefreshErrorHandler } from "./service/TokenRefreshErrorHandler";
import { AuthGuard } from "./util/guard/auth.guard";
import { TokenSessionComponent } from "./util/token-session/token-session.component";
import { ConnectionService } from "ng-connection-service";
import { JwtHelperService } from "@auth0/angular-jwt";
import { deploymentTarget } from "./../environments/deploymenttarget";
import { ConfigurationService } from "./service/configuration.service";
import { Subject } from "rxjs";
import { takeUntil, pluck } from "rxjs/operators";
import { AnalyticsService } from "./service/analytics.service";
import { GrowthbookService } from "./service/growthbook.service";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { EnterpriseStyleService } from "./service/stylesheet/enterprise-style.service";
import { AuthData, SharedService } from "./service/shared.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  title = "spa";
  pageRefresh = false;
  destinationUrl: string;
  isConnected = true;
  public toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    showCloseButton: true,
    background: "#90ee90",
  });
  public isShowingRouteLoadIndicator: boolean;
  isSidebarClosed = false;
  timeoutWasJustUpdated: boolean = false;

  unsubscriber$ = new Subject<void>();
  constructor(
    private realtimeService: RealtimeService,
    private authService: AuthService,
    private router: Router,
    private userIdle: UserIdleService,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private authGuard: AuthGuard,
    private dialog: MatDialog,
    private connectionService: ConnectionService,
    private configService: ConfigurationService,
    private analyticsService: AnalyticsService,
    private growthbookService: GrowthbookService,
    private stylesheetService: EnterpriseStyleService,
    private sharedService: SharedService
  ) {
    // Set stylesheet
    this.setStyleSheet();
    // show no internet
    this.connectionService.monitor().subscribe((isConnected) => {
      this.isConnected = isConnected;
      if (this.isConnected) {
        this.toast.fire({
          type: "success",
          title: "You are connected to the internet.",
        });
      }
    });

    // Show module preloader
    this.isShowingRouteLoadIndicator = false;
    let asyncLoadCount = 0;
    router.events.subscribe((event: RouterEvent): void => {
      if (event instanceof RouteConfigLoadStart) {
        asyncLoadCount++;
      } else if (event instanceof RouteConfigLoadEnd) {
        asyncLoadCount--;
      }
      this.isShowingRouteLoadIndicator = !!asyncLoadCount;
    });
  }

  ngAfterViewInit() {
    // trigger an emit
    // this.tokenRefreshError.tokenNeedsRefresh.emit(false);
    this.analyticsService.initializeGoogleAnalytics();
    this.analyticsService.initializeHotJarAnalytics();
    this.growthbookService.launchGrowthBook();
  }

  ngOnInit(): void {

    // Token check
    const auth = this.checkToken();
    if (auth) {
      this.getCurrencySymbol();
    }

    sessionStorage.setItem(
      "tenancy",
      new Boolean(deploymentTarget.isMultitenant).toString()
    );

    // bode : let's discus
    if (!auth) {
      // this.router.navigateByUrl('/account/login');
    }
    // subscribe to page refresh event
    this.authGuard.pageRefreshEvent.subscribe((res) => {
      if (res) {
        this.pageRefresh = true;
      }
    });
    // subscribe to tokenNeedsRefresh event
    this.tokenRefreshError.tokenNeedsRefresh.subscribe((res) => {
      if (res) {
        this.OpenTokenExpiredDialog();
      }
    });

    // subscribe to destination url
    this.authGuard.destination.subscribe((res) => {
      if (res != null) {
        this.destinationUrl = res;
        sessionStorage.setItem("dest", this.destinationUrl);
      }
    });

    const token: any = this.jwtHelperService.tokenGetter();
    if (this.authService.loggedIn(token)) {
      this.realtimeService.startConnection();
      this.realtimeService.newPoolListener();
      this.getTimeoutConfig();
    }

    this.configService.isSidebarClosed$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.isSidebarClosed = res;
      });

    //listen for user timeout Update
    this.configService.timeoutUpdated$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.timeoutWasJustUpdated = true;
        this.userIdle.stopWatching();
        this.getTimeoutConfig();
      });

    //listen for user log in
    this.configService.userJustLoggedIn$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(() => {
        this.userIdle.stopWatching();
        this.getTimeoutConfig();
      });
  }

  getCurrencySymbol() {
    this.configService
      .getCurrencySymbol()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe();
  }

  private _initUserIdleSettings(): void {
    // Start watching for user inactivity.
    this.userIdle.startWatching();
    // Start watching when user idle is starting.

    this.authService.timerSub = this.userIdle
      .onTimerStart()
      .subscribe((count) => {
        if (!this.timeoutWasJustUpdated) {
          this.handleInactivityCallback();
        }
      });
    this.timeoutWasJustUpdated = false;
  }

  getTimeoutConfig(): void {
    this.configService
      .spoolOwnerInfo()
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        if (res?.appInactivityTimeoutSeconds) {
          this.userIdle.setConfigValues({
            idle: res?.appInactivityTimeoutSeconds,
            timeout: 300,
            ping: 120,
          });

          this._initUserIdleSettings();
        }
      });
  }

  handleInactivityCallback() {
    this.userIdle.stopTimer();
    const token: any = this.jwtHelperService.tokenGetter();
    if (this.authService.loggedIn(token)) {
      Swal.fire({
        title: "Inactivity",
        // tslint:disable-next-line:max-line-length
        text: "You have been inactive for a while now your session will expire after 30 seconds, close this alert to reactivate!",
        imageUrl: "assets/images/businessman.png",
        imageWidth: 100,
        imageHeight: 100,
        imageClass: "img-circle",
        showCloseButton: true,
        timer: 30000,
        onOpen: () => {
          Swal.showLoading();
        },
      }).then(
        (result) => {
          if (result.dismiss === Swal.DismissReason.close) {
            Swal.clickCancel();
            this.userIdle.resetTimer();
          } else if (result.dismiss === Swal.DismissReason.timer) {
            const authDataString = sessionStorage.getItem("auth");
            if (authDataString) {
                const authData: AuthData = JSON.parse(authDataString) as AuthData;
                this.sharedService.setAuthData(authData);
              }
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("auth");
            sessionStorage.removeItem("encodedUser");
            this.OpenTokenExpiredDialog();

          }
        },
        () => {}
      );
    }
  }

  OpenTokenExpiredDialog() {
    // Open password dialog component
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = "35%";
    dialogConfig.disableClose = true;
    this.dialog.open(TokenSessionComponent, dialogConfig);
  }

  checkToken(): boolean {
    const token: any = this.jwtHelperService.tokenGetter();
    if (!token) {
      return false;
    } else {
      const tokenExpired: any = this.jwtHelperService.isTokenExpired(token);
      if (tokenExpired) {
        return false;
      } else {
        return true;
      }
    }
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  setStyleSheet(): void {
    const urlProtocol = window.location.host;

    let businessName = urlProtocol.split(".")[0];
    const domainSegment = urlProtocol.split(".")[1];

    if (domainSegment === "vercel") {
      businessName = urlProtocol.split("-")[0];
    }
    const businessesWithNewStyle = ["cdl", "regression", "checkout"];
    if (businessesWithNewStyle.includes(businessName)) {
      this.stylesheetService.loadStylesheet("enterprise");
    } else {
      this.stylesheetService.loadStylesheet("default");
    }
  }
}
