import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { TokenRefreshErrorHandler } from './TokenRefreshErrorHandler';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import * as moment from "moment";
import { start } from 'repl';

@Injectable({
  providedIn: 'root'
})
export class WrappedService {

  private baseUrl = environment.apiUrl;
  private decodedToken: any;
  private userToken: any;
  private startDate: any;
  private endDate: any;
  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {

    const lastYear = new Date().getFullYear() - 1;
    const startDate = new Date(lastYear, 0, 1);
    const endDate = new Date(lastYear, 11, 31);
    this.startDate = moment(startDate).format('YYYY-MM-DD');
    this.endDate = moment(endDate).format('YYYY-MM-DD');
   }

  getLoanCreationMetrics(): Observable<any> {
    let params = new HttpParams();
    params = params.set('StartDate', this.startDate);
    params = params.set('EndDate', this.endDate);
    return this.http
      .get(
        this.baseUrl + "wrapped/LoanCreationMetrics",
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
  getLoanUnderwriterMetrics(): Observable<any> {
    let params = new HttpParams();
    params = params.set('StartDate', this.startDate);
    params = params.set('EndDate', this.endDate);
    return this.http
      .get(
        this.baseUrl + "wrapped/LoanUnderwriterMetrics",
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
  getLoanDisbursementMetrics(): Observable<any> {
    let params = new HttpParams();
    params = params.set('StartDate', this.startDate);
    params = params.set('EndDate', this.endDate);
    return this.http
      .get(
        this.baseUrl + "wrapped/loandisbursementMetrics",
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
  getGeneralMetrics(): Observable<any> {
    let params = new HttpParams();
    params = params.set('StartDate', this.startDate);
    params = params.set('EndDate', this.endDate);
    return this.http
      .get(
        this.baseUrl + "wrapped/generalmetrics",
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
  getLoanApprovalMetrics(): Observable<any> {
    let params = new HttpParams();
    params = params.set('StartDate', this.startDate);
    params = params.set('EndDate', this.endDate);
    return this.http
      .get(
        this.baseUrl + "wrapped/LoanApprovalMetrics",
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

  getInvestmentApprovalMetrics(): Observable<any> {
    let params = new HttpParams();
    params = params.set('StartDate', this.startDate);
    params = params.set('EndDate', this.endDate);
    return this.http
      .get(
        this.baseUrl + "wrapped/InvestmentApprovalMetrics",
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

  getInvestmentCreatedMetrics(): Observable<any> {
    let params = new HttpParams();
    params = params.set('StartDate', this.startDate);
    params = params.set('EndDate', this.endDate);
    return this.http
      .get(
        this.baseUrl + "wrapped/InvestmentsCreatedMetrics",
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

  getLiquidatedInvestmentMetrics(): Observable<any> {
    let params = new HttpParams();
    params = params.set('StartDate', this.startDate);
    params = params.set('EndDate', this.endDate);
    return this.http
      .get(
        this.baseUrl + "wrapped/LiquidatedInvestmentsMetrics",
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

