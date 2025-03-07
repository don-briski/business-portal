import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { CreateDepositAccountFeeModel, CreateDepositAccountModel, CreateDepositAccountTransactionModel, DepositAccountsRequestModel, DepositAccountTransactionRequestModel, DepositApplicationsRequestModel, EditDepositAccountModel, TempDepositStatusUpdateModel } from "../modules/deposit/models/deposit-account.model";
import { GetRequestInterface } from "../modules/deposit/models/get-request.interface";
import { EncryptService } from "./encrypt.service";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";

@Injectable({
  providedIn: "root",
})
export class DepositAccountService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: string;
  public accountToCreate$ = new BehaviorSubject<string>(null);
  // public existingCustomer$ = new BehaviorSubject<any>(null);
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
  ) {}


  public createDepositAccount(data: FormData): Observable<any> {
    return this.http
      .post(this.baseUrl + "DepositAccount", data, {
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

  public setDepositAccountStatus(data: TempDepositStatusUpdateModel): Observable<any> {
    return this.http
      .put(this.baseUrl + "DepositAccount/status", data, {
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

  public getDepositAccountApplications(data: DepositApplicationsRequestModel): Observable<any> {
    return this.http
      .post(this.baseUrl + "DepositAccount/applications", data, {
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

  public getDepositAccountApplicationById(id: any): Observable<any> {
    return this.http
      .get(this.baseUrl + `DepositAccount/application/${id}`, {
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

  public editDepositAccountApplication(data: EditDepositAccountModel): Observable<any> {
    return this.http
      .put(this.baseUrl + "DepositAccount/application/edit", data, {
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

  public getDepositAccounts(data: DepositAccountsRequestModel): Observable<any> {
    return this.http
      .post(this.baseUrl + "DepositAccount/accounts", data, {
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

  public getDepositAccountById(id: any): Observable<any> {
    return this.http
      .get(this.baseUrl + `DepositAccount/account/${id}`, {
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

  public createDepositAccountTransaction(data: CreateDepositAccountTransactionModel): Observable<any> {
    return this.http
      .post(this.baseUrl + `DepositAccount/transaction`,
        data, {
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

  public createDepositAccountFee(data: CreateDepositAccountFeeModel): Observable<any> {
    return this.http
      .post(this.baseUrl + `DepositAccount/fee`
        , data, {
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

  public getDepositAccountTransactions(data: DepositAccountTransactionRequestModel): Observable<any> {
    return this.http
      .post(this.baseUrl + `DepositAccount/account/transactions`
        , data, {
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

  public setAccountToCreate(data: string): void {
    this.accountToCreate$.next(data);
  }

  static getExistingCustomer(): any {
    const customer = localStorage.getItem('existingCustomer');

    return customer ? JSON.parse(customer) : null;
  }

  public setExistingCustomer(data: any): void {
    localStorage.setItem('existingCustomer', JSON.stringify(data));
    // this.existingCustomer$.next(data);
  }

  public removeExistingCustomer(): void {
    localStorage.removeItem('existingCustomer');
  }


  // Private Methods
  private getToken() {
    return JSON.parse(sessionStorage.token);
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
}
