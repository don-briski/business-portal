import { Component, Input, OnInit } from "@angular/core";

import { RemitaSalaryHistoryItem } from "../../loan.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import * as moment from "moment";

@Component({
  selector: "lnd-remita-salary-info",
  templateUrl: "./remita-salary-info.component.html",
  styleUrls: ["./remita-salary-info.component.scss"],
})
export class RemitaSalaryInfoComponent implements OnInit {
  @Input() salaryHistory: RemitaSalaryHistoryItem[];
  @Input() colorTheme: ColorThemeInterface;

  ngOnInit(): void {
    this.transformDate();
  }

  transformDate() {
    this.salaryHistory = this.salaryHistory.map((item) => {
      const modifiedDate = item.paymentDate.split(" ")[0];
      const transformedDate = moment(modifiedDate, "DD-MM-YYYY").format(
        "YYYY-MM-DD"
      );
      return { ...item, paymentDate: transformedDate };
    });
  }
}
