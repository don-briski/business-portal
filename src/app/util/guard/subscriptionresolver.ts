import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';
import { UserService } from 'src/app/service/user.service';
import { tap, take } from 'rxjs/operators';
import { stat } from 'node:fs';
import { LoanSectionModule } from 'src/app/modules/loan-section/loan-section.module';
import { TreasuryModule } from 'src/app/modules/treasury/treasury.module';
import { DashboardModule } from 'src/app/modules/dashboard/dashboard.module';
import { WorkflowModule } from 'src/app/modules/workflow/workflow.module';
import { FinanceModule } from 'src/app/modules/finance/finance.module';
import { DepositModule } from 'src/app/modules/deposit/deposit.module';
import { CheckoutAdminModule } from 'src/app/modules/checkout-admin/checkout-admin.module';
import { CrmModule } from 'src/app/modules/crm/crm.module';
import { wacsModule } from 'src/app/modules/wacs/wacs.module';

@Injectable()
export class SubscriptionResolver implements Resolve<any> {
    appIsModular: boolean;
    /**
     * Resolve user subscription access
     */
    constructor(
        private authService: AuthService,
        private userService: UserService,
        private router: Router
    ) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        this.userService.getUserInfo(this.authService.decodeToken().nameid).subscribe(
            (res) => {
                this.authService.subscriptionActive = res.body.isSubscriptionActive;
                this.appIsModular = res.body.isModular
                if (!this.appIsModular && !this.authService.subscriptionActive) {
                    // TODO: @Bode redirect to the dashboard homepage
                    this.router.navigate(['/modules']);
                }
                if(this.appIsModular){
                    const modules = res.body?.modules;
                    const loanSubscriptionIsActive =  !!modules?.find(m => m.moduleName.toLowerCase() == "loan" && m.isActive == true) ;
                    const investmentSubscriptionIsActive = !!modules?.find(m => m.moduleName.toLowerCase() == "investment" && m.isActive == true);
                    const financeSubscriptionIsActive = !!modules?.find(m => m.moduleName.toLowerCase() == "finance" && m.isActive == true);
                    const depositSubscriptionIsActive = !!modules?.find(m => m.moduleName.toLowerCase() == "deposit" && m.isActive == true);
                    const workflowSubscriptionIsActive = !!modules?.find(m => m.moduleName.toLowerCase() == "workflow" && m.isActive == true);
                    const checkoutAdminSubscriptionIsActive = !!modules?.find(m => m.moduleName.toLowerCase() == "checkout-admin" && m.isActive == true);
                    const crmSubscriptionIsActive = !!modules?.find(m => m.moduleName.toLowerCase() == "crm" && m.isActive == true);
                    const wacsSubscriptionIsActive = !!modules?.find(m => m.moduleName.toLowerCase() == "wacs" && m.isActive == true);

                    const currentModule = route.data.module;
                    if( currentModule == DashboardModule.key || currentModule == LoanSectionModule.key && loanSubscriptionIsActive){
                        return;
                    }else if(currentModule == TreasuryModule.key && investmentSubscriptionIsActive){
                        return;
                    }else if(currentModule == FinanceModule.key && financeSubscriptionIsActive){
                        return;
                    }else if(currentModule == DepositModule.key && depositSubscriptionIsActive){
                        return;
                    }else if(currentModule == WorkflowModule.key && workflowSubscriptionIsActive){
                        return;
                    }else if(currentModule == CheckoutAdminModule.key && checkoutAdminSubscriptionIsActive){
                      return;
                    }else if(currentModule == CrmModule.key && crmSubscriptionIsActive){
                      return;
                    } else if(currentModule == wacsModule.key && wacsSubscriptionIsActive){
                      return;
                    }

                    this.router.navigate(['/modules']);
                }
            }
        );
    }

}
