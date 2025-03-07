import { Component, OnInit, TemplateRef, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { InvestmentService } from "src/app/service/investment.service";
import { UserService } from "src/app/service/user.service";
import {
  AppOwnerInformation,
  Pagination,
  User,
} from "../../shared/shared.types";
import {
  GetLiquidationReqsQueryParams,
  GetLiquidationReqsResBody,
  LiquidationReq,
  LiquidationReqStatus,
} from "../types/investment-liquidation-request";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";
import Swal from "sweetalert2";

@Component({
  selector: "lnd-investment-liquidation-requests",
  templateUrl: "./investment-liquidation-requests.component.html",
  styleUrls: ["./investment-liquidation-requests.component.scss"],
})
export class InvestmentLiquidationRequestsComponent
  implements OnInit, OnDestroy
{
  subs$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  user: User;
  appOwner: AppOwnerInformation;
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
  isLoading = false;
  requests: LiquidationReq[] = [];
  selectedRequest: LiquidationReq;
  keyword = "";
  filter: LiquidationReqStatus = "";
  viewRequest = false;
  noDataMessage = "";
  filterOptions: CustomDropDown[] = [
    { text: "Approved", id: "Approved" },
    { text: "Rejected", id: "Rejected" },
  ];

  currentTabId: "Open" | "Closed" = "Open";
  filterModel: Filter;
  copy_hover = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true
  });

  constructor(
    private colorThemeServ: ColorThemeService,
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigurationService,
    private investmentService: InvestmentService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getUser();
    this.getAppOwnerInfo();
    this.onSwitchTab("Open");
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange((data) => {
      if (!data || !data.status) {
        this.filter = this.currentTabId
        this.filterModel.clearData()
      }
      this.onSwitchTab(this.currentTabId)
    });
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

  getAppOwnerInfo() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          this.appOwner = res.body;
        },
      });
  }

  get approvalStatus() {
    const status = this.selectedRequest.investmentLiquidationRequestStatus;
    if (status === "SentForApproval") {
      return "Awaiting Approval";
    }
    return status;
  }

  viewLiqRequest(request,element?){
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.selectedRequest = request;
        this.viewRequest = true;
      }
    });
  }

  onSwitchTab(tabId: "Open" | "Closed") {
    let filter;
    if (tabId === "Open") {
      this.currentTabId = tabId;
      filter = "SentForApproval";
      this.noDataMessage = "No liquidation request(s) pending approval.";
    } else if (tabId === "Closed") {
      this.currentTabId = tabId;
      filter = "Closed";
      this.noDataMessage = "No approved/rejected request(s).";
    }


    this.fetchRequests({
      pageNumber: 1,
      pageSize: 10,
      filter: this.filter || filter,
      keyword: this.keyword,
    });
  }

  fetchRequests(
    data: GetLiquidationReqsQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      filter: this.filter || this.currentTabId,
      keyword: this.keyword,
    }
  ) {
    this.isLoading = true;
    this.investmentService
      .getLiquidationRequests(data)
      .pipe(takeUntil(this.subs$))
      .subscribe({
        next: (res) => {
          if (this.filter !== "" && this.filter !== 'Open' && this.filter !== 'Closed') {
            this.filterModel.setData({
              filters: [[{id:this.filter,text:this.filter}]],
              filterTypes: ["status"],
              filterHeaders: ["Status"],
            });
          }
          this.requests = res.body.items;
          this.setPagination(res.body);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  setPagination(res: GetLiquidationReqsResBody): void {
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

  onOpenFilterModal() {
    $(".filter-menu").toggle();
  }

  onOptionSelected(option: { id: string; text: string }) {
    this.filter = option.id as LiquidationReqStatus;
    this.fetchRequests({
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.keyword,
      filter: option.id as LiquidationReqStatus,
    });
  }

  onReviewedRequest(tabName: "Open" | "Closed") {
    this.viewRequest = false;
    this.onSwitchTab(tabName);
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Investment code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
