import { Component, Input } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as moment from "moment";

import { MandatePaymentHistory } from "../../loan.types";

@Component({
  selector: "lnd-mandate-payment-history",
  templateUrl: "./mandate-payment-history.component.html",
  styleUrls: ["./mandate-payment-history.component.scss"],
})
export class MandatePaymentHistoryComponent {
  @Input() data: MandatePaymentHistory;

  constructor(private readonly modalService: NgbModal) {}

  transformDate(date: string) {
    const modifiedDate = date.split(" ")[0];
    const transformedDate = moment(modifiedDate, "DD-MM-YYYY").format(
      "YYYY-MM-DD"
    );

    return transformedDate;
  }

  onClose() {
    this.modalService.dismissAll();
  }
}
