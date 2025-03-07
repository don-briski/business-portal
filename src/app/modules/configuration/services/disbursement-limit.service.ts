import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { CreateEditDisbursementLimit, DisbursementLimit, DisbursementLimitDetail, DisbursementLimitGroup, SetLimitAlert } from "../models/disbursement-limit-type";
import { GenericSpoolRequestPayload, GenericSpoolResponsePayload } from "../../shared/shared.types";

@Injectable({
  providedIn: "root",
})
export class DisbursementLimitService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createDisbursementLimitGroup(payload: DisbursementLimitGroup) {
    return this.http.post(`${this.baseUrl}loandisbursementgroup`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getDisbursementLimitGroups(payload: GenericSpoolRequestPayload) {
    return this.http.get<GenericSpoolResponsePayload<DisbursementLimitGroup>>(`${this.baseUrl}loandisbursementgroup`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
      params: new HttpParams({fromObject:payload})
    });
  }

  updateDisbursementLimitGroup(payload: DisbursementLimitGroup) {
    return this.http.put(`${this.baseUrl}loandisbursementgroup`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getLimitAlertSettings() {
    return this.http.get<{data:SetLimitAlert}>(`${this.baseUrl}loandisbursementlimit/notification-setting`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  setLimitAlert(payload: SetLimitAlert) {
    return this.http.put(`${this.baseUrl}loandisbursementlimit/notification-setting`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  createDisbursementLimit(payload: CreateEditDisbursementLimit) {
    return this.http.post(`${this.baseUrl}loandisbursementlimit`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getDisbursementLimits(payload:GenericSpoolRequestPayload) {
    return this.http.get<GenericSpoolResponsePayload<DisbursementLimit>>(`${this.baseUrl}loandisbursementlimit`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
      params: new HttpParams({fromObject:payload})
    });
  }

  getDisbursementLimit(id:number) {
    return this.http.get<{data:DisbursementLimitDetail}>(`${this.baseUrl}loandisbursementlimit/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  updateDisbursementLimit(payload: CreateEditDisbursementLimit) {
    return this.http.put(`${this.baseUrl}loandisbursementlimit`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  private getToken() {
    return JSON.parse(sessionStorage.token);
  }
}
