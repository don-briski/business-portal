import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CaseTypesComponent } from "./components/case-types-features/case-types/case-types.component";
import { ConfigLayoutComponent } from "../checkout-admin/components/config-layout/config-layout.component";
import { CustomersComponent } from "./components/customer-features/customers/customers.component";
import { AddEditCustomerComponent } from "./components/customer-features/add-edit-customer/add-edit-customer.component";
import { CustomerComponent } from "./components/customer-features/customer/customer.component";

const routes: Routes = [
  {
    path: "customers",
    component: CustomersComponent,
  },

  {
    path: "customers/create",
    component: AddEditCustomerComponent,
  },
  {
    path: "customers/edit/:id",
    component: AddEditCustomerComponent,
  },
  {
    path: "customers/:id",
    component: CustomerComponent,
  },
  {
    path: "configurations",
    component: ConfigLayoutComponent,
    children:[
      {
        path: "",
        component: CaseTypesComponent,
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrmRoutingModule {}
