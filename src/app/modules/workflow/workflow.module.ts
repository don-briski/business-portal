import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { SweetAlert2Module } from "@sweetalert2/ngx-sweetalert2";
import { UserIdleModule } from "angular-user-idle";
import { CurrencyMaskModule } from "ng2-currency-mask";
import { NgxMaskModule } from "ngx-mask";

import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { WorkflowRoutingModule } from "./workflow-routing.module";
import { SharedModule } from "../shared/shared.module";

import { PageTitleComponent } from "./components/shared/page-title/page-title.component";
import { RequestConfigsComponent } from "./pages/request-configs/request-configs.component";
import { AddEditRequestConfigComponent } from "./components/add-edit-request-config/add-edit-request-config.component";
import { ErrorInterceptor } from "src/app/service/tokenErrorInterceptor";
import { NoInternetInterceptor } from "src/app/service/no-internet-interceptor.service";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { CustomFieldComponent } from "./components/custom-field/custom-field.component";
import { RequestsComponent } from "./pages/requests/requests.component";
import { ApprovalComponent } from "./pages/approval/approval.component";
import { ViewRequestComponent } from "./components/view-request/view-request.component";
import { WorkflowActivityComponent } from "./components/shared/workflow-activity/workflow-activity.component";
import { CustomFieldSetComponent } from "./components/custom-field-set/custom-field-set.component";
import { RequestCustomFieldComponent } from "./components/request-custom-field/request-custom-field.component";
import { CreateRequestInitialComponent } from "./components/create-request-initial/create-request-initial.component";
import { AddRedraftCustomRequestComponent } from "./components/add-redraft-custom-request/add-redraft-custom-request.component";
import { AddRedraftPaymentsRequestComponent } from "./components/add-redraft-payments-request/add-redraft-payments-request.component";
import { RequestCustomFieldSetsComponent } from "./components/request-custom-field-sets/request-custom-field-sets.component";
import { RequestItemsComponent } from "./components/request-items/request-items.component";
import { ApprovalHistoryComponent } from './components/approval-history/approval-history.component';
import { RequestPreviewComponent } from './components/request-preview/request-preview.component';
import { WorkflowReportsComponent } from "./pages/workflow-reports/workflow-reports.component";

@NgModule({
  declarations: [
    AddEditRequestConfigComponent,
    RequestConfigsComponent,
    PageTitleComponent,
    DashboardComponent,
    CustomFieldComponent,
    RequestsComponent,
    ApprovalComponent,
    ViewRequestComponent,
    WorkflowActivityComponent,
    CustomFieldSetComponent,
    RequestCustomFieldComponent,
    CreateRequestInitialComponent,
    AddRedraftCustomRequestComponent,
    AddRedraftPaymentsRequestComponent,
    RequestItemsComponent,
    RequestCustomFieldSetsComponent,
    ApprovalHistoryComponent,
    RequestPreviewComponent,
    WorkflowReportsComponent
  ],
  imports: [
    CommonModule,
    UserIdleModule.forRoot({ idle: 900, timeout: 300, ping: 120 }),
    ReactiveFormsModule,
    HttpClientModule,
    SweetAlert2Module.forRoot(),
    FormsModule,
    NgbModule,
    CurrencyMaskModule,
    NgxMaskModule.forRoot(),
    Select2wrapperModule,
    WorkflowRoutingModule,
    SharedModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NoInternetInterceptor,
      multi: true,
    },
  ],
})
export class WorkflowModule {
  static get key() {
    return "WorkflowModule";
  }
}
