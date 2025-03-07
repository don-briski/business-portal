import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { environment } from "src/environments/environment";
import { tap } from "rxjs/operators";
import { JwtHelperService } from "@auth0/angular-jwt";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { getToken } from "../util/helpers/auth.helpers";
import { PillFilters } from "../model/CustomDropdown";
import { Clipboard } from "@angular/cdk/clipboard";
import { CrmRedirect } from "../modules/shared/shared.types";
import { AllModulesEnum } from "../util/models/all-modules.enum";
import { Store } from "@ngrx/store";
import { AppWideState } from "../store/models";


export type AuthData = {
  nameid: string;
  actort: string;
  email: string;
}

@Injectable({
  providedIn: "root",
})
export class SharedService {

  private baseUrl = environment.apiUrl;
  decodedToken: any;
  userToken: any;
  printStatus$ = new BehaviorSubject<string>("Print");
  selectedFilters$ = new Subject<PillFilters>();
  setFilterActionTriggered$ = new BehaviorSubject(false);

  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private clipboard: Clipboard,
  ) {}

  public setToken(headers) {
    try {
      const authToken = headers.get("Set-Auth");
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
      }
      return true;
    } catch (e) {
      return e;
    }
  }

  getBase64Url(imageUrl: string): Observable<any> {
    let params = new HttpParams().set("url", imageUrl);

    return this.http
      .get(this.baseUrl + "file/base64", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null
              ? "Bearer " + getToken(sessionStorage.token)
              : ""
          ),
        observe: "response",
        params,
      })
      .pipe(
        tap(
          (res) => {
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  copyToClipboard(text: string): boolean {
    return this.clipboard.copy(text);
  }

  genRandomNumber(
    data: { min: number; max: number; prefix: string } = {
      min: 10000,
      max: 9999999999,
      prefix: "",
    }
  ) {
    return `${data.prefix ? data.prefix + "_" : data.prefix}${Math.floor(
      Math.random() * (data.max - data.min) + data.min
    )}`;
  }

  setModuleInSession(module:AllModulesEnum){
    sessionStorage.setItem("module", module);
  }

  private authData: AuthData | null = null;
  setAuthData(auth: AuthData) {
    this.authData = auth;
  }

  getAuthData() {
    return this.authData;
  }

  clearAuthData() {
    this.authData = null;
  }
}
