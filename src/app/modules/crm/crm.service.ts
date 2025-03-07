import { Injectable } from "@angular/core";
import {
  CaseType,
  CreateCRMProspectResponse,
  CRMCustomerDetail,
  FetchCRMCustomersResponse,
  CreateCaseNote, CrmCustomerCase, CaseNote,
  FetchCustomerProduct,
  CustomerLoanProduct,
  CustomerInvestmentProduct
} from "./crm.types";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import {
  BasicPaginationReqProps,
  GenericList,
  GenericSpoolRequestPayload,
  GenericSpoolResponsePayload,
  ListItem,
} from "../shared/shared.types";

@Injectable({
  providedIn: "root",
})
export class CrmService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  saveProspect(payload: CRMCustomerDetail) {
    return this.http.post<{data:string}>(`${this.baseUrl}prospects/draft`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  updateDraft(payload: CRMCustomerDetail) {
    return this.http.put(`${this.baseUrl}prospects/draft`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  createCustomer(payload: CRMCustomerDetail) {
    return this.http.post<CreateCRMProspectResponse>(
      `${this.baseUrl}prospects`,
      payload,
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

  updateProspect(payload: CRMCustomerDetail) {
    return this.http.put<CreateCRMProspectResponse>(
      `${this.baseUrl}prospects`,
      payload,
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

  fetchCrmCustomers(payload: BasicPaginationReqProps) {
    return this.http.get<FetchCRMCustomersResponse>(
      `${this.baseUrl}prospects`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        params: new HttpParams({ fromObject: payload }),
      }
    );
  }

  getCustomer(id: string) {
    return this.http.get<{ data: CRMCustomerDetail }>(
      `${this.baseUrl}prospects/${id}`,
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

  deleteCustomer(id: string) {
    return this.http.delete(`${this.baseUrl}prospects/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  fetchCaseTypes(payload: GenericSpoolRequestPayload) {
    return this.http.get<GenericSpoolResponsePayload<CaseType>>(
      `${this.baseUrl}prospectCaseType`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        params: new HttpParams({ fromObject: payload }),
      }
    );
  }

  fetchCustomerInteractions(prospectId: string) {
    return this.http.get<{data:CrmCustomerCase[]}>(`${this.baseUrl}prospects/cases`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
      params: new HttpParams({ fromObject: {prospectId} }),
    });
  }

  createEditCase(payload: CrmCustomerCase) {
    return this.http.post(`${this.baseUrl}prospects/cases`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getCaseNotes(prospectCaseId: number) {
    return this.http.get<{data:CaseNote[]}>(`${this.baseUrl}prospects/cases/notes`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
      params: new HttpParams({fromObject:{prospectCaseId}})
    });
  }

  createCaseNote(payload: CreateCaseNote) {
    return this.http.post(`${this.baseUrl}prospects/cases/notes`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  deleteCaseNote(id: number) {
    return this.http.delete(`${this.baseUrl}prospects/cases/notes/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  setCaseType(payload: CaseType) {
    return this.http.post(`${this.baseUrl}prospectCaseType`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getCrmCustomerLoans(payload: FetchCustomerProduct) {
    return this.http.get<GenericSpoolResponsePayload<CustomerLoanProduct>>(`${this.baseUrl}prospects/products/loan`, {
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

  getCrmCustomerInvestments(payload: FetchCustomerProduct) {
    return this.http.get<GenericSpoolResponsePayload<CustomerInvestmentProduct>>(`${this.baseUrl}prospects/products/investment`, {
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

  private getToken() {
    return JSON.parse(sessionStorage.token);
  }
}
