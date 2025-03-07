import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import * as moment from "moment";
import { TotalReceivablesPayables } from "../types/total-receivables.interface";
import { FinanceMetricsFetchModel } from "../types/financemetricsfetchmodel.interface";
import { FinanceMetricsService } from "../service/finance-metrics.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AppOwnerInformation } from "../../shared/shared.types";
import { Router } from "@angular/router";

@Component({
  selector: "lnd-dash-card",
  templateUrl: "./dash-card.component.html",
  styleUrls: ["./dash-card.component.scss"],
})
export class DashCardComponent implements OnInit, OnDestroy {
  @Input() financeMetricsFetchModel: FinanceMetricsFetchModel;
  @Input() ownerInformation: AppOwnerInformation;
  @Input() type: "Bills" | "Invoices";
  @Input() currentTheme: ColorThemeInterface;
  @Input() placement: string;

  subs$ = new Subject<void>();
  totalReceivables: TotalReceivablesPayables;
  totalPayables: TotalReceivablesPayables;
  isLoading = false;

  constructor(
    private financeMetricsService: FinanceMetricsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getMetricData();
  }

  getMetricData() {
    if (this.type === "Bills") {
      this.getTotalPayablesByDate();
    } else {
      this.getTotalReceivablesByDate();
    }
  }

  getTotalReceivablesByDate() {
    let payload = { endDate: moment().format("yyyy-MM-DD") };

    this.isLoading = true;
    this.financeMetricsService
      .getTotalreceivablesByDate(payload)
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe(
        (totalReceivablesPayables) => {
          this.totalReceivables = totalReceivablesPayables;
          this.isLoading = false;
        },
        () => (this.isLoading = false)
      );
  }

  getTotalPayablesByDate() {
    let payload = { endDate: moment().format("yyyy-MM-DD") };
    this.isLoading = true;
    this.financeMetricsService
      .getTotalPayablesByDate(payload)
      .pipe(pluck("body", "data"), takeUntil(this.subs$))
      .subscribe(
        (totalReceivablesPayables) => {
          this.totalPayables = totalReceivablesPayables;
          this.isLoading = false;
        },
        () => (this.isLoading = false)
      );
  }

  goToReport(period: string, type: string) {
    const view = `${type}_aging_detail_report`;
    this.router.navigate(["finance/reports"], {
      queryParams: { view, period, type },
    });
  }

  ngOnDestroy() {
    this.subs$.next();
    this.subs$.complete();
  }
}
