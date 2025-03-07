import { Component, Input, OnDestroy, OnInit } from "@angular/core";

import { TabBarService } from "../tab-bar/tab-bar.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "lnd-tab",
  templateUrl: "./tab.component.html",
  styleUrls: ["./tab.component.scss"],
})
export class TabComponent implements OnInit, OnDestroy {
  @Input() text: string = "";
  @Input() active = false;
  @Input() tabId = "";
  @Input() tabBarId = "";
  @Input() type:'table'|'default' = "table";
  @Input() hideTab = false;

  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;

  constructor(
    private tabBarService: TabBarService,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  onSwitchTab() {
    this.tabBarService.tabSwitched.next({
      tabId: this.tabId,
      tabBarId: this.tabBarId,
    });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
