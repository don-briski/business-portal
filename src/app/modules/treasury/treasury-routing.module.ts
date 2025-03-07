import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { InvestmentsPageComponent } from "./investments-page/investments-page.component";
import { InvestmentReportsPageComponent } from "./investmentreports-page/investmentreports-page.component";
import { InvestmentDashboardComponent } from "./investment-dashboard/investment-dashboard.component";
import { AllShortTermPlacementsComponent } from "./short-term-placements/all-short-term-placements/all-short-term-placements.component";
import { FinancialInstitutionComponent } from "./financialinstitution/financialinstitution.component";
import { InvestmentconfigurationPageComponent } from "./investmentconfiguration-page/investmentconfiguration-page.component";
import { InvestmentLiquidationRequestsComponent } from "./investment-liquidation-requests/investment-liquidation-requests.component";
import { AddEditInvestmentComponent } from "./components/add-edit-investment/add-edit-investment.component";

const routes: Routes = [
  { path: "investment-dashboard", component: InvestmentDashboardComponent },
  { path: "investments", component: InvestmentsPageComponent },
  { path: "investments/create", component: AddEditInvestmentComponent },
  { path: "investments/edit/:id", component: AddEditInvestmentComponent },
  {
    path: "liquidation-requests",
    component: InvestmentLiquidationRequestsComponent,
  },
  { path: "investmentreports", component: InvestmentReportsPageComponent },
  { path: "short-term-placement", component: AllShortTermPlacementsComponent },
  { path: "financialinstitution", component: FinancialInstitutionComponent },
  { path: "investment-setup", component: InvestmentconfigurationPageComponent },
  { path: "", component: InvestmentDashboardComponent },
  { path: "**", redirectTo: "/main/dashboard" },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TreasuryRoutingModule {}
