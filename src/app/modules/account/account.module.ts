import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AccountRoutingModule } from "./account-routing.module";
import { LoginPageComponent } from "./login-page/login-page.component";
import { PasswordresetPageComponent } from "./passwordreset-page/passwordreset-page.component";
import { ForgotpasswordPageComponent } from "./forgotpassword-page/forgotpassword-page.component";
import { UserIdleModule } from "angular-user-idle";
import { NgHighlightModule } from "ngx-text-highlight";
import { BrowserModule } from "@angular/platform-browser";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { DataTablesModule } from "angular-datatables";
import { AngularMultiSelectModule } from "angular2-multiselect-dropdown";
import { SelectModule } from "ng2-select";
import { SweetAlert2Module } from "@sweetalert2/ngx-sweetalert2";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TypeaheadModule } from "ngx-bootstrap";
import { CurrencyMaskModule } from "ng2-currency-mask";
import { Angular4PaystackModule } from "angular4-paystack";
import { NgxMaskModule } from "ngx-mask";
import { JwtModule } from "@auth0/angular-jwt";
import { jwtTokenGetter } from "src/app/app.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {MatDialogModule} from '@angular/material/dialog';
import { AuthGuard } from "src/app/util/guard/auth.guard";
//import { LoginGuard } from 'src/app/util/guard/login.guard';
import { PermissionsService } from "src/app/service/permissions.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ReportService } from "src/app/service/report.service";
import { InvestmentService } from "src/app/service/investment.service";
import { TokenRefreshErrorHandler } from "src/app/service/TokenRefreshErrorHandler";
import { ErrorInterceptor } from "src/app/service/tokenErrorInterceptor";
import { NoInternetInterceptor } from "src/app/service/no-internet-interceptor.service";
import { AccountVerificationComponent } from "./account-verification/account-verification.component";
import { EmailVerificationComponent } from "./email-verification/email-verification.component";
import { SharedModule } from "../shared/shared.module";

@NgModule({
  declarations: [
    LoginPageComponent,
    PasswordresetPageComponent,
    ForgotpasswordPageComponent,
    AccountVerificationComponent,
    EmailVerificationComponent,
  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    UserIdleModule.forRoot({ idle: 900, timeout: 300, ping: 120 }),
    NgHighlightModule,
    ReactiveFormsModule,
    HttpClientModule,
    DataTablesModule,
    AngularMultiSelectModule,
    // SelectModule,
    SweetAlert2Module.forRoot(),
    FormsModule,
    NgbModule,
    TypeaheadModule.forRoot(),
    CurrencyMaskModule,
    Angular4PaystackModule,
    NgxMaskModule.forRoot(),
    MatDialogModule,
    SharedModule,
  ],
  providers: [
    PermissionsService,
    ReportService,
    InvestmentService,
    TokenRefreshErrorHandler,
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NoInternetInterceptor,
      multi: true,
    },
  ],
})
export class AccountModule {}
