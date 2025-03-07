import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { BillsMgtService } from "src/app/service/bills-mgt.service";
import { PurchaseOrderService } from "src/app/service/purchase-order.service";
import { filterOptions } from "src/app/util/finance/financeHelper";
import { CreditNotesService } from "../credit-notes/credit-notes.service";
import { FinanceService } from "../service/finance.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";

@Component({
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.scss"],
})
export class FilterComponent implements OnInit, OnChanges {
  @Input() feature: string;
  @Input() pagination: any;
  @Input() tabState?: any;
  @Output() filteredResult = new EventEmitter<any>();
  isLoading: boolean = false;
  filterOptions: string[] = [];
  selectedFilterOption: string[] | string = [];
  private _unsubscriber$ = new Subject();
  currentTheme: ColorThemeInterface;

  constructor(
    private financeService: FinanceService,
    private billService: BillsMgtService,
    private poService: PurchaseOrderService,
    private cnService: CreditNotesService,
    private colorThemeService: ColorThemeService,
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.filterOptions = filterOptions(
      {
        state: this.tabState,
      },
      this.feature
    );
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.filterOptions = filterOptions(
      {
        state: changes.tabState?.currentValue,
      },
      this.feature
    );

    if (changes.tabState.previousValue !== changes.tabState.currentValue) {
      this.filterOptions = [];
    }
  }

  selectFilterOption(event: any): void {
    this.selectedFilterOption = [event.text];
  }

  closeFilterModal(): void {
    $(".filter-menu").toggle();
  }

  filter(): void {
    if (this.feature === "expenses") {
      this.getExpenses();
    }

    if (this.feature === "bills") {
      this.getBills();
    }

    if (this.feature === "purchaseorder") {
      this.getPurchaseOrder();
    }

    if (this.feature === "invoices") {
      this.getInvoices();
    }

    if (this.feature === "payments") {
      this.getPayments();
    }

    if (this.feature === "payments-received") {
      this.getPaymentsRecieved();
    }

    if (this.feature === "credit-notes") {
      this.getCreditNotes();
    }

    if (this.feature === "transaction") {
      this.getTransactions();
    }
  }


  getExpenses(): void {
    let model = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      status:
        this.selectedFilterOption[0] === "All"
          ? (this.selectedFilterOption = [])
          : this.selectedFilterOption,
    };
    this.isLoading = true;
    this.financeService
      .getExpenses(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.isLoading = false;
        this.filteredResult.emit(res);
        this.closeFilterModal();
        this.selectedFilterOption = [];
      });
  }

  getBills(): void {
    let model = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      billStatus:
        this.selectedFilterOption[0] === "All"
          ? (this.selectedFilterOption = [])
          : this.selectedFilterOption,
    };
    this.isLoading = true;
    this.billService
      .spoolAllBills(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.isLoading = false;
        this.filteredResult.emit(res);
        this.closeFilterModal();
        this.selectedFilterOption = [];
      });
  }

  getInvoices(): void {
    let model = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      status:
        this.selectedFilterOption[0] === "All"
          ? (this.selectedFilterOption = [])
          : this.selectedFilterOption,
    };
    this.isLoading = true;
    this.financeService
      .getInvoices(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.isLoading = false;
        this.filteredResult.emit(res);
        this.closeFilterModal();
        this.selectedFilterOption = [];
      });
  }

  getPurchaseOrder(): void {
    let model = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      status:
        this.selectedFilterOption[0] === "All"
          ? (this.selectedFilterOption = [])
          : this.selectedFilterOption,
    };
    this.isLoading = true;
    this.poService
      .spoolAllPurchaseOrders(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.isLoading = false;
        this.filteredResult.emit(res);
        this.closeFilterModal();
      });
  }

  getPayments(): void {
    let model = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      status:
        this.selectedFilterOption[0] === "All"
          ? (this.selectedFilterOption = [])
          : this.selectedFilterOption,
    };
    this.isLoading = true;

    this.filteredResult.emit(model);
    this.isLoading = false;
    this.closeFilterModal();
  }

  getPaymentsRecieved(): void {
    let model = {
      status:
        this.selectedFilterOption[0] === "All"
          ? (this.selectedFilterOption = [])
          : this.selectedFilterOption,
    };
    this.isLoading = true;

    this.filteredResult.emit(model);
    this.isLoading = false;
    this.closeFilterModal();
  }

  getTransactions(): void {
    this.isLoading = true;

    let model;
    if (this.tabState === "all") {
      model = {
        relatedObjectType:
          this.selectedFilterOption[0] === "All"
            ? (this.selectedFilterOption = "")
            : this.selectedFilterOption[0],
      };
    } else {
      model = {
        interactionType:
          this.selectedFilterOption[0] === "All"
            ? (this.selectedFilterOption = "")
            : this.selectedFilterOption[0],
      };
    }

    this.filteredResult.emit(model);
    this.closeFilterModal();
  }

  getCreditNotes(): void {
    let model: any = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      status:
        this.selectedFilterOption[0] === "All"
          ? (this.selectedFilterOption = [])
          : this.selectedFilterOption,
    };
    this.isLoading = true;
    this.cnService
      .getCNotes(model)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.isLoading = false;
        this.filteredResult.emit(res.body);
        this.closeFilterModal();
      });
  }
}
