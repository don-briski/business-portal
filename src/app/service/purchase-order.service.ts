import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { EncryptService } from "src/app/service/encrypt.service";

@Injectable({
  providedIn: "root",
})
export class PurchaseOrderService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;

  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public tokenRefreshError: TokenRefreshErrorHandler,
    public encrypt: EncryptService
  ) {}

  private setHeaders(transactionPin?: string): HttpHeaders {
    if (!transactionPin) {
      return new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      );
    } else {
      return new HttpHeaders()
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        )
        .set("x-lenda-transaction-pin", this.encrypt.encrypt(transactionPin));
    }
  }

  public spoolAllPurchaseOrders(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "purchaseOrder/getPurchaseOrders", model, {
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
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public createPurchaseOrder(
    data: any,
    transactionPin?: string
  ): Observable<any[]> {
    return this.http
      .post(`${this.baseUrl}purchaseOrder`, data, {
        headers: this.setHeaders(transactionPin),
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

  public approvePurchaseOrder(
    data: any,
    transactionPin?: string
  ): Observable<any[]> {
    return this.http
      .post(`${this.baseUrl}purchaseOrder/approvepurchaseorderprocess`, data, {
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

  public updatePurchaseOrder(
    data: any,
    transactionPin?: string
  ): Observable<any[]> {
    return this.http
      .put(`${this.baseUrl}purchaseOrder`, data, {
        headers: this.setHeaders(transactionPin),
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

  public getPurchaseOrderById(id: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}purchaseOrder/${id}`, {
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
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public getPOFiles(poId: number): Observable<any> {
    return this.http
      .get(this.baseUrl + `purchaseorder/files/${poId}`, {
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

  public getPoActivityLogs(purchaseOrderId: number): Observable<any> {
    return this.http
      .get(this.baseUrl + `purchaseOrder/activities/${purchaseOrderId}`, {
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

  public deletePO(id: number): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}purchaseOrder/${id}`, {
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
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
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
