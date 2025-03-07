import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { takeUntil } from "rxjs/operators";

import { LoanApprovalWorkflow } from "../../loan-section/loan.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { AccordionItem } from "../../shared/shared.types";
import { lightenColor } from "../../shared/helpers/generic.helpers";

@Component({
  selector: "lnd-view-loan-approval-workflow",
  templateUrl: "./view-loan-approval-workflow.component.html",
  styleUrls: ["./view-loan-approval-workflow.component.scss"],
})
export class ViewLoanApprovalWorkflowComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  currentTheme: ColorThemeInterface;
  loading = false;
  approvalWorkflowId: number;
  approvalWorkflow: LoanApprovalWorkflow;
  accordionItems: AccordionItem[] = [];

  constructor(
    private readonly configService: ConfigurationService,
    private readonly route: ActivatedRoute,
    private colorThemeService: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getLoanApprovalWorkflow();
  }

  loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getLoanApprovalWorkflow() {
    this.loading = true;

    const id = this.route.snapshot.params["id"];
    this.approvalWorkflowId = id;

    this.configService
      .getLoanApprovalWorkflow(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.approvalWorkflow = res.body.data;
          this.setAccordionItems();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  setAccordionItems() {
    this.approvalWorkflow.approvalLevels.forEach((level) => {
      let accordionItem: AccordionItem = {};

      this.accordionItems.push(accordionItem);
      if (level.permissions) {
        accordionItem['approvalPermissions'] = level.permissions.map(perm => ({value:perm?.permissionName}))
      }

      if (level.approvingRoles) {
        accordionItem['approvalRoles'] = level.approvingRoles.map(perm => ({value:perm?.name}))
      }
    });
  }

  lightenColor(color: string) {
    return lightenColor(color, 170);
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
