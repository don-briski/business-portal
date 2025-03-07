import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import {
  AddEditPettyCashTransactionReqBody,
  PettyCash,
  PettyCashTransactionActivationModel,
  PettyCashTransactionFetchModel,
} from "src/app/modules/finance/models/petty-cash-transaction.model";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { EncryptService } from "./encrypt.service";
import { toFormData } from "../util/finance/financeHelper";

@Injectable({
  providedIn: "root",
})
export class PettyCashTransactionService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: string;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private encrypt: EncryptService
  ) {}

  public createPettyCashTransaction(
    data: AddEditPettyCashTransactionReqBody
  ) {
    const formData = toFormData(data);
    return this.http
      .post(this.baseUrl + "PettyCashTransaction/raise", formData, {
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

  public updatePettyCashTransaction(
    data: AddEditPettyCashTransactionReqBody
  ) {
    const formData = toFormData(data);
    return this.http
      .put(this.baseUrl + "PettyCashTransaction", formData, {
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

  public updatePettyCashTransactionApprovalStatus(
    data: PettyCashTransactionActivationModel
  ): Observable<any> {
    data.transactionPin = this.encrypt.encrypt(data.transactionPin);
    const model = {
      comment: data?.comment,
      pettyCashId: data?.pettyCashTransactionId
    }
    if (data?.activationOption.toLowerCase() === 'approve') {
      model['isApproved'] = true;
      model['isRedrafted'] = false;
      model['isRejected'] = false;
    } else if (data?.activationOption.toLowerCase() === 'redraft') {
      model['isApproved'] = false;
      model['isRedrafted'] = true;
      model['isRejected'] = false;
    } else {
      model['isApproved'] = false;
      model['isRedrafted'] = false;
      model['isRejected'] = true;
    }
    return this.http
      .put(this.baseUrl + "PettyCashTransaction/review", model, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        )
        .set("x-lenda-transaction-pin", data?.transactionPin),
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

  public getPettyCashTransactions(
    data: PettyCashTransactionFetchModel
  ): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "PettyCashTransaction/GetPettyCashTransactions",
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

  public getPettyCashTransactionById(
    pettyCashTransactionId: string
  ) {
    return this.http
      .get<PettyCash>(this.baseUrl + `PettyCashTransaction/${pettyCashTransactionId}`, {
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

  public getPettyCashTransactionByCode(
    pettyCashTransactionCode: any
  ): Observable<any> {
    return this.http
      .get(
        this.baseUrl + `PettyCashTransaction/Code/${pettyCashTransactionCode}`,
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

  public getPettyCashRequestByCode(
    pettyCashTransactionCode: any
  ): Observable<any> {
    return this.http
      .get(
        this.baseUrl + `PettyCashTransaction/Code/${pettyCashTransactionCode}`,
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

  public getActivities(pettyCashTransactionId: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `PettyCashTransaction/GetActivities/${pettyCashTransactionId}`,
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
  public getReconciliationLog(pettyCashTransactionId: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `PettyCashTransaction/GetReconciliationByPettyCashId?pettyCashTransactionId=${pettyCashTransactionId}`,
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
  public logReconciliation(model: FormData, isEditing: boolean): Observable<any> {
    return this.http
      .put(
        this.baseUrl +
          `PettyCashTransaction/Reconciliation/log${isEditing ? '/edit' : ''}`, model,
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
  public logReconciliationApprovalStatus(model: any): Observable<any> {
    model.transactionPin = this.encrypt.encrypt(model.transactionPin);
    return this.http
      .put(
        this.baseUrl +
          `PettyCashTransaction/Reconciliation/approvelog`, model,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set("x-lenda-transaction-pin", model.transactionPin),
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

  public logBulkReconciliationApprovalStatus(model: any): Observable<any> {
    model.transactionPin = this.encrypt.encrypt(model.transactionPin);
    return this.http
      .post(
        this.baseUrl +
          `PettyCashTransaction/Reconciliation/bulkreviewlogs`, model,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set("x-lenda-transaction-pin", model.transactionPin),
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

  public getAttachedFiles(pettyCashTransactionId: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `PettyCashTransaction/GetAttachedFiles/${pettyCashTransactionId}`,
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

  public getStaff(model?): Observable<any> {
    return this.http
      .get(this.baseUrl + "PettyCashTransaction/Staff", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params:model,
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

  // Private Methods
  public getToken() {
    return JSON.parse(sessionStorage.token);
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
        this.userToken = authToken;
      }
      return true;
    } catch (e) {}
  }
}
