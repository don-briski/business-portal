import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../service/auth.service';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgotpassword-page',
  templateUrl: './forgotpassword-page.component.html',
  styleUrls: ['./forgotpassword-page.component.scss']
})
export class ForgotpasswordPageComponent implements OnInit {
  loader = false;
  password: UntypedFormGroup;
  errorMessage = '';
  businessKey = '';
  toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: true,
    // timer: 3000
  });
  constructor(
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.passwordInit();
    this.businessKey = sessionStorage.getItem('appOwnerPublicKey');
  }

  passwordInit() {
    this.password = new UntypedFormGroup({
      EmailAddress: new UntypedFormControl('', [Validators.required, Validators.email])
    });
  }

  passwordSubmit(val) {
    this.errorMessage = '';
    this.loader = true;
    const appOwnerKey = sessionStorage.getItem('appOwnerKey');
    if (this.password.valid) {
      var formvalue = this.password.value;
      const data = {
        EmailAddress: formvalue.EmailAddress,
        UserType: 'BusinessUser',
        AppOwnerKey: appOwnerKey
      };

      this.authService.forgotPassword(data).subscribe(
        (res) => {
          this.loader = false;
          this.toast.fire('Success', 'Your password reset email sent!', 'success');
        },
        (err) => {
          this.loader = false;
          this.toast.fire('Error', err.error, 'error');
          this.errorMessage = err.error;
        },
      );
    }
  }


}
