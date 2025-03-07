import { HttpHeaders, HttpClient, HttpParams } from "@angular/common/http";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";

import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import {
  GetFinanceReportUrlSegment,
  GetReportReqBody,
  GetReportResBody,
} from "../finance-report-page/types";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class FinanceReportService {
  private _baseUrl = environment.apiUrl;
  private _decodedToken;
  private _userToken;

  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

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

  public _getToken() {
    return JSON.parse(sessionStorage.token);
  }

  public setToken(headers) {
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

  getFinanceReport(
    data: GetReportReqBody,
    urlSegment: GetFinanceReportUrlSegment
  ) {
    let branchIds = "";

    if (data.BranchIds?.length) {
      data.BranchIds.forEach((branchId, index) => {
        branchIds += `BranchIds=${branchId}`;
        if (data.BranchIds.length - 1 !== index) {
          branchIds += "&";
        }
      });
    }

    let assetRegisterReportFilters = "";
    if (data.assetRegisterReportFilter?.length) {
      data.assetRegisterReportFilter.forEach((filter, index) => {
        assetRegisterReportFilters += `assetRegisterReportFilter=${filter}`;
        if (data.assetRegisterReportFilter.length - 1 !== index) {
          assetRegisterReportFilters += "&";
        }
      });
    }

    const params = new HttpParams()
      .set(`${data?.asOfDate ? "asOfDate" : "endDate"}`, data.EndDate || "")
      .set("paginated", String(data.paginated || String("false")))
      .set("pageNumber", String(data.PageNumber || ""))
      .set("filter", data.filter || "")
      .set("pageSize", String(data.PageSize || ""))
      .set("status", data.Status || "")
      .set("tenantId", data.tenantId || "");

    return this.http
      .get<GetReportResBody>(
        this._baseUrl +
          `FinanceReport/${urlSegment}?${
            data.StartDate ? "startDate=" + data.StartDate : ""
          }${branchIds === "" ? "" : "&" + branchIds}${
            assetRegisterReportFilters === ""
              ? ""
              : "&" + assetRegisterReportFilters
          }`,
        {
          params,
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

  exportFinanceReport(
    data: GetReportReqBody,
    urlSegment: GetFinanceReportUrlSegment
  ) {
    let branchIds = "";

    if (data.BranchIds?.length) {
      data.BranchIds.forEach((branchId, index) => {
        branchIds += `BranchIds=${branchId}`;
        if (data.BranchIds.length - 1 !== index) {
          branchIds += "&";
        }
      });
    }

    const params = new HttpParams()
      .set(`${data?.asOfDate ? "asOfDate" : "endDate"}`, data.EndDate || "")
      .set("paginated", String(data.paginated || String("false")))
      .set("pageNumber", String(data.PageNumber || ""))
      .set("filter", data.filter || "")
      .set("pageSize", String(data.PageSize || ""));

    let req = this.http.get<Blob>(
      this._baseUrl +
        `FinanceReport/${urlSegment}/export?${
          data.StartDate ? "startDate=" + data.StartDate : ""
        }${branchIds === "" ? "" : "&" + branchIds}`,
      {
        params,
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
        responseType: "blob" as "json",
      }
    );

    return req.pipe(
      tap(
        (res) => {
          this.setToken(res.headers);
          return res;
        },
        (error) => this.tokenRefreshError.handleError(error)
      )
    );
  }

  getPostingAccountTransactions(data: any): Observable<any> {
    const params = new HttpParams()
      .set("endDate", data.EndDate || "")
      .set("startDate", data.StartDate || "")
      .set("paginated", String(data.Paginated || String("false")))
      .set("pageNumber", String(data.PageNumber || ""))
      .set("pageSize", String(data.PageSize || ""))
      .set("filter", String(data.accountId));

    return this.http
      .get(this._baseUrl + "ledgerTransactions/getPostedLedgerTransactions", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
          .set(
            "Authorization",
            sessionStorage.token != null
              ? "Bearer " + JSON.parse(sessionStorage.token)
              : ""
          ),
        params,
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }
}
