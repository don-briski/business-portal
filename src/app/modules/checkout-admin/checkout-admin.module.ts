import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { ConfigLayoutComponent } from './components/config-layout/config-layout.component';
import { CheckoutAdminRoutingModule } from './checkout-admin-routing.module';
import { RiskAssessmentComponent } from './components/risk-assessment-configs/risk-assessment/risk-assessment.component';
import { HeroComponent } from '../shared/components/hero/hero.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreditAffordabilityComponent } from './components/credit-affordabilty-configs/credit-affordability/credit-affordability.component';
import { BankCheckComponent } from './components/credit-affordabilty-configs/bank-check/bank-check.component';
import { LoanConfigComponent } from './components/credit-affordabilty-configs/loan-config/loan-config.component';
import { NarrationCipherComponent } from './components/credit-affordabilty-configs/narration-cipher/narration-cipher.component';
import { AccActivityCipherComponent } from './components/credit-affordabilty-configs/acc-activity-cipher/acc-activity-cipher.component';
import { IncomeCipherComponent } from './components/credit-affordabilty-configs/income-cipher/income-cipher.component';
import { SweeperCipherComponent } from './components/credit-affordabilty-configs/sweeper-cipher/sweeper-cipher.component';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { MerchantsComponent } from "./components/merchants/merchants.component";
import { ViewMerchantComponent } from "./components/view-merchant/view-merchant.component";
import { AddEditMerchantComponent } from "./components/add-edit-merchant/add-edit-merchant.component";
import { MerchantTransactionsComponent } from './components/merchant-transactions/merchant-transactions.component';
import { MerchantCommissionsComponent } from './components/merchant-commissions/merchant-commissions.component';
import { CustomDatePipePipe } from 'src/app/util/custom-pipes/custom-date-pipe.pipe';
import { GambleCheckComponent } from './components/credit-affordabilty-configs/gamble-check/gamble-check.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ViewCustomerCreditFileProfileComponent } from './components/view-customer-credit-file-profile/view-customer-credit-file-profile.component';
import { InviteMerchantStaffComponent } from './components/invite-merchant-staff/invite-merchant-staff.component';
import { ReportsComponent } from './components/reports/reports.component';
import { FilterBtnComponent } from '../shared/components/filter-btn/filter-btn.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { StringHumanifyPipe } from 'src/app/util/custom-pipes/string-humanify.pipe';

@NgModule({
  declarations: [
    MerchantsComponent,
    ViewMerchantComponent,
    AddEditMerchantComponent,
    ConfigLayoutComponent,
    RiskAssessmentComponent,
    CreditAffordabilityComponent,
    BankCheckComponent,
    LoanConfigComponent,
    NarrationCipherComponent,
    AccActivityCipherComponent,
    IncomeCipherComponent,
    SweeperCipherComponent,
    MerchantTransactionsComponent,
    MerchantCommissionsComponent,
    MerchantsComponent,
    ViewMerchantComponent,
    AddEditMerchantComponent,
    GambleCheckComponent,
    ViewCustomerCreditFileProfileComponent,
    InviteMerchantStaffComponent,
    ReportsComponent,
    TransactionsComponent,
  ],
  providers: [CustomDatePipePipe, StringHumanifyPipe],
  imports: [
    CommonModule,
    SharedModule,
    CheckoutAdminRoutingModule,
    HeroComponent,
    ReactiveFormsModule,
    FormsModule,
    CurrencyMaskModule,
    NgbModule,
    FilterBtnComponent
  ]
})
export class CheckoutAdminModule {
  static get key() {
    return "CheckoutAdminModule";
  }
}
