import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { WorkflowService } from "../../services/workflow.service";
import {
  GetWorkflowReportsQueryParams,
  Pagination,
  WorkflowReport,
  WorkflowReportsData,
  WorkflowReqStatus,
} from "../../workflow.types";
import { Filter } from "src/app/model/filter";

@Component({
  selector: "lnd-workflow-reports",
  templateUrl: "./workflow-reports.component.html",
  styleUrls: ["./workflow-reports.component.scss"],
})
export class WorkflowReportsComponent implements OnInit, OnDestroy {
  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;

  reports: WorkflowReport[] = [];
  fetching = false;

  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 100,
    totalCount: 0,
    totalPages: 0,
    count: 0,
    jumpArray: [],
  };
  keyword = "";
  selectedFilter: CustomDropDown = { id: "", text: "" };
  filterStatuses: CustomDropDown[] = [
    { text: "In Progress", id: "InProgress" },
    { text: "Redrafted", id: "Redrafted" },
    { text: "Approved", id: "Approved" },
    { text: "Declined", id: "Declined" },
  ];
  startDate?: string;
  endDate?: string;
  filterModel: Filter;

  constructor(
    private workflowService: WorkflowService,
    private colorThemeServ: ColorThemeService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.fetchReports();
  }

  loadTheme(): void {
    this.colorThemeServ
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  fetchReports(
    data: GetWorkflowReportsQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.keyword,
      filter: this.selectedFilter.id as WorkflowReqStatus,
    }
  ) {
    this.fetching = true;
    if (this.startDate) data.startDate = this.startDate;
    if (this.endDate) data.endDate = this.endDate;

    this.workflowService
      .getReports(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.reports = res.body.items;
          this.setPagination(res.body);
          if (data.filter) {
            this.filterModel.setData({
              filters: [[{ id: data.filter, text: data.filter }]],
              filterHeaders: ["Status"],
              filterTypes: ["status"],
            });
          }
          this.fetching = false;
        },
        error: () => {
          this.fetching = false;
        },
      });
  }

  setPagination(res: WorkflowReportsData): void {
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

  onToggleFilterModal(): void {
    $(".filter-menu").toggle();
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    filter.onChange(() => {
      this.selectedFilter = null;
      this.fetchReports({
        pageNumber: this.pagination.pageNumber,
        pageSize: this.pagination.pageSize,
        keyword: this.keyword,
      });
    });
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
