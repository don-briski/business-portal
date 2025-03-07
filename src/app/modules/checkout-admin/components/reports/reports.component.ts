import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import { ColorThemeInterface } from "src/app/model/color-theme.interface";
import { CheckoutReportType } from "../../types/generic";
import { CheckoutAdminService } from "../../checkout-admin.service";
import { map, takeUntil } from "rxjs/operators";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
  GetDataQueryParams,
  Pagination,
  TableConfig,
  TableData,
  TableHeader,
  TablePaginationChange,
} from "src/app/modules/shared/shared.types";
import { CustomDropDown } from "src/app/model/CustomDropdown";
import { Select2SearchApi } from "src/app/library/select2wrapper/slct/select-lib-model";
import { Merchant } from "../../types/merchant";
import { removeNullUndefinedWithReduce } from "src/app/modules/shared/helpers/generic.helpers";
import {
  MerchantReport,
  MerchantReportRes,
  MerchantTransactionStage,
  SpoolMerchantReport,
} from "../../checkout-admin.types";
import * as moment from "moment";
import { saveAs } from "file-saver";
import { UserService } from "src/app/service/user.service";
import { AuthService } from "src/app/service/auth.service";
import { ReportDetailsDateFunctions } from "src/app/model/ReportDetailsDateFunctions";

@Component({
  selector: "lnd-reports",
  templateUrl: "./reports.component.html",
  styleUrls: ["./reports.component.scss"],
})
export class ReportsComponent implements OnInit, OnDestroy {
  private unsubscriber$ = new Subject<void>();
  colorTheme: ColorThemeInterface;
  showAside = false;
  reportEnum = CheckoutReportType;
  selectedReport: CheckoutReportType;
  isLoading = false;
  isDownloading = false;
  showPopup = false;
  form = new FormGroup({
    start: new FormControl("", Validators.required),
    end: new FormControl(""),
    merchantId: new FormControl(""),
  });
  merchants: CustomDropDown[] = [];
  allMerchants: CustomDropDown[] = [];
  merchantReport: MerchantReport[] = [];
  config: TableConfig = {
    striped: true,
    small: true,
    rowClickable: false,
    tdStyle: { "min-width": "140px" },
  };
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
  headers: TableHeader[] = [
    { name: "Date Created" },
    { name: "Merchant" },
    { name: "Customer Name" },
    { name: "Customer Email Address" },
    { name: "Request Amount", type: "amount" },
    { name: "Loan Amount", type: "amount" },
    { name: "Deposit Amount", type: "amount" },
    { name: "Referral Code" },
    { name: "Date Completed" },
    { name: "Verification Route", alignment: "center" },
    { name: "Risk Category" },
    { name: "Entry Medium" },
    { name: "Stage" },
    { name: "Repayment Method" },
    { name: "Commission amount", type: "amount" },
  ];
  tableData: TableData[] = [];
  spoolMerchantReportPayload: SpoolMerchantReport;
  spoolEndDate = new Date(Date.now());
  MerchantTransactionStageEnum = MerchantTransactionStage;
  permissions: string[] = [];

  constructor(
    private checkoutAdminService: CheckoutAdminService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchUser();
  }

  fetchUser() {
    this.isLoading = true;
    this.userService
      .getUserInfo(this.authService.decodeToken().nameid)
      .subscribe((res) => {
        this.permissions = res.body.permission;
        this.isLoading = false;
      });
  }

  toggleAside(reportType?: CheckoutReportType) {
    this.selectedReport = reportType;
    if (this.selectedReport === this.reportEnum.TRANSACTION) {
      this.getAllMerchants();
    }
    this.showAside = !this.showAside;
    !this.showAside && this.togglePopup(false);
  }

  togglePopup(value?: boolean) {
    if (value === false) {
      this.showPopup = value;
    } else {
      this.showPopup = !this.showPopup;
    }
  }

  getAllMerchants() {
    const payload: GetDataQueryParams = {
      pageNumber: 1,
      pageSize: 10,
    };
    this.checkoutAdminService
      .fetchMerchants(payload)
      .pipe(
        map((res) =>
          res.body.items.map((merchant) => ({
            id: merchant.id,
            text: merchant.name,
          }))
        ),
        takeUntil(this.unsubscriber$)
      )
      .subscribe((merchants) => {
        this.allMerchants = merchants;
        this.merchants = merchants;
      });
  }

  spoolMerchantTransaction($event?: TablePaginationChange) {
    this.isLoading = true;
    this.spoolMerchantReportPayload = { ...this.form.value };

    if (!this.spoolMerchantReportPayload.start) {
      const dateRange = new ReportDetailsDateFunctions();
      const monthDateRange = dateRange.getMonthRange();
      this.spoolMerchantReportPayload.start = monthDateRange[0]
        .toISOString()
        .split("T")[0];
    }

    if (this.spoolMerchantReportPayload.merchantId) {
      const merchantId: string = (
        this.spoolMerchantReportPayload
          .merchantId[0] as unknown as CustomDropDown
      )?.id as string;
      this.spoolMerchantReportPayload = {
        ...this.spoolMerchantReportPayload,
        merchantId,
      };
    }
    this.spoolMerchantReportPayload = removeNullUndefinedWithReduce(
      this.spoolMerchantReportPayload
    );
    this.spoolMerchantReportPayload = {
      ...this.spoolMerchantReportPayload,
      pageNumber: $event?.pageNumber ?? this.pagination.pageNumber,
      pageSize: $event?.pageSize ?? this.pagination.pageSize,
    };

    this.checkoutAdminService
      .spoolMerchantTransaction(this.spoolMerchantReportPayload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          this.merchantReport = res.body.items;
          this.setPagination(res.body);
          this.generateTable();
          this.togglePopup(false);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  updateDropdown(merchants: Merchant[]) {
    this.merchants = merchants.map((merchant) => ({
      id: merchant.id,
      text: merchant.name,
    }));
  }

  dropdownClosed() {
    if (this.merchants.length === 0) {
      this.merchants = [...this.allMerchants];
    }
  }

  getMerchantService(): Select2SearchApi {
    return {
      search: (name: string) =>
        this.checkoutAdminService.fetchMerchants({
          keyword: name,
          selectedSearchColumn: "name",
        }),
    };
  }

  private setPagination(res: MerchantReportRes): void {
    this.pagination = res;
    this.pagination.count = res.items.length;
    this.pagination.jumpArray = [];
    for (let i = 1; i <= res.totalPages; i++) {
      this.pagination.jumpArray.push(i);
    }
  }

  generateTable() {
    this.tableData = this.merchantReport.map((report) => ({
      createdAt: { tdValue: report?.dateStarted, type: "date" },
      name: { tdValue: report?.merchantName },
      custName: { tdValue: report?.customerName },
      custEmail: { tdValue: report?.customerEmail },
      reqAmt: { tdValue: report?.requestedAmount || '-', type: "amount" },
      loanAmt: { tdValue: report?.loanAmount, type: "amount" },
      depAmt: { tdValue: report?.depositAmount, type: "amount" },
      refCode: { tdValue: report?.referralCode },
      dateCompleted: { tdValue: report?.dateCompleted, type: "date" },
      verMtd: {
        tdValue:
          report?.verificationRoute === "Manual"
            ? "BVN"
            : report?.verificationRoute,
        alignment: "center",
      },
      riskCat: { tdValue: report?.riskCategory },
      entryMed: { tdValue: report?.recordEntryMedium },
      stage: {
        tdValue: report?.stage,
        type: "status",
        statusConfig: {
          class: this.getStatusClass(report.stage),
        },
      },
      repMtd: { tdValue: report?.repaymentMethod },
      commission: { tdValue: report?.commissionAmount, type: "amount" },
    }));
  }

  downloadReport() {
    this.isDownloading = true;
    this.checkoutAdminService
      .exportMerchantReport(this.spoolMerchantReportPayload)
      .pipe(takeUntil(this.unsubscriber$))
      .subscribe({
        next: (res) => {
          const fileName = `merchant-transactions-${moment().format(
            "YYYY-MM-DD-HH:mm:ss"
          )}`;
          saveAs(res.body, fileName);
          this.isDownloading = false;
        },
        error: () => {
          this.isDownloading = false;
        },
      });
  }

  getStatusClass(stage: string): string {
    let badge = "";
    if (
      stage === this.MerchantTransactionStageEnum.VerificationComplete || stage === this.MerchantTransactionStageEnum.LoanCreated
    ) {
      badge = "badge-success";
    }else {
      badge = "badge-secondary";
    }
  

    return badge;
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }
}
