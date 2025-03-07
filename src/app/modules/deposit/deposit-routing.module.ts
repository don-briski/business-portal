import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CreateFixedDepositPlanComponent } from "./deposit-account/create-fixed-deposit-plan/create-fixed-deposit-plan.component";
import { CreateSavingsAccountComponent } from "./deposit-account/create-savings-account/create-savings-account.component";
import { CreateSavingsPlanComponent } from "./deposit-account/create-savings-plan/create-savings-plan.component";
import { DepositAccountComponent } from "./deposit-account/deposit-account.component";
import { NewCustomerProfileComponent } from "./deposit-account/new-customer-profile/new-customer-profile.component";
import { DepositDashboardComponent } from "./deposit-dashboard/deposit-dashboard.component";
import { CreateDepositPlanComponent } from "./deposit-product/create-deposit-plan/create-deposit-plan.component";
import { DepositPlanComponent } from "./deposit-product/deposit-plan.component";
import { DepositSetupComponent } from "./deposit-setup/deposit-setup.component";
import { AddEditDepositGroupComponent } from "./group-management/add-edit-deposit-group/add-edit-deposit-group.component";
import { DepositGroupsComponent } from "./group-management/deposit-groups/deposit-groups.component";

const routes: Routes = [
  { path: "dashboard", component: DepositDashboardComponent },
  { path: "setup", component: DepositSetupComponent },
  { path: "groups/create", component: AddEditDepositGroupComponent },
  { path: "groups", component: DepositGroupsComponent },
  { path: "groups/edit/:id", component: AddEditDepositGroupComponent },
  { path: "products", component: DepositPlanComponent },
  { path: "new-product", component: CreateDepositPlanComponent },
  { path: "edit-product/:id", component: CreateDepositPlanComponent },
  { path: "accounts", component: DepositAccountComponent },
  { path: "accounts/new-customer", component: NewCustomerProfileComponent },
  {
    path: "accounts/create-savings-plan",
    component: CreateSavingsPlanComponent,
  },
  {
    path: "accounts/create-savings-accoun",
    component: CreateSavingsAccountComponent,
  },
  {
    path: "accounts/create-fixed-deposit-plan",
    component: CreateFixedDepositPlanComponent,
  },
  { path: "**", redirectTo: "/deposits/dashboard" }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DepositRoutingModule {}
