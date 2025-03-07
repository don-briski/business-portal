import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CreateLinkInfo } from "../../shared.types";

@Component({
  selector: "no-data",
  templateUrl: "./no-data.component.html",
  styleUrls: ["./no-data.component.scss"],
})
export class NoDataComponent implements OnInit, OnDestroy {
  @Input() title = "No Data Available";
  @Input() titleSize = '14px';
  @Input() desc?: string;
  @Input() descSize = '12px'
  @Input() containerClasses = ''
  @Input() imageWidth = 200;

  @Input() createLinkInfo?: CreateLinkInfo;

  subs$ = new Subject<void>();
  currentTheme: ColorThemeInterface;


  constructor(private themeService: ColorThemeService) {}

  ngOnInit(): void {
    this.loadTheme();
  }

  loadTheme(): void {
    this.themeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.currentTheme = theme;
      });
  }

  ngOnDestroy() {
    this.subs$.next();
    this.subs$.complete();
  }
}
