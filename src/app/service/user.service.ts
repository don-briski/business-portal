import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, of, Subject } from "rxjs";
import { tap, shareReplay, map } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { AuthService } from "./auth.service";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { EncryptService } from "./encrypt.service";
import {
  GenericSpoolRequestPayload,
  GenericSpoolResponsePayload,
  Module,
  User,
} from "../modules/shared/shared.types";
import {
  CreateUserResBody,
  GetClaimedAppReviewersResponse,
  PermissionClassification,
  Role,
  RoleDetail,
  UpsertRoleRequestPayload,
} from "../modules/configuration/models/user.type";
import { GrowthbookService } from "./growthbook.service";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;
  public userInfo$: any;
  private _currentUser?: User;
  userPermissions: string[] = [];
  userUpdated = new Subject<User>();

  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public authService: AuthService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    public encrypt: EncryptService,
    private growthbookService: GrowthbookService
  ) {}

  set currentUser(user: User) {
    this._currentUser = user;
  }

  public AssignRole(value: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/assignrole", value, {
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

  public checkViewGlobalPermission(id: number): Observable<any> {
    return this.http
      .get(this.baseUrl + "permissions/check_view_global?id=" + id, {
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  /**
   *  @deprecated this method is deprecated use fetchRoles
   */
  public fetchRolesInBranch(id: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "user/fetchroles/" + id, {
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public getUserInfo(
    userId: string | number,
    options = { fromDb: false }
  ): Observable<any> {
    const user = this.getUserFromStorage();
    if (user && !options.fromDb) {
      return of({ body: user });
    }

    return this.http
      .get<User>(this.baseUrl + "user/" + userId, {
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
        tap((res) => {
          this.saveUserToStorage(res.body);
          this.setToken(res.headers);
        })
      );
  }

  private saveUserToStorage(user: User) {
    const encodedUser = JSON.stringify(user);
    let host = window.location.hostname;
    let split = host.split(".");
    const subdomain = split[0];
    const domain = split[1];

    this.growthbookService.growthbook.setAttributes({
      email: user.emailAddress,
      id: user.userId,
      employee: user.roleName,
      business: subdomain,
      domain
    });
    sessionStorage.setItem("encodedUser", encodedUser);
  }

  private getUserFromStorage(): User | null {
    const encodedUser = sessionStorage.getItem("encodedUser");
    if (!encodedUser) return null;

    const decodedUser = JSON.parse(encodedUser);
    return decodedUser;
  }

  public FetchAllUsers(
    data: any,
    options?: { usingFilters: boolean },
    paramsValue?: any,
  ): Observable<any> {
    let req: Observable<any>;
    if (options?.usingFilters) {

      const paramsObj = {};
      if (data?.branchId) paramsObj["branchId"] = data.branchId;
      if (data?.roleId) paramsObj["roleId"] = data.roleId;
      if (data?.teamId) paramsObj["teamId"] = data.teamId;

      const params = new HttpParams({
        fromObject:  { ...paramsValue }
      });

      req = this.http.get(this.baseUrl + "user/users/v2", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params,
        observe: "response",
      });
    } else {
      req = this.http.post(this.baseUrl + "user/alluserspaginated", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      });
    }

    return req.pipe(
      tap((res) => {
        this.setToken(res.headers);
      })
    )
  }

  public FetchAllUsersPaginated(
    url: string,
    data: any,
    options?: { usingFilters: boolean }
  ): Observable<any> {
    let req: Observable<any>;

    if (options?.usingFilters) {
      const paramsObj = {};
      if (data?.branchId) paramsObj["branchId"] = data.branchId;
      if (data?.roleId) paramsObj["roleId"] = data.roleId;
      if (data?.teamId) paramsObj["teamId"] = data.teamId;

      const params = new HttpParams({
        fromObject: paramsObj,
      });

      req = this.http.get(this.baseUrl + "user/users", {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params,
        observe: "response",
      });
    } else {
      req = this.http.post(this.baseUrl + "user/" + url, data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      });
    }

    return req.pipe(
      tap((res) => {
        this.setToken(res.headers);
      })
    );
  }

  getAllUsersWithPermissions(permission: string) {
    const params = new HttpParams({ fromObject: { Filter: [permission] } });
    return this.http.get<
      GenericSpoolRequestPayload<GetClaimedAppReviewersResponse>
    >(`${this.baseUrl}user/users/summary`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
      params,
    });
  }

  getUsersWithRequiredRoles(loanId: number) {
    const params = new HttpParams({ fromObject: { loanId } });

    return this.http.get<GetClaimedAppReviewersResponse[]>(
      `${this.baseUrl}user/reassignment-users`,
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
    );
  }

  public getAllUsers(id: string): Observable<any> {
    return this.http
      .get(this.baseUrl + "user/allusers/" + id, {
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

  public AddBranch(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/addbranch", data, {
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

  public fetchAllBranches(): Observable<any> {
    if (!this.userInfo$) {
      this.userInfo$ = this.http
        .get(this.baseUrl + "user/allbranches", {
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
          tap((res) => {
            this.setToken(res.headers);
          }),
          shareReplay()
        );
    }
    return this.userInfo$;
  }

  public fetchBranches(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/allbranchespaginated", data, {
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

  public FetchAllTeams(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/allteamspaginated", data, {
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

  public FetchAllUsersInBranch(nameid: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "user/allusers/" + nameid, {
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public GetAllUsersInBranch(nameid: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "user/usersinbranch/" + nameid, {
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public customerSearchByUniqueId(value: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "customer/search?parameter=" +
          value?.parameter +
          "&searchType=" +
          value?.searchType,
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public FetchTeams(): Observable<any> {
    return this.http
      .get(this.baseUrl + "user/allteams", {
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
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public AddNewTeam(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/newteam", model, {
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

  public updateTeamName(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/updateteam", model, {
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

  public deleteTeam(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/deleteteam", model, {
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

  public EditBranch(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/updatebranch", model, {
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

  public deleteBranch(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/deletebranch", model, {
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

  public AddNewUser(model: any) {
    model["Password"] = this.encrypt.encrypt(model["Password"]);
    const formData = new FormData();
    for (const property in model) {
      if (model.hasOwnProperty(property)) {
        if (model[property] != null) {
          formData.append(property, model[property]);
        }
      }
    }
    return this.http
      .post<CreateUserResBody>(this.baseUrl + "user/newuser", formData, {
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

  public UpdateUser(model: any): Observable<any> {
    model["Password"] = this.encrypt.encrypt(model["Password"]);
    const formData = new FormData();
    for (const property in model) {
      if (model.hasOwnProperty(property)) {
        if (model[property] != null) {
          formData.append(property, model[property]);
        }
      }
    }
    return this.http
      .post(this.baseUrl + "user/updateuser", formData, {
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

  public UploadFile(fileSelected: File): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/profile_picture", fileSelected, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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

  public profileUpdate(model: any) {
    const formData = new FormData();
    for (const property in model) {
      if (model.hasOwnProperty(property)) {
        if (model[property] != null) {
          formData.append(property, model[property]);
        }
      }
    }
    return this.http
      .post<User>(this.baseUrl + "user/profileupdate", formData, {
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

  public updatePassword(data: any): Observable<any> {
    data["newPassword"] = this.encrypt.encrypt(data["newPassword"]);
    data["oldPassword"] = this.encrypt.encrypt(data["oldPassword"]);

    return this.http
      .patch(this.baseUrl + "user/password", data, {
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

  public updateKey(data: any): Observable<any> {
    data["currentPassword"] = this.encrypt.encrypt(data["currentPassword"]);
    data["key"] = this.encrypt.encrypt(data["key"]);
    return this.http
      .post(this.baseUrl + "user/keyupdate", data, {
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

  public disableUserAccount(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/disableaccount", data, {
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

  public enableUserAccount(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "user/enableaccount", data, {
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

  public altCustomerCreation(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "customer/addcustomeralternative", data, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      })
      .pipe(tap((res) => res));
  }

  upsertRole(payload: UpsertRoleRequestPayload) {
    return this.http.post(`${this.baseUrl}roles`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  fetchRoles(payload: GenericSpoolRequestPayload) {
    return this.http.get<GenericSpoolResponsePayload<Role>>(
      `${this.baseUrl}roles`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: payload }),
        observe: "response",
      }
    );
  }

  getRole(id: number) {
    return this.http.get<{ data: RoleDetail }>(`${this.baseUrl}roles/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  deleteRole(id: number) {
    return this.http.delete(`${this.baseUrl}roles/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getAllowedModules() {
    return this.http.get<Module[]>(`${this.baseUrl}user/modules`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  fetchPermissionsByModules(id: number) {
    return this.http.get<{ data: PermissionClassification[] }>(
      `${this.baseUrl}permissions/module/${id}`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
      }
    );
  }

  fetchRolePermissions(roleId: number, moduleId: number) {
    return this.http.get<{ data: PermissionClassification[] }>(
      `${this.baseUrl}permissions`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: { roleId, moduleId } }),
        observe: "response",
      }
    );
  }
}
