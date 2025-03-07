import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, combineLatest, forkJoin, Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { AccountType } from "../modules/finance/chart-of-account/model/account-type.enum";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";

@Injectable({
  providedIn: "root",
})
export class ChartOfAccountService {
  private baseUrl = environment.apiUrl;
  private decodedToken: any;
  private userToken: any;
  public cachedAccounts$ = new BehaviorSubject<any>(null);
  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  public getAllAccounts(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}accounts/accounts`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          let accounts = res.body;

          accounts.forEach((account) => {
            account.accountType = "";
            if (account?.isHeader) {
              account.accountType = AccountType.Header;
            } else if (account?.isPostingAccount) {
              account.accountType = AccountType.PostingAccounts;
            } else {
              account.accountType = AccountType.SubHeader;
            }
          });
          this.setCacheAccounts(accounts);
          return accounts;
        })
      );
  }

  public getAccountChildReferences(parentAccountId: any): Observable<any> {
    let queryParameters = new HttpParams();
    if (parentAccountId) {
      queryParameters = queryParameters.set("parentAccountId", parentAccountId);
    }
    return this.http
      .get<any[]>(`${this.baseUrl}accounts/child-references`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        params: queryParameters,
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public setCacheAccounts(accounts: any[]): void {
    this.cachedAccounts$.next(accounts);
  }

  public getGroupHeaders(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}accounts/group-headers`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public configureGroupHeader(data: any): Observable<any[]> {
    return this.http
      .put(`${this.baseUrl}accounts/configure/groupAccount`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public createAccount(data: any): Observable<any[]> {
    return this.http
      .post(`${this.baseUrl}accounts/account`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }
  public updateAccount(data: any): Observable<any[]> {
    return this.http
      .put(`${this.baseUrl}accounts/account`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public getAccounts(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}accounts/accounts`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  getCOATemplate(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}accounts/import/template`, {
        responseType: "blob" as "json",
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  importCOA(data): Observable<any[]> {
    return this.http
      .post(`${this.baseUrl}accounts/import`, data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        }),
        map((res: any) => {
          return res.body;
        })
      );
  }

  private setToken(headers) {
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

  private getToken() {
    return JSON.parse(sessionStorage.token);
  }
}
