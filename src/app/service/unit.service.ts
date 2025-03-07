import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import {
  CreateUnitModel,
  UnitFetchModel,
  UnitLimitedViewModel,
  UpdateUnitModel,
} from "src/app/modules/finance/models/unit.model";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";

@Injectable({
  providedIn: "root",
})
export class UnitService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: string;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  public createUnit(data: CreateUnitModel): Observable<any> {
    return this.http
      .post(this.baseUrl + "Unit", data, {
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

  public updateUnit(data: UpdateUnitModel): Observable<any> {
    return this.http
      .put(this.baseUrl + "Unit", data, {
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

  public getUnits(data: UnitFetchModel): Observable<any> {
    return this.http
      .post(this.baseUrl + "Unit/GetUnits", data, {
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

  // public getUnitsLimitedView(data: UnitLimitedViewModel): Observable<any> {
  //   return this.http
  //     .post(this.baseUrl + "Unit/GetUnitsLimitedView", data, {
  //       headers: new HttpHeaders()
  //       .set('Content-Type', 'application/json')
  //       .set('Authorization', (sessionStorage.token != null) ? 'Bearer ' + this.getToken() : ''),
  //       observe: 'response'})
  //     .pipe(
  //       tap(
  //         (res) => {
  //           this.setToken(res.headers);
  //           return res;
  //         },
  //         (error) => this.tokenRefreshError.handleError(error)
  //       )
  //     );
  // }

  public getUnitsLimitedView(): Observable<any> {
    return this.http
      .get(this.baseUrl + "Unit/GetUnitsLimitedView", {
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

  public getUnitById(unitId: any): Observable<any> {
    return this.http
      .get(this.baseUrl + `Unit/${unitId}`, {
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

  public deleteUnit(unitId: any): Observable<any> {
    return this.http
      .delete(this.baseUrl + `Unit/${unitId}`, {
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

  public getActivities(unitId: any): Observable<any> {
    return this.http
      .get(this.baseUrl + `Unit/Activities/${unitId}`, {
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
