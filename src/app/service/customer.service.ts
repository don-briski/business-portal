import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { environment } from "src/environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { toFormData } from "../util/finance/financeHelper";
import { FinancePersonImportReqBody, FinancePersonImportResBody } from "../modules/finance/finance.types";

@Injectable({
  providedIn: "root",
})
export class CustomerService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: string;
  public selectedCustomer$: BehaviorSubject<any> = new BehaviorSubject<void>(
    null
  );
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  public searchCustomer(data: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `Customer/search?parameter=${data.parameter}&searchType=${data.searchType} `,
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

  public createCustomer(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "Customer/addCustomerAlternative", data, {
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

  public updateCustomerMetricsByPersonId(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "customer/updateCustomerInfo", data, {
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
            this.setToken(res?.headers);
            return res;
          },
          (error) => {
            return error;
          }
        )
      );
  }

  public deleteDuplicatePerson(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/deleteDuplicatePerson", data, {
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
            this.setToken(res?.headers);
            return res;
          },
          (error) => {
            return error;
          }
        )
      );
  }

  public setCustomer(data: any): void {
    this.selectedCustomer$.next(data);
  }

  getCustomerBalancesTemplate() {
    return this.http
      .get<Blob>(`${this.baseUrl}v1/FinanceCustomers/balance/import/template`, {
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

  importCustomerBalances(payload:FinancePersonImportReqBody) {
    return this.http
      .post<FinancePersonImportResBody>(`${this.baseUrl}v1/FinanceCustomers/balance/import`,toFormData(payload), {
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
