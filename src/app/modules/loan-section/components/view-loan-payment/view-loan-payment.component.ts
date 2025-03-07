import { Component, Input } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { LoanPayment } from "../../loan.types";

@Component({
  selector: "app-view-loan-payment",
  templateUrl: "./view-loan-payment.component.html",
  styleUrls: ["./view-loan-payment.component.scss"],
})
export class ViewLoanPaymentComponent {
  @Input() payment: LoanPayment;

  constructor(private readonly modalService: NgbModal) {}

  onClose() {
    this.modalService.dismissAll();
  }
}
