import { Component, Input, OnDestroy, OnInit } from "@angular/core";

import { DtListItemType } from "../../shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { lightenColorV2 } from "../../helpers/generic.helpers";

@Component({
  selector: "lnd-dt-list-item",
  templateUrl: "./dt-list-item.component.html",
  styleUrls: ["./dt-list-item.component.scss"],
})
export class DtListItemComponent implements OnInit, OnDestroy {
  @Input() title: string;
  @Input() value: string;
  @Input() type: DtListItemType = "text";
  @Input() showDateTime = false;
  @Input() currencySymbol?: string;
  @Input() tooltip = "";
  @Input() ignoreIcon = false;

  unsubscriber$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  primaryBadgeBg25:string;

  constructor(
    private readonly configService: ConfigurationService,
    private readonly colorThemeService: ColorThemeService
  ) {
  }

  ngOnInit(): void {
    this.loadTheme();
    this.getCurrencySymbol();
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
        this.primaryBadgeBg25 = lightenColorV2(this.colorTheme.primaryColor, 25)
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

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
