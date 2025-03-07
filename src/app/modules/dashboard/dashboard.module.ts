import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DashboardRoutingModule } from "./dashboard-routing.module";
import { UserIdleModule } from "angular-user-idle";
import { NgHighlightModule } from "ngx-text-highlight";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { DataTablesModule } from "angular-datatables";
import { AngularMultiSelectModule } from "angular2-multiselect-dropdown";
import { SweetAlert2Module } from "@sweetalert2/ngx-sweetalert2";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TypeaheadModule } from "ngx-bootstrap";
import { CurrencyMaskModule } from "ng2-currency-mask";
import { Angular4PaystackModule } from "angular4-paystack";
import { NgxMaskModule } from "ngx-mask";
import {MatDialogModule} from '@angular/material/dialog';
import { AuthGuard } from "src/app/util/guard/auth.guard";
import { PermissionsService } from "src/app/service/permissions.service";
import { ReportService } from "src/app/service/report.service";
import { InvestmentService } from "src/app/service/investment.service";
import { TokenRefreshErrorHandler } from "src/app/service/TokenRefreshErrorHandler";
import { ErrorInterceptor } from "src/app/service/tokenErrorInterceptor";
import { DashboardPageComponent } from "src/app/modules/dashboard/dashboard-page/dashboard-page.component";
import { PoolPageComponent } from "src/app/modules/dashboard/pool-page/pool-page.component";
import { NoInternetInterceptor } from "src/app/service/no-internet-interceptor.service";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { SharedModule } from "../shared/shared.module";
import { LoanDashCardComponent } from './components/loan-dash-card/loan-dash-card.component';
import { FilterBtnComponent } from "../shared/components/filter-btn/filter-btn.component";
import { NewLoanDashboardComponent } from './new-loan-dashboard/new-loan-dashboard.component';
import { LoanStatusBreakdownChartComponent } from './loan-status-breakdown-chart/loan-status-breakdown-chart.component';
import { LoanDashboardCardComponent } from './loan-dashboard-card/loan-dashboard-card.component';

@NgModule({
  declarations: [DashboardPageComponent, PoolPageComponent, LoanDashCardComponent, NewLoanDashboardComponent, LoanStatusBreakdownChartComponent, LoanDashboardCardComponent],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    UserIdleModule.forRoot({ idle: 900, timeout: 300, ping: 120 }),
    NgHighlightModule,
    ReactiveFormsModule,
    HttpClientModule,
    DataTablesModule,
    AngularMultiSelectModule,
    Select2wrapperModule,
    SweetAlert2Module.forRoot(),
    FormsModule,
    NgbModule,
    TypeaheadModule.forRoot(),
    CurrencyMaskModule,
    Angular4PaystackModule,
    NgxMaskModule.forRoot(),
    MatDialogModule,
    SharedModule,
    FilterBtnComponent
  ],
  providers: [
    AuthGuard,
    PermissionsService,
    ReportService,
    InvestmentService,
    TokenRefreshErrorHandler,
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NoInternetInterceptor,
      multi: true,
    },
  ],
})
export class DashboardModule {
  static get key() {
    return "DashboardModule";
  }
}
