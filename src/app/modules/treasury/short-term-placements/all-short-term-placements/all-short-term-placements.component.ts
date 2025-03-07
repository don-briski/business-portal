import { Component, OnDestroy, OnInit, TemplateRef } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { ShortTermPlacementService } from "src/app/service/shorttermplacement.service";
import { UserService } from "src/app/service/user.service";
import * as $ from "jquery";
import { ConfigurationService } from "src/app/service/configuration.service";
import { SharedService } from "src/app/service/shared.service";
import Swal from "sweetalert2";
import {
  GetShortTermPlacementsQueryParams,
  GetShortTermPlacementsResBody,
  STPTabsEnum,
  ShortTermPlacement,
} from "../../types/short-term-placement";
import {
  Pagination,
  SearchParams,
  User,
} from "src/app/modules/shared/shared.types";

@Component({
  selector: "lnd-all-short-term-placements",
  templateUrl: "./all-short-term-placements.component.html",
  styleUrls: ["./all-short-term-placements.component.scss"],
})
export class AllShortTermPlacementsComponent implements OnInit, OnDestroy {
  private subs$ = new Subject();

  tabsEnum = STPTabsEnum;
  user: User;
  isLoading: boolean = false;
  shortTermPlacements: ShortTermPlacement[] = [];
  shortTermPlacement: ShortTermPlacement;
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
  selectedSearchColumn = "";
  keyword = "";
  openAside: boolean = false;
  navIds: STPTabsEnum[] = [
    STPTabsEnum.pool,
    STPTabsEnum.active,
    STPTabsEnum.terminated,
    STPTabsEnum.liquidated,
  ];
  selectedTab: STPTabsEnum = STPTabsEnum.pool;
  selectedStatus: string[];
  ownerInformation: any;
  copy_hover = false;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });
  viewSTP = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private colorThemeService: ColorThemeService,
    private shortTermPlacementService: ShortTermPlacementService,
    private modalService: NgbModal,
    private configService: ConfigurationService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.fetchUser();
    this.loadTheme();
    this.getAppOwnerInfo();
    this.switchViews(STPTabsEnum.pool, ["Draft", "Redraft", "SentForApproval"]);
  }

  viewShortTermPlacement(stp: ShortTermPlacement, element?: HTMLElement): void {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.shortTermPlacement = stp;
        this.viewSTP = true;
      }
    });
  }

  toggleAside(state?: string) {
    if (state === "refresh") {
      this.switchViews(this.selectedTab, this.selectedStatus);
    }
    this.viewSTP = false;
    this.shortTermPlacement = null;
  }

  getAppOwnerInfo() {
    this.configService
      .spoolOwnerInfo()
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.ownerInformation = res.body;
      });
  }

  switchViews(tab?: STPTabsEnum, status?: string[]): void {
    this.pagination = {
      hasNextPage: false,
      hasPreviousPage: false,
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      count: 0,
      totalPages: 0,
      jumpArray: [],
    };

    this.selectedTab = tab;
    this.selectedStatus = status;
    this.navIds.forEach((nav) => {
      nav === this.selectedTab
        ? $("#nav-" + nav).addClass("active-tab")
        : $("#nav-" + nav).removeClass("active-tab");
    });

    this.getShortTermPlacements(this.selectedStatus);
  }

  onSearchParams(event: SearchParams) {
    this.selectedSearchColumn = event.selectedSearchColumn;
    this.keyword = event.keyword;
    this.getShortTermPlacements();
  }

  openModal(content: TemplateRef<any>, stp?: ShortTermPlacement): void {
    this.shortTermPlacement = stp;
    this.modalService.open(content, { size: "lg", centered: true });
  }

  closeModal(event?: string): void {
    this.shortTermPlacement = null;
    this.modalService.dismissAll();

    if (event === "refresh") {
      this.switchViews(STPTabsEnum.pool, [
        "Draft",
        "Redraft",
        "SentForApproval",
      ]);
    }
  }

  private fetchUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  private loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.subs$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getShortTermPlacements(status?: string[]): void {
    this.isLoading = true;
    let data: GetShortTermPlacementsQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      keyword: this.keyword,
      selectedSearchColumn: this.selectedSearchColumn,
    };

    if (status) {
      data.filter = status;
    }

    this.shortTermPlacementService
      .getShortTermPlacements(data)
      .pipe(takeUntil(this.subs$))
      .subscribe((res) => {
        this.shortTermPlacements = res.body?.items?.map((item) => ({
          ...item,
          parsedShortTermPlacementTypeInfo: JSON.parse(
            item.shortTermPlacementTypeInfo
          ),
        }));
        this.setPagination(res.body);
        this.isLoading = false;
      });
  }

  setPagination(res: GetShortTermPlacementsResBody): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  copyCode(text: string) {
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({
        title: "STP Investment code copied to clipboard",
        type: "success",
        timer: 3000,
      });
    }
  }

  ngOnDestroy(): void {
    this.subs$.next();
    this.subs$.complete();
  }
}
