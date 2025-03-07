import { Component, OnDestroy, OnInit, TemplateRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { LedgerTransactionService } from "src/app/service/ledger-transaction.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { ColorThemeService } from "src/app/service/color-theme.service";
import {
  EndOfPeriod,
  GroupedTransaction,
  LedgerTransaction,
} from "../types/ledger-transactions";
import { ActivatedRoute, Router } from "@angular/router";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";
import {
  ComplexFilter,
  ComplexFiltersChange,
  Pagination,
  SearchParams,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
  User,
} from "../../shared/shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import {
  CustomDropDown,
  PillFilter,
  PillFilters,
} from "src/app/model/CustomDropdown";

@Component({
  selector: "app-ledger-transactions",
  templateUrl: "./ledger-transactions.component.html",
  styleUrls: ["./ledger-transactions.component.scss"],
})
export class LedgerTransactionsComponent implements OnInit, OnDestroy {
  currentTheme: ColorThemeInterface;
  unsubscriber$ = new Subject<void>();

  groupedTransactions: GroupedTransaction[] = [];
  transactionFetchModel: any = {
    pageNumber: 1,
    pageSize: 10,
    code: "",
    startDate: "",
    endDate: "",
  };
  transaction: GroupedTransaction;
  transactionPagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  selectedSearchColumn = "";
  keyword = "";
  filter = "";
  fetchingLedgerTransactions = false;
  ledgerTransactions: LedgerTransaction[] = [];
  transRawStartDate: string = null;
  transRawEndDate: string = null;
  transactionLoader = false;

  openAside: boolean = false;
  loaderMsg: string = "Loading";
  selectedEndOfPeriod: EndOfPeriod;
  moduleOptions: string[] = ["Loan", "Investment", "Finance"];
  statusOptions: CustomDropDown[] = [
    { id: "Posted", text: "Posted" },
    { id: "Void", text: "Void" },
    { id: "AwaitingApproval", text: "Awaiting Approval" },
    { id: "Rejected", text: "Rejected" },
  ];

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  transactionId: number;
  filterModel: Filter;
  copy_hover = false;
  currencySymbol: string;
  isLoading = false;
  user: User;
  headers: TableHeader[] = [
    { name: "Code", type: "code" },
    { name: "Branch" },
    { name: "Date" },
    { name: "Type" },
    { name: "Document" },
    { name: "Debit", type: "amount", alignment: "right" },
    { name: "Credit", type: "amount", alignment: "right" },
    { name: "Status" },
    { name: "Action" },
  ];
  tableData: TableData[] = [];
  config: TableConfig = {
    uniqueIdPropLink: "code",
    striped: true,
  };
  filters: ComplexFilter[] = [];
  selectedFilters: PillFilter[][] = [];
  selectedFiltersHeaders: string[] = [];
  selectedFiltersTypes: string[] = [];

  constructor(
    private modalService: NgbModal,
    private colorThemeService: ColorThemeService,
    public transactionService: LedgerTransactionService,
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedService,
    private readonly configService: ConfigurationService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.route.queryParams.subscribe((queryParams) => {
      this.transactionId = +queryParams?.id;
      this.transactionFetchModel.code = this.transactionId || "";
    });
    this.fetchUser();
    this.loadTheme();
    this.fetchGroupedTransactions();
    this.filters.push(
      {
        id: "module",
        data: this.moduleOptions.map((module) => ({
          id: module,
          text: module,
        })),
        label: "Module",
        placeholder: "Select a Module",
      },
      {
        id: "status",
        data: this.statusOptions.map((module) => ({
          id: module.id,
          text: module.text,
        })),
        label: "Status",
        placeholder: "Select a Status",
      }
    );
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configService.currencySymbol;
    if (!this.currencySymbol) {
      this.configService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  onOpenFilterModal(): void {
    $(".filter-menu").toggle();
  }

  onOptionSelected() {
    this.filterModel.setData({
      filters: this.selectedFilters,
      filterTypes: this.selectedFiltersTypes,
      filterHeaders: this.selectedFiltersHeaders,
    });
    this.fetchGroupedTransactions();
  }

  setPagination(res: any): void {
    this.transactionPagination = res;
    this.transactionPagination.count = res.items.length;
    this.transactionPagination.searchColumns = res.searchColumns;
    this.transactionPagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.transactionPagination.jumpArray.push(i);
    }
  }

  onPaginationChange(pagination: TablePaginationChange) {
    this.transactionPagination.pageNumber = pagination.pageNumber;
    this.transactionPagination.pageSize = +pagination.pageSize;

    this.fetchGroupedTransactions();
  }

  fetchGroupedTransactions() {
    this.transactionFetchModel = {
      ...this.transactionFetchModel,
      pageNumber: this.transactionPagination.pageNumber,
      pageSize: this.transactionPagination.pageSize,
      filter: this.filter,
      keyword: this.keyword,
      selectedSearchColumn: this.selectedSearchColumn,
    };

    this.transactionLoader = true;
    this.groupedTransactions = [];

    this.transactionService
      .getGroupedTransactions(this.transactionFetchModel)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.groupedTransactions = response.body.data.items;
          if (this.transactionId) {
            this.viewTransaction(response.body.data.items[0]);
          } else {
            this.setTableData(this.groupedTransactions);
            this.setPagination(response.body.data);

            $(".itemPaginatedJumpModal").toggle(false);
          }

          this.transactionLoader = false;
        },
        () => {
          this.transactionLoader = false;
        }
      );
  }

  setTableData(transactions: GroupedTransaction[]) {
    this.tableData = transactions.map((transaction) => ({
      code: {
        tdValue: transaction.code,
        type: "code",
        id: transaction.groupedTransactionId,
      },
      branch: { tdValue: transaction?.branch },
      date: { tdValue: transaction?.transactionDate, type: "date" },
      type: { tdValue: transaction?.interactionType },
      document: { tdValue: transaction?.relatedObjectType },
      debit: {
        tdValue: transaction?.debitAmount,
        type: "amount",
        alignment: "right",
      },
      credit: {
        tdValue: transaction?.creditAmount,
        type: "amount",
        alignment: "right",
      },
      status: {
        tdValue: transaction?.status,
        type: "status",
        statusConfig: {
          class: this.getStatusClass(transaction),
        },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(transaction),
      },
    }));
  }

  onComplexFiltersChange(event: ComplexFiltersChange[]) {
    event.forEach((ev) => {
      if (ev.id === "module") {
        this.filter = ev.data?.id as string;
        this.selectedFilters.push([
          { id: this.filter, text: this.filter, type: "module" },
        ]);
        this.selectedFiltersHeaders.push("Modules");
        this.selectedFiltersTypes.push("modules");
      }

      if (ev.id === "status") {
        this.transactionFetchModel["status"] = ev.data?.id as string;
        this.selectedFilters.push([
          {
            id: this.transactionFetchModel["status"],
            text: this.transactionFetchModel["status"],
            type: "status",
          },
        ]);
        this.selectedFiltersHeaders.push("Status");
        this.selectedFiltersTypes.push("status");
      }
    });

    this.onOptionSelected();
  }

  getStatusClass(transaction: GroupedTransaction): string {
    if (transaction.status === "Posted") {
      return "badge-success";
    } else if (
      transaction.status === "Void" ||
      transaction.status === "Rejected"
    ) {
      return "badge-danger";
    } else if (transaction.status === "AwaitingApproval") {
      return "badge-approval";
    }
  }

  getActionConfig(transaction: GroupedTransaction) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.viewTransaction(transaction),
      },
      {
        showBtn:
          this.user?.permission?.includes("Reject Finance Transactions") &&
          transaction.status === "AwaitingApproval",
        iconClass: "icon-close-circle",
        btnText: "Reject",
        funcRef: () => this.rejectTransaction(transaction.groupedTransactionId),
      },
      {
        showBtn:
          this.user?.permission?.includes("Post Finance Transactions") &&
          transaction.status === "AwaitingApproval",
        iconClass: "icon-sent",
        btnText: "Post",
        funcRef: () =>
          this.postTransaction(
            transaction.groupedTransactionId,
            transaction.modifiedAt
          ),
      },
    ];
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  viewTransaction(transaction: GroupedTransaction, element?: HTMLElement) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.transaction = transaction;
        this.getLedgerTransactions(transaction.groupedTransactionId);
        this.toggleAside();
      }
    });
  }

  retrieveRowDetails(id: number) {
    const transaction = this.groupedTransactions.find(
      (transaction) => transaction.groupedTransactionId === id
    );
    this.viewTransaction(transaction);
  }

  getLedgerTransactions(groupedTransactionId: number) {
    this.fetchingLedgerTransactions = true;

    this.transactionService
      .fetchLedgerTransactions(groupedTransactionId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.ledgerTransactions = res.body.data;
          this.fetchingLedgerTransactions = false;
        },
        () => {
          this.fetchingLedgerTransactions = false;
        }
      );
  }

  postTransaction(id: any, modified: any): void {
    this.transactionLoader = true;
    let model = { transactionIds: [id], modifiedAt: modified };

    this.transactionService
      .postTransactions(model)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.toast.fire({
            type: "success",
            title: "Transactions Posted Successfully.",
          });

          this.transactionLoader = false;
          this.fetchGroupedTransactions();
          if (this.openAside) {
            this.toggleAside();
          }
        },
        () => (this.transactionLoader = false)
      );
  }

  openLink(link) {
    window.open(link, "_blank");
  }

  toggleAside(action?: string) {
    this.openAside = !this.openAside;
    if (this.transactionId && action === "close") {
      this.router.navigate(["finance/transactions"], {
        queryParams: { id: null },
        queryParamsHandling: "merge",
      });

      delete this.transactionFetchModel.code;
      this.fetchGroupedTransactions();
    }
  }

  formatDate(data) {
    if (data == null || data == undefined || data.trim == "") {
      return null;
    }
    try {
      const date = new Date(data.toString());
      const m = date.getMonth() + 1;
      const d = date.getDate();
      const yyyy = date.getFullYear();

      const MM = m >= 10 ? m + "" : "0" + m;
      const dd = d >= 10 ? d + "" : "0" + d;
      return yyyy + "-" + MM + "-" + dd;
    } catch (error) {
      return null;
    }
  }

  isNullOrEmpty(str: string) {
    return str == null || str.trim() == "";
  }

  separateWords(str: string) {
    if (this.isNullOrEmpty(str)) return str;

    let result = "";
    for (let i = 0; i < str.length; i++) {
      const element = str.charAt(i);

      if (i == str.length - 1 || i == 0 || element == " ") {
        result += element;
        continue;
      }

      if (element == element.toUpperCase()) {
        result += " " + element;
      } else {
        result += element;
      }
    }
    return result;
  }

  ledgerTransactionsJumpModal() {
    $(".ledgerTransactionsJumpModal").toggle();
  }

  onSetEndOfPeriod(view: TemplateRef<any>, type: EndOfPeriod) {
    this.selectedEndOfPeriod = type;
    this.modalService.open(view, { size: "md", centered: true });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange((response) => {
      if (response?.modules) {
        delete this.transactionFetchModel["status"];
      } else if (response?.status) {
        this.filter = "";
      } else {
        delete this.transactionFetchModel["status"];
        this.filter = "";
      }
      this.fetchGroupedTransactions();
    });
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Transaction code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  onSearchParams(event: SearchParams) {
    this.selectedSearchColumn = event.selectedSearchColumn;
    this.keyword = event.keyword;
    this.transactionPagination.pageNumber = event?.pageNumber;
    this.transactionPagination.pageSize = event?.pageSize;
    this.fetchGroupedTransactions();
  }

  downloadFile(url: string): void {
    this.toast.fire({
      type: "info",
      timer: 3000,
      title: "Your download will start shortly...",
    });
    window.open(url, "_blank");
  }

  rejectTransaction(id: number) {
    Swal.fire({
      title: "Reject Transaction",
      text: "Are you sure you want to proceed? This action will automatically reject this transaction without requiring any further approval.",
      showCancelButton: true,
      cancelButtonText: "No, Cancel",
      showConfirmButton: true,
      confirmButtonText: "Yes, Proceed",
    }).then((result) => {
      if (result.value) {
        this.isLoading = true;
        this.transactionService
          .rejectTransaction([id])
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe({
            next: () => {
              this.isLoading = false;
              if (this.openAside) {
                this.toggleAside();
              }
              this.fetchGroupedTransactions();
            },
            error: () => {
              this.isLoading = false;
            },
          });
      }
    });
  }

  private fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(pluck("body"), takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res;
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
