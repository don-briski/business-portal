import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CreateLoanProductReq, WacsTransaction,WacsLoanApplicationReq, WacsDisbursementConfirmation, WacsTransactionDetails } from '../types/loan-products';
import { GenericSpoolRequestPayload, GenericSpoolResponsePayload } from '../../shared/shared.types';
import { ActivateOrDeactivateLoanProduct, LoanProduct } from '../types/loan-products';
import { Activity, LoanHistoryReq, RegisteredWacsCustomer, RegisterWacsCustomer, WacsCustomer, WacsCustomerDetail } from "../types/customer";

@Injectable({
  providedIn: "root",
})
export class WacsService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createLoanProduct(payload: CreateLoanProductReq) {
    return this.http.post(`${this.baseUrl}wacs/loanproduct`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  updateLoanProduct(payload: CreateLoanProductReq) {
    return this.http.put(`${this.baseUrl}wacs/loanproduct`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getLoanProducts(payload: GenericSpoolRequestPayload) {
    return this.http.get<GenericSpoolResponsePayload<LoanProduct>>(
      `${this.baseUrl}wacs/loanproducts`,
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

  getLoanProduct(id: number) {
    return this.http.get<{ data: LoanProduct }>(
      `${this.baseUrl}wacs/loanproduct/${id}`,
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

  activateOrDeactivateLoanProduct(payload: ActivateOrDeactivateLoanProduct) {
    return this.http.post(`${this.baseUrl}wacs/loanproduct/activate`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getCustomers(payload: GenericSpoolRequestPayload) {
    return this.http.get<GenericSpoolResponsePayload<WacsCustomer>>(
      `${this.baseUrl}wacs/customers`,
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

  getTransactions(payload:GenericSpoolRequestPayload){
    return this.http.get<GenericSpoolResponsePayload<WacsTransaction>>(
      `${this.baseUrl}wacs/transactions`,
      {
        headers: new HttpHeaders()
          .set("Content-Type", "application/json")
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
        observe: "response",
        params: new HttpParams({fromObject:payload})
      }
    );
  }

  createCustomers(payload: WacsCustomerDetail) {
    return this.http.post(`${this.baseUrl}wacs/customers/onboard`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getCustomer(id: number) {
    return this.http.get<{data:WacsCustomerDetail}>(`${this.baseUrl}wacs/customers/${id}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  checkEligibility(ippisNumber: number,bvn:string) {
    return this.http.get<{data:{amount:number}}>(`${this.baseUrl}wacs/customers/eligibility/${ippisNumber}/${bvn}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getLoanHistory(payload:LoanHistoryReq) {
    return this.http.get<{data:Activity[]}>(`${this.baseUrl}wacs/activities`, {
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

  submitToWacs(payload:WacsLoanApplicationReq){
    return this.http.post(`${this.baseUrl}wacs/loans/apply`, payload, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  confirmWacsDisbursementAccount(loanId:number){
    return this.http.get<{data:WacsDisbursementConfirmation}>(`${this.baseUrl}wacs/transactions/invoice/${loanId}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  getTransaction(txnId:number){
    return this.http.get<{data:WacsTransactionDetails}>(`${this.baseUrl}wacs/transactions/${txnId}`, {
      headers: new HttpHeaders()
        .set("Content-Type", "application/json")
        .set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
      observe: "response",
    });
  }

  registerWacsCustomer(payload:RegisterWacsCustomer){
    return this.http.post<{data:RegisteredWacsCustomer}>(`${this.baseUrl}wacs/customers/register`, payload, {
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
