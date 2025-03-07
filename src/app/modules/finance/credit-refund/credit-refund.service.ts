import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { environment } from "src/environments/environment";
import {
  CreateCreditRefundReqBody,
  GetCreditRefundsReqBody,
  GetCreditRefundsResBody,
} from "./credit-refund.types";

@Injectable({
  providedIn: "root",
})
export class CreditRefundService {
  baseUrl = `${environment.apiUrl}CreditRefund`;

  constructor(private http: HttpClient) {}

  private getToken() {
    return JSON.parse(sessionStorage.token);
  }

  createCreditRefund(data: CreateCreditRefundReqBody) {
    return this.http.post(this.baseUrl, data, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        )
        .set("x-lenda-transaction-pin", data.transactionPin),
      observe: "response",
    });
  }

  getCreditRefunds(data: GetCreditRefundsReqBody) {
    return this.http.post<GetCreditRefundsResBody>(
      `${this.baseUrl}/GetCreditRefunds`,
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
}
