import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable, of, Subject } from "rxjs";
import { environment } from "src/environments/environment";
import { JwtHelperService } from "@auth0/angular-jwt";
import { map, tap } from "rxjs/operators";
import { TokenRefreshErrorHandler } from "./TokenRefreshErrorHandler";
import { EncryptService } from "./encrypt.service";
import { SmsSetupInterface } from "../modules/configuration/models/sms-setup.interface";
import { UnderwriterReasonInterface } from "../modules/configuration/models/underwriter-reason.interface";
import { DecideSetup } from "../modules/configuration/models/decideSetup.interface";
import {
  Bank,
  BasicPaginationReqProps,
  GetDataQueryParams,
  GenericList,
  ValidatePhoneNumberResBody,
} from "../modules/shared/shared.types";
import {
  CreateLoanApprovalWorkflowDto,
  LoanApprovalWorkflow,
  LoanType,
} from "../modules/loan-section/loan.types";
import {
  RemitaSetup,
  RemitaIntegrationNameEnum,
  UpdateRemitaInfoData,
  Integration,
  ValidateBVNResBody,
  InvestmentInfoSetupDto,
  InvestmentCertificateInfoSetup,
} from "../model/configuration";
import { WebhookConfig } from "../modules/configuration/models/notifications.interface";
import {
  DisbursementPartnersResBody,
  PaystackFormReqBody,
  PaystackInfo,
  VerifyBankAccount,
  VerifyBankAccountRes,
} from "../modules/configuration/models/configuration";
import {
  ActivateSmsProvider,
  SmsProviders,
} from "../modules/configuration/models/sms-provider-info.interface";

@Injectable({
  providedIn: "root",
})
export class ConfigurationService {
  private baseUrl = environment.apiUrl;
  public decodedToken: any;
  public userToken: any;
  public isSidebarClosed$: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  timeoutUpdated$ = new Subject<boolean>();
  userJustLoggedIn$ = new Subject<boolean>();
  currencySymbol: string;

  constructor(
    private http: HttpClient,
    public jwtHelperService: JwtHelperService,
    public tokenRefreshError: TokenRefreshErrorHandler,
    public encrypt: EncryptService
  ) {}

  public getFromJson(stringArray, expectedResult) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  getMultiLoanConfigs(payload): Observable<any> {
    const params = new HttpParams({ fromObject: payload });
    return this.http
      .get(this.baseUrl + "LoanType", {
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

  setMultiLoanState(payload): Observable<any> {
    return this.http
      .post(this.baseUrl + "LoanType/subscribe", payload, {
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

  verifyMultiLoanRequirements(payload): Observable<any> {
    return this.http
      .post(this.baseUrl + "LoanType/verify", payload, {
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

  setMultiLoanConfig(payload): Observable<any> {
    return this.http
      .put(this.baseUrl + "LoanType", payload, {
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

  deleteMultiLoanConfig(payload): Observable<any> {
    return this.http
      .put(this.baseUrl + "LoanType/default", payload, {
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

  public addBank(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/addbank", data, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getPaystackPublicKey(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/paystackpublickey", {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public verifyDecideTopUp(reference: string): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "configuration/VerifyDecideWalletPayment/" + reference,
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getDecideWalletBalance(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/getdecidewalletbalance", {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getLoanTypeParametersByLoanAmountAndLoanTypeId(
    model: any
  ): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "configuration/getloancalculationparameters",
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolFormFieldsForValidation(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spoolformfieldsforvalidation", {
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolFormFields(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spoolformfieldsforappowner", {
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public createEmploymentIndustry(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/employmentindustrycreate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public saveLoanApplicationFormFields(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "configuration/saveloanapplicationformfields",
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public saveCalendlyForm(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/calendlyupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public createEmployer(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/employercreate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditEmploymentIndustry(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/employmentindustryupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditEmployer(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/employerupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolEmploymentIndustries(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolemploymentindustries", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolEmployers(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolemployers", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolEmploymentIndustriesforSelect(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spoolemploymentindustriesforselect", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolOwnerInfo(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/applicationownerinformation", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getCurrencySymbol(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/currency", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          this.currencySymbol = res.body.currencySymbol;
          this.setToken(res.headers);
        })
      );
  }

  public spoolInteractionAccounts(type: string): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "configuration/getfinanceinteractionaccounts/" + type,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolRetrialInfo(): Observable<any> {
    return this.http
      .get(this.baseUrl + "loanoperations/getappownerretrialcount", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolBanks(data?: {
    provider: "Paystack" | "Kuda" | "Seerbit" | "mbs";
  }) {
    let urlSegment = "configuration/banks";
    let params = new HttpParams();
    if (data?.provider === "Paystack") {
      params = params.append("provider", data.provider);
    } else if (data?.provider === "Kuda") {
      params = params.append("provider", data.provider);
    } else if (data?.provider === "Seerbit") {
      params = params.append("provider", data.provider);
    } else if (data?.provider === "mbs") {
      params = params.append("provider", data.provider);
    } else {
      urlSegment = "configuration/spoolbanks";
    }

    return this.http
      .get<Bank[]>(this.baseUrl + urlSegment, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
          .set(
            "Authorization",
            sessionStorage.token != null
              ? "Bearer " + JSON.parse(sessionStorage.token)
              : ""
          ),
        params,
        observe: "response",
      })
      .pipe(
        map((res) => ({
          ...res,
          body: res.body.sort((a, b) => a.bankName.localeCompare(b.bankName)),
        })),
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public spoolBanksByPartner() {
    return this.http
      .get<any>(this.baseUrl + "configuration/banks", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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

  public spoolCountries(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/countries", {
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolStatesByCountry(countryId: number): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/states/" + countryId, {
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public createRecoveryMeasure(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/recoverymeasurecreate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolRecoveryMeasures(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolrecoverymeasures", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditRecoveryMeasure(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/recoverymeasureupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolLoanTypes(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolloantypes", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getLoanType(payload): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/loantypeid", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        params: new HttpParams({ fromObject: payload }),
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public createLoanType(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/loantypecreate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditLoanType(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/loantypeupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public createNote(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/notecreate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public createFee(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/feecreate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public createLoanReason(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/loanreasoncreate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public createThresholdParameter(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/thresholdparametercreate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolNotes(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolnotes", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolFees(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolfees", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolLoanReasons(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolloanreasons", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolThresholdParameters(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolthresholdparameters", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditNote(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/noteupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditFee(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/feeupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditLoanReason(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/loanreasonupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditThreshold(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/thresholdparameterupdate", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolRecoveryMeasuresforSelect(branchid: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "configuration/spoolrecoverymeasuresforselect/" +
          branchid,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolRejectionReasonsforSelect(branchid: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "configuration/spoolrejectionreasonsforselect/" +
          branchid,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolFeesforSelect(branchid: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spoolfeesforselect/" + branchid, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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

  public spoolthresholdparametersforSelect(branchid: any): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "configuration/spoolthresholdparametersforselect/" +
          branchid,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
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

  public spoolBranchesforSelect(branchid: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolbranches/" + branchid, {
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

  /**
   *
   * Customer Loan Creation
   *
   */
  public search(userid: number, term: string): Observable<any> {
    if (term === "") {
      return of([]);
    }

    return this.http
      .get(
        this.baseUrl +
          "configuration/spoolcustomersforloancreation/" +
          userid +
          "/" +
          term,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public fetchLoanTypes(userId: number) {
    return this.http
      .get<LoanType[]>(
        this.baseUrl + "newapplication/fetchloantypes/" + userId,
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

  public fetchOriginalLoanSetup(userid: number, key: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "register/fetch_setup?appOwnerKey=" + key, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public validateBVN(data: any) {
    return this.http
      .post<ValidateBVNResBody>(
        this.baseUrl + "newapplication/validateBVN",
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
          (error) => {
            this.tokenRefreshError.handleError(error);
          }
        )
      );
  }

  public getRepaymentSchedule(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "loanoperations/spoolloanrepaymentschedule", data, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public checkAuthAmount(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "register/fetch_repayment", data, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public fetchAllEmployers(data: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "register/employers?id=" + data.id, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public fetchLoanReason(data: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "register/searchreason?term=" + data.term, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public fetchEmployers(id: number, term: string): Observable<any> {
    if (term === "") {
      return of([]);
    }
    return this.http
      .get(
        this.baseUrl + "register/search_employer?id=" + id + "&term=" + term,
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public updateInvestmentSetupCode(data): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "configuration/updateinvestmentcodesetupinfo",
        data,
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  /**
   * @deprecated this method is deprecated use spoolBanks instead but ensure you pass a provider
   */
  public fetchBanks() {
    return this.spoolBanks({ provider: "Paystack" }).pipe(
      map((res) => {
        return {
          body: {
            data: res.body.map((item) => ({
              name: item.bankName,
              code: item.sortCode,
            })),
          },
        };
      })
    );
  }

  public fetchRemitaBanks(): Observable<any> {
    return this.http
      .get(this.baseUrl + "integration/getRemitaBanks", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.auth != null ? "Bearer " + sessionStorage.auth : ""
          ),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          return res.body;
        })
      );
  }

  validateBankAccount(payload: VerifyBankAccount) {
    const params = new HttpParams({ fromObject: payload });
    return this.http
      .get<{ data: VerifyBankAccountRes }>(
        `${this.baseUrl}newapplication/verify_account`,
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
          params,
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  public SubmitLoanApplication(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "newapplication", model, {
        headers: new HttpHeaders()
          // .set('Content-Type', 'application/json')
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
          }

          /* error => {
        this.tokenRefreshError.handleError(error);
      } */
        )
      );
  }

  public updateNotification(data: any): any {
    return this.http
      .post(this.baseUrl + "user/savenotification", data, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public fetchLoanForRedraft(loanId: any): Observable<any> {
    return this.http
      .get(this.baseUrl + "newapplication/fetchloan?id=" + loanId, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public SubmitLoanApplicationRedraft(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "newapplication/redraft", model, {
        headers: new HttpHeaders()
          // .set('Content-Type', 'application/json')
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolBranches(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolbranches", model, {
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

  public spoolAccessibleLoanTypes(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "configuration/spooluseraccessibleloantypes",
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

  public spoolAccessibleBranches(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spooluseraccessiblebranches", model, {
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

  public getCalculationParameters(model: any): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "configuration/getloancalculationparameters",
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
          (error) => this.tokenRefreshError.handleError(error)
        )
      );
  }

  public getDecideVariableInfo(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/getdecidevariableinfo", {
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

  public updateDecideSettings(model: DecideSetup): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updatedecidesettings", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public updateFinanceInteractions(model): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updatefinanceinteractions", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolLendingInstitutions(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoollendinginstitutions", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public createLendingInstitution(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/createlendinginstitution", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public EditLendingInstitution(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updatelendinginstitution", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getAppOwnerInfo(opts = { applicationOwner: false }): Observable<any> {
    const urlSegment = opts.applicationOwner
      ? "applicationownerinformation"
      : "getappownerinformation";

    return this.http
      .get<any>(`${this.baseUrl}configuration/${urlSegment}`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getAppOwnerProductStatus(): Observable<any> {
    return this.http
      .get<any>(
        this.baseUrl + "configuration/getapplicationownerproductsetupstatus",
        {
          headers: new HttpHeaders()
            .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getAppInfo(): Observable<any> {
    return this.http
      .get<any>(this.baseUrl + "configuration/applicationinformation", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public getAppUpdates(): Observable<any> {
    return this.http
      .get<any>(this.baseUrl + "metrics/getbusinessnotifications", {
        headers: new HttpHeaders()
          .set("Content-Type", "application/x-www-form-urlencoded")
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
          (res) => {
            this.setToken(res.headers);
            return res;
          },
          (error) => {
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  // Post Paystack keys
  public updatePaystackKeys(model: PaystackFormReqBody) {
    return this.http
      .put(this.baseUrl + "configuration/paystack/info", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }
  // update sms setup
  public updateSmsSetup(model: SmsSetupInterface): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updateSmsSetupInformation", model, {
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
  // Post YouVerify keys
  public updateYouVerifyInfo(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updateyouverifyinfo", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public updateRemitaInfo(data: UpdateRemitaInfoData) {
    return this.http
      .post(this.baseUrl + "integration/updates/remitainfo", data, {
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

  getRemitaInfo(integrationName: RemitaIntegrationNameEnum) {
    return this.http
      .get<{ status: boolean; message: string; data: RemitaSetup }>(
        `${this.baseUrl}integration/remita/info?integrationName=${integrationName}`,
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

  public updateRemitaStatus(data: {
    activate: boolean;
    integrationName: RemitaIntegrationNameEnum;
  }): Observable<any> {
    return this.http
      .post(this.baseUrl + "Integration/activate/deactivate/remita", data, {
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

  public updateFirstCentralInfo(model: any): Observable<any> {
    model["password"] = this.encrypt.encrypt(model["password"]);

    return this.http
      .post(this.baseUrl + "configuration/updatefirstcentralinfo", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  fetchInvestmentSetupInfo() {
    return this.http
      .get<{
        data: {
          investmentInfoSetupDto: InvestmentInfoSetupDto;
          investmentCertificateInfoSetup: InvestmentCertificateInfoSetup;
        };
      }>(this.baseUrl + "investment/settings", {
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

  // Update investment set up info
  public updateInvestmentSetup(model: any) {
    return this.http
      .put(this.baseUrl + "investment/settings", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }
  public updateInvestmentSignatorySetup(model: InvestmentCertificateInfoSetup) {
    return this.http
      .put(this.baseUrl + "investment/settings/signatory", model, {
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
  // Update First Central Info
  public updateCreditRegistryInfo(model: any): Observable<any> {
    model["password"] = this.encrypt.encrypt(model["password"]);
    return this.http
      .post(this.baseUrl + "configuration/updatecreditregistryinfo", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }
  // Update Appowner details
  public udateAppOwnerDetails(model: FormData): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updateappowner", model, {
        headers: new HttpHeaders()
          // .set('Content-Type', 'application/json')
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }
  // Update Loan setup info
  public updateLoanSetup(model: FormData): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updateloansetupinfo", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  // Update Loan disbursment info
  public updateDisbursementSetup(model: FormData): Observable<any> {
    return this.http
      .post(
        this.baseUrl + "configuration/updatedisbursmentfailedsetting",
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public updatePaystackStatus(status: boolean) {
    return this.http
      .post(
        this.baseUrl + "configuration/activate/paystack",
        { active: status },
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

  // Update Monnify parameters
  public updateMonnifyParams(params: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/monnifyupdate", params, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  // Update YouVerify integration status
  public updateYouVerifyStatus(status: boolean): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "configuration/activateordeactivateyouverify/" + status,
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public updatePFCStatus(status: boolean): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "configuration/activateordeactivatepayfirstcentral/" +
          status,
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }
  // Update Credit Registry integration status
  public updateCreditRegistrytatus(status: boolean): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          "configuration/activateordeactivatecreditbureau/" +
          status,
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolLoanTypesForUssdActivation(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spoolloantypesforussdactivation", {
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

  public spoolAppOwnerUssdLoanCode(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spoolappownerussdloancode", {
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

  public getUssdShortCodePrefix(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/getussdshortcodeprefix", {
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

  public setUssdShortCodePrefix(data: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/setussdshortcodeprefix", data, {
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

  public isEnterprise(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/isenterprise", {
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

  public setActiveUssdLoanType(id): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/setactiveussdloantype/" + id, {
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

  public setActiveUssdLoanTypeAndOffer(
    loanTypeId,
    loanOfferId
  ): Observable<any> {
    return this.http
      .get(
        this.baseUrl +
          `configuration/setactiveussdloantypeandoffer/${loanTypeId}/${loanOfferId}`,
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

  public unsetActiveUssdLoanTypeAndOffer(): Observable<any> {
    return this.http
      .get(this.baseUrl + `configuration/unsetactiveussdloantypeandoffer`, {
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

  public unsetActiveUssdLoanType(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/unsetactiveussdloantype", {
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

  public spoolActiveUssdLoanType(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spoolactiveussdloantype", {
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

  public spoolDefaultLoanOffer(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spooldefaultloanoffer", {
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

  public spoolLoanTypesForUssdLoanOffers(): Observable<any> {
    return this.http
      .get(
        this.baseUrl + "configuration/spoolloantypesforofferbyplatform/Ussd",
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

  public spoolLoanOffers(model): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/spoolloanoffers", model, {
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

  public spoolLoanOffersList(): Observable<any> {
    return this.http
      .get(this.baseUrl + "configuration/spoolloanofferslist", {
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

  public addLoanOffer(model): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/createloanoffer", model, {
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

  public editLoanOffer(model): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updateloanoffer", model, {
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

  public getAllAppOwnerIntegration(appOwnerKey): Observable<any> {
    return this.http
      .get(
        this.baseUrl + `integration/getallappownerintegration/${appOwnerKey}`,
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
  public getAllIntegrations() {
    return this.http
      .get<Integration[]>(this.baseUrl + `integration/getallintegrations`, {
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

  public updateIntegration(data: any): Observable<any> {
    return this.http
      .put(this.baseUrl + `integration/${data?.integrationId}`, data, {
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

  public integrateOkra(model): Observable<any> {
    return this.http
      .post(this.baseUrl + `integration/ActivateOkra`, model, {
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

  public updateOkraData(model): Observable<any> {
    return this.http
      .post(this.baseUrl + `integration/UpdateOkraData`, model, {
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

  public updateOkraStatus(status): Observable<any> {
    return this.http
      .get(this.baseUrl + `integration/updateokrastatus/${status}`, {
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

  public updateColorTheme(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updateappownercustomcolors", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  // FINANCE SETUP

  // Update Petty cash setup info
  public updatePettyCashSetup(model: FormData): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updatepettycashsetupinfo", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  // Update Item setup info
  public updateItemSetup(model: FormData): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updateitemsetupinfo", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public updateFinanceSetupForm(model): Observable<any> {
    return this.http
      .post(this.baseUrl + "configuration/updatefinancesetupinfo", model, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
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

  // API ACCESS MANAGEMENT

  public deleteApiAccessKey(model: any) {
    return this.http
      .delete(this.baseUrl + `apiaccess/${model}`, {
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

  public saveEditApiAccessKeyForm(model: any) {
    return this.http
      .put(this.baseUrl + `apiaccess`, model, {
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

  public saveApiAccessKeyForm(model: any) {
    return this.http
      .post(this.baseUrl + `apiaccess`, model, {
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

  public spoolApiKeyScore() {
    return this.http
      .get(this.baseUrl + `apiaccess/scope`, {
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

  public spoolUserApiList(): Observable<any> {
    // this.baseUrl + `apiaccess/userapilist`
    return this.http
      .get(this.baseUrl + `apiaccess`, {
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

  public setDefaultBvnValidationPartner(partner): Observable<any> {
    const model = {
      DefaultBvnValidationPartner: null,
    };
    switch (partner) {
      case "Paystack":
        model.DefaultBvnValidationPartner = "Paystack";
        break;
      case "YouVerify":
        model.DefaultBvnValidationPartner = "YouVerify";
        break;
    }
    return this.http
      .post(
        this.baseUrl + "configuration/setdefaultbvnvalidationpartner",
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public checkBVNv2(bvn): Observable<any> {
    return this.http
      .get(this.baseUrl + `auth/bvn/v2/${bvn}`, {
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
            this.tokenRefreshError.handleError(error); /* return of(error); */
          }
        )
      );
  }

  public spoolUnderwriterReasons(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + `configuration/spoolunderwriterreasons`, model, {
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
  public createUnderwriterReason(
    model: UnderwriterReasonInterface
  ): Observable<any> {
    return this.http
      .post(this.baseUrl + `configuration/underwriterreasoncreate`, model, {
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
  public updateUnderwriterReason(
    model: UnderwriterReasonInterface
  ): Observable<any> {
    return this.http
      .post(this.baseUrl + `configuration/underwriterreasonupdate`, model, {
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
  public configure2fa(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + `configuration/updateAppOwner2faSetup`, model, {
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
  public updateTimeoutSettings(model: any): Observable<any> {
    return this.http
      .put(this.baseUrl + `configuration/updatesecuritysettings`, model, {
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

  public spoolBulkProcessLogById(id: any): Observable<any> {
    let query = new HttpParams().set("id", id);
    return this.http
      .get(`${this.baseUrl}configuration/GetBulkProcessLogById`, {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        params: query,
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
  public spoolBulkProcessLogByUser(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + `configuration/GetUserBulkProcessLogs`, model, {
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
  public spoolBulkProcessLogForAllUsers(model: any): Observable<any> {
    return this.http
      .post(this.baseUrl + `configuration/GetAllBulkProcessLogs`, model, {
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

  getWebhookEvents() {
    return this.http
      .get<{ data: string[]; message: string; status: boolean }>(
        this.baseUrl + "integration/events",
        {
          headers: new HttpHeaders().set(
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

  getWebhookConfig() {
    return this.http
      .get<WebhookConfig>(this.baseUrl + "integration/config", {
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

  registerWebhookUrl(payload: { webhookUrl: string }) {
    return this.http
      .post(this.baseUrl + "integration/subscribe", payload, {
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

  updateWebhookUrl(payload: { webhookUrl: string }) {
    return this.http
      .put(this.baseUrl + "integration/subscribe", payload, {
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

  subscribeToWebhookEvent(payload: { events: string[] }) {
    return this.http
      .post(this.baseUrl + "integration/subscribe/events", payload, {
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

  activateDeactivateWebhook(payload: { activate: boolean }) {
    return this.http
      .post(this.baseUrl + "integration/activatedeactivate", payload, {
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

  getPaystackInfo() {
    return this.http
      .get<{ data: PaystackInfo }>(
        this.baseUrl + "configuration/paystack/info",
        {
          headers: new HttpHeaders().set(
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

  fetchDisbursementAccountInfo(payload: BasicPaginationReqProps) {
    const params = new HttpParams({ fromObject: payload });
    return this.http
      .get<DisbursementPartnersResBody>(
        this.baseUrl + "configuration/disbursement/accounts/info",
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          params,
          observe: "response",
        }
      )
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getAllPartners() {
    return this.http
      .get<{ data: string[] }>(
        this.baseUrl + "configuration/disbursement/integration/partners",
        {
          headers: new HttpHeaders().set(
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

  getSmsProviders() {
    return this.http
      .get<SmsProviders[]>(this.baseUrl + "integration/getSmsProviders", {
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

  activateSmsProvider(payload: ActivateSmsProvider) {
    return this.http
      .post(this.baseUrl + "integration/activatesmsproviders", payload, {
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

  getLoanApprovalRoles() {
    return this.http
      .get(`${this.baseUrl}LoanApprovalWorkflow/roles`, {
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

  getLoanApprovalPermissions() {
    return this.http
      .get(`${this.baseUrl}LoanApprovalWorkflow/permissions`, {
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

  createLoanApprovalWorkflow(data: CreateLoanApprovalWorkflowDto) {
    return this.http
      .post(`${this.baseUrl}LoanApprovalWorkflow`, data, {
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

  editLoanApprovalWorkflow(data: CreateLoanApprovalWorkflowDto) {
    return this.http
      .put(`${this.baseUrl}LoanApprovalWorkflow`, data, {
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

  getLoanApprovalWorkflows(data: GetDataQueryParams): any {
    return this.http
      .get(`${this.baseUrl}LoanApprovalWorkflow`, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: data }),
        observe: "response",
      })
      .pipe(
        tap((res) => {
          this.setToken(res.headers);
        })
      );
  }

  getLoanApprovalWorkflow(id: number) {
    return this.http
      .get<{ data: LoanApprovalWorkflow }>(
        `${this.baseUrl}LoanApprovalWorkflow/${id}`,
        {
          headers: new HttpHeaders().set(
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

  getStates() {
    return this.http.get<{ data: GenericList[] }>(
      `${environment.iasUrl}checkout/states`,
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

  getLGA(stateId: number) {
    return this.http.get<{ data: GenericList[] }>(
      `${environment.iasUrl}checkout/states/${stateId}/lgas`,
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

  verifyPhoneNumber(phoneNumber: string) {
    return this.http.post<{ data: ValidatePhoneNumberResBody }>(
      `${this.baseUrl}NewApplication/verify/phoneNumber`,{phoneNumber},
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

  validatePhoneNumber(data: any, txPin: string) {
    return this.http.post(`${this.baseUrl}NewApplication/validate/phoneNumber`, data, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        )
        .set("x-lenda-transaction-pin", this.encrypt.encrypt(`${txPin}`)),
      observe: "response",
    });
  }

  spoolLgasByState(stateId: number) {
    return this.http.get<{ data: GenericList[] }>(
      `${this.baseUrl}configuration/states/${stateId}/lgas`,
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

}
