import { BrowserModule } from "@angular/platform-browser";
import { isDevMode, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AuthGuard } from "./util/guard/auth.guard";
import { JwtModule } from "@auth0/angular-jwt";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AngularMultiSelectModule } from "angular2-multiselect-dropdown";
import { DataTablesModule } from "angular-datatables";
import { SweetAlert2Module } from "@sweetalert2/ngx-sweetalert2";
import { SidebarComponent } from "./util/sidebar/sidebar.component";
import { FooterComponent } from "./util/footer/footer.component";
import { IntegrationchannelsPageComponent } from "./modules/unusedComponents/integrationchannels-page/integrationchannels-page.component";
import { RecoverymeasurePageComponent } from "./modules/unusedComponents/recoverymeasure-page/recoverymeasure-page.component";
import { NotesPageComponent } from "./modules/unusedComponents/notes-page/notes-page.component";
import { CurrencyMaskModule } from "ng2-currency-mask";
import { PermissionsService } from "./service/permissions.service";
import { TypeaheadModule } from "ngx-bootstrap";
import { NgxMaskModule, IConfig } from "ngx-mask";
import { Angular4PaystackModule } from "angular4-paystack";
import { FeesPageComponent } from "./modules/unusedComponents/fees-page/fees-page.component";
import { UserIdleModule } from "angular-user-idle";
import { ReportService } from "./service/report.service";
import { NgHighlightModule } from "ngx-text-highlight";
import { InvestmentService } from "./service/investment.service";
import { TokenRefreshErrorHandler } from "./service/TokenRefreshErrorHandler";
import { TokenSessionComponent } from "./util/token-session/token-session.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {MatDialogModule} from '@angular/material/dialog';
import { ErrorInterceptor } from "./service/tokenErrorInterceptor";
import { LayoutComponent } from "./util/layout/layout.component";
import { NoInternetInterceptor } from "./service/no-internet-interceptor.service";
import { AllModulesPageComponent } from "./util/all-modules-page/all-modules-page.component";
import { GuidedTourModule, GuidedTourService } from "ngx-guided-tour";
import { RolecheckModalComponent } from "./util/rolecheck-modal/rolecheck-modal.component";
import { NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { PushNotificationsModule } from "ng-push";
import { Select2Module } from "ng-select2-component";
import { Select2wrapperModule } from "./library/select2wrapper/select2wrapper.module";
import { NgMultiSelectDropDownModule } from "ng-multiselect-dropdown";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { LottieModule } from "ngx-lottie";
import player from "lottie-web";
import { LoanMetricsService } from "./service/loan-metrics.service";
import { LibraryModule } from "./library/library.module";
import { SingleProcessLogPageComponent } from "./util/single-process-log-page/single-process-log-page.component";
import { SharedModule } from "./modules/shared/shared.module";
import { JwtTokenInterceptor } from "./util/interceptors/jwt-token.interceptor";
import { YearlyReviewDialogComponent } from './util/yearly-review-dialog/yearly-review-dialog.component';
import { NumberFormatPipe } from "./util/custom-pipes/number-format.pipe";
import { ModuleCardComponent } from './util/module-card/module-card.component';
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { configHeroReducer, crmCustomerReducer, filtersReducer} from "./store/reducers";

export function jwtTokenGetter() {
  return JSON.parse(sessionStorage.getItem("token"));
}
export function playerFactory() {
  return player;
}
@NgModule({
    declarations: [
        AppComponent,
        SidebarComponent,
        FooterComponent,
        IntegrationchannelsPageComponent,
        RecoverymeasurePageComponent,
        NotesPageComponent,
        FeesPageComponent,
        TokenSessionComponent,
        LayoutComponent,
        AllModulesPageComponent,
        RolecheckModalComponent,
        SingleProcessLogPageComponent,
        YearlyReviewDialogComponent,
        ModuleCardComponent,
    ],
    imports: [
        // Optionally you can set time for `idle`, `timeout` and `ping` in seconds.
        // Default values: `idle` is 900 (10 minutes), `timeout` is 300 (5 minutes)
        // and `ping` is 120 (2 minutes).
        UserIdleModule,
        NgHighlightModule,
        BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        HttpClientModule,
        DataTablesModule,
        AngularMultiSelectModule,
        // SelectModule,
        SweetAlert2Module.forRoot(),
        FormsModule,
        SharedModule,
        NgbModule,
        TypeaheadModule.forRoot(),
        CurrencyMaskModule,
        Angular4PaystackModule,
        NgxMaskModule.forRoot(),
        JwtModule.forRoot({
            config: {
                tokenGetter: jwtTokenGetter,
                allowedDomains: [],
                skipWhenExpired: true,
            },
        }),
        BrowserAnimationsModule,
        MatDialogModule,
        // LottieAnimationViewModule.forRoot(),
        LottieModule.forRoot({ player: playerFactory }),
        GuidedTourModule,
        NgbTooltipModule,
        PushNotificationsModule,
        Select2Module,
        // NgSelectModule,
        Select2wrapperModule,
        NgMultiSelectDropDownModule.forRoot(),
        StoreModule.forRoot({filters:filtersReducer,configHero:configHeroReducer,crmCustomer:crmCustomerReducer,}),
        StoreDevtoolsModule.instrument({
          maxAge: 25, // Retains last 25 states
          logOnly: !isDevMode(), // Restrict extension to log-only mode
        }),
        EffectsModule.forRoot([]),
        LibraryModule,
        NumberFormatPipe
    ],
    providers: [
        AuthGuard,
        PermissionsService,
        ReportService,
        InvestmentService,
        TokenRefreshErrorHandler,
        GuidedTourService,
        LoanMetricsService,
        { provide: HTTP_INTERCEPTORS, useClass: JwtTokenInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: NoInternetInterceptor,
            multi: true,
        },
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
