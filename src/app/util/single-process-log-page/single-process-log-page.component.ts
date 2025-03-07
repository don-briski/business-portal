import { Component, OnDestroy, OnInit } from "@angular/core";
import { ConfigurationService } from "src/app/service/configuration.service";
import { saveAs } from "file-saver";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { AuthService } from "src/app/service/auth.service";

@Component({
  selector: "lnd-single-process-log-page",
  templateUrl: "./single-process-log-page.component.html",
  styleUrls: ["./single-process-log-page.component.scss"],
})
export class SingleProcessLogPageComponent implements OnInit, OnDestroy {
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  requestLoader: boolean;

  processLogCode: any;
  openedLogResult: any;
  appOwnerKey: string;
  appOwner = null;
  businessErrMsg: string;
  businessLoader: boolean;

  constructor(
    private configService: ConfigurationService,
    private colorThemeService: ColorThemeService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.appOwnerKey = this.getSubdomain();
    this.getAppOwnerDetails();

    this.route.paramMap
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((params: ParamMap) => {
        this.processLogCode = params.get("log-code");
      });
  }

  ngOnInit(): void {
    this.loadTheme();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

  getProcessLogByCode(code: string): void {
    this.requestLoader = true;
    this.configService
      .spoolBulkProcessLogById(code)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.openedLogResult = res?.body;
          this.requestLoader = false;
        },
        (err) => {
          this.requestLoader = false;
        }
      );
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  downloadFile(url: string): void {
    saveAs(url, "file.csv");
  }

  protected getSubdomain() {
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

  protected getAppOwnerDetails() {
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
            this.getProcessLogByCode(this.processLogCode);
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
}
