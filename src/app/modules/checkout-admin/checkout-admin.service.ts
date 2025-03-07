import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";

import {
  BasicListResponse,
  BasicPaginationReqProps,
  GetDataQueryParams,
} from "../shared/shared.types";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { AffordProfile } from "./types/generic";
import {
  AccActivityCipherReqBody,
  AccSweeperCipherReqBody,
  BankCheckConfig,
  CreditAffordabilityConfig,
  GambleCheck,
  IncomeCipherReqBody,
  NarrationCipherReqBody,
  RiskAssessmentReqBody,
  VerifyAccNumberResBody,
  AffordProfileCustomer,
  CustomerCreditFile,
  GetCustomerCreditProfileResBody,
  InviteMerchantStaffReqBody,
  SpoolMerchantReport,
  MerchantReportRes,
} from "./checkout-admin.types";
import { tap } from "rxjs/operators";
import {
  MerchantDetails,
  GetMerchantsResBody,
  GetAllMerchantsResBody,
  GetMerchantTransactionsQueryParams,
  GetMerchantTransactionsResBody,
  GetMerchantCommissionsQueryParams,
  GetMerchantCommissionsResBody,
} from "./types/merchant";

@Injectable({
  providedIn: "root",
})
export class CheckoutAdminService {
  private decodedToken;
  baseUrl = environment.apiUrl;
  merchantBaseUrl = this.baseUrl + "v1/Merchant";

  tabIndex$ = new Subject<number>();

  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService
  ) {}

  createMerchant(data: FormData) {
    return this.http.post(this.merchantBaseUrl, data, {
      headers: new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      ),
      observe: "response",
    });
  }

  editMerchant(data: { payload: FormData; id: number }) {
    return this.http.put(`${this.merchantBaseUrl}/${data.id}`, data.payload, {
      headers: new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      ),
      observe: "response",
    });
  }

  fetchMerchants(params: GetDataQueryParams) {
    return this.http.get<GetMerchantsResBody>(this.merchantBaseUrl, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      params: new HttpParams({ fromObject: params }),
      observe: "response",
    });
  }

  fetchAllMerchants() {
    return this.http.get<GetAllMerchantsResBody>(
      `${this.merchantBaseUrl}/all`,
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

  fetchMerchant(id: number) {
    return this.http.get<{ data: MerchantDetails }>(
      `${this.merchantBaseUrl}/${id}`,
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

  deleteMerchant(id: number) {
    return this.http.delete(`${this.merchantBaseUrl}/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  fetchMerchantTransactions(params: GetMerchantTransactionsQueryParams) {
    return this.http.get<GetMerchantTransactionsResBody>(
      `${this.baseUrl}v1/checkout/transactions`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: params }),
        observe: "response",
      }
    );
  }

  fetchMerchantCommissions(params: GetMerchantCommissionsQueryParams) {
    return this.http.get<GetMerchantCommissionsResBody>(
      `${this.baseUrl}v1/checkout/commissions/invoices`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: params }),
        observe: "response",
      }
    );
  }

  settleUnpaidInvoice(invoiceId: number) {
    return this.http.post<GetMerchantCommissionsResBody>(
      `${this.baseUrl}v1/Checkout/commissions/invoices/${invoiceId}/settlement`,
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
    );
  }

  private getToken() {
    return JSON.parse(sessionStorage.token);
  }

  getCreditAffordabilityConfig() {
    return this.http
      .get<{ data: CreditAffordabilityConfig }>(
        this.baseUrl + "riskEngine/config/creditAffordability",
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  configureBankCheck(payload: BankCheckConfig) {
    return this.http
      .post(this.baseUrl + "riskEngine/config/bankCheck", payload, {
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

  configureLoan(payload) {
    return this.http
      .post(this.baseUrl + "riskEngine/config/loan", payload, {
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

  configureNarrationCipher(payload: NarrationCipherReqBody) {
    return this.http
      .post(this.baseUrl + "riskEngine/config/narrationcipher", payload, {
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

  configureAccActivity(payload: AccActivityCipherReqBody) {
    return this.http
      .post(this.baseUrl + "riskEngine/accountactivitycipher", payload, {
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

  configureIncomeCipher(payload: IncomeCipherReqBody) {
    return this.http
      .post(this.baseUrl + "riskEngine/config/incomecipher", payload, {
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

  configureAccSweeperCipher(payload: AccSweeperCipherReqBody) {
    return this.http
      .post(this.baseUrl + "riskEngine/config/accountsweepcipher", payload, {
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

  configureGambleCheck(payload: GambleCheck) {
    return this.http
      .post(this.baseUrl + "riskEngine/gamblingconfig", payload, {
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

  configureRiskAssessment(payload: RiskAssessmentReqBody) {
    return this.http
      .post(this.baseUrl + "riskEngine/riskconfig", payload, {
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

  getRiskAssessmentConfig() {
    return this.http
      .get<{ data: RiskAssessmentReqBody }>(
        this.baseUrl + "riskEngine/riskconfig",
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  verifyAccountNumber(data: { accountNumber: string; sortCode: string }) {
    return this.http.post<VerifyAccNumberResBody>(
      `${environment.iasUrl}checkout/accountdetails/validate`,
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
      }
    );
  }

  fetchAffordProfile(payload: BasicPaginationReqProps) {
    const params = new HttpParams({ fromObject: payload });
    return this.http
      .get<BasicListResponse<AffordProfileCustomer>>(
        this.baseUrl + "v1/checkout/customers",
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
          params,
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getCustomerCreditProfile(id: number) {
    return this.http
      .get<GetCustomerCreditProfileResBody>(
        `${this.baseUrl}v1/checkout/customer/${id}/credit-profile`,
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getCustomerCreditFile(id: number) {
    return this.http
      .get<{ data: CustomerCreditFile }>(
        `${this.baseUrl}v1/checkout/customer/${id}/credit-file`,
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getProfile(id: number) {
    return this.http
      .get<{ data: AffordProfile }>(
        `${this.baseUrl}v1/checkout/customer/${id}/afford-profile`,
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  downloadInvoice(invoiceId: number): Observable<any> {
    return this.http.get<Blob>(
      `${this.baseUrl}v1/Checkout/invoices/${invoiceId}/transactions/export`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          observe: "response",
          responseType: "blob" as "json",
      }
    );
  }

  inviteMerchantStaff(data: InviteMerchantStaffReqBody) {
    return this.http
      .post(`${this.baseUrl}v1/merchant/staff/invite`, data, {
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

  spoolMerchantTransaction(params: SpoolMerchantReport) {
    return this.http.get<MerchantReportRes>(
      `${this.baseUrl}v1/merchant/report/transactions`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: params }),
        observe: "response",
      }
    );
  }

  exportMerchantReport(params: SpoolMerchantReport) {
    return this.http.get<Blob>(
      `${this.baseUrl}v1/merchant/report/transactions/export`,
      {
        responseType: "blob" as "json",
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: params }),
        observe: "response",
      }
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
      }
      return true;
    } catch (e) {}
  }
}
