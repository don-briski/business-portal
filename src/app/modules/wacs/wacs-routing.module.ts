import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { WacsLoanProductsComponent } from "./loan-products/wacs-loan-products.component";
import { AddEditWacsLoanProductComponent } from "./add-edit-wacs-loan-product/add-edit-wacs-loan-product.component";
import { WacsLoanProductComponent } from "./wacs-loan-product/wacs-loan-product.component";
import { TransactionsComponent } from "./transactions/transactions.component";
import { WacsCustomersComponent } from "./wacs-customers/wacs-customers.component";
import { CreateWacsCustomerComponent } from "./create-wacs-customer/create-wacs-customer.component";
import { WascCustomerComponent } from "./wasc-customer/wasc-customer.component";

const routes: Routes = [
  {
    path: "loan-products",
    component: WacsLoanProductsComponent,
  },
  {
    path: "loan-products/create",
    component: AddEditWacsLoanProductComponent,
  },
  // {
  //   path: "loan-products/edit/:id",
  //   component: AddEditWacsLoanProductComponent,
  // },
  {
    path: "loan-products/:id",
    component: WacsLoanProductComponent,
  },
  {
    path: "transactions",
    component: TransactionsComponent,
  },
  {
    path: "customers",
    component: WacsCustomersComponent,
  },
  {
    path: "customers/create",
    component: CreateWacsCustomerComponent,
  },
  {
    path: "customers/:id",
    component: WascCustomerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class wacsRoutingModule {}
