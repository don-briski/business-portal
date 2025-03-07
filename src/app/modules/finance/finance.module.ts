import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";

import { FinanceRoutingModule } from "./finance-routing.module";
import { PaymentProcessComponent } from "./expense-mgt/payment-process/payment-process.component";
import { PaymentApprovalComponent } from "./expense-mgt/payment-approval/payment-approval.component";
import { PettyCashTransactionComponent } from "./petty-cash-transaction/petty-cash-transaction.component";
import { AddEditPettyCashTransactionComponent } from "./petty-cash-transaction/add-edit-petty-cash-transaction/add-edit-petty-cash-transaction.component";
import { Select2wrapperModule } from "src/app/library/select2wrapper/select2wrapper.module";
import { CurrencyMaskModule } from "ng2-currency-mask";
import { AllJournalsComponent } from "./journals/all-journals/all-journals.component";
import { AddEditJournalComponent } from "./journals/add-edit-journal/add-edit-journal.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { CreateCoAComponent } from "./chart-of-account/create/create.component";
import { AllCoAccountsComponent } from "./chart-of-account/all-accounts/all-accounts.component";
import { AllAssetsComponent } from "./asset-management/all-assets/all-assets.component";
import { AddEditAssetComponent } from "./asset-management/add-edit-asset/add-edit-asset.component";
import { AssetSubclassComponent } from "./asset-management/asset-subclass/asset-subclass.component";
import { SharedModule } from "../shared/shared.module";
import { LedgerTransactionsComponent } from "./ledger-transactions/ledger-transactions.component";
import { AddEditItemsComponent } from "./items/add-edit-items/add-edit-items.component";
import { ItemsComponent } from "./items/items.component";
import { VendorsComponent } from "./vendors/all-vendors/vendors.component";
import { AddEditVendorComponent } from "./vendors/add-edit-vendor/add-edit-vendor.component";
import { PurchaseOrderComponent } from "./purchase-order/purchase-order.component";
import { AddEditPurchaseOrderComponent } from "./purchase-order/add-edit-purchase-order/add-edit-purchase-order.component";
import { PaymentsMadeComponent } from "./payments-made/payments-made.component";
import { AllBillsComponent } from "./bills-mgt/all-bills/bills.component";
import { AddEditBillComponent } from "./bills-mgt/add-edit-bills/add-edit-bills.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { JournalComponent } from "./journals/journal/journal.component";
import { VendorComponent } from "./vendors/vendor/vendor.component";
import { ExpensesComponent } from "./expense-mgt/expenses/expenses.component";
import { ExpensesTabComponent } from "./expense-mgt/expenses-tab/expenses-tab.component";
import { AddEditExpenseComponent } from "./expense-mgt/add-edit-expense/add-edit-expense.component";
import { ExpenseBulkAddComponent } from "./expense-mgt/expense-bulk-add/expense-bulk-add.component";
import { AccountComponent } from "./chart-of-account/account/account.component";
import { ExpenseComponent } from "./expense-mgt/expense/expense.component";
import { AddEditPaymentsMadeComponent } from "./payments-made/add-edit-payments-made/add-edit-payments-made.component";
import { FilterComponent } from "./filter/filter.component";
import { FinanceReportPageComponent } from "./finance-report-page/finance-report-page.component";
import { AllInvoicesComponent } from "./invoices/all-invoices/all-invoices.component";
import { AddEditInvoiceComponent } from "./invoices/add-edit-invoice/add-edit-invoice.component";
import { InvoiceComponent } from "./invoices/invoice/invoice.component";
import { AssetAdditionsComponent } from "./asset-management/asset-additions/asset-additions.component";
import { AssetDisposalComponent } from "./asset-management/asset-disposal/asset-disposal.component";
import { LoaderComponent } from "./asset-management/asset-additions/components/loader/loader.component";
import { AssetDepreciationComponent } from "./asset-management/asset-depreciation/asset-depreciation.component";
import { AssetRevaluationComponent } from "./asset-management/asset-revaluation/asset-revaluation.component";
import { CashAdvanceComponent } from "./cash-advance/cash-advance.component";
import { VendorCreditsComponent } from "./vendor-credits/vendor-credits/vendor-credits.component";
import { AddEditVendorCreditComponent } from "./vendor-credits/add-edit-vendor-credit/add-edit-vendor-credit.component";
import { AddEditPaymentsReceivedComponent } from "./payments-received/add-edit-payments-received/add-edit-payments-received.component";
import { PaymentsReceivedComponent } from "./payments-received/payments-received/payments-received.component";
import { PaymentReceivedComponent } from "./payments-received/payment-received/payment-received.component";
import { BankComponent } from "./bank/bank/bank.component";
import { CommentsComponent } from "./comments/comments.component";
import { AddEditCashAdvanceComponent } from "./cash-advance/add-edit-cash-advance/add-edit-cash-advance.component";
import { CreditNotesComponent } from "./credit-notes/credit-notes/credit-notes.component";
import { AddCreditNoteComponent } from "./credit-notes/add-credit-note/add-credit-note.component";
import { EditCreditNoteComponent } from "./credit-notes/edit-credit-note/edit-credit-note.component";
import { CreditNoteFormComponent } from "./credit-notes/credit-note-form/credit-note-form.component";
import { LibraryModule } from "src/app/library/library.module";
import { TransactionsComponent } from "./vendors/transactions/transactions.component";
import { AddEditCreditRefundComponent } from "./credit-refund/add-edit-credit-refund/add-edit-credit-refund.component";
import { CreditRefundsComponent } from "./credit-refund/credit-refunds/credit-refunds.component";
import { CreditRefundDetailComponent } from "./credit-refund/credit-refund-detail/credit-refund-detail.component";
import { WorkflowRequestComponent } from "./workflow/workflow-request/workflow-request.component";
import { WorkflowRequestsComponent } from "./workflow/workflow-requests/workflow-requests.component";
import { CustomersComponent } from "./customers/customers/customers.component";
import { CustomerComponent } from "./customers/customer/customer.component";
import { AddEditCustomerComponent } from "./customers/add-edit-customer/add-edit-customer.component";
import { PettyCashRequestComponent } from "./petty-cash-request/petty-cash-request.component";
import { NgbPopoverModule } from "@ng-bootstrap/ng-bootstrap";
import { DashCardComponent } from "./dash-card/dash-card.component";
import { DashTopExpensesComponent } from "./dash-top-expenses/dash-top-expenses.component";
import { DashIncExpComponent } from "./dash-inc-exp/dash-inc-exp.component";
import { CustomerTransactionsComponent } from "./customers/customer-transactions/customer-transactions.component";
import { SetEndOfPeriodComponent } from "./ledger-transactions/set-end-of-period/set-end-of-period.component";
import { PaymentComponent } from "./library/payment/payment.component";
import { ApprovalCommentsComponent } from "./library/approval-comments/approval-comments.component";
import { PayablesReceivablesComponent } from "./library/payables-receivables/payables-receivables.component";
import { AccountStatementComponent } from "./library/account-statement/account-statement.component";
import { ImportModalComponent } from "./library/import-modal/import-modal.component";
import { FilterBtnComponent } from "../shared/components/filter-btn/filter-btn.component";
import { BacklogTransactionsComponent } from './ledger-transactions/backlog-transactions/backlog-transactions.component';

@NgModule({
  declarations: [
    PaymentProcessComponent,
    PaymentApprovalComponent,
    PettyCashTransactionComponent,
    AddEditPettyCashTransactionComponent,
    AllJournalsComponent,
    AddEditJournalComponent,
    DashboardComponent,
    AllCoAccountsComponent,
    CreateCoAComponent,
    AllAssetsComponent,
    AddEditAssetComponent,
    AssetSubclassComponent,
    LedgerTransactionsComponent,
    AllBillsComponent,
    AddEditBillComponent,
    AddEditItemsComponent,
    ItemsComponent,
    VendorsComponent,
    AddEditVendorComponent,
    PurchaseOrderComponent,
    AddEditPurchaseOrderComponent,
    AddEditPaymentsMadeComponent,
    PaymentsMadeComponent,
    JournalComponent,
    VendorComponent,
    ExpensesComponent,
    ExpensesTabComponent,
    AddEditExpenseComponent,
    ExpenseBulkAddComponent,
    AccountComponent,
    ExpenseComponent,
    FilterComponent,
    FinanceReportPageComponent,
    AssetAdditionsComponent,
    AssetDisposalComponent,
    LoaderComponent,
    AssetDepreciationComponent,
    AssetRevaluationComponent,
    CashAdvanceComponent,
    VendorCreditsComponent,
    AddEditVendorCreditComponent,
    AllInvoicesComponent,
    AddEditInvoiceComponent,
    InvoiceComponent,
    AddEditPaymentsReceivedComponent,
    PaymentsReceivedComponent,
    PaymentReceivedComponent,
    BankComponent,
    CommentsComponent,
    AddEditCashAdvanceComponent,
    CreditNotesComponent,
    AddCreditNoteComponent,
    EditCreditNoteComponent,
    CreditNoteFormComponent,
    TransactionsComponent,
    AddEditCreditRefundComponent,
    CreditRefundsComponent,
    CreditRefundDetailComponent,
    WorkflowRequestComponent,
    WorkflowRequestsComponent,
    CustomersComponent,
    CustomerComponent,
    AddEditCustomerComponent,
    ApprovalCommentsComponent,
    PettyCashRequestComponent,
    DashCardComponent,
    DashTopExpensesComponent,
    DashIncExpComponent,
    CustomerTransactionsComponent,
    SetEndOfPeriodComponent,
    PaymentComponent,
    PayablesReceivablesComponent,
    AccountStatementComponent,
    ImportModalComponent,
        BacklogTransactionsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    CurrencyMaskModule,
    FinanceRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    Select2wrapperModule,
    NgbModule,
    LibraryModule,
    NgbPopoverModule,
    FilterBtnComponent,
  ],
})
export class FinanceModule {
  static get key() {
    return "FinanceModule";
  }
}
