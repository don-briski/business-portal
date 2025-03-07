import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

import { environment } from "src/environments/environment";
import { toFormData } from "src/app/util/finance/financeHelper";
import { EncryptService } from "src/app/service/encrypt.service";
import {
  CreateCNoteReqBody,
  CreateCNoteResBody,
  GetCNotesReqBody,
  GetCNotesResBody,
  GetCNoteResBody,
  ApproveCNReqBody,
  GetCNActivitiesResBody,
} from "./types";

@Injectable({
  providedIn: "root",
})
export class CreditNotesService {
  private baseUrl = environment.apiUrl + "CreditNote";

  constructor(private http: HttpClient, public encrypt: EncryptService) {}

  private getToken() {
    return JSON.parse(sessionStorage.token);
  }
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

  createCNote(data: CreateCNoteReqBody, transactionPin?: string) {
    const formData = toFormData(data);
    return this.http.post<CreateCNoteResBody>(`${this.baseUrl}`, formData, {
      headers: this.setHeaders(transactionPin),
      observe: "response",
    });
  }

  /**
   * @deprecated this method should is deprecated use getCreditNotes
   */
  getCNotes(data: GetCNotesReqBody) {
    return this.http.post<GetCNotesResBody>(
      `${this.baseUrl}/GetCreditNotes`,
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

  getCreditNotes(data: GetCNotesReqBody) {
    return this.http.get<GetCNotesResBody>(
      `${this.baseUrl}/GetCreditNotes`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        params: new HttpParams({fromObject:{...data}}),
        observe: "response",
      }
    );
  }

  getCNoteById(id: number) {
    return this.http.get<GetCNoteResBody>(`${this.baseUrl}/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  editCNote(data: CreateCNoteReqBody, transactionPin?: string) {
    const formData = toFormData(data);
    return this.http.put<CreateCNoteResBody>(`${this.baseUrl}`, formData, {
      headers: this.setHeaders(transactionPin),
      observe: "response",
    });
  }

  approveCN(data: ApproveCNReqBody, transactionPin?: string) {
    return this.http.post(`${this.baseUrl}/ApproveCreditNoteProcess`, data, {
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
    });
  }

  applyToInvoice(data: any) {
    return this.http.post(`${this.baseUrl}/ApplyCreditsToInvoice`, data, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getCNActivities(id: number) {
    return this.http.get<GetCNActivitiesResBody>(
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

  deleteCN(id: number) {
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

  getCNTemplate(): any {
    return this.http.get(`${this.baseUrl}/credit-notes/template`, {
      responseType: "blob" as "json",
      headers: new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      ),
      observe: "response",
    });
  }

  importCN(data: any): any {
    return this.http.post(`${this.baseUrl}/credit-notes/import-balance`, data, {
      headers: new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      ),
      observe: "response",
    });
  }
}
