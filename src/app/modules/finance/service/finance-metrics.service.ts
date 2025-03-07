import { HttpHeaders, HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { DashboardMetricPayload } from "../types/dashboard-metric-payload.interface";

@Injectable({
  providedIn: "root",
})
export class FinanceMetricsService {
  private _baseUrl = environment.apiUrl;
  private _decodedToken;
  private _userToken;

  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  getTotalreceivablesByDate(payload: DashboardMetricPayload): Observable<any> {
    return this.http
      .post(this._baseUrl + "FinanceMetrics/GetReceivablesMetrics", payload, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getTotalPayablesByDate(payload: DashboardMetricPayload): Observable<any> {
    return this.http
      .post(this._baseUrl + "FinanceMetrics/getpayablesmetrics", payload, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getTotalExpensesByDate(payload: DashboardMetricPayload): Observable<any> {
    return this.http
      .post(this._baseUrl + "FinanceMetrics/gettopnexpenses", payload, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getIncomeAndExpenseMetricByDate(
    payload: DashboardMetricPayload
  ): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "FinanceMetrics/getincomeandexpensemetrics",
        payload,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
            ),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public getValueOfPettyCashTransactionsAwaitingApproval(
    dateObject
  ): Observable<any> {
    return this.http
      .post(
        this._baseUrl +
          "FinanceMetrics/GetValueOfPettyCashTransactionsAwaitingApproval",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfApprovedPettyCashTransactions(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl +
          "FinanceMetrics/GetValueOfApprovedPettyCashTransactions",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfJournalsAwaitingApproval(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "FinanceMetrics/GetValueOfJournalsAwaitingApproval",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfApprovedJournals(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "FinanceMetrics/GetValueOfApprovedJournals",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfExpensesAwaitingApproval(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "FinanceMetrics/GetValueOfExpensesAwaitingApproval",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfApprovedExpenses(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "FinanceMetrics/GetValueOfApprovedExpenses",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfIncomesAwaitingApproval(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "FinanceMetrics/GetValueOfIncomesAwaitingApproval",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfApprovedIncomes(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "FinanceMetrics/GetValueOfApprovedIncomes",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfPurchaseOrdersAwaitingApproval(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl +
          "FinanceMetrics/GetValueOfPurchaseOrdersAwaitingApproval",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getValueOfApprovedPurchaseOrders(dateObject): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "FinanceMetrics/GetValueOfApprovedPurchaseOrders",
        dateObject,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  private _getToken() {
    return JSON.parse(sessionStorage.token);
  }

  private setToken(headers) {
    try {
      const authToken = headers.get("Set-Auth");
      if (authToken) {
        sessionStorage.setItem("token", JSON.stringify(authToken));
        this._decodedToken = this.jwtHelperService.decodeToken(authToken);
        sessionStorage.setItem(
          "auth",
          JSON.stringify({
            nameid: this._decodedToken ? this._decodedToken.nameid : null,
            actort: this._decodedToken ? this._decodedToken.actort : null,
            email: this._decodedToken ? this._decodedToken.email : null,
          })
        );
        this._userToken = authToken;
      }
      return true;
    } catch (e) {}
  }
}
