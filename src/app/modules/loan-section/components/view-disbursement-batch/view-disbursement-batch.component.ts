import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { DisbursementBatch } from "src/app/model/disbursement-batch";
import { TabBarService } from "src/app/modules/shared/components/tab-bar/tab-bar.service";
import { AppOwnerInformation, Tab } from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-view-disbursement-batch",
  templateUrl: "./view-disbursement-batch.component.html",
  styleUrls: ["./view-disbursement-batch.component.scss"],
})
export class ViewDisbursementBatchComponent implements OnInit, OnDestroy {
  @Input() colorTheme: ColorThemeInterface;
  @Input() appOwnerInfo: AppOwnerInformation;
  @Input() disbursementBatch: DisbursementBatch;

  subs$ = new Subject<void>();

  tabs: Tab[] = [
    { id: "loans", text: "Loans" },
    { id: "activities", text: "Activities" },
  ];
  currentTabId = "loans";

  constructor(private tabBarService: TabBarService) {}

  ngOnInit(): void {
    this.listenForTabSwitch();
  }

  listenForTabSwitch() {
    this.tabBarService.tabSwitched.pipe(takeUntil(this.subs$)).subscribe({
      next: (id) => {
        this.currentTabId = id.tabId;
      },
    });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
