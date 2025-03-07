import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DepositRoutingModule } from "./deposit-routing.module";
import { DepositPlanComponent } from "./deposit-product/deposit-plan.component";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { BalanceDetailsComponent } from "./deposit-product/component-pieces/balance-details/balance-details.component";
import { FeesDetailsComponent } from "./deposit-product/component-pieces/fees-details/fees-details.component";
import { InterestDetailsComponent } from "./deposit-product/component-pieces/interest-details/interest-details.component";
import { ProductDetailsComponent } from "./deposit-product/component-pieces/product-details/product-details.component";
import { DepositProductEffects } from "./store/deposit.effects";
import { depositReducer } from "./store/deposit.reducer";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CreateDepositPlanComponent } from "./deposit-product/create-deposit-plan/create-deposit-plan.component";
import { DepositAccountComponent } from "./deposit-account/deposit-account.component";
import { NewCustomerProfileComponent } from "./deposit-account/new-customer-profile/new-customer-profile.component";
import { CreateSavingsPlanComponent } from "./deposit-account/create-savings-plan/create-savings-plan.component";
import { AccountDetailsComponent } from "./deposit-account/create-savings-plan/account-details/account-details.component";
import { ContactDetailsComponent } from "./deposit-account/create-savings-plan/contact-details/contact-details.component";
import { CreateFixedDepositPlanComponent } from "./deposit-account/create-fixed-deposit-plan/create-fixed-deposit-plan.component";
import { CreateSavingsAccountComponent } from "./deposit-account/create-savings-account/create-savings-account.component";
import { CurrencyMaskModule } from "ng2-currency-mask";
import { DepositSetupComponent } from "./deposit-setup/deposit-setup.component";
import { DepositDashboardComponent } from "./deposit-dashboard/deposit-dashboard.component";
import { DepositGroupsComponent } from "./group-management/deposit-groups/deposit-groups.component";
import { ViewDepositGroupsComponent } from "./group-management/view-deposit-groups/view-deposit-groups.component";
import { SharedModule } from "../shared/shared.module";
import { AddEditDepositGroupComponent } from "./group-management/add-edit-deposit-group/add-edit-deposit-group.component";

@NgModule({
  declarations: [
    DepositPlanComponent,
    ProductDetailsComponent,
    InterestDetailsComponent,
    BalanceDetailsComponent,
    FeesDetailsComponent,
    CreateDepositPlanComponent,
    DepositAccountComponent,
    NewCustomerProfileComponent,
    CreateSavingsPlanComponent,
    AccountDetailsComponent,
    ContactDetailsComponent,
    CreateFixedDepositPlanComponent,
    CreateSavingsAccountComponent,
    DepositSetupComponent,
    DepositDashboardComponent,
    DepositGroupsComponent,
    ViewDepositGroupsComponent,
    AddEditDepositGroupComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    DepositRoutingModule,
    Select2wrapperModule,
    StoreModule.forFeature("depositProduct", depositReducer),
    EffectsModule.forFeature([DepositProductEffects]),
    CurrencyMaskModule,
  ],
})
export class DepositModule {
  static get key() {
    return "DepositModule";
  }
}
