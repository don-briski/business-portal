import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth.service';
import { CustomerService } from 'src/app/service/customer.service';
import { DepositAccountService } from 'src/app/service/depositaccount.service';

@Component({
  selector: 'app-new-customer-profile',
  templateUrl: './new-customer-profile.component.html',
  styleUrls: ['./new-customer-profile.component.scss']
})
export class NewCustomerProfileComponent implements OnInit, OnDestroy {
  @ViewChild('successModal') successModal: ElementRef;
  customerForm: UntypedFormGroup;
  unsubscriber$ = new Subject<void>();
  loading: boolean;
  loggedInUser: any;
  accountToBeCreated: string;
  constructor(private fb: UntypedFormBuilder, private customerService: CustomerService, private modalService: NgbModal,
    private authService: AuthService, private depositAccountService: DepositAccountService, private router: Router) { }

  ngOnInit(): void {
    this.loggedInUser = this.authService.decodeToken();
    this.initForm();
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
    this.depositAccountService.setAccountToCreate(null);
  }

  initForm(): void {
    this.customerForm = this.fb.group({
      lastName: new UntypedFormControl(null, [Validators.required]),
      firstName: new UntypedFormControl(null, [Validators.required]),
      dateOfBirth: new UntypedFormControl(null, [Validators.required]),
      phoneNumber: new UntypedFormControl(null, [Validators.required]),
      emailAddress: new UntypedFormControl(null, [Validators.required, Validators.email]),
      bvn: new UntypedFormControl(null, [Validators.required]),
      userId: new UntypedFormControl(this.loggedInUser.nameid, [Validators.required]),
      residentialAddress: new UntypedFormControl(null)
    });
  }

  saveCustomer(): void {
    if (this.customerForm.valid) {
      this.loading = true;
      const data = this.customerForm.value;
      this.customerService.createCustomer(data).pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
        this.openModal(this.successModal);
        this.customerService.setCustomer(data);
        this.loading = false;
      }, (err: any) => {
        this.loading = false;
      });
    }
  }

  getDepositAccountType(): void {
    this.depositAccountService.accountToCreate$.pipe(takeUntil(this.unsubscriber$)).subscribe(res => {
      if (res) {
        this.accountToBeCreated = res;
      } else {
        this.router.navigateByUrl('/deposits/accounts');
      }
    })
  }

  openModal(content): void {
    this.modalService.open(content, {centered: true, size: 'md'})
  }

  closeModal() {
    this.modalService.dismissAll();
  }

}
