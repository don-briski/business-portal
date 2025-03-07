import { Component, OnInit, TemplateRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { WorkflowService } from "../../services/workflow.service";
import {
  GetReqsQueryParams,
  GetReqsResBody,
  Pagination,
  WorkflowReqStatus,
  WorkflowRequest,
} from "../../workflow.types";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { User } from "src/app/modules/shared/shared.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";
import Swal from "sweetalert2";

@Component({
  selector: "lnd-requests",
  templateUrl: "./requests.component.html",
  styleUrls: ["./requests.component.scss"],
})
export class RequestsComponent implements OnInit {
  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  user: User;

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
  filter: WorkflowReqStatus = "Open";

  currentTabId = "open";

  fetching = false;
  requests: WorkflowRequest[] = [];
  selectedReq?: WorkflowRequest;
  viewReq = false;
  duplicateReq = false;
  filterOptions: CustomDropDown[] = [
    { text: "In Progress", id: "InProgress" },
    { text: "Redrafted", id: "Redrafted" },
  ];
  filterModel: Filter;
  copy_hover = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true
  });

  constructor(
    private modalService: NgbModal,
    private colorThemeServ: ColorThemeService,
    private workflowService: WorkflowService,
    private authService: AuthService,
    private userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.fetchRequests();
    this.getUser();
    this.listenForRequestsChange();
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
      case "open":
        this.filter = "Open";
        this.filterOptions = [
          { text: "In Progress", id: "InProgress" },
          { text: "Redrafted", id: "Redrafted" },
        ];
        break;
      case "closed":
        this.filter = "Closed";

        this.filterOptions = [
          { text: "Approved", id: "Approved" },
          { text: "Declined", id: "Declined" },
        ];
        break;
    }

    this.fetchRequests({
      pageNumber: 1,
      pageSize: 10,
      keyword: this.searchParam,
      filter: this.filter,
    });
    this.currentTabId = id;
  }

  fetchRequests(
    data: GetReqsQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.searchParam,
      filter: this.filter,
    }
  ) {
    this.fetching = true;
    this.workflowService
      .getRequests(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.requests = res.body.items;
          this.setPagination(res.body);

          if (
            data.filter &&
            data.filter !== "Open" &&
            data.filter !== "Closed"
          ) {
            this.filterModel.setData({
              filters: [[{ id: data.filter, text: data.filter }]],
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

  listenForRequestsChange() {
    this.workflowService.requestsChanged.pipe(takeUntil(this.subs$)).subscribe({
      next: () => {
        this.fetchRequests();
        this.fetchPendingRequestsStats();
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
    else if (this.currentTabId === "all-request") msg = "No requests found";
    else if (this.currentTabId === "pending-approval")
      msg = "No requests pending approval";
    else msg = "No approved requests";
    return msg;
  }

  onCreateRequest(view: any): void {
    this.modalService.open(view, { size: "md", centered: true });
  }

  onViewReq(req: WorkflowRequest,element?:HTMLElement) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.selectedReq = req;
        this.viewReq = true;
      }
    });
  }

  onRedraftReq(
    customReqRedraftView: TemplateRef<any>,
    paymentsReqRedraftView: TemplateRef<any>,
    req: WorkflowRequest,
    duplicate = false
  ) {
    this.selectedReq = req;
    let view: TemplateRef<any>;
    this.duplicateReq = duplicate;

    if (req.requestType === "Custom") {
      view = customReqRedraftView;
    } else {
      view = paymentsReqRedraftView;
    }
    this.modalService.open(view, {
      size: "lg",
      centered: true,
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
      filter: option.id as WorkflowReqStatus,
    });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;

    filter.onChange(() => {
      this.fetchRequests({
        pageNumber: this.pagination.pageNumber,
        pageSize: this.pagination.pageSize,
        keyword: this.searchParam,
      });
    });
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
