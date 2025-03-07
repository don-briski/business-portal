import { Component, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ActivatedRoute } from "@angular/router";

import { WorkflowService } from "../../services/workflow.service";
import {
  ApprovingCategory,
  GetReqsQueryParams,
  GetReqsResBody,
  Pagination,
  WorkflowReqStatus,
  WorkflowRequest,
} from "../../workflow.types";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { User } from "src/app/modules/shared/shared.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Filter } from "src/app/model/filter";
import Swal from "sweetalert2";
import { SharedService } from "src/app/service/shared.service";

@Component({
  selector: "lnd-approval",
  templateUrl: "./approval.component.html",
  styleUrls: ["./approval.component.scss"],
})
export class ApprovalComponent implements OnInit {
  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  user: User;
  approvingCategory: ApprovingCategory;

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
  filter: WorkflowReqStatus = "Pending";

  currentTabId = "pending-approval";
  requestStatuses: CustomDropDown[] = [
    { text: "In Progress", id: "InProgress" },
    { text: "Redrafted", id: "Redrafted" },
    { text: "Approved", id: "Approved" },
    { text: "Declined", id: "Declined" },
  ];

  fetching = false;
  requests: WorkflowRequest[] = [];
  selectedReq?: WorkflowRequest;
  viewReq = false;
  filterModel: Filter;
  copy_hover = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true
  });

  constructor(
    private workflowService: WorkflowService,
    private colorThemeServ: ColorThemeService,
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.getRouteData();
    this.loadTheme();
    this.getUser();
    this.fetchRequests();
  }

  getRouteData() {
    this.approvingCategory = this.route.snapshot.data["category"];
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

  onSwitchTab(id: string) {
    switch (id) {
      case "pending-approval":
        this.filter = "Pending";
        break;
      case "reviewed":
        this.filter = "Reviewed";
        break;
    }

    this.fetchRequests({
      pageNumber: 1,
      pageSize: 10,
      keyword: this.searchParam,
      filter: this.filter,
      approvingCategory: this.approvingCategory,
    });
    this.currentTabId = id;
  }

  fetchPendingRequestsStats() {
    this.workflowService
      .getPendingRequestsStats()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.workflowService.pendingRequestsStats.next(res.body);
        },
      });
  }

  fetchRequests(
    data: GetReqsQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.searchParam,
      filter: this.filter,
      approvingCategory: this.approvingCategory,
    }
  ) {
    this.fetching = true;
    this.workflowService
      .getRequests(data, { forApproval: true })
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.requests = res.body.items;
          this.setPagination(res.body);
          if (data.requestStatus) {
            this.filterModel.setData({
              filters: [[{ id: data.requestStatus, text: data.requestStatus }]],
              filterHeaders: ["Status"],
              filterTypes: ["status"],
            });
          }
          this.fetching = false;
        },
        error: (_) => {
          this.fetching = false;
        },
      });
  }

  setPagination(res: GetReqsResBody): void {
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

  get reqsNotFoundMsg() {
    let msg = "";
    if (this.searchParam) msg = "No requests found for your search";
    else if (this.currentTabId === "pending-approval")
      msg = "No requests pending approval";
    else msg = "No reviewed requests";
    return msg;
  }

  onViewRequest(req: WorkflowRequest,element?:HTMLElement) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.selectedReq = req;
        this.viewReq = true;
      }
    });
  }

  onOpenFilterModal() {
    $(".filter-menu").toggle();
  }

  onOptionSelected(option: { id: string; text: string }) {
    this.fetchRequests({
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.searchParam,
      requestStatus: option.id as WorkflowReqStatus,
      filter: this.filter,
      approvingCategory: this.approvingCategory,
    });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;

    filter.onChange(() => {
      this.fetchRequests({
        pageNumber: this.pagination.pageNumber,
        pageSize: this.pagination.pageSize,
        keyword: this.searchParam,
        filter: this.filter,
      });
    });
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Request code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
