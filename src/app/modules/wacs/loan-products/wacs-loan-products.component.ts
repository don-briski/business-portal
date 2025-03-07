import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
} from "../../shared/shared.types";
import { Subject } from "rxjs";
import { WacsService } from "../services/wacs.service";
import { takeUntil } from "rxjs/operators";
import {
  ActivateOrDeactivateLoanProduct,
  LoanProduct,
  LoanProductStatus,
} from "../types/loan-products";
import {
  removeNullUndefinedWithReduce,
  toNGNFormat,
} from "../../shared/helpers/generic.helpers";
import { Router } from "@angular/router";
import Swal from "sweetalert2";
import { CustomDropDown, PillFilters } from "src/app/model/CustomDropdown";
import { SharedService } from "src/app/service/shared.service";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";

@Component({
  selector: "lnd-loan-products",
  templateUrl: "./wacs-loan-products.component.html",
  styleUrls: ["./wacs-loan-products.component.scss"],
})
export class WacsLoanProductsComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject();
  isLoading = false;
  config: TableConfig = {
    uniqueIdPropLink: "code",
  };
  headers: TableHeader[] = [
    { name: "Code", type: "code" },
    { name: "Parent Product" },
    { name: "Product Name" },
    { name: "Loan Range", type: "amount" },
    { name: "Interest", alignment: "center", type:"percent" },
    { name: "Date Created" },
    { name: "Status" },
    { name: "Action" },
  ];
  data: TableData[] = [];
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
  loanProducts: LoanProduct[] = [];
  currencySymbol: string;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  filterStatuses:CustomDropDown[] = [
    { id: "Active", text: "Active" },
    { id: "NonActive", text: "Inactive" }
  ];
  selectedFilter: CustomDropDown;
  permissions:string[] = [];

  constructor(private wacsService: WacsService, private router: Router, private sharedService:SharedService, private userService:UserService, private authService:AuthService) {}

  ngOnInit(): void {
    this.getLoanProducts();
    this.removePill();
    this.fetchUser()
  }

  getLoanProducts(paginationChange?: TablePaginationChange) {
    this.isLoading = true;
    const payload = removeNullUndefinedWithReduce({
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
      ...paginationChange,
    });
    if (paginationChange?.filter) {
      this.sharedService.selectedFilters$.next({
        filters: [[{ ...this.selectedFilter, type: "status" }]],
        action: "add",
        headers: ["Statuses"],
      });
    }
    this.wacsService
      .getLoanProducts(payload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (response) => {
          this.loanProducts = response.body.items;
          this.setTableData();
          this.setPagination(response.body);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private setTableData() {
    this.data = this.loanProducts.map((loanProduct) => ({
      code: {
        tdValue: loanProduct?.productCode,
        type: "code",
        id: loanProduct.id,
      },
      loanType: { tdValue: loanProduct?.loanTypeName },
      productName: { tdValue: loanProduct?.productName },
      range: {
        tdValue: `${toNGNFormat(loanProduct?.amountFrom)} - ${toNGNFormat(
          loanProduct?.amountTo
        )}`,
        alignment: "right",
      },
      interest: { tdValue: loanProduct?.interestRate, alignment: "center" },
      date: { tdValue: loanProduct?.createdAt, type: "date" },
      status: {
        tdValue: loanProduct?.status === "NonActive" ? 'Inactive' : loanProduct?.status ,
        type: "status",
        statusConfig: {
          class: this.getStatusClass(loanProduct?.status),
        },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(
          loanProduct?.id,
          loanProduct?.status
        ),
      },
    }));
  }

  private setPagination(res): void {
    this.pagination.pageSize = res.pageSize;
    this.pagination.pageNumber = res.pageNumber;
    this.pagination.totalCount = res.totalCount;
    this.pagination.hasNextPage = res.hasNextPage;
    this.pagination.hasPreviousPage = res.hasPreviousPage;
    this.pagination.totalPages = res.totalPages;
    this.pagination.count = res.items.length;
    this.pagination.searchColumns = res.searchColumns;

    this.pagination.jumpArray = Array(this.pagination.totalPages);
    for (let i = 0; i < this.pagination.jumpArray.length; i++) {
      this.pagination.jumpArray[i] = i + 1;
    }
  }

  private getStatusClass(status: string): string {
    if (status === "Active") {
      return "badge-success";
    } else {
      return "badge-warning";
    }
  }

  private getActionConfig(id: number, status: LoanProductStatus) {
    return [
      {
        showBtn: true,
        iconClass: "icon-forward",
        btnText: "View",
        funcRef: () => this.viewLoanType(id),
      },
      // {
      //   showBtn: this.permissions.includes("Update Wacs Loan Types"),
      //   iconClass: "icon-edit",
      //   btnText: "Edit",
      //   funcRef: () =>
      //     this.router.navigateByUrl(`/wacs/loan-products/edit/${id}`),
      // },
      {
        showBtn: true,
        iconClass: status === "Active" ? "icon-close" : "icon-check",
        btnText: status === "Active" ? "Deactivate" : "Activate",
        funcRef: () => this.activateOrDeactivate(id, status),
      },
    ];
  }

  viewLoanType(id: number) {
    this.router.navigateByUrl(`/wacs/loan-products/${id}`);
  }

  activateOrDeactivate(id: number, value: LoanProductStatus) {
    const status =
      value === "Active"
        ? LoanProductStatus.NonActive
        : LoanProductStatus.Active;
    const payload: ActivateOrDeactivateLoanProduct = {
      wacsLoanProductId: id,
      status,
    };

    if (status === LoanProductStatus.NonActive) {
      Swal.fire({
        title:"Are you sure you want to deactivate this loan product?",
        text:"This loan product will no longer be visible on the WACS platform if deactivated",
        type:"warning",
        showCancelButton:true,
        cancelButtonText:"Cancel",
        showConfirmButton:true,
        confirmButtonText:"Yes, Proceed",
        reverseButtons:true
      }).then((res) => {
        if (res.value) {
          this.updateStatus(status,payload)
        }
      })
    } else {
      this.updateStatus(status,payload)
    }
  }

  updateStatus(status:LoanProductStatus,payload){
    this.isLoading = true;

    this.wacsService
    .activateOrDeactivateLoanProduct(payload)
    .pipe(takeUntil(this.unsubscriber$))
    .subscribe({
      next: () => {
        this.toast.fire({
          type: "success",
          title: `Loan Product ${status === LoanProductStatus.Active ? 'Activated' : 'Deactivated'} Successfully`,
        });
        this.getLoanProducts()
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  filter(event:CustomDropDown[]){
    if (event) {
      const filter = event[0]?.id as string;
      const payload:TablePaginationChange = {pageNumber:this.pagination.pageNumber,pageSize:this.pagination.pageSize,filter}
      this.selectedFilter = event[0];
      this.getLoanProducts(payload)
    }
  }

  private removePill() {
    this.sharedService.selectedFilters$
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((selectedFilters: PillFilters) => {
        if (selectedFilters.filters[0].length === 0) {
          this.selectedFilter = null;
          this.getLoanProducts();
        }
      });
  }

  private fetchUser() {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe((res) => {
        this.permissions = res.body?.permission;
      });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
