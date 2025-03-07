import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { LoanDashboardCardData, MetricsRange } from "../loan-dashboard.types";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";

@Component({
  selector: "lnd-loan-dashboard-card",
  templateUrl: "./loan-dashboard-card.component.html",
  styleUrls: ["./loan-dashboard-card.component.scss"],
})
export class LoanDashboardCardComponent implements OnInit, OnDestroy {
  readonly unsubscriber$ = new Subject<void>();

  @Input() title: LoanDashboardCardData;
  @Input() subtitle: LoanDashboardCardData;
  @Input() id: string;
  @Input() loading: boolean;

  @Output() getMetrics = new EventEmitter<MetricsRange>();

  currentTheme: ColorThemeInterface;
  currencySymbol: string;
  selectedRange: MetricsRange = "Today";

  constructor(
    private readonly colorThemeService: ColorThemeService,
    private configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getCurrencySymbol();
  }

  loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configService.currencySymbol;
    if (!this.currencySymbol) {
      this.configService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  onGetMetrics(range: MetricsRange) {
    this.selectedRange = range;
    this.getMetrics.emit(range);
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
