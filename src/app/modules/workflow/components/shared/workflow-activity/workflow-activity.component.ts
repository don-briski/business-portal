import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { WorkflowService } from "../../../services/workflow.service";
import { WorkflowReqActivity } from "../../../workflow.types";

@Component({
  selector: "lnd-workflow-activity",
  templateUrl: "./workflow-activity.component.html",
  styleUrls: ["./workflow-activity.component.scss"],
})
export class WorkflowActivityComponent implements OnInit, OnDestroy {
  @Input() colorTheme: ColorThemeInterface;
  @Input() activities: WorkflowReqActivity[] = [];
  @Input() requestId: number;

  subs$ = new Subject<void>();
  fetching = false;

  constructor(private workflowService: WorkflowService) {}

  ngOnInit() {
    this.getReqActivities();
  }

  getReqActivities() {
    this.fetching = true;
    this.workflowService
      .getActivities(this.requestId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.activities = res.body;
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
