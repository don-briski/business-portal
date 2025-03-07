import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../../service/auth.service";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { UntypedFormGroup, UntypedFormControl, Validators } from "@angular/forms";
import Swal from "sweetalert2";

@Component({
  selector: "app-passwordreset-page",
  templateUrl: "./passwordreset-page.component.html",
  styleUrls: ["./passwordreset-page.component.scss"],
})
export class PasswordresetPageComponent implements OnInit {
  resetForm: UntypedFormGroup;
  validatingPw = false;
  UserId: number;
  UserCode: string;
  Code: string;
  loader = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  Key: string;
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.UserCode = params.get("id");
      this.Code = params.get("code");
      this.Key = params.get("key");

      this.getUsers();
    });
  }

  getUsers() {
    this.loader = true;
    this.authService
      .getUserForPasswordReset({
        Id: this.UserCode,
        Code: this.Code,
        Key: this.Key,
      })
      .subscribe(
        (res) => {
          this.loader = false;
          this.UserId = res.userId;
          this.resetFormInit();
        },
        (err) => {
          this.toast.fire("Error", err.error, "error");
          this.loader = false;
        }
      );
  }

  resetFormInit() {
    this.resetForm = new UntypedFormGroup({
      Password: new UntypedFormControl("", [Validators.required]),
      ConfirmPassword: new UntypedFormControl("", [Validators.required]),
      UserId: new UntypedFormControl(this.UserId, [Validators.required]),
      Code: new UntypedFormControl(this.Code, [Validators.required]),
      AppOwnerKey: new UntypedFormControl(this.Key, [Validators.required]),
    });
  }

  checkPwValidity() {
    this.validatingPw = true;
    this.authService
      .validatePassword(this.resetForm.get("Password").value)
      .subscribe({
        next: (res) => {
          this.validatingPw = false;
          this.submitResetForm();
        },
        error: (err) => {
          this.validatingPw = false;
        },
      });
  }

  submitResetForm() {
    if (this.resetForm.valid) {
      this.loader = true;

      this.authService.resetPassword(this.resetForm.value).subscribe(
        (res) => {
          this.loader = false;
          this.toast.fire(
            "Success",
            "Password was successfully reset, now login.",
            "success"
          );
        },
        (err) => {
          this.loader = false;
          this.toast.fire("Error", err.error, "error");
        }
      );
    }
  }
}
