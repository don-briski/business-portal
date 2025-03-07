import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { EncryptService } from "src/app/service/encrypt.service";

@Injectable({
  providedIn: "root",
})
export class CashAdvanceService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;

  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public tokenRefreshError: TokenRefreshErrorHandler,
    public encrypt: EncryptService
  ) {}

  public spoolAllCashAdvances(model: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "cashAdvance", {
        params: model,
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
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public raiseCashAdvance(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "cashAdvance/raise", model, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }
  public updateCashAdvance(model: any, id: any): Observable<any> {
    return this.http
      .put(`${this.baseUrl}cashAdvance/update/${id}`, model, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public reviewCashAdvance(model: any): Observable<any> {
    return this.http
      .put(this.baseUrl + "cashAdvance/review", model, {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set(
            "x-lenda-transaction-pin",
            this.encrypt.encrypt(`${model.transactionPin}`)
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }
  public reconcileCashAdvance(id: any): Observable<any> {
    return this.http
      .put(this.baseUrl + `cashAdvance/reconcile/${id}`, null, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public logReconciliationCashAdvance(model: any): Observable<any> {
    return this.http
      .put(this.baseUrl + `cashAdvance/reconciliation/log`, model, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public getCashAdvanceById(id: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "cashAdvance/" + id, {
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
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
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
