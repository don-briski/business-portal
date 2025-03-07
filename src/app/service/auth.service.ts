import { Injectable, Output, EventEmitter } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from "@angular/common/http";
import { Observable, Subscription } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
// import {MatDialogModule} from '@angular/material/dialog';
import { Base64 } from "js-base64";
import { EncryptService } from "src/app/service/encrypt.service";
import { ColorThemeService } from "./color-theme.service";
import { ColorThemeInterface } from "../model/color-theme.interface";
import { UserIdleService } from "angular-user-idle";
import { MatDialog } from "@angular/material/dialog";
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;
  public subscriptionActive = false;
  timerSub: Subscription;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    public dialog: MatDialog,
    private encrypt: EncryptService,
    private colorThemeService: ColorThemeService,
    private userIdleService: UserIdleService
  ) {}

  httpOptions = {
    headers: new HttpHeaders({ "Content-Type": "application/json" }),
  };
  private _previousUrl: string;
  navigateToPreviousUrl = false;
  loggedOut = false;

  set previousUrl(url: string) {
    if (this._previousUrl && url !== "_REDIRECTED_") return;
    this._previousUrl = url;
  }

  get previousUrl() {
    return this._previousUrl;
  }

  public loggedIn(token?: string) {
    // return this.jwtHelper.isTokenExpired('token');
    // const token: string = this.jwtHelperService.tokenGetter();

    if (!token) {
      return false;
    }

    const tokenExpired: boolean = this.jwtHelperService.isTokenExpired(token);

    return !tokenExpired;
  }

  /**
   * user login
   */

  public userLogin(data: any): Observable<any> {
    localStorage.removeItem("userId");
    // The problem was that the client was sendinga a preflight request which is
    // what is being read. To resolve this, we have to abandon the use of "application/json" content type.

    data["Password"] = this.encrypt.encrypt(data["Password"]);
    //const body = new HttpParams({ fromObject: data });
    return this.http
      .post(this.baseUrl + "auth/login", data, {
        headers: new HttpHeaders().set("Content-Type", "application/json"),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            localStorage.setItem("userId", res?.userId);
            this.setToken(res);
          },
          (error) => error
        )
      );
  }

  public logout(model: any): Observable<any> {
    this.timerSub?.unsubscribe();
    this.userIdleService.stopWatching();
    return this.http
      .post(this.baseUrl + "auth/logout", model, {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          //   Authorization: "Bearer " + JSON.parse(sessionStorage.token),
        }),
      })
      .pipe(tap(() => {
        sessionStorage.removeItem('encodedUser');
        this.loggedOut = true;
      }));
  }

  public decodeToken() {
    const token = sessionStorage.getItem("token");
    return this.jwtHelperService.decodeToken(token);
  }

  public setToken(res: any, typeStr?: string) {
    const authToken = res.headers.get("Set-Auth");
    if (authToken) {
      sessionStorage.setItem("token", JSON.stringify(authToken));
      this.decodedToken = this.jwtHelperService.decodeToken(authToken);
      sessionStorage.setItem(
        "auth",
        JSON.stringify({
          nameid: this.decodedToken ? this.decodedToken.nameid : null,
          actort: this.decodedToken ? this.decodedToken.actort : null,
          email: this.decodedToken ? this.decodedToken.email : null,
        })
      );
      this.userToken = authToken;
      // Set person type
      const type = typeStr
        ? Base64.decode(typeStr)
        : Base64.decode(res.body.type);
      const role: any[] = type.split(":");
      sessionStorage.setItem("type", typeStr ? typeStr : res.body.type);
      sessionStorage.setItem("role", role[0]);
      return true;
    } else {
      return false;
    }
  }

  public forgotPassword(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "auth/forgotpassword", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null
              ? "Bearer " + JSON.parse(sessionStorage.token)
              : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => res
          // error => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public getUserForPasswordReset(data: {
    Id: string;
    Code: string;
    Key: string;
  }): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "auth/user/" +
          data.Id +
          "/" +
          data.Code +
          "/" +
          data.Key,
        this.httpOptions
      )
      .pipe(
        tap(
          (res) => res
          // error => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public resetPassword(data: any): Observable<any> {
    var password = this.encrypt.encrypt(data["Password"]);
    data["Password"] = password;
    data["ConfirmPassword"] = password;
    return this.http
      .post(this.baseUrl + "auth/resetpassword", data, this.httpOptions)
      .pipe(
        tap(
          (res) => res
          // error => this.tokenRefreshError.handleError(error)
        )
      );
  }

  validatePassword(password: string) {
    password = this.encrypt.encrypt(password);
    return this.http.post(
      `${this.baseUrl}Auth/ValidatePasswordAccordingToRule`,
      {
        password,
      },
      { observe: "response" }
    );
  }

  public getVerificationInformation(data: {
    code: string;
    id: string;
    key: string;
  }): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "auth/verifyaccount/" +
          data.code +
          "/" +
          data.id +
          "/" +
          data.key,
        this.httpOptions
      )
      .pipe(
        tap(
          (res) => res,
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }
  public verifyUserEmail(code: string): Observable<any> {
    return this.http
      .get(this.baseUrl + "auth/confirmemail/" + code, this.httpOptions)
      .pipe(
        tap(
          (res) => res,
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public getAppOwnerDetails(key: string): Observable<any> {
    return this.http
      .get<any>(this.baseUrl + `register/${key}`, { observe: "response" })
      .pipe(
        tap(
          (res) => {
            const appOwnerCustomColors = res.body
              ?.appOwnerCustomColors as ColorThemeInterface;
            if (
              appOwnerCustomColors &&
              appOwnerCustomColors?.primaryColor !== "#fff" &&
              appOwnerCustomColors?.secondaryColor !== "#000"
            ) {
              this.setColorTheme(appOwnerCustomColors);
            }
            return res;
          },
          (error) => error
        )
      );
  }

  public getAppOwnerByAlias(key: string): Observable<any> {
    return this.http
      .get<any>(this.baseUrl + `auth/getappownerbyalias/${key}`, {
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            const appOwnerCustomColors = res.body
              ?.appOwnerCustomColors as ColorThemeInterface;
            if (
              appOwnerCustomColors &&
              appOwnerCustomColors?.primaryColor !== "#fff" &&
              appOwnerCustomColors?.secondaryColor !== "#000"
            ) {
              this.setColorTheme(appOwnerCustomColors);
            }
            return res;
          },
          (error) => error
        )
      );
  }

  public getAppOwnerByAliasOrPublicKey(key: string): Observable<any> {
    return this.http
      .get<any>(this.baseUrl + `auth/getappownerbyaliasorpublickey/${key}`, {
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            const appOwnerCustomColors = res.body
              ?.appOwnerCustomColors as ColorThemeInterface;
            if (
              appOwnerCustomColors &&
              appOwnerCustomColors?.primaryColor !== "#fff" &&
              appOwnerCustomColors?.secondaryColor !== "#000"
            ) {
              this.setColorTheme(appOwnerCustomColors);
            }
            return res;
          },
          (error) => error
        )
      );
  }

  public getBusinessKeyByMail(data: any): Observable<any> {
    return this.http
      .post<any>(this.baseUrl + "auth/getbusinessaccounts", data, {
        observe: "response",
      })
      .pipe(
        tap(
          (res) => res,
          (error) => error
        )
      );
  }

  public requestActivationOTP(model: any): Observable<any> {
    return this.http
      .put<any>(this.baseUrl + "auth/Request2FActivativationOtp", model, {
        observe: "response",
      })
      .pipe(
        tap(
          (res) => res,
          (error) => error
        )
      );
  }
  public confirmOTPActivation(model: any): Observable<any> {
    return this.http
      .put<any>(this.baseUrl + "auth/Confirm2FAActivateOtp", model, {
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            return res;
          },
          (error) => error
        )
      );
  }

  public requestLoginOTP(model: any): Observable<any> {
    return this.http
      .put<any>(this.baseUrl + "auth/Request2FAOtpAfterLogin", model, {
        observe: "response",
      })
      .pipe(
        tap(
          (res) => res,
          (error) => error
        )
      );
  }
  /*
  public getVerificationInformation(data: { code: string; id: string; }): Observable<any> {
    return this.http.get( this.baseUrl + 'auth/verifyaccount/' + data.code + '/' + data.id, this.httpOptions)
    .pipe(
      tap(
        res => JSON.parse(res)
        // error => this.tokenRefreshError.handleError(error)
      )
    );
  } */

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */

  protected setColorTheme(theme: ColorThemeInterface): void {
    this.colorThemeService.setTheme(theme);
  }
}
