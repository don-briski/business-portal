import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { DepositService } from "src/app/service/deposit.service";
import { DepositGroup } from "../../models/deposit-account.model";

@Component({
  selector: "lnd-view-deposit-groups",
  templateUrl: "./view-deposit-groups.component.html",
  styleUrls: ["./view-deposit-groups.component.scss"],
})
export class ViewDepositGroupsComponent implements OnInit, OnDestroy {
  @Input() groupId: number;
  @Input() groupCode: string;

  subs$ = new Subject();
  colorTheme: ColorThemeInterface;
  group: DepositGroup;
  fetching = false;

  constructor(
    private colorThemeServ: ColorThemeService,
    private depositService: DepositService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getGroup();
  }

  loadTheme(): void {
    this.colorThemeServ
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  getGroup() {
    this.fetching = true;
    this.depositService
      .getDepositGroup(this.groupId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.group = res.body.data;
          this.fetching = false;
        },
        error: () => {
          this.fetching = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
