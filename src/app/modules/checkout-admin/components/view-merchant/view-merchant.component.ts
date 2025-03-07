import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { MerchantDetails } from "../../types/merchant";
import { CheckoutAdminService } from "../../checkout-admin.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { AppOwnerInformation } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-view-merchant",
  templateUrl: "./view-merchant.component.html",
  styleUrls: ["./view-merchant.component.scss"],
})
export class ViewMerchantComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  colorTheme: ColorThemeInterface;

  appOwnerInfo: AppOwnerInformation;
  fetching = false;
  merchant: MerchantDetails;

  constructor(
    private readonly colorThemeService: ColorThemeService,
    private readonly route: ActivatedRoute,
    private readonly checkoutAdminService: CheckoutAdminService,
    private readonly configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getAppOwnerInfo();
    this.getMerchant();
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  getAppOwnerInfo() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.appOwnerInfo = res.body;
      });
  }

  getMerchant() {
    this.fetching = true;
    const id = this.route.snapshot.params["id"];
    this.checkoutAdminService
      .fetchMerchant(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.merchant = res.body.data;
          this.fetching = false;
        },
        error: () => {
          this.fetching = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
