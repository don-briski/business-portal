import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import * as moment from "moment";
@Component({
  selector: "lnd-date-range",
  templateUrl: "./date-range.component.html",
  styleUrls: ["./date-range.component.scss"],
})
export class DateRangeComponent implements OnInit {
  @Input() btnText: string;
  @Output() dateRange = new EventEmitter();
  @Output() toggleDateRangeModal = new EventEmitter();

  endDate: any;
  startDate: any;
  showSecondColumnInFilterModal = false;
  showCustomDatePicker = false;
  formattedStartDate: string;
  formattedEndDate: string;

  constructor() {}

  ngOnInit(): void {}

  selectDateRange(range: string) {
    let startDate: Date;
    let endDate: Date;

    const currentDate = new Date();
    switch (range) {
      case "Today":
        this.formattedStartDate = this.getFormattedDate(currentDate);
        this.formattedEndDate = this.getFormattedDate(currentDate);
        break;
      case "ThisWeek":
        const firstDay = new Date(
          currentDate.setDate(currentDate.getDate() - currentDate.getDay())
        );

        const lastDay = new Date(
          currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 6)
        );

        this.formattedStartDate = this.getFormattedDate(firstDay);
        this.formattedEndDate = this.getFormattedDate(lastDay);
        break;
      case "ThisMonth":
        startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        this.formattedStartDate = this.getFormattedDate(startDate);
        this.formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "ThisQuarter":
        const currentQuarter = (currentDate.getMonth() - 1) / 3 + 1;
        startDate = new Date(
          currentDate.getFullYear(),
          3 * currentQuarter - 2,
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          3 * currentQuarter + 1,
          1
        );
        this.formattedStartDate = this.getFormattedDate(startDate);
        this.formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "ThisYear":
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), 11, 31);
        this.formattedStartDate = this.getFormattedDate(startDate);
        this.formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "YearToDate":
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        this.formattedStartDate = this.getFormattedDate(startDate);
        this.formattedEndDate = this.getFormattedDate(currentDate);
        break;
      case "Yesterday":
        currentDate.setDate(currentDate.getDate() - 1);
        this.formattedStartDate = this.getFormattedDate(currentDate);
        this.formattedEndDate = this.getFormattedDate(currentDate);
        break;
      case "PreviousWeek":
        const beforeOneWeek = new Date(
          new Date().getTime() - 60 * 60 * 24 * 7 * 1000
        );
        const beforeOneWeek2 = new Date(beforeOneWeek);
        const day = beforeOneWeek.getDay();
        const diffToMonday =
          beforeOneWeek.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(beforeOneWeek.setDate(diffToMonday));
        endDate = new Date(beforeOneWeek2.setDate(diffToMonday + 6));
        this.formattedStartDate = this.getFormattedDate(startDate);
        this.formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "PreviousMonth":
        startDate = new Date(
          currentDate.getFullYear() - (currentDate.getMonth() > 0 ? 0 : 1),
          (currentDate.getMonth() - 1 + 12) % 12,
          1
        );
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        );

        this.formattedStartDate = this.getFormattedDate(startDate);
        this.formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "PreviousQuarter":
        const quarter = Math.floor(currentDate.getMonth() / 3);
        startDate = new Date(currentDate.getFullYear(), quarter * 3 - 3, 1);
        endDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth() + 3,
          0
        );
        this.formattedStartDate = this.getFormattedDate(startDate);
        this.formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "PreviousYear":
        const lastYear = new Date().getFullYear() - 1;
        startDate = new Date(lastYear, 0, 1);
        endDate = new Date(lastYear, 11, 31);
        this.formattedStartDate = this.getFormattedDate(startDate);
        this.formattedEndDate = this.getFormattedDate(endDate);
        break;
      case "Custom":
        this.showSecondColumnInFilterModal = true;
        this.showCustomDatePicker = true;

        break;
    }

    if (range !== "Custom") {
      this.dateRange.emit({
        fromDate: this.formattedStartDate,
        toDate: this.formattedEndDate,
        range,
      });
    }
  }

  setCustomDate($event, type: string) {
    if (type === "startDate") {
      this.formattedStartDate = this.getFormattedDate($event.value);
    } else {
      this.formattedEndDate = this.getFormattedDate($event.value);
    }

    if (this.formattedStartDate && this.formattedEndDate) {
      this.dateRange.emit({
        fromDate: this.formattedStartDate,
        toDate: this.formattedEndDate,
      });
    }
  }

  getFormattedDate(date: Date) {
    return moment(date).format("YYYY-MM-DD");
  }
}
