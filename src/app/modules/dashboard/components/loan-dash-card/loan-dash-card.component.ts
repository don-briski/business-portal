import { Component, EventEmitter, Input, Output } from "@angular/core";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AppOwnerInformation } from "src/app/modules/shared/shared.types";
import { LoanMetricsData, MetricsRange } from "../../loan-dashboard.types";

@Component({
  selector: "lnd-loan-dash-card",
  templateUrl: "./loan-dash-card.component.html",
  styleUrls: ["./loan-dash-card.component.scss"],
})
export class LoanDashCardComponent {
  @Input() colorTheme: ColorThemeInterface;
  @Input() appOwnerInfo: AppOwnerInformation;

  @Input() id: string;
  @Input() data: LoanMetricsData;
  @Input() isLoading = false;

  @Output() getMetrics = new EventEmitter<MetricsRange>();

  selectedRange: MetricsRange = "Today";

  onGetMetrics(range: MetricsRange) {
    this.selectedRange = range;
    this.getMetrics.emit(range);
  }
}
