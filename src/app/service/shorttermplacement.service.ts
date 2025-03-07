import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { JwtHelperService } from "@auth0/angular-jwt";
import { environment } from "src/environments/environment";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { EncryptService } from "./encrypt.service";
import { AddEditPlacementTypeReqBody } from "../modules/treasury/types/placement-type";
import {
  AddEditShortTermPlacementReqBody,
  GetShortTermPlacementTypesResBody,
  GetShortTermPlacementsQueryParams,
  GetShortTermPlacementsResBody,
  PreviewSTPInvestmentScheduleReqBody,
  PreviewSTPInvestmentScheduleResBody,
  ReviewShortTermPlacementReqBody,
  ShorTermPlacementDetails,
} from "../modules/treasury/types/short-term-placement";

@Injectable({
  providedIn: "root",
})
export class ShortTermPlacementService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    public encrypt: EncryptService
  ) {}

  httpOptionsFile = {
    headers: new HttpHeaders({
      // Accept:  'application/json',
      Authorization: "Bearer " + JSON.parse(sessionStorage.token),
    }),
  };

  public getShortTermPlacementCycleSchedule(data): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "shorttermplacement/getshorttermplacementcycleschedule",
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public getShortTermPlacementTypes(data) {
    return this.http.post<GetShortTermPlacementTypesResBody>(
      this.baseUrl + "shorttermplacementtype/getshorttermplacementtypes",
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
    );
  }

  public getShortTermPlacementType(id: number): Observable<any> {
    return this.http.get(this.baseUrl + "shorttermplacementtype/" + id, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  public getActivities(id: number): Observable<any> {
    return this.http
      .get(this.baseUrl + "shorttermplacement/activities/" + id, {
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

  public getShortTermPlacementLiquidationParams(id: number): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "shorttermplacement/getshorttermplacementliquidationparameters/" +
          id,
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public addShortTermPlacementType(data: AddEditPlacementTypeReqBody) {
    return this.http
      .post(this.baseUrl + "shorttermplacementtype", data, {
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

  public reviewShortTermPlacement(data: ReviewShortTermPlacementReqBody) {
    const transactionPin = this.encrypt.encrypt(data["transactionPin"]);
    delete data["transactionPin"];

    return this.http.post(
      this.baseUrl + "shorttermplacement/shorttermplacementapprovalprocess",
      data,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set("x-lenda-transaction-pin", transactionPin),
        observe: "response",
      }
    );
  }

  public updateShortTermPlacementType(data): Observable<any> {
    return this.http
      .put(this.baseUrl + "shorttermplacementtype", data, {
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

  public addShortTermPlacement(data: AddEditShortTermPlacementReqBody) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json")
      .set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      );

    return this.http.post(this.baseUrl + "shorttermplacement", data, {
      headers: headers,
      observe: "response",
    });
  }

  public updateShortTermPlacement(data: AddEditShortTermPlacementReqBody) {
    const headers = new HttpHeaders()
      .set("Content-Type", "application/json")
      .set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      );

    return this.http.put(this.baseUrl + "shorttermplacement", data, {
      headers: headers,
      observe: "response",
    });
  }

  previewSTPInvestmentSchedule(data: PreviewSTPInvestmentScheduleReqBody) {
    return this.http.post<PreviewSTPInvestmentScheduleResBody>(
      this.baseUrl + "ShortTermPlacement/preview",
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
    );
  }

  public terminateShortTermPlacement(data): Observable<any> {
    const txPin = this.encrypt.encrypt(data["transactionPin"]);
    delete data["transactionPin"];

    return this.http
      .post(
        this.baseUrl + "shorttermplacement/terminateshorttermplacement",
        data,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set("x-lenda-transaction-pin", txPin),
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

  public fetchShortTermPlacement(id): Observable<any> {
    return this.http
      .get(this.baseUrl + `shorttermplacement/${id}`, {
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

  getShortTermPlacements(params: GetShortTermPlacementsQueryParams) {
    return this.http.get<GetShortTermPlacementsResBody>(
      this.baseUrl + "shorttermplacement",
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({ fromObject: params }),
        observe: "response",
      }
    );
  }

  public getShortTermPlacementById(id: number) {
    return this.http.get<{ data: ShorTermPlacementDetails }>(
      `${this.baseUrl}shorttermplacement/${id}`,
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

  public fetchShortTermPlacements(data: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "shorttermplacement/fetch-short-term-placement?search=" +
          data.Search +
          "&num=" +
          data.Num +
          "&skip=" +
          data.Skip,

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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public updateShortTermPlacementApproval(data): Observable<any> {
    return this.http
      .post(
        this.baseUrl +
          "shorttermplacement/update-short-term-placement-approval",
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public activateShortTermPlacement(data): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "shorttermplacement/activate-short-term-placement",
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
          (res) => res,
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public liquidateShortTermPlacement(data): Observable<any> {
    const transactionPin = this.encrypt.encrypt(data["transactionPin"]);
    delete data["transactionPin"];

    return this.http
      .post(
        this.baseUrl + "shorttermplacement/liquidateshorttermplacement",
        data,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/json")
            .set(
              "Authorization",
              sessionStorage.token != null ? "Bearer " + this.getToken() : ""
            )
            .set("x-lenda-transaction-pin", transactionPin),
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

  public editShortTermPlacement(data): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "shorttermplacement/update-short-term-placement",
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
      }
      return true;
    } catch (e) {
      return e;
    }
  }

  public getToken() {
    return JSON.parse(sessionStorage.token);
  }

  public authHeader(): { headers: HttpHeaders; observe: string } {
    return {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    };
  }
}
