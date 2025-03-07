import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { tap } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import {
  GetLoanInterestIncomeReqParams,
  GetInterestPeriodRes,
  GetTotalInterestIncomeForPeriodReqParams,
  GetTotalInvestmentInterestExpenseForPeriodReqParams,
  LastPostedInterestIncomeDate,
  LastPostedInterestInvestmentInterestExpenseDate,
  LedgerTransaction,
  PostInvestmentInterestExpenseQueryParams,
  TotalInterestIncomeForPeriod,
  TotalInvestmentInterestExpenseForPeriod,
  LastPostedPlacementInterestIncomeDate,
  PostLoansInterestIncomeDto,
  PostLoansInterestIncomeQueryParams,
  GroupedTransaction,
} from "../modules/finance/types/ledger-transactions";
import { GenericSpoolResponsePayload } from "../modules/shared/shared.types";

@Injectable({
  providedIn: "root",
})
export class LedgerTransactionService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public authService: AuthService,
    public tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  public getLedgerTransactions(model): Observable<any> {
    return this.http
      .post(this.baseUrl + `LedgerTransactions/GetLedgerTransactions`, model, {
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
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  getGroupedTransactions(model): Observable<any> {
    return this.http
      .get<GenericSpoolResponsePayload<GroupedTransaction>>(
        this.baseUrl + `LedgerTransactions/GroupedTransactions`,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          params: new HttpParams({ fromObject: model }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchLedgerTransactions(groupedTransactionId: number) {
    return this.http
      .get<{ data: LedgerTransaction[] }>(
        this.baseUrl + `LedgerTransactions/${groupedTransactionId}`,
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public postTransactions(model): Observable<any> {
    return this.http
      .post(this.baseUrl + `LedgerTransactions/postTransactions`, model, {
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
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

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

  getLastPostedInterestIncomeDate() {
    return this.http
      .get<LastPostedInterestIncomeDate>(
        `${this.baseUrl}EndOfPeriod/lastPostedInterestIncomeDate`,
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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
  getLastPlacementPostedInterestIncomeDate() {
    return this.http
      .get<LastPostedPlacementInterestIncomeDate>(
        `${this.baseUrl}EndOfPeriod/lastPlacementInterestIncomePostedDate`,
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  getLastPostedInterestInvestmentInterestExpenseDate() {
    return this.http
      .get<LastPostedInterestInvestmentInterestExpenseDate>(
        `${this.baseUrl}EndOfPeriod/lastPostedInvestmentInterestExpenseDate`,
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  getTotalInterestIncomeForPeriod(
    params: GetTotalInterestIncomeForPeriodReqParams
  ) {
    const paramsObj = {
      startDate: params.startDate,
      endDate: params.endDate,
      type: params.type,
    };

    return this.http
      .get<TotalInterestIncomeForPeriod[]>(
        `${this.baseUrl}EndOfPeriod/totalInterestIncomeForPeriod`,
        {
          params: new HttpParams({ fromObject: paramsObj }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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
  getPlacementInterestIncomeForPeriod(
    params: GetTotalInterestIncomeForPeriodReqParams
  ) {
    const paramsObj = {
      startDate: params.startDate,
      endDate: params.endDate,
      type: params.type,
    };

    return this.http
      .get<TotalInterestIncomeForPeriod[]>(
        `${this.baseUrl}EndOfPeriod/totalShortTermPlacementInterestForPeriod`,
        {
          params: new HttpParams({ fromObject: paramsObj }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  getTotalInvestmentInterestExpenseForPeriod(
    params: GetTotalInvestmentInterestExpenseForPeriodReqParams
  ) {
    const paramsObj = {
      startDate: String(params.startDate),
      endDate: String(params.endDate),
    };

    return this.http
      .get<TotalInvestmentInterestExpenseForPeriod[]>(
        `${this.baseUrl}EndOfPeriod/totalInvestmentInterestExpenseForPeriod`,
        {
          params: new HttpParams({ fromObject: paramsObj }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  postLoansInterestIncome(data: PostLoansInterestIncomeDto) {
    return this.http
      .post(`${this.baseUrl}EndOfPeriod/postLoansInterestIncome`, data, {
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
  postPlacementInterestIncome(data: PostLoansInterestIncomeQueryParams) {
    const paramsObj = {
      data: data.data,
    };
    if (data.fromDate) paramsObj["fromDate"] = data.fromDate;
    if (data.toDate) paramsObj["toDate"] = data.toDate;
    if (data.stpShortTermInterestAccruedResponses)
      paramsObj["stpShortTermInterestAccruedResponses"] =
        data.stpShortTermInterestAccruedResponses;

    return this.http
      .post(
        `${this.baseUrl}EndOfPeriod/postPlacementInterestIncome`,
        paramsObj,
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  postInvestmentInterestExpense(
    data: PostInvestmentInterestExpenseQueryParams
  ) {
    const paramsObj = {
      data: data.data,
    };
    if (data.fromDate) paramsObj["fromDate"] = data.fromDate;
    if (data.toDate) paramsObj["toDate"] = data.toDate;
    if (data.investmentInterestExpenseModel)
      paramsObj["investmentInterestExpenseModel"] =
        data.investmentInterestExpenseModel;

    return this.http
      .post(
        `${this.baseUrl}EndOfPeriod/postInvestmentInterestExpense`,
        paramsObj,
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  getLoanInterestIncomeBreakdown(params: GetLoanInterestIncomeReqParams) {
    return this.http
      .get<{ data: GetInterestPeriodRes }>(
        `${this.baseUrl}EndOfPeriod/loansinterestincome/breakdown`,
        {
          params: new HttpParams({ fromObject: params }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  downloadLoanInterestIncomeBreakdown(
    params: GetTotalInterestIncomeForPeriodReqParams
  ) {
    const paramsObj = {
      startDate: params.startDate,
      endDate: params.endDate,
      type: params.type,
    };
    return this.http
      .get<any>(
        `${this.baseUrl}EndOfPeriod/loansinterestincome/breakdown/download`,
        {
          params: new HttpParams({ fromObject: paramsObj }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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
  getPlacementInterestIncomeBreakdown(params: GetLoanInterestIncomeReqParams) {
    return this.http
      .get<{ data: GetInterestPeriodRes }>(
        `${this.baseUrl}EndOfPeriod/placementinterestincome/breakdown`,
        {
          params: new HttpParams({ fromObject: params }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  downloadLPlacementInterestIncomeBreakdown(
    params: GetTotalInterestIncomeForPeriodReqParams
  ) {
    const paramsObj = {
      startDate: params.startDate,
      endDate: params.endDate,
      type: params.type,
    };
    return this.http
      .get<any>(
        `${this.baseUrl}EndOfPeriod/placementinterestincome/breakdown/download`,
        {
          params: new HttpParams({ fromObject: paramsObj }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  getInvestmentInterestExpenseBreakdown(
    params: GetLoanInterestIncomeReqParams
  ) {
    return this.http
      .get<{ data: GetInterestPeriodRes }>(
        `${this.baseUrl}EndOfPeriod/investmentinterestexpense/breakdown`,
        {
          params: new HttpParams({ fromObject: params }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  downloadInvestmentInterestExpenseBreakdown(
    params: GetTotalInterestIncomeForPeriodReqParams
  ) {
    const paramsObj = {
      startDate: params.startDate,
      endDate: params.endDate,
      type: params.type,
    };
    return this.http
      .get<any>(
        `${this.baseUrl}EndOfPeriod/investmentinterestexpense/breakdown/download`,
        {
          params: new HttpParams({ fromObject: paramsObj }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  getLoanInterestIncomeBacklogs(params: any) {
    return this.http
      .get<{ data: any }>(
        `${this.baseUrl}EndOfPeriod/backlogs/loansInterestIncome`,
        {
          params: new HttpParams({ fromObject: params }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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
  getPlacementInterestIncomeBacklogs(params: any) {
    return this.http
      .get<any>(`${this.baseUrl}EndOfPeriod/backlogs/placementInterestIncome`, {
        params: new HttpParams({ fromObject: params }),
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
  getInterestExpenseBacklogs(params: any) {
    return this.http
      .get<any>(
        `${this.baseUrl}EndOfPeriod/backlogs/investmentInterestExpense`,
        {
          params: new HttpParams({ fromObject: params }),
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  getLoanBacklogsTotalAmount() {
    return this.http
      .get<any>(`${this.baseUrl}EndOfPeriod/totalBacklogInterestIncome`, {
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
  getPlacementBacklogsTotalAmount() {
    return this.http
      .get<any>(
        `${this.baseUrl}EndOfPeriod/totalBacklogShortTermPlacementInterest`,
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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
  getInvestmentBacklogsTotalAmount() {
    return this.http
      .get<any>(
        `${this.baseUrl}EndOfPeriod/totalBacklogInvestmentInterestExpense`,
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  rejectTransaction(groupTransactionIds: number[]) {
    return this.http
      .post(
        `${this.baseUrl}LedgerTransactions/reject `,
        { groupTransactionIds },
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  public getToken() {
    return JSON.parse(sessionStorage.token);
  }
}
