import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { DashboardComponent } from "./dashboard/dashboard.component";
import { RequestConfigsComponent } from "./pages/request-configs/request-configs.component";
import { RequestsComponent } from "./pages/requests/requests.component";
import { ApprovalComponent } from "./pages/approval/approval.component";
import { WorkflowReportsComponent } from "./pages/workflow-reports/workflow-reports.component";

const routes: Routes = [
  { path: "", component: DashboardComponent },
  { path: "dashboard", component: DashboardComponent },
  { path: "request-configs", component: RequestConfigsComponent },
  { path: "requests", component: RequestsComponent },
  {
    path: "approval",
    children: [
      {
        path: "roles",
        data: { category: "Roles" },
        component: ApprovalComponent,
      },
      {
        path: "teams",
        data: { category: "Teams" },
        component: ApprovalComponent,
      },
      {
        path: "users",
        data: { category: "Users" },
        component: ApprovalComponent,
      },
    ],
  },
  { path: "reports", component: WorkflowReportsComponent },
  { path: "**", redirectTo: "/dashboard" },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkflowRoutingModule {}
