import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { retry, tap } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { JwtHelperService } from "@auth0/angular-jwt";
import {
  GetReportReqBody,
  GetReportResBody,
  GetUserReportUrlSegment,
} from "../modules/configuration/report-page/types";
import { GetInvestmentReportReqBody, GetSTPInterestAccruedReportRes, GetSTPLiquidationReportRes, GetShortTermInvestmentReportRes } from "../modules/treasury/types/investment.type";

@Injectable({
  providedIn: "root",
})
export class ReportService {
  private baseUrl = environment.apiUrl;
  private decodedToken: any;
  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  // httpOptions = {
  //   headers: new HttpHeaders({
  //     Authorization: (sessionStorage.token != null) ? 'Bearer ' + JSON.parse(sessionStorage.token) : ''
  //   })
  // };

  getUserReport(data: GetReportReqBody, urlSegment: GetUserReportUrlSegment) {
    return this.http
      .post<GetReportResBody>(
        this.baseUrl + `usermanagementreport/${urlSegment}`,
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

  public fetchActivityLog(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/fetch_activity_log", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }
  public fetchCbnCustomerReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_cbn_customer_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }
  public fetchCbnReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_cbn_loan_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchDisbursement(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/fetch_disbursement", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchInvestmentReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/fetch_investment_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchInvestmentLiquidationReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/fetch_investment_liquidation_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchInvestmentInterestReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/fetch_investment_interest_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchInvestmentActivityReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "investmentreport/getactivitylogreport", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchShortTermInvestmentReport(data: GetInvestmentReportReqBody) {
    return this.http
      .post<GetShortTermInvestmentReportRes>(this.baseUrl + "Report/ShortTermPlacement", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
  }

  public fetchShortTermInvestmentMaturityReport(data: GetInvestmentReportReqBody) {
    return this.http
      .post<GetShortTermInvestmentReportRes>(this.baseUrl + "Report/ShortTermPlacement/Maturity", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
  }

  public fetchShortTermInvestmentLiquidationReport(data: GetInvestmentReportReqBody) {
    return this.http
      .post<GetSTPLiquidationReportRes>(this.baseUrl + "Report/ShortTermPlacement/Liquidation", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
  }

  fetchSTPInterestAccruedReport(data: GetInvestmentReportReqBody) {
    return this.http
      .post<GetSTPInterestAccruedReportRes>(this.baseUrl + "Report/ShortTermPlacement/InterestAccrued", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
  }

  public fetchInvestmentMaturityReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/fetch_investment_maturity_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchReductionReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/fetch_reduction", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchInterestIncomeReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_interestincome_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchLoanbookReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_loanbook_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchSettlementDiffReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/loan_settlement_differential_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchFeeReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_fee_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchPaymentsReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_payments_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchRepaymentsDueReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_repaymentsdue_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchTopUpEligibilityReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_topupeligibility_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchCustomerReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_customers_information_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }
  public fetchRedraftReport(data: any, viewType: string): Observable<any> {
    let endPoint = "";
    viewType === "Grouped"
      ? (endPoint = "report/spool_redraft_report")
      : (endPoint = "report/spool_redraft_report_breakdown");
    return this.http
      .post(this.baseUrl + endPoint, data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchCollectionsReport(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "report/spool_customer_repayment_report", data, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public downloadCreditReportTempFile(): Observable<HttpResponse<Blob>> {
    return this.http
      .get<Blob>(this.baseUrl + "report/download_cbn_templatefiles", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        responseType: "blob" as "json",
      })
      .pipe(retry(2));
  }

  public downloadCreditReportTempFile1(): Observable<HttpResponse<Blob>> {
    return this.http
      .get<Blob>(this.baseUrl + "report/download_cbn_templatefile1", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        responseType: "blob" as "json",
      })
      .pipe(retry(2));
  }

  public downloadCreditReportTempFile2(): Observable<HttpResponse<Blob>> {
    return this.http
      .get<Blob>(this.baseUrl + "report/download_cbn_templatefile2", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        responseType: "blob" as "json",
      })
      .pipe(retry(2));
  }

  public spoolQueuedReports(model: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "report/spool_queued_reports/" + model, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
