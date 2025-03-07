import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AuthGuard } from "./util/guard/auth.guard";
import { IntegrationchannelsPageComponent } from "./modules/unusedComponents/integrationchannels-page/integrationchannels-page.component";
import { RecoverymeasurePageComponent } from "./modules/unusedComponents/recoverymeasure-page/recoverymeasure-page.component";
import { NotesPageComponent } from "./modules/unusedComponents/notes-page/notes-page.component";
import { LayoutComponent } from "./util/layout/layout.component";
import { AllModulesPageComponent } from "./util/all-modules-page/all-modules-page.component";
import { SubscriptionResolver } from "./util/guard/subscriptionresolver";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { LoanSectionModule } from "./modules/loan-section/loan-section.module";
import { TreasuryModule } from "./modules/treasury/treasury.module";
import { WorkflowModule } from "./modules/workflow/workflow.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { DepositModule } from "./modules/deposit/deposit.module";
import { SingleProcessLogPageComponent } from "./util/single-process-log-page/single-process-log-page.component";
import { LedgerTransactionDetailsComponent } from "./util/ledger-transaction-details/ledger-transaction-details.component";
import { CheckoutAdminModule } from "./modules/checkout-admin/checkout-admin.module";
import { CrmModule } from "./modules/crm/crm.module";
import { wacsModule } from "./modules/wacs/wacs.module";

const routes: Routes = [
  {
    path: "account",
    loadChildren: () =>
      import("./modules/account/account.module").then((a) => a.AccountModule),
  },

  { path: "process-log/:log-code", component: SingleProcessLogPageComponent },
  {
    path: "account-transactions/:reference/:account-name/:account-id/:account-number/:transaction-type/:start-date/:end-date/:page-size/:page-number/:paginated",
    component: LedgerTransactionDetailsComponent,
  },
  {
    path: "",
    component: LayoutComponent,
    children: [
      {
        path: "main",
        loadChildren: () =>
          import("./modules/dashboard/dashboard.module").then(
            (m) => m.DashboardModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: DashboardModule.key },
      },
      {
        path: "loan",
        loadChildren: () =>
          import("./modules/loan-section/loan-section.module").then(
            (m) => m.LoanSectionModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: LoanSectionModule.key },
      },
      {
        path: "deposits",
        loadChildren: () =>
          import("./modules/deposit/deposit.module").then(
            (m) => m.DepositModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: DepositModule.key },
      },
      {
        path: "finance",
        loadChildren: () =>
          import("./modules/finance/finance.module").then(
            (m) => m.FinanceModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: FinanceModule.key },
      },
      {
        path: "workflow",
        loadChildren: () =>
          import("./modules/workflow/workflow.module").then(
            (m) => m.WorkflowModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: WorkflowModule.key },
      },
      {
        path: "treasury",
        loadChildren: () =>
          import("./modules/treasury/treasury.module").then(
            (m) => m.TreasuryModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: TreasuryModule.key },
      },
      {
        path: "configurations",
        loadChildren: () =>
          import("./modules/configuration/configuration.module").then(
            (m) => m.ConfigurationModule
          ),
      },
      {
        path: "checkout-admin",
        loadChildren: () =>
          import("./modules/checkout-admin/checkout-admin.module").then(
            (m) => m.CheckoutAdminModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: CheckoutAdminModule.key },
      },
      {
        path: "crm",
        loadChildren: () =>
          import("./modules/crm/crm.module").then(
            (m) => m.CrmModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: CrmModule.key },
      },
      {
        path: "wacs",
        loadChildren: () =>
          import("./modules/wacs/wacs.module").then(
            (m) => m.wacsModule
          ),
        resolve: {
          isSubscriptionActive: SubscriptionResolver,
        },
        data: { module: wacsModule.key },
      },
      {
        path: "**",
        redirectTo: "/modules",
      },
    ],
    canActivate: [AuthGuard],
  },
  {
    path: "modules",
    component: AllModulesPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "integrationchannels",
    component: IntegrationchannelsPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "recoverymeasures",
    component: RecoverymeasurePageComponent,
    canActivate: [AuthGuard],
  },
  { path: "notes", component: NotesPageComponent, canActivate: [AuthGuard] },
  { path: "**", redirectTo: "/modules" },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
    }),
  ],
  exports: [RouterModule],
  providers: [SubscriptionResolver],
})
export class AppRoutingModule {}
