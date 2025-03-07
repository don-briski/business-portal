import { HttpResponse } from "@angular/common/http";
import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { Router } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import {
  AppOwnerInformation,
  Pagination,
} from "src/app/modules/shared/shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import {
  customerTransactionTableColumns,
  CustomerTransactionName,
  CustomerTransactionType,
  CustomerFinanceTransaction,
} from "../../models/customer-transaction";
import { FinanceService } from "../../service/finance.service";
import { CreditNotesService } from "../../credit-notes/credit-notes.service";
import { GetCNotesReqBody } from "../../credit-notes/types";
import { GetPaymentsReqBody } from "../../finance.types";
import { FetchJournalsPayload } from "../../types/Journal";
import { FinanceStatus } from "../../finance.types";
import { ALL_FINANCE_STATUSES } from "../../utils/finance.utils";

@Component({
  selector: "lnd-customer-transactions",
  templateUrl: "./customer-transactions.component.html",
  styleUrls: ["./customer-transactions.component.scss"],
})
export class CustomerTransactionsComponent implements OnInit, OnDestroy {
  @Input() customerId: number;
  @Input() colorTheme: ColorThemeInterface;

  subs$ = new Subject<void>();
  ownerInformation: AppOwnerInformation;

  transactionNames: CustomDropDown[] = [
    { id: 1, text: CustomerTransactionName.Expenses },
    { id: 2, text: CustomerTransactionName.CreditNotes },
    { id: 3, text: CustomerTransactionName.Invoices },
    { id: 4, text: CustomerTransactionName.PaymentsReceived },
    { id: 6, text: CustomerTransactionName.Journals },
  ];
  transactionType: CustomerTransactionType;
  transactionName: CustomerTransactionName;
  transactionTableColumns = customerTransactionTableColumns;

  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  isLoading = false;
  transactions: any[] = [];
  fetchPayload: CustomerFinanceTransaction;

  constructor(
    private financeService: FinanceService,
    private configService: ConfigurationService,
    private router: Router,
    private modalService: NgbModal,
    private creditNotesService: CreditNotesService
  ) {}

  ngOnInit(): void {
    this.getApplicationownerinformation();
  }

  getApplicationownerinformation() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe((response) => {
        this.ownerInformation = response.body;
      });
  }

  fetchTransactions(
    txName: CustomerTransactionName,
    pageNumber?: number,
    extraPayload?: CustomerFinanceTransaction
  ) {
    this.fetchPayload = {
      pageSize: this.pagination.pageSize,
      pageNumber: pageNumber ? pageNumber : this.pagination.pageNumber,
    };

    if (extraPayload) {
      this.fetchPayload = {
        ...this.fetchPayload,
        ...extraPayload,
        keyword: extraPayload.keyword,
      };
    }

    this.isLoading = true;
    let response: Observable<HttpResponse<any>>;

    switch (txName) {
      case CustomerTransactionName.Expenses:
        this.transactionType = CustomerTransactionType.Expense;
        this.transactionName = txName;
        response = this.financeService.getExpenses({
          ...this.fetchPayload,
          customerId: this.customerId,
        });
        break;
      case CustomerTransactionName.CreditNotes:
        this.transactionType = CustomerTransactionType.CreditNote;
        this.transactionName = txName;
        const creditNotePayload: GetCNotesReqBody = {
          ...this.fetchPayload,
          filter: this.customerId,
        };
        response = this.creditNotesService.getCreditNotes(creditNotePayload);
        break;
      case CustomerTransactionName.Invoices:
        this.transactionType = CustomerTransactionType.Invoice;
        this.transactionName = txName;
        response = this.financeService.getInvoices({
          ...this.fetchPayload,
          customerId: this.customerId,
        });
        break;
      case CustomerTransactionName.PaymentsReceived:
        this.transactionType = CustomerTransactionType.PaymentReceived;
        this.transactionName = txName;
        const paymentsPayload: GetPaymentsReqBody & { customerId: number } = {
          ...this.fetchPayload,
          filter: "Invoice",
          customerId: this.customerId,
        };
        response = this.financeService.getPayments(paymentsPayload);
        break;
      case CustomerTransactionName.Journals:
        this.transactionType = CustomerTransactionType.Journal;
        this.transactionName = txName;
        const payload:FetchJournalsPayload = {pageNumber:this.pagination.pageNumber,pageSize:this.pagination.pageSize, filter:ALL_FINANCE_STATUSES, financePersonId:this.customerId}
        response = this.financeService.fetchJournals(payload);
        break;
    }

    response.pipe(pluck("body"), takeUntil(this.subs$)).subscribe({
      next: (res: any) => {
        this.transactions = res.items;
        this.setPagination(res);

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
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
        const url = this.financeService.getDeepLinkingUrl({
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
    this.subs$.next();
    this.subs$.complete();
  }
}
