import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { EncryptService } from "./encrypt.service";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";

@Injectable({
  providedIn: "root",
})
export class AssetMgtService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;

  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public tokenRefreshError: TokenRefreshErrorHandler,
    public encrypt: EncryptService
  ) {}

  public spoolAllAssets(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "assetManagement/assetCards", model, {
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

  public getNBV(payload): Observable<any> {
    const params = new HttpParams({ fromObject: payload });
    return this.http
      .get(
        this.baseUrl +
          "assetManagement/assetCards/GetAssetNetBookValueAsAtTransactionDate",
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  public getLastAssetDepreciationPeriod(): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "assetManagement/assetCards/GetLastAssetDepreciationPeriod",
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public getAssetDepreciationInPeriodView(payload): Observable<any> {
    const params = new HttpParams({ fromObject: payload });
    return this.http
      .get(
        this.baseUrl +
          "assetManagement/assetCards/GetAssetToBeDepreciatedInPeriodView",
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
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

  public spoolAllAssetsDepreciationLogs(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "assetManagement/assetCards/depreciationLogs",
        model,
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
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public createAsset(model: any, transactionPin?): Observable<any> {
    let headers;
    if (transactionPin) {
      headers = new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        )
        .set(
          "x-lenda-transaction-pin",
          this.encrypt.encrypt(`${transactionPin}`)
        );
    } else {
      headers = new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        );
    }
    return this.http
      .post(this.baseUrl + "assetManagement/assetCard", model, {
        headers,
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

  public postDepreciations(logs: any): Observable<any> {
    return this.http
      .put(this.baseUrl + "assetManagement/assetCards/PostDeprecations", logs, {
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

  public postDepreciationsInperiod(logs: any): Observable<any> {
    return this.http
      .put(
        this.baseUrl + "assetManagement/assetCards/DepreciateAssetsInPeriod",
        logs,
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public postRevaluation(data: FormData): Observable<any> {
    return this.http
      .put(this.baseUrl + "assetManagement/assetCards/PostRevaluations", data, {
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
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public updateAsset(model: any, transactionPin?): Observable<any> {
    let headers;
    if (transactionPin) {
      headers = new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        )
        .set(
          "x-lenda-transaction-pin",
          this.encrypt.encrypt(`${transactionPin}`)
        );
    } else {
      headers = new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        );
    }
    return this.http
      .put(this.baseUrl + "assetManagement/assetCard", model, {
        headers,
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
  public getAssetById(id: any): Observable<any> {
    return this.http
      .get(`${this.baseUrl}assetManagement/assetCard/${id}`, {
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
  public deleteAsset(assetId: any): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}assetManagement/assetCard/${assetId}`, {
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

  private assetEditId = new BehaviorSubject<number>(null);
  public assetEditId$ = this.assetEditId.asObservable();

  public setAssetEditId(val: number): void {
    this.assetEditId.next(val);
  }

  // Sub class
  public spoolAssetSubClasses(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "assetManagement/assetSubclasses", model, {
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

  public getSubClass(id: number): Observable<any> {
    return this.http
      .get(this.baseUrl + "assetManagement/assetSubclass/" + id, {
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

  public createAssetSubClass(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "assetManagement/assetSubclass", model, {
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
  public updateAssetSubClass(model: any): Observable<any> {
    return this.http
      .put(this.baseUrl + "assetManagement/assetSubclass", model, {
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
  public deleteAssetSubClass(assetSubClassId: any): Observable<any> {
    return this.http
      .delete(
        `${this.baseUrl}assetManagement/assetSubclass/${assetSubClassId}`,
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
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  getAssetTemplate(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}AssetManagement/assetcards/import/template`, {
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

  importAssets(payload): Observable<any> {
    return this.http
      .post(this.baseUrl + "assetManagement/import", payload, {
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
