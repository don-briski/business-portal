import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { CheckoutAdminService } from "../../../checkout-admin.service";
import { CreditAffordabilityConfig } from "../../../checkout-admin.types";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { User } from "src/app/modules/shared/shared.types";
import { AppWideState } from "src/app/store/models";
import { Store } from "@ngrx/store";
import { setConfigHero } from "src/app/store/actions";

@Component({
  selector: "lnd-credit-affordability",
  templateUrl: "./credit-affordability.component.html",
  styleUrls: ["./credit-affordability.component.scss"],
})
export class CreditAffordabilityComponent implements OnInit {
  private unsubscriber$ = new Subject();

  user: User;
  currentTabIndex = 0;
  config: CreditAffordabilityConfig;
  isLoading = false;
  fetching = false;
  currentTheme: ColorThemeInterface;

  constructor(
    private checkoutAdminService: CheckoutAdminService,
    private colorThemeService: ColorThemeService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly store:Store<AppWideState>
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getConfig();
    this.setHeroState();
    this.listenForTabChange();
    this.getUser();
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private listenForTabChange() {
    this.checkoutAdminService.tabIndex$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((tabIndex) => {
        this.currentTabIndex = tabIndex;
      });
  }

  private getConfig() {
    this.isLoading = true;
    this.fetching = true;
    this.checkoutAdminService
      .getCreditAffordabilityConfig()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.config = res.body.data;
        this.isLoading = false;
        this.fetching = false;
      });
  }

  private setHeroState() {
    const heroProps = {
      title: "Credit Affordability",
      subTitle:
        "Completely customize the details and settings of your Credit Affordability ",
      tabs: [
        "Loan configuration",
        "Bank Check",
        "Narration Cipher Service",
        "Account Activity Cipher Service",
        "Income Cipher Service",
        "Sweeper Cipher Service",
      ],
    };

    this.store.dispatch(setConfigHero(heroProps))
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
