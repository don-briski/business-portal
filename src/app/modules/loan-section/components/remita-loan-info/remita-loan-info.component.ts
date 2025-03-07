import { Component, Input, OnInit } from "@angular/core";

import { RemitaLoanHistoryItem } from "../../loan.types";
import * as moment from "moment";

@Component({
  selector: "lnd-remita-loan-info",
  templateUrl: "./remita-loan-info.component.html",
  styleUrls: ["./remita-loan-info.component.scss"],
})
export class RemitaLoanInfoComponent implements OnInit {
  @Input() loanHistory: RemitaLoanHistoryItem[];

  ngOnInit(): void {
    this.transformDate();
  }

  transformDate() {
    this.loanHistory = this.loanHistory.map((item) => {
      const modifiedDate = item.loanDisbursementDate.split(" ")[0];
      const transformedDate = moment(modifiedDate, "DD-MM-YYYY").format(
        "YYYY-MM-DD"
      );
      return { ...item, loanDisbursementDate: transformedDate };
    });
  }
}
