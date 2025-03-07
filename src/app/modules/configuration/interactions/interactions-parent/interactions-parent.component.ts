import { Component, Input, OnDestroy, OnInit } from "@angular/core";

import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { ConfigurationService } from "src/app/service/configuration.service";
import { FinanceService } from "../../../finance/service/finance.service";

enum Module {
  Loan = "LOAN",
  Investment = "INVESTMENT",
  WorkFlow = "WORKFLOW",
}

@Component({
  selector: "lnd-interactions-parent",
  templateUrl: "./interactions-parent.component.html",
  styleUrls: ["./interactions-parent.component.scss"],
})
export class InteractionsParentComponent implements OnInit, OnDestroy {
  @Input() user;

  appOwner;
  selectedModule: Module = Module.Loan;
  isChecked: boolean = true;
  module = Module;
  accounts: any[] = [];
  modes: any[] = [
    { id: 1, text: "Automatic" },
    { id: 2, text: "Manual" },
  ];
  statuses: any[] = [
    { id: true, text: "Active" },
    { id: false, text: "Inactive" },
  ];
  accordionState: "Open" | "Closed" = "Open";

  private _unsubscriber$ = new Subject();

  constructor(
    private _financeService: FinanceService,
    private configService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.getAppOwnerDetails();
    this._getAccountsByClass();
  }

  getAppOwnerDetails() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => (this.appOwner = res.body));
  }

  private _getAccountsByClass(): void {
    let model = {
      PageNumber: 1,
      PageSize: 100,
      Filter: "Bank",
    };
    this._financeService
      .getAccountsByClass(model)
      .pipe(pluck("body", "items"), takeUntil(this._unsubscriber$))
      .subscribe((res: any[]) => {
        this.accounts = res?.map((account) => ({
          id: account.accountId,
          text: account.name,
        }));
      });
  }

  checkValue(module: Module): void {
    if (module === this.selectedModule) {
      this.accordionState === "Open"
        ? (this.accordionState = "Closed")
        : (this.accordionState = "Open");
    }

    this.selectedModule = module;
  }

  setSelected(module: any): void {
    this.selectedModule = module;
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
