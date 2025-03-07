import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { DepositAccountService } from "src/app/service/depositaccount.service";
import { toFormData } from "src/app/util/finance/financeHelper";
import Swal from "sweetalert2";
import { CreateDepositAccountModel } from "../../models/deposit-account.model";

@Component({
  selector: "app-create-savings-plan",
  templateUrl: "./create-savings-plan.component.html",
  styleUrls: ["./create-savings-plan.component.scss"],
})
export class CreateSavingsPlanComponent implements OnInit, OnDestroy {
  savingsPlan: CreateDepositAccountModel;
  loader: boolean;

  unsubscriber$ = new Subject<void>();
  public toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: true,
  });
  constructor(private depositAccountService: DepositAccountService, private router: Router) {}

  ngOnInit(): void {
    this.setCustomerDetails();
  }

  ngOnDestroy(): void {
    this.depositAccountService.removeExistingCustomer();
  }

  setSavingsPlan(data: CreateDepositAccountModel): void {
    this.savingsPlan = data;
  }

  setCustomerDetails(): void {
    const customer = DepositAccountService.getExistingCustomer();
    this.savingsPlan = customer;
  }

  submitForm(data: CreateDepositAccountModel): void {
    this.setSavingsPlan(data);
    const formData = toFormData(this.savingsPlan)
    this.loader = true;
    this.depositAccountService
      .createDepositAccount(formData)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.toast.fire('Savings plan created successfully');
        this.router.navigateByUrl('/deposits/accounts');
        this.loader = false;
      }, err => {
        this.loader = false;
      });
  }
}
