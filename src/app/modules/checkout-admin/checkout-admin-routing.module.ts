import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { ConfigLayoutComponent } from "./components/config-layout/config-layout.component";
import { RiskAssessmentComponent } from "./components/risk-assessment-configs/risk-assessment/risk-assessment.component";
import { CreditAffordabilityComponent } from "./components/credit-affordabilty-configs/credit-affordability/credit-affordability.component";
import { MerchantsComponent } from "./components/merchants/merchants.component";
import { AddEditMerchantComponent } from "./components/add-edit-merchant/add-edit-merchant.component";
import { ViewMerchantComponent } from "./components/view-merchant/view-merchant.component";
import { AffordProfileComponent } from "./components/afford/afford-profile/afford-profile.component";
import { ProfilesComponent } from "./components/afford/profiles/profiles.component";
import { ViewCustomerCreditFileProfileComponent } from "./components/view-customer-credit-file-profile/view-customer-credit-file-profile.component";
import { ReportsComponent } from "./components/reports/reports.component";
import { TransactionsComponent } from "./components/transactions/transactions.component";

const routes: Routes = [
  {
    path: "config",
    component: ConfigLayoutComponent,
    children: [
      { path: "risk-assessment", component: RiskAssessmentComponent },
      { path: "credit-affordability", component: CreditAffordabilityComponent },
    ],
  },
  { path: "reports", component: ReportsComponent },
  { path: "transactions", component: TransactionsComponent },
  { path: "customers", component: ProfilesComponent },
  { path: "config/merchants", component: MerchantsComponent },
  { path: "config/merchants/add", component: AddEditMerchantComponent },
  { path: "config/merchants/:id", component: ViewMerchantComponent },
  { path: "customers/:id", component: AffordProfileComponent },
  {
    path: "customers/:id/credit-file-profile",
    component: ViewCustomerCreditFileProfileComponent,
  },
  {
    path: "config/merchants/:id/edit",
    component: AddEditMerchantComponent,
  },
  { path: "", redirectTo: "config", pathMatch: "full" },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CheckoutAdminRoutingModule {}
