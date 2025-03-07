import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Pagination } from "src/app/model/Pagination";
import { User } from "src/app/modules/shared/shared.types";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { DepositService } from "src/app/service/deposit.service";
import { UserService } from "src/app/service/user.service";
import {
  DepositGroup,
  GetDepositGroupsResBody,
} from "../../models/deposit-account.model";

@Component({
  selector: "lnd-deposit-groups",
  templateUrl: "./deposit-groups.component.html",
  styleUrls: ["./deposit-groups.component.scss"],
})
export class DepositGroupsComponent implements OnInit, OnDestroy {
  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  user: User;

  fetching = false;
  groups: DepositGroup[] = [];
  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  searchParam = "";
  selectedGroup: DepositGroup;

  showAside = false;

  constructor(
    private colorThemeServ: ColorThemeService,
    private authService: AuthService,
    private userService: UserService,
    private depositService: DepositService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getUser();
    this.fetchGroups();
  }

  loadTheme(): void {
    this.colorThemeServ
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  fetchGroups() {
    this.fetching = true;
    this.depositService
      .getDepositGroups({
        pageNumber: this.pagination.pageNumber,
        pageSize: this.pagination.pageSize,
        keyword: this.searchParam,
      })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.groups = res.body.data.items;
          this.setPagination(res.body);
          this.fetching = false;
        },
        error: () => {
          this.fetching = false;
        },
      });
  }

  setPagination(res: GetDepositGroupsResBody): void {
    this.pagination.pageSize = res.data.pageSize;
    this.pagination.pageNumber = res.data.pageNumber;
    this.pagination.totalRecords = res.data.totalCount;
    this.pagination.hasNextPage = res.data.hasNextPage;
    this.pagination.hasPreviousPage = res.data.hasPreviousPage;
    this.pagination.totalPages = res.data.totalPages;
    this.pagination.count = res.data.items.length;

    this.pagination.jumpArray = Array(this.pagination.totalRecords);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
