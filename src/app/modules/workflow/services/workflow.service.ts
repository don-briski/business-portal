import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, tap } from "rxjs/operators";
import { Subject } from "rxjs";

import { environment } from "src/environments/environment";
import { toFormData } from "src/app/util/finance/financeHelper";
import * as workflowTypes from "../workflow.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";

@Injectable({
  providedIn: "root",
})
export class WorkflowService {
  private baseUrl = environment.apiUrl;
  private reqBaseUrl = this.baseUrl + "Request";
  private reqSetupBaseUrl = this.baseUrl + "RequestSetup";

  requestsChanged = new Subject();
  pendingRequestsStats = new Subject<workflowTypes.PendingRequestsStats>();

  constructor(private http: HttpClient) {}

  private getToken() {
    return JSON.parse(sessionStorage.token);
  }

  getUsers(branches: CustomDropDown[]) {
    let params = new HttpParams();
    for (let branch of branches) {
      params = params.append("branchIds", String(branch.id));
    }

    return this.http.get<CustomDropDown[]>(
      `${this.reqSetupBaseUrl}/users/request_approvers`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params,
        observe: "response",
      }
    );
  }

  getTeams(branches: CustomDropDown[]) {
    let params = new HttpParams();
    for (let branch of branches) {
      params = params.append("branchIds", String(branch.id));
    }

    return this.http.get<CustomDropDown[]>(`${this.reqSetupBaseUrl}/''/teams`, {
      headers: new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      ),
      params,
      observe: "response",
    });
  }

  getRoles(branches: CustomDropDown[]) {
    let params = new HttpParams();
    for (let branch of branches) {
      params = params.append("branchIds", String(branch.id));
    }

    return this.http
      .get<{ roleId: number; roleName: string }[]>(
        `${this.reqSetupBaseUrl}/''/roles`,
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
        map((res) => {
          const transformedRoles: CustomDropDown[] = [];
          res.body.forEach((r) => {
            transformedRoles.push({ id: r.roleId, text: r.roleName });
          });

          return transformedRoles;
        })
      );
  }

  addRequestConfig(data: workflowTypes.EditReqConfigData) {
    return this.http.post(`${this.reqSetupBaseUrl}`, data, {
      headers: new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      ),
      observe: "response",
    });
  }

  getRequestConfigs(
    data: workflowTypes.GetReqConfigsQueryParams,
    opts = { forInitiators: false }
  ) {
    let params = new HttpParams()
      .set("pageNumber", String(data.pageNumber))
      .set("pageSize", String(data.pageSize))
      .set("keyword", String(data.keyword));

    if (data.filter && !opts.forInitiators) {
      params = params.append("filter", data.filter);
    }

    return this.http.get<workflowTypes.GetReqConfigsResBody>(
      `${this.reqSetupBaseUrl}${opts.forInitiators ? "/initiators" : ""}`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params,
        observe: "response",
      }
    );
  }

  editRequestConfig(data: workflowTypes.EditReqConfigData, reqSetupId: number) {
    return this.http.put(`${this.reqSetupBaseUrl}/${reqSetupId}`, data, {
      headers: new HttpHeaders().set(
        "Authorization",
        sessionStorage.token != null ? "Bearer " + this.getToken() : ""
      ),
      observe: "response",
    });
  }

  getCustomForm(id: string) {
    return this.http.get<workflowTypes.GetCustomFormResBody>(
      `${this.baseUrl}CustomFields/CustomFormHeiracy?customFormKey=${id}`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      }
    );
  }

  createRequest(data: workflowTypes.CreateRequestReqBody) {
    const formData = toFormData(data);
    return this.http
      .post(`${this.reqBaseUrl}`, formData, {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      })
      .pipe(
        tap(() => {
          this.requestsChanged.next();
        })
      );
  }

  getRequests(
    data: workflowTypes.GetReqsQueryParams,
    opts = { forApproval: false }
  ) {
    const paramsObj = {
      pageNumber: String(data.pageNumber),
      pageSize: String(data.pageSize),
      keyword: data.keyword,
    };

    if (data.filter) {
      paramsObj["filter"] = data.filter;
    }

    if (data.approvingCategory) {
      paramsObj["approvingCategory"] = data.approvingCategory;
    }

    if (data.requestStatus) {
      paramsObj["requestStatus"] = data.requestStatus;
    }

    const params = new HttpParams({ fromObject: paramsObj });

    return this.http.get<workflowTypes.GetReqsResBody>(
      `${this.reqBaseUrl}${opts.forApproval ? "/approval" : ""}`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params,
        observe: "response",
      }
    );
  }

  getRequest(data: workflowTypes.GetReqParams) {
    return this.http.get<workflowTypes.RequestDetail>(
      `${this.reqBaseUrl}/${data.id}`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      }
    );
  }

  approveRequest(
    data: workflowTypes.ApproveReqReqBody,
    transactionPin: string
  ) {
    return this.http.put<workflowTypes.ApproveReqResBody>(
      `${this.reqBaseUrl}/Approval`,
      data,
      {
        headers: new HttpHeaders()
          .set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          )
          .set("x-lenda-transaction-pin", `${transactionPin}`),
        observe: "response",
      }
    );
  }

  getActivities(requestId: number) {
    return this.http.get<workflowTypes.WorkflowReqActivity[]>(
      `${this.reqBaseUrl}/${requestId}/activities`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      }
    );
  }

  redraftRequest(data: workflowTypes.RedraftReqReqBody, requestId: number) {
    return this.http
      .put<workflowTypes.ApproveReqResBody>(
        `${this.reqBaseUrl}/${requestId}/redraft`,
        data,
        {
          headers: new HttpHeaders().set(
            "Authorization",
            sessionStorage.token != null ? "Bearer " + this.getToken() : ""
          ),
          observe: "response",
        }
      )
      .pipe(
        tap(() => {
          this.requestsChanged.next();
        })
      );
  }

  getPendingRequestsStats() {
    return this.http.get<workflowTypes.PendingRequestsStats>(
      `${this.reqBaseUrl}/pendingRequestStats`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        observe: "response",
      }
    );
  }

  getReports(data: workflowTypes.GetWorkflowReportsQueryParams) {
    const paramsObj = {
      pageNumber: String(data.pageNumber),
      pageSize: String(data.pageSize),
      keyword: data.keyword,
    };

    if (data.filter) paramsObj["filter"] = data.filter;
    if (data.startDate) paramsObj["startDate"] = data.startDate;
    if (data.endDate) paramsObj["endDate"] = data.endDate;

    return this.http.get<workflowTypes.WorkflowReportsData>(
      `${this.reqBaseUrl}/report/requests-over-period`,
      {
        headers: new HttpHeaders().set(
          "Authorization",
          sessionStorage.token != null ? "Bearer " + this.getToken() : ""
        ),
        params: new HttpParams({ fromObject: paramsObj }),
        observe: "response",
      }
    );
  }
}
