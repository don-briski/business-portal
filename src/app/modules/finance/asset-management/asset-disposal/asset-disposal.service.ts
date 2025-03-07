import { Injectable } from "@angular/core";
import { tap } from "rxjs/operators";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { JwtHelperService } from "@auth0/angular-jwt";
import { TokenRefreshErrorHandler } from "../../../../service/TokenRefreshErrorHandler";

import { DisposeAssetData, GetAssetsData } from "./types";
import { AssetMgtService } from "src/app/service/asset-mgt.service";
import { environment } from "src/environments/environment";
import { toFormData } from "src/app/util/finance/financeHelper";
import { EncryptService } from "src/app/service/encrypt.service";

@Injectable({
  providedIn: "root",
})
export class AssetDisposalService {
  private baseUrl = environment.apiUrl;
  private decodedToken: any;

  constructor(
    private http: HttpClient,
    private jwtHelperService: JwtHelperService,
    private tokenRefreshError: TokenRefreshErrorHandler,
    private assetMgtServ: AssetMgtService,
    public encrypt: EncryptService
  ) {}

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
      }
      return true;
    } catch (e) {}
  }

  getAssets(data: GetAssetsData) {
    return this.assetMgtServ.spoolAllAssets(data);
  }

  disposeAsset(
    data: DisposeAssetData,
    files: any[],
    opts: { raiseInvoice: boolean },
    transactionPin
  ) {
    let headers;
    if (transactionPin) {
      headers = new HttpHeaders()
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        )
        .set(
          "x-lenda-transaction-pin",
          this.encrypt.encrypt(`${transactionPin}`)
        );
    } else {
      headers = new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      );
    }
    let payload;
    if (opts.raiseInvoice) {
      payload = {
        raiseInvoice: true,
        customerPersonId: data.customerPersonId,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        paymentTermId: data.paymentTermId,
        responsiblePersonId: data.responsiblePersonId,
        cashOrBankAccountId: data.cashOrBankAccountId,
        lines: data.lines,
        reference: data.reference,
        note: data.note,
        files,
      };
    } else {
      payload = {
        raiseInvoice: false,
        transactionDate: data.transactionDate,
        cashOrBankAccountId: data.cashOrBankAccountId,
        reference: data.reference,
        lines: data.lines,
        files,
      };
    }
    const formData = toFormData(payload);
    return this.http
      .put(this.baseUrl + "AssetManagement/AssetCards/DisposeAsset", formData, {
        headers,
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
}
