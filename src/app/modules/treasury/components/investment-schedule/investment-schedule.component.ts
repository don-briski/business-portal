import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  AppOwnerInformation,
  DtListItemType,
  TableConfig,
  TableData,
  TableHeader,
} from "src/app/modules/shared/shared.types";
import {
  STPInvestmentSchedule,
  STPPreviewDetails,
} from "../../types/short-term-placement";

@Component({
  selector: "lnd-investment-schedule",
  templateUrl: "./investment-schedule.component.html",
  styleUrls: ["./investment-schedule.component.scss"],
})
export class InvestmentScheduleComponent implements OnInit {
  @Input() appOwner: AppOwnerInformation;
  @Input() theme: ColorThemeInterface;
  @Input() data: STPInvestmentSchedule[] = [];
  @Input() stpPreviewDetails: STPPreviewDetails;

  @Output() closeModal = new EventEmitter<void>();

  tableConfig: TableConfig;
  tableHeaders: TableHeader[] = [];
  tableData: TableData[] = [];
  investmentInfo: {
    title: string;
    value: string | number;
    type?: DtListItemType;
  }[] = [];

  ngOnInit(): void {
    this.investmentInfo = [
      {
        title: "Investor",
        value: this.stpPreviewDetails?.investorName,
        type: "person",
      },
      {
        title: "Investment Amount",
        value: this.stpPreviewDetails.investmentAmount,
        type: "amount",
      },
      {
        title: "Gross Rate (%)",
        value: this.stpPreviewDetails.investmentRate,
        type: "number",
      },
      {
        title: `Tenor (${this.stpPreviewDetails?.tenorType}${
          this.stpPreviewDetails?.investmentTenor > 1 ? "s" : ""
        })`,
        value: this.stpPreviewDetails?.investmentTenor,
        type: "number",
      },
      {
        title: "Investment Start Date",
        value: this.stpPreviewDetails?.startDate,
        type: "date",
      },
      {
        title: "Maturity Date",
        value: this.stpPreviewDetails?.investmentExpiryDate,
        type: "date",
      },
    ];

    this.tableConfig = {
      currency: this.appOwner?.currency?.currencySymbol,
      summations: true,
    };

    this.tableHeaders.push(
      { name: "Cycle Date" },
      { name: "Principal", type: "amount" },
      { name: "Gross Rate", type: "amount" },
      {
        name: `WHT`,
        type: "amount",
      },
      { name: `Net Interest`, type: "amount" },
      { name: `Interest Accrued`, type: "amount" }
    );

    this.tableData = this.data.map((cycle) => ({
      date: {
        tdValue: cycle?.cycleDate,
        type: "date",
        dateConfig: { format: "mediumDate" },
      },
      principal: { tdValue: cycle?.principal, type: "amount" },
      gross: { tdValue: cycle?.grossInterest, type: "amount" },
      wht: { tdValue: cycle?.withHoldingTax, type: "amount" },
      netInterest: { tdValue: cycle?.interest, type: "amount" },
      interestAccrued: { tdValue: cycle?.interestAccrued, type: "amount" },
    }));
  }

  dismissModal(): void {
    this.closeModal.emit();
  }
}
