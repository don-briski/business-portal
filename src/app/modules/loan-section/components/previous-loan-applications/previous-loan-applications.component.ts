import { Component, EventEmitter, Input, Output } from "@angular/core";

import { PreviousLoanApplication } from "../../loan.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";

@Component({
  selector: "lnd-previous-loan-applications",
  templateUrl: "./previous-loan-applications.component.html",
  styleUrls: ["./previous-loan-applications.component.scss"],
})
export class PreviousLoanApplicationsComponent {
  @Input() loanApplications: PreviousLoanApplication[];
  @Input() colorTheme: ColorThemeInterface;
  @Output() viewLoan = new EventEmitter<number>();

  onViewLoan(id: number) {
    this.viewLoan.emit(id);
  }
}
