import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
} from "../../shared/shared.types";
import { Subject } from "rxjs";
import { WacsService } from "../services/wacs.service";
import { WacsDisbursementConfirmation, WacsTransaction, WacsTransactionDetails } from "../types/loan-products";
import { removeNullUndefinedWithReduce } from "../../shared/helpers/generic.helpers";
import { takeUntil } from "rxjs/operators";
import { CustomDropDown, PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";

@Component({
  selector: "lnd-transactions",
  templateUrl: "./transactions.component.html",
  styleUrls: ["./transactions.component.scss"],
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();

  config: TableConfig = {
    uniqueIdPropLink:"code",
    rowClickable:false
  };
  headers: TableHeader[] = [
    { name: "Code", type: "code" },
    { name: "Customer Name" },
    { name: "Product Name" },
    { name: "Loan Amount", type: "amount", alignment: "right" },
    { name: "Date Created" },
    { name: "Status" },
    { name: "Action" }
  ];
  data: TableData[] = [];
  isLoading = false;
  transactions: WacsTransaction[] = [];
  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns: [],
  };
  filterStatuses = [
    { id: "LoanRequested", text: "Loan Requested" },
    { id: "AwaitingDisbursal", text: "Awaiting Disbursal" },
    { id: "Rejected", text: "Rejected" },
  ];
  paginationChange: TablePaginationChange;
  selectedFilter: CustomDropDown;
  showPopup = false;
  retrievingTxnDetails = false;
  wacsTransaction:WacsTransactionDetails;
  wacsTransactionInvoice:WacsDisbursementConfirmation;
  popupView:"transaction"|"invoice";

  constructor(
    private wacService: WacsService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.getTransactions();
    this.removePill();
  }

  getTransactions(paginationChange?: TablePaginationChange) {
    this.paginationChange = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      ...paginationChange,
    };
    this.isLoading = true;
    const payload = removeNullUndefinedWithReduce(this.paginationChange);

    this.wacService
      .getTransactions(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.transactions = res.body.items;
          this.setTableData();
          this.setPagination(res.body);
          this.setSelectedFilters(this.paginationChange.filter);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private setTableData() {
    this.data = this.transactions.map((transaction) => ({
      code: { tdValue: transaction?.transactionCode, type: "code", id:transaction?.id },
      customer: {
        tdValue: `${transaction?.firstName} ${transaction?.middleName ? transaction?.middleName : ""} ${transaction?.lastName}`,
      },
      product: { tdValue: transaction?.wacsLoanProduct },
      amount: {
        tdValue: transaction?.loanAmount,
        type: "amount",
        alignment: "right",
      },
      createdAt: { tdValue: transaction?.createdAt, type: "date" },
      status: {
        tdValue: transaction?.status,
        type: "status",
        statusConfig: { class: this.getStatusClass(transaction?.status) },
      },
      action: {
        tdValue:"",
        type:"action",
        actionConfig:this.getActionConfig(transaction?.id)
      }
    }));
  }

  private getActionConfig(id: number) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View Transaction",
        funcRef: () => this.viewTransaction(id),
      },
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View Invoice",
        funcRef: () => this.viewTransaction(id,true),
      },
    ];
  }

  getStatusClass(status: string): string {
    if (status === "Rejected") {
      return "badge-danger";
    } else {
      return "badge-warning";
    }
  }

  setSelectedFilters(filter) {
    if (filter) {
      this.selectedFilter = { id: filter, text: filter };
      this.sharedService.selectedFilters$.next({
        filters: [[{ ...this.selectedFilter, type: "status" }]],
        action: "add",
        headers: ["Statuses"],
      });
    }
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters: PillFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          this.selectedFilter = null;
          this.getTransactions();
        }
      });
  }

  private setPagination(res): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;
    this.pagination.searchColumns = res.searchColumns;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  filter(payload: CustomDropDown[]) {
    this.paginationChange.filter = payload[0].text as string;
    this.getTransactions(this.paginationChange);
  }

  viewTransaction(id:number,displayInvoice = false){
    this.showPopup = true;
    this.retrievingTxnDetails = true;

    this.wacService.getTransaction(id).pipe(takeUntil(this.unsubscriber$)).subscribe({
      next:(res) => {
        if (!displayInvoice) {
          this.popupView = "transaction";
          this.wacsTransaction = res.body.data;
        } else {
          this.popupView = "invoice";
          this.wacsTransactionInvoice = res.body.data.invoiceInfo;
        }
        this.retrievingTxnDetails = false;
      },
      error:() => {
        this.retrievingTxnDetails = false;
      }
    })
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
