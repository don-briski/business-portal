import { Component, OnDestroy, OnInit } from "@angular/core";
import swal from "sweetalert2";
import { ParamMap, Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";

import { ColorThemeService } from "src/app/service/color-theme.service";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ItemFetchModel } from "../models/item.model";

import { AuthService } from "src/app/service/auth.service";
import { ItemService } from "src/app/service/item.service";
import { UserService } from "src/app/service/user.service";
import { ConfigurationService } from "src/app/service/configuration.service";
import { SharedService } from "src/app/service/shared.service";
import Swal from "sweetalert2";

@Component({
  selector: "app-items",
  templateUrl: "./items.component.html",
  styleUrls: ["./items.component.scss"],
})
export class ItemsComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  items: any[] = [];
  item: any;
  itemFiles: any[] = [];
  itemActivities: any[] = [];

  itemFetchModel: ItemFetchModel = {
    pageNumber: 1,
    pageSize: 10,
    itemType: null,
    searchTerm: "",
  };
  itemPagination: any = {
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

  openAside: boolean = false;

  loggedInUser: any;
  user: any;
  currentTheme: ColorThemeInterface;

  itemsRequestLoader: boolean = false;
  activitiesLoader: boolean = false;
  filesLoader: boolean = false;
  itemLoader: boolean = false;
  ownerInformation: any;
  copy_hover = false;
  currencySymbol: string;

  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
  });

  constructor(
    private authService: AuthService,
    private itemService: ItemService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private colorThemeService: ColorThemeService,
    private configService: ConfigurationService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.getCurrencySymbol();
    this.loggedInUser = this.authService.decodeToken();
    if (!this.loggedInUser || this.loggedInUser.nameid == null) {
      this.router.navigateByUrl("/account/login");
      swal.fire("Error", "Please log in", "error");
    }

    this.loadTheme();
    this.getApplicationownerinformation();
    this.fetchItems(1);
    this.fetchUser();
    this.route.paramMap
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe((params: ParamMap) => {
      const itemId = params.get("id");
      if (!this.isNullOrEmpty(itemId)) {
        this.viewItemById(itemId);
      }
    });
  }

  getCurrencySymbol() {
    this.currencySymbol = this.configService.currencySymbol;
    if (!this.currencySymbol) {
      this.configService
        .getCurrencySymbol()
        .pipe(takeUntil(this.unsubscriber$))
        .subscribe({
          next: (res) => {
            this.currencySymbol = res.body.currencySymbol;
          },
        });
    }
  }

  private loadTheme() {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res: ColorThemeInterface) => {
        this.currentTheme = res;
      });
  }

  getApplicationownerinformation() {
    this.configService.spoolOwnerInfo()
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe((response) => {
      this.ownerInformation = response.body;
    });
  }

  fetchItems(pageNum = null) {
    this.itemsRequestLoader = true;
    this.items = [];

    if (pageNum != null) {
      this.itemPagination.pageNumber = pageNum;
      if (pageNum < 1) {
        this.itemPagination.pageNumber = 1;
      }
      if (pageNum > this.itemPagination.maxPage) {
        this.itemPagination.pageNumber = this.itemPagination.maxPage || 1;
      }
      this.itemFetchModel.pageNumber = this.itemPagination.pageNumber;
    }
    this.itemFetchModel.pageSize = Number(this.itemPagination.pageSize);

    this.itemService.getItems(this.itemFetchModel)
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe(
      (response) => {
        this.items = response.body.items;

        this.itemPagination.maxPage = response.body.totalPages;
        this.itemPagination.hasNextPage = response.body.hasNextPage;
        this.itemPagination.hasPreviousPage = response.body.hasPreviousPage;
        this.itemPagination.totalRecords = response.body.totalCount;
        this.itemPagination.count = this.items.length;
        this.itemPagination.jumpArray = Array(this.itemPagination.maxPage);
        for (let i = 0; i < this.itemPagination.jumpArray.length; i++) {
          this.itemPagination.jumpArray[i] = i + 1;
        }
        this.itemsRequestLoader = false;
      },
      (error) => {
        this.itemsRequestLoader = false;
      }
    );
  }

  viewItemById(itemId) {
    this.itemLoader = true;
    this.itemService.getItemById(itemId)
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe(
      (res) => {
        this.item = res.body;

        this.fetchItemActivities(this.item.itemId);
        this.toggleAside();
        this.itemLoader = false;
      },
      (err) => {
        this.itemLoader = false;
      }
    );
  }

  viewItem(item,element?:HTMLElement) {
    setTimeout(() => {
      const index = element?.className.split(" ").length - 1;
      if (element?.className.split(" ")[index] !== "show" && !this.copy_hover) {
        this.item = item;
        this.itemActivities = [];
        this.itemFiles = [];
        this.viewItemById(item.itemId);
      }
    });
  }

  fetchItemActivities(itemId) {
    if (itemId == null || itemId == undefined) return;

    this.activitiesLoader = true;
    this.itemService.getActivities(itemId)
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe(
      (res) => {
        this.activitiesLoader = false;
        this.itemActivities = res.body;
      },
      (err) => {
        this.activitiesLoader = false;
        // swal.fire("Error", err.error, "error");
      }
    );
  }

  fetchItemFiles(): void {}
  openLink(link) {
    window.open(link, "_blank");
  }

  toggleAside() {
    this.openAside = !this.openAside;
  }

  itemPaginatedJumpModal() {
    $(".itemPaginatedJumpModal").toggle();
  }

  isNullOrEmpty(str: string) {
    return str == null || str.trim() == "";
  }

  private fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe(
        (res) => {
          this.user = res.body;
          $(document).ready(() => {
            $.getScript("assets/js/sidebar.js");
          });
        },
        (err) => {}
      );
  }

  copyCode(text:string){
    if (this.sharedService.copyToClipboard(text)) {
      this.toast.fire({title:"Item code copied to clipboard",type:'success',timer:3000})
    }
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
