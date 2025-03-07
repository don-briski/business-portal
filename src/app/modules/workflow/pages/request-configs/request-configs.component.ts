import { Component, OnInit } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { WorkflowService } from "../../services/workflow.service";
import {
  GetReqConfigsQueryParams,
  GetReqConfigsResBody,
  Pagination,
  ReqConfig,
} from "../../workflow.types";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { User } from "src/app/modules/shared/shared.types";
import { Filter } from "src/app/model/filter";

@Component({
  selector: "lnd-request-configs",
  templateUrl: "./request-configs.component.html",
  styleUrls: ["./request-configs.component.scss"],
})
export class RequestConfigsComponent implements OnInit {
  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  user: User;

  reqConfigs: ReqConfig[] = [];
  selectedReqConfig: ReqConfig;
  fetching = false;
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
  searchParam = "";
  filterOptions = ["Active", "Inactive"];
  selectedFilter?: string;
  isViewing = false;
  filterModel: Filter;

  constructor(
    private modalService: NgbModal,
    private colorThemeServ: ColorThemeService,
    private workflowService: WorkflowService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getUser();
    this.fetchReqConfigs();
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

  fetchReqConfigs() {
    const data: GetReqConfigsQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.searchParam,
    };

    if (this.selectedFilter === "Active") {
      data.filter = String(true);
    } else if (this.selectedFilter === "Inactive") {
      data.filter = String(false);
    }

    this.fetching = true;
    this.workflowService
      .getRequestConfigs(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.reqConfigs = res.body.items;
          this.setPagination(res.body);
          this.fetching = false;
          if (this.selectedFilter) {
            this.filterModel.setData({
              filters: [
                [{ id: this.selectedFilter, text: this.selectedFilter }],
              ],
              filterHeaders: ["Status"],
              filterTypes: ["status"],
            });
          }
        },
        error: () => {
          this.fetching = false;
        },
      });
  }

  setPagination(res: GetReqConfigsResBody): void {
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

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  onSelectReqConfig(rc: ReqConfig) {
    this.selectedReqConfig = rc;
  }

  onOpenModal(view: any, size: "md" | "lg" = "lg", centered = true) {
    this.modalService.open(view, { size, centered });
  }

  onCloseModal(): void {
    this.selectedReqConfig = null;
    this.modalService.dismissAll();
  }

  onOpenFilterModal() {
    $(".filter-menu").toggle();
  }

  onOptionSelected(option: string) {
    this.selectedFilter = option;
    this.fetchReqConfigs();
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;

    filter.onChange(() => {
      this.selectedFilter = null;
      this.fetchReqConfigs();
    });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
