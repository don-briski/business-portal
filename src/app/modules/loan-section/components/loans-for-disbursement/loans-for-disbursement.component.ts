import { Component, Input, TemplateRef } from "@angular/core";

import { DisbursementBatch } from "src/app/model/disbursement-batch";
import { AppOwnerInformation } from "src/app/modules/shared/shared.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "lnd-loans-for-disbursement",
  templateUrl: "./loans-for-disbursement.component.html",
  styleUrls: ["./loans-for-disbursement.component.scss"],
})
export class LoansForDisbursementComponent {
  @Input() disbursementBatch: DisbursementBatch;
  @Input() appOwnerInfo: AppOwnerInformation;
  @Input() colorTheme: ColorThemeInterface;

  constructor(private readonly modalService: NgbModal) {}

  getTotal(type: string) {
    let total = 0;

    if (type === "loanAmount") {
      for (let i = 0; i < this.disbursementBatch?.loans.length; i++) {
        total += this.disbursementBatch?.loans[i].loanAmount;
      }
    } else if (type === "buyOverAmount") {
      for (let i = 0; i < this.disbursementBatch?.loans.length; i++) {
        total += this.disbursementBatch?.loans[i].buyOverAmount;
      }
    } else if (type === "fees") {
      if (this.disbursementBatch?.loans != null) {
        for (let i = 0; i < this.disbursementBatch?.loans.length; i++) {
          total += this.disbursementBatch?.loans[i].fees;
        }
      }
    } else if (type === "disbursedAmount") {
      for (let i = 0; i < this.disbursementBatch?.loans.length; i++) {
        total += this.disbursementBatch?.loans[i].disbursedAmount;
      }
    }

    return total;
  }

  getFromJson(stringArray: string, expectedResult: string) {
    let result = "";
    if (stringArray != null && stringArray !== "" && expectedResult !== "") {
      result = JSON.parse(stringArray)[expectedResult];
    }
    return result;
  }

  onOpenModal(view: TemplateRef<any>) {
    this.modalService.open(view, {
      centered: true,
      ariaLabelledBy: "modal-basic-title",
    });
  }
}
