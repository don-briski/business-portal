import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import {
  CreateItemModel,
  ItemFetchModel,
  ItemLimitedViewModel,
  UpdateItemModel,
} from "src/app/modules/finance/models/item.model";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { FinanceItem } from "../modules/finance/finance.types";

@Injectable({
  providedIn: "root",
})
export class ItemService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: string;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  public createItem(data: CreateItemModel): Observable<any> {
    const formData = new FormData();
    for (const property in data) {
      if (data.hasOwnProperty(property)) {
        if (property == "files") {
          for (var i = 0; i < data["files"].length; i++) {
            formData.append("files", data["files"][i]);
          }
          continue;
        }

        if (data[property] != null) {
          formData.append(property, data[property]);
        }
      }
    }
    return this.http
      .post(this.baseUrl + "Items", formData, {
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

  public updateItem(data: UpdateItemModel): Observable<any> {
    const formData = new FormData();
    for (const property in data) {
      if (data.hasOwnProperty(property)) {
        if (property == "files") {
          for (var i = 0; i < data["files"].length; i++) {
            formData.append("files", data["files"][i]);
          }
          continue;
        }

        if (data[property] != null) {
          formData.append(property, data[property]);
        }
      }
    }
    return this.http
      .put(this.baseUrl + "Items", formData, {
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

  public getItems(data: ItemFetchModel): Observable<any> {
    return this.http
      .post(this.baseUrl + "Items/GetItems", data, {
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
 * @deprecated The method should not be used. Use getAssestAndExpenseItems instead.
 */
  public getSalesPurchaseItems(data): Observable<any> {
    const params = new HttpParams({ fromObject: data });
    return this.http
      .get(this.baseUrl + "Items", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
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

  public getAssestAndExpenseItems(
    data?: {searchTerm?: string, itemType?: 'AssetItem' | 'ExpenseItem'},
    type?: "Bills" | "Inv" | "PO" | "VCN"
  ) {
    let url: string;
    type === "Bills" || type === "PO" || type === "VCN"
      ? (url = "items/getassetandexpenseitemslimitedviewforpurchases")
      : (url = "items/getassetandexpenseitemslimitedviewforsales");
    return this.http
      .post<{data: FinanceItem[], status: boolean}>(this.baseUrl + url, data, {
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
          },
        )
      );
  }

  public getItemsLimitedView(data: ItemLimitedViewModel): Observable<any> {
    return this.http
      .post(this.baseUrl + "Items/GetItemsLimitedView", data, {
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

  public getTaxesLimitedView(): Observable<any> {
    return this.http
      .get(this.baseUrl + "FinanceSetup/GetTaxesLimitedView", {
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

  public getItemById(itemId: any): Observable<any> {
    return this.http
      .get(this.baseUrl + `Items/${itemId}`, {
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

  public getItemByCode(itemCode: any): Observable<any> {
    return this.http
      .get(this.baseUrl + `Items/Code/${itemCode}`, {
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

  public getActivities(itemId: any): Observable<any> {
    return this.http
      .get(this.baseUrl + `Items/Activities/${itemId}`, {
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

  public getAttachedFiles(itemId: any): Observable<any> {
    return this.http
      .get(this.baseUrl + `Items/Files/${itemId}`, {
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
