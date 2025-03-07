import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { Customer } from "src/app/model/Customer.dto";
import { AppOwnerInformation } from "src/app/modules/shared/shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { CreditNotesService } from "../../credit-notes/credit-notes.service";
import { FinanceService } from "../../service/finance.service";
import { GetCNotesReqBody } from "../../credit-notes/types";

@Component({
  selector: "lnd-customer",
  templateUrl: "./customer.component.html",
  styleUrls: ["./customer.component.scss"],
})
export class CustomerComponent implements OnInit, OnDestroy {
  @Input() user;
  @Input() currentTheme;
  @Input() customers: Customer[] = [];
  @Input() selectedCustomer: Customer;
  @Output() onCloseView = new EventEmitter();

  private _unsubscriber$ = new Subject();
  currentTabId: "Overview" | "Transactions" = "Overview";
  isLoading = false;
  outstandingReceivables = 0;
  unusedCredits = 0;
  ownerInformation: AppOwnerInformation;
  hoverStyle;
  constructor(
    private _financeService: FinanceService,
    private configService: ConfigurationService,
    private cnService: CreditNotesService
  ) {}

  ngOnInit(): void {
    this.getApplicationownerinformation();
    this.hoverStyle = {
      borderLeft: `5px solid ${this.currentTheme?.secondaryColor}`,
    };
    this.selectedCustomer.id && this.viewCustomer(this.selectedCustomer?.id)
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo().subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  private _getOutstandingReceivables(): void {
    this._financeService
      .getInvoices({ customerId: this.selectedCustomer.id })
      .pipe(pluck("body", "items"), takeUntil(this._unsubscriber$))
      .subscribe((invoices: any[]) => {
        if (invoices?.length > 0) {
          let initialValue = 0;
          this.outstandingReceivables = invoices
            .filter((invoice) => invoice.status === "Posted")
            .reduce((accumulator, invoice) => {
              return accumulator + invoice.balanceDue;
            }, initialValue);
        }
      });
  }

  private _getUnusedCredits(): void {
    const model:GetCNotesReqBody = {
      filter: this.selectedCustomer.id,
    };
    this.cnService
      .getCreditNotes(model)
      .pipe(pluck("body","items"), takeUntil(this._unsubscriber$))
      .subscribe((vcns) => {
        let initialValue = 0;
        this.unusedCredits = vcns
          .filter((cn) => cn.status === "Posted")
          .reduce((accumulator, cn) => {
            return accumulator + cn.creditsRemaining;
          }, initialValue);
      });
  }

  viewCustomer(customerId:number): void {
    this.isLoading = true;
    this.outstandingReceivables = 0;
    this.unusedCredits = 0;
    this._financeService
      .getCustomer(customerId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe(
        (res) => {
          this.selectedCustomer = res.body.data;
          this._getOutstandingReceivables();
          this._getUnusedCredits();
          this.isLoading = false;
        },
        (error) => (this.isLoading = false)
      );
  }

  closeView() {
    this.selectedCustomer = null;
    this.onCloseView.emit();
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
