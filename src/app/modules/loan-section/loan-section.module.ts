import { NgModule } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";

import { LoanSectionRoutingModule } from "./loan-section-routing.module";
import { LoanapplicationsPageComponent } from "./loanapplications-page/loanapplications-page.component";
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
import { NewapplicationPageComponent } from "src/app/modules/loan-section/newapplication-page/newapplication-page.component";
import { ApplicationsPageComponent } from "./applications-page/applications-page.component";
import { DisbursementsPageComponent } from "./disbursements-page/disbursements-page.component";
import { VerificationsPageComponent } from "./verifications-page/verifications-page.component";
import { LoansPageComponent } from "./loans-page/loans-page.component";
import { PaymentsPageComponent } from "./payments-page/payments-page.component";
import { ReportPageComponent } from "./report-page/report-page.component";
import { RedraftloanPageComponent } from "./redraftloan-page/redraftloan-page.component";
import { NoInternetInterceptor } from "src/app/service/no-internet-interceptor.service";
import { CustomersPageComponent } from "./customers-page/customers-page.component";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { PapaParseModule } from "ngx-papaparse";
import { RescheduleLoanComponent } from "src/app/util/loans/reschedule-loan/reschedule-loan.component";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { SharedModule } from "../shared/shared.module";
import { BankStatementAnalysisComponent } from "./bank-statement-analysis/bank-statement-analysis.component";
import { DecideComponent } from "./decide/decide.component";
import { ReassignDisbursementComponent } from "./components/reassign-disbursement/reassign-disbursement.component";
import { DisbursementActivitiesComponent } from "./components/disbursement-activities/disbursement-activities.component";
import { CreateLoanWithRemitaComponent } from "./components/create-loan-with-remita/create-loan-with-remita.component";
import { AllDisbursementBatchesComponent } from "./components/all-disbursement-batches/all-disbursement-batches.component";
import { ViewDisbursementBatchComponent } from "./components/view-disbursement-batch/view-disbursement-batch.component";
import { LoansForDisbursementComponent } from "./components/loans-for-disbursement/loans-for-disbursement.component";
import { RemitaLoanInfoComponent } from "./components/remita-loan-info/remita-loan-info.component";
import { MandatePaymentHistoryComponent } from "./components/mandate-payment-history/mandate-payment-history.component";
import { PreviousLoanApplicationsComponent } from "./components/previous-loan-applications/previous-loan-applications.component";
import { RemitaSalaryInfoComponent } from './components/remita-salary-info/remita-salary-info.component';
import { DataQueryComponent } from './quick-loan/data-query/data-query.component';
import { QuickLoanApplicationsComponent } from './quick-loan/quick-loan-applications/quick-loan-applications.component';
import { PayrollComponent } from "./quick-loan/payroll/payroll.component";
import { ConfigurationComponent } from "./quick-loan/configuration/configuration.component";
import { LoanDepositComponent } from './loan-deposit/loan-deposit.component';
import { LoanDepositCardComponent } from './components/loan-deposit-card/loan-deposit-card.component';
import { MarkDisbFailedComponent } from './components/mark-disb-failed/mark-disb-failed.component';
import { FilterBtnComponent } from "../shared/components/filter-btn/filter-btn.component";
import { DragdropComponent } from "../shared/components/dragdrop/dragdrop.component";
import { ViewLoanPaymentComponent } from "./components/view-loan-payment/view-loan-payment.component";
import { LoanApprovalWorkflowUpdateComponent } from "./components/loan-approval-workflow-update/loan-approval-workflow-update.component";
import { ApprovalCommentComponent } from './components/approval-comment/approval-comment.component';
import { EditLoanApplicationInfoComponent } from './components/edit-loan-application-info/edit-loan-application-info.component';
import { LoanReassignmentErrorComponent } from './components/loan-reassignment-error/loan-reassignment-error.component';
import { PhoneNumberValidationDetailsComponent } from './components/phone-number-validation-details/phone-number-validation-details.component';

@NgModule({
  declarations: [
    LoanapplicationsPageComponent,
    NewapplicationPageComponent,
    ApplicationsPageComponent,
    DisbursementsPageComponent,
    VerificationsPageComponent,
    LoansPageComponent,
    PaymentsPageComponent,
    ReportPageComponent,
    RedraftloanPageComponent,
    CustomersPageComponent,
    RescheduleLoanComponent,
    BankStatementAnalysisComponent,
    DecideComponent,
    ReassignDisbursementComponent,
    DisbursementActivitiesComponent,
    CreateLoanWithRemitaComponent,
    AllDisbursementBatchesComponent,
    ViewDisbursementBatchComponent,
    LoansForDisbursementComponent,
    RemitaLoanInfoComponent,
    MandatePaymentHistoryComponent,
    PreviousLoanApplicationsComponent,
    RemitaSalaryInfoComponent,
    DataQueryComponent,
    QuickLoanApplicationsComponent,
    PayrollComponent,
    ConfigurationComponent,
    LoanDepositComponent,
    LoanDepositCardComponent,
    MarkDisbFailedComponent,
    ViewLoanPaymentComponent,
    LoanApprovalWorkflowUpdateComponent,
    ApprovalCommentComponent,
    EditLoanApplicationInfoComponent,
    LoanReassignmentErrorComponent,
    PhoneNumberValidationDetailsComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    LoanSectionRoutingModule,
    AccordionModule.forRoot(),
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
    PapaParseModule,
    FilterBtnComponent,
    DragdropComponent
  ],
  providers: [
    DecimalPipe,
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
export class LoanSectionModule {
  static get key() {
    return "LoanSectionModule";
  }
}
