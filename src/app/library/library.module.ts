import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "../modules/shared/shared.module";
import { InvestmentCertificateComponent } from "./investment-certificate/investment-certificate.component";
import { LibFinanceReportComponent } from "./lib-finance-report/lib-finance-report.component";
import { Select2wrapperModule } from "./select2wrapper/select2wrapper.module";
import { LibUserReportComponent } from "./lib-user-report/lib-user-report.component";
import { LedgerTransactionDetailsComponent } from "../util/ledger-transaction-details/ledger-transaction-details.component";
import { TransactionPinComponent } from './transaction-pin/transaction-pin.component';
import { NgOtpInputModule } from  'ng-otp-input';
import { FilterBtnComponent } from "../modules/shared/components/filter-btn/filter-btn.component";


@NgModule({
  imports: [
    CommonModule,
    Select2wrapperModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgOtpInputModule,
    FilterBtnComponent,
  ],
  exports: [
    InvestmentCertificateComponent,
    LibFinanceReportComponent,
    LibUserReportComponent,
    TransactionPinComponent
  ],
  declarations: [
    InvestmentCertificateComponent,
    LibFinanceReportComponent,
    LibUserReportComponent,
    LedgerTransactionDetailsComponent,
    TransactionPinComponent,
  ],
  providers: [],
})
export class LibraryModule {}
