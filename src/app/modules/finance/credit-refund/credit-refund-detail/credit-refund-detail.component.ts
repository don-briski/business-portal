import { Component, EventEmitter, Input, Output } from "@angular/core";

import { CreditRefund } from "../credit-refund.types";

@Component({
  selector: "lnd-credit-refund-detail",
  templateUrl: "./credit-refund-detail.component.html",
  styleUrls: ["./credit-refund-detail.component.scss"],
})
export class CreditRefundDetailComponent {
  @Output() closeDetailView = new EventEmitter<void>();
  
  @Input() creditRefunds: CreditRefund[];
  @Input() appOwner: any;
  @Input() selectedCR: CreditRefund;

  currentTab = "overview";

  onViewSingleRefund(cr: CreditRefund) {
    this.selectedCR = cr;
  }

  onSwitchTab(name: string) {
    switch (name) {
      case "overview":
        this.currentTab = name;
        break;
      case "comments":
        this.currentTab = name;
        break;
      default:
        this.currentTab = "overview";
    }
  }

  onCloseDetailView() {
    this.closeDetailView.emit();
  }
}
