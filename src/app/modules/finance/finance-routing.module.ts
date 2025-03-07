import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { PaymentProcessComponent } from "./expense-mgt/payment-process/payment-process.component";
import { PaymentApprovalComponent } from "./expense-mgt/payment-approval/payment-approval.component";
import { PettyCashTransactionComponent } from "./petty-cash-transaction/petty-cash-transaction.component";
import { AddEditPettyCashTransactionComponent } from "./petty-cash-transaction/add-edit-petty-cash-transaction/add-edit-petty-cash-transaction.component";
import { AllJournalsComponent } from "./journals/all-journals/all-journals.component";
import { AddEditJournalComponent } from "./journals/add-edit-journal/add-edit-journal.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { CreateCoAComponent } from "./chart-of-account/create/create.component";
import { AllCoAccountsComponent } from "./chart-of-account/all-accounts/all-accounts.component";
import { AddEditAssetComponent } from "./asset-management/add-edit-asset/add-edit-asset.component";
import { AllAssetsComponent } from "./asset-management/all-assets/all-assets.component";
import { AssetSubclassComponent } from "./asset-management/asset-subclass/asset-subclass.component";
import { LedgerTransactionsComponent } from "./ledger-transactions/ledger-transactions.component";

import { AddEditItemsComponent } from "./items/add-edit-items/add-edit-items.component";
import { ItemsComponent } from "./items/items.component";
import { VendorsComponent } from "./vendors/all-vendors/vendors.component";
import { AddEditVendorComponent } from "./vendors/add-edit-vendor/add-edit-vendor.component";
import { PurchaseOrderComponent } from "./purchase-order/purchase-order.component";
import { AddEditPurchaseOrderComponent } from "./purchase-order/add-edit-purchase-order/add-edit-purchase-order.component";
import { AddEditUnitsComponent } from "./unit/add-edit-units/add-edit-units.component";
import { PaymentsMadeComponent } from "./payments-made/payments-made.component";
import { AddEditPaymentsMadeComponent } from "./payments-made/add-edit-payments-made/add-edit-payments-made.component";
import { AddEditBillComponent } from "./bills-mgt/add-edit-bills/add-edit-bills.component";
import { AllBillsComponent } from "./bills-mgt/all-bills/bills.component";
import { ExpensesComponent } from "./expense-mgt/expenses/expenses.component";
import { ExpensesTabComponent } from "./expense-mgt/expenses-tab/expenses-tab.component";
import { FinanceReportPageComponent } from "./finance-report-page/finance-report-page.component";
import { CashAdvanceComponent } from "./cash-advance/cash-advance.component";
import { VendorCreditsComponent } from "./vendor-credits/vendor-credits/vendor-credits.component";
import { AllInvoicesComponent } from "./invoices/all-invoices/all-invoices.component";
import { AddEditInvoiceComponent } from "./invoices/add-edit-invoice/add-edit-invoice.component";
import { PaymentsReceivedComponent } from "./payments-received/payments-received/payments-received.component";
import { AddEditPaymentsReceivedComponent } from "./payments-received/add-edit-payments-received/add-edit-payments-received.component";
import { AddEditCashAdvanceComponent } from "./cash-advance/add-edit-cash-advance/add-edit-cash-advance.component";
import { CreditNotesComponent } from "./credit-notes/credit-notes/credit-notes.component";
import { EditCreditNoteComponent } from "./credit-notes/edit-credit-note/edit-credit-note.component";
import { AddCreditNoteComponent } from "./credit-notes/add-credit-note/add-credit-note.component";
import { WorkflowRequestsComponent } from "./workflow/workflow-requests/workflow-requests.component";
import { CustomersComponent } from "./customers/customers/customers.component";
import { AddEditCustomerComponent } from "./customers/add-edit-customer/add-edit-customer.component";
import { PettyCashRequestComponent } from "./petty-cash-request/petty-cash-request.component";
import { BacklogTransactionsComponent } from "./ledger-transactions/backlog-transactions/backlog-transactions.component";
import { AddEditVendorCreditComponent } from "./vendor-credits/add-edit-vendor-credit/add-edit-vendor-credit.component";

const routes: Routes = [
  { path: "dashboard", component: DashboardComponent },
  { path: "payment-process", component: PaymentProcessComponent },
  { path: "payment-approval", component: PaymentApprovalComponent },
  { path: "pettycash/transaction", component: PettyCashTransactionComponent },
  {
    path: "pettycash/transaction/create",
    component: AddEditPettyCashTransactionComponent,
  },
  {
    path: "pettycash/transaction/edit/:id",
    component: AddEditPettyCashTransactionComponent,
  },
  {
    path: "pettycash/transaction/:id",
    component: PettyCashTransactionComponent,
  },
  { path: "pettycash/request", component: PettyCashRequestComponent },
  { path: "journals", component: AllJournalsComponent },
  { path: "journals/create", component: AddEditJournalComponent },
  { path: "journals/edit/:id", component: AddEditJournalComponent },
  { path: "journals/:id/clone", component: AddEditJournalComponent },
  { path: "coa/all", component: AllCoAccountsComponent },
  { path: "coa/create", component: CreateCoAComponent },
  { path: "coa/edit/:id", component: CreateCoAComponent },
  { path: "assets/all", component: AllAssetsComponent },
  { path: "assets/create", component: AddEditAssetComponent },
  { path: "assets/edit/:id", component: AddEditAssetComponent },
  { path: "assets/sub-class", component: AssetSubclassComponent },
  { path: "transactions", component: LedgerTransactionsComponent },
  { path: "transactions/backlog", component: BacklogTransactionsComponent },
  { path: "items", component: ItemsComponent },
  { path: "items/create", component: AddEditItemsComponent },
  { path: "items/edit/:id", component: AddEditItemsComponent },
  { path: "vendors", component: VendorsComponent },
  { path: "vendors/create", component: AddEditVendorComponent },
  { path: "vendors/edit/:id", component: AddEditVendorComponent },
  { path: "purchase-orders", component: PurchaseOrderComponent },
  { path: "purchase-orders/create", component: AddEditPurchaseOrderComponent },
  {
    path: "purchase-orders/edit/:id",
    component: AddEditPurchaseOrderComponent,
  },
  {
    path: "purchase-orders/:id/clone",
    component: AddEditPurchaseOrderComponent,
  },
  {
    path: "purchase-orders/edit/:id",
    component: AddEditPurchaseOrderComponent,
  },
  { path: "bills/all", component: AllBillsComponent },
  { path: "bills/create", component: AddEditBillComponent },
  { path: "bills/edit/:id", component: AddEditBillComponent },
  { path: "bills/:id/clone", component: AddEditBillComponent },
  { path: "units/create", component: AddEditUnitsComponent },
  { path: "units/edit/:id", component: AddEditUnitsComponent },
  { path: "payments-made", component: PaymentsMadeComponent },
  { path: "payments-made/create", component: AddEditPaymentsMadeComponent },
  { path: "payments-made/edit/:id", component: AddEditPaymentsMadeComponent },
  { path: "expenses", component: ExpensesComponent },
  { path: "expenses/create", component: ExpensesTabComponent },
  { path: "expenses/edit/:id", component: ExpensesTabComponent },
  { path: "expenses/:id/clone", component: ExpensesTabComponent },
  { path: "cash-advance/all", component: CashAdvanceComponent },
  { path: "cash-advance/create", component: AddEditCashAdvanceComponent },
  { path: "cash-advance/edit/:id", component: AddEditCashAdvanceComponent },
  { path: "invoices", component: AllInvoicesComponent },
  { path: "invoices/create", component: AddEditInvoiceComponent },
  { path: "invoices/edit/:id", component: AddEditInvoiceComponent },
  { path: "invoices/:id/clone", component: AddEditInvoiceComponent },
  { path: "reports", component: FinanceReportPageComponent },
  { path: "vendor-credit-notes", component: VendorCreditsComponent },
  {
    path: "vendor-credit-notes/create",
    component: AddEditVendorCreditComponent,
  },
  {
    path: "vendor-credit-notes/edit/:id",
    component: AddEditVendorCreditComponent,
  },
  {
    path: "vendor-credit-notes/:id/clone",
    component: AddEditVendorCreditComponent,
  },
  { path: "credit-notes", component: CreditNotesComponent },
  { path: "credit-notes/create", component: AddCreditNoteComponent },
  {
    path: "credit-notes/edit/:id",
    component: EditCreditNoteComponent,
  },
  { path: "payments-received", component: PaymentsReceivedComponent },
  {
    path: "payments-received/create",
    component: AddEditPaymentsReceivedComponent,
  },
  {
    path: "payments-received/edit/:id",
    component: AddEditPaymentsReceivedComponent,
  },
  { path: "workflow-requests", component: WorkflowRequestsComponent },

  { path: "customers", component: CustomersComponent },
  { path: "customers/create", component: AddEditCustomerComponent },
  { path: "customers/edit/:id", component: AddEditCustomerComponent },

  { path: "**", redirectTo: "/dashboard" },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FinanceRoutingModule {}
