import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from "@angular/core";
import { UntypedFormGroup, UntypedFormControl, Validators } from "@angular/forms";
import { AuthService } from "../../../service/auth.service";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import Swal from "sweetalert2";
import { deploymentTarget } from "src/environments/deploymenttarget";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { environment } from "src/environments/environment";

const OTP_RETRY_TIMER = 120;
const OTP_RETRY_TIMER_IN_MILLSECS = OTP_RETRY_TIMER * 1000;
@Component({
  selector: "app-login-page",
  templateUrl: "./login-page.component.html",
  styleUrls: ["./login-page.component.scss"],
})
export class LoginPageComponent implements OnInit, OnDestroy {
  loginForm: UntypedFormGroup;
  errorMessage: any;
  submitOp = false;
  appOwner: any;
  businessKey: boolean = true;
  forgotBusinessKey: boolean = false;
  forgotBusinessKeyMailSent: boolean = false;
  isMultenantDeployment = deploymentTarget.isMultitenant;
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCloseButton: true,
  });

  loanbookAppOwnerKey: string = "la43f567";
  appOwnerKey: string = "";

  businessLoader: boolean;
  businessErrMsg: string = "";
  businessPublicKey: string;
  businessEmail: string = "";
  unsubscriber$ = new Subject<void>();
  currentTheme: ColorThemeInterface;

  enterOTP: boolean;
  focusOTPInput = 1;
  otp: string;

  userId: string;
  userType: any;
  twoFactorResendTimer: number;
  otpRetryTimer: any;
  showOtpRetry: boolean;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService
  ) {}

  ngOnInit() {
    this.loadTheme();
    let domainKey = this.getSubdomain();

    this.appOwnerKey = this.getSubdomain();

    if (domainKey === "") this.forgotBusinessKey = true;

    this.route.paramMap.subscribe((params: ParamMap) => {
      this.appOwnerKey =
        this.appOwnerKey === ""
          ? (this.appOwnerKey = params.get("key"))
          : this.appOwnerKey;
      this.appOwnerKey = this.appOwnerKey === "null" ? "" : this.appOwnerKey;
      if (this.appOwnerKey !== null && this.appOwnerKey !== "null") {
        sessionStorage.setItem("appOwnerPublicKey", this.appOwnerKey);
        this.getAppOwnerDetails();
      }
    });
    this.getAppOwnerDetails();

    this.loginFormInit();
  }

  public loginFormInit() {
    this.loginForm = new UntypedFormGroup({
      EmailAddress: new UntypedFormControl("", [
        Validators.required,
        Validators.email,
      ]),
      Password: new UntypedFormControl("", [Validators.required]),
      Initiator: new UntypedFormControl("Staff", [Validators.required]),
    });
  }

  public loginUser() {
    this.loginForm.addControl(
      "AppOwnerKey",
      new UntypedFormControl(this.appOwner.appOwnerKey, Validators.required)
    );
    const val = this.loginForm.value;
    this.errorMessage = null;
    this.submitOp = true;
    this.authService.userLogin(val).subscribe(
      (res) => {
        const auth = res.headers.get("Set-Auth");
        if (auth) {
          this.configService.userJustLoggedIn$.next(true);
          if (this.authService.previousUrl && !this.authService.loggedOut) {
            this.authService.navigateToPreviousUrl = true;
          }

          this.getCurrencySymbol();
          this.router.navigate(["/modules"]);
        } else {
          this.userId = res.body?.userId;
          this.userType = res.body?.type;
          this.submitOp = false;
          this.requestOtp();
        }
      },
      (err) => {
        this.submitOp = false;
        this.errorMessage =
          err.error ||
          err.error.message ||
          err.statusText ||
          err ||
          err.message;
      }
    );
  }

  requestOtp(): void {
    this.enterOTP = true;
    this.showOtpRetry = false;
    const model = {
      userId: this.userId,
      option: "sms",
    };
    this.authService
      .requestLoginOTP(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(() => {
        setTimeout(() => {
          this.showOtpRetry = true;
          clearInterval(this.otpRetryTimer);

          this.twoFactorResendTimer = OTP_RETRY_TIMER;

          this.otpRetryTimer = setInterval(() => {
            this.twoFactorResendTimer--;
          }, 1000);

          setTimeout(() => {
            clearInterval(this.otpRetryTimer);
          }, OTP_RETRY_TIMER_IN_MILLSECS);
        }, 5000);
      });
  }

  submitOtp(): void {
    this.errorMessage = null;
    this.submitOp = true;
    const model = {
      otpCode: this.otp,
      userId: this.userId,
      option: "sms",
    };

    this.authService
      .confirmOTPActivation(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.authService.setToken(res, this.userType);
          this.router.navigate(["/modules"]);
        },
        (err: any) => {
          this.submitOp = false;
          this.errorMessage = err.error?.message;
        }
      );
  }

  getCurrencySymbol() {
    this.configService.getCurrencySymbol()
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe();
  }

  getAppOwnerDetails() {
    this.appOwner = null;
    this.businessErrMsg = "";
    if (
      this.appOwnerKey !== "" &&
      this.appOwnerKey !== null &&
      this.appOwnerKey !== "null"
    ) {
      this.businessLoader = true;
      this.authService
        .getAppOwnerByAliasOrPublicKey(this.appOwnerKey)
        .subscribe(
          (res) => {
            this.businessLoader = false;
            this.appOwner = res.body;
            sessionStorage.setItem("appOwnerKey", this.appOwner.appOwnerKey);
          },
          (err) => {
            this.businessErrMsg =
              err.error.Message ||
              err.error.message ||
              err.statusText ||
              err ||
              err.message ||
              err.error ||
              err.Message;
            this.businessLoader = false;
          }
        );
    } else {
      this.businessErrMsg = "Business alias not supplied.";
      this.businessLoader = false;
    }
  }

  businessKeySwitch() {
    this.businessKey = !this.businessKey;
    this.forgotBusinessKey = !this.forgotBusinessKey;
  }

  loadBusiness() {
    this.businessLoader = true;
    this.appOwner = null;
    this.businessErrMsg = "";
    if (
      this.appOwnerKey === "" ||
      this.appOwnerKey === null ||
      this.appOwnerKey === "www"
    ) {
      this.businessLoader = false;
      this.businessErrMsg =
        "Business alias not supplied. Please enter key below to proceed.";
    } else {
      this.authService
        .getAppOwnerByAliasOrPublicKey(this.appOwnerKey)
        .subscribe(
          (res) => {
            this.businessLoader = false;
            //  this.appOwner = res.body.data;
            this.appOwner = res.body;
            sessionStorage.setItem("appOwnerKey", this.appOwner.appOwnerKey);
            // sessionStorage.setItem('appOwnerPublicKey', this.appOwnerKey);
            sessionStorage.setItem(
              "appOwnerPublicKey",
              this.appOwner.publicKey
            );
          },
          (err) => {
            this.businessErrMsg =
              err.error.Message ||
              err.error.message ||
              err.statusText ||
              err ||
              err.message ||
              err.error;
            this.businessLoader = false;
            //Swal.fire('Error', this.businessErrMsg, 'error');
          }
        );
    }
  }

  getBusinessKeyInMail() {
    this.businessErrMsg = "";
    this.submitOp = true;

    const data = {
      Email: this.businessEmail,
    };

    this.authService.getBusinessKeyByMail(data).subscribe(
      (res) => {
        this.submitOp = false;
        //   this.toast.fire('Mail sent', res.message, 'success');

        this.forgotBusinessKeyMailSent = true;
        this.businessKeySwitch();
        this.businessEmail = "";
      },
      (err) => {
        this.submitOp = false;
        this.businessErrMsg = err.error.message;
      }
    );
  }

  getSubdomain() {
    if (environment.domainSegment === 'vercel') {
      return environment.businessAlias;
    }

    let host = window.location.host;
    let splitt = host.split(".");
    let subdomain = splitt[0];
    if (
      subdomain.includes("localhost") ||
      subdomain == "dev" ||
      subdomain == "test" ||
      subdomain == "www"
    ) {
      // return null;
      return "";
    } else {
      return subdomain;
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }



  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
