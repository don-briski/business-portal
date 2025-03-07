import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { pluck, takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { UserService } from "src/app/service/user.service";
import { WorkflowService } from "src/app/service/workflow.service";
import { Router } from "@angular/router";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { AppOwnerInformation, User } from "src/app/modules/shared/shared.types";
import { ConfigurationService } from "src/app/service/configuration.service";
import { Filter } from "src/app/model/filter";
import { SharedService } from "src/app/service/shared.service";
import Swal from "sweetalert2";

@Component({
  selector: "lnd-workflow-requests",
  templateUrl: "./workflow-requests.component.html",
  styleUrls: ["./workflow-requests.component.scss"],
})
export class WorkflowRequestsComponent implements OnInit, OnDestroy {
  private _unsubscriber$ = new Subject();

  isLoading: boolean = false;
  user: User;
  appOwner: AppOwnerInformation;
  currentTheme: ColorThemeInterface;
  pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    maxPage: Infinity,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    assetCode: null,
    jumpArray: [],
  };
  requests: any[];
  requestId: number;
  openAside: boolean = false;
  filterOptions: CustomDropDown[] = [
    { id: "Approved", text: "New" },
    { id: "Open", text: "Open" },
    { id: "Treated", text: "Closed" },
  ];
  filterModel: Filter;
  copy_hover = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true
  });

  constructor(
    private _userService: UserService,
    private _authService: AuthService,
    private _colorThemeService: ColorThemeService,
    private _workflowService: WorkflowService,
    private _router: Router,
    private configService: ConfigurationService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.fetchApprovedRequest();
    this._fetchUser();
    this.getAppOwnerInfo();
    this._loadTheme();
  }

  filterModalOpen() {
    $(".filter-menu").toggle();
  }

  selectedOption(event): void {
    this.filterModel.setData({
      filters: [[event]],
      filterTypes: ["status"],
      filterHeaders: ["Status"],
    });

    this.fetchApprovedRequest({ Filter: event.id });
  }

  private _setPagination(res: any): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.maxPage = res.totalPages;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = Array(this.pagination.maxPage);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  private _fetchUser(): void {
    this._userService
      .getUserInfo(this._authService.decodeToken().nameid)
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  getAppOwnerInfo() {
    this.configService
      .getAppOwnerInfo()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe({
        next: (res) => {
          this.appOwner = res.body;
        },
      });
  }

  private _loadTheme(): void {
    this._colorThemeService
      .getTheme()
      .pipe(takeUntil(this._unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  fetchApprovedRequest(extraParams?): void {
    this.isLoading = true;
    let parameters: any = {
      PageNumber: this.pagination.pageNumber,
      PageSize: this.pagination.pageSize,
    };

    if (extraParams) {
      parameters = { ...parameters, ...extraParams };
    }
    this._workflowService
      .getFinanceRequest(parameters)
      .pipe(pluck("body"), takeUntil(this._unsubscriber$))
      .subscribe((res) => {
        this.requests = res.items;
        this._setPagination(res);
        this.isLoading = false;
      });
  }

  toggleAside() {
    this.openAside = !this.openAside;
  }

  viewRequest(requestId: number,element?:HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.requestId = requestId;
        this.toggleAside();
      }
    });
  }

  navToJournal(event): void {
    const payload = { ...event, requestId: this.requestId };

    const queryParams = JSON.stringify(payload);
    this._router.navigate(["finance/journals/create"], {
      queryParams: { items: queryParams },
    });
  }

  onSelectedFiltersInit(filter: Filter) {
    this.filterModel = filter;
    this.filterModel.onChange(() => {
      this.fetchApprovedRequest();
    });
  }

 copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Request code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this._unsubscriber$.next();
    this._unsubscriber$.complete();
  }
}
