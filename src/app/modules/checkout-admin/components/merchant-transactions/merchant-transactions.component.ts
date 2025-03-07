import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { PillFilters } from "src/app/model/CustomDropdown";
import {
  TableHeader,
  TableData,
  TableConfig,
  Pagination,
  SearchParams,
  ComplexFilter,
  ComplexFiltersChange,
} from "src/app/modules/shared/shared.types";
import { SharedService } from "src/app/service/shared.service";
import { CheckoutAdminService } from "../../checkout-admin.service";
import {
  GetMerchantTransactionsQueryParams,
  GetMerchantTransactionsResBody,
  LimitedMerchantData,
  MerchantTransaction,
} from "../../types/merchant";

@Component({
  selector: "lnd-merchant-transactions",
  templateUrl: "./merchant-transactions.component.html",
  styleUrls: ["./merchant-transactions.component.scss"],
})
export class MerchantTransactionsComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  isLoading = true;
  merchants: LimitedMerchantData[] = [];
  selectedDate = { startDate: "", endDate: "" };
  transactions: MerchantTransaction[] = [];
  tableConfig: TableConfig = {
    searchPlaceholder: "Name",
    uniqueIdPropLink: "name",
    striped: true,
  };
  tableHeaders: TableHeader[] = [
    { name: "Date" },
    { name: "Merchant Name" },
    { name: "Items Purchased" },
    { name: "Customer Name" },
    { name: "Phone number" },
    { name: "Email Address" },
    // { name: "Loan Amount", type: "amount" },
    // { name: "Commission earned", type: "amount" },
    // { name: "Approved Date" },
    { name: "Stage" },
  ];

  tableData: TableData[] = [];
  filters: ComplexFilter[] = [];
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
  selectedSearchColumn: string;
  keyword: string;
  filter: string;

  constructor(
    private readonly sharedService: SharedService,
    private readonly checkoutAdminService: CheckoutAdminService
  ) {}

  ngOnInit(): void {
    this.getAllMerchants();
    this.onFiltersChange();
  }

  getAllMerchants() {
    this.checkoutAdminService
      .fetchAllMerchants()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.merchants = res.body.data;
          this.filters.push({
            id: "merchant",
            data: this.merchants.map((item) => ({
              id: item.merchantId,
              text: item.merchantName,
            })),
            label: "Merchants",
            placeholder: "Select Merchant",
          });
          this.getTransactions();
        },
      });
  }

  getTransactions() {
    const data: GetMerchantTransactionsQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if (this.keyword) {
      data.keyword = this.keyword;
    }
    if (this.selectedSearchColumn) {
      data.selectedSearchColumn = this.selectedSearchColumn;
    }
    if (this.filter) {
      data.filter = this.filter;
    }
    if (this.selectedDate.startDate && this.selectedDate.endDate) {
      data.startDate = this.selectedDate.startDate;
      data.endDate = this.selectedDate.endDate;
    }

    this.isLoading = true;
    this.checkoutAdminService
      .fetchMerchantTransactions(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.transactions = res.body.items;
          this.setPagination(res.body);
          this.setTableData();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  setPagination(res: GetMerchantTransactionsResBody): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  onPaginationChange(data: { pageSize: number; pageNumber: number }) {
    this.pagination.pageNumber = data.pageNumber;
    this.pagination.pageSize = data.pageSize;
    this.getTransactions();
  }

  setTableData() {
    this.tableData = this.transactions.map((txn) => {
      return {
        date: {
          tdValue: txn.createdAt,
          type: "date",
          dateConfig: { showTime: true },
        },
        merchantName: { tdValue: txn.merchantName },
        itemsPurchased: {
          tdValue: this.generateItemPurchasedName(txn.productDetails),
          codeConfig: { tooltip: txn.productDetails.join(" , ") },
          type: "status",
          statusConfig: {
            class: "badge-light",
          },
        },
        customerName: { tdValue: txn.customerName },
        phoneNumber: { tdValue: txn.customerPhoneNumber },
        emailAddress: { tdValue: txn.customerEmail },
        // loanAmount: { tdValue: txn.loanAmount, type: "amount" },
        // commissionEarned: { tdValue: txn.commisionEarned, type: "amount" },
        // approvedDate: { tdValue: txn.approvedDate, type: "date" },
        stage: {
          tdValue: txn.stage,
          type: "status",
          codeConfig: {
            tooltip: this.getStageTooltip(txn.stage),
            tooltipPlacement: "left",
          },
          statusConfig: {
            class: this.getStatusClass(
              txn.status.toLowerCase() === "completed" ||
                txn.status.toLowerCase() === "successful"
            ),
          },
        },
      };
    });
  }

  getStatusClass(completed: boolean): string {
    if (completed) {
      return "badge-success";
    } else {
      return "badge-light";
    }
  }

  onSearchParams(data: SearchParams) {
    this.keyword = data.keyword;
    this.selectedSearchColumn = data.selectedSearchColumn;
    this.getTransactions();
  }

  onComplexFiltersChange(value: ComplexFiltersChange[]) {
    const merchant = value.find((item) => item.id === "merchant");

    if (merchant) {
      this.filter = String(merchant.data.id);
    }

    this.getTransactions();
  }

  onDateSelectionFilter(value: {
    startDate: string | null;
    endDate: string | null;
  }): void {
    this.selectedDate.startDate = value.startDate;
    this.selectedDate.endDate = value.endDate;
  }

  onFiltersChange() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters: PillFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          this.filter = null;

          this.getTransactions();
        }
      });
  }

  generateItemPurchasedName(items: string[]): string {
    const itemConcat = items.join(" , ");
    const maxLength = 15;
    if (itemConcat.length < maxLength) return itemConcat;
    return itemConcat.substring(0, maxLength) + "...";
  }

  getStageTooltip(stage: string) {
    let tip = "";
    switch (stage) {
      case "Verification":
        tip = "Customer has initiated the checkout process";
        break;
      case "PhoneNumberSelection":
        tip =
          "Customer has started the verification process, but is yet to validate their phone number";
        break;
      case "VerificationComplete":
        tip = "Customer identity verification is complete";
        break;
      case "CreditRiskAnalysis":
        tip = "Customer has initiated risk analysis on their profile";
        break;
      case "CreditRiskAnalysisComplete":
        tip = "Customer has completed their risk analysis";
        break;
      case "LoanOfferCalculationComplete":
        tip =
          "Customer has selected a preferred loan amount and downpayment (if applicable)";
        break;
      case "LoanOfferAccepted":
        tip =
          "Customer has viewed the loan offer, entered employment and personal information, and has viewed the terms and conditions and has also confirmed interest in loan offer";
        break;
      case "LoanOfferRejected":
        tip = "Customer has viewed the loan offer but has rejected it";
        break;
      case "DownPaymentInitiated":
        tip = "Customer has started the downpayment process";
        break;
      case "DownPaymentFailed":
        tip = "Downpayment process has failed";
        break;
      case "LoanCreated":
        tip = "Loan has been created and disbursed";
        break;
    }

    return tip;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
