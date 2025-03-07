import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";
import Swal from "sweetalert2";

import { CustomDropDown } from "src/app/model/CustomDropdown";
import {
  TableHeader,
  TableData,
  SearchParams,
  TableConfig,
  Pagination,
  ComplexFilter,
  ComplexFiltersChange,
  User,
} from "src/app/modules/shared/shared.types";
import {
  GetMerchantCommissionsQueryParams,
  GetMerchantCommissionsResBody,
  LimitedMerchantData,
  MerchantCommission,
} from "../../types/merchant";
import { CheckoutAdminService } from "../../checkout-admin.service";
import { AuthService } from "src/app/service/auth.service";
import { UserService } from "src/app/service/user.service";
import { CustomDatePipePipe } from "src/app/util/custom-pipes/custom-date-pipe.pipe";
import { HttpResponse } from "@angular/common/http";

@Component({
  selector: "lnd-merchant-commissions",
  templateUrl: "./merchant-commissions.component.html",
  styleUrls: ["./merchant-commissions.component.scss"],
})
export class MerchantCommissionsComponent implements OnInit, OnDestroy {
  unsubscriber$ = new Subject<void>();

  user: User;
  selectedMonth: CustomDropDown;
  isLoading = true;
  merchants: LimitedMerchantData[] = [];
  commissions: MerchantCommission[] = [];
  tableConfig: TableConfig = {
    searchPlaceholder: "Name",
    uniqueIdPropLink: "name",
    striped: true,
  };
  tableHeaders: TableHeader[] = [
    { name: "Code", type: "code" },
    { name: "Invoice Date" },
    { name: "Merchant" },
    { name: "Amount Due", type: "amount" },
    { name: "Payment Date" },
    { name: "Status" },
    { name: "Action" },
  ];
  filters: ComplexFilter[] = [];
  tableData: TableData[] = [];
  selectedFilters: CustomDropDown;
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
  filter: string;
  selectedMerchantId: string;
  toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: true,
    timer: 3000,
  });
  downloading: boolean = false;

  constructor(
    private readonly checkoutAdminService: CheckoutAdminService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.getAllMerchants();
    this.getDateFilters();
    this.getUser();
  }

  getUser(): void {
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe((res) => {
        this.user = res.body;
      });
  }

  getAllMerchants() {
    this.checkoutAdminService
      .fetchAllMerchants()
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.merchants = res.body.data;
          this.filters.push({
            id: "merchant",
            data: this.merchants.map((item) => ({
              id: item.merchantId,
              text: item.merchantName,
            })),
            label: "Merchants",
            placeholder: "Select Merchant",
          });

          this.getCommissions();
        },
      });
  }

  getDateFilters() {
    const data: CustomDropDown[] = [];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    for (let i = 0; i < 12; i++) {
      data.push({
        id: i + 1,
        text: months[i],
      });
    }

    this.filters.push({
      id: "month",
      data,
      label: "Month",
      placeholder: "Select Month",
    });
  }

  getCommissions() {
    const data: GetMerchantCommissionsQueryParams = {
      pageNumber: this.pagination.pageNumber,
      pageSize: this.pagination.pageSize,
    };

    if (this.selectedMerchantId) {
      data.merchantId = this.selectedMerchantId;
    }

    if (this.selectedMonth) {
      data.month = +this.selectedMonth.id;
    }

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
      .fetchMerchantCommissions(data)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.commissions = res.body.items;
          this.setPagination(res.body);
          this.setTableData();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  settleUnpaidInvoice(invoiceId: number) {
    this.isLoading = true;
    this.checkoutAdminService
      .settleUnpaidInvoice(invoiceId)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: () => {
          this.toast.fire({
            type: "success",
            title: "Invoice settled successfully!",
          });
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  setPagination(res: GetMerchantCommissionsResBody): void {
    this.pagination = res;
    this.pagination.count = res.items.length;

    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  setTableData() {
    this.tableData = this.commissions.map((com) => ({
      code: { tdValue: com.code, type: "code" },
      invoiceDate: { tdValue: com.periodStartDate, type: "date", id: com.id },
      merchant: { tdValue: com.merchant },
      amountDue: { tdValue: com.totalCommissionsAmount, type: "amount" },
      paymentDate: { tdValue: com.paymentDate, type: "date" },
      status: {
        tdValue: com.status.toLocaleLowerCase() === 'settled' ? 'Paid' : 'Unpaid',
        type: "status",
        statusConfig: {
          class: this.getStatusClass(com.status === "Settled"),
        },
      },
      action: {
        tdValue: null,
        type: "action",
        actionConfig: this.getActionConfig(com),
      }
    }));
  }

  getStatusClass(isActive: boolean): string {
    if (isActive) {
      return "badge-success";
    } else {
      return 'badge-danger';
    }
  }

  onPaginationChange(data: { pageSize: number; pageNumber: number }) {
    this.pagination.pageNumber = data.pageNumber;
    this.pagination.pageSize = data.pageSize;
    this.getCommissions();
  }

  onSearchParams(data: SearchParams) {
    this.keyword = data.keyword;
    this.selectedSearchColumn = data.selectedSearchColumn;
    this.getCommissions();
  }

  onFilter(data: CustomDropDown) {
    if (this.selectedMerchantId && this.selectedMonth) {
      this.selectedFilters = data;
      this.getCommissions();
    }
  }

  getActionConfig(commission: MerchantCommission) {
    return [
      {
        showBtn:
          this.user.permission.includes("Settle Checkout Commission Invoice") &&
          commission.status !== "Settled",
        iconClass: "icon-circle-check",
        btnText: "Settle Invoice",
        funcRef: () => this.settleUnpaidInvoice(commission.id),
      },
      {
        showBtn: true,
        iconClass: "icon-editor",
        btnText: "Download Invoice",
        funcRef: () => this.downloadInvoiceDetails(commission.id),
      },
    ];
  }

  downloadInvoiceDetails(invoiceId: number) {
    this.downloading = true;

    this.checkoutAdminService.downloadInvoice(invoiceId).pipe(take(1)).subscribe(
      (response: HttpResponse<Blob>) => {
        Swal.fire({
          type: "info",
          text: "Invoice will start downloading automatically.",
          title: "Downloading",
        });
        const filename: string = this.getFileName(response);
        let binaryData = [];
        binaryData.push(response.body);
        let downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(
          new Blob(binaryData, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;" })
        );
        downloadLink.setAttribute("download", filename);
        document.body.appendChild(downloadLink);
        downloadLink.click();
        this.downloading = false;
      },
      (err) => {
        Swal.fire({
          type: 'error',
          title: 'Something went wrong',
          text: err.error.message
        })
        this.downloading = false;
      }
    );
  }

  getFileName(response: HttpResponse<Blob>) {
    let filename: string;
    try {
      const contentDisposition: string = response?.headers.get(
        "Content-Disposition"
      );
      filename = contentDisposition
        .split(";")[1]
        .split("filename")[1]
        .split("=")[1]
        .trim();
    } catch (e) {
      filename = "Settlement_transaction.xlsx";
    }
    return filename;
  }

  onComplexFiltersChange(value: ComplexFiltersChange[]) {
    const merchant = value.find((x) => x.id === "merchant");
    const month = value.find((x) => x.id === "month");
    this.selectedMerchantId = merchant ? String(merchant.data.id) : null;
    this.selectedMonth = month ? month.data : null;

    this.getCommissions();
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
