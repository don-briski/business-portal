import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddEditCustomerComponent } from './components/customer-features/add-edit-customer/add-edit-customer.component';
import { CrmRoutingModule } from './crm-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CaseTypesComponent } from './components/case-types-features/case-types/case-types.component';
import { AddEditCaseComponent } from './components/case-types-features/add-edit-case/add-edit-case.component';
import { CaseComponent } from './components/interactions-features/case/case.component';
import { CrmInteractionsComponent } from './components/interactions-features/crm-interactions/crm-interactions.component';
import { NoteComponent } from './components/interactions-features/note/note.component';
import { CustomerComponent } from './components/customer-features/customer/customer.component';
import { CustomersComponent } from './components/customer-features/customers/customers.component';
import { CrmCustomerProductsComponent } from './components/customer-features/crm-customer-products/crm-customer-products.component';
@NgModule({
  declarations: [
    AddEditCustomerComponent,
    CustomersComponent,
    CustomerComponent,
    CaseTypesComponent,
    AddEditCaseComponent,
    CrmInteractionsComponent,
    CaseComponent,
    NoteComponent,
    CrmCustomerProductsComponent
  ],
  imports: [
    CommonModule,
    CrmRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class CrmModule {
  static get key() {
    return "CRMModule";
  }
}
