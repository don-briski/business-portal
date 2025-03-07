import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { retry, tap } from "rxjs/operators";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from "@angular/common/http";
import { JwtHelperService } from "@auth0/angular-jwt";
import { environment } from "src/environments/environment";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { EncryptService } from "./encrypt.service";
import { MergedInvestment } from "../modules/treasury/types/MergedInvestment";
import { SplitInvestment } from "../modules/treasury/types/SplitInvestment";
import {
  GetLiquidationReqsQueryParams,
  GetLiquidationReqsResBody,
  LiquidationReq,
  ReviewLiquidationReqBody,
} from "../modules/treasury/types/investment-liquidation-request";
import { Pagination } from "../modules/shared/shared.types";
import {
  CreateInvestmentReq,
  FetchInvestmentsPayload,
  GetInvestmentDetailResponse,
  GetInvestmentsResponse,
  Investment,
  SendInvestmentCertificateReq,
} from "../modules/treasury/types/investment.type";
import { GetInvestorsByFullNameReq, GetInvestorsByFullNameRes } from "../modules/treasury/types/Investor";
import { VerifyBankAccount } from "../modules/treasury/types/generics";

@Injectable({
  providedIn: "root",
})
export class InvestmentService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private encrypt: EncryptService
  ) {}

  httpOptionsFile = {
    headers: new HttpHeaders({
      Authorization: "Bearer " + JSON.parse(sessionStorage.token),
    }),
  };

  public fetchLiquidationDetailByDate(data: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "investment/fetch-liquidation-details-by-date",
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  // update-approval-status

  public updateApprovalStatus(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "investment/update-approval-status", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set(
            "x-lenda-transaction-pin",
            this.encrypt.encrypt(data?.transactionPin)
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

  // investment-dashboard
  public fetchInvestmentDashboardInfo(): Observable<any> {
    return this.http
      .get(this.baseUrl + "investment/investment-dashboard", {
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

  //merge investment
  public mergeInvestment(data: MergedInvestment): Observable<any> {
    data["transactionPin"] = this.encrypt.encrypt(data["transactionPin"]);
    return this.http
      .post(this.baseUrl + "investment/mergeinvestments", data, {
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

  public deactivateInvestment(data): Observable<any> {
    data["TransactionPin"] = this.encrypt.encrypt(data["TransactionPin"]);
    return this.http
      .post(this.baseUrl + "investment/deactivateInvestment", data, {
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

  //split investment
  public splitInvestment(data: SplitInvestment): Observable<any> {
    data["transactionPin"] = this.encrypt.encrypt(data["transactionPin"]);
    return this.http
      .post(this.baseUrl + "Investment/splitInvestment", data, {
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

  /**
   * @deprecated this method is deprecated use getInvestorsByFullName
   */
  public searchInvestors(searchParam: string): Observable<any> {
    return this.http
      .get(this.baseUrl + "investment/getallinvestors", {
        params: new HttpParams({ fromString: `searchParam=${searchParam}` }),
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

  // merge investment call
  public getInvestorsByFullName(payload:GetInvestorsByFullNameReq) {
    return this.http
      .get<GetInvestorsByFullNameRes>(this.baseUrl + "investment/investors", {
        params: new HttpParams({ fromObject: payload as any }),
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
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

  //get investors investments
  public getInvestorsInvestments(investorId: number): Observable<any> {
    return this.http
      .get(this.baseUrl + "investment/GetAllInvestorInvestments", {
        params: new HttpParams({
          fromString: `investorId=${investorId}&status=1`,
        }),
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

  public verifyInvestorEmailAddress(email: string): Observable<any> {
    return this.http
      .get(this.baseUrl + "investment/verify-investor-email/" + email, {
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

  public saveRollover(data: any): Observable<any> {
    const formData = new FormData();
    for (const property in data) {
      if (data.hasOwnProperty(property)) {
        if (data[property] != null) {
          formData.append(property, data[property]);
        }
      }
    }
    return this.http
      .post(this.baseUrl + "investment/save-rollover", formData, {
        headers: new HttpHeaders()
          // .set('Content-Type', 'application/json')
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

  public saveLiquidation(data: any): Observable<any> {
    const { TransactionPin, ...payload } = data;
    const encryptedPin = this.encrypt.encrypt(TransactionPin);

    return this.http
      .post(this.baseUrl + "investment/liquidation/requests/raise", payload, {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set("x-lenda-transaction-pin", `${encryptedPin}`),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public savePayout(data: any): Observable<any> {
    const transactionPin = this.encrypt.encrypt(data["TransactionPin"]);
    data["TransactionPin"] = "";
    return this.http
      .post(
        this.baseUrl + "investment/liquidation/payout/requests/raise",
        data,
        {
          headers: new HttpHeaders()
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set("x-lenda-transaction-pin", `${transactionPin}`),
          observe: "response",
        }
      )
      .pipe(
        tap(
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchActiveInvestmentType(): Observable<any> {
    return this.http
      .get(this.baseUrl + "investment/fetch-active-investment", {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchLiquidationLog(data: any) {
    const search = data.Search ? data.Search : "";
    // tslint:disable-next-line:max-line-length
    return this.http
      .get(
        this.baseUrl +
          "investment/fetch-liquidation-log?search=" +
          search +
          "&num=" +
          data.Num +
          "&skip=" +
          data.Skip,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  public fetchAllInvestments(data: any) {
    // tslint:disable-next-line:max-line-length
    return this.http
      .get(
        this.baseUrl +
          "investment/fetch-all-investments?search=" +
          data.Search +
          "&num=" +
          data.Num +
          "&skip=" +
          data.Skip,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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
  /**
   * @deprecated The method should not be used,use getInvestments instead
   */
  public fetchAllInvestmentsPaginated(data: any) {
    const params = new HttpParams({ fromObject: data });
    return this.http
      .get(this.baseUrl + "investment/fetch-all-investments-paginated", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
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
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchRunningInvestments(data: any) {
    const paramsObj = {};

    if (data.search) paramsObj["search"] = data.search;
    if (data.num) paramsObj["num"] = data.num;
    if (data.skip) paramsObj["skip"] = data.skip;

    // tslint:disable-next-line:max-line-length
    return this.http
      .get(this.baseUrl + "investment/fetch-running-investments", {
        params: new HttpParams({ fromObject: paramsObj }),
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchInvestments(data: FetchInvestmentsPayload) {
    return this.http
      .post(this.baseUrl + "Investment/fetchallinvestment", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
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

  public fetchRunningInvestmentsPaginated(data: any) {
    // tslint:disable-next-line:max-line-length
    return this.http
      .post<{ data: Pagination }>(
        this.baseUrl + "investment/fetch-running-investments-paginated",
        data,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  public fetchInvestmentLiquidationActivities(investmentId: number) {
    return this.http
      .get<Investment>(
        this.baseUrl + "Investment/investmentliquidation/activities",
        {
          params: new HttpParams({
            fromObject: { investmentId: String(investmentId) },
          }),
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  /**
   * @deprecated The method should not be used,use getInvestmentById instead
   */
  public fetchInvestmentById(id: number) {
    return this.http
      .get<Investment>(
        this.baseUrl + "Investment/investment/getInvestmentById",
        {
          params: new HttpParams({ fromObject: { investmentId: String(id) } }),
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  getInvestments(payload: FetchInvestmentsPayload) {
    return this.http
      .get<GetInvestmentsResponse>(this.baseUrl + "Investment/investments", {
        params: new HttpParams({ fromObject: payload }),
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getInvestmentById(id: number) {
    return this.http
      .get<GetInvestmentDetailResponse>(this.baseUrl + "Investment/" + id, {
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public fetchApprovedInvestments(data: any) {
    // tslint:disable-next-line:max-line-length
    return this.http
      .get(
        this.baseUrl +
          "investment/fetch-approved-investments?search=" +
          data.Search +
          "&num=" +
          data.Num +
          "&skip=" +
          data.Skip,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  /**
   * @deprecated The method should not be used,use sendInvCertificate instead
   */
  public sendInvestmentCertificate(investmentId: any) {
    return this.http
      .get(
        this.baseUrl +
          "investment/send-investment-certificate?investmentId=" +
          investmentId,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  sendInvCertificate(payload: SendInvestmentCertificateReq) {
    return this.http
      .post(this.baseUrl + "Investment/certificate", payload, {
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public fetchTerminatedInvestments(data: any) {
    // tslint:disable-next-line:max-line-length
    return this.http
      .get(
        this.baseUrl +
          "investment/fetch-terminated-investments?search=" +
          data.Search +
          "&num=" +
          data.Num +
          "&skip=" +
          data.Skip,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  public fetchTerminatedInvestmentsPaginated(data: any) {
    // tslint:disable-next-line:max-line-length
    return this.http
      .post(
        this.baseUrl + "investment/fetch-terminated-investments-paginated",
        data,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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
  public fetchAllInvestment(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "investment/fetchAllInvestment", data, {
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

  public fetchAllInvestmentPaginated(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "investment/fetchAllInvestment", data, {
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

  public getInvestmentCertificatePreview(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "investment/preview/certificate", data, {
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
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchInvestmentCertificateInfo(investorId: number) {
    return this.http
      .get(this.baseUrl + "investment/preview/certificate/" + investorId, {
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }
  public fetchCustomerPreviousInvestments(
    currentInvestmentId: number,
    investorId: number
  ) {
    // tslint:disable-next-line:max-line-length
    return this.http
      .get(
        this.baseUrl +
          "investment/fetch-customer-previous-investments/" +
          currentInvestmentId +
          "/" +
          investorId,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  /**
   * @deprecated this method is deprecated use verifyBankAccount instead
   */
  public verifyAccount(data: {
    bankSortCode: string;
    accountNumber: string;
    userId: string;
  }) {
    // tslint:disable-next-line:max-line-length
    return this.http
      .get(
        this.baseUrl +
          "investment/verify-bank-account?account=" +
          data.accountNumber +
          "&sortcode=" +
          data.bankSortCode +
          "&userid=" +
          data.userId,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  public verifyBankAccount(payload:VerifyBankAccount) {
    return this.http
      .get(this.baseUrl + "investment/verification/account", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
        params: new HttpParams({fromObject:payload})
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }



  public getInvestmentType(investmentTypeId: number): Observable<any> {
    return this.http
      .get(this.baseUrl + "investment/investmenttypes/" + investmentTypeId, {
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

  public addInvestmentType(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "investment/addinvestment-type", data, {
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
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  /**
   * @deprecated this method is deprecated use createInvestment
   */
  public saveInvestment(data: any): Observable<any> {
    const formData = new FormData();
    for (const property in data) {
      if (data.hasOwnProperty(property)) {
        if (data[property] != null) {
          formData.append(property, data[property]);
        }
      }
    }
    return this.http
      .post(this.baseUrl + "investment/addinvestment", formData, {
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
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  createInvestment(payload:FormData) {
    return this.http
      .post(this.baseUrl + "investment",payload,{
        headers: new HttpHeaders()
          .set(
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

  editInvestment(payload:FormData) {
    return this.http
      .put(this.baseUrl + "investment",payload,{
        headers: new HttpHeaders()
          .set(
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

  public verifyBVN(data: { BVN: string; UserId: number }): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "investment/verifybvn?bvn=" +
          data.BVN +
          "&userid=" +
          data.UserId,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
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

  public editInvestmentType(data: any): Observable<any> {
    return this.http
      .put(this.baseUrl + "investment/editinvestment-type", data, {
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
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public fetchInvestmentType(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "investment/fetch-investment", data, {
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

  public saveBulkInvestmentTemplate(): Observable<HttpResponse<Blob>> {
    return this.http
      .get<Blob>(
        this.baseUrl + "investment/downloadbulkinvestmentuploadtemplate",
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
          responseType: "blob" as "json",
        }
      )
      .pipe(retry(2));
  }

  getInvTemplate(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}investment/import/template`, {
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

  public bulkInvestmentUpload(data: FormData): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "investment/uploadinvestmentsandinvestmenttypes",
        data,
        {
          headers: new HttpHeaders().set(
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

  importInvestments(payload): Observable<any> {
    return this.http
      .post(this.baseUrl + "investment/import", payload, {
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

  getLiquidationRequests(params: GetLiquidationReqsQueryParams) {
    const paramsObj = {
      pageNumber: String(params.pageNumber),
      pageSize: String(params.pageSize),
      filter: String(params.filter),
    };

    if (params.keyword) paramsObj["keyword"] = params.keyword;

    return this.http
      .get<GetLiquidationReqsResBody>(
        `${this.baseUrl}investment/liquidation/requests`,
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

  getLiquidationRequestById(id: number) {
    return this.http
      .get<LiquidationReq>(
        `${this.baseUrl}investment/liquidation/requests/${id}`,
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

  reviewLiquidationRequest(
    liquidationRequestId: number,
    data: ReviewLiquidationReqBody
  ) {
    const { transactionPin, ...payload } = data;
    const encryptedPin = this.encrypt.encrypt(transactionPin);

    return this.http
      .post(
        `${this.baseUrl}investment/liquidation/requests/${liquidationRequestId}/review`,
        payload,
        {
          headers: new HttpHeaders()
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set("x-lenda-transaction-pin", `${encryptedPin}`),
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
