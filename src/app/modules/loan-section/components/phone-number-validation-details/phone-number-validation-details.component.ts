import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { title } from "node:process";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ConfigurationService } from "src/app/service/configuration.service";
import Swal from "sweetalert2";

@Component({
  selector: "lnd-phone-number-validation-details",
  templateUrl: "./phone-number-validation-details.component.html",
  styleUrls: ["./phone-number-validation-details.component.scss"],
})
export class PhoneNumberValidationDetailsComponent
  implements OnInit, OnDestroy
{
  @Input() customerAltPhoneNumber: string;
  @Input() loanId: number;

  unsubscriber$ = new Subject<void>();
  transactionPin: string;
  customerData: any;
  loading = false;
  verifyingAltPhoneNo = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private modalService: NgbModal,
    private configService: ConfigurationService,
  ) {}

  ngOnInit(): void {
    this.verifyAltPhoneNumber();
  }

  verifyAltPhoneNumber() {
    this.verifyingAltPhoneNo = true;

    this.configService
      .verifyPhoneNumber(this.customerAltPhoneNumber)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.customerData = res.body.data;
          this.verifyingAltPhoneNo = false;
        },
        error: () => {
          this.verifyingAltPhoneNo = false;
          this.onCloseModal()
        },
      });
  }

  onConfirm() {
    const payload = {
      alternatePhoneNumberInfo: this.customerData,
      phoneNumber: this.customerAltPhoneNumber,
      loanId: this.loanId,
    };
    this.loading = true;
    this.configService
      .validatePhoneNumber(payload, this.transactionPin)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.fire({type:"success",title:"Phone number validated successfully!"});
          window.location.reload();
          this.onCloseModal();
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onCloseModal() {
    this.modalService.dismissAll();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
