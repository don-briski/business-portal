import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { environment } from "src/environments/environment";
import { toFormData } from "src/app/util/finance/financeHelper";
import { EncryptService } from "src/app/service/encrypt.service";
import {
  CreateVCNoteReqBody,
  CreateVCNoteResBody,
  GetVCNoteResBody,
  ApproveVCNReqBody,
  GetVCNActivitiesResBody,
  GetVCNsResBody,
  GetVCNotesReqParams,
} from "../types/vendor-credit-note";

@Injectable({
  providedIn: "root",
})
export class VendorCreditNoteService {
  private baseUrl = environment.apiUrl + "VendorCreditNote";

  constructor(private http: HttpClient, public encrypt: EncryptService) {}
  private setHeaders(transactionPin?: string): HttpHeaders {
    if (!transactionPin) {
      return new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      );
    } else {
      return new HttpHeaders()
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        )
        .set("x-lenda-transaction-pin", this.encrypt.encrypt(transactionPin));
    }
  }
  private getToken() {
    return JSON.parse(sessionStorage.token);
  }

  createVCNote(data: CreateVCNoteReqBody, transactionPin?: string) {
    const formData = toFormData(data);
    return this.http.post<CreateVCNoteResBody>(`${this.baseUrl}`, formData, {
      headers: this.setHeaders(transactionPin),
      observe: "response",
    });
  }

  getVCNotes(params: GetVCNotesReqParams) {
    return this.http.get<GetVCNsResBody>(`${this.baseUrl}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      params: new HttpParams({ fromObject: params as any }),
      observe: "response",
    });
  }

  getVCNoteById(id: number) {
    return this.http.get<GetVCNoteResBody>(`${this.baseUrl}/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  editVCNote(data: CreateVCNoteReqBody, transactionPin?: string) {
    const formData = toFormData(data);
    return this.http.put<CreateVCNoteResBody>(`${this.baseUrl}`, formData, {
      headers: this.setHeaders(transactionPin),
      observe: "response",
    });
  }

  approveVCN(data: ApproveVCNReqBody, transactionPin?: string) {
    return this.http.post(
      `${this.baseUrl}/ApproveVendorCreditNoteProcess`,
      data,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set(
            "x-lenda-transaction-pin",
            this.encrypt.encrypt(`${transactionPin}`)
          ),
        observe: "response",
      }
    );
  }

  applyToBills(data: any) {
    return this.http.post(`${this.baseUrl}/ApplyCreditsToBill`, data, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getVCNActivities(id: number) {
    return this.http.get<GetVCNActivitiesResBody>(
      `${this.baseUrl}/Activities/${id}`,
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

  deleteVCN(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }
}
