import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";
import { ActivatedRoute } from "@angular/router";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { UserService } from "src/app/service/user.service";
import { FinanceService } from "../../service/finance.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";
import { GetPaymentsReqBody, Payment } from "../../finance.types";

@Component({
  selector: "app-payments-received",
  templateUrl: "./payments-received.component.html",
  styleUrls: ["./payments-received.component.scss"],
})
export class PaymentsReceivedComponent implements OnInit, OnDestroy {
  isSingleView: boolean = false;
  currentTheme: ColorThemeInterface;
  user: User;
  ownerInfo: AppOwnerInformation;
  tabState: "all" | "open" | "closed" = "open";
  statusState: string[] = ["Draft", "ReDraft", "SentForApproval"];
  isLoading: boolean = false;
  allPayments: Payment[] = [];
  pagination = {
    pageNumber: 1,
    pageSize: 10,
    maxPage: Infinity,
    searchTerm: null,
    totalRecords: 0,
    count: 0,
    jumpArray: [],
    hasNextPage: false,
    hasPreviousPage: false,
  };
  selectedPayment: any = null;
  selectedPaymentId: number;
  filterStatuses: CustomDropDown[] = [
    { id: "Draft", text: "Draft" },
    { id: "ReDraft", text: "Redraft" },
    { id: "SentForApproval", text: "Awaiting Approval" },
  ];
  filterModel: Filter;

  private _unsubscriber$ = new Subject();

  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  copy_hover = false;
  searchColumns:string[] = []

  constructor(
    private _colorThemeService: ColorThemeService,
    private _userService: UserService,
    private _authService: AuthService,
    private _financeService: FinanceService,
    private _configService: ConfigurationService,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this._fetchUser();
    this.getAppOwnerInfo();
    this._loadTheme();
    this.getPayments();
  }

  private _loadTheme(): void {
    this._colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getAppOwnerInfo() {
    this._configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.ownerInfo = res.body;
      });
  }

  onSelectedFiltersInit(filterModel: Filter) {
    this.filterModel = filterModel;
    filterModel.onChange(() => {
      this.switchviews(this.tabState, null);
    });
  }

  getPayment(id:number){
    this.isLoading = true;
    this._financeService.getPayment(id).pipe(pluck("body","data"),takeUntil(this._unsubscriber$)).subscribe(payment => {
      this.selectedPayment = payment;
      this.isLoading = false;
      this.selectedPaymentId = payment.financePaymentId;
      this.isSingleView = true;
      this._configService.isSidebarClosed$.next(true);
    })
  }

  viewPayment(paymentId?: number, element?:HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (paymentId && element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.getPayment(paymentId)
      }
    });
  }

  private _fetchUser(): void {
    this._userService
      .getUserInfo(this._authService.decodeToken().nameid)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  getPayments(event?,searchOpts?): void {
    if (event?.id) {
      this.filterModel.setData({
        filters: [[event]],
        filterTypes: ["status"],
        filterHeaders: ["Statuses"],
      });

      this.statusState = [event.id];
    }
    let model: GetPaymentsReqBody = {
      pageSize: +this.pagination.pageSize,
      pageNumber: this.pagination.pageNumber,
      filter: "Invoice",
      status: this.statusState
    };
    if (searchOpts) {
      model = { ...model, ...searchOpts };
    }

    this.isLoading = true;

    this._financeService
      .getPayments(model)
      .pipe(pluck("body"),takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.searchColumns = res.searchColumns;
        this.allPayments = res?.items;
        this.isLoading = false;
        this.setPagination(res);
        $(".itemPaginatedJumpModal").toggle(false);

        // For deep linking via reports
        this.getPaymentReceivedIdFromQuery();
      });
  }

  getPaymentReceivedIdFromQuery() {
    const id = this.route.snapshot.queryParams["paymentReceivedId"];
    if (id) {
      this.selectedPaymentId = id;
      this.viewPayment();
    }
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalRecords = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.maxPage = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.maxPage);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  setPayments(event): void {
    // this.getPayments(null, event);
  }

  switchviews(tab: "all" | "open" | "closed", status: string[]): void {
    this.tabState = tab;
    this.statusState = status;
    this.filterModel.clearData();

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
        this.statusState = this.filterStatuses.map((status) =>
          String(status.id)
        );
        break;

      case "closed":
        $("#nav-closed").addClass("active-tab");
        $("#nav-all,#nav-open").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Posted", text: "Posted" },
          { id: "Rejected", text: "Rejected" },
        ];
        this.statusState = this.filterStatuses.map((status) =>
          String(status.id)
        );
        break;

      case "open":
        $("#nav-open").addClass("active-tab");
        $("#nav-all,#nav-closed").removeClass("active-tab");
        this.filterStatuses = [
          { id: "Draft", text: "Draft" },
          { id: "ReDraft", text: "Redraft" },
          { id: "SentForApproval", text: "Awaiting Approval" },
        ];
        this.statusState = this.filterStatuses.map((status) =>
          String(status.id)
        );
        break;
    }

    this.getPayments();
  }

  deletePayment(paymentId: number): void {
    this._financeService
      .deletePaymentMade(paymentId)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.toast.fire({
          type: "success",
          title: "Payment deleted successfully.",
        });
        this.getPayments();
      });
  }

  closePayment(): void {
    this.isSingleView = false;
    this._configService.isSidebarClosed$.next(false);
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Payment code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
