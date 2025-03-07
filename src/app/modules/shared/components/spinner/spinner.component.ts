import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";

@Component({
  selector: "lnd-spinner",
  templateUrl: "./spinner.component.html",
  styleUrls: ["./spinner.component.scss"],
})
export class SpinnerComponent implements OnInit, OnDestroy {
  @Input() text: string;
  @Input() color: string;

  subs$ = new Subject();
  currentTheme: ColorThemeInterface;

  constructor(private readonly colorThemeService: ColorThemeService) {}

  ngOnInit(): void {
    this.loadTheme();
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.color = this.color || res?.secondaryColor;
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
