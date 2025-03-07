import { Component, Input } from "@angular/core";

@Component({
  selector: "lnd-required-pw-params",
  templateUrl: "./required-pw-params.component.html",
  styleUrls: ["./required-pw-params.component.scss"],
})
export class RequiredPwParamsComponent {
  @Input() enteredPw = "";

  get hasMinChars() {
    return this.enteredPw.length > 7;
  }

  get hasUppercase() {
    return /[A-Z]/.test(this.enteredPw);
  }

  get hasLowercase() {
    return /[a-z]/.test(this.enteredPw);
  }

  get hasNumber() {
    return /\d/.test(this.enteredPw);
  }

  get hasSpecialChar() {
    return /[!@#\$%\^\&*\)\(+=._-]/.test(this.enteredPw);
  }
}
