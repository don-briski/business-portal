import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from "@angular/common/http";
import { BehaviorSubject, Observable, Subject, of } from "rxjs";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { retry, tap } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { EncryptService } from "src/app/service/encrypt.service";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import {
  DisbursementBatchActivity,
  GetAllDisbursementBatchesQueryParams,
  GetAllDisbursementBatchesResDto,
  PaymentOfficer,
  ReassignPaymentOfficerReqDto,
} from "../model/disbursement-batch";
import {
  AllClaimedApplication,
  BlacklistCustomerDto,
  Customer,
  FailedDisbursementApplication,
  GetAwaitingPoolApprovalLoans,
  GetBlacklistedCustomersReqData,
  GetBlacklistedCustomersResBody,
  GetCustomerDetailsFromRemitaDto,
  GetCustomerDetailsFromRemitaRes,
  GetDeactivatedApplicationsResBody,
  GetDeactivatedLoansResBody,
  GetLoanApplicationsReq,
  GetLoanCustomersResBody,
  GetLoansInApplicationPoolOrDisbReq,
  GetLoansResBody,
  GetUnverifiedAppsResBody,
  LoanAppDetails,
  LoanInApplicationPool,
  LoanSearchParam,
  LoanWithApprovalWorkflow,
  MandatePaymentHistory,
  OpenLoanApplication,
  OpenOrReviewedClaimedApplication,
  ReviewLoanWithApprovalFlowDto,
  SearchLoansResponse,
  UpdateDisbFailed,
  UpdateLoanDto,
  ReassignLoanDto,
  LoansAwaitingDisbursement,
} from "../modules/loan-section/loan.types";
import {
  GenericSpoolRequestPayload,
  GenericSpoolResponsePayload,
  GetDataQueryParams,
} from "../modules/shared/shared.types";
import {
  LoanDisbursementViaKudaRes,
  LoanDisbursementViaSeerbitDto,
  LoanDisbursementViaSeerbitRes,
  SeerbitNameEnquiryData,
  SeerbitNameEnquiryResBody,
} from "../model/configuration";

@Injectable({
  providedIn: "root",
})
export class LoanoperationsService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;
  fromTopupCreation$ = new BehaviorSubject(false);

  reassignedDisbursementBatch = new Subject();

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

  /**
   * @deprecated this method should is deprecated use getLoansInApplicationPool
   */
  public spoolApplicationPool(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolapplicationpool", model, {
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

  getLoansInApplicationPool(data: GetLoansInApplicationPoolOrDisbReq) {
    return this.http.get<GenericSpoolResponsePayload<LoanInApplicationPool>>(
      `${this.baseUrl}loanoperations/applications/pool`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      }
    );
  }

  public getLoanFiles(loanId: number): Observable<any> {
    return this.http
      .get(this.baseUrl + "loanoperations/getloanfiles/" + loanId, {
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

  public deleteFile(payload): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/deleteloanfiles", payload, {
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

  public getBankStatementAnalysisRequestsByLoan(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "loanoperations/getBankStatementAnalysisRequestsByLoan",
        model,
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

  public getBankStatementAnalysisRequests(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "loanoperations/getBankStatementAnalysisRequests",
        model,
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

  public requestBankStatementAnalysisForLoan(loanId: number): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "loanoperations/requestBankStatementAnalysisForLoan/" +
          loanId,
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

  public rescheduleLoan(model: any): Observable<any> {
    model["TransactionPin"] = this.encrypt.encrypt(model["TransactionPin"]);
    return this.http
      .post(this.baseUrl + "loanoperations/rescheduleloan", model, {
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

  public spoolClaimedApplications(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "loanoperations/spoolclaimedapplicationsbyuserid",
        model,
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

  spoolOpenOrReviewedClaimedApplications(
    data: GenericSpoolRequestPayload,
    isReviewed: boolean
  ) {
    return this.http.get<
      GenericSpoolResponsePayload<OpenOrReviewedClaimedApplication>
    >(`${this.baseUrl}loanoperations/loanapplications/claimed`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      params: new HttpParams({ fromObject: { ...data, isReviewed } }),
      observe: "response",
    });
  }

  public spoolreviewedClaimedApplications(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl +
          "loanoperations/spoolreviewedclaimedapplicationsbyuserid",
        model,
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
  public spoolAllClaimedApplications(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "loanoperations/spoolallclaimedapplications",
        model,
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

  getAllClaimedApplications(data: GenericSpoolRequestPayload) {
    return this.http.get<GenericSpoolResponsePayload<AllClaimedApplication>>(
      `${this.baseUrl}loanoperations/claimedapplications`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      }
    );
  }

  public sendClaimedApplicationsBackToPool(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "loanoperations/sendclaimedloanapplicationsbacktopool",
        model,
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
  public reassignClaimedApplications(model: any): Observable<any> {
    const { transactionPin } = model;
    return this.http
      .post(
        this.baseUrl + "loanoperations/reassignclaimedloanapplications",
        model,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set(
              "x-lenda-transaction-pin",
              this.encrypt.encrypt(`${transactionPin}`)
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

  reassignLoanWithMultiLevelApproval(
    model: ReassignLoanDto,
    transactionPin: string
  ): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanapplication/reassign", model, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set(
            "x-lenda-transaction-pin",
            this.encrypt.encrypt(`${transactionPin}`)
          ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  updateLoanInterestRate(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/updateloaninterestrate", model, {
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

  getLoans(data: GenericSpoolRequestPayload) {
    return this.http.get<GetLoansResBody>(
      `${this.baseUrl}loanoperations/loans`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: { ...data } }),
        observe: "response",
      }
    );
  }

  public spoolAccessibleApplications(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "loanoperations/spoolallaccessibleapplicationsbybranch",
        model,
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

  getAllApplications(data: GenericSpoolRequestPayload) {
    return this.http.get<
      GenericSpoolResponsePayload<OpenOrReviewedClaimedApplication>
    >(`${this.baseUrl}loanoperations/applications/accessible`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      params: new HttpParams({ fromObject: data }),
      observe: "response",
    });
  }

  /**
   * @deprecated this method should is deprecated use getOpenLoanApplications
   */
  public spoolApplicationsByUser(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolapplicationsbyuser", model, {
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

  getLoanApplications(data: GetLoanApplicationsReq) {
    return this.http.get<GenericSpoolResponsePayload<OpenLoanApplication>>(
      `${this.baseUrl}loanoperations/user/applications`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      }
    );
  }

  getAwaitingPoolApprovalLoans(data: GetAwaitingPoolApprovalLoans) {
    return this.http.get<GenericSpoolResponsePayload<OpenLoanApplication>>(
      `${this.baseUrl}loanoperations/teamlead/applications`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      }
    );
  }

  public getLoanapplicationbycode(code: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "loanoperations/getLoanapplicationbycode/" + code, {
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

  public getLoanapplicationbyid(id: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "loanoperations/getLoanapplicationbyid/" + id, {
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

  public getLoanapplicationWithHistorybyid(id: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "loanoperations/getLoanapplicationwithhistorybyid/" + id,
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

  public getLoanapplicationbyId(code: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "loanoperations/getLoanapplicationbyid/" + code, {
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

  public spoolUnverifiedApprovedLoanApplications(model: any) {
    return this.http
      .get<GetUnverifiedAppsResBody>(
        this.baseUrl + "loanoperations/spoolunverifiedapprovedloanapplications",
        {
          params: new HttpParams({ fromObject: model }),
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
        }
      )
      .pipe(tap((res) => this.setToken(res.headers)));
  }

  public getRepaymentInformation(model: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "loanoperations/getcustomerrepaymentamount/" + model,
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

  public sendMail(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/sendmailfromfrontend", model, {
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

  /**
   * @deprecated this method should is deprecated use getLoansInDisbPool
   */
  public spoolDisbursementPool(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spooldisbursementpool", model, {
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

  getLoansInDisbPool(data: GetLoansInApplicationPoolOrDisbReq) {
    return this.http.get<GenericSpoolResponsePayload<LoanInApplicationPool>>(
      `${this.baseUrl}loanoperations/applications/verified`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      }
    );
  }

  public spoolClaimedLoansForDisbursementsbyuserid(
    model: any
  ): Observable<any> {
    return this.http
      .post(
        this.baseUrl +
          "loanoperations/spoolclaimedloansfordisbursementsbyuserid",
        model,
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

  public spoolDisbursementBatches(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "loanoperations/spooldisbursementbatchesbyuserid",
        model,
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

  getAllDisbursementBatches(data: GetAllDisbursementBatchesQueryParams) {
    return this.http.get<GetAllDisbursementBatchesResDto>(
      `${this.baseUrl}LoanOperations/disbursementBatches`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data as any }),
        observe: "response",
      }
    );
  }

  getDisbursementBatchHistory(batchId: number) {
    return this.http.get<DisbursementBatchActivity[]>(
      `${this.baseUrl}LoanOperations/disbursementBatches/${batchId}/history`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      }
    );
  }

  getPaymentOfficers() {
    return this.http.get<PaymentOfficer[]>(
      `${this.baseUrl}User/paymentOfficers`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      }
    );
  }

  reassignDisbursementBatch(
    dto: ReassignPaymentOfficerReqDto,
    transactionPin: string
  ) {
    return this.http
      .put(`${this.baseUrl}LoanOperations/disbursementBatches/reassign`, dto, {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set("x-lenda-transaction-pin", `${transactionPin}`),
        observe: "response",
      })
      .pipe(
        tap(() => {
          this.reassignedDisbursementBatch.next();
        })
      );
  }

  public claimLoans(model: any, transactionPin:string): Observable<any> {
    const txPin = this.encrypt.encrypt(transactionPin);
    return this.http
      .post(this.baseUrl + "loanapplication/claim", model, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set("x-lenda-transaction-pin", txPin),
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

  public createResponse(model: any): Observable<any> {
    model["TransactionPin"] = this.encrypt.encrypt(model["TransactionPin"]);
    const formData = new FormData();
    for (const property in model) {
      if (model.hasOwnProperty(property)) {
        if (model[property] != null) {
          if (property === "files") {
            for (let i = 0; i < model[property].length; i++) {
              formData.append(property + "" + i, model[property][i]);
            }
          } else {
            formData.append(property, model[property]);
          }
        }
      }
    }
    return this.http
      .post(this.baseUrl + "loanoperations/loanapplicationresponse", formData, {
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public updateCreditScore(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/creditscoreupdate", model, {
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

  public approveLoan(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/loanentryapprove", model, {
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

  public checkTopUpEligibility(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/verifyLoantopupeligibilty", model, {
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

  public updateLoanapplicationstatus(model: any): Observable<any> {
    model["TransactionPin"] = this.encrypt.encrypt(model["TransactionPin"]);
    return this.http
      .post(this.baseUrl + "loanoperations/loanstatusupdate", model, {
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

  public createVerifyResponse(model: any, lines: any): Observable<any> {
    if (lines !== "") {
      const linesString = JSON.stringify(lines);
      model.Content = linesString;
    }

    return this.http
      .post(this.baseUrl + "loanoperations/verificationresponse", model, {
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

  public createTestVerifyResponse(model: any, lines: any): Observable<any> {
    const formData = new FormData();
    for (const property in model) {
      if (model.hasOwnProperty(property)) {
        if (model[property] != null) {
          if (property === "files") {
            for (let i = 0; i < model[property].length; i++) {
              formData.append(property + "" + i, model[property][i]);
            }
          } else {
            formData.append(property, model[property]);
          }
        }
      }
    }
    return this.http
      .post(
        this.baseUrl + "loanoperations/testverificationresponse",
        formData,
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

  public claimdisbursementLoans(model: any): Observable<any> {
    model["TransactionPin"] = this.encrypt.encrypt(model["TransactionPin"]);
    return this.http
      .post(this.baseUrl + "loanoperations/claimloansfordisbursements", model, {
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

  public createBatch(model: any): Observable<any> {
    model["TransactionPin"] = this.encrypt.encrypt(model["TransactionPin"]);
    return this.http
      .post(this.baseUrl + "loanoperations/disbursementbatchcreate", model, {
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

  public disburseBuyOver(model: any): Observable<any> {
    model["TransactionPin"] = this.encrypt.encrypt(model["TransactionPin"]);
    return this.http
      .post(this.baseUrl + "loanoperations/disbursebuyoverloans", model, {
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

  public createPaymentRecord(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/paymententrycreate", model, {
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

  public createBulkPaymentRecord(model: any): Observable<any> {
    const formData = new FormData();
    for (const property in model) {
      if (model.hasOwnProperty(property)) {
        if (model[property] != null) {
          if (property === "files") {
            for (let i = 0; i < model[property].length; i++) {
              formData.append(property + "" + i, model[property][i]);
            }
          } else {
            formData.append(property, model[property]);
          }
        }
      }
    }
    return this.http
      .post(this.baseUrl + "loanoperations/bulkpaymententrycreate", formData, {
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public spoolDisbursementMetrics(branchid: any, userid: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "metrics/spooldisbursementmetricsdata/" +
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

  public ForceBackgroundEvent(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "integration/backgroundtasks", model, {
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

  public getSettlementAmount(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/getsettlementamount", model, {
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

  public createLoanDisbursement(model: any): Observable<any> {
    model["TransactionPin"] = this.encrypt.encrypt(model["TransactionPin"]);
    return this.http
      .post(this.baseUrl + "loanoperations/disburseloans", model, {
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

  public enquireNameViaSeerbit(data: SeerbitNameEnquiryData[]) {
    return this.http
      .post<SeerbitNameEnquiryResBody>(
        this.baseUrl + "loanoperations/seerbit/nameenquiry",
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public disburseLoanViaSeerbit(
    data: LoanDisbursementViaSeerbitDto,
    transactionPin: string
  ) {
    const txPin = this.encrypt.encrypt(transactionPin);
    return this.http
      .post<LoanDisbursementViaSeerbitRes>(
        this.baseUrl + "loanoperations/seerbit/bulkpayout",
        data,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set("x-lenda-transaction-pin", txPin),
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public disburseLoanWithKuda(data: any, transactionPin: any) {
    const transPin = this.encrypt.encrypt(transactionPin);
    return this.http
      .post<LoanDisbursementViaKudaRes>(
        this.baseUrl + "loanoperations/disburse/kuda",
        data,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set("x-lenda-transaction-pin", transPin),
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

  public kudaNameEnquiry(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/disburse/kuda/nameenquiry", data, {
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
  public getKudaBankList(): Observable<any> {
    return this.http
      .get(this.baseUrl + `loanoperations/disburse/kuda/getkudabanks`, {
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

  public CrcfindCustomer(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "integration/fcfindcustomerbyname", model, {
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

  public CrcfindCustomerbybvn(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "integration/crfindcustomerbybvn", model, {
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

  public createMandate(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "integration/generatemandate", model, {
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

  public verifyMandate(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "integration/verifymandate", model, {
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

  public spoolDashboardDataByBranch(dateObject): Observable<any> {
    // let body=new HttpParams({ fromObject :dateObject })
    return this.http
      .post(
        this.baseUrl + "metrics/spooldashboardmetricsdatabybranch",
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

  public createRecipients(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/createtransferrecipient", model, {
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

  public spoolPayments(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolpayments", model, {
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

  public getPaymentById(id: number): Observable<any> {
    return this.http
      .get(this.baseUrl + `loanoperations/payments?paymentId=${id}`, {
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

  public spoolRepaymentsDue(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolrepaymentsdue", model, {
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

  spoolLoansbySearch(payload: LoanSearchParam) {
    return this.http.get<SearchLoansResponse>(
      `${this.baseUrl}loanoperations/search-loans`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: payload }),
        observe: "response",
      }
    );
  }

  public spoolEmployersbyName(term: string): Observable<any> {
    if (term === "") {
      return of([]);
    }
    return this.http
      .get(this.baseUrl + "loanoperations/search_employers?term=" + term, {
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

  public spoolBuyOverLoans(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolbuyoverloans", model, {
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

  public getLoanCustomers(query: GetDataQueryParams) {
    const params = new HttpParams({ fromObject: query });
    return this.http
      .get<GetLoanCustomersResBody>(this.baseUrl + "loanoperations/customers", {
        params,
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

  public spoolLoanCustomers(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolloancustomers", model, {
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

  public spoolLoanProspectiveCustomers(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "loanoperations/spoolloanprospectivecustomers",
        model,
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
  public spoolLoanBlacklistedCustomers(data: GetBlacklistedCustomersReqData) {
    const params = new HttpParams({ fromObject: data as any });

    return this.http
      .get<GetBlacklistedCustomersResBody>(
        `${this.baseUrl}LoanOperations/blacklist/customers`,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          params,
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }
  public blacklistCustomer(model: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}loanoperations/request_customer_blacklist`, model, {
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
  public confirmBlacklistCustomer(
    model: BlacklistCustomerDto
  ): Observable<any> {
    return this.http
      .post(`${this.baseUrl}loanoperations/blacklistCustomer`, model, {
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
  public confirmWhitelistCustomer(model: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}loanoperations/whitelistCustomer`, model, {
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

  public getDisbursementBatchById(id: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "loanoperations/getdisbursementbatchbyid/" + id, {
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

  public getLoanProductsByAmount(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/getloanproductsbyamount", model, {
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

  public spoolCustomerMetricsByPersonId(id: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "loanoperations/customermetrics/" + id, {
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
            /*this.setToken(res.headers); */ return res;
          },
          (error) => {
            return error;
          }
        )
      );
  }

  generateRemitaMandate(data: any): Observable<any> {
    return this.http.post<any>(
      this.baseUrl + "integration/remitasetupmandate",
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
    );
  }

  getRemitaMandateStatus(data: any): Observable<any> {
    return this.http
      .post<any>(this.baseUrl + "integration/remitamandatestatus", data, {
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
  cancelRemitaDebitInstruction(data: any): Observable<any> {
    return this.http
      .post<any>(
        this.baseUrl + "integration/remitacanceldebitinstruction",
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
  stopRemitaMandate(data: any): Observable<any> {
    return this.http
      .post<any>(this.baseUrl + "integration/remitastopmandate", data, {
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
  issueRemitaDirectDebitInstruction(data: any): Observable<any> {
    return this.http
      .post<any>(
        this.baseUrl + "integration/remitasenddebitinstruction",
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
  getRemitaMandatePayments(data: any): Observable<any> {
    return this.http
      .post<any>(this.baseUrl + "integration/remitapaymenthistory", data, {
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

  public getActivities(model1: any, model2: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "loanoperations/getactivities/" + model1 + "/" + model2,
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

  public getBankStatementById(data: any): Observable<any> {
    return this.http
      .post<any>(
        this.baseUrl + `BankStatement/SpoolBankStatementByPersonId`,
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

  public checkBankStatementStatus(personId): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `bankStatement/checkBankStatementStatus?personId=${personId}`,
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

  public sendBackFailedDisbursements(data: any): Observable<any> {
    return this.http
      .post<any>(
        this.baseUrl + `loanoperations/sendbackfaileddisbursements`,
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
  // getRemitaMandatePayments(data: any): Observable<any> {
  //   return this.http.post<any>(this.baseUrl + 'integration/remitapaymenthistory', data,
  //     {
  //       headers: new HttpHeaders()
  //         .set('Content-Type', 'application/json')
  //         .set('Authorization', (sessionStorage.token != null) ? 'Bearer ' + this.getToken() : ''),
  //       observe: 'response'
  //     })
  //     .pipe(
  //       tap(
  //         res => { this.setToken(res.headers); return res; },
  //         error => this.tokenRefreshError.handleError(error)
  //       )
  //     );
  // }

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

  public sendCalendlyNotification(emailAddress: string): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "integration/sendcalendlynotification?email=" +
          emailAddress,
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

  public getCreditRegistryCustomerData(bvnNumber: string): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "integration/getcustomercreditscoredata/" + bvnNumber,
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

  public saveBulkloanTemplate(): Observable<HttpResponse<Blob>> {
    return this.http
      .get<Blob>(
        this.baseUrl + "loanOperations/downloadbulkloanuploadtemplate",
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

  public saveBulkloanRescheduleTemplate(): Observable<HttpResponse<Blob>> {
    return this.http
      .get<Blob>(
        this.baseUrl + "loanOperations/downloadbulkloanrescheduletemplate",
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

  public bulkLoanUpload(data: FormData): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanOperations/uploadloansandloantypes", data, {
        headers: new HttpHeaders()
          .set("Accept", "application/json")
          // .set('Content-Type', 'multipart/form-data')
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
  public bulkLoanReschedukeUpload(data: FormData): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanOperations/rescheduleloanmultiple", data, {
        headers: new HttpHeaders()
          .set("Accept", "application/json")
          // .set('Content-Type', 'multipart/form-data')
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

  public recallSingleLoan(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanOperations/recallloanapplication", data, {
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

  public firenotify(): Observable<any> {
    return this.http
      .get(this.baseUrl + "loanoperations/firenotify", {
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

  public spoolDeactivatedApplications(data: GetDataQueryParams) {
    return this.http
      .get<GetDeactivatedApplicationsResBody>(
        this.baseUrl + "loanoperations/deactivated-applications",
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
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

  /**
   * @deprecated this method should is deprecated use getOpenLoanApplications
   */
  public spoolFailedDisbursements(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolfaileddisbursements", model, {
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

  getFailedDisbApplications(data: GenericSpoolRequestPayload) {
    return this.http.get<
      GenericSpoolResponsePayload<FailedDisbursementApplication>
    >(`${this.baseUrl}loanoperations/disbursements/failed`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      params: new HttpParams({ fromObject: data }),
      observe: "response",
    });
  }

  public submitFailedApplication(model: any): Observable<any> {
    const formData = new FormData();
    for (const property in model) {
      if (model.hasOwnProperty(property)) {
        if (model[property] != null) {
          formData.append(property, model[property]);
        }
      }
    }

    return this.http
      .post(this.baseUrl + "loanoperations/submitFailedApplication", formData, {
        headers: new HttpHeaders()
          // .set("Content-Type", "application/json")
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

  public approveFailedApplication(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/approveFailedApplication", model, {
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

  public getTempBankDetailsByLoanId(loanId: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "loanoperations/getTempLoanBankDetailsByLoanId/" +
          loanId,
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

  /**
   * @deprecated this method is deprecated use getLoansAwaitingDisbursement
   */
  public spoolLoansAwaitingDisbursement(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolawaitingdisbursements", model, {
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

  getLoansAwaitingDisbursement(data: GenericSpoolRequestPayload) {
    return this.http.get<GenericSpoolResponsePayload<LoansAwaitingDisbursement>>(
      `${this.baseUrl}loanoperations/awaiting-disbursements`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      }
    );
  }

  public spoolDeactivatedLoans(data: GetDataQueryParams) {
    const paramsObj = {
      pageNumber: String(data.pageNumber),
      pageSize: String(data.pageSize),
      keyword: data.keyword,
      selectedSearchColumn: data.selectedSearchColumn,
      ...data
    };

    return this.http
      .get<GetDeactivatedLoansResBody>(
        this.baseUrl + "loanoperations/deactivated-loans",
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          params: paramsObj,
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }
  public sendCardAuthEmail(loanId: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "LoanOperations/resendCardAuthorizationEmail/" + loanId,
        {},
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

  getBanksAsJson() {
    return this.http.get<{ BankCode: string; BankName: string }[]>(
      "https://lendax-bucket.s3.eu-west-2.amazonaws.com/Integrations/Kuda/Remita_Banks.json",
      {
        observe: "response",
      }
    );
  }

  getCustomerDetailsFromRemita(data: GetCustomerDetailsFromRemitaDto) {
    const params = new HttpParams({ fromObject: data });

    return this.http.get<GetCustomerDetailsFromRemitaRes>(
      this.baseUrl + "Integration/remita/salary/history",
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params,
        observe: "response",
      }
    );
  }

  getLoanRepaymentMethods() {
    return this.http.get<string[]>(
      this.baseUrl + "Configuration/loanrepaymentmethodkeys",
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      }
    );
  }

  notifyRemita(data: { loanId: number; tenantId: string }) {
    return this.http.post(
      this.baseUrl + "Integration/remita/loan/disbursement/notify",
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
    );
  }

  stopRemitaCollection(data: { loanId: number }) {
    return this.http.post(
      this.baseUrl + "Integration/remita/loan/collection/stop",
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
    );
  }

  getMandatePaymentHistory(loanId: number) {
    return this.http.get<{ data: MandatePaymentHistory }>(
      this.baseUrl +
        `Integration/remita/mandate/payment/history?loanId=${loanId}`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      }
    );
  }

  getPayrollTemplate(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}LoanOperations/payroll/template`, {
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

  uploadPayroll(payload): Observable<any> {
    return this.http
      .post(`${this.baseUrl}LoanOperations/upload/payroll`, payload, {
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

  getPayrollUser(payload): Observable<any> {
    return this.http
      .get(`${this.baseUrl}v1/QuickLoanProduct/GetCustomerData`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        params: new HttpParams({ fromObject: payload }),
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getCustomerPayrollData(employeeId: string): Observable<any> {
    return this.http
      .get(`${this.baseUrl}v1/QuickLoanProduct/GetCustomerPayrollData`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        params: new HttpParams({ fromObject: { employeeId } }),
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  markDisbursementAsFailed(payload: UpdateDisbFailed) {
    return this.http
      .post(
        `${this.baseUrl}LoanOperations/updateloanstodisbursementfailed`,
        payload,
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

  toggleDisbursementBank(loanId: number, newBank: string) {
    return this.http
      .put(
        `${this.baseUrl}LoanOperations/loans/${loanId}/disbursement-bank`,
        { newBank },
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

  getLoanDetails(id: number) {
    return this.http
      .get<{ data: LoanAppDetails }>(
        `${this.baseUrl}LoanApplication/${id}/loan`,
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

  updateLoanDetails(data: UpdateLoanDto) {
    return this.http
      .put(`${this.baseUrl}LoanApplication/loan`, data, {
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

  getLoanWithApprovalDetails(id: number) {
    return this.http
      .get<{ data: LoanWithApprovalWorkflow }>(
        `${this.baseUrl}LoanApplication/${id}`,
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

  reviewLoanWithApprovalWorkflow(
    data: ReviewLoanWithApprovalFlowDto,
    transactionPin: string
  ) {
    return this.http
      .post(`${this.baseUrl}LoanApplication/review`, data, {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set(
            "x-lenda-transaction-pin",
            this.encrypt.encrypt(`${transactionPin}`)
          ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  uploadMultiApprovalLoanFile(data) {
    return this.http
      .post(`${this.baseUrl}LoanApplication/document`, data, {
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
          return res;
        })
      );
  }

  public getToken() {
    return JSON.parse(sessionStorage.token);
  }

  getDisbursementGroups(data: any) {
    // return this.http.get<
    //   GenericSpoolResponsePayload<FailedDisbursementApplication>
    // >(`${this.baseUrl}loanoperations/disbursements/failed`, {
    //   headers: new HttpHeaders()
    //     .set("Content-Type", "application/json")
    //     .set(
    //       "Authorization",
    //       sessionStorage.token != null ? "Bearer " + this.getToken() : ""
    //     ),
    //   params: new HttpParams({ fromObject: data }),
    //   observe: "response",
    // });
  }
}
