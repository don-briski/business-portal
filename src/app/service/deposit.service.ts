import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, Observable } from "rxjs";
import { map, tap } from "rxjs/operators";

import { environment } from "src/environments/environment";
import { CreateGroup } from "../model/create-group.interface";
import { GroupRole } from "../model/grouprole.interface";
import { UpdateGroup } from "../model/update-group.interface";
import {
  CreateDepositSetupCodesReqBody,
  GetDepositGroupResBody,
  GetDepositGroupsResBody,
} from "../modules/deposit/models/deposit-account.model";
import { DepositProduct } from "../modules/deposit/models/deposit-product.model";
import { GetRequestInterface } from "../modules/deposit/models/get-request.interface";
import { toFormData } from "../util/finance/financeHelper";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";

@Injectable({
  providedIn: "root",
})
export class DepositService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: string;
  private depositProductEdit$ = new BehaviorSubject<DepositProduct>(null);
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  public createDepositProduct(data: DepositProduct): Observable<any> {
    return this.http
      .post(this.baseUrl + "DepositSetup/depositProduct", data, {
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
  public updateDepositProduct(data: DepositProduct): Observable<any> {
    return this.http
      .put(this.baseUrl + "DepositSetup/depositProduct", data, {
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

  public deleteDepositProduct(id: any): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}DepositSetup/depositProduct/${id}`, {
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

  public getGroupRoles(): Observable<any> {
    return this.http
      .get(this.baseUrl + "DepositSetup/grouproles", {
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
          return res.body;
        }),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public getGroup(groupId: number): Observable<any> {
    return this.http
      .get(this.baseUrl + `depositSetup/group/${groupId}`, {
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
          return res.body;
        }),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public createGroup(data: CreateGroup): Observable<any> {
    return this.http
      .post(this.baseUrl + "DepositSetup/group", data, {
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
          return res;
        })
      );
  }

  public updateGroup(data: UpdateGroup): Observable<any> {
    return this.http
      .put(this.baseUrl + "DepositSetup/group", data, {
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

  public saveGroupRole(data: GroupRole[]): Observable<any> {
    return this.http
      .put(this.baseUrl + "DepositSetup/groupRoles", data, {
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
          return res;
        })
      );
  }

  public deleteGroupRole(id: number): Observable<any> {
    return this.http
      .delete(this.baseUrl + `DepositSetup/grouprole/${id}`, {
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
          return res.body;
        }),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public getAllDepositProduct(request: GetRequestInterface): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `DepositSetup/depositProduct/products/${request.pageNumber}/${request.pageSize}`,
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
            return res.body;
          },
          (error) => this.tokenRefreshError.handleError(error)
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public getDepositProductById(productId: number): Observable<any> {
    return this.http
      .get(this.baseUrl + `DepositSetup/depositProduct/${productId}`, {
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
            return res.body;
          },
          (error) => this.tokenRefreshError.handleError(error)
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  createFixedDepositAccount(data: any) {
    const formData = toFormData(data);

    return this.http
      .post(`${this.baseUrl}DepositAccount`, formData, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
          return res.body;
        })
      );
  }

  public changePage(request: GetRequestInterface): Observable<any> {
    return this.getAllDepositProduct(request);
  }

  public getAllFees(): Observable<any> {
    return this.http
      .get(this.baseUrl + `DepositSetup/fees`, {
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
            return res.body;
          },
          (error) => this.tokenRefreshError.handleError(error)
        ),
        map((res: any) => {
          return res.body;
        })
      );
  }

  public setDepositProductEdit(product: DepositProduct): void {
    this.depositProductEdit$.next(product);
  }

  public getDepositProductEdit(): Observable<DepositProduct> {
    return this.depositProductEdit$;
  }

  createDepositSetupCodes(data: CreateDepositSetupCodesReqBody) {
    return this.http
      .post(`${this.baseUrl}Configuration/updatedepositsetupinfo`, data, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(tap((res) => this.setToken(res.headers)));
  }

  getDepositGroups(data: {
    pageNumber: number;
    pageSize: number;
    keyword?: string;
  }) {
    const params = new HttpParams({
      fromObject: {
        pageNumber: String(data.pageNumber),
        pageSize: String(data.pageSize),
        keyword: String(data.keyword),
      },
    });

    return this.http
      .get<GetDepositGroupsResBody>(`${this.baseUrl}DepositSetup/groups`, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params,
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getDepositGroup(id: number) {
    return this.http
      .get<GetDepositGroupResBody>(`${this.baseUrl}DepositSetup/group/${id}`, {
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
