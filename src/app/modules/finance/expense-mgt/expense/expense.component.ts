import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { FinanceService } from "../../service/finance.service";
import Swal from "sweetalert2";
import { printFile } from "src/app/util/helpers/print.helper";
import { SharedService } from "src/app/service/shared.service";
import { ExpenseDetails } from "../../types/expense";
import { Router } from "@angular/router";

@Component({
  selector: "app-expense",
  templateUrl: "./expense.component.html",
  styleUrls: ["./expense.component.scss"],
})
export class ExpenseComponent implements OnInit, OnDestroy {
  fetchingExpense: boolean = false;
  @Input() currentTheme: any;
  @Input() expenses: any[] = [];
  @Input() user: any;
  @Input() currency;
  @Input() selectedExpenseId: number;
  @Input() pagination: any;
  @Output() setIsSingleView = new EventEmitter<boolean>();
  @Output() getExpenses = new EventEmitter<any>();
  @ViewChild("expensePaper") expensePaper: ElementRef;

  unsubscriber$ = new Subject();
  approvalStatus: "Redraft" | "Posted" | "Rejected" | "Redraft" | null;
  selectedExpense: ExpenseDetails;
  loading: boolean = false;
  printStatus: string;
  activityLogs: any[] = [];
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  hoverStyle: string;
  constructor(
    private finService: FinanceService,
    private modalService: NgbModal,
    private router: Router,
    private _sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this._getExpense(this.selectedExpenseId);
    this._sharedService.printStatus$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((status) => (this.printStatus = status));

    this.hoverStyle = `5px solid ${this.currentTheme?.secondaryColor}`;
  }

  private _getExpense(expenseId: number): void {
    this.fetchingExpense = true;
    this.finService
      .getExpense(expenseId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.selectedExpense = res.body.data;
        this.fetchingExpense = false;
        this._getActivityLogs(this.selectedExpense.expenseId);
      });
  }

  private _getActivityLogs(expenseId: number): void {
    this.finService
      .getExpenseActivityLogs(expenseId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => (this.activityLogs = res.body));
  }
  showExpenseInfo(expenseId: number): void {
    this.fetchingExpense = true;
    this._getExpense(expenseId);
  }

  switchTabs(tab: string): void {
    switch (tab) {
      case "overview":
        $("#nav-overview").addClass("active-tab");
        $("#nav-activity,#nav-comments,#nav-files").removeClass("active-tab");

        $("#tab-overview").addClass("active show");
        $("#tab-activity,#tab-comments,#tab-files").removeClass("active show");
        break;

      case "comments":
        $("#nav-comments").addClass("active-tab");
        $("#nav-overview,#nav-activity,#nav-files").removeClass("active-tab");

        $("#tab-comments").addClass("active show");
        $("#tab-overview,#tab-activity,#tab-files").removeClass("active show");
        break;

      case "activity":
        $("#nav-activity").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-files").removeClass("active-tab");

        $("#tab-activity").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-files").removeClass("active show");
        break;

      case "files":
        $("#nav-files").addClass("active-tab");
        $("#nav-overview,#nav-comments,#nav-activity").removeClass(
          "active-tab"
        );

        $("#tab-files").addClass("active show");
        $("#tab-overview,#tab-comments,#tab-activity").removeClass(
          "active show"
        );
        break;
      default:
        break;
    }
  }

  openModal(modal: any): void {
    this.modalService.open(modal, {
      centered: true,
      size: "md",
      ariaLabelledBy: "modal-basic-title",
    });
  }

  public printExpense(filename): void {
    this.printStatus = "Processing";
    printFile(this.expensePaper, filename, "expense").then((res) =>
      this._sharedService.printStatus$.next("Print")
    );
  }

  close(): void {
    this.setIsSingleView.emit(false);
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  submit(event): void {
    const { transactionPin, ...rest } = event;
    const payload = {
      ...rest,
      expenseId: this.selectedExpense.expenseId,
    };
    this.approvalStatus = payload.status;
    let state: string;
    let message: string;
    switch (this.approvalStatus) {
      case "Posted":
        state = "Post";
        message = `Expense (${this.selectedExpense.expenseCode}) Posted Successfully`;
        break;
      case "Redraft":
        state = "Redraft";
        message = `Expense (${this.selectedExpense.expenseCode}) Redrafted Successfully`;
        break;
      case "Rejected":
        state = "Reject";
        message = `Expense (${this.selectedExpense.expenseCode}) Rejected Successfully`;
        break;
      default:
        break;
    }
    Swal.fire({
      type: "info",
      text: `This Action Will ${state} this Expense`,
      title: `${state} Expense`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.loading = true;
        this.finService
          .approveExpense(payload, transactionPin)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.loading = false;
              this.toast.fire({
                type: "success",
                text: message,
              });
              this.closeModal();
              this.setIsSingleView.emit(false);
              this.getExpenses.emit();
            },
            (err) => (this.loading = false)
          );
      }
    });
  }

  cloneExpense() {
    Swal.fire({
      type: "info",
      title: "Clone Expense?",
      text: `Are you sure you want to clone this Expense (${this.selectedExpense.expenseCode})?`,
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Clone it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.router.navigateByUrl(
          `/finance/expenses/${this.selectedExpense.expenseId}/clone`
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
