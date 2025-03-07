import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CreditRefund, Pagination } from "../credit-refund.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { CreditRefundService } from "../credit-refund.service";

@Component({
  selector: "lnd-credit-refunds",
  templateUrl: "./credit-refunds.component.html",
  styleUrls: ["./credit-refunds.component.scss"],
})
export class CreditRefundsComponent implements OnInit {
  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  appOwner: any;
  user: any;

  searchParam = "";
  gettingRefunds = false;
  creditRefunds: CreditRefund[] = [];
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
  errOccured = false;
  viewingRefundDetail = false;
  selectedRefund: CreditRefund;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private refundService: CreditRefundService
  ) {}

  ngOnInit(): void {
    this.getUser();
    this.loadTheme();
    this.getAppOwnerInfo();
    this.getCreditRefunds();
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  get haveRefunds() {
    return this.creditRefunds.length;
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  getAppOwnerInfo() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.appOwner = res.body;
        },
        error: (_) => {},
      });
  }

  getCreditRefunds(
    data = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      search: this.searchParam,
    }
  ) {
    this.gettingRefunds = true;
    this.refundService
      .getCreditRefunds(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.creditRefunds = res.body.data.items;
          this.setPagination(res.body);
          this.errOccured = false;
          this.gettingRefunds = false;
        },
        error: (_) => {
          this.errOccured = true;
          this.gettingRefunds = false;
        },
      });
  }

  setPagination(res: any): void {
    this.pagination.pageSize = res.data.pageSize;
    this.pagination.pageNumber = res.data.pageNumber;
    this.pagination.totalCount = res.data.totalCount;
    this.pagination.hasNextPage = res.data.hasNextPage;
    this.pagination.hasPreviousPage = res.data.hasPreviousPage;
    this.pagination.totalPages = res.data.totalPages;
    this.pagination.count = res.data.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  onOpenFilterModal() {
    $(".filter-menu").toggle();
  }

  onOpenDetailView(refund: CreditRefund) {
    this.selectedRefund = refund
    this.viewingRefundDetail = true;
    this.configService.isSidebarClosed$.next(true);
  }

  onCloseDetailView() {
    this.viewingRefundDetail = false;
    this.configService.isSidebarClosed$.next(false);
  }
}
