import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";

@Injectable({
  providedIn: "root",
})
export class PermissionsService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler
  ) {}

  httpOptions = {
    // tslint:disable-next-line:max-line-length
    headers: new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: "Bearer " + JSON.parse(sessionStorage.token),
    }),
  };

  /**
   * fetch roles
   */
  public FetchRoles(): Observable<any> {
    return this.http
      .get(this.baseUrl + "permissions/fetch_roles", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null
              ? "Bearer " + JSON.parse(sessionStorage.token)
              : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  /**
   *
   * Add Role
   */
  public AddRole(val: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "permissions/add_matrix", val, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  /**
   *
   * Edit Role
   */
  public EditRole(val: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "permissions/edit_matrix", val, {
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  /**
   *
   * Delete Role
   */
  public DeleteRole(id: any, val: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "permissions/delete_roles/" + id + "/" + val, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null
              ? "Bearer " + JSON.parse(sessionStorage.token)
              : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  /**
   *
   * Remove Permission
   */
  public RemovePermission(id, roleid, permid): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "permissions/delete_permission/" +
          id +
          "/" +
          permid +
          "/" +
          roleid,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null
                ? "Bearer " + JSON.parse(sessionStorage.token)
                : ""
            ),
          observe: "response",
        }
      )
      .pipe(
        tap(
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  /**
   *
   * Fetch permissions
   */
  public FetchPermissions(): Observable<any> {
    return this.http
      .get(this.baseUrl + "permissions/fetch_permissions", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null
              ? "Bearer " + JSON.parse(sessionStorage.token)
              : ""
          ),
        observe: "response",
      })
      .pipe(
        tap(
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
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
    } catch (e) {
      return e;
    }
  }

  public getToken() {
    return JSON.parse(sessionStorage.token);
  }
}
