import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
//import { LoginGuard } from 'src/app/util/guard/login.guard';
import { LoginPageComponent } from "./login-page/login-page.component";
import { ForgotpasswordPageComponent } from "./forgotpassword-page/forgotpassword-page.component";
import { PasswordresetPageComponent } from "./passwordreset-page/passwordreset-page.component";
import { AccountVerificationComponent } from "./account-verification/account-verification.component";
import { AuthGuard } from "src/app/util/guard/auth.guard";
import { EmailVerificationComponent } from "./email-verification/email-verification.component";

const routes: Routes = [
  { path: "", component: LoginPageComponent },
  { path: "confirm-email/:code", component: EmailVerificationComponent },
  { path: "verify/:code/:id", component: AccountVerificationComponent },
  {
    path: "password-reset/:id/:code/:key",
    component: PasswordresetPageComponent,
  },
 // { path: "login/:key", component: LoginPageComponent },
  { path: "login", component: LoginPageComponent },
  { path: "forgot-password", component: ForgotpasswordPageComponent },
    { path: '**', redirectTo: '/modules'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
