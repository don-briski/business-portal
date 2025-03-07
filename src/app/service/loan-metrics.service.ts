import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from "@angular/common/http";
import { Observable, of } from "rxjs";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { retry, tap } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { EncryptService } from "src/app/service/encrypt.service";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import {
  GetLoanMetricsDataQueryParams,
  GetLoanMetricsDto,
  GetLoanStatusBreakdownResBody,
  GetMetricsResBody,
  GetUserLoanActivitiesResBody,
  LoanMetricsData,
} from "../modules/dashboard/loan-dashboard.types";
import { GetDataQueryParams } from "../modules/shared/shared.types";

@Injectable({
  providedIn: "root",
})
export class LoanMetricsService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public authService: AuthService,
    public tokenRefreshError: TokenRefreshErrorHandler,
    public encrypt: EncryptService
  ) {}

  public spoolPoolMetrics(branchid: any, userid: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "metrics/spoolpoolmetricsdatabybranch/" +
          branchid +
          "/" +
          userid,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
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

  public spoolTotalValueOfMyApplications(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfMyApplications",
        dateObject,
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

  public spoolTotalValueOfAllApplications(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfAllApplications",
        dateObject,
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

  public spoolTotalValueOfApplicationsInPool(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfApplicationsInPool",
        dateObject,
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

  public spoolValueOfUntreatedClaimedApplications(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolValueOfUntreatedClaimedApplications",
        dateObject,
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

  public spoolTotalValueOfApplicationsReviewed(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfApplicationsReviewed",
        dateObject,
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

  public spoolTotalValueOfApplicationsApproved(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfApplicationsApproved",
        dateObject,
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

  public spoolTotalValueOfApplicationsRejected(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfApplicationsRejected",
        dateObject,
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

  public spoolTotalValueOfApplicationsRedrafted(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfApplicationsRedrafted",
        dateObject,
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

  public spoolTotalValueOfPendingVerifications(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfPendingVerifications",
        dateObject,
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

  public spoolValueOfPendingChequeVerifications(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolValueOfPendingChequeVerifications",
        dateObject,
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

  public spoolValueOfPendingDirectDebitVerifications(
    dateObject
  ): Observable<any> {
    return this.http
      .post(
        this.baseUrl +
          "LoanMetrics/SpoolValueOfPendingDirectDebitVerifications",
        dateObject,
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

  public spoolTotalValueInDisbursementPool(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueInDisbursementPool",
        dateObject,
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

  public spoolTotalValueOfLoansApplications(
    query: GetLoanMetricsDataQueryParams
  ) {
    return this.http
      .get<{ data: LoanMetricsData }>(
        this.baseUrl + "LoanMetrics/TotalValueOfLoanApplications",
        {
          params: new HttpParams({ fromObject: query }),
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
  public spoolTotalValueOfPaidLoans(query: GetLoanMetricsDataQueryParams) {
    return this.http
      .get<{ data: LoanMetricsData }>(
        this.baseUrl + "LoanMetrics/TotalValueOfPaidLoans",
        {
          params: new HttpParams({ fromObject: query }),
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
  public spoolTotalValueOfLoansAwaitingConfirmation(
    query: GetLoanMetricsDataQueryParams
  ) {
    return this.http
      .get<{ data: LoanMetricsData }>(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfLoansAwaitingConfirmation",
        {
          params: new HttpParams({ fromObject: query }),
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

  spoolTotalValueOfBatchedLoans(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfBatchedLoans",
        dateObject,
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
  public spoolTotalAmountDisbursed(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalAmountDisbursed",
        dateObject,
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

  public spoolTotalValueOfActiveLoans(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfActiveLoans",
        dateObject,
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

  public spoolTotalValueOfSettledLoans(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfSettledLoans",
        dateObject,
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

  public spoolTotalValueOfDeactivatedLoans(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfDeactivatedLoans",
        dateObject,
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

  public spoolTotalValueOfTopupLoans(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfTopupLoans",
        dateObject,
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

  public spoolTotalValueOfRepaymentsRecorded(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfRepaymentsRecorded",
        dateObject,
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

  public spoolTotalValueOfRefundsRecorded(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfRefundsRecorded",
        dateObject,
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

  public spoolTotalValueOfReversalsRecorded(dateObject): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanMetrics/SpoolTotalValueOfReversalsRecorded",
        dateObject,
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

  public spoolApplicationCountMetrics(): Observable<any> {
    return this.http
      .get(this.baseUrl + "LoanMetrics/SpoolApplicationCountMetrics", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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

  fetchActiveLoanTypesCount(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(
        this.baseUrl + "LoanMetrics/active-loan-types/count",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params: new HttpParams({ fromObject: data }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchActiveLoansCount(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(
        this.baseUrl + "LoanMetrics/active-loans/count",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params: new HttpParams({ fromObject: data }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchAverageLoanSize(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(this.baseUrl + "LoanMetrics/loan-size/average", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchNewCustomersCount(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(this.baseUrl + "LoanMetrics/new-customers", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchLoanApplicationsCount(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(
        this.baseUrl + "LoanMetrics/loan-applications/count",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params: new HttpParams({ fromObject: data }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchDisbursements(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(this.baseUrl + "LoanMetrics/disbursement", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchAwaitingDisbursementConfirmation(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(this.baseUrl + "LoanMetrics/SpoolTotalValueOfLoansAwaitingConfirmation", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchApprovedLoans(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(this.baseUrl + "LoanMetrics/approved-loans", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchRejectedApplications(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(this.baseUrl + "LoanMetrics/rejected-loans", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchSettledLoansCount(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(this.baseUrl + "LoanMetrics/settled-loans", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchMostSoldProduct(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(this.baseUrl + "LoanMetrics/most-sold-product", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchLargestLoanTicket(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(
        this.baseUrl + "LoanMetrics/largest-loan-ticket",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params: new HttpParams({ fromObject: data }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchSmallestLoanTicket(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(
        this.baseUrl + "LoanMetrics/smallest-loan-ticket",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params: new HttpParams({ fromObject: data }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchMostSubscribedTenor(data: GetLoanMetricsDto) {
    return this.http
      .get<GetMetricsResBody>(
        this.baseUrl + "LoanMetrics/most-subscribed-tenor",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params: new HttpParams({ fromObject: data }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchUserLoanActivities(data: GetDataQueryParams) {
    return this.http
      .get<GetUserLoanActivitiesResBody>(
        this.baseUrl + "LoanMetrics/loan-activities",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params: new HttpParams({ fromObject: data }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  fetchLoanStatusBreakdown(data: GetLoanMetricsDto) {
    return this.http
      .get<GetLoanStatusBreakdownResBody>(
        this.baseUrl + "LoanMetrics/loan-status/breakdown",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params: new HttpParams({ fromObject: {startDate: data.start, endDate: data.end} }),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
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

  public getToken() {
    return JSON.parse(sessionStorage.token);
  }
}
