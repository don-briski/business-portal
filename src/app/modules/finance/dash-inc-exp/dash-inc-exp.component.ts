import {
  Component,
  Input,
  OnInit,
  Inject,
  NgZone,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import * as moment from "moment";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";

import { FinanceMetricsService } from "../service/finance-metrics.service";
import { FinanceMetricsFetchModel } from "../types/financemetricsfetchmodel.interface";
import { pluck, takeUntil, map } from "rxjs/operators";
import { Subject } from "rxjs";
import { DashboardMetricPayload } from "../types/dashboard-metric-payload.interface";
import {
  IncomeExpense,
  IncomeExpenseMetric,
} from "../types/income-expense-metric.interface";
import { AppOwnerInformation } from "../../shared/shared.types";

@Component({
  selector: "lnd-dash-inc-exp",
  templateUrl: "./dash-inc-exp.component.html",
  styleUrls: ["./dash-inc-exp.component.scss"],
})
export class DashIncExpComponent implements OnInit {
  @Input() ownerInformation: AppOwnerInformation;
  @Input() financeMetricsFetchModel: FinanceMetricsFetchModel;

  incomeExpenseMetric: IncomeExpenseMetric;

  private subs$ = new Subject();
  private chart: am4charts.XYChart;

  isLoading = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId,
    private zone: NgZone,
    private financeMetricsService: FinanceMetricsService
  ) {}

  // Run the function only in the browser
  browserOnly(f: () => void) {
    if (isPlatformBrowser(this.platformId)) {
      this.zone.runOutsideAngular(() => {
        f();
      });
    }
  }

  ngOnInit(): void {
    this.getMetricData("ytd");
  }

  ngAfterViewInit() {
    this.createChart();
  }

  createChart(data?: IncomeExpense[]): void {
    this.browserOnly(() => {
      this.chart = am4core.create("barchartdiv", am4charts.XYChart);
      // Add data
      this.chart.data = data || [];

      // Create axes
      let dateAxis = this.chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.title.text = "Period";
      dateAxis.dateFormats.setKey("month", "MMM");
      dateAxis.periodChangeDateFormats.setKey("month", "MMM");
      dateAxis.renderer.minGridDistance = 30;
      dateAxis.renderer.grid.template.disabled = true;

      let valueAxis = this.chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Amount";
      valueAxis.renderer.grid.template.disabled = true;

      // Create series
      let incomeSeries = this.chart.series.push(new am4charts.ColumnSeries());
      incomeSeries.dataFields.valueY = "income";
      incomeSeries.dataFields.dateX = "period";
      incomeSeries.name = "Income";
      incomeSeries.tooltipText = "{name}: [bold]{valueY}[/]";
      incomeSeries.stacked = true;
      incomeSeries.columns.template.fill = am4core.color("#21c76f");
      incomeSeries.columns.template.strokeWidth = 0;

      let expenseSeries = this.chart.series.push(new am4charts.ColumnSeries());
      expenseSeries.dataFields.valueY = "expense";
      expenseSeries.dataFields.dateX = "period";
      expenseSeries.name = "Expense";
      expenseSeries.tooltipText = "{name}: [bold]{valueY}[/]";
      expenseSeries.stacked = true;
      expenseSeries.columns.template.fill = am4core.color("#8aa2b1");
      expenseSeries.columns.template.strokeWidth = 0;

      this.chart.legend = new am4charts.Legend();
      this.chart.legend.itemContainers.template.marginTop = 20;

      // Add cursor
      this.chart.cursor = new am4charts.XYCursor();
    });
  }

  private getIncomeAndExpenseMetric(payload: DashboardMetricPayload): void {
    this.isLoading = true;
    this.financeMetricsService
      .getIncomeAndExpenseMetricByDate(payload)
      .pipe(
        pluck("body", "data"),
        map((result) => {
          this.incomeExpenseMetric = result;
          return result.data.map((result) => ({
            ...result,
            period: moment(result.period).format("yyyy-MM-DD"),
            color: am4core.color("#4FFFB0"),
          }));
        }),
        takeUntil(this.subs$)
      )
      .subscribe(
        (result) => {
          this.createChart(result);
          this.isLoading = false;
        },
        () => (this.isLoading = false)
      );
  }

  getMetricData(range: string) {
    let payload: DashboardMetricPayload;
    switch (range) {
      case "mtd":
        payload = {
          startDate: moment(this.financeMetricsFetchModel.monthStart).format(
            "yyyy-MM-DD"
          ),
          endDate: moment(this.financeMetricsFetchModel.monthEnd).format(
            "yyyy-MM-DD"
          ),
        };
        break;

      case "ytd":
        payload = {
          startDate: moment(this.financeMetricsFetchModel.yearStart).format(
            "yyyy-MM-DD"
          ),
          endDate: moment(this.financeMetricsFetchModel.yearEnd).format(
            "yyyy-MM-DD"
          ),
        };
        break;

      default:
        payload = { startDate: moment(), endDate: moment() };
        break;
    }

    this.getIncomeAndExpenseMetric(payload);
  }

  ngOnDestroy() {
    this.subs$.next();
    this.subs$.complete();
    // Clean up chart when the component is removed
    this.browserOnly(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
  }
}
