import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { DisbursementBatchActivity } from "src/app/model/disbursement-batch";
import { LoanoperationsService } from "src/app/service/loanoperations.service";

@Component({
  selector: "lnd-disbursement-activities",
  templateUrl: "./disbursement-activities.component.html",
  styleUrls: ["./disbursement-activities.component.scss"],
})
export class DisbursementActivitiesComponent implements OnInit, OnDestroy {
  @Input() colorTheme: ColorThemeInterface;
  @Input() disbursementBatchId: number;

  subs$ = new Subject<void>();

  isLoading = false;
  disbActivities: DisbursementBatchActivity[] = [];

  constructor(private readonly loanOperationsService: LoanoperationsService) {}

  ngOnInit(): void {
    this.fetchDisbBatches();
  }

  fetchDisbBatches() {
    this.isLoading = true;
    this.loanOperationsService
      .getDisbursementBatchHistory(this.disbursementBatchId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.disbActivities = res.body
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
