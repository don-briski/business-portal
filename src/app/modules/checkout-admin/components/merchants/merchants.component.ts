import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { CustomDropDown, PillFilters } from "src/app/model/CustomDropdown";
import Swal from "sweetalert2";

import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import {
  GetDataQueryParams,
  Pagination,
  SearchParams,
  TableConfig,
  TableData,
  TableHeader,
  User,
} from "src/app/modules/shared/shared.types";
import { AuthService } from "src/app/service/auth.service";
import { ColorThemeService } from "src/app/service/color-theme.service";
import { UserService } from "src/app/service/user.service";
import { Merchant, GetMerchantsResBody } from "../../types/merchant";
import { Router } from "@angular/router";
import { CheckoutAdminService } from "../../checkout-admin.service";
import { SharedService } from "src/app/service/shared.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "lnd-merchants",
  templateUrl: "./merchants.component.html",
  styleUrls: ["./merchants.component.scss"],
})
export class MerchantsComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  @ViewChild("merchantStaffInvite") merchantStaffInvite: TemplateRef<any>;

  user: User;
  colorTheme: ColorThemeInterface;

  isLoading = false;
  tableConfig: TableConfig = {
    searchPlaceholder: "Name",
    uniqueIdPropLink: "name",
    striped: true,
  };
  tableHeaders: TableHeader[] = [
    { name: "Name" },
    { name: "Email" },
    { name: "Phone Number" },
    { name: "No of Applications", centered: true },
    { name: "Status" },
    { name: "" },
  ];
  tableData: TableData[] = [];
  filterStatuses: CustomDropDown[] = [
    { id: "Active", text: "Active" },
    { id: "Inactive", text: "Inactive" },
  ];
  selectedFilters: CustomDropDown;
  filter: string;
  merchants: Merchant[] = [];
  pagination: Pagination = {
    hasNextPage: false,
    hasPreviousPage: false,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    count: 0,
    totalPages: 0,
    jumpArray: [],
    searchColumns: [],
  };
  selectedSearchColumn: string;
  keyword: string;
  merchantData: {
    merchantId: number;
    merchantName: string;
  };
  public toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly colorThemeService: ColorThemeService,
    private readonly checkoutAdminService: CheckoutAdminService,
    private readonly sharedService: SharedService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadTheme();
    this.getUser();
    this.getMerchants();
    this.onFiltersChange();
  }

  loadTheme(): void {
    this.colorThemeService
      .getTheme()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((theme) => {
        this.colorTheme = theme;
      });
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  setTableData() {
    this.tableData = this.merchants.map((merchant) => ({
      name: { tdValue: merchant.name, id: merchant.id },
      email: { tdValue: merchant.email },
      phoneNumber: { tdValue: merchant.phoneNumber },
      noOfApps: { tdValue: merchant.successfulApplications, centered: true },
      isActive: {
        tdValue: merchant?.status,
        type: "status",
        statusConfig: {
          class: this.getStatusClass(merchant.status === "Active"),
        },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(merchant),
      },
    }));
  }

  getStatusClass(isActive: boolean): string {
    if (isActive) {
      return "badge-success";
    } else {
      return "badge-danger";
    }
  }

  getActionConfig(merchant: Merchant) {
    return [
      {
        showBtn: this.user.permission.includes("View Merchants"),
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () =>
          this.router.navigateByUrl(
            "/checkout-admin/config/merchants/" + merchant?.id
          ),
      },
      {
        showBtn: this.user.permission.includes("Edit Merchant"),
        iconClass: "icon-edit",
        btnText: "Edit",
        funcRef: () =>
          this.router.navigateByUrl(
            `/checkout-admin/config/merchants/${merchant?.id}/edit`
          ),
      },
      {
        showBtn: this.user.permission.includes("Delete Merchant"),
        iconClass: "icon-trash",
        btnText: "Delete",
        funcRef: () => this.comfirmDeletion(merchant.id),
      },
      {
        showBtn: this.user.permission.includes("Create Merchant Staff"),
        iconClass: "icon-add-circle",
        btnText: "Add Staff",
        funcRef: () => this.onAddStaff(merchant),
      },
    ];
  }

  onAddStaff(merchant: Merchant) {
    this.merchantData = {
      merchantId: merchant.id,
      merchantName: merchant.name,
    };

    this.modalService.open(this.merchantStaffInvite, {
      size: "sm",
      centered: true,
    });
  }

  getMerchants() {
    const data: GetDataQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };
    if (this.keyword) {
      data.keyword = this.keyword;
    }
    if (this.selectedSearchColumn) {
      data.selectedSearchColumn = this.selectedSearchColumn;
    }
    if (this.filter) {
      data.filter = this.filter;
    }

    this.isLoading = true;
    this.checkoutAdminService
      .fetchMerchants(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.merchants = res.body.items;
          this.setPagination(res.body);
          this.setTableData();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  setPagination(res: GetMerchantsResBody): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  onPaginationChange(data: { pageSize: number; pageNumber: number }) {
    this.pagination.pageNumber = data.pageNumber;
    this.pagination.pageSize = data.pageSize;
    this.getMerchants();
  }

  viewMerchant(id: number) {
    this.router.navigateByUrl("/checkout-admin/config/merchants/" + id);
  }

  onSearchParams(data: SearchParams) {
    this.keyword = data.keyword;
    this.selectedSearchColumn = data.selectedSearchColumn;
    this.getMerchants();
  }

  onFilter(data: CustomDropDown) {
    this.filter = String(data.id);
    this.selectedFilters = data;
    this.setSelectedFilters();
    this.getMerchants();
  }

  setSelectedFilters() {
    this.sharedService.selectedFilters$.next({
      filters: [[{ ...this.selectedFilters, type: "status" }]],
      action: "add",
      headers: ["Statuses"],
    });
  }

  onFiltersChange() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters: PillFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          this.filter = null;
          this.getMerchants();
        }
      });
  }

  comfirmDeletion(id: number) {
    Swal.fire({
      type: "warning",
      title: "Delete Merchant?",
      text: "Are you sure you want to delete this merchant?",
      showCancelButton: true,
      cancelButtonColor: "#B85353",
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Delete it",
      confirmButtonColor: "#558E90",
    }).then((result) => {
      if (result.value) {
        this.deleteMerchant(id);
      }
    });
  }

  deleteMerchant(id: number) {
    this.isLoading = true;
    this.checkoutAdminService
      .deleteMerchant(id)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.toast.fire({
            type: "success",
            title: "Merchant deleted successfully",
          });
          this.getMerchants();
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
