import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";

@Component({
  selector: "app-expenses-tab",
  templateUrl: "./expenses-tab.component.html",
  styleUrls: ["./expenses-tab.component.scss"],
})
export class ExpensesTabComponent implements OnInit, OnDestroy {
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();
  currentTab: string = "record";
  isEditing: boolean = false;
  expenses: any | null;

  constructor(
    private colorThemeService: ColorThemeService,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit(): void {
    $("#tab-record").addClass("active show");

    this._loadTheme();
  }

  private _loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }
  switchTabs(tab: string): void {
    if (tab === "record") {
      this.closeView();
      $("#tab-bulk").removeClass("active show");
      $("#tab-record").addClass("active show");
      $("#navRecord").addClass("active-tab");
      $("#navBulk").removeClass("active-tab");
    } else {
      this.configurationService.isSidebarClosed$.next(true);

      $("#tab-record").removeClass("active show");
      $("#tab-bulk").addClass("active show");
      $("#navBulk").addClass("active-tab");
      $("#navRecord").removeClass("active-tab");
    }
    this.currentTab = tab;
  }

  closeView() {
    this.configurationService.isSidebarClosed$.next(false);
  }

  ngOnDestroy(): void {
    this.closeView();
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
