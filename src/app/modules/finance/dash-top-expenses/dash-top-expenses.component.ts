import {
  Component,
  OnInit,
  Inject,
  NgZone,
  PLATFORM_ID,
  Input,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import * as moment from "moment";

import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { FinanceMetricsService } from "../service/finance-metrics.service";
import { pluck, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { FinanceMetricsFetchModel } from "../types/financemetricsfetchmodel.interface";
import { TopExpense } from "../types/top-expense.interface";

@Component({
  selector: "lnd-dash-top-expenses",
  templateUrl: "./dash-top-expenses.component.html",
  styleUrls: ["./dash-top-expenses.component.scss"],
})
export class DashTopExpensesComponent implements OnInit {
  @Input() currentTheme: ColorThemeInterface;
  @Input() financeMetricsFetchModel: FinanceMetricsFetchModel;

  topExpenses: TopExpense[];
  selectedRange: string;
  chart: am4charts.PieChart;
  isLoading = false;
  colorSets: any[];

  private subs$ = new Subject();

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
    this.getMetricData("today");
  }

  private getTotalExpenses(payload): void {
    this.isLoading = true;
    this.financeMetricsService
      .getTotalExpensesByDate(payload)
      .pipe(pluck("body", "data", "data"), takeUntil(this.subs$))
      .subscribe(
        (expenses) => {
          this.topExpenses = expenses;
          this.createChart(this.topExpenses);
          this.isLoading = false;
        },
        () => (this.isLoading = false)
      );
  }

  ngAfterViewInit() {
    this.createChart();
  }

  private am4themes_myTheme(target) {
    if (target instanceof am4core.ColorSet) {
      target.list = [
        am4core.color("#007FFF"),
        am4core.color("#0000FF"),
        am4core.color("#1da1f2"),
        am4core.color("#3457D5"),
        am4core.color("#00BFFF"),
        am4core.color("#1F75FE"),
      ];
    }
  }

  createChart(data?): void {
    this.browserOnly(() => {
      am4core.useTheme(am4themes_animated);
      am4core.useTheme(this.am4themes_myTheme);
      this.chart = am4core.create("chartdiv", am4charts.PieChart);
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

      this.isLoading = false;
    });
  }

  getMetricData(range: string) {
    this.selectedRange = range;
    let payload;
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

    this.getTotalExpenses(payload);
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
