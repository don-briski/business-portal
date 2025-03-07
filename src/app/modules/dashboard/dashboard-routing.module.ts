import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardPageComponent } from 'src/app/modules/dashboard/dashboard-page/dashboard-page.component';
import { PoolPageComponent } from 'src/app/modules/dashboard/pool-page/pool-page.component';

const routes: Routes = [
  { path: 'pool', component: PoolPageComponent },
  { path: 'pool/:view', component: PoolPageComponent },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: '**', redirectTo: '/main/dashboard'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
