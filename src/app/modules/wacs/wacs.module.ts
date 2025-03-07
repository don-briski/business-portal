import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { wacsRoutingModule } from './wacs-routing.module';
import { WacsLoanProductsComponent } from './loan-products/wacs-loan-products.component';
import { AddEditWacsLoanProductComponent } from './add-edit-wacs-loan-product/add-edit-wacs-loan-product.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { WacsLoanProductComponent } from './wacs-loan-product/wacs-loan-product.component';
import { WacsCustomersComponent } from './wacs-customers/wacs-customers.component';
import { CreateWacsCustomerComponent } from './create-wacs-customer/create-wacs-customer.component';
import { WascCustomerComponent } from './wasc-customer/wasc-customer.component';
import { TransactionsComponent } from './transactions/transactions.component';

@NgModule({
  declarations: [WacsLoanProductsComponent, AddEditWacsLoanProductComponent, WacsLoanProductComponent, WacsCustomersComponent, CreateWacsCustomerComponent,WascCustomerComponent,TransactionsComponent],
  imports: [
    CommonModule,
    SharedModule,
    ReactiveFormsModule,
    wacsRoutingModule,
    NgbModule
  ]
})
export class wacsModule {
  static get key() {
    return "wacsModule";
  }
}
