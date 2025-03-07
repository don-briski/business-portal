import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ConfigurationRoutingModule } from "./configuration-routing.module";
import { InvestmentsetupPageComponent } from "./investmentsetup-page/investmentsetup-page.component";
import { UserIdleModule } from "angular-user-idle";
import { NgHighlightModule } from "ngx-text-highlight";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { DataTablesModule } from "angular-datatables";
import { AngularMultiSelectModule } from "angular2-multiselect-dropdown";
import { ColorPickerModule } from "ngx-color-picker";
import { SweetAlert2Module } from "@sweetalert2/ngx-sweetalert2";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TypeaheadModule } from "ngx-bootstrap";
import { CurrencyMaskModule } from "ng2-currency-mask";
import { Angular4PaystackModule } from "angular4-paystack";
import { MatLegacySlideToggleModule as MatSlideToggleModule } from "@angular/material/legacy-slide-toggle";
import { NgxMaskModule } from "ngx-mask";
import {MatDialogModule} from '@angular/material/dialog';
import { AuthGuard } from "src/app/util/guard/auth.guard";
import { PermissionsService } from "src/app/service/permissions.service";
import { UserService } from "src/app/service/user.service";
import { ReportService } from "src/app/service/report.service";
import { InvestmentService } from "src/app/service/investment.service";
import { TokenRefreshErrorHandler } from "src/app/service/TokenRefreshErrorHandler";
import { ErrorInterceptor } from "src/app/service/tokenErrorInterceptor";
import { LoantypesPageComponent } from "./loantypes-page/loantypes-page.component";
import { LoantypesotherparametersPageComponent } from "./loantypesotherparameters-page/loantypesotherparameters-page.component";
import { LoanreasonsPageComponent } from "src/app/modules/configuration/loanreasons-page/loanreasons-page.component";
import { UsersPageComponent } from "./users-page/users-page.component";
import { PermissionPageComponent } from "./permission-page/permission-page.component";
import { BusinessesPageComponent } from "src/app/modules/configuration/businesses-page/businesses-page.component";
import { SettingsPageComponent } from "src/app/modules/configuration/settings-page/settings-page.component";
import { NoInternetInterceptor } from "src/app/service/no-internet-interceptor.service";
import { LoansetupPageComponent } from "./loansetup-page/loansetup-page.component";
import { LoanoffersPageComponent } from "./loanoffers-page/loanoffers-page.component";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { UnderwriterReasonComponent } from "./underwriter-reason/underwriter-reason.component";
import { SharedModule } from "../shared/shared.module";
import { FinancesetupPageComponent } from "./financesetup-page/financesetup-page.component";
import { UnitComponent } from "../finance/unit/unit.component";
import { AddEditUnitsComponent } from "../finance/unit/add-edit-units/add-edit-units.component";
import { MonnifySetupComponent } from "./monnify-setup/monnify-setup.component";
import { AccountClassificationComponent } from "../finance/account-classification/account-classification.component";
import { ReportPageComponent } from "./report-page/report-page.component";
import { LibraryModule } from "src/app/library/library.module";
import { ShorttermPlacementsTypesComponent } from "./shortterm-placements/shortterm-placements/shortterm-placements.component";
import { AddeditPlacementTypeComponent } from "./shortterm-placements/addedit-placement/addedit-placement.component";
import { BulkProcessesComponent } from "./bulk-processes/bulk-processes.component";
import { DecideSetupComponent } from "./decide-setup/decide-setup.component";
import { InteractionsParentComponent } from "./interactions/interactions-parent/interactions-parent.component";
import { LoanInteractionsComponent } from "./interactions/loan-interactions/loan-interactions.component";
import { InvInteractionsComponent } from "./interactions/inv-interactions/inv-interactions.component";
import { StpInteractionsComponent } from "./interactions/stp-interactions/stp-interactions.component";
import { OpeningBalancesComponent } from "../finance/opening-balances/opening-balances.component";
import { TransactionLockComponent } from "../finance/transaction-lock/transaction-lock.component";
import { KudaSetupComponent } from './kuda-setup/kuda-setup.component';
import { LoanTypeSetupComponent } from "./loan-type-setup/loan-type-setup.component";
import { InvtypeV2Component } from "./invtype-v2/invtype-v2.component";
import { NotificationsComponent } from './loan_setup/notifications/notifications.component';
import { DojahSetupComponent } from "./dojah-setup/dojah-setup.component";
import { SeerbitSetupComponent } from './seerbit-setup/seerbit-setup.component';
import { AddEditPlacementTypeComponent } from './add-edit-placement-type/add-edit-placement-type.component';
import { FilterBtnComponent } from "../shared/components/filter-btn/filter-btn.component";
import { DragdropComponent } from "../shared/components/dragdrop/dragdrop.component";
import { CustomerVendorBalancesComponent } from "./customer-vendor-balances/customer-vendor-balances.component";
import { SmsSettingsComponent } from "./sms-settings/sms-settings.component";
import { TermiiComponent } from "./integrations/termii/termii.component";
import { MonoComponent } from "./integrations/mono/mono.component";
import { MultiTexterComponent } from "./integrations/multitexter/multitexter.component";
import { AfricaTalkingComponent } from "./integrations/africa-talking/africa-talking.component";
import { StoreModule } from "@ngrx/store";
import { permissionReducer } from "./user-management/store/reducers";
import { AddEditLoanApprovalWorkflowComponent } from './add-edit-loan-approval-workflow/add-edit-loan-approval-workflow.component';
import { ViewLoanApprovalWorkflowComponent } from './view-loan-approval-workflow/view-loan-approval-workflow.component';
import { DisbursementLimitsComponent } from './disb-limit/disbursement-limits/disbursement-limits.component';
import { AddEditDisbLimitComponent } from './disb-limit/add-edit-disb-limit/add-edit-disb-limit.component';
import { SetLimitAlertComponent } from './disb-limit/notifications/set-limit-alert/limit-alert.component';

@NgModule({
  declarations: [
    InvestmentsetupPageComponent,
    LoantypesPageComponent,
    LoantypesotherparametersPageComponent,
    LoanreasonsPageComponent,
    UsersPageComponent,
    PermissionPageComponent,
    BusinessesPageComponent,
    SettingsPageComponent,
    LoansetupPageComponent,
    LoanoffersPageComponent,
    UnderwriterReasonComponent,
    FinancesetupPageComponent,
    UnitComponent,
    AddEditUnitsComponent,
    MonnifySetupComponent,
    AccountClassificationComponent,
    ShorttermPlacementsTypesComponent,
    DecideSetupComponent,
    AddeditPlacementTypeComponent,
    BulkProcessesComponent,
    ReportPageComponent,
    InteractionsParentComponent,
    LoanInteractionsComponent,
    InvInteractionsComponent,
    StpInteractionsComponent,
    OpeningBalancesComponent,
    TransactionLockComponent,
    KudaSetupComponent,
    LoanTypeSetupComponent,
    InvtypeV2Component,
    NotificationsComponent,
    DojahSetupComponent,
    SeerbitSetupComponent,
    AddEditPlacementTypeComponent,
    CustomerVendorBalancesComponent,
    AddEditLoanApprovalWorkflowComponent,
    ViewLoanApprovalWorkflowComponent,
    DisbursementLimitsComponent,
    AddEditDisbLimitComponent,
    SetLimitAlertComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    StoreModule.forFeature('permissions', permissionReducer),
    ConfigurationRoutingModule,
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
    MatSlideToggleModule,
    Select2wrapperModule,
    ColorPickerModule,
    LibraryModule,
    FilterBtnComponent,
    DragdropComponent,
    SmsSettingsComponent,
    TermiiComponent,
    MonoComponent,
    MultiTexterComponent,
    AfricaTalkingComponent,
  ],
  providers: [
    AuthGuard,
    PermissionsService,
    UserService,
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
export class ConfigurationModule {
  static get key() {
    return "ConfigurationModule";
  }
}
