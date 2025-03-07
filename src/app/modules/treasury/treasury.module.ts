import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { TreasuryRoutingModule } from "./treasury-routing.module";
import { InvestmentsPageComponent } from "./investments-page/investments-page.component";
import { InvestmentPageComponent } from "./investment-page/investment-page.component";
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
import { NoInternetInterceptor } from "src/app/service/no-internet-interceptor.service";
import { InvestmentReportsPageComponent } from "./investmentreports-page/investmentreports-page.component";
import { InvestmentDashboardComponent } from "./investment-dashboard/investment-dashboard.component";
import { FinancialInstitutionComponent } from "./financialinstitution/financialinstitution.component";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { InvestmentconfigurationPageComponent } from "./investmentconfiguration-page/investmentconfiguration-page.component";
import { SharedModule } from "../shared/shared.module";
import { CustomAsideComponent } from "./components/custom-aside/custom-aside.component";
import { SplitInvestmentComponent } from "./components/split-investment/split-investment.component";
import { AllShortTermPlacementsComponent } from "./short-term-placements/all-short-term-placements/all-short-term-placements.component";
import { AddeditShortTermPlacementsComponent } from "./short-term-placements/addedit-short-term-placements/addedit-short-term-placements.component";
import { ShortTermPlacementComponent } from "./short-term-placements/short-term-placement/short-term-placement.component";
import { InvestmentLiquidationRequestsComponent } from './investment-liquidation-requests/investment-liquidation-requests.component';
import { ViewInvestmentLiquidationRequestComponent } from './components/view-investment-liquidation-request/view-investment-liquidation-request.component';
import { InvestmentScheduleComponent } from './components/investment-schedule/investment-schedule.component';
import { AddEditInvestmentComponent } from './components/add-edit-investment/add-edit-investment.component';
import { AddEditInvestmentForm } from "./components/add-edit-investment-form/add-edit-investment-form.component";

@NgModule({
    declarations: [
        InvestmentsPageComponent,
        InvestmentPageComponent,
        InvestmentReportsPageComponent,
        InvestmentDashboardComponent,
        ShortTermPlacementComponent,
        FinancialInstitutionComponent,
        InvestmentconfigurationPageComponent,
        CustomAsideComponent,
        SplitInvestmentComponent,
        AllShortTermPlacementsComponent,
        AddeditShortTermPlacementsComponent,
        InvestmentLiquidationRequestsComponent,
        ViewInvestmentLiquidationRequestComponent,
        InvestmentScheduleComponent,
        AddEditInvestmentComponent,
        AddEditInvestmentForm,
    ],
    imports: [
        CommonModule,
        SharedModule,
        TreasuryRoutingModule,
        UserIdleModule.forRoot({ idle: 900, timeout: 300, ping: 120 }),
        NgHighlightModule,
        ReactiveFormsModule,
        HttpClientModule,
        DataTablesModule,
        AngularMultiSelectModule,
        SweetAlert2Module.forRoot(),
        FormsModule,
        NgbModule,
        TypeaheadModule.forRoot(),
        CurrencyMaskModule,
        Angular4PaystackModule,
        NgxMaskModule.forRoot(),
        MatDialogModule,
        Select2wrapperModule,
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
    ]
})
export class TreasuryModule {
  static get key() {
    return "TreasuryModule";
  }
}
