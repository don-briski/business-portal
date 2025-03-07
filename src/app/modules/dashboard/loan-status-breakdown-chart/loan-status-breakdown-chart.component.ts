import {
  Component,
  Input,
  OnInit,
  Inject,
  NgZone,
  PLATFORM_ID,
  OnDestroy,
} from "@angular/core";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { Subject } from "rxjs";
import { isPlatformBrowser } from "@angular/common";

import {
  LoanStatusBreakdown,
  ModifiedLoanStatusBreakdown,
} from "../loan-dashboard.types";

@Component({
  selector: "lnd-loan-status-breakdown-chart",
  templateUrl: "./loan-status-breakdown-chart.component.html",
  styleUrls: ["./loan-status-breakdown-chart.component.scss"],
})
export class LoanStatusBreakdownChartComponent implements OnInit, OnDestroy {
  @Input() loanStatusBreakdown: LoanStatusBreakdown[] = [];

  modifiedLoanStatusBreakdown: ModifiedLoanStatusBreakdown[] = [];

  unsubscriber$ = new Subject<void>();
  chart: am4charts.PieChart;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: any,
    private readonly zone: NgZone
  ) {}

  ngOnInit(): void {
    this.modifiedLoanStatusBreakdown = this.loanStatusBreakdown.map((item) => {
      const name = item.status.toLowerCase();
      if (name === "claimed") {
        return;
      } else if (name === "pool") {
        return {
          name: "Pending",
          amount: item.totalAmount,
        };
      } else {
        return { name: item.status, amount: item.totalAmount };
      }
    });

    this.createChart(this.modifiedLoanStatusBreakdown);
  }

  // Run the function only in the browser
  browserOnly(fn: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        fn();
      });
    }
  }

  private am4themes_myTheme(target: any, data: ModifiedLoanStatusBreakdown[]) {
    if (target instanceof am4core.ColorSet) {
      const colorsList = [];
      if (data.find((item) => item?.name === "Approved")) {
        colorsList.push(am4core.color("#2e8b57")); // green
      }
      if (data.find((item) => item?.name === "Pending")) {
        colorsList.push(am4core.color("#f26135")); // orange
      }
      if (data.find((item) => item?.name === "Rejected")) {
        colorsList.push(am4core.color("#dc3545")); // red
      }

      target.list = colorsList;
    }
  }

  createChart(data: ModifiedLoanStatusBreakdown[]): void {
    this.browserOnly(() => {
      am4core.useTheme(am4themes_animated);
      am4core.useTheme((target) => this.am4themes_myTheme(target, data));
      this.chart = am4core.create("chart-div", am4charts.PieChart);
      this.chart.series.template;
      this.chart.radius = am4core.percent(65);
      this.chart.innerRadius = am4core.percent(30);

      this.chart.data = data || [];

      // Add and configure Series
      let pieSeries = this.chart.series.push(new am4charts.PieSeries());
      pieSeries.dataFields.value = "amount";
      pieSeries.dataFields.category = "name";
      pieSeries.labels.template.maxWidth = 80;
      pieSeries.labels.template.disabled = true;
      pieSeries.hiddenState.properties.endAngle = -90;

      this.chart.legend = new am4charts.Legend();
    });
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
    // Clean up chart when the component is removed
    this.browserOnly(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }
}
