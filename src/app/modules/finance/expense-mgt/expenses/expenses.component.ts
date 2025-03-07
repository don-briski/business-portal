import { ActivatedRoute } from "@angular/router";
import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { UserService } from "src/app/service/user.service";
import { FinanceService } from "../../service/finance.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";
import { Pagination, SearchParams } from "src/app/modules/shared/shared.types";
import { Expense, GetExpensesResBody } from "../../types/expense";

@Component({
  selector: "app-expenses",
  templateUrl: "./expenses.component.html",
  styleUrls: ["./expenses.component.scss"],
})
export class ExpensesComponent implements OnInit {
  user;
  isSingleView: boolean = false;
  unsubscriber$ = new Subject();
  currentTheme: ColorThemeInterface;
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
  expenses: Expense[] = [];
  isLoading: boolean = false;
  ownerInformation: any;
  selectedExpense;
  selectedExpenseId: number;
  tabState: "all" | "open" | "closed" = "open";
  statusState: string[] = ["Draft", "ReDraft", "SentForApproval"];
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  filterStatuses: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "ReDraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
  ];
  filterModel: Filter;
  copy_hover = false;
  selectedSearchColumn = '';
  keyword = '';

  constructor(
    private financeService: FinanceService,
    private userService: UserService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private configurationService: ConfigurationService,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this._fetchUser();
    this._loadTheme();
    this._getConfigInfo();
    this.getExpenses();
  }

  switchviews(tab: "all" | "open" | "closed", status?: string[]): void {
    this.tabState = tab;
    this.statusState = status;
    switch (tab) {
      case "all":
        $("#nav-all").addClass("active-tab");
        $("#nav-open,#nav-closed").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        break;

      case "closed":
        $("#nav-closed").addClass("active-tab");
        $("#nav-all,#nav-open").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        break;

      case "open":
        $("#nav-open").addClass("active-tab");
        $("#nav-all,#nav-closed").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
        ];
        break;
      default:
        break;
    }
    this.pagination = {
      hasNextPage: false,
      hasPreviousPage: false,
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      count: 0,
      jumpArray: [],
    };

    this.filterModel.clearData();
    this.getExpenses();
  }

  onSearchParams(event: SearchParams) {
    this.selectedSearchColumn = event.selectedSearchColumn;
    this.keyword = event.keyword;
    this.getExpenses();
  }

  getExpenses(event?): void {
    let pageInfo: any;
    if (event?.id) {
      this.filterModel.setData({
        filters: [[event]],
        filterTypes: ["status"],
        filterHeaders: ["Status"],
      });

      this.statusState = [event?.id];
    }

    pageInfo = {
      pageSize: this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
      filter: this.statusState,
    };

    if (this.selectedSearchColumn && this.keyword) {
      pageInfo.selectedSearchColumn = this.selectedSearchColumn;
      pageInfo.keyword = this.keyword;
    }

    if (event?.search) {
      pageInfo = { ...pageInfo, ...event };
    }
    this.isLoading = true;
    this.financeService
      .getExpenses(pageInfo)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        $(".itemPaginatedJumpModal").toggle(false);
        this.expenses = res.body.items;
        this.setPagination(res.body);

        this.isLoading = false;

        // For deepling via reports
        this.getExpenseIdFromQuery();
      });
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  setJournals(event): void {
    this.expenses = event.body.items;
    this.setPagination(event);
  }

  setPagination(res: GetExpensesResBody): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  private _fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.user = res.body;
        },
        (err) => {}
      );
  }

  private _loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  private _getConfigInfo() {
    this.configurationService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (response) => {
          this.ownerInformation = response.body;
        },
        (err) => {
          // swal.fire('Error', err.error, 'error');
        }
      );
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  getExpenseIdFromQuery() {
    const id = this.route.snapshot.queryParams["expenseId"];
    if (id) {
      this.selectedExpenseId = id;
      const expense = this.expenses.find(
        (expense) => expense.expenseId === +id
      );
      this.setSingleView(expense, null, true);
    }
  }

  setSingleView(
    expense?: any,
    element?: HTMLElement,
    forceViewing = false
  ): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (
        (expense &&
          element?.className.split(" ")[index] !== "show" &&
          !this.copy_hover) ||
        (expense && forceViewing)
      ) {
        this.selectedExpense = expense;
        this.selectedExpenseId = expense.expenseId;
        this.isSingleView = true;
        this.configurationService.isSidebarClosed$.next(true);
      }
    });
  }

  closeView() {
    this.isSingleView = false;
    this.selectedExpense = null;
    this.configurationService.isSidebarClosed$.next(false);
  }

  deleteExpense(expenseId: number): void {
    Swal.fire({
      type: "info",
      text: "This Action will delete this expense",
      title: "Delete Expense",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Abort",
      confirmButtonText: "Proceed",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.isLoading = true;

        this.financeService
          .deleteExpense(+expenseId)
          .pipe(takeUntil(this.unsubscriber$))
          .subscribe(
            (res) => {
              this.isLoading = false;
              this.getExpenses();
              this.toast.fire({
                type: "success",
                title: "Expense Deleted successfully",
              });
            },
            (error) => {
              this.isLoading = false;
            }
          );
      }
    });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.switchviews(this.tabState);
    });
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "Expense code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  ngOnDestroy(): void {
    this.closeView();
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
