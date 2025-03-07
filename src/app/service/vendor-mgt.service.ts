import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TokenRefreshErrorHandler } from './TokenRefreshErrorHandler';
import { FinancePersonImportReqBody, FinancePersonImportResBody } from '../modules/finance/finance.types';
import { toFormData } from '../util/finance/financeHelper';

@Injectable({
  providedIn: 'root'
})
export class VendorMgtService {

  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;

  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public tokenRefreshError: TokenRefreshErrorHandler
  ) { }

  public spoolAllVendors(
    model: any
  ): Observable<any> {
    let params = new HttpParams();
    Object.keys(model).forEach(item => {
      params = params.set(item, <any>model[item]);
    })
    return this.http
      .get(
        this.baseUrl + "VendorManagement",
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            ),
          observe: "response",
          params
        }
      )
      .pipe(
        tap(
          (res) => {
            this.setToken(res.headers);
            let body = res.body
            return body;
          },
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ), map((res: any) => {
          return res.body
        })
      );
  }

  getVendorBalancesTemplate() {
    return this.http
      .get<Blob>(`${this.baseUrl}VendorManagement/vendors/balance/import/template`, {
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

  importVendorBalances(payload:FinancePersonImportReqBody) {
    return this.http
      .post<FinancePersonImportResBody>(`${this.baseUrl}vendorManagement/vendors/balance/import`,toFormData(payload), {
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

  private getToken() {
    return JSON.parse(sessionStorage.token);
  }
}
