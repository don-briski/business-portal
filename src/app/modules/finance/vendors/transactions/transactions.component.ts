import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import Swal from "sweetalert2";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { pluck, takeUntil } from "rxjs/operators";
import { BillsMgtService } from "src/app/service/bills-mgt.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { PurchaseOrderService } from "src/app/service/purchase-order.service";
import { Transaction } from "../../models/transaction.enum";
import { FinanceService } from "../../service/finance.service";
import { VendorCreditNoteService } from "../../vendor-credits/vendor-credits.service";
import { Payment } from "../../finance.types";
import { FetchJournalsPayload } from "../../types/Journal";
import { ALL_FINANCE_STATUSES } from "../../utils/finance.utils";
import { Expense } from "../../types/expense";

@Component({
  selector: "transactions",
  templateUrl: "./transactions.component.html",
  styleUrls: ["./transactions.component.scss"],
})
export class TransactionsComponent implements OnInit, OnDestroy {
  @Input() vendorId: number;
  @Input() currentTheme;
  private _unsubscriber$ = new Subject();

  pagination = {
    pageNumber: 1,
    pageSize: 10,
    maxPage: Infinity,
    totalPages: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };

  transactions: any[] = [
    { id: 1, text: Transaction.Expenses },
    { id: 2, text: Transaction.PurchaseOrder },
    { id: 3, text: Transaction.Bills },
    { id: 4, text: Transaction.PaymentsMade },
    { id: 5, text: Transaction.Vcn },
    { id: 6, text: Transaction.Journals },
  ];

  expenses: Expense[] = [];
  purchaseOrders: any[] = [];
  bills: any[] = [];
  payments: Payment[] = [];
  vcns: any[] = [];
  journals: any[] = [];
  isLoading: boolean = false;
  type: Transaction;
  options;
  ownerInformation: any;
  noResultFound = false;

  constructor(
    private _financeService: FinanceService,
    private _poService: PurchaseOrderService,
    private _billService: BillsMgtService,
    private configService: ConfigurationService,
    private _vcnService: VendorCreditNoteService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.options = { vendorId: this.vendorId };
    this.getApplicationownerinformation();
  }

  fetchTransactionDetails(
    type?: Transaction,
    navState?: number,
    extraPayload?
  ): void {
    this.type = type;
    let payload = {
      pageSize: this.pagination.pageSize,
      pageNumber: navState ? navState : this.pagination.pageNumber,
      vendorId: this.vendorId,
    };

    if (extraPayload) {
      payload = { ...payload, ...extraPayload, search: extraPayload.keyword };
    }

    this.isLoading = true;

    switch (this.type) {
      case Transaction.Expenses:
        this._getExpenses(payload);
        break;

      case Transaction.PurchaseOrder:
        this._getPO(payload);
        break;

      case Transaction.Bills:
        this._getBills(payload);
        break;

      case Transaction.PaymentsMade:
        this._getPayments(payload);
        break;

      case Transaction.Vcn:
        this._getVcns(payload);
        break;

      case Transaction.Journals:
        const fetchJournalsPayload:FetchJournalsPayload = {
          pageNumber:this.pagination.pageNumber,
          pageSize:this.pagination.pageSize,
          filter:ALL_FINANCE_STATUSES,
          financePersonId: this.vendorId
        }
        this._getJournals(fetchJournalsPayload);
        break;
    }
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  private _setPagination(pagination) {
    this.pagination.count = pagination.totalCount;
    this.pagination.hasNextPage = pagination.hasNextPage;
    this.pagination.hasPreviousPage = pagination.hasPreviousPage;
    this.pagination.pageNumber = pagination.pageNumber;
    this.pagination.pageSize = pagination.pageSize;
    this.pagination.totalPages = pagination.totalPages;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  private _getExpenses(payload): void {
    this._financeService
      .getExpenses(payload)
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this._setPagination(res);
        this.expenses = res.items;

        this.bills = [];
        this.purchaseOrders = [];
        this.payments = [];
        this.vcns = [];
        this.journals = [];

        this.isLoading = false;
        this.noResultFound = this.expenses.length === 0;
      });
  }

  private _getPO(payload): void {
    this._poService
      .spoolAllPurchaseOrders(payload)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this._setPagination(res);
        this.purchaseOrders = res.items;

        this.bills = [];
        this.expenses = [];
        this.payments = [];
        this.vcns = [];
        this.journals = [];

        this.isLoading = false;
        this.noResultFound = this.purchaseOrders.length === 0;
      });
  }

  private _getBills(payload): void {
    this._billService
      .spoolAllBills(payload)
      .pipe(pluck("data"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this._setPagination(res);
        this.bills = res.items;

        this.purchaseOrders = [];
        this.expenses = [];
        this.payments = [];
        this.vcns = [];
        this.journals = [];

        this.isLoading = false;

        this.noResultFound = this.bills.length === 0;
      });
  }

  private _getPayments(payload): void {
    this._financeService
      .getPayments(payload)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this._setPagination(res.body);
        this.payments = res.body.items;

        this.purchaseOrders = [];
        this.expenses = [];
        this.bills = [];
        this.vcns = [];
        this.journals = [];

        this.isLoading = false;

        this.noResultFound = this.payments.length === 0;
      });
  }

  private _getVcns(payload): void {
    this._vcnService
      .getVCNotes(payload)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this._setPagination(res.body);
        this.vcns = res.body.items;

        this.purchaseOrders = [];
        this.expenses = [];
        this.bills = [];
        this.journals = [];
        this.payments = [];

        this.isLoading = false;
        this.noResultFound = this.vcns.length === 0;
      });
  }

  private _getJournals(payload): void {
    this._financeService
      .fetchJournals(payload)
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe((journals) => {
        this._setPagination(journals);
        this.journals = journals.items;

        this.purchaseOrders = [];
        this.expenses = [];
        this.bills = [];
        this.vcns = [];
        this.payments = [];

        this.isLoading = false;

        this.noResultFound = this.journals.length === 0;
      });
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  filteredResult(res): void {
    switch (this.type) {
      case Transaction.Expenses:
        this.expenses = res.body.items;

      case Transaction.Bills:
        this.bills = res.data.items;
        break;
    }
  }

  onViewRelatedEntity(entityName: string, entityId: number) {
    Swal.fire({
      type: "info",
      title: "Exit Page?",
      text: "Leave this page to view the source document?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Continue",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        const url = this._financeService.getDeepLinkingUrl({
          name: entityName,
          id: entityId,
        });

        if (url) {
          this.router.navigateByUrl(url);
          this.modalService.dismissAll();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
