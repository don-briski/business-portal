import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { InvestmentsetupPageComponent } from "./investmentsetup-page/investmentsetup-page.component";
import { LoantypesPageComponent } from "src/app/modules/configuration/loantypes-page/loantypes-page.component";
import { LoantypesotherparametersPageComponent } from "./loantypesotherparameters-page/loantypesotherparameters-page.component";
import { LoanreasonsPageComponent } from "src/app/modules/configuration/loanreasons-page/loanreasons-page.component";
import { UsersPageComponent } from "src/app/modules/configuration/users-page/users-page.component";
import { BusinessesPageComponent } from "src/app/modules/configuration/businesses-page/businesses-page.component";
import { SettingsPageComponent } from "src/app/modules/configuration/settings-page/settings-page.component";
import { LoansetupPageComponent } from "./loansetup-page/loansetup-page.component";
import { LoanoffersPageComponent } from "./loanoffers-page/loanoffers-page.component";
import { UnderwriterReasonComponent } from "./underwriter-reason/underwriter-reason.component";
import { FinancesetupPageComponent } from "./financesetup-page/financesetup-page.component";
import { ShorttermPlacementsTypesComponent } from "./shortterm-placements/shortterm-placements/shortterm-placements.component";
import { BulkProcessesComponent } from "./bulk-processes/bulk-processes.component";
import { ReportPageComponent } from "./report-page/report-page.component";
import { LoanTypeSetupComponent } from "./loan-type-setup/loan-type-setup.component";
import { InvtypeV2Component } from "./invtype-v2/invtype-v2.component";
import { AddEditPlacementTypeComponent } from "./add-edit-placement-type/add-edit-placement-type.component";
import { AddEditLoanApprovalWorkflowComponent } from "./add-edit-loan-approval-workflow/add-edit-loan-approval-workflow.component";
import { ViewLoanApprovalWorkflowComponent } from "./view-loan-approval-workflow/view-loan-approval-workflow.component";

const routes: Routes = [
  { path: "investment-types", component: InvestmentsetupPageComponent },
  { path: "investment-types/create", component: InvtypeV2Component },
  { path: "investment-types/edit/:id", component: InvtypeV2Component },
  { path: "placement-types/create", component: AddEditPlacementTypeComponent },
  {
    path: "placement-types/edit/:id",
    component: AddEditPlacementTypeComponent,
  },
  { path: "placement-types", component: ShorttermPlacementsTypesComponent },
  { path: "loantypes", component: LoantypesPageComponent },
  { path: "loantypes/create", component: LoanTypeSetupComponent },
  { path: "loantypes/edit/:id", component: LoanTypeSetupComponent },
  { path: "loanoffers", component: LoanoffersPageComponent },
  { path: "parameterssetup", component: LoantypesotherparametersPageComponent },
  { path: "parameterssetup/loan-approval-workflows/add", component: AddEditLoanApprovalWorkflowComponent },
  { path: "parameterssetup/loan-approval-workflows/edit/:id", component: AddEditLoanApprovalWorkflowComponent },
  { path: "parameterssetup/loan-approval-workflows/:id", component: ViewLoanApprovalWorkflowComponent },
  { path: "loanreasons", component: LoanreasonsPageComponent },
  { path: "loansetup", component: LoansetupPageComponent },
  { path: "financesetup", component: FinancesetupPageComponent },
  {
    path: "roles-and-permissions",
    loadComponent: () =>
      import("./user-management/components/roles-and-permissions/roles-and-permissions.component"),
  },
  {
    path: "roles-and-permissions/add",
    loadComponent: () =>
      import(
        "./user-management/components/add-edit-role/add-edit-role.component"
      ),
  },
  {
    path: "view-roles-and-permissions/:id",
    loadComponent: () =>
      import(
        "./user-management/components/view-role-permissions/view-role-permissions.component"
      ),
  },
  {
    path: "roles-and-permissions/edit/:id",
    loadComponent: () =>
      import(
        "./user-management/components/add-edit-role/add-edit-role.component"
      ),
  },
  { path: "users", component: UsersPageComponent },
  { path: "businesses", component: BusinessesPageComponent },
  { path: "underwriter-reasons", component: UnderwriterReasonComponent },
  { path: "settings", component: SettingsPageComponent },
  { path: "settings/:page", component: SettingsPageComponent },
  { path: "bulk-processes", component: BulkProcessesComponent },
  { path: "reports", component: ReportPageComponent },
  { path: "**", redirectTo: "/main/dashboard" },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfigurationRoutingModule {}
