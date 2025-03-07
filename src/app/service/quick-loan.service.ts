import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from "src/environments/environment";
import { TokenRefreshErrorHandler } from './TokenRefreshErrorHandler';
import { AuthService } from './auth.service';
import { EncryptService } from './encrypt.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QuickLoanService {

  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;
  successfulLoanId$ = new BehaviorSubject<{id:number,fromLoans?:boolean}>({id:null,fromLoans:false});

  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private authService: AuthService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private encrypt: EncryptService
  ) { }

  public getQuickLoanConfig(): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `v1/quickloanproduct/getqlpconfig`,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
        }
      )
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public updateQuickLoanConfig(data: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl +
          `v1/quickloanproduct/upsertqlpconfig`,
          data,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
        }
      )
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public getQLPApplicants(payload): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `v1/quickloanproduct/customers`,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
          params: new HttpParams({fromObject:payload})
        }
      )
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
          }
        )
      );
  }

  public getQLPLoans(payload): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `v1/quickloanproduct/loans`,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
          params: new HttpParams({fromObject:payload})
        }
      )
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
          }
        )
      );
  }

  public getQLPCallbackLogs(payload): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `v1/quickloanproduct/callbacks`,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
          params: new HttpParams({fromObject:payload})
        }
      )
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
          }
        )
      );
  }

  public setQLPCallbackNote(payload): Observable<any> {
    return this.http
      .post(
        this.baseUrl +
          `v1/quickloanproduct/callbacknote`,payload,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
        }
      )
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
          }
        )
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
