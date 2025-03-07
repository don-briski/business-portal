import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { TabBarService } from "src/app/modules/shared/components/tab-bar/tab-bar.service";
import { Tab, User } from "src/app/modules/shared/shared.types";
import { InvestmentService } from "src/app/service/investment.service";
import { InvestmentDetails } from "../../types/investment.type";
import { LiquidationReq } from "../../types/investment-liquidation-request";

@Component({
  selector: "lnd-view-investment-liquidation-request",
  templateUrl: "./view-investment-liquidation-request.component.html",
  styleUrls: ["./view-investment-liquidation-request.component.scss"],
})
export class ViewInvestmentLiquidationRequestComponent
  implements OnInit, OnDestroy
{
  @Input() user: User;
  @Input() requestId: number;
  @Input() currencySymbol: string;
  @Input() colorTheme: ColorThemeInterface;

  @Output() reviewed = new EventEmitter<"Closed">();

  subs$ = new Subject<void>();
  request: LiquidationReq;
  isLoadingRequest = false;
  form: UntypedFormGroup;
  tabBarId = "child";
  tabs: Tab[] = [
    { id: "req-details", text: "Request Details" },
    { id: "old-investment-details", text: "Investment Details" },
  ];
  currentTabId = "req-details";
  isFetchingInvestment = false;
  investment: InvestmentDetails;
  showCommentField = false;
  isApproved = false;
  isSubmitting = false;

  constructor(
    private investmentService: InvestmentService,
    private tabBarService: TabBarService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getLiquidationRequest();
    this.listenForTabSwitch();
  }

  initForm() {
    this.form = new UntypedFormGroup({
      investmentId: new UntypedFormControl(""),
      isApproved: new UntypedFormControl(false),
      isRejected: new UntypedFormControl(false),
      comment: new UntypedFormControl(""),
      transactionPin: new UntypedFormControl("", Validators.required),
    });
  }

  listenForTabSwitch() {
    this.tabBarService.tabSwitched.pipe(takeUntil(this.subs$)).subscribe({
      next: (tabSwitch) => {
        this.currentTabId = tabSwitch.tabId;
        if (this.currentTabId === "old-investment-details") {
          this.fetchInvestment();
        }
      },
    });
  }

  getLiquidationRequest() {
    this.isLoadingRequest = true;

    this.investmentService
      .getLiquidationRequestById(this.requestId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.request = res.body;
          this.form.get("investmentId").setValue(this.request.investmentId);
          if (this.request?.rollOverAmount) {
            this.tabs.push({
              id: "new-investment-details",
              text: "New Investment Details (Rollover)",
            });
          }

          this.isLoadingRequest = false;
        },
        error: () => {
          this.isLoadingRequest = false;
        },
      });
  }

  fetchInvestment() {
    this.isFetchingInvestment = true;
    this.investmentService
      .getInvestmentById(this.request?.investmentId)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.investment = res.body.data;
          this.isFetchingInvestment = false;
        },
        error: () => {
          this.isFetchingInvestment = false;
        },
      });
  }

  onSubmit() {
    this.isSubmitting = true;

    if (this.isApproved) {
      this.form.get("isApproved").setValue(true);
    } else {
      this.form.get("isRejected").setValue(true);
    }

    this.investmentService
      .reviewLiquidationRequest(this.requestId, this.form.value)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.reviewed.emit("Closed");
        },
        error: () => {
          this.isSubmitting = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
