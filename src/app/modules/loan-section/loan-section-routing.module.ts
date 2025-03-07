import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { LoanapplicationsPageComponent } from "./loanapplications-page/loanapplications-page.component";
import { NewapplicationPageComponent } from "src/app/modules/loan-section/newapplication-page/newapplication-page.component";
import { ApplicationsPageComponent } from "./applications-page/applications-page.component";
import { VerificationsPageComponent } from "./verifications-page/verifications-page.component";
import { DisbursementsPageComponent } from "./disbursements-page/disbursements-page.component";
import { LoansPageComponent } from "./loans-page/loans-page.component";
import { PaymentsPageComponent } from "./payments-page/payments-page.component";
import { ReportPageComponent } from "./report-page/report-page.component";
import { RedraftloanPageComponent } from "./redraftloan-page/redraftloan-page.component";
import { CustomersPageComponent } from "./customers-page/customers-page.component";
import { DataQueryComponent } from "./quick-loan/data-query/data-query.component";
import { QuickLoanApplicationsComponent } from "./quick-loan/quick-loan-applications/quick-loan-applications.component";
import { PayrollComponent } from "./quick-loan/payroll/payroll.component";
import { ConfigurationComponent } from "./quick-loan/configuration/configuration.component";

const routes: Routes = [
  { path: "new-application", component: NewapplicationPageComponent },

  { path: "claimed-applications", component: ApplicationsPageComponent },
  { path: "claimed-applications/:code", component: ApplicationsPageComponent },

  { path: "verifications", component: VerificationsPageComponent },
  { path: "disbursements", component: DisbursementsPageComponent },
  { path: "disbursements/:view", component: DisbursementsPageComponent },

  { path: "payments", component: PaymentsPageComponent },
  { path: "reports", component: ReportPageComponent },

  { path: "loans", component: LoansPageComponent },
  { path: "customers", component: CustomersPageComponent },
  {
    path: "redraft-loan/:loanid/:redrafttype",
    component: RedraftloanPageComponent,
  },
  {
    path: "redraft-loan/:loanid/:redrafttype/:loanamount/:tenor/:netincome/:loantypeid",
    component: RedraftloanPageComponent,
  },
  {
    path: "quick-loans/applications",
    component: QuickLoanApplicationsComponent,
  },
  { path: "quick-loans/payroll", component: PayrollComponent },
  { path: "quick-loans/config", component: ConfigurationComponent },
  { path: "quick-loans/customer-data-query", component: DataQueryComponent },

  { path: "applications", component: LoanapplicationsPageComponent },

  { path: ":view", component: LoanapplicationsPageComponent },
  { path: ":view/:code", component: LoanapplicationsPageComponent },

  { path: "**", redirectTo: "/main/dashboard" },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoanSectionRoutingModule {}
