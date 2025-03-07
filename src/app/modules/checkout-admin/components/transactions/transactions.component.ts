import { Component, OnDestroy, OnInit } from "@angular/core";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { User } from "src/app/modules/shared/shared.types";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";

@Component({
  selector: "lnd-transactions",
  templateUrl: "./transactions.component.html",
  styleUrls: ["./transactions.component.scss"],
})
export class TransactionsComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  user: User;
  colorTheme: ColorThemeInterface;
  currentTab = "Transactions";

  constructor(
    private readonly colorThemeService: ColorThemeService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getUser();
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
        
        if (!this.user?.permission?.includes("View Checkout Transactions")) {
          this.currentTab = "Commissions";
        }
      });
  }

  onSwitchTab(tab: "Transactions" | "Commissions") {
    this.currentTab = tab;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
