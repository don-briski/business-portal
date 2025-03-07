import { HttpHeaders, HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { TokenRefreshErrorHandler } from "../../../service/TokenRefreshErrorHandler";
import { EncryptService } from "src/app/service/encrypt.service";
import {
  GetInvoicesQueryParams,
  GetInvoicesResBody,
  GetPaymentResBody,
  GetPaymentsReqBody,
  GetPaymentsResBody,
  GetTaxesResBody,
  InvoiceDetails,
  GetCustomersResBody, GetPaymentsMadeResBody
} from "../finance.types";
import { GetDataQueryParams } from "../../shared/shared.types";
import { FetchJournalsPayload, FetchJournalsRes, JournalDetails } from "../types/Journal";
import { GetExpensesReqParams, GetExpensesResBody, ExpenseDetails } from "../types/expense";
import { Vendor } from "../models/vendor.interface";

@Injectable({
  providedIn: "root",
})
export class FinanceService {
  private _baseUrl = environment.apiUrl;
  private _decodedToken;
  private _userToken;

  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    public encrypt: EncryptService
  ) {}

  public getAccounts(): Observable<any> {
    return this.http
      .get(this._baseUrl + `Accounts/accounts`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getTaxes(query: GetDataQueryParams & { isActive?: boolean }) {
    if (query?.isActive === null || query?.isActive === undefined) {
      delete query?.isActive;
    }

    return this.http
      .get<GetTaxesResBody>(this._baseUrl + `financesetup/taxes`, {
        params: new HttpParams({ fromObject: query }),
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getTaxesLimitedView(): Observable<any> {
    return this.http
      .get(this._baseUrl + `financesetup/GetTaxesLimitedView`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public createTax(data: any): Observable<any[]> {
    return this.http
      .post(`${this._baseUrl}financeSetup/tax`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }
  public updateTax(data: any): Observable<any[]> {
    return this.http
      .put(`${this._baseUrl}financeSetup/tax`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public deleteTax(id: any): Observable<any> {
    return this.http
      .delete(`${this._baseUrl}financeSetup/tax/${id}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getPaymentModes(model?: any): Observable<any> {
    return this.http
      .post(this._baseUrl + `financesetup/paymentModes`, model, {
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

  public createPaymentMode(data: any): Observable<any[]> {
    return this.http
      .post(`${this._baseUrl}financeSetup/paymentMode`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }
  public updatePaymentMode(data: any): Observable<any[]> {
    return this.http
      .put(`${this._baseUrl}financeSetup/paymentMode`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public deletePaymentMode(id: any): Observable<any> {
    return this.http
      .delete(`${this._baseUrl}financeSetup/paymentModes/${id}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getCustomerOrVendor(payload): Observable<any> {
    return this.http
      .post(this._baseUrl + `person/getpersonslimitedview`, payload, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public spoolAllPaymentTerms(model: any): Observable<any> {
    return this.http
      .post(this._baseUrl + "financeSetup/paymentTerms", model, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public createPaymentTerms(data: any): Observable<any[]> {
    return this.http
      .post(`${this._baseUrl}financeSetup/paymentTerm`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }
  public updatePaymentTerms(data: any): Observable<any[]> {
    return this.http
      .put(`${this._baseUrl}financeSetup/paymentTerm`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            return res.body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public deletePaymentTerm(id: any): Observable<any> {
    return this.http
      .delete(`${this._baseUrl}financeSetup/paymentTerms/${id}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  /**
   * @deprecated The method should not be used,use fetchJournals instead
   */
  public getJournals(data): Observable<any> {
    return this.http
      .post(this._baseUrl + `journal/getjournals`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  fetchJournals(payload:FetchJournalsPayload) {
    return this.http
      .get<FetchJournalsRes>(this._baseUrl + "journal", {
        params: new HttpParams({fromObject:payload}),
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

  public getVendorJournals(data): Observable<any> {
    return this.http
      .post(this._baseUrl + `journal/getjournallinespaginated`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getJournal(journalId: number) {
    return this.http
      .get<{data:JournalDetails}>(this._baseUrl + `journal/${journalId}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getJournalActivityLogs(journalId: number): Observable<any> {
    return this.http
      .get(this._baseUrl + `journal/activities/${journalId}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getJournalFiles(journalId: number): Observable<any> {
    return this.http
      .get(this._baseUrl + `journal/files/${journalId}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getExpenseFiles(expenseId: number): Observable<any> {
    return this.http
      .get(this._baseUrl + `expensemanagement/files/${expenseId}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public createJournal(
    data: FormData,
    transactionPin?: string
  ): Observable<any> {
    return this.http
      .post(this._baseUrl + "journal", data, {
        headers: this.setHeaders(transactionPin),
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

  public approveJournal(data: any, transactionPin?: string): Observable<any> {
    return this.http
      .post(this._baseUrl + "journal/ApproveJournalProcess", data, {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          )
          .set(
            "x-lenda-transaction-pin",
            this.encrypt.encrypt(`${transactionPin}`)
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

  public approveExpense(data: any, transactionPin?: string): Observable<any> {
    return this.http
      .post(this._baseUrl + "ExpenseManagement/ApproveExpenseProcess", data, {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          )
          .set(
            "x-lenda-transaction-pin",
            this.encrypt.encrypt(`${transactionPin}`)
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

  public updateJournal(
    data: FormData,
    transactionPin?: string
  ): Observable<any> {
    return this.http
      .put(this._baseUrl + "journal", data, {
        headers: this.setHeaders(transactionPin),
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

  public deleteJournal(journalId: number): Observable<any> {
    return this.http
      .delete(`${this._baseUrl}journal/${journalId}`, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getExpense(expenseId: number) {
    return this.http
      .get<{data: ExpenseDetails}>(this._baseUrl + `expensemanagement/${expenseId}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getExpenseActivityLogs(expenseId: number): Observable<any> {
    return this.http
      .get(this._baseUrl + `expensemanagement/activities/${expenseId}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public deleteFile(data): Observable<any> {
    return this.http
      .post(`${this._baseUrl}file/deletefiles`, data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getVendorsLimitedView(searchTerm?: any): Observable<any> {
    return this.http
      .post(this._baseUrl + "person/getvendorslimitedview", searchTerm, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getCustomersLimitedView(searchTerm?: any): Observable<any> {
    return this.http
      .post(this._baseUrl + "person/getcustomerslimitedview", searchTerm, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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
   * @deprecated The method should not be used,use getCustomers instead
   */
  public getCustomersOrVendorsSummary(model): Observable<any> {
    return this.http
      .get(this._baseUrl + "FinancePeople/customers_vendors/summary", {
        params: new HttpParams({ fromObject: model }),
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getSalespersonsLimitedView(searchTerm?: any): Observable<any> {
    return this.http
      .post(this._baseUrl + "person/GetSalesPersonsLimitedView", searchTerm, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getVendors(param): Observable<any> {
    let params = new HttpParams({
      fromObject: param,
    });

    return this.http
      .get(this._baseUrl + "vendormanagement", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
        params: params,
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

  public getVendor(vendorId:number) {
    return this.http
      .get<Vendor>(`${this._baseUrl}vendormanagement/${vendorId}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getVendorComments(vendorId): Observable<any> {
    return this.http
      .get(`${this._baseUrl}vendormanagement/${vendorId}/comments`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getVendorStatements(payload, vendorId): Observable<any> {
    let queryParams = new HttpParams();
    queryParams = queryParams.append("StartDate", payload.fromDate);
    queryParams = queryParams.append("EndDate", payload.toDate);
    queryParams = queryParams.append("VendorId", vendorId);

    return this.http
      .get(`${this._baseUrl}vendormanagement/statementofaccounts`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
        params: queryParams,
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
  public getAccountStatements(payload): Observable<any> {
    let queryParams = new HttpParams({ fromObject: payload });
    let resource;
    payload.VendorId
      ? (resource = "vendormanagement/statementofaccounts")
      : (resource = "v1/financecustomers/statementofaccount");

    return this.http
      .get(`${this._baseUrl}${resource}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
        params: queryParams,
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

  public addVendorComments(data): Observable<any> {
    return this.http
      .post(`${this._baseUrl}vendormanagement/comments`, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public deleteVendorComment(
    vendorId: number,
    commentId: number
  ): Observable<any> {
    return this.http
      .delete(
        `${this._baseUrl}vendormanagement/${vendorId}/comments/${commentId}`,
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

  public createVendor(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "vendormanagement", data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public updateVendor(data): Observable<any> {
    return this.http
      .put(this._baseUrl + "vendormanagement", data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public deactivateVendor(vendorId): Observable<any> {
    return this.http
      .put(
        `${this._baseUrl}vendormanagement/deactivate/${vendorId}`,
        {},
        {
          headers: new HttpHeaders().set(
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

  public getCustomer(id: number): Observable<any> {
    return this.http
      .get(this._baseUrl + "v1/financecustomers/" + id, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  getCustomers(data) {
    const params = new HttpParams({ fromObject: data });
    return this.http
      .get<GetCustomersResBody>(this._baseUrl + "v1/financecustomers", {
        params,
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public createCustomer(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "v1/financecustomers", data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public updateCustomer(data): Observable<any> {
    return this.http
      .put(this._baseUrl + "v1/financecustomers", data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getExpenses(params: GetExpensesReqParams) {
    return this.http
      .get<GetExpensesResBody>(this._baseUrl + "expensemanagement/expenses", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
        ),
        observe: "response",
        params: new HttpParams({fromObject: params}),
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

  public createExpense(data, transactionPin?: string): Observable<any> {
    return this.http
      .post(this._baseUrl + "expensemanagement", data, {
        headers: this.setHeaders(transactionPin),
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

  public createBulkExpense(
    data: any[],
    transactionPin?: string
  ): Observable<any> {
    return this.http
      .post(this._baseUrl + "expensemanagement/bulkcreate", data, {
        headers: this.setHeaders(transactionPin),
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

  public updateExpense(
    data: FormData,
    transactionPin?: string
  ): Observable<any> {
    return this.http
      .put(this._baseUrl + "expensemanagement", data, {
        headers: this.setHeaders(transactionPin),
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

  public deleteExpense(expenseId: number): Observable<any> {
    return this.http
      .delete(this._baseUrl + "expensemanagement/" + expenseId, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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
  public getPayment(id: number) {
    return this.http
      .get<GetPaymentResBody>(this._baseUrl + "financePayment/payment/" + id, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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
   * @deprecated The method should not be used,use getPayments instead
   */
  public getPaymentMade(model: any): Observable<any> {
    return this.http
      .get<GetPaymentsMadeResBody>(this._baseUrl + "financePayment/payments", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          ),
        observe: "response",
        params: new HttpParams({fromObject: model})
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

  getPayments(data: GetPaymentsReqBody) {
    const params = new HttpParams({ fromObject: data });
    return this.http
      .get<GetPaymentsResBody>(this._baseUrl + "financepayment/payments", {
        params,
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
          },
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public createPaymentMade(data: any, transactionPin?): Observable<any> {
    return this.http
      .post(this._baseUrl + "financePayment/payment", data, {
        headers: this.setHeaders(transactionPin),
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

  public approvePaymentMade(
    data: FormData,
    transactionPin?: string
  ): Observable<any> {
    return this.http
      .put(this._baseUrl + "financePayment/payment/status", data, {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          )
          .set(
            "x-lenda-transaction-pin",
            this.encrypt.encrypt(`${transactionPin}`)
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

  public updatePaymentMade(
    data: any,
    transactionPin?: string
  ): Observable<any> {
    return this.http
      .put(this._baseUrl + "financePayment/payment", data, {
        headers: this.setHeaders(transactionPin),
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

  public deletePaymentMade(id: any): Observable<any> {
    return this.http
      .delete(`${this._baseUrl}financePayment/payment/${id}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getInvoices(params: GetInvoicesQueryParams) {
    let paramsString = "?";

    if (params.pageNumber && params.pageSize) {
      paramsString += `pageNumber=${params.pageNumber}&pageSize=${params.pageSize}`;
    }

    if (params.customerId) {
      paramsString += `&customerId=${params.customerId}`;
    }

    if (params.statusFilter) {
      paramsString += `&statusFilter.operator=${params.statusFilter.operator}`;
      params.statusFilter.paymentStatuses && params.statusFilter.paymentStatuses.forEach((status) => {
        paramsString += `&statusFilter.paymentStatuses=${status}`;
      });
      params.statusFilter.status && params.statusFilter.status.forEach((status) => {
        paramsString += `&statusFilter.status=${status}`;
      });

      if (params.selectedSearchColumn && params.keyword) {
        paramsString += `&selectedSearchColumn=${params.selectedSearchColumn}&keyword=${params.keyword}`
      }
    }

    return this.http
      .get<GetInvoicesResBody>(
        this._baseUrl + "invoicemanagement/invoices" + paramsString,
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

  public getInvoice(invoiceId: number) {
    return this.http
      .get<{ data: InvoiceDetails }>(
        this._baseUrl + "invoicemanagement/" + invoiceId,
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

  public getInvoiceActivityLogs(invoiceId: number): Observable<any> {
    return this.http
      .get(this._baseUrl + `invoicemanagement/activities/${invoiceId}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  private setHeaders(transactionPin?: string): HttpHeaders {
    if (!transactionPin) {
      return new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this._getToken() : ""
      );
    } else {
      return new HttpHeaders()
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
        )
        .set("x-lenda-transaction-pin", this.encrypt.encrypt(transactionPin));
    }
  }

  public createInvoice(data: any, transactionPin?: string): Observable<any> {
    return this.http
      .post(this._baseUrl + "invoicemanagement", data, {
        headers: this.setHeaders(transactionPin),
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

  public invoiceApproval(data: any, transactionPin: string): Observable<any> {
    return this.http
      .post(this._baseUrl + "invoicemanagement/ApproveInvoiceProcess", data, {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
          )
          .set("x-lenda-transaction-pin", this.encrypt.encrypt(transactionPin)),
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

  public updateInvoice(data: any, transactionPin?: string): Observable<any> {
    return this.http
      .put(this._baseUrl + "invoicemanagement", data, {
        headers: this.setHeaders(transactionPin),
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

  public deleteInvoice(invoiceId: number): Observable<any> {
    return this.http
      .delete(this._baseUrl + "invoicemanagement/" + invoiceId, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public getTransactionLocks(): Observable<any> {
    return this.http
      .get(this._baseUrl + `TransactionLock`, {
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

  public setTransactionLock(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "TransactionLock/set", data, {
        headers: new HttpHeaders().set(
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

  public lockAllTransaction(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "TransactionLock/lockall", data, {
        headers: new HttpHeaders().set(
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

  public setPartialTransactionLock(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "TransactionLock/partial/set", data, {
        headers: new HttpHeaders().set(
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

  public unlockTransaction(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "TransactionLock/disable", data, {
        headers: new HttpHeaders().set(
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

  public unlockAllTransaction(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "TransactionLock/unlockall", data, {
        headers: new HttpHeaders().set(
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

  public disablePartialTransactionLock(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "TransactionLock/partial/disable", data, {
        headers: new HttpHeaders().set(
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

  public getAccountsByClass(model: any): Observable<any> {
    return this.http
      .get(this._baseUrl + `AccountClassification`, {
        params: model,
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public classifyAccount(data: any): Observable<any> {
    return this.http
      .post(this._baseUrl + "AccountClassification", data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public deleteAccountFromClass(accountClassId: number): Observable<any> {
    return this.http
      .delete(this._baseUrl + "AccountClassification/" + accountClassId, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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
  public getFiscalYearConfig(): Observable<any> {
    return this.http
      .get(this._baseUrl + "financesetup/fiscalyearsetup", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  public updateFiscalYearConfig(data: any): Observable<any> {
    return this.http
      .post(this._baseUrl + "financesetup/fiscalyear/configure", data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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
  public getOpeningBalances(): Observable<any> {
    return this.http
      .get(this._baseUrl + "ledgertransactions/opening-balances", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  getOpeningBalancesTemplate(): Observable<any> {
    return this.http
      .get(this._baseUrl + "ledgertransactions/opening-balances/template", {
        responseType: "blob" as "json",
        headers: new HttpHeaders().set(
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

  public updateOpeningBalances(data: any): Observable<any> {
    return this.http
      .post(this._baseUrl + "ledgertransactions/opening-balances", data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
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

  importOpeningBalances(data): Observable<any> {
    return this.http
      .post(
        this._baseUrl + "ledgertransactions/opening-balances/import",
        data,
        {
          headers: new HttpHeaders().set(
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

  getDeepLinkingUrl(relatedEntity: { name: string; id: number }) {
    const name = relatedEntity.name.toLowerCase();
    const id = relatedEntity.id;
    let url: string;
    if (name === "invoice") {
      url = `/finance/invoices?invoiceId=${id}`;
    } else if (name === "bill") {
      url = `/finance/bills/all?billId=${id}`;
    } else if (
      name === "asset" ||
      name === "assetaddition" ||
      name === "assetdisposal" ||
      name === "assetrevaluation" ||
      name === "assetdepreciation"
    ) {
      url = `/finance/assets/all?assetId=${id}`;
    } else if (name === "journal") {
      url = `/finance/journals?journalId=${id}`;
    } else if (name === "cashadvance") {
      url = `/finance/cash-advance/all?cashAdvanceId=${id}`;
    } else if (name === "paymentreceived") {
      url = `/finance/payments-received?paymentReceivedId=${id}`;
    } else if (name === "expense") {
      url = `/finance/expenses?expenseId=${id}`;
    } else if (name === "vendorcreditnote") {
      url = `/finance/vendor-credit-notes?vcnId=${id}`;
    } else if (name === "paymentmade") {
      url = `/finance/payments-made?paymentMadeId=${id}`;
    } else if (name === "creditnote") {
      url = `/finance/credit-notes?creditNoteId=${id}`;
    } else if (name === "pettycashtransaction") {
      url = `/finance/pettycash/transaction?pctId=${id}`;
    } else if (name === "purchaseorder") {
      url = `/finance/purchase-orders?purchaseOrderId=${id}`;
    } else if (name === "loanpayment") {
      url = `/loan/payments?loanPaymentId=${id}`;
    } else if (name === "loandisbursement") {
      url = `/loan/loans?id=${id}`;
    } else if (name === "investmentinterestexpense") {
      url = "/treasury/investmentreports?interestAccruedReport=1";
    } else if (name === "loansinterestincome") {
      url = "/loan/reports?interestIncome=1";
    }

    return url;
  }

  downloadCustomerImportTemplate(){
    return this.http
      .get<Blob>(`${this._baseUrl}v1/FinanceCustomers/import/template`, {
        responseType: "blob" as "json",
        headers: new HttpHeaders().set(
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

  importCustomers(data:FormData): Observable<any> {
    return this.http
      .post(this._baseUrl + "v1/financecustomers/import", data, {
        headers: new HttpHeaders().set(
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

  downloadVendorImportTemplate(): Observable<any> {
    return this.http
      .get(this._baseUrl + "vendormanagement/vendors/import/template", {
        responseType: "blob" as "json",
        headers: new HttpHeaders().set(
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

  importVendors(data): Observable<any> {
    return this.http
      .post(this._baseUrl + "vendormanagement/vendors/import", data, {
        headers: new HttpHeaders().set(
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

  downloadJournalImportTemplate(){
    return this.http.get(`${this._baseUrl}journal/journals/import/template`, {
      responseType: "blob",
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
        ),
      observe: "response",
    });
  }

  uploadJournals(file:FormData){
    return this.http.post(`${this._baseUrl}journal/import`, file, {
      headers: new HttpHeaders()
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this._getToken() : ""
        ),
      observe: "response",
    });
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
